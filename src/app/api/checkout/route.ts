import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, getSessionFromReq } from '@/lib/supabase/admin';

// Mercado Pago Configuration
const MP_ACCESS_TOKEN = process.env.MERCADOPAGO_ACCESS_TOKEN;
const MP_API_URL = 'https://api.mercadopago.com';

interface CheckoutRequest {
    condoId: string;
    planId: string;
    metodoPagamento: 'pix' | 'cartao' | 'boleto';
    cpfCnpj?: string;
}

// Create payment preference in Mercado Pago
async function createMercadoPagoPreference(
    condoId: string,
    valor: number,
    email: string,
    nome: string,
    metodoPagamento: string
) {
    const body = {
        items: [
            {
                title: 'Assinatura Condomínio Fácil',
                quantity: 1,
                unit_price: valor,
                currency_id: 'BRL',
            }
        ],
        payer: {
            email: email,
            first_name: nome,
        },
        payment_methods: {
            excluded_payment_types: metodoPagamento === 'pix'
                ? [{ id: 'credit_card' }, { id: 'debit_card' }, { id: 'ticket' }]
                : metodoPagamento === 'boleto'
                    ? [{ id: 'credit_card' }, { id: 'debit_card' }]
                    : [],
        },
        back_urls: {
            success: `${process.env.NEXT_PUBLIC_APP_URL}/assinatura?status=success`,
            failure: `${process.env.NEXT_PUBLIC_APP_URL}/assinatura?status=failure`,
            pending: `${process.env.NEXT_PUBLIC_APP_URL}/assinatura?status=pending`,
        },
        auto_return: 'approved',
        external_reference: condoId,
        notification_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/mercadopago`,
    };

    const response = await fetch(`${MP_API_URL}/checkout/preferences`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${MP_ACCESS_TOKEN}`,
        },
        body: JSON.stringify(body),
    });

    if (!response.ok) {
        const error = await response.text();
        console.error('Mercado Pago error:', error);
        throw new Error('Erro ao criar pagamento no Mercado Pago');
    }

    return await response.json();
}

// Create PIX payment directly
async function createPixPayment(
    condoId: string,
    valor: number,
    email: string,
    nome: string,
    cpfCnpj?: string
) {
    const body = {
        transaction_amount: valor,
        description: 'Assinatura Condomínio Fácil',
        payment_method_id: 'pix',
        payer: {
            email: email,
            first_name: nome,
            identification: cpfCnpj ? {
                type: cpfCnpj.length > 11 ? 'CNPJ' : 'CPF',
                number: cpfCnpj.replace(/\D/g, ''),
            } : undefined,
        },
        external_reference: condoId,
        notification_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/mercadopago`,
    };

    const response = await fetch(`${MP_API_URL}/v1/payments`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${MP_ACCESS_TOKEN}`,
            'X-Idempotency-Key': `${condoId}-${Date.now()}`,
        },
        body: JSON.stringify(body),
    });

    if (!response.ok) {
        const error = await response.text();
        console.error('Mercado Pago PIX error:', error);
        throw new Error('Erro ao criar PIX');
    }

    return await response.json();
}

