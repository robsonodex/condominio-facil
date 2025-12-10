import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET: Listar destinos do condomínio
export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        const { data: profile } = await supabase
            .from('users')
            .select('condo_id')
            .eq('id', user.id)
            .single();

        if (!profile?.condo_id) {
            return NextResponse.json({ error: 'Condomínio não encontrado' }, { status: 404 });
        }

        const { data, error } = await supabase
            .from('custom_destinations')
            .select('*')
            .eq('condo_id', profile.condo_id)
            .eq('ativo', true)
            .order('nome');

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ destinations: data || [] });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// POST: Criar novo destino
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        const { data: profile } = await supabase
            .from('users')
            .select('role, condo_id')
            .eq('id', user.id)
            .single();

        if (!profile?.condo_id || (profile.role !== 'sindico' && profile.role !== 'superadmin')) {
            return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
        }

        const body = await request.json();
        const { nome, descricao } = body;

        if (!nome?.trim()) {
            return NextResponse.json({ error: 'Nome é obrigatório' }, { status: 400 });
        }

        const { data, error } = await supabase
            .from('custom_destinations')
            .insert({
                condo_id: profile.condo_id,
                nome: nome.trim(),
                descricao: descricao?.trim() || null,
            })
            .select()
            .single();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ destination: data });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// PATCH: Atualizar destino
export async function PATCH(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        const { data: profile } = await supabase
            .from('users')
            .select('role, condo_id')
            .eq('id', user.id)
            .single();

        if (!profile?.condo_id || (profile.role !== 'sindico' && profile.role !== 'superadmin')) {
            return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
        }

        const body = await request.json();
        const { id, nome, descricao, ativo } = body;

        if (!id) {
            return NextResponse.json({ error: 'ID é obrigatório' }, { status: 400 });
        }

        const updateData: any = { updated_at: new Date().toISOString() };
        if (nome !== undefined) updateData.nome = nome.trim();
        if (descricao !== undefined) updateData.descricao = descricao?.trim() || null;
        if (ativo !== undefined) updateData.ativo = ativo;

        const { data, error } = await supabase
            .from('custom_destinations')
            .update(updateData)
            .eq('id', id)
            .eq('condo_id', profile.condo_id)
            .select()
            .single();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ destination: data });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// DELETE: Excluir destino
export async function DELETE(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        const { data: profile } = await supabase
            .from('users')
            .select('role, condo_id')
            .eq('id', user.id)
            .single();

        if (!profile?.condo_id || (profile.role !== 'sindico' && profile.role !== 'superadmin')) {
            return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'ID é obrigatório' }, { status: 400 });
        }

        const { error } = await supabase
            .from('custom_destinations')
            .delete()
            .eq('id', id)
            .eq('condo_id', profile.condo_id);

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
