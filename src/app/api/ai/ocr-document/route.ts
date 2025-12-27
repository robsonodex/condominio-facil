import { NextRequest, NextResponse } from 'next/server';

const OCR_SPACE_API_KEY = process.env.OCR_SPACE_API_KEY;
const OCR_SPACE_ENDPOINT = 'https://api.ocr.space/parse/image';

// Pattern para extrair JSON limpo caso a IA retorne markdown
function cleanResponse(text: string) {
    return text.replace(/```json/g, '').replace(/```/g, '').trim();
}

// Regex patterns (mantidos para extração no backend se necessário, mas o foco é retornar texto)
const CPF_REGEX = /(\d{3}[.\s]?\d{3}[.\s]?\d{3}[-.\s]?\d{2})/g;
const RG_REGEX = /(\d{1,2}[.\s]?\d{3}[.\s]?\d{3}[-.\s]?[\dXx]?)/g;

function extractCPF(text: string): string | null {
    text = text.replace(/[^\d]/g, ''); // Remove tudo que não é dígito
    const match = text.match(/(\d{11})/);
    if (match) {
        return match[1].replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    }
    return null;
}

function extractName(text: string): string | null {
    // Tenta encontrar padrões comuns de nome
    const namePatterns = [
        /NOME[:\s]+([A-ZÁÉÍÓÚÂÊÎÔÛÀÈÌÒÙÄËÏÖÜÇ\s]+)/i,
        /NOME\s*[:\.]\s*([A-ZÁÉÍÓÚÂÊÎÔÛÀÈÌÒÙÄËÏÖÜÇ\s]+)/i
    ];

    for (const pattern of namePatterns) {
        const match = text.match(pattern);
        if (match && match[1]) {
            const potentialName = match[1].split('\n')[0].trim();
            if (potentialName.length > 3) return potentialName.toUpperCase();
        }
    }
    return null;
}

export async function POST(req: NextRequest) {
    try {
        const { image } = await req.json();

        if (!image) {
            return NextResponse.json({ error: 'Imagem não fornecida' }, { status: 400 });
        }

        if (!OCR_SPACE_API_KEY) {
            return NextResponse.json({
                error: 'OCR_SPACE_API_KEY não configurada',
                fallbackToClient: true
            }, { status: 500 });
        }

        console.log('[OCR.space] Iniciando processamento...');

        const formData = new FormData();
        formData.append('base64Image', image);
        formData.append('language', 'por');
        formData.append('isOverlayRequired', 'false');
        formData.append('detectOrientation', 'true');
        formData.append('scale', 'true');
        formData.append('OCREngine', '2'); // Engine 2 é melhor para números e caracteres especiais

        const response = await fetch(OCR_SPACE_ENDPOINT, {
            method: 'POST',
            headers: {
                'apikey': OCR_SPACE_API_KEY,
            },
            body: formData,
        });

        if (!response.ok) {
            console.error('[OCR.space] Erro API:', response.status);
            return NextResponse.json({
                error: 'Erro na API OCR.space',
                fallbackToClient: true
            }, { status: 502 });
        }

        const data = await response.json();

        if (data.IsErroredOnProcessing) {
            console.error('[OCR.space] Erro processamento:', data.ErrorMessage);
            return NextResponse.json({
                error: data.ErrorMessage || 'Erro no processamento da imagem',
                fallbackToClient: true
            }, { status: 422 });
        }

        if (!data.ParsedResults || data.ParsedResults.length === 0) {
            return NextResponse.json({
                error: 'Nenhum texto encontrado',
                fallbackToClient: true
            }, { status: 404 });
        }

        const text = data.ParsedResults[0].ParsedText;
        console.log('[OCR.space] Texto extraído:', text.substring(0, 100));

        // Tenta extrair dados básicos no servidor
        const possibleName = extractName(text);
        const possibleCpf = extractCPF(text);

        return NextResponse.json({
            name: possibleName,
            doc: possibleCpf,
            rawText: text, // Envia texto bruto para o frontend processar melhor
            provider: 'ocr.space'
        });

    } catch (error: any) {
        console.error('[OCR.space] Erro crítico:', error);
        return NextResponse.json({
            error: error.message,
            fallbackToClient: true
        }, { status: 500 });
    }
}
