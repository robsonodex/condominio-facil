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
    // PRIORIDADE: formato XXX.XXX.XXX-XX (isso é CPF, não RG)
    let cpf: string | null = null;

    // PRIMEIRO: Procura CPF no formato correto com pontos e traço
    const cpfWithDots = text.match(/\d{3}\.\d{3}\.\d{3}-\d{2}/);
    if (cpfWithDots) {
        cpf = cpfWithDots[0].replace(/\D/g, '');
    }

    // SEGUNDO: Procura após label "CPF" especificamente
    if (!cpf) {
        const cpfLabelMatch = text.match(/CPF[:\s]*(\d{3}[.\s]?\d{3}[.\s]?\d{3}[-.\s]?\d{2})/i);
        if (cpfLabelMatch) {
            const digits = cpfLabelMatch[1].replace(/\D/g, '');
            if (digits.length === 11) {
                cpf = digits;
            }
        }
    }

    // ========== EXTRAÇÃO DE NOME (AGRESSIVA) ==========
    let name: string | null = null;

    // Palavras que NÃO fazem parte de um nome
    const notNameWords = [
        'REPÚBLICA', 'REPUBLICA', 'FEDERATIVA', 'BRASIL', 'BRASE', 'BRASI',
        'MINISTÉRIO', 'MINISTERIO', 'DEPARTAMENTO', 'NACIONAL', 'CARTEIRA',
        'HABILITAÇÃO', 'HABILITACAO', 'TRÂNSITO', 'TRANSITO', 'INFRAESTRUTURA',
        'VÁLIDA', 'VALIDA', 'TERRITÓRIO', 'TERRITORIO', 'TODO',
        'DETRAN', 'IDENTIDADE', 'REGISTRO', 'SSP', 'EMISSOR',
        'FILIAÇÃO', 'FILIACAO', 'DATA', 'NASCIMENTO', 'VALIDADE', 'EMISSÃO',
        'PERMISSÃO', 'CATEGORIA', 'OBSERVAÇÕES', 'HABILITAÇÃO'
    ];

    // Função para validar se parece nome de pessoa
    const isValidName = (text: string): boolean => {
        const clean = text.trim().toUpperCase();
        // Verifica se contém palavras proibidas
        if (notNameWords.some(w => clean.includes(w))) return false;
        // Deve ter só letras e espaços
        if (!/^[A-ZÁÉÍÓÚÂÊÎÔÛÀÈÌÒÙÇ\s]+$/i.test(clean)) return false;
        // Deve ter pelo menos 3 palavras (nome sobrenome sobrenome)
        const words = clean.split(/\s+/).filter(w => w.length >= 2);
        if (words.length < 3) return false;
        // Tamanho razoável
        if (clean.length < 15 || clean.length > 60) return false;
        return true;
    };

    // Estratégia 1: Procura linha IMEDIATAMENTE após "NOME" (não FILIAÇÃO)
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].toUpperCase();
        // Procura linha que contém apenas "NOME" (não FILIAÇÃO)
        if (line.includes('NOME') && !line.includes('FILIAÇÃO') && !line.includes('FILIACAO')) {
            // Próxima linha pode ser o nome
            for (let j = i + 1; j < Math.min(i + 3, lines.length); j++) {
                const candidate = lines[j].trim();
                if (isValidName(candidate)) {
                    name = candidate.toUpperCase();
                    break;
                }
            }
            if (name) break;
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
                'SECRETARIA', 'SEGURANÇA', 'PÚBLICA', 'CIVIL', 'INSTITUTO',
                'VÁLIDA', 'VALIDA', 'TERRITÓRIO', 'TERRITORIO', 'TODO',
                'PERMISSÃO', 'CATEGORIA', 'OBSERVAÇÕES', 'INFRAESTRUTURA', 'DEPARTAMENTO', 'TRÂNSITO'];
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
