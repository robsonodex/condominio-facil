'use server';

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET - Listar sugestões
// POST - Criar sugestão
// PUT - Votar ou atualizar status
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

        // Buscar usuário para pegar condo_id
        const { data: userData } = await supabaseAdmin
            .from('users')
            .select('id, condo_id, role')
            .eq('id', authUser.id)
            .single();

        if (!userData) {
            return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
        }

        // Buscar sugestões (todas se superadmin, do condomínio se não)
        let query = supabaseAdmin
            .from('suggestions')
            .select('*, autor:users!user_id(nome, email), votes_count')
            .order('votes_count', { ascending: false })
            .order('created_at', { ascending: false });

        if (userData.role !== 'superadmin') {
            // Mostrar sugestões do condomínio + públicas
            query = query.or(`condo_id.eq.${userData.condo_id},is_public.eq.true`);
        }

        const { data: suggestions, error } = await query;

        if (error) {
            console.error('Erro ao buscar sugestões:', error);
            return NextResponse.json({ error: 'Erro ao buscar sugestões' }, { status: 500 });
        }

        // Buscar votos do usuário atual
        const { data: userVotes } = await supabaseAdmin
            .from('suggestion_votes')
            .select('suggestion_id')
            .eq('user_id', authUser.id);

        const votedIds = new Set(userVotes?.map(v => v.suggestion_id) || []);

        // Adicionar flag de já votou
        const suggestionsWithVotes = (suggestions || []).map(s => ({
            ...s,
            user_voted: votedIds.has(s.id),
        }));

        return NextResponse.json({ suggestions: suggestionsWithVotes, isAdmin: userData.role === 'superadmin' });

    } catch (error: unknown) {
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
            .select('id, condo_id, role')
            .eq('id', authUser.id)
            .single();

        if (!userData) {
            return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
        }

        const { titulo, descricao, categoria } = await req.json();

        if (!titulo || !descricao) {
            return NextResponse.json({ error: 'Título e descrição são obrigatórios' }, { status: 400 });
        }

        const { data: suggestion, error } = await supabaseAdmin
            .from('suggestions')
            .insert({
                user_id: authUser.id,
                condo_id: userData.condo_id,
                titulo,
                descricao,
                categoria: categoria || 'geral',
                status: 'pendente',
                votes_count: 0,
                is_public: true,
            })
            .select()
            .single();

        if (error) {
            console.error('Erro ao criar sugestão:', error);
            return NextResponse.json({ error: 'Erro ao criar sugestão' }, { status: 500 });
        }

        return NextResponse.json({ success: true, suggestion });

    } catch (error: unknown) {
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
            .select('id, role')
            .eq('id', authUser.id)
            .single();

        const { action, suggestionId, status, resposta } = await req.json();

        if (action === 'vote') {
            // Verificar se já votou
            const { data: existingVote } = await supabaseAdmin
                .from('suggestion_votes')
                .select('id')
                .eq('suggestion_id', suggestionId)
                .eq('user_id', authUser.id)
                .single();

            if (existingVote) {
                // Remover voto
                await supabaseAdmin
                    .from('suggestion_votes')
                    .delete()
                    .eq('id', existingVote.id);

                // Decrementar contador
                await supabaseAdmin.rpc('decrement_suggestion_votes', { suggestion_id: suggestionId });

                return NextResponse.json({ success: true, voted: false });
            } else {
                // Adicionar voto
                await supabaseAdmin
                    .from('suggestion_votes')
                    .insert({ suggestion_id: suggestionId, user_id: authUser.id });

                // Incrementar contador
                await supabaseAdmin.rpc('increment_suggestion_votes', { suggestion_id: suggestionId });

                return NextResponse.json({ success: true, voted: true });
            }
        }

        if (action === 'update_status' && userData?.role === 'superadmin') {
            const { error } = await supabaseAdmin
                .from('suggestions')
                .update({ status, resposta_admin: resposta, updated_at: new Date().toISOString() })
                .eq('id', suggestionId);

            if (error) {
                return NextResponse.json({ error: 'Erro ao atualizar' }, { status: 500 });
            }

            return NextResponse.json({ success: true });
        }

        return NextResponse.json({ error: 'Ação inválida' }, { status: 400 });

    } catch (error: unknown) {
        console.error('Erro:', error);
        return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
    }
}
