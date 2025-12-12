import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const MP_ACCESS_TOKEN = process.env.MERCADOPAGO_ACCESS_TOKEN;

/**
 * GET /api/cron/reconcile-payments
 * Reconcilia pagamentos pendentes com Mercado Pago
 * Deve ser chamado via Vercel Cron (1x por hora)
 */
export async function GET(req: NextRequest) {
    try {
        // Verify cron secret
        const authHeader = req.headers.get('authorization');
        const cronSecret = process.env.CRON_SECRET;

        if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
            console.log('[Reconcile] Unauthorized cron call');
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        console.log('[Reconcile] Starting payment reconciliation...');

        // 1. Buscar pagamentos pendentes (últimas 72h)
        const threeDaysAgo = new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString();

        const { data: pendingPayments, error } = await supabase
            .from('payments')
            .select('*')
            .eq('status', 'pending')
            .gte('created_at', threeDaysAgo)
            .not('provider_payment_id', 'is', null);

        if (error) {
            console.error('[Reconcile] Error fetching payments:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        console.log(`[Reconcile] Found ${pendingPayments?.length || 0} pending payments`);

        if (!pendingPayments || pendingPayments.length === 0) {
            return NextResponse.json({
                status: 'ok',
                message: 'No pending payments to reconcile'
            });
        }

        // 2. Verificar status no Mercado Pago
        let updated = 0;
        let expired = 0;
        let errors = 0;

        for (const payment of pendingPayments) {
            try {
                // Check if expired
                if (payment.expires_at && new Date(payment.expires_at) < new Date()) {
                    await supabase
                        .from('payments')
                        .update({
                            status: 'expired',
                            updated_at: new Date().toISOString()
                        })
                        .eq('id', payment.id);
                    expired++;
                    continue;
                }

                // Check with Mercado Pago
                if (MP_ACCESS_TOKEN && payment.provider_payment_id) {
                    const mpResponse = await fetch(
                        `https://api.mercadopago.com/v1/payments/${payment.provider_payment_id}`,
                        {
                            headers: { 'Authorization': `Bearer ${MP_ACCESS_TOKEN}` }
                        }
                    );

                    if (mpResponse.ok) {
                        const mpData = await mpResponse.json();

                        let newStatus = payment.status;
                        if (mpData.status === 'approved') newStatus = 'paid';
                        else if (mpData.status === 'rejected') newStatus = 'failed';
                        else if (mpData.status === 'cancelled') newStatus = 'cancelled';

                        if (newStatus !== payment.status) {
                            await supabase
                                .from('payments')
                                .update({
                                    status: newStatus,
                                    paid_at: newStatus === 'paid' ? new Date().toISOString() : null,
                                    updated_at: new Date().toISOString(),
                                    metadata: {
                                        ...payment.metadata,
                                        reconciled_at: new Date().toISOString(),
                                        mp_status: mpData.status
                                    }
                                })
                                .eq('id', payment.id);
                            updated++;
                        }
                    }
                }
            } catch (paymentError) {
                console.error(`[Reconcile] Error processing payment ${payment.id}:`, paymentError);
                errors++;
            }
        }

        // 3. Log reconciliation
        await supabase.from('system_logs').insert([{
            level: 'info',
            source: 'cron_reconcile_payments',
            message: `Reconciliation complete: ${updated} updated, ${expired} expired, ${errors} errors`,
            metadata: { updated, expired, errors, total: pendingPayments.length }
        }]);

        console.log(`[Reconcile] Complete: ${updated} updated, ${expired} expired, ${errors} errors`);

        return NextResponse.json({
            status: 'ok',
            processed: pendingPayments.length,
            updated,
            expired,
            errors
        });

    } catch (error: any) {
        console.error('[Reconcile] Error:', error);
        return NextResponse.json({
            error: error.message || 'Reconciliation failed'
        }, { status: 500 });
    }
}
