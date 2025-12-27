import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// 🚀 UNIFICAÇÃO AI: Usando Groq (Llama 3) para tudo
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const CHAT_MODEL = 'llama-3.1-70b-versatile'; // Modelo excelente para conversas complexas

interface ChatMessage {
    role: 'user' | 'assistant' | 'system';
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

        // Verificar limites mensais (mantido igual)
        const currentMonth = new Date().toISOString().slice(0, 7);
        if (settings) {
            if (settings.mes_referencia !== currentMonth) {
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

        // Buscar documentos relevantes
        const { data: documents } = await supabase
            .from('ai_documents')
            .select('titulo, tipo, conteudo_texto')
            .eq('condo_id', profile.condo_id)
            .eq('ativo', true);

        // Montar contexto
        let conhecimento = '';
        if (documents && documents.length > 0) {
            conhecimento = documents.map(doc =>
                `[${doc.tipo.toUpperCase()}: ${doc.titulo}]\n${doc.conteudo_texto}\n`
            ).join('\n---\n');
        }

        const tomDescricao = {
            formal: 'Use linguagem formal e profissional. Seja cortês e respeitoso.',
            direto: 'Seja direto e objetivo. Vá direto ao ponto, sem rodeios.',
            amigavel: 'Seja amigável e acessível. Use uma linguagem descontraída mas profissional.'
        };

        const systemPrompt = `Você é "${agent.nome_agente}", o assistente virtual exclusivo deste condomínio.
Você está conversando com ${profile.name} (perfil: ${profile.role}).

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

        // Chamar Groq (Llama 3)
        let resposta = '';
        let tokensUsados = 0;

        if (GROQ_API_KEY) {
            const groqResponse = await callGroq(systemPrompt, pergunta, historico);
            resposta = groqResponse.text;
            tokensUsados = groqResponse.tokens;
        } else {
            return NextResponse.json({
                error: 'IA não configurada',
                message: 'Chave da API GROQ não configurada.'
            }, { status: 500 });
        }

        const tempoResposta = Date.now() - startTime;

        // Salvar interação
        await supabase.from('ai_interactions').insert({
            condo_id: profile.condo_id,
            user_id: user.id,
            pergunta,
            resposta,
            tokens_usados: tokensUsados,
            tempo_resposta_ms: tempoResposta
        });

        // Atualizar uso
        if (settings) {
            await supabase
                .from('ai_settings')
                .update({ mensagens_usadas_mes: (settings.mensagens_usadas_mes || 0) + 1 })
                .eq('condo_id', profile.condo_id);
        }

        const disclaimer = settings?.disclaimer_ativo !== false
            ? '\n\n---\n*Esta resposta foi gerada com base nos documentos do condomínio.*'
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

// Função para chamar Groq
async function callGroq(systemPrompt: string, pergunta: string, historico?: ChatMessage[]): Promise<{ text: string; tokens: number }> {
    const messages = [
        { role: 'system', content: systemPrompt }
    ];

    // Adicionar histórico recente
    if (historico && historico.length > 0) {
        for (const msg of historico.slice(-6)) {
            // Mapping de roles para garantir compatibilidade
            const role = msg.role === 'user' ? 'user' : 'assistant';
            messages.push({ role, content: msg.content });
        }
    }

    messages.push({ role: 'user', content: pergunta });

    const response = await fetch(GROQ_API_URL, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${GROQ_API_KEY}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            model: CHAT_MODEL,
            messages,
            temperature: 0.5, // Equilíbrio entre criatividade e precisão
            max_tokens: 1024
        })
    });

    if (!response.ok) {
        const error = await response.text();
        console.error('[Groq Chat] Erro:', error);
        throw new Error('Erro ao chamar Groq API');
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content || 'Desculpe, não consegui processar sua resposta.';
    const tokens = data.usage?.total_tokens || 0;

    return { text, tokens };
}
