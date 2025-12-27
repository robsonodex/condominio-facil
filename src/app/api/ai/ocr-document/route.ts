import { NextRequest, NextResponse } from 'next/server';
import Tesseract from 'tesseract.js';

// Regex patterns para documentos brasileiros
const CPF_REGEX = /(\d{3}[.\s]?\d{3}[.\s]?\d{3}[-.\s]?\d{2})/g;
const RG_REGEX = /(\d{1,2}[.\s]?\d{3}[.\s]?\d{3}[-.\s]?[\dXx]?)/g;
const CNH_REGEX = /(\d{9,11})/g;

// Função para extrair CPF do texto
function extractCPF(text: string): string | null {
    const matches = text.match(CPF_REGEX);
    if (matches && matches.length > 0) {
        // Normaliza o CPF
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

// Função para extrair nome do texto (geralmente em maiúsculas após "NOME" ou no início)
function extractName(text: string): string | null {
    // Tenta encontrar nome após labels comuns
    const namePatterns = [
        /NOME[:\s]+([A-ZÁÉÍÓÚÂÊÎÔÛÀÈÌÒÙÄËÏÖÜÇ\s]+)/i,
        /NOME\s*:\s*([A-ZÁÉÍÓÚÂÊÎÔÛÀÈÌÒÙÄËÏÖÜÇ][A-ZÁÉÍÓÚÂÊÎÔÛÀÈÌÒÙÄËÏÖÜÇa-záéíóúâêîôûàèìòùäëïöüç\s]+)/i,
        /FILIAÇÃO[:\s]+([A-ZÁÉÍÓÚÂÊÎÔÛÀÈÌÒÙÄËÏÖÜÇ\s]+)/i,
    ];

    for (const pattern of namePatterns) {
        const match = text.match(pattern);
        if (match && match[1]) {
            const name = match[1].trim();
            // Valida que parece um nome (pelo menos 2 palavras, mínimo 5 caracteres)
            if (name.length >= 5 && name.includes(' ')) {
                return name.split('\n')[0].trim(); // Pega só a primeira linha
            }
        }
    }

    // Fallback: procura linhas em maiúsculas que parecem nomes
    const lines = text.split('\n');
    for (const line of lines) {
        const cleanLine = line.trim();
        // Se a linha está toda em maiúsculas, tem espaços e parece um nome
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
            !cleanLine.includes('IDENTIDADE') &&
            !cleanLine.includes('CARTEIRA')
        ) {
            return cleanLine;
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

        console.log('[OCR Tesseract] Iniciando reconhecimento...');

        // OCR com Tesseract.js (100% gratuito, roda no servidor)
        const result = await Tesseract.recognize(
            image,
            'por', // Português
            {
                logger: (m) => {
                    if (m.status === 'recognizing text') {
                        console.log(`[OCR] Progresso: ${Math.round(m.progress * 100)}%`);
                    }
                }
            }
        );

        const text = result.data.text;
        console.log('[OCR Tesseract] Texto extraído:', text.substring(0, 200) + '...');

        // Extrair dados estruturados
        const name = extractName(text);
        const cpf = extractCPF(text);
        const rg = extractRG(text);

        // Usa CPF se encontrou, senão RG
        const doc = cpf || rg;

        console.log('[OCR Tesseract] Dados extraídos:', { name, doc });

        return NextResponse.json({
            name: name || null,
            doc: doc || null,
            rawText: text.substring(0, 500), // Para debug
        });

    } catch (error: any) {
        console.error('[OCR Tesseract] Erro:', error);
        return NextResponse.json({
            error: 'Erro ao processar documento',
            details: error.message
        }, { status: 500 });
    }
}
