import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

export async function POST(req: NextRequest) {
    try {
        const { image } = await req.json();

        if (!image) {
            return NextResponse.json({ error: 'Imagem não fornecida' }, { status: 400 });
        }

        if (!process.env.OPENAI_API_KEY) {
            return NextResponse.json({
                error: 'OPENAI_API_KEY não configurada',
                fallbackToClient: true
            }, { status: 500 });
        }

        console.log('[GPT-4 Vision] Iniciando análise...');

        // Garante formato correto da imagem
        const imageUrl = image.startsWith('data:') ? image : `data:image/jpeg;base64,${image}`;

        const response = await openai.chat.completions.create({
            model: 'gpt-4o',
            messages: [
                {
                    role: 'user',
                    content: [
                        {
                            type: 'text',
                            text: `Analise este documento brasileiro (CNH, RG ou CPF) e extraia:

1. O NOME COMPLETO do titular (não é filiação/nome dos pais)
2. O número do CPF (11 dígitos)

IMPORTANTE:
- O nome fica geralmente no campo "NOME" do documento
- Na CNH, o nome está acima do CPF
- Ignore campos como FILIAÇÃO, DATA NASCIMENTO, etc.
- CPF tem formato: XXX.XXX.XXX-XX

Responda APENAS com JSON:
{"name": "NOME AQUI", "doc": "CPF AQUI"}

Se não conseguir identificar, use null no campo.`
                        },
                        {
                            type: 'image_url',
                            image_url: {
                                url: imageUrl,
                                detail: 'high'
                            }
                        }
                    ]
                }
            ],
            max_tokens: 300,
            temperature: 0
        });

        const content = response.choices[0]?.message?.content;
        console.log('[GPT-4 Vision] Resposta:', content);

        if (!content) {
            throw new Error('Sem resposta da IA');
        }

        // Parse JSON da resposta
        let result;
        try {
            // Remove possíveis blocos de código markdown
            const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
            result = JSON.parse(cleanContent);
        } catch (e) {
            console.error('[GPT-4 Vision] Erro ao parsear JSON:', e);
            console.error('[GPT-4 Vision] Conteúdo:', content);

            // Tenta extrair manualmente se o JSON falhou
            const nameMatch = content.match(/"name":\s*"([^"]+)"/);
            const docMatch = content.match(/"doc":\s*"([^"]+)"/);

            result = {
                name: nameMatch ? nameMatch[1] : null,
                doc: docMatch ? docMatch[1] : null
            };
        }

        return NextResponse.json({
            name: result.name || null,
            doc: result.doc || null,
            provider: 'openai-gpt4o'
        });

    } catch (error: any) {
        console.error('[GPT-4 Vision] Erro:', error);
        return NextResponse.json({
            error: error.message,
            fallbackToClient: true
        }, { status: 500 });
    }
}

