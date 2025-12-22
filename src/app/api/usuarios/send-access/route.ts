import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getSessionFromReq } from '@/lib/auth-api';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function POST(request: NextRequest) {
    try {
        // Verify session
        const session = await getSessionFromReq(request);
        if (!session) {
            return NextResponse.json({ error: 'Sessão inválida. Faça login novamente.' }, { status: 401 });
        }

        // Check if user is sindico or superadmin
        const { data: callerProfile } = await supabaseAdmin
            .from('users')
            .select('role, condo_id')
            .eq('id', session.userId)
            .single();

        if (!callerProfile || !['sindico', 'superadmin'].includes(callerProfile.role)) {
            return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
        }

        const { userId, email, nome, password } = await request.json();

        if (!userId || !email || !password) {
            return NextResponse.json({ error: 'Dados incompletos' }, { status: 400 });
        }

        // Verify target user belongs to same condo (for sindico)
        if (callerProfile.role === 'sindico') {
            const { data: targetUser } = await supabaseAdmin
                .from('users')
                .select('condo_id')
                .eq('id', userId)
                .single();

            if (!targetUser || targetUser.condo_id !== callerProfile.condo_id) {
                return NextResponse.json({ error: 'Usuário não pertence ao seu condomínio' }, { status: 403 });
            }
        }

        // Update password in Supabase Auth
        const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(
            userId,
            { password }
        );

        if (authError) {
            console.error('[SEND-ACCESS] Auth error:', authError);
            return NextResponse.json({ error: 'Erro ao definir senha: ' + authError.message }, { status: 500 });
        }

        // Send email with credentials
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://meucondominiofacil.com';

        try {
            await fetch(`${appUrl}/api/email`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    tipo: 'user_credentials',
                    destinatario: email,
                    internalCall: true,
                    dados: {
                        nome: nome || 'Morador',
                        email,
                        senha: password,
                        loginUrl: `${appUrl}/login`,
                    }
                })
            });
            console.log(`[SEND-ACCESS] Credentials email sent to ${email}`);
        } catch (emailError) {
            console.error('[SEND-ACCESS] Email error:', emailError);
            // Don't fail - password was already set
        }

        return NextResponse.json({
            success: true,
            message: 'Credenciais enviadas com sucesso!'
        });

    } catch (error: any) {
        console.error('[SEND-ACCESS] Error:', error);
        return NextResponse.json({ error: error.message || 'Erro interno' }, { status: 500 });
    }
}