export async function POST(request: NextRequest) {
    try {
        // ========================================
        // SEGURANÇA 1: Autenticação via getSessionFromReq
        // ========================================
        const session = await getSessionFromReq(request);
        if (!session) {
            console.log('[CHECKOUT] No session found');
            return NextResponse.json(
                { error: 'Não autorizado. Faça login para continuar.' },
                { status: 401 }
            );
        }

        console.log('[CHECKOUT] Session:', session.email, session.role);

        // Buscar perfil do usuário
        const { data: profile, error: profileError } = await supabaseAdmin
            .from('users')
            .select('id, email, nome, role, condo_id')
            .eq('id', session.userId)
            .single();

        if (profileError || !profile) {
            console.log('[CHECKOUT] Profile not found:', profileError);
            return NextResponse.json(
                { error: 'Perfil não encontrado.' },
                { status: 403 }
            );
        }

        const body: CheckoutRequest = await request.json();

        // ========================================
        // SEGURANÇA 2: Validação de pertencimento
        // ========================================
        if (!session.isSuperadmin) {
            if (!profile.condo_id || profile.condo_id !== body.condoId) {
                return NextResponse.json(
                    { error: 'Sem permissão para este condomínio.' },
                    { status: 403 }
                );
            }
            if (!session.isSindico) {
                return NextResponse.json(
                    { error: 'Apenas síndicos podem gerenciar pagamentos.' },
                    { status: 403 }
                );
            }
        }

        // ========================================
        // SEGURANÇA 3: Buscar valor do plano no banco
        // ========================================
        if (!body.planId) {
            return NextResponse.json(
                { error: 'Plano não informado.' },
                { status: 400 }
            );
        }

        const { data: plan, error: planError } = await supabaseAdmin
            .from('plans')
            .select('id, nome_plano, valor_mensal, ativo')
            .eq('id', body.planId)
            .eq('ativo', true)
            .single();

        if (planError || !plan) {
            return NextResponse.json(
                { error: 'Plano inválido ou inativo.' },
                { status: 400 }
            );
        }

        const valorCobrar = Number(plan.valor_mensal);

        // Validar condomínio existe
        const { data: condo } = await supabaseAdmin
            .from('condos')
            .select('id, nome, email_contato')
            .eq('id', body.condoId)
            .single();

        if (!condo) {
            return NextResponse.json(
                { error: 'Condomínio não encontrado.' },
                { status: 404 }
            );
        }

        let paymentResult;
        let invoiceData: any = {
            condo_id: body.condoId,
            valor: valorCobrar,
            status: 'pendente',
            data_vencimento: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            metodo_pagamento: body.metodoPagamento,
        };

        // Check if Mercado Pago is configured
        if (MP_ACCESS_TOKEN) {
            const emailPagador = condo.email_contato || profile.email;
            const nomePagador = profile.nome;

            if (body.metodoPagamento === 'pix') {
                paymentResult = await createPixPayment(
                    body.condoId,
                    valorCobrar,
                    emailPagador,
                    nomePagador,
                    body.cpfCnpj
                );
                invoiceData.gateway_id = paymentResult.id?.toString();
                invoiceData.gateway_payment_id = paymentResult.id?.toString();
                invoiceData.pix_code = paymentResult.point_of_interaction?.transaction_data?.qr_code;
                invoiceData.pix_qrcode = paymentResult.point_of_interaction?.transaction_data?.qr_code_base64;
            } else {
                paymentResult = await createMercadoPagoPreference(
                    body.condoId,
                    valorCobrar,
                    emailPagador,
                    nomePagador,
                    body.metodoPagamento
                );
                invoiceData.gateway_id = paymentResult.id;
                invoiceData.gateway_url = paymentResult.init_point;
            }
        } else {
            // Fallback: generate static PIX
            const pixKey = process.env.INTER_PIX_KEY || '57444727000185';
            invoiceData.pix_code = generateStaticPix(valorCobrar, pixKey);
        }

        // Save invoice to database
        let invoice = null;
        try {
            const { data, error } = await supabaseAdmin
                .from('invoices')
                .insert(invoiceData)
                .select()
                .single();

            if (!error) {
                invoice = data;
            } else {
                console.error('Invoice save error:', error.message);
            }
        } catch (dbError: any) {
            console.error('Invoice save exception:', dbError.message);
        }

        return NextResponse.json({
            success: true,
            invoice,
            valorCobrado: valorCobrar,
            plano: plan.nome_plano,
            paymentUrl: invoiceData.gateway_url,
            pixCode: invoiceData.pix_code,
            pixQrcode: invoiceData.pix_qrcode,
        });
    } catch (error: any) {
        console.error('Checkout error:', error);
        return NextResponse.json(
            { error: error.message || 'Erro no checkout' },
            { status: 500 }
        );
    }
}

// Generate static PIX code (fallback)
function generateStaticPix(valor: number, pixKey: string): string {
    const merchantName = 'CONDOMINIOFACIL';
    const city = 'JUAZEIRO DO NORTE';
    const valorStr = valor.toFixed(2);

    let emv = '000201010212';
    const gui = '0014br.gov.bcb.pix';
    const keyField = `01${pixKey.length.toString().padStart(2, '0')}${pixKey}`;
    const mai = gui + keyField;
    emv += `26${mai.length.toString().padStart(2, '0')}${mai}`;
    emv += '52040000';
    emv += '5303986';
    emv += `54${valorStr.length.toString().padStart(2, '0')}${valorStr}`;
    emv += '5802BR';
    emv += `59${merchantName.length.toString().padStart(2, '0')}${merchantName}`;
    emv += `60${city.length.toString().padStart(2, '0')}${city}`;
    emv += '62070503***';
    emv += '6304';

    let crc = 0xFFFF;
    for (let i = 0; i < emv.length; i++) {
        crc ^= emv.charCodeAt(i) << 8;
        for (let j = 0; j < 8; j++) {
            if (crc & 0x8000) crc = (crc << 1) ^ 0x1021;
            else crc <<= 1;
        }
        crc &= 0xFFFF;
    }

    return emv.slice(0, -4) + '6304' + crc.toString(16).toUpperCase().padStart(4, '0');
}
