import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import nodemailer from 'nodemailer';

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();

        // Verificar autenticação
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            console.error('[TEST_SMTP] Auth error details:', authError);

            const cookieStore = await cookies();
            const allCookies = cookieStore.getAll();
            const cookieNames = allCookies.map(c => c.name);

            // Tentar getSession como fallback para diagnóstico
            const { data: sessionData } = await supabase.auth.getSession();

            return NextResponse.json({
                error: 'Não autorizado',
                details: 'Sessão não encontrada ou expirada. Por favor, faça login novamente.',
                auth_error: authError,
                has_session: !!sessionData.session,
                cookies_found: cookieNames,
                code: authError?.code || 'AUTH_NOT_FOUND'
            }, { status: 401 });
        }

        console.log('[TEST_SMTP] User authenticated:', user.id);

        // Buscar perfil do usuário
        const { data: profile, error: profileError } = await supabase
            .from('users')
            .select('id, role, condo_id')
            .eq('id', user.id)
            .single();

        if (profileError || !profile) {
            console.error('[TEST_SMTP] Profile error:', profileError);
            return NextResponse.json({
                error: 'Perfil não encontrado',
                details: profileError?.message
            }, { status: 404 });
        }

        if (!['sindico', 'superadmin'].includes(profile.role)) {
            console.warn('[TEST_SMTP] Access denied for role:', profile.role);
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

        // Testar conexão SMTP
        const transporter = nodemailer.createTransport({
            host: smtp_host,
            port: parseInt(smtp_port),
            secure: smtp_secure !== false,
            auth: {
                user: smtp_user,
                pass: smtp_password
            },
            connectionTimeout: 10000, // 10 segundos
            greetingTimeout: 5000,
            socketTimeout: 10000
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
