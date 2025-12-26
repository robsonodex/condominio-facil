import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServiceRoleClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';
import crypto from 'crypto';

/**
 * POST /api/onboard
 * Provisiona novo cliente após pagamento confirmado
 * Cria: condo, subscription, user e envia email de boas-vindas
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        // Validar campos obrigatórios
        const required = ['name', 'email', 'condo_name', 'plan_id'];
        for (const field of required) {
            if (!body[field]) {
                return NextResponse.json({
                    error: `Campo obrigatório: ${field}`
                }, { status: 400 });
            }
        }

        // Service role para criar registros
        const supabaseAdmin = createServiceRoleClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        // Verificar se email já existe
        const { data: existingUser } = await supabaseAdmin
            .from('users')
            .select('id, email')
            .eq('email', body.email)
            .single();

        let userId: string;
        let tempPassword: string | null = null;
        let isNewUser = false;

        if (existingUser) {
            // Usuário já existe - apenas adicionar/atualizar assinatura
            userId = existingUser.id;
        } else {
            // Criar novo usuário no auth
            tempPassword = crypto.randomBytes(8).toString('hex');

            const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
                email: body.email,
                password: tempPassword,
                email_confirm: true,
                user_metadata: {
                    nome: body.name,
                    phone: body.phone || null
                }
            });

            if (authError) {
                console.error('Auth error:', authError);
                return NextResponse.json({
                    error: `Erro ao criar conta: ${authError.message}`
                }, { status: 500 });
            }

            userId = authUser.user.id;
            isNewUser = true;
        }

        // Buscar plano
        const { data: plan } = await supabaseAdmin
            .from('plans')
            .select('*')
            .eq('id', body.plan_id)
            .single();

        if (!plan) {
            return NextResponse.json({ error: 'Plano não encontrado' }, { status: 404 });
        }

        // Criar condomínio
        const { data: condo, error: condoError } = await supabaseAdmin
            .from('condos')
            .insert({
                nome: body.condo_name,
                endereco: body.address || '',
                email_contato: body.email,
                telefone: body.phone || null
            })
            .select()
            .single();

        if (condoError) {
            console.error('Condo error:', condoError);
            return NextResponse.json({
                error: `Erro ao criar condomínio: ${condoError.message}`
            }, { status: 500 });
        }

        // Criar subscription
        const dataRenovacao = new Date();
        dataRenovacao.setMonth(dataRenovacao.getMonth() + 1);

        const { data: subscription, error: subError } = await supabaseAdmin
            .from('subscriptions')
            .insert({
                condo_id: condo.id,
                plan_id: plan.id,
                status: body.payment_confirmed ? 'ativo' : 'pendente_pagamento',
                valor_mensal_cobrado: plan.preco,
                data_renovacao: dataRenovacao.toISOString().split('T')[0],
                ativada_em: body.payment_confirmed ? new Date().toISOString() : null
            })
            .select()
            .single();

        if (subError) {
            console.error('Subscription error:', subError);
        }

        // Atualizar perfil do usuário
        if (isNewUser) {
            await supabaseAdmin.from('users').insert({
                id: userId,
                nome: body.name,
                email: body.email,
                role: 'sindico',
                condo_id: condo.id,
                ativo: true
            });
        } else {
            await supabaseAdmin
                .from('users')
                .update({
                    condo_id: condo.id,
                    role: 'sindico'
                })
                .eq('id', userId);
        }

        // Enviar email de boas-vindas
        if (process.env.SMTP_HOST && process.env.SMTP_USER) {
            await sendWelcomeEmail({
                to: body.email,
                name: body.name,
                condoName: body.condo_name,
                planName: plan.nome,
                tempPassword: tempPassword,
                isNewUser
            });
        }

        // Registrar log
        await supabaseAdmin.from('payment_logs').insert({
            condo_id: condo.id,
            event_type: 'onboard.completed',
            status: 'success',
            provider: body.provider || 'direct',
            raw_payload: {
                email: body.email,
                plan_id: body.plan_id,
                condo_id: condo.id,
                is_new_user: isNewUser
            }
        });

        return NextResponse.json({
            success: true,
            message: 'Conta criada com sucesso!',
            condo_id: condo.id,
            subscription_id: subscription?.id,
            is_new_user: isNewUser
        });

    } catch (error: any) {
        console.error('Onboard error:', error);
        return NextResponse.json({
            error: error.message || 'Erro ao criar conta'
        }, { status: 500 });
    }
}

async function sendWelcomeEmail(params: {
    to: string;
    name: string;
    condoName: string;
    planName: string;
    tempPassword: string | null;
    isNewUser: boolean;
}) {
    const maxAttempts = 3;
    let attempts = 0;
    let lastError = null;

    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '465'),
        secure: true,
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
    });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://meucondominiofacil.com';

    const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #059669, #10b981); padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .header h1 { color: white; margin: 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
        .button { display: inline-block; background: #059669; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
        .credentials { background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #059669; margin: 20px 0; }
        .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🏢 Bem-vindo ao Condomínio Fácil!</h1>
        </div>
        <div class="content">
            <p>Olá, <strong>${params.name}</strong>!</p>
            
            <p>Sua conta foi criada com sucesso! 🎉</p>
            
            <div class="credentials">
                <p><strong>Condomínio:</strong> ${params.condoName}</p>
                <p><strong>Plano:</strong> ${params.planName}</p>
                <p><strong>Email:</strong> ${params.to}</p>
                ${params.isNewUser && params.tempPassword ? `<p><strong>Senha temporária:</strong> ${params.tempPassword}</p>` : ''}
            </div>

            ${params.isNewUser ? `
            <p>⚠️ <strong>Importante:</strong> Por segurança, altere sua senha no primeiro acesso.</p>
            ` : `
            <p>Sua conta já existia, então apenas associamos o novo condomínio a ela.</p>
            `}
            
            <center>
                <a href="${appUrl}/login" class="button">Acessar o Sistema</a>
            </center>
            
            <p>Agora você pode:</p>
            <ul>
                <li>Gerenciar moradores e unidades</li>
                <li>Controlar finanças do condomínio</li>
                <li>Gerar boletos e PIX via Mercado Pago</li>
                <li>Registrar ocorrências e portaria</li>
            </ul>
            
            <p>Seja bem-vindo e bons negócios!</p>
        </div>
        <div class="footer">
            <p>© ${new Date().getFullYear()} Condomínio Fácil. Todos os direitos reservados.</p>
        </div>
    </div>
</body>
</html>
    `;

    // Tentar enviar com retry
    while (attempts < maxAttempts) {
        attempts++;
        try {
            await transporter.sendMail({
                from: process.env.SMTP_FROM || 'Condomínio Fácil <contato@sistema.com>',
                to: params.to,
                subject: '🏢 Bem-vindo ao Condomínio Fácil - Sua conta foi criada!',
                html
            });

            console.log(`E-mail de boas-vindas enviado para ${params.to} (tentativa ${attempts})`);
            return; // Sucesso
        } catch (error: any) {
            lastError = error;
            console.error(`Tentativa ${attempts} de envio de e-mail falhou:`, error.message);

            if (attempts < maxAttempts) {
                // Aguardar antes de tentar novamente (backoff exponencial)
                await new Promise(resolve => setTimeout(resolve, 1000 * attempts));
            }
        }
    }

    // Se chegou aqui, todas as tentativas falharam
    console.error(`Falha ao enviar e-mail após ${maxAttempts} tentativas:`, lastError);
    throw new Error(`Falha no envio de e-mail: ${lastError?.message}`);
}
