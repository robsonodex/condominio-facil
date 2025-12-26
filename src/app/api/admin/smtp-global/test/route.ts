import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import nodemailer from 'nodemailer';

/**
 * POST /api/admin/smtp-global/test
 * Testa conexão SMTP para configuração global (superadmin only)
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
        const { smtp_host, smtp_port, smtp_user, smtp_password, smtp_secure } = body;

        if (!smtp_host || !smtp_port || !smtp_user || !smtp_password) {
            return NextResponse.json({
                error: 'Campos obrigatórios: smtp_host, smtp_port, smtp_user, smtp_password'
            }, { status: 400 });
        }

        // Testar conexão SMTP
        const transporter = nodemailer.createTransport({
            host: smtp_host,
            port: parseInt(smtp_port),
            secure: smtp_secure !== false,
            auth: {
                user: smtp_user,
                pass: smtp_password
            },
            connectionTimeout: 10000,
            greetingTimeout: 5000,
            socketTimeout: 10000
        });

        try {
            await transporter.verify();
            return NextResponse.json({
                success: true,
                message: 'Conexão SMTP testada com sucesso!'
            });
        } catch (smtpError: any) {
            console.error('[SMTP Global Test] SMTP error:', smtpError);

            let errorMessage = 'Falha na conexão SMTP';
            if (smtpError.code === 'ECONNREFUSED') {
                errorMessage = 'Conexão recusada. Verifique o host e a porta.';
            } else if (smtpError.code === 'ETIMEDOUT') {
                errorMessage = 'Tempo limite excedido. Verifique sua conexão.';
            } else if (smtpError.code === 'EAUTH') {
                errorMessage = 'Falha na autenticação. Verifique usuário e senha.';
            } else if (smtpError.responseCode === 535) {
                errorMessage = 'Credenciais inválidas. Verifique usuário e senha.';
            } else if (smtpError.message) {
                errorMessage = smtpError.message;
            }

            return NextResponse.json({
                success: false,
                error: errorMessage
            }, { status: 400 });
        }

    } catch (error: any) {
        console.error('[SMTP Global Test] Exception:', error);
        return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
    }
}
