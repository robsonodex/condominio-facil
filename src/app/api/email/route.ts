import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import nodemailer from 'nodemailer';

// Hostinger SMTP Configuration
const SMTP_HOST = process.env.SMTP_HOST || 'smtp.hostinger.com';
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '465');
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const SMTP_FROM = process.env.SMTP_FROM || 'noreply@condominiofacil.com.br';

// Email Templates
const templates: Record<string, { subject: string; html: (data: any) => string }> = {
    welcome: {
        subject: 'Bem-vindo ao Condomínio Fácil! 🏠',
        html: (data) => `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h1 style="color: #10b981;">Bem-vindo, ${data.nome}!</h1>
                <p>Sua conta no <strong>Condomínio Fácil</strong> foi criada com sucesso.</p>
                <p>Você tem <strong>7 dias grátis</strong> para testar todas as funcionalidades.</p>
                <a href="${data.loginUrl}" style="display: inline-block; background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px;">Acessar Sistema</a>
                <p style="margin-top: 30px; color: #666;">Qualquer dúvida, responda este email.</p>
            </div>
        `,
    },
    trial_ending: {
        subject: 'Seu período de teste está acabando ⏰',
        html: (data) => `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h1 style="color: #f59e0b;">Seu teste termina em ${data.diasRestantes} dias</h1>
                <p>Olá ${data.nome},</p>
                <p>Seu período de teste gratuito no <strong>Condomínio Fácil</strong> está chegando ao fim.</p>
                <p>Para continuar usando, escolha um plano e faça sua assinatura.</p>
                <a href="${data.assinaturaUrl}" style="display: inline-block; background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px;">Escolher Plano</a>
            </div>
        `,
    },
    invoice: {
        subject: 'Nova fatura disponível - Condomínio Fácil',
        html: (data) => `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h1 style="color: #10b981;">Fatura #${data.numero}</h1>
                <p>Olá ${data.nome},</p>
                <p>Sua fatura de <strong>R$ ${data.valor}</strong> está disponível.</p>
                <p><strong>Vencimento:</strong> ${data.vencimento}</p>
                <a href="${data.pagamentoUrl}" style="display: inline-block; background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px;">Pagar Agora</a>
            </div>
        `,
    },
    overdue: {
        subject: '⚠️ Fatura em atraso - Condomínio Fácil',
        html: (data) => `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h1 style="color: #ef4444;">Fatura em Atraso</h1>
                <p>Olá ${data.nome},</p>
                <p>Sua fatura de <strong>R$ ${data.valor}</strong> está vencida há <strong>${data.diasAtraso} dias</strong>.</p>
                <p style="color: #ef4444;"><strong>Importante:</strong> Após 10 dias de atraso, seu acesso será bloqueado.</p>
                <a href="${data.pagamentoUrl}" style="display: inline-block; background: #ef4444; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px;">Regularizar Agora</a>
            </div>
        `,
    },
    blocked: {
        subject: '🚫 Acesso bloqueado - Condomínio Fácil',
        html: (data) => `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h1 style="color: #ef4444;">Seu acesso foi bloqueado</h1>
                <p>Olá ${data.nome},</p>
                <p>Devido à inadimplência de <strong>${data.diasAtraso} dias</strong>, seu acesso ao Condomínio Fácil foi bloqueado.</p>
                <p>Para reativar imediatamente, regularize sua situação:</p>
                <a href="${data.pagamentoUrl}" style="display: inline-block; background: #ef4444; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px;">Pagar e Reativar</a>
            </div>
        `,
    },
    payment_confirmed: {
        subject: '✅ Pagamento confirmado - Condomínio Fácil',
        html: (data) => `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h1 style="color: #10b981;">Pagamento Confirmado!</h1>
                <p>Olá ${data.nome},</p>
                <p>Recebemos seu pagamento de <strong>R$ ${data.valor}</strong>.</p>
                <p>Sua assinatura está ativa até <strong>${data.proximoVencimento}</strong>.</p>
                <a href="${data.dashboardUrl}" style="display: inline-block; background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px;">Acessar Dashboard</a>
                <p style="margin-top: 30px; color: #666;">Obrigado pela confiança!</p>
            </div>
        `,
    },
};

// Create transporter
function createTransporter() {
    if (!SMTP_USER || !SMTP_PASS) {
        console.warn('SMTP not configured, emails will be logged only');
        return null;
    }

    return nodemailer.createTransport({
        host: SMTP_HOST,
        port: SMTP_PORT,
        secure: true, // SSL
        auth: {
            user: SMTP_USER,
            pass: SMTP_PASS,
        },
    });
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { tipo, destinatario, dados, condoId, userId } = body;

        if (!tipo || !destinatario || !templates[tipo]) {
            return NextResponse.json({ error: 'Tipo de email inválido' }, { status: 400 });
        }

        const template = templates[tipo];
        const supabase = await createClient();
        const transporter = createTransporter();

        let status = 'enviado';
        let erro = null;

        if (transporter) {
            try {
                await transporter.sendMail({
                    from: SMTP_FROM,
                    to: destinatario,
                    subject: template.subject,
                    html: template.html(dados || {}),
                });
            } catch (emailError: any) {
                console.error('Email send error:', emailError);
                status = 'falhou';
                erro = emailError.message;
            }
        } else {
            console.log('Email (SMTP not configured):', tipo, destinatario);
            status = 'pendente';
        }

        // Log email
        await supabase.from('email_logs').insert({
            condo_id: condoId,
            user_id: userId,
            tipo,
            destinatario,
            assunto: template.subject,
            status,
            erro,
        });

        return NextResponse.json({ success: true, status });
    } catch (error: any) {
        console.error('Email API error:', error);
        return NextResponse.json(
            { error: error.message || 'Erro ao enviar email' },
            { status: 500 }
        );
    }
}
