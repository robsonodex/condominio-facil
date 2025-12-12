import { supabaseAdmin } from '@/lib/supabase/admin';
import { processNotification } from '@/lib/services/notification';

export async function runProcessNotifications() {
    try {
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
            return { message: 'No pending notifications' };
        }

        console.log(`[WORKER] Processing ${notifications.length} notifications`);

        const results = await Promise.allSettled(
            notifications.map(n => processNotification(n))
        );

        const successes = results.filter(r => r.status === 'fulfilled').length;
        const failures = results.filter(r => r.status === 'rejected').length;

        return {
            message: 'Processing complete',
            processed: notifications.length,
            successes,
            failures
        };

    } catch (error: any) {
        console.error('[WORKER] Error:', error);
        throw error;
    }
}
