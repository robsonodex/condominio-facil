import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Configuração do Gemini
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = 'gemini-1.5-flash';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

// Fallback para OpenAI se configurado
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
}

// POST: Enviar pergunta e receber resposta
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();

        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
        }

        const { data: profile } = await supabase
            .from('users')
            .select('condo_id, role, name')
            .eq('id', user.id)
            .single();

        if (!profile?.condo_id) {
            return NextResponse.json({ error: 'Usuário sem condomínio' }, { status: 400 });
        }

        // ⚠️ VERIFICAÇÃO CRÍTICA: Módulo de IA ativado?
        const { data: condo } = await supabase
            .from('condos')
            .select('ai_ativo')
            .eq('id', profile.condo_id)
            .single();

        if (!condo?.ai_ativo) {
            return NextResponse.json({
                error: 'Módulo não contratado',
                message: 'O módulo de IA não está ativo para este condomínio. Entre em contato com o suporte para contratar.'
            }, { status: 403 });
        }

        // Verificar se agente existe e está ativo
        const { data: agent } = await supabase
            .from('ai_agents')
            .select('*')
            .eq('condo_id', profile.condo_id)
            .eq('ativo', true)
            .single();

        if (!agent) {
            return NextResponse.json({
                error: 'Assistente não configurado',
                message: 'O assistente do condomínio ainda não foi configurado pelo síndico.'
            }, { status: 404 });
        }

        // Verificar settings e limites
        const { data: settings } = await supabase
            .from('ai_settings')
            .select('*')
            .eq('condo_id', profile.condo_id)
            .single();

        // Verificar se usuário tem permissão
        if (settings?.roles_permitidos && !settings.roles_permitidos.includes(profile.role)) {
            return NextResponse.json({
                error: 'Sem permissão',
                message: 'Você não tem permissão para usar o assistente.'
            }, { status: 403 });
        }

        // Verificar limite mensal
        const currentMonth = new Date().toISOString().slice(0, 7);
        if (settings) {
            if (settings.mes_referencia !== currentMonth) {
                // Resetar contador do mês
                await supabase
                    .from('ai_settings')
                    .update({ mensagens_usadas_mes: 0, mes_referencia: currentMonth })
                    .eq('condo_id', profile.condo_id);
            } else if (settings.mensagens_usadas_mes >= settings.limite_mensagens_mes) {
                return NextResponse.json({
                    error: 'Limite atingido',
                    message: `O limite de ${settings.limite_mensagens_mes} mensagens mensais foi atingido.`
                }, { status: 429 });
            }
        }

        const body = await request.json();
        const { pergunta, historico } = body as { pergunta: string; historico?: ChatMessage[] };

        if (!pergunta || pergunta.trim().length < 3) {
            return NextResponse.json({ error: 'Pergunta muito curta' }, { status: 400 });
        }

        const startTime = Date.now();

        // Buscar documentos relevantes (todos ativos por enquanto)
        const { data: documents } = await supabase
            .from('ai_documents')
            .select('titulo, tipo, conteudo_texto')
            .eq('condo_id', profile.condo_id)
            .eq('ativo', true);

        // Montar contexto da base de conhecimento
        let conhecimento = '';
        if (documents && documents.length > 0) {
            conhecimento = documents.map(doc =>
                `[${doc.tipo.toUpperCase()}: ${doc.titulo}]\n${doc.conteudo_texto}\n`
            ).join('\n---\n');
        }

        // Montar prompt do sistema baseado no tom
        const tomDescricao = {
            formal: 'Use linguagem formal e profissional. Seja cortês e respeitoso.',
            direto: 'Seja direto e objetivo. Vá direto ao ponto, sem rodeios.',
            amigavel: 'Seja amigável e acessível. Use uma linguagem descontraída mas profissional.'
        };

        const systemPrompt = `Você é "${agent.nome_agente}", o assistente virtual exclusivo deste condomínio.

REGRAS ABSOLUTAS:
1. Responda APENAS com base nas informações fornecidas abaixo sobre o condomínio
2. Se a informação não estiver disponível, diga claramente: "Não encontrei essa informação nos documentos do condomínio. Consulte o síndico."
3. NUNCA invente informações
4. NUNCA dê conselhos jurídicos
5. ${tomDescricao[agent.tom_resposta as keyof typeof tomDescricao] || tomDescricao.formal}
6. Seja conciso nas respostas

${agent.instrucoes_personalizadas ? `INSTRUÇÕES ESPECIAIS:\n${agent.instrucoes_personalizadas}\n` : ''}

BASE DE CONHECIMENTO DO CONDOMÍNIO:
${conhecimento || 'Nenhum documento cadastrado ainda.'}`;

        // Chamar a IA
        let resposta = '';
        let tokensUsados = 0;

        if (GEMINI_API_KEY) {
            // Usar Google Gemini
            const geminiResponse = await callGemini(systemPrompt, pergunta, historico);
            resposta = geminiResponse.text;
            tokensUsados = geminiResponse.tokens;
        } else if (OPENAI_API_KEY) {
            // Fallback para OpenAI
            const openaiResponse = await callOpenAI(systemPrompt, pergunta, historico);
            resposta = openaiResponse.text;
            tokensUsados = openaiResponse.tokens;
        } else {
            return NextResponse.json({
                error: 'IA não configurada',
                message: 'Nenhuma API de IA configurada. Configure GEMINI_API_KEY ou OPENAI_API_KEY.'
            }, { status: 500 });
        }

        const tempoResposta = Date.now() - startTime;

        // Salvar interação no log
        await supabase.from('ai_interactions').insert({
            condo_id: profile.condo_id,
            user_id: user.id,
            pergunta,
            resposta,
            tokens_usados: tokensUsados,
            tempo_resposta_ms: tempoResposta
        });

        // Incrementar contador mensal
        if (settings) {
            await supabase
                .from('ai_settings')
                .update({ mensagens_usadas_mes: (settings.mensagens_usadas_mes || 0) + 1 })
                .eq('condo_id', profile.condo_id);
        }

        // Adicionar disclaimer se configurado
        const disclaimer = settings?.disclaimer_ativo !== false
            ? '\n\n---\n*Esta resposta foi gerada com base nos documentos do condomínio. Para decisões importantes, consulte o síndico.*'
            : '';

        return NextResponse.json({
            resposta: resposta + disclaimer,
            agente: agent.nome_agente,
            tempoMs: tempoResposta,
            usage: settings ? {
                usado: (settings.mensagens_usadas_mes || 0) + 1,
                limite: settings.limite_mensagens_mes
            } : null
        });
    } catch (error) {
        console.error('[AI Chat] Erro:', error);
        return NextResponse.json({ error: 'Erro ao processar pergunta' }, { status: 500 });
    }
}

