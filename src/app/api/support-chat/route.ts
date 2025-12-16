'use server';

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET - Listar chats do usuário ou todos (admin)
// POST - Criar novo chat ou enviar mensagem
// PUT - Atualizar status do chat
export async function GET(req: NextRequest) {
    try {
        const authHeader = req.headers.get('authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        const token = authHeader.replace('Bearer ', '');
        const { data: { user: authUser }, error: authError } = await supabaseAdmin.auth.getUser(token);

        if (authError || !authUser) {
            return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
        }

        const { data: userData } = await supabaseAdmin
            .from('users')
            .select('id, role, nome')
            .eq('id', authUser.id)
            .single();

        const { searchParams } = new URL(req.url);
        const chatId = searchParams.get('chat_id');

        // Se chat_id, buscar mensagens desse chat
        if (chatId) {
            const { data: messages, error } = await supabaseAdmin
                .from('chat_messages')
                .select('*, sender:users!sender_id(nome)')
                .eq('chat_id', chatId)
                .order('created_at', { ascending: true });

            if (error) {
                return NextResponse.json({ error: 'Erro ao buscar mensagens' }, { status: 500 });
            }

            // Marcar mensagens como lidas
            await supabaseAdmin
                .from('chat_messages')
                .update({ lida: true })
                .eq('chat_id', chatId)
                .neq('sender_id', authUser.id);

            return NextResponse.json({ messages });
        }

        // Buscar chats
        let query = supabaseAdmin
            .from('support_chats')
            .select('*, user:users!user_id(nome, email), atendente:users!atendente_id(nome)')
            .order('ultima_mensagem_at', { ascending: false });

        if (userData?.role !== 'superadmin') {
            query = query.eq('user_id', authUser.id);
        }

        const { data: chats, error } = await query;

        if (error) {
            console.error('Erro ao buscar chats:', error);
            return NextResponse.json({ error: 'Erro ao buscar chats' }, { status: 500 });
        }

        // Contar mensagens não lidas
        const chatsWithUnread = await Promise.all((chats || []).map(async (chat) => {
            const { count } = await supabaseAdmin
                .from('chat_messages')
                .select('*', { count: 'exact', head: true })
                .eq('chat_id', chat.id)
                .eq('lida', false)
                .neq('sender_id', authUser.id);

            return { ...chat, unread_count: count || 0 };
        }));

        return NextResponse.json({
            chats: chatsWithUnread,
            isAdmin: userData?.role === 'superadmin',
            userId: authUser.id
        });

    } catch (error) {
        console.error('Erro:', error);
        return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const authHeader = req.headers.get('authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        const token = authHeader.replace('Bearer ', '');
        const { data: { user: authUser }, error: authError } = await supabaseAdmin.auth.getUser(token);

        if (authError || !authUser) {
            return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
        }

        const { data: userData } = await supabaseAdmin
            .from('users')
            .select('id, role, condo_id, nome')
            .eq('id', authUser.id)
            .single();

        const body = await req.json();
        const { action } = body;

        if (action === 'create_chat') {
            const { assunto, mensagem } = body;

            if (!assunto || !mensagem) {
                return NextResponse.json({ error: 'Assunto e mensagem são obrigatórios' }, { status: 400 });
            }

            // Criar chat
            const { data: chat, error: chatError } = await supabaseAdmin
                .from('support_chats')
                .insert({
                    user_id: authUser.id,
                    condo_id: userData?.condo_id,
                    assunto,
                    status: 'aberto',
                })
                .select()
                .single();

            if (chatError) {
                console.error('Erro ao criar chat:', chatError);
                return NextResponse.json({ error: 'Erro ao criar chat' }, { status: 500 });
            }

            // Enviar primeira mensagem
            await supabaseAdmin
                .from('chat_messages')
                .insert({
                    chat_id: chat.id,
                    sender_id: authUser.id,
                    sender_type: 'user',
                    mensagem,
                });

            return NextResponse.json({ success: true, chat });
        }

        if (action === 'send_message') {
            const { chat_id, mensagem } = body;

            if (!chat_id || !mensagem) {
                return NextResponse.json({ error: 'Chat e mensagem são obrigatórios' }, { status: 400 });
            }

            const senderType = userData?.role === 'superadmin' ? 'admin' : 'user';

            // Enviar mensagem
            const { data: message, error: msgError } = await supabaseAdmin
                .from('chat_messages')
                .insert({
                    chat_id,
                    sender_id: authUser.id,
                    sender_type: senderType,
                    mensagem,
                })
                .select()
                .single();

            if (msgError) {
                console.error('Erro ao enviar mensagem:', msgError);
                return NextResponse.json({ error: 'Erro ao enviar mensagem' }, { status: 500 });
            }

            // Atualizar última mensagem e atendente se admin
            const updateData: any = { ultima_mensagem_at: new Date().toISOString() };
            if (senderType === 'admin') {
                updateData.atendente_id = authUser.id;
                updateData.status = 'em_atendimento';
            }

            await supabaseAdmin
                .from('support_chats')
                .update(updateData)
                .eq('id', chat_id);

            return NextResponse.json({ success: true, message });
        }

        return NextResponse.json({ error: 'Ação inválida' }, { status: 400 });

    } catch (error) {
        console.error('Erro:', error);
        return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
    }
}

export async function PUT(req: NextRequest) {
    try {
        const authHeader = req.headers.get('authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        const token = authHeader.replace('Bearer ', '');
        const { data: { user: authUser }, error: authError } = await supabaseAdmin.auth.getUser(token);

        if (authError || !authUser) {
            return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
        }

        const { data: userData } = await supabaseAdmin
            .from('users')
            .select('role')
            .eq('id', authUser.id)
            .single();

        if (userData?.role !== 'superadmin') {
            return NextResponse.json({ error: 'Apenas admins podem alterar status' }, { status: 403 });
        }

        const { chat_id, status } = await req.json();

        const { error } = await supabaseAdmin
            .from('support_chats')
            .update({ status, updated_at: new Date().toISOString() })
            .eq('id', chat_id);

        if (error) {
            return NextResponse.json({ error: 'Erro ao atualizar' }, { status: 500 });
        }

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Erro:', error);
        return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
    }
}
