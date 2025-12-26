/**
 * Helper para envio de emails server-side
 * Usa diretamente o nodemailer sem precisar de HTTP request
 */

import nodemailer from 'nodemailer';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { decryptPassword, isEncrypted } from '@/lib/smtp-crypto';

interface EmailData {
    to: string;
    subject: string;
    html: string;
    condoId?: string;
}

interface SmtpConfig {
    host: string;
    port: number;
    user: string;
    pass: string;
    from: string;
    fromName: string;
}

/**
 * Busca configuração SMTP global
 */
async function getGlobalSmtpConfig(): Promise<SmtpConfig | null> {
    try {
        const { data: config, error } = await supabaseAdmin
            .from('configuracoes_smtp')
            .select('*')
            .is('condominio_id', null)
            .eq('is_active', true)
            .single();

        if (error || !config) {
            console.log('[EmailHelper] SMTP global não encontrado');
            return null;
        }

        // Descriptografar senha
        let password = config.smtp_password;
        if (isEncrypted(password)) {
            password = decryptPassword(password);
        }

        return {
            host: config.smtp_host,
            port: config.smtp_port,
            user: config.smtp_user,
            pass: password,
            from: config.smtp_from_email,
            fromName: config.smtp_from_name || 'Meu Condomínio Fácil'
        };
    } catch (err) {
        console.error('[EmailHelper] Erro ao buscar SMTP:', err);
        return null;
    }
}

/**
 * Envia email diretamente usando nodemailer
 * Esta função pode ser chamada de qualquer lugar do server-side
 */
export async function sendEmailDirect(data: EmailData): Promise<{ success: boolean; error?: string }> {
    try {
        // Buscar config SMTP
        const smtpConfig = await getGlobalSmtpConfig();

        if (!smtpConfig) {
            console.error('[EmailHelper] SMTP não configurado');
            return { success: false, error: 'SMTP não configurado' };
        }

        console.log(`[EmailHelper] Enviando email para ${data.to} via ${smtpConfig.host}:${smtpConfig.port}`);

        // Configurar transporter
        const port = smtpConfig.port;
        const useSecure = port === 465;

        const transporter = nodemailer.createTransport({
            host: smtpConfig.host,
            port: port,
            secure: useSecure,
            auth: {
                user: smtpConfig.user,
                pass: smtpConfig.pass
            },
            tls: { rejectUnauthorized: false },
            connectionTimeout: 30000,
            greetingTimeout: 15000,
            socketTimeout: 30000
        });

        // Enviar
        const from = smtpConfig.fromName
            ? `"${smtpConfig.fromName}" <${smtpConfig.from}>`
            : smtpConfig.from;

        const info = await transporter.sendMail({
            from,
            to: data.to,
            subject: data.subject,
            html: data.html
        });

        console.log(`[EmailHelper] Email enviado! MessageId: ${info.messageId}`);

        // Log no banco
        try {
            await supabaseAdmin.from('email_logs').insert({
                condo_id: data.condoId || null,
                tipo: 'user_credentials',
                destinatario: data.to,
                assunto: data.subject,
                status: 'enviado'
            });
        } catch (logErr) {
            console.error('[EmailHelper] Erro ao logar email:', logErr);
        }

        return { success: true };

    } catch (err: any) {
        console.error('[EmailHelper] Erro ao enviar email:', err.message);
        return { success: false, error: err.message };
    }
}

/**
 * Envia email de credenciais para novo usuário
 */
export async function sendCredentialsEmail(
    email: string,
    nome: string,
    senha: string,
    role: string,
    condoNome?: string,
    condoId?: string
): Promise<{ success: boolean; error?: string }> {
    const loginUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.meucondominiofacil.com';

    const html = `
        <!DOCTYPE html>
        <html>
        <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f3f4f6;">
            <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
                <div style="background: linear-gradient(135deg, #059669, #10b981); padding: 40px 20px; text-align: center;">
                    <h1 style="color: #ffffff; margin: 0; font-size: 28px;">🔐 Suas Credenciais de Acesso</h1>
                </div>
                <div style="padding: 40px 30px;">
                    <h2 style="color: #1f2937; margin-top: 0;">Olá, ${nome}!</h2>
                    <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
                        Sua conta foi criada com sucesso no <strong>Condomínio Fácil</strong>.
                    </p>
                    ${condoNome ? `<p style="color: #4b5563;">Condomínio: <strong>${condoNome}</strong></p>` : ''}
                    <p style="color: #4b5563;">Perfil: <strong>${role}</strong></p>
                    
                    <div style="background: #f3f4f6; padding: 20px; border-radius: 10px; margin: 25px 0;">
                        <p style="margin: 10px 0; color: #1f2937;"><strong>📧 Email:</strong> ${email}</p>
                        <p style="margin: 10px 0; color: #1f2937;"><strong>🔑 Senha:</strong> ${senha}</p>
                    </div>
                    
                    <div style="text-align: center; margin-top: 30px;">
                        <a href="${loginUrl}/login" style="background: #059669; color: #ffffff; padding: 14px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
                            Acessar Minha Conta
                        </a>
                    </div>
                    
                    <p style="color: #9ca3af; font-size: 12px; margin-top: 30px; text-align: center;">
                        Recomendamos alterar sua senha após o primeiro acesso.
                    </p>
                </div>
                <div style="background: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
                    <p style="color: #9ca3af; font-size: 12px; margin: 0;">© ${new Date().getFullYear()} Condomínio Fácil</p>
                </div>
            </div>
        </body>
        </html>
    `;

    return sendEmailDirect({
        to: email,
        subject: '🔐 Suas Credenciais de Acesso - Condomínio Fácil',
        html,
        condoId
    });
}
