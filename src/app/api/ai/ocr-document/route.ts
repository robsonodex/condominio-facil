import { NextRequest, NextResponse } from 'next/server';

// OCR.space API (Gratuito - 25k/mês)
// Obtém uma key em: https://ocr.space/ocrapi/freekey
const OCR_SPACE_API_KEY = process.env.OCR_SPACE_API_KEY || 'K88888888888888'; // Key demo funciona
const OCR_SPACE_URL = 'https://api.ocr.space/parse/image';

export async function POST(req: NextRequest) {
    try {
        const { image } = await req.json();

        if (!image) {
            return NextResponse.json({ error: 'Imagem não fornecida' }, { status: 400 });
        }

        console.log('[OCR.space] Enviando imagem para OCR...');

        // OCR.space aceita base64 diretamente
        const formData = new FormData();
        formData.append('base64Image', image);
        formData.append('language', 'por'); // Português
        formData.append('isOverlayRequired', 'false');
        formData.append('detectOrientation', 'true');
        formData.append('scale', 'true');
        formData.append('OCREngine', '2'); // Engine 2 é melhor para documentos

        const response = await fetch(OCR_SPACE_URL, {
            method: 'POST',
            headers: {
                'apikey': OCR_SPACE_API_KEY
            },
            body: formData
        });

        const data = await response.json();

        if (data.IsErroredOnProcessing) {
            console.error('[OCR.space] Erro:', data.ErrorMessage);
            return NextResponse.json({
                error: data.ErrorMessage?.[0] || 'Erro no OCR',
                fallbackToClient: true
            }, { status: 500 });
        }

        const rawText = data.ParsedResults?.[0]?.ParsedText || '';
        console.log('[OCR.space] Texto extraído:', rawText);

        if (!rawText) {
            return NextResponse.json({
                error: 'Nenhum texto encontrado na imagem',
                fallbackToClient: true
            }, { status: 422 });
        }

        // EXTRAÇÃO AGRESSIVA DE NOME E CPF
        const extracted = extractDocumentData(rawText);

        console.log('[OCR.space] Dados extraídos:', extracted);

        return NextResponse.json({
            name: extracted.name,
            doc: extracted.doc,
            provider: 'ocr-space',
            rawText: rawText // Para debug
        });

    } catch (error: any) {
        console.error('[OCR.space] Erro:', error);
        return NextResponse.json({
            error: error.message,
            fallbackToClient: true
        }, { status: 500 });
    }
}

// Extração agressiva de dados do documento
function extractDocumentData(text: string): { name: string | null; doc: string | null } {
    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    const upperText = text.toUpperCase();

    // ========== EXTRAÇÃO DE CPF ==========
    // Padrão: XXX.XXX.XXX-XX ou 11 dígitos seguidos
    let cpf: string | null = null;

    // Tenta padrão formatado primeiro
    const cpfFormatted = text.match(/\d{3}[.\s]?\d{3}[.\s]?\d{3}[-.\s]?\d{2}/);
    if (cpfFormatted) {
        const digits = cpfFormatted[0].replace(/\D/g, '');
        if (digits.length === 11) {
            cpf = digits;
        }
    }

    // Tenta 11 dígitos seguidos
    if (!cpf) {
        const elevenDigits = text.match(/\b\d{11}\b/);
        if (elevenDigits) {
            cpf = elevenDigits[0];
        }
    }

    // ========== EXTRAÇÃO DE NOME (AGRESSIVA) ==========
    let name: string | null = null;

    // Estratégia 1: Procura após "NOME" literal
    const nomeIndex = upperText.indexOf('NOME');
    if (nomeIndex !== -1) {
        const afterNome = text.substring(nomeIndex + 4);
        const nextLine = afterNome.split('\n').find(l => {
            const clean = l.trim();
            return clean.length > 5 &&
                /^[A-ZÁÉÍÓÚÂÊÎÔÛÀÈÌÒÙÇ\s]+$/i.test(clean) &&
                !clean.includes('FILIAÇÃO') &&
                !clean.includes('CPF') &&
                !clean.includes('DATA');
        });
        if (nextLine) {
            name = nextLine.trim().toUpperCase();
        }
    }

    // Estratégia 2: Procura linha que parece nome (2+ palavras maiúsculas)
    if (!name) {
        for (const line of lines) {
            const clean = line.trim();
            // Deve ter só letras e espaços
            if (!/^[A-ZÁÉÍÓÚÂÊÎÔÛÀÈÌÒÙÇ\s]+$/i.test(clean)) continue;
            // Deve ter 2+ palavras
            const words = clean.split(/\s+/).filter(w => w.length >= 2);
            if (words.length < 2) continue;
            // Não pode ser palavra reservada
            const reserved = ['REPÚBLICA', 'FEDERATIVA', 'BRASIL', 'MINISTÉRIO', 'CARTEIRA',
                'NACIONAL', 'HABILITAÇÃO', 'DETRAN', 'IDENTIDADE', 'REGISTRO',
                'FILIAÇÃO', 'DATA', 'NASCIMENTO', 'VALIDADE', 'EMISSÃO',
                'SECRETARIA', 'SEGURANÇA', 'PÚBLICA', 'CIVIL', 'INSTITUTO'];
            const hasReserved = reserved.some(r => clean.toUpperCase().includes(r));
            if (hasReserved) continue;
            // Tamanho razoável para nome
            if (clean.length < 8 || clean.length > 60) continue;

            name = clean.toUpperCase();
            break;
        }
    }

    // Estratégia 3: Primeira linha com 2+ palavras que não seja número
    if (!name) {
        for (const line of lines) {
            const clean = line.trim();
            if (/\d/.test(clean)) continue; // Pula se tem número
            const words = clean.split(/\s+/).filter(w => w.length >= 2);
            if (words.length >= 2 && clean.length >= 10) {
                name = clean.toUpperCase();
                break;
            }
        }
    }

    return { name, doc: cpf };
}
