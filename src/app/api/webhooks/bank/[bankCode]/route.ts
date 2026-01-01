
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import crypto from 'crypto';

export async function POST(
    request: NextRequest,
    { params }: { params: { bankCode: string } }
) {
    // Await params as per Next.js 15+ changes if required, but standard signature usually allows sync params access in older versions or with await. 
    // However, in Next.js 15, params is a Promise. The provided code assumes sync params in the signature: `{ params }: { params: { bankCode: string } }`
    // But inside function: `const { bankCode } = params;`
    // I will stick to provided code.

    const supabase = await createClient();
    const { bankCode } = params;

    try {
        // 1. Receber payload
        const rawBody = await request.text();
        const payload = JSON.parse(rawBody);
        const headers = Object.fromEntries(request.headers.entries());

        // 2. Salvar webhook raw para auditoria
        const { data: webhook } = await supabase
            .from('bank_webhooks')
            .insert({
                bank_code: bankCode,
                webhook_type: detectWebhookType(payload, bankCode),
                raw_payload: payload,
                headers: headers,
                ip_address: request.headers.get('x-forwarded-for') || 'unknown',
                received_at: new Date().toISOString()
            })
            .select()
            .single();

        // 3. Validar assinatura do webhook (cada banco tem seu método)
        const isValid = await validateWebhookSignature(bankCode, rawBody, headers);

        if (!isValid) {
            console.error(`Webhook inválido do banco ${bankCode}`);
            await supabase
                .from('bank_webhooks')
                .update({
                    processing_result: { error: 'Assinatura inválida' },
                    processed: true,
                    processed_at: new Date().toISOString()
                })
                .eq('id', webhook.id);

            return NextResponse.json({ error: 'Assinatura inválida' }, { status: 401 });
        }

        // 4. Processar webhook baseado no banco
        const result = await processWebhook(supabase, bankCode, payload, webhook.id);

        // 5. Atualizar status do webhook
        await supabase
            .from('bank_webhooks')
            .update({
                processed: true,
                processed_at: new Date().toISOString(),
                billing_id: result.billingId,
                processing_result: result
            })
            .eq('id', webhook.id);

        return NextResponse.json({ success: true, result });

    } catch (error: any) {
        console.error(`Erro processando webhook banco ${bankCode}:`, error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

function detectWebhookType(payload: any, bankCode: string): string {
    switch (bankCode) {
        case '001': // Banco do Brasil
            if (payload.codigoEstadoTituloCobranca === '6') return 'payment';
            if (payload.codigoEstadoTituloCobranca === '7') return 'cancellation';
            return 'status_change';

        case '341': // Itaú
            if (payload.situacao_pagamento === 'REALIZADO') return 'payment';
            return 'status_change';

        case '237': // Bradesco
            if (payload.status === 'PAGO') return 'payment';
            return 'status_change';

        default:
            return 'unknown';
    }
}

async function validateWebhookSignature(
    bankCode: string,
    rawBody: string,
    headers: Record<string, string>
): Promise<boolean> {
    // Buscar chave de validação do banco
    const webhookSecret = process.env[`BANK_${bankCode}_WEBHOOK_SECRET`];

    if (!webhookSecret) {
        console.warn(`Webhook secret não configurado para banco ${bankCode}`);
        return true; // Em desenvolvimento, aceitar sem validação
    }

    switch (bankCode) {
        case '001': // Banco do Brasil - HMAC SHA256
            const bbSignature = headers['x-webhook-signature'];
            const bbExpected = crypto
                .createHmac('sha256', webhookSecret)
                .update(rawBody)
                .digest('hex');
            return bbSignature === bbExpected;

        case '341': // Itaú - HMAC SHA256
            const itauSignature = headers['x-itau-signature'];
            const itauExpected = crypto
                .createHmac('sha256', webhookSecret)
                .update(rawBody)
                .digest('hex');
            return itauSignature === itauExpected;

        case '237': // Bradesco
            const bradescoSignature = headers['authorization'];
            return bradescoSignature === `Bearer ${webhookSecret}`;

        default:
            return true;
    }
}

async function processWebhook(
    supabase: any,
    bankCode: string,
    payload: any,
    webhookId: string
): Promise<any> {
    let ourNumber: string = '';
    let amountPaid: number = 0;
    let paymentDate: Date = new Date();
    let creditDate: Date | null = null;
    let authenticationCode: string | null = null;
    let paymentChannel: string | null = null;

    // Extrair dados baseado no banco
    switch (bankCode) {
        case '001': // Banco do Brasil
            ourNumber = payload.numeroTituloCliente || payload.nossoNumero;
            amountPaid = payload.valorPago || payload.valorRecebido;
            paymentDate = new Date(payload.dataRecebimento || payload.dataPagamento);
            creditDate = payload.dataCredito ? new Date(payload.dataCredito) : null;
            authenticationCode = payload.codigoAutenticacaoPagamento;
            paymentChannel = payload.canalPagamento;
            break;

        case '341': // Itaú
            ourNumber = payload.dados_boleto?.numero_nosso_numero;
            amountPaid = parseFloat(payload.dados_boleto?.valor_pago || '0');
            paymentDate = new Date(payload.dados_boleto?.data_pagamento);
            creditDate = payload.dados_boleto?.data_credito ? new Date(payload.dados_boleto.data_credito) : null;
            authenticationCode = payload.dados_boleto?.codigo_autenticacao;
            break;

        case '237': // Bradesco
            ourNumber = payload.nossoNumero;
            amountPaid = payload.valorPago;
            paymentDate = new Date(payload.dataPagamento);
            creditDate = payload.dataCredito ? new Date(payload.dataCredito) : null;
            break;

        case '033': // Santander
            ourNumber = payload.nsu || payload.nossoNumero;
            amountPaid = payload.valor;
            paymentDate = new Date(payload.dataHoraPagamento);
            break;

        case '104': // Caixa
            ourNumber = payload.nossoNumero;
            amountPaid = payload.valorRecebido;
            paymentDate = new Date(payload.dataMovimento);
            break;

        default:
            throw new Error(`Banco ${bankCode} não suportado para webhooks`);
    }

    // Buscar cobrança pelo nosso número
    const { data: billing, error: billingError } = await supabase
        .from('billings')
        .select('*, bank_accounts!inner(bank_code)')
        .eq('our_number', ourNumber)
        .eq('bank_accounts.bank_code', bankCode)
        .single();

    if (billingError || !billing) {
        return {
            success: false,
            error: `Cobrança não encontrada: ${ourNumber}`,
            ourNumber
        };
    }

    // Verificar se já foi pago
    if (billing.status === 'paid') {
        return {
            success: false,
            error: 'Cobrança já está paga',
            billingId: billing.id,
            ourNumber
        };
    }

    // Calcular valores de multa/juros aplicados
    const fineApplied = amountPaid > billing.final_amount
        ? Math.min(billing.final_amount * (billing.fine_percentage || 2) / 100, amountPaid - billing.final_amount)
        : 0;

    const interestApplied = amountPaid > billing.final_amount + fineApplied
        ? amountPaid - billing.final_amount - fineApplied
        : 0;

    // Registrar pagamento
    const { data: payment, error: paymentError } = await supabase
        .from('billing_payments')
        .insert({
            billing_id: billing.id,
            condo_id: billing.condo_id,
            amount_paid: amountPaid,
            fine_applied: fineApplied,
            interest_applied: interestApplied,
            payment_date: paymentDate.toISOString().split('T')[0],
            credit_date: creditDate?.toISOString().split('T')[0],
            payment_method: 'boleto',
            source: 'webhook',
            authentication_code: authenticationCode,
            bank_channel: paymentChannel,
            notes: `Webhook ID: ${webhookId}`
        })
        .select()
        .single();

    if (paymentError) {
        throw new Error(`Erro ao registrar pagamento: ${paymentError.message}`);
    }

    // Atualizar status da cobrança
    const newStatus = amountPaid >= billing.final_amount ? 'paid' : 'partially_paid';

    await supabase
        .from('billings')
        .update({
            status: newStatus,
            paid_amount: amountPaid,
            payment_date: paymentDate.toISOString(),
            updated_at: new Date().toISOString()
        })
        .eq('id', billing.id);

    // Atualizar lote se todas as cobranças foram pagas
    await updateBatchStatus(supabase, billing.batch_id);

    // Registrar na conta corrente do condomínio (se existir módulo financeiro)
    await registerFinancialEntry(supabase, billing, amountPaid, paymentDate);

    // Log de auditoria
    await supabase.from('audit_logs').insert({
        condo_id: billing.condo_id,
        action: 'billing_paid',
        resource_type: 'billing',
        resource_id: billing.id,
        metadata: {
            our_number: ourNumber,
            amount_paid: amountPaid,
            payment_date: paymentDate.toISOString(),
            source: 'webhook',
            bank_code: bankCode
        }
    });

    // Enviar notificação de confirmação (opcional)
    await sendPaymentConfirmation(supabase, billing, amountPaid);

    return {
        success: true,
        billingId: billing.id,
        paymentId: payment.id,
        ourNumber,
        amountPaid,
        newStatus
    };
}

async function updateBatchStatus(supabase: any, batchId: string) {
    if (!batchId) return;

    const { data: billings } = await supabase
        .from('billings')
        .select('status')
        .eq('batch_id', batchId);

    if (!billings || billings.length === 0) return;

    const allPaid = billings.every((b: any) => b.status === 'paid');
    const somePaid = billings.some((b: any) => b.status === 'paid');

    let newStatus = 'registered';
    if (allPaid) {
        newStatus = 'paid';
    } else if (somePaid) {
        newStatus = 'partially_paid';
    }

    await supabase
        .from('billing_batches')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', batchId);
}

async function registerFinancialEntry(
    supabase: any,
    billing: any,
    amountPaid: number,
    paymentDate: Date
) {
    try {
        // Verificar se módulo financeiro existe
        const { data: hasFinanceiro } = await supabase.rpc('has_feature', {
            p_condo_id: billing.condo_id,
            p_feature_key: 'module_financeiro'
        });

        if (!hasFinanceiro) return;

        // Registrar receita
        await supabase.from('financial_entries').insert({
            condo_id: billing.condo_id,
            type: 'receita',
            category: 'taxa_condominial',
            description: `Pagamento ${billing.description} - Unidade ${billing.unit_id}`,
            amount: amountPaid,
            date: paymentDate.toISOString().split('T')[0],
            reference_type: 'billing',
            reference_id: billing.id,
            status: 'confirmed'
        });

    } catch (error) {
        console.error('Erro ao registrar entrada financeira:', error);
    }
}

async function sendPaymentConfirmation(supabase: any, billing: any, amountPaid: number) {
    try {
        // Buscar dados do morador
        const { data: resident } = await supabase
            .from('users')
            .select('nome, email, telefone')
            .eq('id', billing.resident_id)
            .single();

        if (!resident) return;

        // Enviar e-mail de confirmação
        await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/notifications/email`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                to: resident.email,
                template: 'payment_confirmed',
                data: {
                    residentName: resident.nome,
                    amount: amountPaid,
                    description: billing.description,
                    paymentDate: new Date().toLocaleDateString('pt-BR')
                }
            })
        });

    } catch (error) {
        console.error('Erro ao enviar confirmação de pagamento:', error);
    }
}
