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
                            text: `ATUE COMO UM ESPECIALISTA EM ANÁLISE FORENSE DE DOCUMENTOS.

Sua missão é extrair dados de uma CNH (Carteira Nacional de Habilitação) ou RG/CPF brasileiro.
A imagem pode estar rotacionada, com baixo contraste ou tremida. Use sua visão avançada.

PASSO 1: Identifique visualmente onde estão os campos "NOME", "CPF", "DOC. IDENTIDADE", "DATA NASCIMENTO".
PASSO 2: Leia o texto que está IMEDIATAMENTE PRÓXIMO a esses rótulos.
PASSO 3: Ignore sufixos como ", pai", ", filho", "SSP", "DETRAN".
PASSO 4: Formate a saída.

Retorne APENAS este JSON:
{
  "name": "NOME COMPLETO DO CIDADÃO (Sem rótulos)",
  "doc": "NÚMERO DO DOCUMENTO PREFERENCIAL"
}

REGRAS DE PRIORIDADE PARA O CAMPO 'doc':
1. PRIORIDADE MÁXIMA: CPF (11 dígitos, ex: 123.456.789-00).
2. Se houver CPF e RG na imagem -> RETORNE O CPF.
3. Se houver APENAS RG -> Retorne o RG.
4. Se for CNH -> Retorne o CPF (que consta nela).

DICAS VISUAIS:
- Em identidades novas, o CPF fica em destaque.
- Em CNH, o CPF fica ao lado do rótulo "CPF".
- Em RG antigo, o CPF pode estar na parte inferior.

Se não conseguir ler com certeza absoluta, retorne null.`
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
            temperature: 0, // Zero para garantir obediência à regra do CPF
            max_tokens: 500,
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
                    error: `Serviço ocupado (${response.status}), usando fallback local`,
                    fallbackToClient: true
                }, { status: response.status });
            }

            return NextResponse.json({
                error: `Erro na API Groq: ${response.status} - ${errorText.substring(0, 50)}`,
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
            console.error('[Groq AI] Conteúdo recebido:', content);

            return NextResponse.json({
                error: 'Erro formato JSON da IA',
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
