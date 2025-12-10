import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, getSessionFromReq } from '@/lib/supabase/admin';

// GET: List all resident invoices (admin only)
export async function GET(request: NextRequest) {
    try {
        const session = await getSessionFromReq(request);

        if (!session || !session.isSuperadmin) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status');

        let query = supabaseAdmin
            .from('resident_invoices')
            .select(`
                *,
                morador:users!morador_id(nome, email),
                condo:condos(nome),
                unidade:units(bloco, numero_unidade)
            `)
            .order('created_at', { ascending: false })
            .limit(200);

        if (status) {
            query = query.eq('status', status);
        }

        const { data, error } = await query;

        if (error) {
            console.error('Error fetching invoices:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ invoices: data || [] });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// DELETE: Cancel an invoice
export async function DELETE(request: NextRequest) {
    try {
        const session = await getSessionFromReq(request);

        if (!session || !session.isSuperadmin) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'ID não informado' }, { status: 400 });
        }

        const { error } = await supabaseAdmin
            .from('resident_invoices')
            .update({ status: 'cancelado' })
            .eq('id', id);

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
