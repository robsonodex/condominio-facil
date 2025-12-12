import { NextRequest, NextResponse } from 'next/server';
import { runHealthCheck } from './task';

/**
 * GET /api/cron/health-check
 * Verifica saúde de todos os subsistemas e envia alertas se necessário
 * Roda a cada 15 minutos via Vercel Cron
 */
export async function GET(req: NextRequest) {
    try {
        // Verify cron secret
        const authHeader = req.headers.get('authorization');
        const cronSecret = process.env.CRON_SECRET;

        if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const result = await runHealthCheck();
        return NextResponse.json(result);

    } catch (error: any) {
        return NextResponse.json({
            status: 'error',
            error: error.message
        }, { status: 500 });
    }
}
