import { NextRequest, NextResponse } from 'next/server';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = 'gemini-1.5-flash';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

export async function POST(req: NextRequest) {
    try {
        if (!GEMINI_API_KEY) {
            return NextResponse.json({ error: 'GEMINI_API_KEY não configurada' }, { status: 500 });
        }

        const { image } = await req.json();

        if (!image) {
            return NextResponse.json({ error: 'Imagem não fornecida' }, { status: 400 });
        }

        // Extrai o base64 e o mime type da imagem
        // Formato esperado: "data:image/jpeg;base64,/9j/4AAQ..."
        let base64Data = image;
        let mimeType = 'image/jpeg';

        if (image.startsWith('data:')) {
            const matches = image.match(/^data:([^;]+);base64,(.+)$/);
            if (matches) {
                mimeType = matches[1];
                base64Data = matches[2];
            }
        }

        const response = await fetch(`${GEMINI_URL}?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [
                    {
                        parts: [
                            {
                                text: `Você é um assistente de OCR especializado em ler documentos brasileiros (RG, CNH, CPF).
Analise a imagem e extraia APENAS:
1. O nome completo da pessoa
2. O número do documento principal (CPF, RG ou CNH)

Responda APENAS com JSON válido no formato:
{"name": "NOME COMPLETO", "doc": "000.000.000-00"}

Se não conseguir ler algum campo, retorne null para ele.
NÃO inclua explicações, markdown ou texto adicional. APENAS o JSON.`
                            },
                            {
                                inline_data: {
                                    mime_type: mimeType,
                                    data: base64Data
                                }
                            }
                        ]
                    }
                ],
                generationConfig: {
                    temperature: 0.1,
                    maxOutputTokens: 200,
                }
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('[OCR Gemini] Erro na API:', errorText);
            return NextResponse.json({ error: 'Erro ao processar documento' }, { status: 500 });
        }

        const data = await response.json();
        const content = data?.candidates?.[0]?.content?.parts?.[0]?.text || '{}';

        // Parse do JSON retornado pela IA
        let parsed;
        try {
            // Remove possíveis blocos de código markdown
            const cleanContent = content
                .replace(/```json\n?|\n?```/g, '')
                .replace(/```\n?|\n?```/g, '')
                .trim();
            parsed = JSON.parse(cleanContent);
        } catch {
            console.error('[OCR Gemini] Erro ao parsear resposta:', content);
            parsed = { name: null, doc: null };
        }

        return NextResponse.json({
            name: parsed.name || null,
            doc: parsed.doc || null,
        });

    } catch (error) {
        console.error('[OCR Gemini] Erro:', error);
        return NextResponse.json({ error: 'Erro ao processar documento' }, { status: 500 });
    }
}
