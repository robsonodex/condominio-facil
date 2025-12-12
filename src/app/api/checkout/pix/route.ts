import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

interface MercadoPagoPixResponse {
    id: string;
    qr_data: string;
    qr_data_base64: string;
    ticket_url?: string;
    transaction_amount: number;
    status: string;
    date_of_expiration?: string;
}

export async function POST(req: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { data: profile } = await supabase
            .from('users')
            .select('condo_id, email, nome')
            .eq('id', user.id)
            .single();

        if (!profile) {
            return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
        }

        const body = await req.json();
        const { amount, description, invoice_id } = body;

        if (!amount || amount <= 0) {
            return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
        }

        // Mercado Pago PIX API
        const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
        if (!accessToken) {
            return NextResponse.json({
                error: 'Payment provider not configured'
            }, { status: 500 });
        }

        // Create PIX payment
        const mpResponse = await fetch('https://api.mercadopago.com/v1/payments', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                transaction_amount: amount,
                description: description || 'Pagamento Condomínio Fácil',
                payment_method_id: 'pix',
                payer: {
                    email: profile.email,
                    first_name: profile.nome || 'Morador',
                },
                notification_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/mercadopago`,
                metadata: {
                    condo_id: profile.condo_id,
                    user_id: user.id,
                    invoice_id: invoice_id || null,
                },
            }),
        });

        if (!mpResponse.ok) {
            const errorData = await mpResponse.json();
            console.error('Mercado Pago error:', errorData);
            return NextResponse.json({
                error: 'Payment provider error',
                details: errorData
            }, { status: 500 });
        }

        const pixData: MercadoPagoPixResponse = await mpResponse.json();

        // Save payment to database
        const { data: payment, error: paymentError } = await supabase
            .from('payments')
            .insert([{
                condo_id: profile.condo_id,
                user_id: user.id,
                invoice_id: invoice_id || null,
                amount: amount,
                payment_method: 'pix',
                provider: 'mercadopago',
                provider_payment_id: pixData.id,
                status: 'pending',
                qr_data: pixData.qr_data,
                qr_data_base64: pixData.qr_data_base64,
                expires_at: pixData.date_of_expiration || new Date(Date.now() + 30 * 60 * 1000).toISOString(),
                metadata: {
                    description,
                    original_response: pixData,
                }
            }])
            .select()
            .single();

        if (paymentError) {
            console.error('Database error:', paymentError);
            return NextResponse.json({
                error: 'Failed to save payment',
                details: paymentError
            }, { status: 500 });
        }

        // Return payment info with QR code
        return NextResponse.json({
            success: true,
            payment_id: payment.id,
            provider_payment_id: pixData.id,
            qr_code: pixData.qr_data,
            qr_code_base64: pixData.qr_data_base64,
            amount: amount,
            status: 'pending',
            expires_at: payment.expires_at,
            ticket_url: pixData.ticket_url,
        });

    } catch (error: any) {
        console.error('PIX endpoint error:', error);
        return NextResponse.json({
            error: 'Internal server error',
            message: error.message
        }, { status: 500 });
    }
}

// GET endpoint to check payment status
export async function GET(req: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const paymentId = searchParams.get('payment_id');

        if (!paymentId) {
            return NextResponse.json({ error: 'Payment ID required' }, { status: 400 });
        }

        const { data: payment, error } = await supabase
            .from('payments')
            .select('*')
            .eq('id', paymentId)
            .eq('user_id', user.id)
            .single();

        if (error || !payment) {
            return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
        }

        return NextResponse.json({
            payment_id: payment.id,
            status: payment.status,
            amount: payment.amount,
            qr_code: payment.qr_data,
            qr_code_base64: payment.qr_data_base64,
            expires_at: payment.expires_at,
            paid_at: payment.paid_at,
        });

    } catch (error: any) {
        console.error('Payment status error:', error);
        return NextResponse.json({
            error: 'Internal server error'
        }, { status: 500 });
    }
}
