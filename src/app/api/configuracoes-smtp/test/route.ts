import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromReq } from '@/lib/supabase/admin';
import nodemailer from 'nodemailer';

export async function POST(request: NextRequest) {
    try {
        // Usar getSessionFromReq que funciona corretamente com cookies
        const session = await getSessionFromReq(request);

        if (!session) {
            console.error('[TEST_SMTP] Auth failed - no session');
            return NextResponse.json({
                error: 'Não autorizado',
                details: 'Sessão não encontrada ou expirada. Por favor, faça login novamente.',
                code: 'AUTH_NOT_FOUND'
            }, { status: 401 });
        }

        console.log('[TEST_SMTP] User authenticated:', session.userId, session.role);

        if (!['sindico', 'superadmin'].includes(session.role)) {
            console.warn('[TEST_SMTP] Access denied for role:', session.role);
            return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
        }

        const body = await request.json();
        const { smtp_host, smtp_port, smtp_user, smtp_password, smtp_secure } = body;

        // Validar campos obrigatórios
        if (!smtp_host || !smtp_port || !smtp_user || !smtp_password) {
            return NextResponse.json({
                error: 'Campos obrigatórios: smtp_host, smtp_port, smtp_user, smtp_password'
            }, { status: 400 });
        }

        // Determinar se usa SSL direto
        // Porta 465 = SSL direto (secure: true)
        // Porta 587 = STARTTLS (secure: false)
        const portNum = parseInt(smtp_port);
        const useSecure = portNum === 465 ? true : (smtp_secure === true);

        console.log('[TEST_SMTP] Config:', {
            host: smtp_host,
            port: portNum,
            user: smtp_user,
            secure: useSecure,
            smtp_secure_param: smtp_secure
        });

        // Testar conexão SMTP
        const transporter = nodemailer.createTransport({
            host: smtp_host,
            port: portNum,
            secure: useSecure,
            auth: {
                user: smtp_user,
                pass: smtp_password
            },
            connectionTimeout: 15000,
            greetingTimeout: 10000,
            socketTimeout: 15000
        });

        try {
            // Verificar conexão
            await transporter.verify();

            return NextResponse.json({
                success: true,
                message: 'Conexão SMTP testada com sucesso!'
            });

        } catch (smtpError: any) {
            console.error('Erro de conexão SMTP:', smtpError);

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
        console.error('Erro na API test SMTP:', error);
        return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
    }
}
