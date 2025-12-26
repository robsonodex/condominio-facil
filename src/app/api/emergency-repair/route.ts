import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

// API DE EMERGÊNCIA para reparar usuários
// REMOVER APÓS USO - Contém operações sensíveis

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { action, email, newPassword } = body;

        if (action === 'check') {
            // Verificar status do usuário
            const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers();
            const authUser = authUsers?.users?.find(u => u.email === email);

            if (!authUser) {
                return NextResponse.json({
                    found: false,
                    message: 'Usuário NÃO EXISTE no Supabase Auth'
                });
            }

            // Verificar profile
            const { data: profile } = await supabaseAdmin
                .from('users')
                .select('*')
                .eq('id', authUser.id)
                .single();

            const { data: profileByEmail } = await supabaseAdmin
                .from('users')
                .select('*')
                .eq('email', email)
                .single();

            return NextResponse.json({
                found: true,
                auth: {
                    id: authUser.id,
                    email: authUser.email,
                    emailConfirmed: !!authUser.email_confirmed_at,
                    lastSignIn: authUser.last_sign_in_at,
                    banned: !!authUser.banned_until,
                },
                profileById: profile ? {
                    id: profile.id,
                    email: profile.email,
                    role: profile.role,
                    ativo: profile.ativo,
                    condo_id: profile.condo_id,
                } : null,
                profileByEmail: profileByEmail ? {
                    id: profileByEmail.id,
                    email: profileByEmail.email,
                    role: profileByEmail.role,
                    ativo: profileByEmail.ativo,
                } : null,
                issues: {
                    noProfile: !profile && !profileByEmail,
                    idMismatch: profileByEmail && profileByEmail.id !== authUser.id,
                    inactive: profile?.ativo === false || profileByEmail?.ativo === false,
                }
            });
        }

        if (action === 'fix') {
            // Corrigir usuário - criar ou atualizar profile
            const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers();
            const authUser = authUsers?.users?.find(u => u.email === email);

            if (!authUser) {
                return NextResponse.json({
                    success: false,
                    message: 'Usuário não existe no Auth'
                }, { status: 400 });
            }

            // Verificar se já existe profile com esse email mas ID diferente
            const { data: existingByEmail } = await supabaseAdmin
                .from('users')
                .select('id')
                .eq('email', email)
                .single();

            if (existingByEmail && existingByEmail.id !== authUser.id) {
                // Atualizar ID do profile existente para corresponder ao Auth
                await supabaseAdmin
                    .from('users')
                    .update({ id: authUser.id, ativo: true })
                    .eq('email', email);

                return NextResponse.json({
                    success: true,
                    action: 'updated_id',
                    message: `Profile atualizado: ID alterado de ${existingByEmail.id} para ${authUser.id}`
                });
            }

            // Verificar se existe profile com ID correto
            const { data: existingById } = await supabaseAdmin
                .from('users')
                .select('*')
                .eq('id', authUser.id)
                .single();

            if (existingById) {
                // Apenas garantir que está ativo
                await supabaseAdmin
                    .from('users')
                    .update({ ativo: true })
                    .eq('id', authUser.id);

                return NextResponse.json({
                    success: true,
                    action: 'activated',
                    message: 'Profile já existia, foi ativado'
                });
            }

            // Criar novo profile
            await supabaseAdmin.from('users').insert({
                id: authUser.id,
                email: email,
                nome: authUser.user_metadata?.nome || email.split('@')[0],
                role: 'superadmin', // Assumindo que é superadmin
                ativo: true,
            });

            return NextResponse.json({
                success: true,
                action: 'created',
                message: 'Novo profile criado com role superadmin'
            });
        }

        if (action === 'reset_password') {
            // Resetar senha do usuário
            if (!newPassword || newPassword.length < 6) {
                return NextResponse.json({
                    success: false,
                    message: 'Nova senha deve ter pelo menos 6 caracteres'
                }, { status: 400 });
            }

            const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers();
            const authUser = authUsers?.users?.find(u => u.email === email);

            if (!authUser) {
                return NextResponse.json({
                    success: false,
                    message: 'Usuário não existe no Auth'
                }, { status: 400 });
            }

            // Atualizar senha usando admin API
            const { error } = await supabaseAdmin.auth.admin.updateUserById(
                authUser.id,
                { password: newPassword }
            );

            if (error) {
                return NextResponse.json({
                    success: false,
                    message: 'Erro ao resetar senha: ' + error.message
                }, { status: 500 });
            }

            return NextResponse.json({
                success: true,
                message: 'Senha alterada com sucesso!'
            });
        }

        return NextResponse.json({
            error: 'Ação inválida. Use: check, fix, ou reset_password'
        }, { status: 400 });

    } catch (error: any) {
        console.error('[REPAIR] Error:', error);
        return NextResponse.json({
            error: error.message
        }, { status: 500 });
    }
}
