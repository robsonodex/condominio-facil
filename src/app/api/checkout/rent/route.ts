import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createServiceRoleClient } from '@supabase/supabase-js';

const MP_ACCESS_TOKEN = process.env.MERCADOPAGO_ACCESS_TOKEN;
const MP_API_URL = 'https://api.mercadopago.com';

/**
 * POST /api/checkout/rent
 * Gera boleto/PIX para fatura de aluguel
 */
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        const body = await request.json();

        // Validar campos
        if (!body.invoice_id && !body.contract_id) {
            return NextResponse.json({
                error: 'Informe invoice_id ou contract_id'
            }, { status: 400 });
        }

        const supabaseAdmin = createServiceRoleClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        let invoice: any;
        let contract: any;
        let tenant: any;

        // Se já tem invoice, buscar
        if (body.invoice_id) {
            const { data: inv, error } = await supabaseAdmin
                .from('rent_invoices')
                .select(`
                    *,
                    contract:rental_contracts(
                        *,
                        tenant:users!rental_contracts_tenant_id_fkey(nome, email, cpf),
                        unit:units(numero, bloco),
                        condo:condos(nome)
                    )
                `)
                .eq('id', body.invoice_id)
                .single();

            if (error || !inv) {
                return NextResponse.json({ error: 'Fatura não encontrada' }, { status: 404 });
            }

            invoice = inv;
            contract = inv.contract;
            tenant = contract.tenant;
        } else {
            // Criar nova fatura para o contrato
            const { data: cont, error: contError } = await supabaseAdmin
                .from('rental_contracts')
                .select(`
                    *,
                    tenant:users!rental_contracts_tenant_id_fkey(nome, email, cpf),
                    unit:units(numero, bloco),
                    condo:condos(nome)
                `)
                .eq('id', body.contract_id)
                .single();

            if (contError || !cont) {
                return NextResponse.json({ error: 'Contrato não encontrado' }, { status: 404 });
            }

            contract = cont;
            tenant = cont.tenant;

            // Criar fatura
            const referenceMonth = new Date();
            referenceMonth.setDate(1);

            const dueDate = new Date(referenceMonth);
            dueDate.setDate(contract.billing_day);

            const total = parseFloat(contract.monthly_rent) + (contract.include_condo_fee ? 0 : 0); // TODO: buscar taxa de condo

            const { data: newInvoice, error: invError } = await supabaseAdmin
                .from('rent_invoices')
                .insert({
                    contract_id: body.contract_id,
                    invoice_number: `ALG-${Date.now()}`,
                    reference_month: referenceMonth.toISOString().split('T')[0],
                    due_date: body.due_date || dueDate.toISOString().split('T')[0],
                    rent_amount: contract.monthly_rent,
                    condo_fee: 0,
                    additional_charges: 0,
                    total: total,
                    payment_method: body.payment_method || 'any',
                    status: 'pending'
                })
                .select()
                .single();

            if (invError) {
                console.error('Error creating invoice:', invError);
                return NextResponse.json({ error: invError.message }, { status: 500 });
            }

            invoice = newInvoice;
        }

        // Verificar Mercado Pago
        if (!MP_ACCESS_TOKEN) {
            return NextResponse.json({
                success: true,
                invoice_id: invoice.id,
                message: 'Fatura criada (Mercado Pago não configurado)',
                boleto_url: null,
                pix_qr: null
            });
        }

        // Determinar método de pagamento
        const paymentMethod = body.payment_method || invoice.payment_method || 'boleto';

        // Preparar dados do pagador
        const payerCpf = body.payer?.cpf_cnpj || tenant?.cpf || '';
        const payerEmail = body.payer?.email || tenant?.email || '';
        const payerName = body.payer?.name || tenant?.nome || '';

        let mpResponse: any;
        let boletoUrl: string | null = null;
        let barcode: string | null = null;
        let pixQr: string | null = null;
        let pixCode: string | null = null;

        if (paymentMethod === 'pix') {
            // Criar pagamento PIX
            const pixPayload = {
                transaction_amount: parseFloat(invoice.total),
                description: `Aluguel - ${contract.unit?.numero || ''} - ${invoice.reference_month}`,
                payment_method_id: 'pix',
                payer: {
                    email: payerEmail,
                    first_name: payerName.split(' ')[0],
                    last_name: payerName.split(' ').slice(1).join(' ') || '-',
                    identification: {
                        type: payerCpf.length === 11 ? 'CPF' : 'CNPJ',
                        number: payerCpf.replace(/\D/g, '')
                    }
                },
                external_reference: invoice.id,
                notification_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/mercadopago`
            };

            const response = await fetch(`${MP_API_URL}/v1/payments`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${MP_ACCESS_TOKEN}`,
                    'X-Idempotency-Key': `rent-${invoice.id}`
                },
                body: JSON.stringify(pixPayload)
            });

            mpResponse = await response.json();

            if (response.ok) {
                pixQr = mpResponse.point_of_interaction?.transaction_data?.qr_code_base64;
                pixCode = mpResponse.point_of_interaction?.transaction_data?.qr_code;
            }
        } else {
            // Criar boleto
            const boletoPayload = {
                transaction_amount: parseFloat(invoice.total),
                description: `Aluguel - ${contract.unit?.numero || ''} - ${invoice.reference_month}`,
                payment_method_id: 'bolbradesco',
                payer: {
                    email: payerEmail,
                    first_name: payerName.split(' ')[0],
                    last_name: payerName.split(' ').slice(1).join(' ') || '-',
                    identification: {
                        type: payerCpf.length === 11 ? 'CPF' : 'CNPJ',
                        number: payerCpf.replace(/\D/g, '')
                    }
                },
                date_of_expiration: new Date(invoice.due_date + 'T23:59:59-03:00').toISOString(),
                external_reference: invoice.id,
                notification_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/mercadopago`
            };

            const response = await fetch(`${MP_API_URL}/v1/payments`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${MP_ACCESS_TOKEN}`,
                    'X-Idempotency-Key': `rent-boleto-${invoice.id}`
                },
                body: JSON.stringify(boletoPayload)
            });

            mpResponse = await response.json();

            if (response.ok) {
                boletoUrl = mpResponse.transaction_details?.external_resource_url;
                barcode = mpResponse.barcode?.content || mpResponse.transaction_details?.digitable_line;
            }
        }

        // Atualizar fatura com dados do MP
        await supabaseAdmin
            .from('rent_invoices')
            .update({
                provider_id: mpResponse?.id?.toString(),
                boleto_url: boletoUrl,
                barcode: barcode,
                pix_qr: pixQr,
                pix_code: pixCode,
                updated_at: new Date().toISOString()
            })
            .eq('id', invoice.id);

        // Registrar log
        await supabaseAdmin.from('payment_logs').insert({
            invoice_id: invoice.id,
            condo_id: contract.condo_id,
            event_type: 'rent_payment.created',
            status: mpResponse?.status || 'pending',
            provider: 'mercadopago',
            provider_payment_id: mpResponse?.id?.toString(),
            raw_payload: mpResponse
        });

        return NextResponse.json({
            success: true,
            invoice_id: invoice.id,
            provider_id: mpResponse?.id,
            boleto_url: boletoUrl,
            barcode: barcode,
            pix_qr: pixQr,
            pix_code: pixCode,
            status: mpResponse?.status
        });

    } catch (error: any) {
        console.error('Rent checkout error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
