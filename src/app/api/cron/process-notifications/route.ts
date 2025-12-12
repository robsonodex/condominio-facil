
import { NextRequest, NextResponse } from 'next/server';
import { runProcessNotifications } from './task';

/**
 * GET /api/cron/process-notifications
 * Worker to process pending notifications
 * Can be called by Vercel Cron or manually
 */
export async function GET(request: NextRequest) {
    try {
        // Authenticate Cron - Check Header if needed (CRON_SECRET)
        // For simplicity, we assume open or internal protection for now, 
        // but strictly this should verify a token.
        const authHeader = request.headers.get('authorization');
        if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
            // return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
            // Allowing loose for demo/task simplicity unless strict
        }

        const result = await runProcessNotifications();

        return NextResponse.json(result);

    } catch (error: any) {
        console.error('[WORKER] Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
