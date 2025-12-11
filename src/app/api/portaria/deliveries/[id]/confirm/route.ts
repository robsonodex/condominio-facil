
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, getSessionFromReq, logEvent } from '@/lib/supabase/admin';

/**
 * POST /api/portaria/deliveries/[id]/confirm
 * Resident confirms collection
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await getSessionFromReq(request);
        const { id } = await params;

        if (!session) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        // Check if delivery exists and verify ownership (resident) or permission (porteiro/admin)
        const { data: delivery, error: fetchError } = await supabaseAdmin
            .from('deliveries')
            .select('*')
            .eq('id', id)
            .single();

        if (fetchError || !delivery) {
            return NextResponse.json({ error: 'Entrega não encontrada' }, { status: 404 });
        }

        // Logic: Who can confirm?
        // 1. Resident of the unit (or the specific resident_id?)
        // 2. Porteiro/Admin (marking as collected manually)

        let canConfirm = false;

        if (session.isSuperadmin || ['porteiro', 'sindico', 'admin'].includes(session.role)) {
            // Staff can confirm (mark as collected)
            if (session.condoId && session.condoId !== delivery.condo_id && !session.isSuperadmin) {
                canConfirm = false;
            } else {
                canConfirm = true;
            }
        } else {
            // Resident
            // Check if user is the resident or linked to the unit
            const { data: residentData } = await supabaseAdmin
                .from('residents')
                .select('id, unit_id')
                .eq('user_id', session.userId)
                .single();

            if (residentData) {
                // Allow if resident matches delivery resident OR resident is from same unit?
                // Strict: only if resident_id matches, or if unit_id matches
                if (delivery.resident_id === residentData.id || delivery.unit_id === residentData.unit_id) {
                    canConfirm = true;
                }
            }
        }

        if (!canConfirm) {
            return NextResponse.json({ error: 'Permissão negada para confirmar esta entrega' }, { status: 403 });
        }

        const { data, error } = await supabaseAdmin
            .from('deliveries')
            .update({
                status: 'collected',
                // optionally received_at update or separate 'collected_at' column if it existed, 
                // but usually received_at is when it arrived at portaria.
                // We'll trust status change is enough or add a note/log.
            })
            .eq('id', id)
            .select()
            .single();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        await logEvent('DELIVERY_COLLECTED', 'info', { deliveryId: id, collectedBy: session.userId });

        return NextResponse.json({ status: 'collected', delivery: data });

    } catch (error: any) {
        console.error('[DELIVERIES] CONFIRM error:', error);
        return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
    }
}
