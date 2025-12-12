import { NextRequest, NextResponse } from 'next/server';
import { runHealthCheck } from '../health-check/task';
import { runManutencaoCheck } from '../manutencao-check/task';
import { runProcessNotifications } from '../process-notifications/task';
import { runReconcilePayments } from '../reconcile-payments/task';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    // Authenticate Cron - Check Header
    const authHeader = req.headers.get('authorization');
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const startTime = Date.now();
    console.log('[Master Cron] Starting execution...');

    // Run tasks in parallel to minimize total execution time
    // Use allSettled to ensure one failure doesn't stop others
    const results = await Promise.allSettled([
        runHealthCheck().then(res => ({ task: 'health-check', ...res })),
        runManutencaoCheck().then(res => ({ task: 'manutencao-check', ...res })),
        runProcessNotifications().then(res => ({ task: 'process-notifications', ...res })),
        runReconcilePayments().then(res => ({ task: 'reconcile-payments', ...res }))
    ]);

    const summary = results.map((r, index) => {
        const taskName = ['health-check', 'manutencao-check', 'process-notifications', 'reconcile-payments'][index];
        if (r.status === 'fulfilled') {
            return { task: taskName, status: 'ok', result: r.value };
        } else {
            console.error(`[Master Cron] Task ${taskName} failed:`, r.reason);
            return { task: taskName, status: 'error', error: r.reason?.message || String(r.reason) };
        }
    });

    console.log('[Master Cron] Execution finished in', Date.now() - startTime, 'ms');

    return NextResponse.json({
        timestamp: new Date().toISOString(),
        duration: Date.now() - startTime,
        summary
    });
}
