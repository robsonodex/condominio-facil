import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createServiceRoleClient } from '@supabase/supabase-js';

// Mercado Pago Configuration
const MP_ACCESS_TOKEN = process.env.MERCADOPAGO_ACCESS_TOKEN;
const MP_API_URL = 'https://api.mercadopago.com';

interface BoletoRequest {
    condoId: string;
    unitId?: string;
    amount: number;
    payer: {
        name: string;
        email: string;
        cpf_cnpj: string;
    };
    due_date: string; // YYYY-MM-DD
    description?: string;
}

/**
 * POST /api/checkout/boleto
 * Emite boleto via Mercado Pago
 */
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();

        // 1. Verificar autenticação
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        // 2. Verificar se é síndico ou superadmin
        const { data: profile } = await supabase
            .from('users')
            .select('role, condo_id')
            .eq('id', user.id)
            .single();

        if (!profile || !['sindico', 'superadmin'].includes(profile.role)) {
            return NextResponse.json({
                error: 'Apenas síndicos e administradores podem emitir boletos'
            }, { status: 403 });
        }

        // 3. Parse e validar body
        const body: BoletoRequest = await request.json();

        if (!body.condoId || !body.amount || !body.payer || !body.due_date) {
            return NextResponse.json({
                error: 'Campos obrigatórios: condoId, amount, payer, due_date'
            }, { status: 400 });
        }

        if (!body.payer.name || !body.payer.email || !body.payer.cpf_cnpj) {
            return NextResponse.json({
                error: 'Payer deve conter: name, email, cpf_cnpj'
            }, { status: 400 });
        }

        // 4. Validar CPF/CNPJ (formato básico)
        const cpfCnpj = body.payer.cpf_cnpj.replace(/\D/g, '');
        if (cpfCnpj.length !== 11 && cpfCnpj.length !== 14) {
            return NextResponse.json({
                error: 'CPF deve ter 11 dígitos ou CNPJ 14 dígitos'
            }, { status: 400 });
        }

        // 5. Verificar permissão para o condomínio
        if (profile.role !== 'superadmin' && profile.condo_id !== body.condoId) {
            return NextResponse.json({
                error: 'Sem permissão para este condomínio'
            }, { status: 403 });
        }

        // 6. Usar service role para operações no banco
        const supabaseAdmin = createServiceRoleClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        // 7. Criar invoice no banco
        const { data: invoice, error: invoiceError } = await supabaseAdmin
            .from('invoices')
            .insert({
                condo_id: body.condoId,
                unit_id: body.unitId || null,
                valor: body.amount,
                data_vencimento: body.due_date,
                status: 'pendente',
                metodo_pagamento: 'boleto',
                payer_name: body.payer.name,
                payer_email: body.payer.email,
                payer_cpf_cnpj: cpfCnpj,
            })
            .select()
            .single();

        if (invoiceError || !invoice) {
            console.error('Invoice creation error:', invoiceError);
            return NextResponse.json({
                error: 'Erro ao criar fatura'
            }, { status: 500 });
        }

        // 8. Verificar se Mercado Pago está configurado
        if (!MP_ACCESS_TOKEN) {
            // Retorna invoice sem boleto real (modo desenvolvimento)
            return NextResponse.json({
                success: true,
                invoice_id: invoice.id,
                message: 'Fatura criada (Mercado Pago não configurado)',
                boleto_url: null,
                boleto_barcode: null,
            });
        }

        // 9. Criar boleto no Mercado Pago
        const paymentPayload = {
            transaction_amount: body.amount,
            description: body.description || `Fatura Condomínio - Venc. ${body.due_date}`,
            payment_method_id: 'bolbradesco', // Boleto Bradesco
            payer: {
                email: body.payer.email,
                first_name: body.payer.name.split(' ')[0],
                last_name: body.payer.name.split(' ').slice(1).join(' ') || '-',
                identification: {
                    type: cpfCnpj.length === 11 ? 'CPF' : 'CNPJ',
                    number: cpfCnpj
                }
            },
            date_of_expiration: new Date(body.due_date + 'T23:59:59-03:00').toISOString(),
            external_reference: invoice.id,
            notification_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/mercadopago`,
        };

        const mpResponse = await fetch(`${MP_API_URL}/v1/payments`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${MP_ACCESS_TOKEN}`,
                'X-Idempotency-Key': invoice.id, // Evita duplicação
            },
            body: JSON.stringify(paymentPayload),
        });

        const mpData = await mpResponse.json();

        if (!mpResponse.ok) {
            console.error('Mercado Pago error:', mpData);

            // Atualizar invoice com erro
            await supabaseAdmin
                .from('invoices')
                .update({
                    status: 'cancelado',
                    updated_at: new Date().toISOString()
                })
                .eq('id', invoice.id);

            return NextResponse.json({
                error: `Erro Mercado Pago: ${mpData.message || 'Falha ao gerar boleto'}`,
                details: mpData
            }, { status: 500 });
        }

        // 10. Extrair dados do boleto
        const boletoUrl = mpData.transaction_details?.external_resource_url;
        const boletoBarcode = mpData.barcode?.content || mpData.transaction_details?.digitable_line;
        const boletoExpiration = mpData.date_of_expiration?.split('T')[0];

        // 11. Atualizar invoice com dados do boleto
        const { error: updateError } = await supabaseAdmin
            .from('invoices')
            .update({
                provider_id: mpData.id?.toString(),
                provider_method: 'mercadopago',
                gateway_id: mpData.id?.toString(),
                boleto_url: boletoUrl,
                boleto_barcode: boletoBarcode,
                boleto_codigo: boletoBarcode,
                boleto_expiration: boletoExpiration,
                updated_at: new Date().toISOString()
            })
            .eq('id', invoice.id);

        if (updateError) {
            console.error('Update invoice error:', updateError);
        }

        // 12. Registrar log de pagamento
        await supabaseAdmin
            .from('payment_logs')
            .insert({
                invoice_id: invoice.id,
                condo_id: body.condoId,
                event_type: 'payment.created',
                status: mpData.status,
                provider: 'mercadopago',
                provider_payment_id: mpData.id?.toString(),
                raw_payload: mpData,
            });

        // 13. Retornar sucesso
        return NextResponse.json({
            success: true,
            invoice_id: invoice.id,
            boleto_url: boletoUrl,
            boleto_barcode: boletoBarcode,
            boleto_expiration: boletoExpiration,
            provider_id: mpData.id,
            status: mpData.status,
            provider_response: {
                id: mpData.id,
                status: mpData.status,
                status_detail: mpData.status_detail,
            }
        });

    } catch (error: any) {
        console.error('Boleto API error:', error);
        return NextResponse.json({
            error: error.message || 'Erro ao gerar boleto'
        }, { status: 500 });
    }
}
