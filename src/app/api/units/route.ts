import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, getSessionFromReq, logEvent } from '@/lib/supabase/admin';

/**
 * POST /api/units
 * Create a new unit
 */
export async function POST(request: NextRequest) {
    try {
        const session = await getSessionFromReq(request);

        if (!session) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        if (!session.isSindico && !session.isSuperadmin) {
            return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
        }

        const body = await request.json();
        const { condo_id, bloco, numero_unidade, metragem, vaga, observacoes } = body;

        // Validate required fields
        if (!condo_id || !numero_unidade) {
            return NextResponse.json({ error: 'Campos obrigatórios: condo_id, numero_unidade' }, { status: 400 });
        }

        // Validate síndico can only create for their own condo
        if (session.isSindico && session.condoId !== condo_id) {
            return NextResponse.json({ error: 'Acesso negado ao condomínio' }, { status: 403 });
        }

        // Insert unit
        const { data, error } = await supabaseAdmin.from('units').insert({
            condo_id,
            bloco: bloco || null,
            numero_unidade,
            metragem: metragem ? parseFloat(metragem) : null,
            vaga: vaga || null,
            observacoes: observacoes || null,
        }).select().single();

        if (error) {
            console.error('[UNITS] Insert error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        await logEvent('UNIT_CREATED', 'info', { unitId: data.id, numero: numero_unidade, createdBy: session.userId });

        return NextResponse.json({ success: true, data }, { status: 201 });

    } catch (error: any) {
        console.error('[UNITS] Unexpected error:', error);
        return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
    }
}

/**
 * PUT /api/units
 * Update an existing unit
 */
export async function PUT(request: NextRequest) {
    try {
        const session = await getSessionFromReq(request);

        if (!session) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        if (!session.isSindico && !session.isSuperadmin) {
            return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
        }

        const body = await request.json();
        const { id, bloco, numero_unidade, metragem, vaga, observacoes } = body;

        if (!id) {
            return NextResponse.json({ error: 'ID obrigatório' }, { status: 400 });
        }

        const { data, error } = await supabaseAdmin.from('units').update({
            bloco: bloco || null,
            numero_unidade,
            metragem: metragem ? parseFloat(metragem) : null,
            vaga: vaga || null,
            observacoes: observacoes || null,
            updated_at: new Date().toISOString(),
        }).eq('id', id).select().single();

        if (error) {
            console.error('[UNITS] Update error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, data });

    } catch (error: any) {
        console.error('[UNITS] PUT error:', error);
        return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
    }
}

/**
 * GET /api/units
 * List units (filtered by condo)
 */
export async function GET(request: NextRequest) {
    try {
        const session = await getSessionFromReq(request);

        if (!session) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const condo_id = searchParams.get('condo_id');

        let query = supabaseAdmin
            .from('units')
            .select('*')
            .order('bloco')
            .order('numero_unidade');

        // Síndico can only see their own condo
        if (!session.isSuperadmin) {
            query = query.eq('condo_id', session.condoId);
        } else if (condo_id) {
            query = query.eq('condo_id', condo_id);
        }

        const { data, error } = await query;

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ data });

    } catch (error: any) {
        console.error('[UNITS] GET error:', error);
        return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
    }
}

/**
 * DELETE /api/units
 * Delete a unit
 */
export async function DELETE(request: NextRequest) {
    try {
        const session = await getSessionFromReq(request);

        if (!session) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        if (!session.isSindico && !session.isSuperadmin) {
            return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'ID obrigatório' }, { status: 400 });
        }

        const { error } = await supabaseAdmin.from('units').delete().eq('id', id);

        if (error) {
            console.error('[UNITS] Delete error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        await logEvent('UNIT_DELETED', 'info', { unitId: id, deletedBy: session.userId });

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error('[UNITS] DELETE error:', error);
        return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
    }
}
