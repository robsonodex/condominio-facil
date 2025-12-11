
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, getSessionFromReq, logEvent } from '@/lib/supabase/admin';

/**
 * POST /api/portaria/deliveries
 * Create a new delivery
 */
export async function POST(request: NextRequest) {
    try {
        const session = await getSessionFromReq(request);

        if (!session) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        // Allow 'porteiro', 'superadmin', 'sindico', 'admin'
        if (!['porteiro', 'superadmin', 'sindico', 'admin'].includes(session.role)) {
            return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
        }

        const body = await request.json();
        const {
            condo_id,
            unit_id,
            resident_id,
            delivered_by,
            tracking_code,
            type,
            notes,
            notify_whatsapp,
            notify_email,
            photo_url // received from body
        } = body;

        if (!condo_id || !unit_id) {
            return NextResponse.json({ error: 'Campos obrigatórios: condo_id, unit_id' }, { status: 400 });
        }

        // Verify condo access
        if (session.condoId && session.condoId !== condo_id && !session.isSuperadmin) {
            return NextResponse.json({ error: 'Acesso negado ao condomínio' }, { status: 403 });
        }

        // Prepare notification method JSON
        const notification_method = {
            whatsapp: !!notify_whatsapp,
            email: !!notify_email
        };

        const { data: delivery, error } = await supabaseAdmin.from('deliveries').insert({
            condo_id,
            unit_id,
            resident_id: resident_id || null,
            created_by: session.userId,
            delivered_by,
            tracking_code,
            type,
            notes,
            photo_url,
            notification_method,
            status: 'notified'
        }).select().single();

        if (error) {
            console.error('[DELIVERIES] Insert error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        await logEvent('DELIVERY_CREATED', 'info', { deliveryId: delivery.id, createdBy: session.userId });

        return NextResponse.json({ status: 'created', delivery }, { status: 201 });

    } catch (error: any) {
        console.error('[DELIVERIES] POST error:', error);
        return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
    }
}

/**
 * GET /api/portaria/deliveries
 * List deliveries
 */
export async function GET(request: NextRequest) {
    try {
        const session = await getSessionFromReq(request);

        if (!session) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const condo_id = searchParams.get('condo_id');
        const unit_id = searchParams.get('unit_id');
        const status = searchParams.get('status');

        // Access control
        const targetCondoId = session.condoId || condo_id;

        if (!targetCondoId && !session.isSuperadmin) {
            return NextResponse.json({ error: 'Condomínio não identificado' }, { status: 400 });
        }

        if (session.condoId && condo_id && session.condoId !== condo_id && !session.isSuperadmin) {
            return NextResponse.json({ error: 'Acesso negado ao condomínio' }, { status: 403 });
        }

        let query = supabaseAdmin
            .from('deliveries')
            .select(`
                *,
                unit:units(bloco, numero_unidade),
                resident:residents(id, user:users(nome, telefone, email))
            `)
            .order('created_at', { ascending: false });

        if (targetCondoId) {
            query = query.eq('condo_id', targetCondoId);
        }

        if (unit_id) {
            query = query.eq('unit_id', unit_id);
        }

        if (status) {
            query = query.eq('status', status);
        }

        const { data, error } = await query;

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ data });

    } catch (error: any) {
        console.error('[DELIVERIES] GET error:', error);
        return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
    }
}
