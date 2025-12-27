import { NextRequest, NextResponse } from 'next/server';
import Tesseract from 'tesseract.js';

const HUGGINGFACE_API_KEY = process.env.HUGGINGFACE_API_KEY;
// Usando modelo de OCR para documentos
const HF_OCR_MODEL = 'https://api-inference.huggingface.co/models/microsoft/trocr-large-printed';

// Regex patterns para documentos brasileiros
const CPF_REGEX = /(\d{3}[.\s]?\d{3}[.\s]?\d{3}[-.\s]?\d{2})/g;
const RG_REGEX = /(\d{1,2}[.\s]?\d{3}[.\s]?\d{3}[-.\s]?[\dXx]?)/g;

function extractCPF(text: string): string | null {
    const matches = text.match(CPF_REGEX);
    if (matches && matches.length > 0) {
        return matches[0].replace(/[.\s-]/g, '').replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    }
    return null;
}

function extractRG(text: string): string | null {
    const matches = text.match(RG_REGEX);
    if (matches && matches.length > 0) {
        return matches[0].replace(/[.\s-]/g, '');
    }
    return null;
}

function extractName(text: string): string | null {
    const namePatterns = [
        /NOME[:\s]+([A-ZÁÉÍÓÚÂÊÎÔÛÀÈÌÒÙÄËÏÖÜÇ\s]+)/i,
        /NOME\s*:\s*([A-ZÁÉÍÓÚÂÊÎÔÛÀÈÌÒÙÄËÏÖÜÇ][A-Za-záéíóúâêîôûàèìòùäëïöüç\s]+)/i,
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
            !cleanLine.includes('BRASIL') &&
            !cleanLine.includes('REGISTRO')
        ) {
            return cleanLine;
        }
    }

    return null;
}

// OCR direto com Tesseract (mais rápido para documentos completos)
async function ocrWithTesseract(imageData: string): Promise<string> {
    const result = await Tesseract.recognize(imageData, 'por', {
        logger: () => { } // Desabilita logs para performance
    });
    return result.data.text;
}

export async function POST(req: NextRequest) {
    try {
        const { image } = await req.json();

        if (!image) {
            return NextResponse.json({ error: 'Imagem não fornecida' }, { status: 400 });
        }

        console.log('[OCR] Iniciando processamento...');
        const startTime = Date.now();

        // Usa Tesseract diretamente (mais confiável para documentos brasileiros)
        const text = await ocrWithTesseract(image);

        const elapsed = Date.now() - startTime;
        console.log(`[OCR] Concluído em ${elapsed}ms`);
        console.log('[OCR] Texto:', text.substring(0, 150));

        // Extrair dados estruturados
        const name = extractName(text);
        const cpf = extractCPF(text);
        const rg = extractRG(text);
        const doc = cpf || rg;

        console.log('[OCR] Resultado:', { name, doc });

        // Se não encontrou nada, retorna aviso
        if (!name && !doc) {
            return NextResponse.json({
                name: null,
                doc: null,
                message: 'Não foi possível identificar dados. Tente uma foto mais clara.',
                elapsed,
            });
        }

        return NextResponse.json({
            name: name || null,
            doc: doc || null,
            elapsed,
        });

    } catch (error: any) {
        console.error('[OCR] Erro:', error);
        return NextResponse.json({
            error: 'Erro ao processar documento',
            details: error.message
        }, { status: 500 });
    }
}
