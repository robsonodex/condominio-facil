import { NextRequest, NextResponse } from 'next/server';

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL = 'llama-3.2-11b-vision-preview';

// Função para limpar JSON retornado pela IA
function cleanJsonResponse(text: string) {
    // Remove blocos de código markdown se existirem
    const match = text.match(/```json\n([\s\S]*?)\n```/);
    if (match) return match[1];
    return text.replace(/```json/g, '').replace(/```/g, '');
}

export async function POST(req: NextRequest) {
    try {
        const { image } = await req.json();

        if (!image) {
            return NextResponse.json({ error: 'Imagem não fornecida' }, { status: 400 });
        }

        if (!GROQ_API_KEY) {
            return NextResponse.json({
                error: 'GROQ_API_KEY não configurada',
                fallbackToClient: true
            }, { status: 500 });
        }

        console.log('[Groq AI] Iniciando análise com Llama 3 Vision...');

        // Certifica que a imagem tem o prefixo correto para a API
        // A imagem já deve vir como data URI do frontend, mas garantimos aqui
        const imageUrl = image.startsWith('data:') ? image : `data:image/jpeg;base64,${image}`;

        const payload = {
            model: MODEL,
            messages: [
                {
                    role: "user",
                    content: [
                        {
                            type: "text",
                            text: `Você é uma API de OCR especializada em documentos brasileiros (CNH, RG e CPF).
                            
Sua tarefa é extrair APENAS o NOME COMPLETO e o NÚMERO DO DOCUMENTO da imagem.

REGRAS RÍGIDAS:
1. Retorne APENAS um JSON válido. NÃO escreva nada além do JSON.
2. Formato do JSON: {"name": "NOME COMPLETO", "doc": "NUMERO"}
3. Para o campo 'doc', extraia CPF (11 dígitos) OU RG (9 dígitos) OU CNH (11 dígitos). Preferência para CPF se houver.
4. Se o documento estiver deitado/rotacionado, leia corretamente.
5. Se não conseguir ler, retorne null.

EXEMPLOS DE ONDE PROCURAR:
- CNH: O nome geralmente está abaixo de 'NOME'. O CPF fica ao lado de 'CPF'.
- RG: O nome está na parte superior ou central. O número do RG está no topo.
- CPF (Cartão): O número está em destaque no centro ou topo.

Retorne SOMENTE o JSON.`
                        },
                        {
                            type: "image_url",
                            image_url: {
                                url: imageUrl
                            }
                        }
                    ]
                }
            ],
            temperature: 0, // Zero para máxima precisão e determinismo
            max_tokens: 300,
            response_format: { type: "json_object" } // Llama 3 suporta JSON mode
        };

        const response = await fetch(GROQ_API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${GROQ_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('[Groq AI] Erro API:', response.status, errorText);

            // Rate limit ou Overloaded
            if (response.status === 429 || response.status === 503) {
                return NextResponse.json({
                    error: 'Serviço ocupado, usando fallback local',
                    fallbackToClient: true
                }, { status: response.status });
            }

            return NextResponse.json({
                error: 'Erro na API Groq',
                fallbackToClient: true
            }, { status: 500 });
        }

        const data = await response.json();
        const content = data.choices[0]?.message?.content;

        console.log('[Groq AI] Resposta:', content);

        if (!content) {
            throw new Error('Sem resposta da IA');
        }

        // Parse do JSON
        let result;
        try {
            result = JSON.parse(cleanJsonResponse(content));
        } catch (e) {
            console.error('[Groq AI] Erro ao parsear JSON:', e);
            // Tenta extrair manualmente se o JSON falhar
            // (Llama costuma ser bom em JSON, mas fallback é bom)
            return NextResponse.json({
                error: 'Erro formato JSON',
                rawText: content,
                fallbackToClient: true
            }, { status: 422 });
        }

        return NextResponse.json({
            name: result.name || null,
            doc: result.doc || null,
            provider: 'groq-llama3'
        });

    } catch (error: any) {
        console.error('[Groq AI] Erro crítico:', error);
        return NextResponse.json({
            error: error.message,
            fallbackToClient: true
        }, { status: 500 });
    }
}
