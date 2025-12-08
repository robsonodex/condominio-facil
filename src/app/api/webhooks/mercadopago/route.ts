import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import crypto from 'crypto';

// Mercado Pago Webhook
// Receives payment notifications and updates invoice/subscription status

const MP_ACCESS_TOKEN = process.env.MERCADOPAGO_ACCESS_TOKEN;
const MP_WEBHOOK_SECRET = process.env.MERCADOPAGO_WEBHOOK_SECRET;

// ========================================
// SEGURANÇA: Idempotência em memória (para produção usar Redis)
// ========================================
const processedPayments = new Set<string>();
const IDEMPOTENCY_WINDOW = 60 * 60 * 1000; // 1 hora

// Limpar pagamentos antigos periodicamente
setInterval(() => {
    processedPayments.clear();
}, IDEMPOTENCY_WINDOW);

// Validate webhook signature from Mercado Pago
function validateSignature(request: NextRequest, body: string): boolean {
    // ========================================
    // SEGURANÇA: NUNCA permitir bypass de validação
    // ========================================
    if (!MP_WEBHOOK_SECRET) {
        console.error('CRITICAL: MERCADOPAGO_WEBHOOK_SECRET not configured');
        return false; // BLOQUEAR - nunca permitir sem secret
    }

    const xSignature = request.headers.get('x-signature');
    const xRequestId = request.headers.get('x-request-id');

    if (!xSignature || !xRequestId) {
        console.error('Missing x-signature or x-request-id headers');
        return false;
    }

    // Parse x-signature header (format: ts=xxx,v1=xxx)
    const parts: Record<string, string> = {};
    xSignature.split(',').forEach(part => {
        const [key, value] = part.split('=');
        if (key && value) parts[key.trim()] = value.trim();
    });

    const ts = parts['ts'];
    const v1 = parts['v1'];

    if (!ts || !v1) {
        console.error('Invalid x-signature format');
        return false;
    }

    // Get data_id from query params
    const url = new URL(request.url);
    const dataId = url.searchParams.get('data.id') || url.searchParams.get('id') || '';

    // Build manifest string
    const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`;

    // Calculate HMAC-SHA256
    const hmac = crypto.createHmac('sha256', MP_WEBHOOK_SECRET);
    hmac.update(manifest);
    const calculatedSignature = hmac.digest('hex');

    const isValid = calculatedSignature === v1;
    if (!isValid) {
        console.error('Webhook signature validation failed');
    }

    return isValid;
}

export async function POST(request: NextRequest) {
    try {
        // ========================================
        // SEGURANÇA: Bloquear se secret não configurado
        // ========================================
        if (!MP_WEBHOOK_SECRET) {
            console.error('MERCADOPAGO_WEBHOOK_SECRET não configurado');
            return NextResponse.json(
                { error: 'Webhook não configurado' },
                { status: 503 }
            );
        }

        // Clone request to read body as text for validation
        const bodyText = await request.text();
        const body = JSON.parse(bodyText);

        // Validate webhook signature
        if (!validateSignature(request, bodyText)) {
            console.error('Invalid webhook signature - possível ataque');
            return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
        }

        // Webhook types: payment, merchant_order
        if (body.type !== 'payment' && body.action !== 'payment.updated') {
            return NextResponse.json({ received: true });
        }

        const paymentId = body.data?.id;
        if (!paymentId) {
            return NextResponse.json({ error: 'No payment ID' }, { status: 400 });
        }

        // ========================================
        // SEGURANÇA: Idempotência - verificar se já processado
        // ========================================
        const idempotencyKey = `payment_${paymentId}`;
        if (processedPayments.has(idempotencyKey)) {
            console.log(`Payment ${paymentId} já processado - ignorando duplicata`);
            return NextResponse.json({ received: true, status: 'already_processed' });
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
            console.error('Error fetching payment from MP');
            return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
        }

        const payment = await paymentResponse.json();
        const supabase = await createClient();
        const condoId = payment.external_reference;
        const paymentIdStr = paymentId.toString();

        // ========================================
        // Tratamento COMPLETO de todos os status do Mercado Pago
        // ========================================
        switch (payment.status) {
            case 'approved':
                // ========================================
                // CORREÇÃO: Atualizar por gateway_payment_id, não condo_id
                // ========================================
                // Primeiro, tentar atualizar invoice existente pelo gateway_payment_id
                const { data: invoiceByGateway } = await supabase
                    .from('invoices')
                    .update({
                        status: 'pago',
                        data_pagamento: new Date().toISOString(),
                    })
                    .eq('gateway_payment_id', paymentIdStr)
                    .select()
                    .single();

                // Se não encontrou por gateway_payment_id, tentar por gateway_id
                if (!invoiceByGateway) {
                    await supabase
                        .from('invoices')
                        .update({
                            status: 'pago',
                            data_pagamento: new Date().toISOString(),
                            gateway_payment_id: paymentIdStr, // Salvar para futuras referências
                        })
                        .eq('gateway_id', paymentIdStr)
                        .is('data_pagamento', null); // Só atualiza se ainda não foi pago
                }

                // Release subscription (activate)
                if (condoId) {
                    await supabase.rpc('release_subscription', {
                        p_condo_id: condoId,
                        p_meses: 1,
                    });
                }

                // Marcar como processado APÓS sucesso
                processedPayments.add(idempotencyKey);

                console.log(`Payment APPROVED: ${paymentIdStr} for condo ${condoId}`);
                break;

            case 'pending':
            case 'in_process':
                // Pagamento pendente - não fazer nada
                console.log(`Payment PENDING: ${paymentIdStr}`);
                break;

            case 'rejected':
            case 'cancelled':
                // Pagamento rejeitado/cancelado
                await supabase
                    .from('invoices')
                    .update({ status: 'cancelado' })
                    .eq('gateway_payment_id', paymentIdStr);

                processedPayments.add(idempotencyKey);
                console.log(`Payment REJECTED/CANCELLED: ${paymentIdStr}`);
                break;

            case 'refunded':
                // Reembolso - reverter status da assinatura
                await supabase
                    .from('invoices')
                    .update({ status: 'cancelado' })
                    .eq('gateway_payment_id', paymentIdStr);

                // Bloquear assinatura se foi reembolsado
                if (condoId) {
                    await supabase
                        .from('subscriptions')
                        .update({
                            status: 'suspenso',
                            motivo_bloqueio: 'Pagamento reembolsado',
                        })
                        .eq('condo_id', condoId);
                }

                processedPayments.add(idempotencyKey);
                console.log(`Payment REFUNDED: ${paymentIdStr}`);
                break;

            case 'charged_back':
                // Chargeback - situação grave, bloquear imediatamente
                await supabase
                    .from('invoices')
                    .update({ status: 'cancelado' })
                    .eq('gateway_payment_id', paymentIdStr);

                if (condoId) {
                    await supabase
                        .from('subscriptions')
                        .update({
                            status: 'suspenso',
                            bloqueado: true,
                            motivo_bloqueio: 'CHARGEBACK - Contestação de pagamento',
                        })
                        .eq('condo_id', condoId);
                }

                // TODO: Notificar admin sobre chargeback
                processedPayments.add(idempotencyKey);
                console.error(`CHARGEBACK DETECTED: ${paymentIdStr} - AÇÃO NECESSÁRIA`);
                break;

            case 'in_mediation':
                // Mediação - aguardar resolução
                console.log(`Payment IN MEDIATION: ${paymentIdStr} - aguardando resolução`);
                break;

            default:
                console.log(`Unknown payment status: ${payment.status}`);
        }

        return NextResponse.json({ received: true, status: payment.status });
    } catch (error: any) {
        console.error('Webhook error:', error.message);
        return NextResponse.json(
            { error: 'Webhook error' },
            { status: 500 }
        );
    }
}

// Verification endpoint for Mercado Pago
export async function GET(request: NextRequest) {
    return NextResponse.json({
        status: 'ok',
        message: 'Webhook endpoint active',
        configured: !!MP_WEBHOOK_SECRET,
    });
}
