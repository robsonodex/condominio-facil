import { NextRequest, NextResponse } from 'next/server';

// Configurações APIs
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OCR_SPACE_API_KEY = process.env.OCR_SPACE_API_KEY || 'K88888888888888';

export async function POST(req: NextRequest) {
    try {
        const { image } = await req.json();

        if (!image) {
            return NextResponse.json({ error: 'Imagem não fornecida' }, { status: 400 });
        }

        // Tentar primeiro com OpenRouter (NVidia/Llama 3.2 Vision)
        if (OPENROUTER_API_KEY) {
            console.log('[OCR.OpenRouter] Iniciando extração com Llama 3.2 Vision...');
            try {
                const result = await ocrWithOpenRouter(image);
                if (result) {
                    return NextResponse.json({
                        ...result,
                        provider: 'openrouter-nvidia'
                    });
                }
            } catch (err) {
                console.error('[OCR.OpenRouter] Erro:', err);
                // Fallback para OCR.space se o OpenRouter falhar
            }
        }

        // Fallback para OCR.space (Gratuito - 25k/mês)
        console.log('[OCR.space] Usando fallback OCR.space...');
        const formData = new FormData();
        formData.append('base64Image', image);
        formData.append('language', 'por');
        formData.append('isOverlayRequired', 'false');
        formData.append('detectOrientation', 'true');
        formData.append('scale', 'true');
        formData.append('OCREngine', '2');

        const response = await fetch('https://api.ocr.space/parse/image', {
            method: 'POST',
            headers: { 'apikey': OCR_SPACE_API_KEY },
            body: formData
        });

        const data = await response.json();

        if (data.IsErroredOnProcessing) {
            throw new Error(data.ErrorMessage?.[0] || 'Erro no OCR.space');
        }

        const rawText = data.ParsedResults?.[0]?.ParsedText || '';
        const extracted = extractDocumentData(rawText);

        return NextResponse.json({
            name: extracted.name,
            doc: extracted.doc,
            provider: 'ocr-space',
            rawText: rawText
        });

    } catch (error: any) {
        console.error('[OCR] Erro Geral:', error);
        return NextResponse.json({
            error: error.message,
            fallbackToClient: true
        }, { status: 500 });
    }
}

async function ocrWithOpenRouter(base64Image: string) {
    // Garante que o base64 está limpo (sem prefixo data:image/...)
    const base64Data = base64Image.includes('base64,')
        ? base64Image.split('base64,')[1]
        : base64Image;

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
            "HTTP-Referer": "https://meucondominiofacil.com",
            "X-Title": "Meu Condominio Facil",
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            "model": "meta-llama/llama-3.2-11b-vision-instruct",
            "messages": [
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "text",
                            "text": "Identify the full name and document number (CPF or RG) in this identification document (CNH, RG, or ID). Return ONLY a JSON object with the keys 'name' and 'doc'. If not found, return null for the value. Example: {\"name\": \"FULANO DE TAL\", \"doc\": \"123.456.789-00\"}"
                        },
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": `data:image/jpeg;base64,${base64Data}`
                            }
                        }
                    ]
                }
            ],
            "response_format": { "type": "json_object" }
        })
    });

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (content) {
        try {
            return JSON.parse(content);
        } catch (e) {
            console.error('[OCR.OpenRouter] Erro ao parsear JSON:', content);
            return null;
        }
    }
    return null;
}

function extractDocumentData(text: string): { name: string | null; doc: string | null } {
    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    let cpf: string | null = null;
    const cpfWithDots = text.match(/\d{3}\.\d{3}\.\d{3}-\d{2}/);
    if (cpfWithDots) cpf = cpfWithDots[0].replace(/\D/g, '');

    if (!cpf) {
        const cpfLabel = text.match(/CPF[:\s]*(\d{3}[.\s]?\d{3}[.\s]?\d{3}[-.\s]?\d{2})/i);
        if (cpfLabel) cpf = cpfLabel[1].replace(/\D/g, '');
    }

    let name: string | null = null;
    const govPrefixes = ['REPUB', 'FEDER', 'TEDER', 'MINIS', 'DEPAR', 'CARTE', 'SECRE', 'INSTI'];
    const badFragments = ['BRASIL', 'BRASI', 'BRASE', 'NACIO', 'HABIT', 'VALID', 'TERRIT', 'TODO', 'DETRAN', 'SSP', 'EMISS', 'REGIST', 'PERMIS', 'CATEG', 'FILIA', 'NASCIM', 'INFRAE', 'TRANSI', 'OBSERV'];

    const isValidName = (candidate: string): boolean => {
        const clean = candidate.trim().toUpperCase();
        if (govPrefixes.some(p => clean.startsWith(p))) return false;
        if (badFragments.some(f => clean.includes(f))) return false;
        if (!/^[A-ZÁÉÍÓÚÂÊÎÔÛÀÈÌÒÙÇ\s]+$/i.test(clean)) return false;
        const words = clean.split(/\s+/).filter(w => w.length >= 2);
        if (words.length < 3) return false;
        if (clean.length < 15 || clean.length > 60) return false;
        return true;
    };

    for (const line of lines) {
        if (isValidName(line)) {
            name = line.trim().toUpperCase();
            break;
        }
    }

    return { name, doc: cpf };
}
