import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Mercado Pago Webhook
// Receives payment notifications and updates invoice/subscription status

const MP_ACCESS_TOKEN = process.env.MERCADOPAGO_ACCESS_TOKEN;

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        console.log('Mercado Pago Webhook:', JSON.stringify(body, null, 2));

        // Webhook types: payment, merchant_order
        if (body.type !== 'payment' && body.action !== 'payment.updated') {
            return NextResponse.json({ received: true });
        }

        const paymentId = body.data?.id;
        if (!paymentId) {
            return NextResponse.json({ error: 'No payment ID' }, { status: 400 });
        }

        // Get payment details from Mercado Pago
        const paymentResponse = await fetch(
            `https://api.mercadopago.com/v1/payments/${paymentId}`,
            {
                headers: {
                    'Authorization': `Bearer ${MP_ACCESS_TOKEN}`,
                },
            }
        );

        if (!paymentResponse.ok) {
            console.error('Error fetching payment:', await paymentResponse.text());
            return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
        }

        const payment = await paymentResponse.json();
        console.log('Payment details:', payment.status, payment.external_reference);

        const supabase = await createClient();
        const condoId = payment.external_reference;

        if (payment.status === 'approved') {
            // Update invoice status
            await supabase
                .from('invoices')
                .update({
                    status: 'pago',
                    data_pagamento: new Date().toISOString(),
                    gateway_id: paymentId.toString(),
                })
                .eq('condo_id', condoId)
                .eq('status', 'pendente')
                .order('created_at', { ascending: false })
                .limit(1);

            // Release subscription (activate)
            await supabase.rpc('release_subscription', {
                p_condo_id: condoId,
                p_meses: 1,
            });

            // Log email (payment confirmed)
            await supabase.from('email_logs').insert({
                condo_id: condoId,
                tipo: 'payment_confirmed',
                destinatario: payment.payer?.email || 'unknown',
                assunto: 'Pagamento confirmado - Condomínio Fácil',
                status: 'pendente', // Will be sent by email job
            });

            console.log('Payment approved and subscription released:', condoId);
        } else if (payment.status === 'rejected' || payment.status === 'cancelled') {
            // Update invoice as cancelled
            await supabase
                .from('invoices')
                .update({ status: 'cancelado' })
                .eq('gateway_id', paymentId.toString());
        }

        return NextResponse.json({ received: true, status: payment.status });
    } catch (error: any) {
        console.error('Webhook error:', error);
        return NextResponse.json(
            { error: error.message || 'Webhook error' },
            { status: 500 }
        );
    }
}

// Verification endpoint for Mercado Pago
export async function GET(request: NextRequest) {
    return NextResponse.json({ status: 'ok', message: 'Webhook endpoint active' });
}
