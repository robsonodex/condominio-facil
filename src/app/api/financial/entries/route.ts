import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, getSessionFromReq, logEvent } from '@/lib/supabase/admin';

/**
 * POST /api/financial/entries
 * Create a new financial entry (receita or despesa)
 */
export async function POST(request: NextRequest) {
    try {
        const session = await getSessionFromReq(request);

        if (!session) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        if (!session.isSindico && !session.isSuperadmin) {
            await logEvent('FINANCIAL_ENTRY_FORBIDDEN', 'warn', { userId: session.userId });
            return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
        }

        const body = await request.json();
        const { condo_id, tipo, categoria, descricao, valor, data_vencimento, status, unidade_id } = body;

        // Validate required fields
        if (!condo_id || !tipo || !categoria || !valor || !data_vencimento) {
            return NextResponse.json({ error: 'Campos obrigatórios faltando' }, { status: 400 });
        }

        // Validate síndico can only create for their own condo
        // SUPERADMIN can create for ANY condo
        if (!session.isSuperadmin && session.isSindico && session.condoId !== condo_id) {
            await logEvent('FINANCIAL_ENTRY_WRONG_CONDO', 'warn', {
                userId: session.userId,
                requestedCondo: condo_id,
                userCondo: session.condoId
            });
            return NextResponse.json({ error: 'Acesso negado ao condomínio' }, { status: 403 });
        }

        // Insert with admin privileges
        const { data, error } = await supabaseAdmin.from('financial_entries').insert({
            condo_id,
            tipo,
            categoria,
            descricao: descricao || null,
            valor: parseFloat(valor),
            data_vencimento,
            status: status || 'em_aberto',
            unidade_id: unidade_id || null,
            created_at: new Date().toISOString(),
        }).select().single();

        if (error) {
            console.error('[FINANCIAL_ENTRIES] Insert error:', error);
            await logEvent('FINANCIAL_ENTRY_ERROR', 'error', { error: error.message, userId: session.userId });
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        await logEvent('FINANCIAL_ENTRY_CREATED', 'info', {
            entryId: data.id,
            tipo,
            valor,
            userId: session.userId
        });

        return NextResponse.json({ success: true, data }, { status: 201 });

    } catch (error: any) {
        console.error('[FINANCIAL_ENTRIES] Unexpected error:', error);
        return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
    }
}

/**
 * GET /api/financial/entries
 * List financial entries (filtered by condo for síndico)
 */
export async function GET(request: NextRequest) {
    try {
        const session = await getSessionFromReq(request);

        if (!session) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const condo_id = searchParams.get('condo_id');
        const tipo = searchParams.get('tipo');
        const status = searchParams.get('status');

        let query = supabaseAdmin
            .from('financial_entries')
            .select('*, unit:units(bloco, numero_unidade), condo:condos(nome)')
            .order('data_vencimento', { ascending: false })
            .limit(100);

        // Síndico can only see their own condo
        // SUPERADMIN can see ALL condos
        if (!session.isSuperadmin && session.isSindico) {
            query = query.eq('condo_id', session.condoId);
        } else if (condo_id) {
            query = query.eq('condo_id', condo_id);
        }

        if (tipo) query = query.eq('tipo', tipo);
        if (status) query = query.eq('status', status);

        const { data, error } = await query;

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ data });

    } catch (error: any) {
        console.error('[FINANCIAL_ENTRIES] GET error:', error);
        return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
    }
}
