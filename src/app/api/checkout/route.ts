import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Mercado Pago Configuration
const MP_ACCESS_TOKEN = process.env.MERCADOPAGO_ACCESS_TOKEN;
const MP_API_URL = 'https://api.mercadopago.com';

interface CheckoutRequest {
    condoId: string;
    planId: string;
    valor: number;
    metodoPagamento: 'pix' | 'cartao' | 'boleto';
    email: string;
    nome: string;
    cpfCnpj?: string;
}

// Create payment preference in Mercado Pago
async function createMercadoPagoPreference(data: CheckoutRequest) {
    const body = {
        items: [
            {
                title: 'Assinatura Condomínio Fácil',
                quantity: 1,
                unit_price: data.valor,
                currency_id: 'BRL',
            }
        ],
        payer: {
            email: data.email,
            first_name: data.nome,
        },
        payment_methods: {
            excluded_payment_types: data.metodoPagamento === 'pix'
                ? [{ id: 'credit_card' }, { id: 'debit_card' }, { id: 'ticket' }]
                : data.metodoPagamento === 'boleto'
                    ? [{ id: 'credit_card' }, { id: 'debit_card' }]
                    : [],
        },
        back_urls: {
            success: `${process.env.NEXT_PUBLIC_APP_URL}/assinatura?status=success`,
            failure: `${process.env.NEXT_PUBLIC_APP_URL}/assinatura?status=failure`,
            pending: `${process.env.NEXT_PUBLIC_APP_URL}/assinatura?status=pending`,
        },
        auto_return: 'approved',
        external_reference: data.condoId,
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
async function createPixPayment(data: CheckoutRequest) {
    const body = {
        transaction_amount: data.valor,
        description: 'Assinatura Condomínio Fácil',
        payment_method_id: 'pix',
        payer: {
            email: data.email,
            first_name: data.nome,
            identification: data.cpfCnpj ? {
                type: data.cpfCnpj.length > 11 ? 'CNPJ' : 'CPF',
                number: data.cpfCnpj.replace(/\D/g, ''),
            } : undefined,
        },
        external_reference: data.condoId,
        notification_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/mercadopago`,
    };

    const response = await fetch(`${MP_API_URL}/v1/payments`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${MP_ACCESS_TOKEN}`,
            'X-Idempotency-Key': `${data.condoId}-${Date.now()}`,
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
        const body: CheckoutRequest = await request.json();
        const supabase = await createClient();

        // Validate required fields
        if (!body.condoId || !body.valor || !body.email) {
            return NextResponse.json({ error: 'Dados incompletos' }, { status: 400 });
        }

        let paymentResult;
        let invoiceData: any = {
            condo_id: body.condoId,
            valor: body.valor,
            status: 'pendente',
            data_vencimento: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            metodo_pagamento: body.metodoPagamento,
        };

        // Check if Mercado Pago is configured
        if (MP_ACCESS_TOKEN) {
            if (body.metodoPagamento === 'pix') {
                // Direct PIX payment
                paymentResult = await createPixPayment(body);
                invoiceData.gateway_id = paymentResult.id;
                invoiceData.pix_code = paymentResult.point_of_interaction?.transaction_data?.qr_code;
                invoiceData.pix_qrcode = paymentResult.point_of_interaction?.transaction_data?.qr_code_base64;
            } else {
                // Checkout preference (card/boleto)
                paymentResult = await createMercadoPagoPreference(body);
                invoiceData.gateway_id = paymentResult.id;
                invoiceData.gateway_url = paymentResult.init_point;
            }
        } else {
            // Fallback: generate static PIX
            const pixKey = process.env.INTER_PIX_KEY || '57444727000185';
            invoiceData.pix_code = generateStaticPix(body.valor, pixKey);
        }

        // Save invoice to database
        const { data: invoice, error } = await supabase
            .from('invoices')
            .insert(invoiceData)
            .select()
            .single();

        if (error) {
            console.error('Database error:', error);
            throw new Error('Erro ao salvar fatura');
        }

        return NextResponse.json({
            success: true,
            invoice,
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

    // CRC16
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
