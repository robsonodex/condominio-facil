
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, getSessionFromReq, logEvent } from '@/lib/supabase/admin';

/**
 * POST /api/portaria/deliveries/[id]/return
 * Porteiro/Admin registers return (devolução)
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await getSessionFromReq(request);
        const { id } = await params;

        if (!session) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        // Only staff
        if (!['porteiro', 'superadmin', 'sindico', 'admin'].includes(session.role)) {
            return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
        }

        const body = await request.json();
        const { reason } = body;

        const { data: delivery, error: fetchError } = await supabaseAdmin
            .from('deliveries')
            .select('condo_id')
            .eq('id', id)
            .single();

        if (fetchError || !delivery) {
            return NextResponse.json({ error: 'Entrega não encontrada' }, { status: 404 });
        }

        if (session.condoId && session.condoId !== delivery.condo_id && !session.isSuperadmin) {
            return NextResponse.json({ error: 'Acesso negado ao condomínio' }, { status: 403 });
        }

        const { data, error } = await supabaseAdmin
            .from('deliveries')
            .update({
                status: 'returned',
                notes: reason ? `Devolvido: ${reason}` : undefined
            })
            .eq('id', id)
            .select()
            .single();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        await logEvent('DELIVERY_RETURNED', 'info', { deliveryId: id, returnedBy: session.userId, reason });

        return NextResponse.json({ status: 'returned', delivery: data });

    } catch (error: any) {
        console.error('[DELIVERIES] RETURN error:', error);
        return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
    }
}
