
import { supabaseAdmin, logEvent } from '@/lib/supabase/admin';

/**
 * SERVICE: Notification Logic
 * Handles sending WhatsApp and Email
 */

interface NotificationPayload {
    delivery_id: string;
    [key: string]: any;
}

export const NotificationService = {
    /**
     * Send WhatsApp Message (Mock / Placeholder for Business API)
     */
    async sendWhatsApp(to: string, template: string, payload: NotificationPayload): Promise<boolean> {
        console.log(`[WHATSAPP_MOCK] Sending to ${to} template ${template} payload:`, payload);

        // In production, you would call:
        // await fetch('https://graph.facebook.com/v17.0/PHONE_NUMBER_ID/messages', { ... })

        // Simulate network delay
        await new Promise(r => setTimeout(r, 500));

        // Return success
        return true;
    },

    /**
     * Send Email (Mock / Placeholder for SMTP/SendGrid)
     */
    async sendEmail(to: string, template: string, payload: NotificationPayload): Promise<boolean> {
        console.log(`[EMAIL_MOCK] Sending to ${to} template ${template} payload:`, payload);

        // In production:
        // await transporter.sendMail({ ... })

        await new Promise(r => setTimeout(r, 500));

        return true;
    }
};

/**
 * Process a single notification record
 */
export async function processNotification(notification: any) {
    try {
        const { channel, to_address, template_name, payload, attempts = 0 } = notification;

        if (!to_address) {
            throw new Error('No address provided');
        }

        let success = false;

        if (channel === 'whatsapp') {
            success = await NotificationService.sendWhatsApp(to_address, template_name, payload);
        } else if (channel === 'email') {
            success = await NotificationService.sendEmail(to_address, template_name, payload);
        } else {
            throw new Error(`Unknown channel: ${channel}`);
        }

        if (success) {
            await supabaseAdmin
                .from('delivery_notifications')
                .update({
                    status: 'sent',
                    sent_at: new Date().toISOString(),
                    last_error: null
                })
                .eq('id', notification.id);
        }

    } catch (error: any) {
        console.error(`[NOTIFICATION_PROCESS] Error processing ${notification.id}:`, error);

        const nextAttempt = (notification.attempts || 0) + 1;
        const maxAttempts = 3;
        const status = nextAttempt >= maxAttempts ? 'failed' : 'pending';

        // Exponential backoff: 5m, 25m, 125m... roughly 
        // Or simpler: now + 5 * attempt minutes
        const minutes = 5 * Math.pow(2, nextAttempt - 1); // 5, 10, 20...
        const scheduled_at = new Date(Date.now() + minutes * 60000).toISOString();

        await supabaseAdmin
            .from('delivery_notifications')
            .update({
                status: status,
                attempts: nextAttempt,
                last_error: error.message || 'Unknown error',
                scheduled_at: status === 'pending' ? scheduled_at : undefined
            })
            .eq('id', notification.id);

        await logEvent('NOTIFICATION_FAILED', 'error', {
            notificationId: notification.id,
            error: error.message,
            attempt: nextAttempt
        });
    }
}
