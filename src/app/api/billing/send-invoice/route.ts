import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import nodemailer from 'nodemailer';

// Mercado Pago Configuration
const MP_ACCESS_TOKEN = process.env.MERCADOPAGO_ACCESS_TOKEN;
const MP_API_URL = 'https://api.mercadopago.com';

/**
 * POST /api/billing/send-invoice
 * Envia cobrança por email para um condomínio
 * Body: { subscription_id: string }
 */
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();

        // Verificar autenticação
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        // Verificar se é superadmin
        const { data: profile } = await supabase
            .from('users')
            .select('role')
            .eq('email', user.email)
            .single();

        if (!profile || profile.role !== 'superadmin') {
            return NextResponse.json({ error: 'Apenas superadmin pode enviar cobranças' }, { status: 403 });
        }

        // Receber subscription_id
        const { subscription_id } = await request.json();
        if (!subscription_id) {
            return NextResponse.json({ error: 'subscription_id é obrigatório' }, { status: 400 });
        }

        // Buscar dados da subscription com condo, plan e síndico
        const { data: subscriptionData, error: subError } = await supabase
            .from('subscriptions')
            .select(`
                id, status, valor_mensal_cobrado, data_renovacao,
                condo:condos!inner(id, nome, email_contato),
                plan:plans!inner(nome_plano)
            `)
            .eq('id', subscription_id)
            .single();

        if (subError || !subscriptionData) {
            return NextResponse.json({ error: 'Assinatura não encontrada' }, { status: 404 });
        }

        // Cast para evitar erros de tipo do TypeScript
        const subscription = subscriptionData as any;
        const condo = subscription.condo;
        const plan = subscription.plan;

        // Buscar síndico do condomínio
        const { data: sindico } = await supabase
            .from('users')
            .select('id, nome, email')
            .eq('condo_id', condo.id)
            .eq('role', 'sindico')
            .single();

        const emailDestino = sindico?.email || condo.email_contato;
        if (!emailDestino) {
            return NextResponse.json({
                error: 'Nenhum email encontrado para este condomínio'
            }, { status: 400 });
        }

        const valor = subscription.valor_mensal_cobrado;
        const nomeCondo = condo.nome;
        const nomePlano = plan.nome_plano;

        // Criar preferência de pagamento no Mercado Pago via API
        const preferenceBody = {
            items: [{
                id: subscription_id,
                title: `Mensalidade ${nomePlano} - ${nomeCondo}`,
                description: `Assinatura mensal do Condomínio Fácil`,
                unit_price: valor,
                quantity: 1,
                currency_id: 'BRL'
            }],
            external_reference: subscription_id,
            back_urls: {
                success: `${process.env.NEXT_PUBLIC_APP_URL}/assinatura?status=sucesso`,
                failure: `${process.env.NEXT_PUBLIC_APP_URL}/assinatura?status=falha`,
                pending: `${process.env.NEXT_PUBLIC_APP_URL}/assinatura?status=pendente`
            },
            auto_return: 'approved',
            notification_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/mercadopago`,
        };

        const mpResponse = await fetch(`${MP_API_URL}/checkout/preferences`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${MP_ACCESS_TOKEN}`,
            },
            body: JSON.stringify(preferenceBody),
        });

        if (!mpResponse.ok) {
            const errorText = await mpResponse.text();
            console.error('Mercado Pago error:', errorText);
            return NextResponse.json({
                error: 'Erro ao criar link de pagamento no Mercado Pago'
            }, { status: 500 });
        }

        const preference = await mpResponse.json();
        const linkPagamento = preference.init_point;

        // Criar invoice no banco (ignora erro se tabela não existir)
        let invoice: any = null;
        try {
            const { data, error: invoiceError } = await supabase
                .from('invoices')
                .insert({
                    condo_id: condo.id,
                    subscription_id: subscription_id,
                    valor: valor,
                    data_vencimento: subscription.data_renovacao,
                    status: 'pendente',
                })
                .select()
                .single();
            invoice = data;
        } catch (e) {
            console.log('Invoice table may not exist, skipping');
        }

        // Enviar email
        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: Number(process.env.SMTP_PORT),
            secure: process.env.SMTP_SECURE === 'true',
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            }
        });

        const htmlEmail = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; padding: 30px; }
        .header { text-align: center; border-bottom: 2px solid #10B981; padding-bottom: 20px; margin-bottom: 20px; }
        .header h1 { color: #10B981; margin: 0; }
        .content { line-height: 1.6; color: #333; }
        .valor { font-size: 28px; font-weight: bold; color: #10B981; text-align: center; margin: 20px 0; }
        .button { display: inline-block; padding: 15px 40px; background: #10B981; color: white; text-decoration: none; border-radius: 8px; font-weight: bold; }
        .button-container { text-align: center; margin: 30px 0; }
        .footer { text-align: center; color: #888; font-size: 12px; margin-top: 30px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🏢 Condomínio Fácil</h1>
        </div>
        <div class="content">
            <p>Olá${sindico?.nome ? `, ${sindico.nome}` : ''}!</p>
            <p>Segue a cobrança referente à mensalidade do <strong>${nomeCondo}</strong>:</p>
            
            <div class="valor">R$ ${valor.toFixed(2)}</div>
            
            <p><strong>Plano:</strong> ${nomePlano}<br>
            <strong>Vencimento:</strong> ${new Date(subscription.data_renovacao).toLocaleDateString('pt-BR')}</p>
            
            <div class="button-container">
                <a href="${linkPagamento}" class="button">💳 Pagar Agora</a>
            </div>
            
            <p>Você pode pagar via <strong>PIX</strong>, <strong>Cartão de Crédito</strong> ou <strong>Boleto</strong>.</p>
            <p>Após o pagamento, sua assinatura será renovada automaticamente.</p>
        </div>
        <div class="footer">
            <p>Condomínio Fácil - Gestão de Condomínios<br>
            Este email foi enviado automaticamente. Em caso de dúvidas, entre em contato.</p>
        </div>
    </div>
</body>
</html>
        `;

        await transporter.sendMail({
            from: process.env.SMTP_FROM,
            to: emailDestino,
            subject: `💳 Cobrança ${nomeCondo} - R$ ${valor.toFixed(2)}`,
            html: htmlEmail
        });

        // Registrar log de email
        await supabase.from('email_logs').insert({
            condo_id: condo.id,
            user_id: sindico?.id || null,
            tipo: 'invoice',
            destinatario: emailDestino,
            assunto: `Cobrança ${nomeCondo} - R$ ${valor.toFixed(2)}`,
            status: 'enviado'
        });

        return NextResponse.json({
            success: true,
            message: `Cobrança enviada para ${emailDestino}`,
            invoice_id: invoice?.id,
            link_pagamento: linkPagamento
        });

    } catch (error: any) {
        console.error('Send invoice error:', error);
        return NextResponse.json({
            error: `Erro ao enviar cobrança: ${error.message}`
        }, { status: 500 });
    }
}
