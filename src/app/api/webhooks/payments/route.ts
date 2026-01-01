import { createClient } from '@/lib/supabase/admin';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    const supabase = createClient();
    const { searchParams } = new URL(request.url);
    const provider = searchParams.get('provider'); // 'mercadopago' ou 'asaas'

    if (provider === 'mercadopago') {
        const body = await request.json();
        console.log('[Webhook] Mercado Pago Notification:', body);

        // Tipos de notificação Mercado Pago: 'payment' ou 'plan_filled' etc.
        if (body.type === 'payment') {
            const paymentId = body.data.id;

            // 1. Log da notificação
            await supabase.from('bank_webhooks').insert({
                provider: 'mercadopago',
                payload: body,
                received_at: new Date().toISOString()
            });

            // 2. Buscar status do pagamento no MP (idealmente via MercadoPagoService)
            // Aqui simplificamos buscando a cobrança no nosso banco pelo gateway_id
            const { data: billing } = await supabase
                .from('billings')
                .select('*')
                .eq('gateway_id', paymentId.toString())
                .single();

            if (billing) {
                // No cenário real: chamar API do MP para confirmar status 'approved'
                // Se aprovado, atualizar status
                await supabase
                    .from('billings')
                    .update({
                        status: 'paid',
                        paid_at: new Date().toISOString(),
                        payment_method: 'mercado_pago_webhook'
                    })
                    .eq('id', billing.id);

                // 3. Registrar pagamento na tabela billing_payments
                await supabase.from('billing_payments').insert({
                    billing_id: billing.id,
                    amount: billing.valor,
                    payment_date: new Date().toISOString(),
                    payment_method: 'mercadopago_webhook',
                    transaction_id: paymentId.toString(),
                    metadata: body
                });
            }
        }
    }

    return NextResponse.json({ received: true });
}
