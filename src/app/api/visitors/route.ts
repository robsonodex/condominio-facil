import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, getSessionFromReq, logEvent } from '@/lib/supabase/admin';

/**
 * POST /api/visitors
 * Register a visitor entry
 */
export async function POST(request: NextRequest) {
    try {
        const session = await getSessionFromReq(request);

        if (!session) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        // Porteiro, síndico, and superadmin can register visitors
        if (!session.isSindico && !session.isSuperadmin && session.role !== 'porteiro') {
            return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
        }

        const body = await request.json();
        const { condo_id, nome, documento, tipo, placa_veiculo, unidade_id, observacoes } = body;

        // Validate required fields
        if (!condo_id || !nome) {
            return NextResponse.json({ error: 'Campos obrigatórios: condo_id, nome' }, { status: 400 });
        }

        // Validate síndico/porteiro can only register for their own condo
        if (!session.isSuperadmin && session.condoId !== condo_id) {
            return NextResponse.json({ error: 'Acesso negado ao condomínio' }, { status: 403 });
        }

        // Insert visitor
        const { data, error } = await supabaseAdmin.from('visitors').insert({
            condo_id,
            nome,
            documento: documento || null,
            tipo: tipo || 'visitante',
            placa_veiculo: placa_veiculo || null,
            unidade_id: unidade_id || null,
            observacoes: observacoes || null,
            registrado_por_user_id: session.userId,
            data_hora_entrada: new Date().toISOString(),
        }).select('*, unit:units(bloco, numero_unidade)').single();

        if (error) {
            console.error('[VISITORS] Insert error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        await logEvent('VISITOR_REGISTERED', 'info', { visitorId: data.id, nome, createdBy: session.userId });

        return NextResponse.json({ success: true, data }, { status: 201 });

    } catch (error: any) {
        console.error('[VISITORS] Unexpected error:', error);
        return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
    }
}

/**
 * PATCH /api/visitors
 * Record visitor exit
 */
export async function PATCH(request: NextRequest) {
    try {
        const session = await getSessionFromReq(request);

        if (!session) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        const body = await request.json();
        const { id } = body;

        if (!id) {
            return NextResponse.json({ error: 'ID obrigatório' }, { status: 400 });
        }

        // Update exit time
        const { data, error } = await supabaseAdmin.from('visitors').update({
            data_hora_saida: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        }).eq('id', id).select().single();

        if (error) {
            console.error('[VISITORS] Update error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        await logEvent('VISITOR_EXIT', 'info', { visitorId: id, registeredBy: session.userId });

        return NextResponse.json({ success: true, data });

    } catch (error: any) {
        console.error('[VISITORS] PATCH error:', error);
        return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
    }
}

/**
 * GET /api/visitors
 * List visitors (filtered by condo)
 */
export async function GET(request: NextRequest) {
    try {
        const session = await getSessionFromReq(request);

        if (!session) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const condo_id = searchParams.get('condo_id');
        const present = searchParams.get('present'); // "true" for only present visitors

        let query = supabaseAdmin
            .from('visitors')
            .select('*, unit:units(bloco, numero_unidade), registrado_por:users!registrado_por_user_id(nome)')
            .order('data_hora_entrada', { ascending: false });

        // Síndico/porteiro can only see their own condo
        if (!session.isSuperadmin) {
            query = query.eq('condo_id', session.condoId);
        } else if (condo_id) {
            query = query.eq('condo_id', condo_id);
        }

        // Filter for present visitors (no exit time)
        if (present === 'true') {
            query = query.is('data_hora_saida', null);
        } else {
            query = query.not('data_hora_saida', 'is', null).limit(100);
        }

        const { data, error } = await query;

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ data });

    } catch (error: any) {
        console.error('[VISITORS] GET error:', error);
        return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
    }
}
