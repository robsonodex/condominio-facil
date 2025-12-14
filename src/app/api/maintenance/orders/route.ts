import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET - Listar ordens de serviço
export async function GET(request: Request) {
    const supabase = createClient();
    const { searchParams } = new URL(request.url);
    const condoId = searchParams.get('condo_id');
    const status = searchParams.get('status');

    let query = supabase
        .from('maintenance_orders')
        .select('*, supplier:maintenance_suppliers(*)')
        .order('data_agendada', { ascending: true });

    if (condoId) {
        query = query.eq('condo_id', condoId);
    }

    if (status) {
        query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ orders: data });
}

// POST - Criar nova ordem
export async function POST(request: Request) {
    const supabase = createClient();
    const body = await request.json();

    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
        return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const orderData = {
        ...body,
        created_by: userData.user.id,
    };

    const { data, error } = await supabase
        .from('maintenance_orders')
        .insert(orderData)
        .select('*, supplier:maintenance_suppliers(*)')
        .single();

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ order: data }, { status: 201 });
}

// PATCH - Atualizar ordem
export async function PATCH(request: Request) {
    const supabase = createClient();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const body = await request.json();

    if (!id) {
        return NextResponse.json({ error: 'ID é obrigatório' }, { status: 400 });
    }

    const { data, error } = await supabase
        .from('maintenance_orders')
        .update(body)
        .eq('id', id)
        .select('*, supplier:maintenance_suppliers(*)')
        .single();

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ order: data });
}

// DELETE - Excluir ordem
export async function DELETE(request: Request) {
    const supabase = createClient();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
        return NextResponse.json({ error: 'ID é obrigatório' }, { status: 400 });
    }

    const { error } = await supabase
        .from('maintenance_orders')
        .delete()
        .eq('id', id);

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
}
