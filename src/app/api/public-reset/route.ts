import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

/**
 * API de Reset de Emergência PÚBLICA
 * Usa uma chave secreta para autorizar
 */

// CHAVE SECRETA - mude isso depois de usar!
const SECRET_KEY = 'NODEX_EMERGENCY_2024';

export async function POST(request: NextRequest) {
    try {
        const { secretKey, email, newPassword } = await request.json();

        // Verificar chave secreta
        if (secretKey !== SECRET_KEY) {
            return NextResponse.json({ error: 'Chave secreta inválida' }, { status: 403 });
        }

        if (!email || !newPassword) {
            return NextResponse.json({ error: 'Email e nova senha são obrigatórios' }, { status: 400 });
        }

        if (newPassword.length < 6) {
            return NextResponse.json({ error: 'Senha deve ter no mínimo 6 caracteres' }, { status: 400 });
        }

        // Buscar usuário no Auth
        const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers();
        const authUser = authUsers?.users?.find(u => u.email === email);

        if (!authUser) {
            return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
        }

        // Resetar senha diretamente (SEM ENVIAR EMAIL)
        const { error } = await supabaseAdmin.auth.admin.updateUserById(authUser.id, {
            password: newPassword,
            email_confirm: true
        });

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            message: `Senha de ${email} resetada com sucesso! Faça login com a nova senha.`
        });

    } catch (error: any) {
        console.error('[Public Reset] Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
