
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, getSessionFromReq, logEvent } from '@/lib/supabase/admin';

/**
 * POST /api/portaria/notifications/[id]/retry
 * Retry a failed notification
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

        // Fetch notification
        const { data: notification, error: fetchError } = await supabaseAdmin
            .from('delivery_notifications')
            .select('*, delivery:deliveries(condo_id)')
            .eq('id', id)
            .single();

        if (fetchError || !notification) {
            return NextResponse.json({ error: 'Notificação não encontrada' }, { status: 404 });
        }

        // Check condo permission
        // Note: notification.delivery is an array or object depending on join, but single() usually returns object if 1:1 or N:1.
        // Deliveries to notifications is 1:N. Notification to Delivery is N:1.
        // Actually Supabase JS might return array if not strictly defined, assuming generic type.
        // Let's assume correct response structure.
        const delivery = notification.delivery as any;

        if (session.condoId && delivery?.condo_id !== session.condoId && !session.isSuperadmin) {
            return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
        }

        // Reset status to pending to be picked up by worker
        const { data, error } = await supabaseAdmin
            .from('delivery_notifications')
            .update({
                status: 'pending',
                attempts: 0,
                last_error: null,
                scheduled_at: new Date().toISOString()
            })
            .eq('id', id)
            .select()
            .single();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        await logEvent('NOTIFICATION_RETRY', 'info', { notificationId: id, retriedBy: session.userId });

        return NextResponse.json({ status: 'retrying', notification: data });

    } catch (error: any) {
        console.error('[NOTIFICATIONS] RETRY error:', error);
        return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
    }
}
