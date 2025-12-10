import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, getSessionFromReq } from '@/lib/supabase/admin';

/**
 * DELETE /api/user/delete?id=xxx
 * Delete user (superadmin/síndico only)
 */
export async function DELETE(request: NextRequest) {
    try {
        console.log('[DELETE USER] Starting delete request...');

        // Get session from request
        const session = await getSessionFromReq(request);
        if (!session) {
            console.log('[DELETE USER] No session found');
            return NextResponse.json(
                { error: 'Não autorizado. Faça login para continuar.', success: false },
                { status: 401 }
            );
        }

        console.log('[DELETE USER] Session:', session.email, session.role);

        const { searchParams } = new URL(request.url);
        const targetUserId = searchParams.get('id');

        if (!targetUserId) {
            return NextResponse.json(
                { error: 'ID do usuário é obrigatório', success: false },
                { status: 400 }
            );
        }

        console.log('[DELETE USER] Target user ID:', targetUserId);

        // Check permission - only superadmin and síndico can delete
        if (!session.isSuperadmin && !session.isSindico) {
            console.log('[DELETE USER] Permission denied for role:', session.role);
            return NextResponse.json({
                error: 'Acesso negado',
                message: 'Apenas administradores podem excluir usuários.',
                success: false,
            }, { status: 403 });
        }

        // Fetch target user
        const { data: targetUser, error: fetchError } = await supabaseAdmin
            .from('users')
            .select('id, nome, role, condo_id')
            .eq('id', targetUserId)
            .single();

        if (fetchError) {
            console.log('[DELETE USER] Fetch error:', fetchError);
            return NextResponse.json({
                error: 'Usuário não encontrado',
                message: fetchError.message,
                success: false,
            }, { status: 404 });
        }

        if (!targetUser) {
            return NextResponse.json({
                error: 'Usuário não encontrado',
                success: false,
            }, { status: 404 });
        }

        console.log('[DELETE USER] Target user found:', targetUser.nome, targetUser.role);

        // Cannot delete superadmin
        if (targetUser.role === 'superadmin') {
            return NextResponse.json({
                error: 'Não é possível excluir um superadmin',
                success: false,
            }, { status: 403 });
        }

        // Síndico can only delete users from their own condo
        if (session.isSindico && !session.isSuperadmin && targetUser.condo_id !== session.condoId) {
            return NextResponse.json({
                error: 'Você só pode excluir usuários do seu condomínio',
                success: false,
            }, { status: 403 });
        }

        // Delete from auth first (ignore error if user not in auth)
        try {
            const { error: authDeleteError } = await supabaseAdmin.auth.admin.deleteUser(targetUserId);
            if (authDeleteError) {
                console.log('[DELETE USER] Auth delete error (may be OK):', authDeleteError.message);
            } else {
                console.log('[DELETE USER] Auth user deleted');
            }
        } catch (authErr) {
            console.log('[DELETE USER] Auth delete exception (may be OK):', authErr);
        }

        // Delete related records first (to avoid FK constraints)
        // Delete residents
        await supabaseAdmin.from('residents').delete().eq('user_id', targetUserId);
        console.log('[DELETE USER] Deleted residents');

        // Delete user profile
        const { error: deleteError } = await supabaseAdmin
            .from('users')
            .delete()
            .eq('id', targetUserId);

        if (deleteError) {
            console.error('[DELETE USER] Profile delete error:', deleteError);
            return NextResponse.json({
                error: 'Erro ao excluir usuário',
                message: deleteError.message,
                success: false,
            }, { status: 500 });
        }

        console.log(`[DELETE USER] SUCCESS - User ${session.email} deleted user ${targetUserId}`);

        return NextResponse.json({
            success: true,
            message: 'Usuário excluído com sucesso.',
        });

    } catch (error: any) {
        console.error('[DELETE USER] Unexpected error:', error);
        return NextResponse.json(
            { error: 'Erro ao processar solicitação', message: error.message, success: false },
            { status: 500 }
        );
    }
}

/**
 * GET /api/user/delete - Get user data (LGPD portability)
 */
export async function GET(request: NextRequest) {
    try {
        const session = await getSessionFromReq(request);
        if (!session) {
            return NextResponse.json(
                { error: 'Não autorizado' },
                { status: 401 }
            );
        }

        const { data: profile, error } = await supabaseAdmin
            .from('users')
            .select('*')
            .eq('id', session.userId)
            .single();

        if (error || !profile) {
            return NextResponse.json(
                { error: 'Perfil não encontrado' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            dados_pessoais: {
                nome: profile.nome,
                email: profile.email,
                telefone: profile.telefone,
                cargo: profile.role,
                ativo: profile.ativo,
                cadastrado_em: profile.created_at,
            },
        });
    } catch (error: any) {
        console.error('[GET USER] Error:', error);
        return NextResponse.json(
            { error: 'Erro ao buscar dados' },
            { status: 500 }
        );
    }
}
