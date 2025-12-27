import { NextRequest, NextResponse } from 'next/server';

// OCR.space API (Gratuito - 25k/mês)
const OCR_SPACE_API_KEY = process.env.OCR_SPACE_API_KEY || 'K88888888888888';
const OCR_SPACE_URL = 'https://api.ocr.space/parse/image';

export async function POST(req: NextRequest) {
    try {
        const { image } = await req.json();

        if (!image) {
            return NextResponse.json({ error: 'Imagem não fornecida' }, { status: 400 });
        }

        console.log('[OCR.space] Enviando imagem para OCR...');

        const formData = new FormData();
        formData.append('base64Image', image);
        formData.append('language', 'por');
        formData.append('isOverlayRequired', 'false');
        formData.append('detectOrientation', 'true');
        formData.append('scale', 'true');
        formData.append('OCREngine', '1'); // Engine 1 pode ter melhor precisão de caracteres

        const response = await fetch(OCR_SPACE_URL, {
            method: 'POST',
            headers: { 'apikey': OCR_SPACE_API_KEY },
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
                error: 'Nenhum texto encontrado',
                fallbackToClient: true
            }, { status: 422 });
        }

        const extracted = extractDocumentData(rawText);
        console.log('[OCR.space] Dados extraídos:', extracted);

        return NextResponse.json({
            name: extracted.name,
            doc: extracted.doc,
            provider: 'ocr-space',
            rawText: rawText
        });

    } catch (error: any) {
        console.error('[OCR.space] Erro:', error);
        return NextResponse.json({
            error: error.message,
            fallbackToClient: true
        }, { status: 500 });
    }
}

function extractDocumentData(text: string): { name: string | null; doc: string | null } {
    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);

    // ========== EXTRAÇÃO DE CPF ==========
    let cpf: string | null = null;

    // Prioriza formato XXX.XXX.XXX-XX
    const cpfWithDots = text.match(/\d{3}\.\d{3}\.\d{3}-\d{2}/);
    if (cpfWithDots) {
        cpf = cpfWithDots[0].replace(/\D/g, '');
    }

    // Fallback: após label "CPF"
    if (!cpf) {
        const cpfLabel = text.match(/CPF[:\s]*(\d{3}[.\s]?\d{3}[.\s]?\d{3}[-.\s]?\d{2})/i);
        if (cpfLabel) {
            const digits = cpfLabel[1].replace(/\D/g, '');
            if (digits.length === 11) cpf = digits;
        }
    }

    // ========== EXTRAÇÃO DE NOME ==========
    let name: string | null = null;

    // Prefixos governamentais (rejeita variações de OCR)
    const govPrefixes = ['REPUB', 'FEDER', 'TEDER', 'MINIS', 'DEPAR', 'CARTE', 'SECRE', 'INSTI'];

    // Fragmentos de documento (não é nome)
    const badFragments = ['BRASIL', 'BRASI', 'BRASE', 'NACIO', 'HABIT', 'VALID', 'TERRIT',
        'TODO', 'DETRAN', 'SSP', 'EMISS', 'REGIST', 'PERMIS', 'CATEG', 'FILIA', 'NASCIM',
        'INFRAE', 'TRANSI', 'OBSERV'];

    const isValidName = (candidate: string): boolean => {
        const clean = candidate.trim().toUpperCase();

        // Rejeita se começa com prefixo governamental
        if (govPrefixes.some(p => clean.startsWith(p))) return false;

        // Rejeita se contém fragmentos proibidos
        if (badFragments.some(f => clean.includes(f))) return false;

        // Deve ter só letras e espaços
        if (!/^[A-ZÁÉÍÓÚÂÊÎÔÛÀÈÌÒÙÇ\s]+$/i.test(clean)) return false;

        // Mínimo 3 palavras
        const words = clean.split(/\s+/).filter(w => w.length >= 2);
        if (words.length < 3) return false;

        // Tamanho razoável
        if (clean.length < 15 || clean.length > 60) return false;

        return true;
    };

    // Estratégia 1: Procura após label "NOME" (não FILIAÇÃO)
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].toUpperCase();
        if (line.includes('NOME') && !line.includes('FILIA')) {
            for (let j = i + 1; j < Math.min(i + 3, lines.length); j++) {
                if (isValidName(lines[j])) {
                    name = lines[j].trim().toUpperCase();
                    break;
                }
            }
            if (name) break;
        }
    }

    // Estratégia 2: Primeira linha válida
    if (!name) {
        for (const line of lines) {
            if (isValidName(line)) {
                name = line.trim().toUpperCase();
                break;
            }
        }
    }

    return { name, doc: cpf };
}
