import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import crypto from 'crypto';

interface MercadoPagoWebhook {
    action: string;
    api_version: string;
    data: {
        id: string;
    };
    date_created: string;
    id: number;
    live_mode: boolean;
    type: string;
    user_id: string;
}

export async function POST(req: NextRequest) {
    try {
        // Get raw body for signature validation
        const body = await req.text();
        const payload: MercadoPagoWebhook = JSON.parse(body);

        // Validate webhook signature (Mercado Pago uses x-signature header)
        const signature = req.headers.get('x-signature');
        const xRequestId = req.headers.get('x-request-id');

        if (!signature || !xRequestId) {
            console.error('[Webhook] Missing signature or request ID');
            return NextResponse.json({ error: 'Invalid webhook' }, { status: 400 });
        }

        // Extract timestamp and hash from signature
        const parts = signature.split(',');
        const tsMatch = parts.find(p => p.startsWith('ts='));
        const hashMatch = parts.find(p => p.startsWith('v1='));

        if (!tsMatch || !hashMatch) {
            console.error('[Webhook] Invalid signature format');
            return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
        }

        const timestamp = tsMatch.split('=')[1];
        const hash = hashMatch.split('=')[1];

        // Verify signature (if webhook secret is configured)
        const webhookSecret = process.env.MERCADOPAGO_WEBHOOK_SECRET;
        if (webhookSecret) {
            const dataId = payload.data?.id || '';
            const manifest = `id:${dataId};request-id:${xRequestId};ts:${timestamp};`;
            const hmac = crypto.createHmac('sha256', webhookSecret);
            hmac.update(manifest);
            const calculatedHash = hmac.digest('hex');

            if (calculatedHash !== hash) {
                console.error('[Webhook] Signature validation failed');
                return NextResponse.json({ error: 'Invalid signature' }, { status: 403 });
            }
        }

        // Get supabase admin client (webhooks need full access)
        const supabase = await createClient();

        // Log webhook for debugging
        const { error: logError } = await supabase
            .from('payment_webhooks_log')
            .insert([{
                provider: 'mercadopago',
                event_type: payload.type,
                provider_id: payload.data?.id || null,
                payload: payload,
                headers: {
                    signature,
                    request_id: xRequestId,
                },
                idempotency_key: `${payload.type}-${payload.data?.id}-${payload.id}`,
            }]);

        if (logError) {
            console.error('[Webhook] Failed to log:', logError);
        }

        // Process only payment events
        if (payload.type !== 'payment') {
            console.log('[Webhook] Ignoring non-payment event:', payload.type);
            return NextResponse.json({ status: 'ignored' });
        }

        // Fetch payment details from Mercado Pago
        const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
        if (!accessToken) {
            console.error('[Webhook] Missing access token');
            return NextResponse.json({ error: 'Server config error' }, { status: 500 });
        }

        const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${payload.data.id}`, {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
            },
        });

        if (!mpResponse.ok) {
            console.error('[Webhook] Failed to fetch payment from MP');
            return NextResponse.json({ error: 'Provider error' }, { status: 500 });
        }

        const paymentData = await mpResponse.json();

        // Find payment in our database
        const { data: existingPayment, error: fetchError } = await supabase
            .from('payments')
            .select('*')
            .eq('provider_payment_id', paymentData.id)
            .maybeSingle();

        if (fetchError) {
            console.error('[Webhook] Database fetch error:', fetchError);
            return NextResponse.json({ error: 'Database error' }, { status: 500 });
        }

        if (!existingPayment) {
            console.log('[Webhook] Payment not found in database:', paymentData.id);
            return NextResponse.json({ status: 'payment_not_found' });
        }

        // Update payment status based on Mercado Pago status
        let newStatus: string = existingPayment.status;

        if (paymentData.status === 'approved') {
            newStatus = 'paid';
        } else if (paymentData.status === 'rejected') {
            newStatus = 'failed';
        } else if (paymentData.status === 'cancelled') {
            newStatus = 'cancelled';
        } else if (paymentData.status === 'in_process') {
            newStatus = 'processing';
        }

        // Only update if status changed
        if (newStatus !== existingPayment.status) {
            const { error: updateError } = await supabase
                .from('payments')
                .update({
                    status: newStatus,
                    provider_transaction_id: paymentData.transaction_id || null,
                    metadata: {
                        ...existingPayment.metadata,
                        webhook_data: paymentData,
                        updated_at: new Date().toISOString(),
                    }
                })
                .eq('id', existingPayment.id);

            if (updateError) {
                console.error('[Webhook] Failed to update payment:', updateError);
                return NextResponse.json({ error: 'Update failed' }, { status: 500 });
            }

            console.log(`[Webhook] Payment ${existingPayment.id} updated: ${existingPayment.status} → ${newStatus}`);

            // Mark webhook as processed
            await supabase
                .from('payment_webhooks_log')
                .update({ processed: true, processed_at: new Date().toISOString() })
                .eq('idempotency_key', `${payload.type}-${payload.data?.id}-${payload.id}`);
        } else {
            console.log(`[Webhook] Payment ${existingPayment.id} status unchanged: ${newStatus}`);
        }

        return NextResponse.json({ status: 'ok', payment_status: newStatus });

    } catch (error: any) {
        console.error('[Webhook] Error:', error);
        return NextResponse.json({
            error: 'Internal server error',
            message: error.message
        }, { status: 500 });
    }
}

// Health check endpoint
export async function GET() {
    return NextResponse.json({
        status: 'ok',
        endpoint: '/api/webhooks/mercadopago',
        provider: 'mercadopago'
    });
}
