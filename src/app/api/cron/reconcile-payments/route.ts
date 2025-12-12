import { NextRequest, NextResponse } from 'next/server';
import { runReconcilePayments } from './task';

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

        const result = await runReconcilePayments();
        return NextResponse.json(result);

    } catch (error: any) {
        return NextResponse.json({
            error: error.message || 'Reconciliation failed'
        }, { status: 500 });
    }
}
