import { NextRequest, NextResponse } from 'next/server';
import Tesseract from 'tesseract.js';

const HUGGINGFACE_API_KEY = process.env.HUGGINGFACE_API_KEY;
const HF_OCR_MODEL = 'https://api-inference.huggingface.co/models/microsoft/trocr-base-printed';

// Regex patterns para documentos brasileiros
const CPF_REGEX = /(\d{3}[.\s]?\d{3}[.\s]?\d{3}[-.\s]?\d{2})/g;
const RG_REGEX = /(\d{1,2}[.\s]?\d{3}[.\s]?\d{3}[-.\s]?[\dXx]?)/g;

// Função para extrair CPF do texto
function extractCPF(text: string): string | null {
    const matches = text.match(CPF_REGEX);
    if (matches && matches.length > 0) {
        return matches[0].replace(/[.\s-]/g, '').replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    }
    return null;
}

// Função para extrair RG do texto
function extractRG(text: string): string | null {
    const matches = text.match(RG_REGEX);
    if (matches && matches.length > 0) {
        return matches[0].replace(/[.\s-]/g, '');
    }
    return null;
}

// Função para extrair nome do texto
function extractName(text: string): string | null {
    const namePatterns = [
        /NOME[:\s]+([A-ZÁÉÍÓÚÂÊÎÔÛÀÈÌÒÙÄËÏÖÜÇ\s]+)/i,
        /NOME\s*:\s*([A-ZÁÉÍÓÚÂÊÎÔÛÀÈÌÒÙÄËÏÖÜÇ][A-ZÁÉÍÓÚÂÊÎÔÛÀÈÌÒÙÄËÏÖÜÇa-záéíóúâêîôûàèìòùäëïöüç\s]+)/i,
    ];

    for (const pattern of namePatterns) {
        const match = text.match(pattern);
        if (match && match[1]) {
            const name = match[1].trim();
            if (name.length >= 5 && name.includes(' ')) {
                return name.split('\n')[0].trim();
            }
        }
    }

    // Fallback: procura linhas em maiúsculas que parecem nomes
    const lines = text.split('\n');
    for (const line of lines) {
        const cleanLine = line.trim();
        if (
            cleanLine.length >= 8 &&
            cleanLine.length <= 60 &&
            cleanLine === cleanLine.toUpperCase() &&
            cleanLine.includes(' ') &&
            /^[A-ZÁÉÍÓÚÂÊÎÔÛÀÈÌÒÙÄËÏÖÜÇ\s]+$/.test(cleanLine) &&
            !cleanLine.includes('REPÚBLICA') &&
            !cleanLine.includes('FEDERATIVA') &&
            !cleanLine.includes('BRASIL') &&
            !cleanLine.includes('REGISTRO') &&
            !cleanLine.includes('IDENTIDADE')
        ) {
            return cleanLine;
        }
    }

    return null;
}

// OCR com Hugging Face (primário)
async function ocrWithHuggingFace(imageBase64: string): Promise<string> {
    if (!HUGGINGFACE_API_KEY) {
        throw new Error('HUGGINGFACE_API_KEY não configurada');
    }

    // Remove o prefixo data:image/xxx;base64, se existir
    const base64Data = imageBase64.replace(/^data:image\/[a-z]+;base64,/, '');
    const imageBuffer = Buffer.from(base64Data, 'base64');

    const response = await fetch(HF_OCR_MODEL, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${HUGGINGFACE_API_KEY}`,
            'Content-Type': 'application/octet-stream',
        },
        body: imageBuffer,
    });

    if (!response.ok) {
        const error = await response.text();
        console.error('[HuggingFace] Erro:', response.status, error);
        throw new Error(`HuggingFace API error: ${response.status}`);
    }

    const result = await response.json();

    // TrOCR retorna array de textos
    if (Array.isArray(result)) {
        return result.map((r: any) => r.generated_text || '').join(' ');
    }

    return result.generated_text || result.text || '';
}

// OCR com Tesseract (fallback)
async function ocrWithTesseract(imageData: string): Promise<string> {
    console.log('[Tesseract] Usando fallback...');
    const result = await Tesseract.recognize(imageData, 'por');
    return result.data.text;
}

export async function POST(req: NextRequest) {
    try {
        const { image } = await req.json();

        if (!image) {
            return NextResponse.json({ error: 'Imagem não fornecida' }, { status: 400 });
        }

        let text = '';
        let provider = 'unknown';

        // Tenta Hugging Face primeiro, se falhar usa Tesseract
        try {
            if (HUGGINGFACE_API_KEY) {
                console.log('[OCR] Tentando Hugging Face...');
                text = await ocrWithHuggingFace(image);
                provider = 'huggingface';
                console.log('[OCR HuggingFace] Texto:', text.substring(0, 100));
            } else {
                throw new Error('API key não configurada');
            }
        } catch (hfError: any) {
            console.log('[OCR] Hugging Face falhou, usando Tesseract...', hfError.message);
            text = await ocrWithTesseract(image);
            provider = 'tesseract';
            console.log('[OCR Tesseract] Texto:', text.substring(0, 100));
        }

        // Extrair dados estruturados
        const name = extractName(text);
        const cpf = extractCPF(text);
        const rg = extractRG(text);
        const doc = cpf || rg;

        console.log('[OCR] Resultado:', { name, doc, provider });

        return NextResponse.json({
            name: name || null,
            doc: doc || null,
            provider,
        });

    } catch (error: any) {
        console.error('[OCR] Erro:', error);
        return NextResponse.json({
            error: 'Erro ao processar documento',
            details: error.message
        }, { status: 500 });
    }
}
