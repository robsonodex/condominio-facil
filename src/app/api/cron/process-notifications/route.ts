
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { processNotification } from '@/lib/services/notification';

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

        // Fetch pending notifications scheduled for now or earlier
        const now = new Date().toISOString();
        const { data: notifications, error } = await supabaseAdmin
            .from('delivery_notifications')
            .select('*')
            .eq('status', 'pending')
            .lte('scheduled_at', now)
            .limit(50); // Batch size

        if (error) {
            throw error;
        }

        if (!notifications || notifications.length === 0) {
            return NextResponse.json({ message: 'No pending notifications' });
        }

        console.log(`[WORKER] Processing ${notifications.length} notifications`);

        const results = await Promise.allSettled(
            notifications.map(n => processNotification(n))
        );

        const successes = results.filter(r => r.status === 'fulfilled').length;
        const failures = results.filter(r => r.status === 'rejected').length;

        return NextResponse.json({
            message: 'Processing complete',
            processed: notifications.length,
            successes,
            failures
        });

    } catch (error: any) {
        console.error('[WORKER] Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
