import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, getSessionFromReq } from '@/lib/supabase/admin';

// GET: Listar conversas
export async function GET(request: NextRequest) {
    try {
        const session = await getSessionFromReq(request);
        if (!session?.userId || !session?.condoId) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status');
        const limit = parseInt(searchParams.get('limit') || '50');

        // Buscar role do usuário
        const { data: profile } = await supabaseAdmin
            .from('users')
            .select('id, role, nome, unidade:units(bloco, numero_unidade)')
            .eq('id', session.userId)
            .single();

        if (!profile) {
            return NextResponse.json({ error: 'Perfil não encontrado' }, { status: 404 });
        }

        let query = supabaseAdmin
            .from('chat_sindico_conversas')
            .select(`
                *,
                morador:users!morador_id(id, nome, email, telefone, unidade:units(bloco, numero_unidade)),
                sindico:users!sindico_id(id, nome)
            `)
            .eq('condo_id', session.condoId)
            .order('ultima_mensagem_em', { ascending: false, nullsFirst: false })
            .limit(limit);

        // Morador vê apenas suas conversas
        if (profile.role === 'morador' || profile.role === 'inquilino') {
            query = query.eq('morador_id', profile.id);
        }

        if (status) {
            query = query.eq('status', status);
        }

        const { data: conversas, error } = await query;
        if (error) throw error;

        // Contar total de não lidas para o usuário
        let totalNaoLidas = 0;
        if (profile.role === 'sindico' || profile.role === 'superadmin') {
            const { data: countData } = await supabaseAdmin
                .from('chat_sindico_conversas')
                .select('mensagens_nao_lidas_sindico')
                .eq('condo_id', session.condoId);
            totalNaoLidas = countData?.reduce((sum, c) => sum + (c.mensagens_nao_lidas_sindico || 0), 0) || 0;
        } else {
            const { data: countData } = await supabaseAdmin
                .from('chat_sindico_conversas')
                .select('mensagens_nao_lidas_morador')
                .eq('condo_id', session.condoId)
                .eq('morador_id', profile.id);
            totalNaoLidas = countData?.reduce((sum, c) => sum + (c.mensagens_nao_lidas_morador || 0), 0) || 0;
        }

        return NextResponse.json({
            conversas: conversas || [],
            totalNaoLidas,
            userRole: profile.role
        });
    } catch (error: any) {
        console.error('[CHAT-SINDICO] GET Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// POST: Criar nova conversa ou enviar mensagem
export async function POST(request: NextRequest) {
    try {
        const session = await getSessionFromReq(request);
        console.log('[CHAT-SINDICO] POST session:', JSON.stringify(session));

        if (!session?.userId || !session?.condoId) {
            console.log('[CHAT-SINDICO] Missing userId or condoId');
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        const body = await request.json();
        const { action } = body;
        console.log('[CHAT-SINDICO] Action:', action);

        // Buscar perfil
        const { data: profile, error: profileError } = await supabaseAdmin
            .from('users')
            .select('id, role, nome, condo_id, unidade:units(bloco, numero_unidade)')
            .eq('id', session.userId)
            .single();

        console.log('[CHAT-SINDICO] Profile:', JSON.stringify(profile), 'Error:', profileError?.message);

        if (!profile) {
            return NextResponse.json({ error: 'Perfil não encontrado' }, { status: 404 });
        }

        if (action === 'nova_conversa') {
            return criarNovaConversa(body, profile, session.condoId);
        } else if (action === 'enviar_mensagem') {
            return enviarMensagem(body, profile, session.condoId);
        } else if (action === 'marcar_lida') {
            return marcarComoLida(body, profile, session.condoId);
        } else if (action === 'atualizar_status') {
            return atualizarStatus(body, profile, session.condoId);
        } else if (action === 'avaliar') {
            return avaliarAtendimento(body, profile, session.condoId);
        }

        return NextResponse.json({ error: 'Ação inválida' }, { status: 400 });
    } catch (error: any) {
        console.error('[CHAT-SINDICO] POST Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// Criar nova conversa
async function criarNovaConversa(body: any, profile: any, condoId: string) {
    const { categoria, assunto, mensagem } = body;

    // Apenas morador pode iniciar conversa
    if (!['morador', 'inquilino'].includes(profile.role)) {
        return NextResponse.json({ error: 'Apenas moradores podem iniciar conversa' }, { status: 403 });
    }

    // Buscar síndico do condomínio
    const { data: sindico } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('condo_id', condoId)
        .eq('role', 'sindico')
        .eq('ativo', true)
        .single();

    // Criar conversa
    const { data: conversa, error: convError } = await supabaseAdmin
        .from('chat_sindico_conversas')
        .insert({
            condo_id: condoId,
            morador_id: profile.id,
            sindico_id: sindico?.id || null,
            categoria: categoria || 'geral',
            assunto: assunto || null,
            status: 'aberta',
            ultima_mensagem_em: new Date().toISOString()
        })
        .select()
        .single();

    if (convError) throw convError;

    // Enviar primeira mensagem
    if (mensagem) {
        await supabaseAdmin.from('chat_sindico_mensagens').insert({
            conversa_id: conversa.id,
            condo_id: condoId,
            sender_id: profile.id,
            sender_role: profile.role,
            mensagem,
            tipo: 'texto'
        });
    }

    // Notificar síndico
    if (sindico?.id) {
        const unidade = profile.unidade ? `${profile.unidade.bloco} ${profile.unidade.numero_unidade}` : '';
        await supabaseAdmin.from('notifications').insert({
            condo_id: condoId,
            user_id: sindico.id,
            titulo: '💬 Nova mensagem de morador',
            mensagem: `${profile.nome}${unidade ? ` (${unidade})` : ''} iniciou uma conversa: "${assunto || 'Sem assunto'}"`,
            tipo: 'sistema',
            link: '/chat-moradores'
        });
    }

    return NextResponse.json({ conversa, message: 'Conversa iniciada!' });
}

// Enviar mensagem
async function enviarMensagem(body: any, profile: any, condoId: string) {
    const { conversa_id, mensagem, tipo = 'texto', arquivo_url, arquivo_nome } = body;

    if (!conversa_id || !mensagem) {
        return NextResponse.json({ error: 'Conversa e mensagem são obrigatórios' }, { status: 400 });
    }

    // Verificar se usuário pertence à conversa
    const { data: conversa } = await supabaseAdmin
        .from('chat_sindico_conversas')
        .select('*, morador:users!morador_id(id, nome), sindico:users!sindico_id(id, nome)')
        .eq('id', conversa_id)
        .eq('condo_id', condoId)
        .single();

    if (!conversa) {
        return NextResponse.json({ error: 'Conversa não encontrada' }, { status: 404 });
    }

    // Verificar permissão
    const isMorador = conversa.morador_id === profile.id;
    const isSindico = profile.role === 'sindico' || profile.role === 'superadmin';

    if (!isMorador && !isSindico) {
        return NextResponse.json({ error: 'Sem permissão para esta conversa' }, { status: 403 });
    }

    // Inserir mensagem
    const { data: msg, error } = await supabaseAdmin
        .from('chat_sindico_mensagens')
        .insert({
            conversa_id,
            condo_id: condoId,
            sender_id: profile.id,
            sender_role: profile.role,
            mensagem,
            tipo,
            arquivo_url,
            arquivo_nome
        })
        .select()
        .single();

    if (error) throw error;

    // Notificar o outro lado
    if (isSindico && conversa.morador_id) {
        // Síndico respondendo -> notificar morador
        await supabaseAdmin.from('notifications').insert({
            condo_id: condoId,
            user_id: conversa.morador_id,
            titulo: '💬 Resposta do Síndico',
            mensagem: `O síndico respondeu sua mensagem: "${mensagem.substring(0, 50)}${mensagem.length > 50 ? '...' : ''}"`,
            tipo: 'sistema',
            link: '/chat-moradores'
        });
    } else if (isMorador && conversa.sindico_id) {
        // Morador enviando -> notificar síndico
        const unidade = profile.unidade ? `${profile.unidade.bloco} ${profile.unidade.numero_unidade}` : '';
        await supabaseAdmin.from('notifications').insert({
            condo_id: condoId,
            user_id: conversa.sindico_id,
            titulo: '💬 Nova mensagem',
            mensagem: `${profile.nome}${unidade ? ` (${unidade})` : ''}: "${mensagem.substring(0, 50)}${mensagem.length > 50 ? '...' : ''}"`,
            tipo: 'sistema',
            link: '/chat-moradores'
        });
    }

    return NextResponse.json({ mensagem: msg, success: true });
}

// Marcar mensagens como lidas
async function marcarComoLida(body: any, profile: any, condoId: string) {
    const { conversa_id } = body;

    if (!conversa_id) {
        return NextResponse.json({ error: 'Conversa é obrigatória' }, { status: 400 });
    }

    // Verificar se pertence à conversa
    const { data: conversa } = await supabaseAdmin
        .from('chat_sindico_conversas')
        .select('*')
        .eq('id', conversa_id)
        .eq('condo_id', condoId)
        .single();

    if (!conversa) {
        return NextResponse.json({ error: 'Conversa não encontrada' }, { status: 404 });
    }

    const isSindico = profile.role === 'sindico' || profile.role === 'superadmin';

    // Marcar mensagens como lidas
    await supabaseAdmin
        .from('chat_sindico_mensagens')
        .update({ lida: true, lida_em: new Date().toISOString() })
        .eq('conversa_id', conversa_id)
        .neq('sender_id', profile.id);

    // Zerar contador correto
    if (isSindico) {
        await supabaseAdmin
            .from('chat_sindico_conversas')
            .update({ mensagens_nao_lidas_sindico: 0 })
            .eq('id', conversa_id);
    } else {
        await supabaseAdmin
            .from('chat_sindico_conversas')
            .update({ mensagens_nao_lidas_morador: 0 })
            .eq('id', conversa_id);
    }

    return NextResponse.json({ success: true });
}

// Atualizar status da conversa
async function atualizarStatus(body: any, profile: any, condoId: string) {
    const { conversa_id, status } = body;

    // Apenas síndico pode alterar status
    if (!['sindico', 'superadmin'].includes(profile.role)) {
        return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
    }

    const { error } = await supabaseAdmin
        .from('chat_sindico_conversas')
        .update({ status })
        .eq('id', conversa_id)
        .eq('condo_id', condoId);

    if (error) throw error;

    return NextResponse.json({ success: true });
}

// Avaliar atendimento
async function avaliarAtendimento(body: any, profile: any, condoId: string) {
    const { conversa_id, avaliacao, comentario } = body;

    // Apenas morador pode avaliar
    if (!['morador', 'inquilino'].includes(profile.role)) {
        return NextResponse.json({ error: 'Apenas moradores podem avaliar' }, { status: 403 });
    }

    const { error } = await supabaseAdmin
        .from('chat_sindico_conversas')
        .update({
            avaliacao,
            avaliacao_comentario: comentario,
            status: 'resolvida'
        })
        .eq('id', conversa_id)
        .eq('morador_id', profile.id)
        .eq('condo_id', condoId);

    if (error) throw error;

    return NextResponse.json({ success: true, message: 'Obrigado pela avaliação!' });
}
