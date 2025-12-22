import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getSessionFromReq } from '@/lib/supabase/admin';

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

        // Try to update password in Supabase Auth
        let { error: authError } = await supabaseAdmin.auth.admin.updateUserById(
            userId,
            { password }
        );

        // If user not found in Auth, create them
        if (authError && authError.message.includes('not found')) {
            console.log('[SEND-ACCESS] User not in Auth, creating...');

            const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
                email,
                password,
                email_confirm: true, // Auto-confirm email
                user_metadata: { nome }
            });

            if (createError) {
                console.error('[SEND-ACCESS] Create user error:', createError);

                // If user already exists with this email in Auth but different ID
                if (createError.message.includes('already been registered')) {
                    // Get the Auth user by email and update password
                    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
                    const authUser = existingUsers?.users?.find(u => u.email === email);

                    if (authUser) {
                        const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
                            authUser.id,
                            { password }
                        );

                        if (updateError) {
                            return NextResponse.json({ error: 'Erro ao definir senha: ' + updateError.message }, { status: 500 });
                        }

                        // Update the users table to use the correct Auth ID
                        await supabaseAdmin
                            .from('users')
                            .update({ id: authUser.id })
                            .eq('id', userId);

                        console.log('[SEND-ACCESS] Updated existing Auth user password');
                    } else {
                        return NextResponse.json({ error: 'Erro: E-mail já cadastrado em outro usuário' }, { status: 400 });
                    }
                } else {
                    return NextResponse.json({ error: 'Erro ao criar acesso: ' + createError.message }, { status: 500 });
                }
            } else {
                console.log('[SEND-ACCESS] Auth user created successfully');

                // If Auth created with different ID, we need to update users table
                if (newUser?.user && newUser.user.id !== userId) {
                    console.log('[SEND-ACCESS] Updating users table ID from', userId, 'to', newUser.user.id);

                    // Update residents table first (foreign key)
                    await supabaseAdmin
                        .from('residents')
                        .update({ user_id: newUser.user.id })
                        .eq('user_id', userId);

                    // Update users table - actually we need to delete old and insert with new ID
                    const { data: oldUser } = await supabaseAdmin
                        .from('users')
                        .select('*')
                        .eq('id', userId)
                        .single();

                    if (oldUser) {
                        await supabaseAdmin.from('users').delete().eq('id', userId);
                        await supabaseAdmin.from('users').insert({
                            ...oldUser,
                            id: newUser.user.id,
                        });
                    }
                }
            }
        } else if (authError) {
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
