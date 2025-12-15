import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import nodemailer from 'nodemailer';
import {
    supportNewTicketEmail,
    supportNewMessageEmail,
    supportTicketClosedEmail,
    supportSLABreachedEmail
} from '@/lib/emails/support-templates';
import { legalAcceptanceConfirmedEmail } from '@/lib/emails/legal-templates';

// Hostinger SMTP Configuration
const SMTP_HOST = process.env.SMTP_HOST || 'smtp.hostinger.com';
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '465');
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const SMTP_FROM = process.env.SMTP_FROM || 'noreply@condominiofacil.com.br';

// ========================================
// SEGURANÇA: Rate Limiting em memória
// ========================================
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_MAX = 10; // máximo de emails por janela
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minuto

function checkRateLimit(userId: string): boolean {
    const now = Date.now();
    const userLimit = rateLimitMap.get(userId);

    if (!userLimit || now > userLimit.resetTime) {
        rateLimitMap.set(userId, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
        return true;
    }

    if (userLimit.count >= RATE_LIMIT_MAX) {
        return false;
    }

    userLimit.count++;
    return true;
}

// ========================================
// SEGURANÇA: Sanitização de dados
// ========================================
function sanitizeHtml(str: string): string {
    if (!str) return '';
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;');
}

// Email Templates
const templates: Record<string, { subject: string; html: (data: any) => string }> = {
    welcome: {
        subject: 'Bem-vindo ao Condomínio Fácil! 🏠',
        html: (data) => `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f3f4f6;">
                <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
                    <!-- Header -->
                    <div style="background: linear-gradient(135deg, #059669, #10b981); padding: 40px 20px; text-align: center;">
                        <h1 style="color: #ffffff; margin: 0; font-size: 28px;">🏠 Condomínio Fácil</h1>
                    </div>
                    
                    <!-- Content -->
                    <div style="padding: 40px 30px;">
                        <h2 style="color: #1f2937; margin-top: 0;">Bem-vindo, ${sanitizeHtml(data.nome)}!</h2>
                        
                        <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
                            Sua conta no <strong>Condomínio Fácil</strong> foi criada com sucesso! 🎉
                        </p>
                        
                        <div style="background-color: #ecfdf5; border-left: 4px solid #10b981; padding: 15px; margin: 25px 0;">
                            <p style="color: #065f46; margin: 0; font-weight: bold;">
                                ✨ Você tem 7 dias grátis para testar todas as funcionalidades premium!
                            </p>
                        </div>
                        
                        <!-- CTA Button -->
                        <div style="text-align: center; margin: 35px 0;">
                            <a href="${sanitizeHtml(data.verificationUrl || data.loginUrl)}" 
                               style="display: inline-block; 
                                      background: #10b981; 
                                      color: #ffffff; 
                                      padding: 16px 40px; 
                                      text-decoration: none; 
                                      border-radius: 8px; 
                                      font-weight: bold; 
                                      font-size: 16px;
                                      box-shadow: 0 4px 6px rgba(16, 185, 129, 0.3);">
                                ${data.verificationUrl ? '✉️ Confirmar Email e Acessar' : 'Acessar o Sistema →'}
                            </a>
                        </div>
                        
                        <!-- Next Steps -->
                        <div style="margin-top: 30px;">
                            <h3 style="color: #1f2937; font-size: 18px;">📋 Próximos Passos:</h3>
                            <ol style="color: #4b5563; line-height: 1.8;">
                                <li><strong>Faça seu primeiro login</strong> com o email e senha cadastrados</li>
                                <li><strong>Complete seu perfil</strong> e configure os dados do condomínio</li>
                                <li><strong>Explore o sistema</strong> - adicione moradores, unidades e muito mais</li>
                                <li><strong>Escolha seu plano</strong> antes do fim do período de teste</li>
                            </ol>
                        </div>
                        
                        <!-- Features Highlight -->
                        <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin-top: 30px;">
                            <h3 style="color: #1f2937; font-size: 18px; margin-top: 0;">🚀 O que você pode fazer:</h3>
                            <ul style="color: #4b5563; line-height: 1.8; margin-bottom: 0;">
                                <li>Gerenciar moradores e unidades</li>
                                <li>Controlar finanças e gerar boletos</li>
                                <li>Registrar ocorrências e portaria</li>
                                <li>Acessar relatórios completos</li>
                            </ul>
                        </div>
                        
                        <!-- Support -->
                        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                            <p style="color: #6b7280; font-size: 14px; margin: 0;">
                                💬 <strong>Precisa de ajuda?</strong><br>
                                Entre em contato: <a href="mailto:contato@meucondominiofacil.com" style="color: #10b981;">contato@meucondominiofacil.com</a>
                            </p>
                        </div>
                    </div>
                    
                    <!-- Footer -->
                    <div style="background-color: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
                        <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                            © ${new Date().getFullYear()} Condomínio Fácil. Todos os direitos reservados.
                        </p>
                    </div>
                </div>
            </body>
            </html>
        `,
    },
    trial_ending: {
        subject: 'Seu período de teste está acabando ⏰',
        html: (data) => `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h1 style="color: #f59e0b;">Seu teste termina em ${sanitizeHtml(data.diasRestantes)} dias</h1>
                <p>Olá ${sanitizeHtml(data.nome)},</p>
                <p>Seu período de teste gratuito no <strong>Condomínio Fácil</strong> está chegando ao fim.</p>
                <p>Para continuar usando, escolha um plano e faça sua assinatura.</p>
                <a href="${sanitizeHtml(data.assinaturaUrl)}" style="display: inline-block; background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px;">Escolher Plano</a>
            </div>
        `,
    },
    invoice: {
        subject: 'Nova fatura disponível - Condomínio Fácil',
        html: (data) => `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h1 style="color: #10b981;">Fatura #${sanitizeHtml(data.numero)}</h1>
                <p>Olá ${sanitizeHtml(data.nome)},</p>
                <p>Sua fatura de <strong>R$ ${sanitizeHtml(data.valor)}</strong> está disponível.</p>
                <p><strong>Vencimento:</strong> ${sanitizeHtml(data.vencimento)}</p>
                <a href="${sanitizeHtml(data.pagamentoUrl)}" style="display: inline-block; background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px;">Pagar Agora</a>
            </div>
        `,
    },
    overdue: {
        subject: '⚠️ Fatura em atraso - Condomínio Fácil',
        html: (data) => `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h1 style="color: #ef4444;">Fatura em Atraso</h1>
                <p>Olá ${sanitizeHtml(data.nome)},</p>
                <p>Sua fatura de <strong>R$ ${sanitizeHtml(data.valor)}</strong> está vencida há <strong>${sanitizeHtml(data.diasAtraso)} dias</strong>.</p>
                <p style="color: #ef4444;"><strong>Importante:</strong> Após 10 dias de atraso, seu acesso será bloqueado.</p>
                <a href="${sanitizeHtml(data.pagamentoUrl)}" style="display: inline-block; background: #ef4444; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px;">Regularizar Agora</a>
            </div>
        `,
    },
    blocked: {
        subject: '🚫 Acesso bloqueado - Condomínio Fácil',
        html: (data) => `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h1 style="color: #ef4444;">Seu acesso foi bloqueado</h1>
                <p>Olá ${sanitizeHtml(data.nome)},</p>
                <p>Devido à inadimplência de <strong>${sanitizeHtml(data.diasAtraso)} dias</strong>, seu acesso ao Condomínio Fácil foi bloqueado.</p>
                <p>Para reativar imediatamente, regularize sua situação:</p>
                <a href="${sanitizeHtml(data.pagamentoUrl)}" style="display: inline-block; background: #ef4444; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px;">Pagar e Reativar</a>
            </div>
        `,
    },
    payment_confirmed: {
        subject: '✅ Pagamento confirmado - Condomínio Fácil',
        html: (data) => `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h1 style="color: #10b981;">Pagamento Confirmado!</h1>
                <p>Olá ${sanitizeHtml(data.nome)},</p>
                <p>Recebemos seu pagamento de <strong>R$ ${sanitizeHtml(data.valor)}</strong>.</p>
                <p>Sua assinatura está ativa até <strong>${sanitizeHtml(data.proximoVencimento)}</strong>.</p>
                <a href="${sanitizeHtml(data.dashboardUrl)}" style="display: inline-block; background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px;">Acessar Dashboard</a>
                <p style="margin-top: 30px; color: #666;">Obrigado pela confiança!</p>
            </div>
        `,
    },
    // Support System Templates
    support_new_ticket: {
        subject: 'Novo Ticket Criado - Condomínio Fácil',
        html: (data) => supportNewTicketEmail(data),
    },
    support_new_message: {
        subject: 'Nova Mensagem no Ticket - Condomínio Fácil',
        html: (data) => supportNewMessageEmail(data),
    },
    support_ticket_closed: {
        subject: 'Ticket Fechado - Condomínio Fácil',
        html: (data) => supportTicketClosedEmail(data),
    },
    support_sla_breached: {
        subject: '⚠️ SLA Estourado - Condomínio Fácil',
        html: (data) => supportSLABreachedEmail(data),
    },
    // Legal System Templates
    legal_acceptance_confirmed: {
        subject: '✅ Seu aceite foi registrado - Condomínio Fácil',
        html: (data) => legalAcceptanceConfirmedEmail(data),
    },
    // Subscription Reminder Templates
    subscription_reminder: {
        subject: '⏰ Sua assinatura vence em breve - Condomínio Fácil',
        html: (data) => `
            <!DOCTYPE html>
            <html>
            <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
            <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f3f4f6;">
                <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
                    <div style="background: linear-gradient(135deg, #f59e0b, #d97706); padding: 40px 20px; text-align: center;">
                        <h1 style="color: #ffffff; margin: 0; font-size: 28px;">⏰ Lembrete de Renovação</h1>
                    </div>
                    <div style="padding: 40px 30px;">
                        <h2 style="color: #1f2937; margin-top: 0;">Olá, ${sanitizeHtml(data.nome)}!</h2>
                        <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
                            Sua assinatura do <strong>Condomínio Fácil</strong> para o condomínio 
                            <strong>${sanitizeHtml(data.condoNome)}</strong> vence em 
                            <strong style="color: #f59e0b;">${sanitizeHtml(data.diasRestantes)} dias</strong> 
                            (${sanitizeHtml(data.dataVencimento)}).
                        </p>
                        <div style="background-color: #fffbeb; border-left: 4px solid #f59e0b; padding: 15px; margin: 25px 0;">
                            <p style="color: #92400e; margin: 0;">
                                <strong>Plano atual:</strong> ${sanitizeHtml(data.plano)}<br>
                                <strong>Valor:</strong> R$ ${sanitizeHtml(data.valor)}/mês
                            </p>
                        </div>
                        <p style="color: #4b5563; font-size: 16px;">
                            Para evitar a interrupção dos serviços, renove sua assinatura antes do vencimento.
                        </p>
                        <div style="text-align: center; margin: 35px 0;">
                            <a href="${sanitizeHtml(data.assinaturaUrl)}" 
                               style="display: inline-block; background: #f59e0b; color: #ffffff; padding: 16px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
                                Renovar Agora →
                            </a>
                        </div>
                    </div>
                    <div style="background-color: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
                        <p style="color: #9ca3af; font-size: 12px; margin: 0;">© ${new Date().getFullYear()} Condomínio Fácil</p>
                    </div>
                </div>
            </body>
            </html>
        `,
    },
    subscription_expired: {
        subject: '🚨 Sua assinatura expirou - Funcionalidades reduzidas',
        html: (data) => `
            <!DOCTYPE html>
            <html>
            <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
            <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f3f4f6;">
                <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
                    <div style="background: linear-gradient(135deg, #ef4444, #dc2626); padding: 40px 20px; text-align: center;">
                        <h1 style="color: #ffffff; margin: 0; font-size: 28px;">🚨 Assinatura Expirada</h1>
                    </div>
                    <div style="padding: 40px 30px;">
                        <h2 style="color: #1f2937; margin-top: 0;">Olá, ${sanitizeHtml(data.nome)}!</h2>
                        <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
                            A assinatura do <strong>Condomínio Fácil</strong> para o condomínio 
                            <strong>${sanitizeHtml(data.condoNome)}</strong> expirou há 
                            <strong style="color: #ef4444;">${sanitizeHtml(data.diasRestantes)} dias</strong>.
                        </p>
                        <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 15px; margin: 25px 0;">
                            <p style="color: #991b1b; margin: 0; font-weight: bold;">
                                ⚠️ Seu acesso está no modo TRIAL com funcionalidades reduzidas.
                            </p>
                        </div>
                        <p style="color: #4b5563; font-size: 16px;">
                            Reative sua assinatura agora para ter acesso completo ao sistema.
                        </p>
                        <div style="text-align: center; margin: 35px 0;">
                            <a href="${sanitizeHtml(data.assinaturaUrl)}" 
                               style="display: inline-block; background: #ef4444; color: #ffffff; padding: 16px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
                                Reativar Assinatura →
                            </a>
                        </div>
                    </div>
                    <div style="background-color: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
                        <p style="color: #9ca3af; font-size: 12px; margin: 0;">© ${new Date().getFullYear()} Condomínio Fácil</p>
                    </div>
                </div>
            </body>
            </html>
        `,
    },
    // Resident Invoice Template
    resident_invoice: {
        subject: '💳 Nova Cobrança - ${data.condoNome}',
        html: (data: any) => `
            <!DOCTYPE html>
            <html>
            <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
            <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f3f4f6;">
                <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
                    <div style="background: linear-gradient(135deg, #10b981, #059669); padding: 40px 20px; text-align: center;">
                        <h1 style="color: #ffffff; margin: 0; font-size: 28px;">💳 Nova Cobrança</h1>
                    </div>
                    <div style="padding: 40px 30px;">
                        <h2 style="color: #1f2937; margin-top: 0;">Olá, ${sanitizeHtml(data.nome)}!</h2>
                        <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
                            Você recebeu uma nova cobrança do <strong>${sanitizeHtml(data.condoNome)}</strong>.
                        </p>
                        <div style="background-color: #f0fdf4; border: 1px solid #10b981; border-radius: 8px; padding: 20px; margin: 25px 0; text-align: center;">
                            <p style="color: #6b7280; margin: 0 0 10px 0; font-size: 14px;">${sanitizeHtml(data.descricao)}</p>
                            <p style="color: #10b981; font-size: 36px; font-weight: bold; margin: 0;">R$ ${sanitizeHtml(data.valor)}</p>
                            <p style="color: #6b7280; margin: 10px 0 0 0; font-size: 14px;">Vencimento: <strong>${sanitizeHtml(data.dataVencimento)}</strong></p>
                        </div>
                        <div style="text-align: center; margin: 35px 0;">
                            <a href="${sanitizeHtml(data.linkPagamento)}" 
                               style="display: inline-block; background: #10b981; color: #ffffff; padding: 16px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
                                Pagar Agora →
                            </a>
                        </div>
                        <p style="color: #6b7280; font-size: 14px; text-align: center;">
                            Você pode pagar via <strong>PIX</strong>, <strong>Cartão</strong> ou <strong>Boleto</strong>.
                        </p>
                    </div>
                    <div style="background-color: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
                        <p style="color: #9ca3af; font-size: 12px; margin: 0;">© ${new Date().getFullYear()} Condomínio Fácil</p>
                    </div>
                </div>
            </body>
            </html>
        `,
    },
    // User Credentials Email - when admin creates new user
    user_credentials: {
        subject: '🔑 Suas Credenciais de Acesso - Condomínio Fácil',
        html: (data: any) => `
            <!DOCTYPE html>
            <html>
            <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
            <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f3f4f6;">
                <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
                    <div style="background: linear-gradient(135deg, #059669, #10b981); padding: 40px 20px; text-align: center;">
                        <h1 style="color: #ffffff; margin: 0; font-size: 28px;">🔑 Suas Credenciais de Acesso</h1>
                    </div>
                    <div style="padding: 40px 30px;">
                        <h2 style="color: #1f2937; margin-top: 0;">Olá, ${sanitizeHtml(data.nome)}!</h2>
                        <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
                            Você foi cadastrado no sistema <strong>Condomínio Fácil</strong> como <strong>${sanitizeHtml(data.role)}</strong>.
                        </p>
                        <div style="background-color: #f0fdf4; border: 1px solid #10b981; border-radius: 8px; padding: 20px; margin: 25px 0;">
                            <p style="color: #065f46; margin: 0 0 10px 0; font-size: 14px;"><strong>Seus dados de acesso:</strong></p>
                            <p style="color: #1f2937; margin: 5px 0;"><strong>Email:</strong> ${sanitizeHtml(data.email)}</p>
                            <p style="color: #1f2937; margin: 5px 0;"><strong>Senha:</strong> ${sanitizeHtml(data.password)}</p>
                            ${data.condoNome ? `<p style="color: #1f2937; margin: 5px 0;"><strong>Condomínio:</strong> ${sanitizeHtml(data.condoNome)}</p>` : ''}
                        </div>
                        <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 25px 0;">
                            <p style="color: #92400e; margin: 0; font-weight: bold;">
                                ⚠️ Por segurança, altere sua senha após o primeiro login.
                            </p>
                        </div>
                        <div style="text-align: center; margin: 35px 0;">
                            <a href="${sanitizeHtml(data.loginUrl || 'https://meucondominiofacil.com/login')}" 
                               style="display: inline-block; background: #10b981; color: #ffffff; padding: 16px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
                                Acessar o Sistema →
                            </a>
                        </div>
                    </div>
                    <div style="background-color: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
                        <p style="color: #9ca3af; font-size: 12px; margin: 0;">© ${new Date().getFullYear()} Condomínio Fácil</p>
                    </div>
                </div>
            </body>
            </html>
        `,
    },
    // Condo Trial Email
    condo_trial: {
        subject: '🎉 Bem-vindo ao Condomínio Fácil - Período de Teste',
        html: (data: any) => `
            <!DOCTYPE html>
            <html>
            <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
            <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f3f4f6;">
                <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
                    <div style="background: linear-gradient(135deg, #059669, #10b981); padding: 40px 20px; text-align: center;">
                        <h1 style="color: #ffffff; margin: 0; font-size: 28px;">🎉 Bem-vindo ao Condomínio Fácil!</h1>
                    </div>
                    <div style="padding: 40px 30px;">
                        <h2 style="color: #1f2937; margin-top: 0;">Olá, ${sanitizeHtml(data.nome)}!</h2>
                        <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
                            Agradecemos seu interesse no <strong>Condomínio Fácil</strong>!
                        </p>
                        <div style="background-color: #ecfdf5; border-left: 4px solid #10b981; padding: 15px; margin: 25px 0;">
                            <p style="color: #065f46; margin: 0; font-weight: bold;">
                                ✨ Seu período de teste começa hoje e vai até <strong>${sanitizeHtml(data.dataFim)}</strong>.
                            </p>
                        </div>
                        <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
                            Durante este período, você terá acesso a <strong>todas as funcionalidades</strong> do sistema, incluindo:
                        </p>
                        <ul style="color: #4b5563; line-height: 1.8;">
                            <li>Gestão financeira completa</li>
                            <li>PIX com QR Code</li>
                            <li>Portaria virtual</li>
                            <li>Reservas de áreas comuns</li>
                            <li>Assembleias digitais</li>
                            <li>E muito mais!</li>
                        </ul>
                        <div style="text-align: center; margin: 35px 0;">
                            <a href="${sanitizeHtml(data.loginUrl || 'https://meucondominiofacil.com/login')}" 
                               style="display: inline-block; background: #10b981; color: #ffffff; padding: 16px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
                                Começar Agora →
                            </a>
                        </div>
                    </div>
                    <div style="background-color: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
                        <p style="color: #9ca3af; font-size: 12px; margin: 0;">© ${new Date().getFullYear()} Condomínio Fácil</p>
                    </div>
                </div>
            </body>
            </html>
        `,
    },
    // Condo Active Email
    condo_active: {
        subject: '✅ Plano Ativado - Condomínio Fácil',
        html: (data: any) => `
            <!DOCTYPE html>
            <html>
            <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
            <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f3f4f6;">
                <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
                    <div style="background: linear-gradient(135deg, #059669, #10b981); padding: 40px 20px; text-align: center;">
                        <h1 style="color: #ffffff; margin: 0; font-size: 28px;">✅ Plano Ativado!</h1>
                    </div>
                    <div style="padding: 40px 30px;">
                        <h2 style="color: #1f2937; margin-top: 0;">Olá, ${sanitizeHtml(data.nome)}!</h2>
                        <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
                            Seja bem-vindo ao <strong>Condomínio Fácil</strong>!
                        </p>
                        <div style="background-color: #ecfdf5; border-left: 4px solid #10b981; padding: 15px; margin: 25px 0;">
                            <p style="color: #065f46; margin: 0; font-weight: bold;">
                                ✨ Seu plano está ativo e todas as funcionalidades estão liberadas!
                            </p>
                        </div>
                        <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
                            Seu plano: <strong>${sanitizeHtml(data.plano || 'Profissional')}</strong><br>
                            Próximo vencimento: <strong>${sanitizeHtml(data.proximoVencimento)}</strong>
                        </p>
                        <div style="text-align: center; margin: 35px 0;">
                            <a href="${sanitizeHtml(data.loginUrl || 'https://meucondominiofacil.com/login')}" 
                               style="display: inline-block; background: #10b981; color: #ffffff; padding: 16px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
                                Acessar Dashboard →
                            </a>
                        </div>
                    </div>
                    <div style="background-color: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
                        <p style="color: #9ca3af; font-size: 12px; margin: 0;">© ${new Date().getFullYear()} Condomínio Fácil</p>
                    </div>
                </div>
            </body>
            </html>
        `,
    },
    // Condo Suspended Email
    condo_suspended: {
        subject: '⚠️ Plano Suspenso - Condomínio Fácil',
        html: (data: any) => `
            <!DOCTYPE html>
            <html>
            <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
            <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f3f4f6;">
                <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
                    <div style="background: linear-gradient(135deg, #ef4444, #dc2626); padding: 40px 20px; text-align: center;">
                        <h1 style="color: #ffffff; margin: 0; font-size: 28px;">⚠️ Plano Suspenso</h1>
                    </div>
                    <div style="padding: 40px 30px;">
                        <h2 style="color: #1f2937; margin-top: 0;">Olá, ${sanitizeHtml(data.nome)}!</h2>
                        <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
                            Seu plano no <strong>Condomínio Fácil</strong> foi suspenso.
                        </p>
                        <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 15px; margin: 25px 0;">
                            <p style="color: #991b1b; margin: 0; font-weight: bold;">
                                ⚠️ Entre em contato para regularização e reative seu acesso.
                            </p>
                        </div>
                        <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
                            Para regularizar sua situação, entre em contato conosco:
                        </p>
                        <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
                            📧 <a href="mailto:contato@meucondominiofacil.com" style="color: #10b981;">contato@meucondominiofacil.com</a>
                        </p>
                    </div>
                    <div style="background-color: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
                        <p style="color: #9ca3af; font-size: 12px; margin: 0;">© ${new Date().getFullYear()} Condomínio Fácil</p>
                    </div>
                </div>
            </body>
            </html>
        `,
    },
    // Admin Billing Notification
    admin_billing_notification: {
        subject: '📧 Nova Cobrança Enviada - Condomínio Fácil Admin',
        html: (data: any) => `
            <!DOCTYPE html>
            <html>
            <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
            <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f3f4f6;">
                <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
                    <div style="background: linear-gradient(135deg, #6366f1, #8b5cf6); padding: 40px 20px; text-align: center;">
                        <h1 style="color: #ffffff; margin: 0; font-size: 28px;">📧 Notificação de Cobrança</h1>
                    </div>
                    <div style="padding: 40px 30px;">
                        <h2 style="color: #1f2937; margin-top: 0;">Nova cobrança enviada</h2>
                        <div style="background-color: #f0f9ff; border: 1px solid #0ea5e9; border-radius: 8px; padding: 20px; margin: 25px 0;">
                            <p style="color: #0c4a6e; margin: 0 0 10px 0;"><strong>Detalhes:</strong></p>
                            <p style="margin: 5px 0;"><strong>Condomínio:</strong> ${sanitizeHtml(data.condoNome)}</p>
                            <p style="margin: 5px 0;"><strong>Valor:</strong> R$ ${sanitizeHtml(data.valor)}</p>
                            <p style="margin: 5px 0;"><strong>Destinatário:</strong> ${sanitizeHtml(data.destinatario)}</p>
                            <p style="margin: 5px 0;"><strong>Data:</strong> ${new Date().toLocaleString('pt-BR')}</p>
                        </div>
                    </div>
                    <div style="background-color: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
                        <p style="color: #9ca3af; font-size: 12px; margin: 0;">Notificação automática do sistema admin</p>
                    </div>
                </div>
            </body>
            </html>
        `,
    },
    // Payment Received Email
    payment_received: {
        subject: '✅ Pagamento Confirmado - Condomínio Fácil',
        html: (data: any) => `
            <!DOCTYPE html>
            <html>
            <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
            <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f3f4f6;">
                <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
                    <div style="background: linear-gradient(135deg, #059669, #10b981); padding: 40px 20px; text-align: center;">
                        <h1 style="color: #ffffff; margin: 0; font-size: 28px;">✅ Pagamento Confirmado!</h1>
                    </div>
                    <div style="padding: 40px 30px;">
                        <h2 style="color: #1f2937; margin-top: 0;">Olá, ${sanitizeHtml(data.nome || 'Cliente')}!</h2>
                        <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
                            Seu pagamento foi confirmado com sucesso! Obrigado por escolher o <strong>Condomínio Fácil</strong>.
                        </p>
                        <div style="background-color: #ecfdf5; border-left: 4px solid #10b981; padding: 15px; margin: 25px 0;">
                            <p style="color: #065f46; margin: 0; font-weight: bold;">
                                ✨ Pagamento processado com sucesso!
                            </p>
                        </div>
                        <div style="background-color: #f0fdf4; border: 1px solid #10b981; border-radius: 8px; padding: 20px; margin: 25px 0;">
                            <p style="color: #065f46; margin: 0 0 15px 0; font-size: 14px;"><strong>Detalhes do Pagamento:</strong></p>
                            <p style="color: #1f2937; margin: 5px 0;"><strong>Valor:</strong> R$ ${sanitizeHtml(data.valor?.toFixed(2) || '0,00')}</p>
                            <p style="color: #1f2937; margin: 5px 0;"><strong>ID Transação:</strong> ${sanitizeHtml(data.payment_id || 'N/A')}</p>
                            <p style="color: #1f2937; margin: 5px 0;"><strong>Método:</strong> ${sanitizeHtml(data.payment_method || 'Mercado Pago')}</p>
                            <p style="color: #1f2937; margin: 5px 0;"><strong>Data:</strong> ${new Date().toLocaleString('pt-BR')}</p>
                            ${data.descricao ? `<p style="color: #1f2937; margin: 5px 0;"><strong>Descrição:</strong> ${sanitizeHtml(data.descricao)}</p>` : ''}
                        </div>
                        ${data.receipt_url ? `
                        <div style="text-align: center; margin: 35px 0;">
                            <a href="${sanitizeHtml(data.receipt_url)}" 
                               style="display: inline-block; background: #10b981; color: #ffffff; padding: 16px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
                                📄 Baixar Comprovante
                            </a>
                        </div>
                        ` : ''}
                        <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
                            Caso tenha alguma dúvida, entre em contato conosco:
                        </p>
                        <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
                            📧 <a href="mailto:contato@meucondominiofacil.com" style="color: #10b981;">contato@meucondominiofacil.com</a>
                        </p>
                    </div>
                    <div style="background-color: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
                        <p style="color: #9ca3af; font-size: 12px; margin: 0;">© ${new Date().getFullYear()} Condomínio Fácil</p>
                    </div>
                </div>
            </body>
            </html>
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
        const supabase = await createClient();
        const body = await request.json();
        const { tipo, destinatario, dados, condoId, userId, internalCall } = body;

        // Validar tipo e template
        if (!tipo || !destinatario || !templates[tipo]) {
            return NextResponse.json({ error: 'Tipo de email inválido' }, { status: 400 });
        }

        // Validar formato de email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(destinatario)) {
            return NextResponse.json({ error: 'Email inválido' }, { status: 400 });
        }

        // ========================================
        // SEGURANÇA: Autenticação OPCIONAL para template welcome
        // ========================================
        let profile = null;
        let user = null;

        // Templates que NÃO requerem autenticação (chamadas internas)
        const publicTemplates = [
            'welcome',
            'legal_acceptance_confirmed',
            'user_credentials',
            'payment_received',
            'condo_trial',
            'condo_active',
            'condo_suspended',
            'resident_invoice'
        ];
        const requiresAuth = !publicTemplates.includes(tipo) || !internalCall;

        if (requiresAuth) {
            // Autenticação obrigatória
            const { data: { user: authUser } } = await supabase.auth.getUser();
            if (!authUser) {
                return NextResponse.json(
                    { error: 'Não autorizado. Faça login para continuar.' },
                    { status: 401 }
                );
            }
            user = authUser;

            // Buscar perfil do usuário
            const { data: profileData } = await supabase
                .from('users')
                .select('id, role, condo_id')
                .eq('id', user.id)
                .single();

            if (!profileData) {
                return NextResponse.json(
                    { error: 'Perfil não encontrado.' },
                    { status: 403 }
                );
            }
            profile = profileData;

            // Validação de role
            const allowedRoles = ['superadmin', 'sindico'];
            if (!allowedRoles.includes(profile.role)) {
                return NextResponse.json(
                    { error: 'Sem permissão para enviar emails.' },
                    { status: 403 }
                );
            }

            // Rate Limiting
            if (!checkRateLimit(user.id)) {
                return NextResponse.json(
                    { error: 'Limite de envio excedido. Aguarde 1 minuto.' },
                    { status: 429 }
                );
            }

            // Validar condoId se não for superadmin
            if (profile.role !== 'superadmin' && condoId && condoId !== profile.condo_id) {
                return NextResponse.json(
                    { error: 'Sem permissão para este condomínio.' },
                    { status: 403 }
                );
            }
        }

        const template = templates[tipo];
        const transporter = createTransporter();

        let status = 'enviado';
        let erro = null;
        let attempts = 0;
        const maxAttempts = 3;

        // ========================================
        // RETRY LOGIC: Tentar até 3 vezes
        // ========================================
        if (transporter) {
            let sent = false;
            while (attempts < maxAttempts && !sent) {
                attempts++;
                try {
                    await transporter.sendMail({
                        from: SMTP_FROM,
                        to: destinatario,
                        subject: template.subject,
                        html: template.html(dados || {}),
                    });
                    sent = true;
                    console.log(`Email enviado com sucesso para ${destinatario} (tentativa ${attempts})`);
                } catch (emailError: any) {
                    console.error(`Tentativa ${attempts} falhou:`, emailError.message);
                    if (attempts >= maxAttempts) {
                        status = 'falhou';
                        erro = `Falha após ${maxAttempts} tentativas: ${emailError.message}`;
                    } else {
                        // Aguardar antes de tentar novamente (backoff exponencial)
                        await new Promise(resolve => setTimeout(resolve, 1000 * attempts));
                    }
                }
            }
        } else {
            status = 'pendente';
            erro = 'SMTP não configurado';
        }

        // Log email (sem dados sensíveis)
        try {
            await supabase.from('email_logs').insert({
                condo_id: condoId || profile?.condo_id || null,
                user_id: userId || user?.id || null,
                tipo,
                destinatario,
                assunto: template.subject,
                status,
                erro,
            });
        } catch (logError) {
            console.error('Erro ao registrar log de email:', logError);
            // Não bloquear por erro de log
        }

        return NextResponse.json({
            success: status === 'enviado',
            status,
            attempts,
            error: erro
        });
    } catch (error: any) {
        console.error('Email API error:', error.message);
        return NextResponse.json(
            { error: 'Erro ao enviar email' },
            { status: 500 }
        );
    }
}
