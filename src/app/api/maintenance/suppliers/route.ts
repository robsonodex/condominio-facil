import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET - Listar fornecedores
export async function GET(request: Request) {
    const supabase = createClient();
    const { searchParams } = new URL(request.url);
    const condoId = searchParams.get('condo_id');
    const ativo = searchParams.get('ativo');

    let query = supabase
        .from('maintenance_suppliers')
        .select('*')
        .order('rating', { ascending: false });

    if (condoId) {
        query = query.eq('condo_id', condoId);
    }

    if (ativo !== null) {
        query = query.eq('ativo', ativo === 'true');
    }

    const { data, error } = await query;

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ suppliers: data });
}

// POST - Criar novo fornecedor
export async function POST(request: Request) {
    const supabase = createClient();
    const body = await request.json();

    const { data, error } = await supabase
        .from('maintenance_suppliers')
        .insert(body)
        .select()
        .single();

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ supplier: data }, { status: 201 });
}

// PATCH - Atualizar fornecedor
export async function PATCH(request: Request) {
    const supabase = createClient();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const body = await request.json();

    if (!id) {
        return NextResponse.json({ error: 'ID é obrigatório' }, { status: 400 });
    }

    const { data, error } = await supabase
        .from('maintenance_suppliers')
        .update(body)
        .eq('id', id)
        .select()
        .single();

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ supplier: data });
}

// DELETE - Excluir fornecedor (soft delete - marca como inativo)
export async function DELETE(request: Request) {
    const supabase = createClient();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
        return NextResponse.json({ error: 'ID é obrigatório' }, { status: 400 });
    }

    const { error } = await supabase
        .from('maintenance_suppliers')
        .update({ ativo: false })
        .eq('id', id);

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
}
