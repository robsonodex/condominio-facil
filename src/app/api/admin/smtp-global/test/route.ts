import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import nodemailer from 'nodemailer';

/**
 * POST /api/admin/smtp-global/test
 * Testa conexão SMTP para configuração global (superadmin only)
 * AGORA ENVIA UM EMAIL DE TESTE REAL
 */
export async function POST(request: NextRequest) {
    try {
        // Autenticação via cookies
        const cookieHeader = request.headers.get('cookie') || '';

        // Extrair token de acesso do cookie sb-*-auth-token
        const cookies = cookieHeader.split(';').map(c => c.trim());
        let accessToken = '';

        for (const cookie of cookies) {
            if (cookie.includes('-auth-token')) {
                try {
                    const value = cookie.split('=')[1];
                    const decoded = decodeURIComponent(value);
                    const parsed = JSON.parse(decoded);
                    if (parsed.access_token) {
                        accessToken = parsed.access_token;
                        break;
                    }
                } catch {
                    // Pode ser base64 encoded
                    try {
                        const value = cookie.split('=')[1];
                        const base64 = value.replace('base64-', '');
                        const decoded = Buffer.from(base64, 'base64').toString('utf-8');
                        const parsed = JSON.parse(decoded);
                        if (parsed.access_token) {
                            accessToken = parsed.access_token;
                            break;
                        }
                    } catch {
                        continue;
                    }
                }
            }
        }

        if (!accessToken) {
            return NextResponse.json({
                error: 'Não autorizado',
                details: 'Token de acesso não encontrado nos cookies'
            }, { status: 401 });
        }

        // Verificar usuário
        const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(accessToken);
        if (authError || !user) {
            return NextResponse.json({
                error: 'Não autorizado',
                details: 'Sessão inválida ou expirada'
            }, { status: 401 });
        }

        // Verificar se é superadmin
        const { data: profile } = await supabaseAdmin
            .from('users')
            .select('role')
            .eq('email', user.email)
            .single();

        if (!profile || profile.role !== 'superadmin') {
            return NextResponse.json({ error: 'Apenas superadmin pode testar' }, { status: 403 });
        }

        // Obter dados do body
        const body = await request.json();
        const { smtp_host, smtp_port, smtp_user, smtp_password, smtp_secure, smtp_from_email } = body;

        if (!smtp_host || !smtp_port || !smtp_user || !smtp_password) {
            return NextResponse.json({
                error: 'Campos obrigatórios: smtp_host, smtp_port, smtp_user, smtp_password'
            }, { status: 400 });
        }

        // Criar transporter para teste
        // IMPORTANTE: Porta 465 = SSL implícito (secure: true)
        //             Porta 587 = STARTTLS (secure: false)
        const port = parseInt(smtp_port);
        const useSecure = port === 465; // SSL implícito apenas na 465

        console.log(`[SMTP Test] Configurando: ${smtp_host}:${port}, secure=${useSecure}, user=${smtp_user}`);

        const transporter = nodemailer.createTransport({
            host: smtp_host,
            port: port,
            secure: useSecure, // true para 465, false para 587
            auth: {
                user: smtp_user,
                pass: smtp_password
            },
            tls: {
                // Não falhar em certificados inválidos
                rejectUnauthorized: false
            },
            connectionTimeout: 30000,
            greetingTimeout: 15000,
            socketTimeout: 30000,
            debug: true,
            logger: true
        });

        try {
            // 1. Primeiro verificar conexão
            await transporter.verify();
            console.log('[SMTP Test] Conexão verificada com sucesso');

            // 2. ENVIAR EMAIL DE TESTE REAL
            const testEmailTo = user.email || smtp_from_email || smtp_user;

            const info = await transporter.sendMail({
                from: smtp_from_email || smtp_user,
                to: testEmailTo,
                subject: '✅ Teste SMTP - Condomínio Fácil',
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                        <div style="background: linear-gradient(135deg, #10b981, #059669); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                            <h1 style="color: white; margin: 0;">✅ SMTP Funcionando!</h1>
                        </div>
                        <div style="background: #f3f4f6; padding: 30px; border-radius: 0 0 10px 10px;">
                            <p style="color: #1f2937; font-size: 16px;">
                                Este é um email de teste do <strong>Condomínio Fácil</strong>.
                            </p>
                            <p style="color: #4b5563;">
                                Se você está vendo esta mensagem, sua configuração SMTP está funcionando corretamente!
                            </p>
                            <div style="background: white; padding: 15px; border-radius: 8px; margin-top: 20px;">
                                <p style="margin: 5px 0;"><strong>Host:</strong> ${smtp_host}</p>
                                <p style="margin: 5px 0;"><strong>Porta:</strong> ${smtp_port}</p>
                                <p style="margin: 5px 0;"><strong>Usuário:</strong> ${smtp_user}</p>
                                <p style="margin: 5px 0;"><strong>Seguro (TLS/SSL):</strong> ${smtp_secure !== false ? 'Sim' : 'Não'}</p>
                            </div>
                            <p style="color: #6b7280; font-size: 12px; margin-top: 20px;">
                                Enviado em: ${new Date().toLocaleString('pt-BR')}
                            </p>
                        </div>
                    </div>
                `
            });

            console.log('[SMTP Test] Email de teste enviado para:', testEmailTo, 'MessageId:', info.messageId);

            return NextResponse.json({
                success: true,
                message: `Teste completo! Email enviado para ${testEmailTo}`,
                details: {
                    connection: 'ok',
                    emailSent: true,
                    sentTo: testEmailTo,
                    messageId: info.messageId
                }
            });

        } catch (smtpError: any) {
            console.error('[SMTP Global Test] SMTP error:', smtpError);

            let errorMessage = 'Falha na conexão SMTP';
            let errorCode = smtpError.code || smtpError.responseCode || 'UNKNOWN';

            if (smtpError.code === 'ECONNREFUSED') {
                errorMessage = 'Conexão recusada. Verifique o host e a porta.';
            } else if (smtpError.code === 'ETIMEDOUT') {
                errorMessage = 'Tempo limite excedido. Verifique sua conexão.';
            } else if (smtpError.code === 'EAUTH' || smtpError.responseCode === 535) {
                errorMessage = 'Falha na autenticação. Verifique usuário e senha.';
            } else if (smtpError.code === 'ESOCKET') {
                errorMessage = 'Erro de socket. Verifique se a porta e TLS/SSL estão corretos.';
            } else if (smtpError.message) {
                errorMessage = smtpError.message;
            }

            return NextResponse.json({
                success: false,
                error: errorMessage,
                errorCode: errorCode,
                details: smtpError.message
            }, { status: 400 });
        }

    } catch (error: any) {
        console.error('[SMTP Global Test] Exception:', error);
        return NextResponse.json({ error: 'Erro interno', details: error.message }, { status: 500 });
    }
}