// Função para chamar Google Gemini
async function callGemini(systemPrompt: string, pergunta: string, historico?: ChatMessage[]): Promise<{ text: string; tokens: number }> {
    const contents = [];

    // Adicionar contexto do sistema como primeira mensagem
    contents.push({
        role: 'user',
        parts: [{ text: `${systemPrompt}\n\n---\n\nUsuário pergunta: ${pergunta}` }]
    });

    // Adicionar histórico se existir
    if (historico && historico.length > 0) {
        for (const msg of historico.slice(-6)) { // Últimas 6 mensagens
            contents.push({
                role: msg.role === 'user' ? 'user' : 'model',
                parts: [{ text: msg.content }]
            });
        }
        // Adicionar pergunta atual
        contents.push({
            role: 'user',
            parts: [{ text: pergunta }]
        });
    }

    const response = await fetch(`${GEMINI_URL}?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents,
            generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 1024,
                topP: 0.8,
                topK: 40
            },
            safetySettings: [
                { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
                { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
                { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
                { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' }
            ]
        })
    });

    if (!response.ok) {
        const error = await response.text();
        console.error('[Gemini] Erro:', error);
        throw new Error('Erro ao chamar Gemini');
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Desculpe, não consegui gerar uma resposta.';
    const tokens = data.usageMetadata?.totalTokenCount || 0;

    return { text, tokens };
}

// Função para chamar OpenAI (fallback)
async function callOpenAI(systemPrompt: string, pergunta: string, historico?: ChatMessage[]): Promise<{ text: string; tokens: number }> {
    const messages = [
        { role: 'system', content: systemPrompt }
    ];

    // Adicionar histórico
    if (historico && historico.length > 0) {
        for (const msg of historico.slice(-6)) {
            messages.push({ role: msg.role, content: msg.content });
        }
    }

    messages.push({ role: 'user', content: pergunta });

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${OPENAI_API_KEY}`
        },
        body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages,
            temperature: 0.7,
            max_tokens: 1024
        })
    });

    if (!response.ok) {
        const error = await response.text();
        console.error('[OpenAI] Erro:', error);
        throw new Error('Erro ao chamar OpenAI');
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content || 'Desculpe, não consegui gerar uma resposta.';
    const tokens = data.usage?.total_tokens || 0;

    return { text, tokens };
}
