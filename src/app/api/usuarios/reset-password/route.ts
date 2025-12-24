'use server';

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Gerar senha aleatória de 8 caracteres
function generatePassword(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    let password = '';
    for (let i = 0; i < 8; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
}

export async function POST(req: NextRequest) {
    try {
        // Verificar autenticação
        const authHeader = req.headers.get('authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        const token = authHeader.replace('Bearer ', '');
        const { data: { user: authUser }, error: authError } = await supabaseAdmin.auth.getUser(token);

        if (authError || !authUser) {
            return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
        }

        // Verificar se é síndico ou superadmin
        const { data: requestingUser } = await supabaseAdmin
            .from('users')
            .select('role, condo_id')
            .eq('id', authUser.id)
            .single();

        if (!requestingUser || !['sindico', 'superadmin'].includes(requestingUser.role)) {
            return NextResponse.json({ error: 'Apenas síndicos podem resetar senhas' }, { status: 403 });
        }

        const { userId } = await req.json();

        if (!userId) {
            return NextResponse.json({ error: 'ID do usuário é obrigatório' }, { status: 400 });
        }

        // Buscar usuário alvo
        const { data: targetUser } = await supabaseAdmin
            .from('users')
            .select('id, nome, email, role, condo_id')
            .eq('id', userId)
            .single();

        if (!targetUser) {
            return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
        }

        // Verificar se o usuário pertence ao mesmo condomínio (se não for superadmin)
        if (requestingUser.role !== 'superadmin' && targetUser.condo_id !== requestingUser.condo_id) {
            return NextResponse.json({ error: 'Usuário não pertence ao seu condomínio' }, { status: 403 });
        }

        // Não permitir síndico resetar senha de outros síndicos ou superadmins
        if (requestingUser.role === 'sindico' && (targetUser.role === 'superadmin' || targetUser.role === 'sindico')) {
            return NextResponse.json({ error: 'Síndicos não podem resetar senha de outros administradores' }, { status: 403 });
        }

        // Não permitir ninguém resetar senha de superadmins (exceto ele mesmo, se houver)
        if (targetUser.role === 'superadmin' && requestingUser.role !== 'superadmin') {
            return NextResponse.json({ error: 'Não é possível resetar senha de superadmin' }, { status: 403 });
        }

        // Gerar nova senha
        const newPassword = generatePassword();

        console.log(`[PASSWORD_RESET] Tentando resetar senha do usuário ${targetUser.email} (${targetUser.id})`);

        // Atualizar senha no Supabase Auth
        const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
            password: newPassword,
        });

        if (updateError) {
            console.error('[PASSWORD_RESET] Erro ao atualizar senha:', updateError);
            return NextResponse.json({ error: `Erro ao resetar senha: ${updateError.message}` }, { status: 500 });
        }

        // Log do envio de email (em produção, integrar com sistema de email real)
        console.log(`[PASSWORD_RESET] Nova senha para ${targetUser.email}: ${newPassword}`);

        // Registrar na tabela de logs de email para envio posterior (opcional)
        try {
            await supabaseAdmin.from('email_logs').insert({
                to_email: targetUser.email,
                subject: 'Sua senha foi resetada',
                template: 'password_reset',
                status: 'pending',
                metadata: {
                    user_id: targetUser.id,
                    user_name: targetUser.nome,
                    triggered_by: authUser.id,
                }
            });
        } catch (emailLogError) {
            console.log('Email log not saved:', emailLogError);
        }

        return NextResponse.json({
            success: true,
            message: `Senha resetada! Nova senha: ${newPassword}`,
            newPassword, // Retorna para o síndico poder informar manualmente se necessário
        });

    } catch (error: unknown) {
        console.error('Erro ao resetar senha:', error);
        return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
    }
}
