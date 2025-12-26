import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, getSessionFromReq } from '@/lib/supabase/admin';

/**
 * API de Reparo de Emergência - EXCLUSIVO PARA SUPERADMIN
 * Permite verificar status de usuários e resetar senhas
 */
export async function POST(request: NextRequest) {
    try {
        // Verificar se é superadmin
        const session = await getSessionFromReq(request);
        if (!session?.isSuperadmin) {
            return NextResponse.json({ error: 'Acesso negado - apenas superadmin' }, { status: 403 });
        }

        const { action, email, newPassword } = await request.json();

        if (action === 'check') {
            // Verificar status do usuário
            const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers();
            const authUser = authUsers?.users?.find(u => u.email === email);

            const { data: profile } = await supabaseAdmin
                .from('users')
                .select('*')
                .eq('email', email)
                .single();

            return NextResponse.json({
                authExists: !!authUser,
                authUser: authUser ? {
                    id: authUser.id,
                    email: authUser.email,
                    emailConfirmed: !!authUser.email_confirmed_at,
                    lastSignIn: authUser.last_sign_in_at,
                    created: authUser.created_at
                } : null,
                profileExists: !!profile,
                profile: profile ? {
                    id: profile.id,
                    email: profile.email,
                    nome: profile.nome,
                    role: profile.role,
                    ativo: profile.ativo,
                    condo_id: profile.condo_id
                } : null
            });
        }

        if (action === 'reset_password') {
            if (!email || !newPassword) {
                return NextResponse.json({ error: 'Email e nova senha são obrigatórios' }, { status: 400 });
            }

            // Buscar usuário no Auth
            const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers();
            const authUser = authUsers?.users?.find(u => u.email === email);

            if (!authUser) {
                return NextResponse.json({ error: 'Usuário não encontrado no Auth' }, { status: 404 });
            }

            // Resetar senha
            const { error } = await supabaseAdmin.auth.admin.updateUserById(authUser.id, {
                password: newPassword,
                email_confirm: true
            });

            if (error) {
                return NextResponse.json({ error: error.message }, { status: 500 });
            }

            return NextResponse.json({
                success: true,
                message: `Senha de ${email} resetada com sucesso!`
            });
        }

        if (action === 'list_users') {
            // Listar todos os usuários
            const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers();
            const { data: profiles } = await supabaseAdmin.from('users').select('email, nome, role, ativo');

            return NextResponse.json({
                authCount: authUsers?.users?.length || 0,
                profileCount: profiles?.length || 0,
                users: authUsers?.users?.slice(0, 20).map(u => ({
                    email: u.email,
                    confirmed: !!u.email_confirmed_at,
                    lastSignIn: u.last_sign_in_at,
                    profile: profiles?.find(p => p.email === u.email)
                }))
            });
        }

        return NextResponse.json({ error: 'Ação inválida' }, { status: 400 });

    } catch (error: any) {
        console.error('[Emergency Repair] Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
