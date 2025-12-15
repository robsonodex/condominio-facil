import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, getSessionFromReq } from '@/lib/supabase/admin';

/**
 * DELETE /api/user/delete?id=xxx
 * Delete user (superadmin/síndico only)
 */
export async function DELETE(request: NextRequest) {
    try {
        console.log('[DELETE USER] Starting delete request...');

        // Try to get token from Authorization header first (sent by frontend)
        const authHeader = request.headers.get('authorization');
        let accessToken = authHeader?.replace('Bearer ', '');

        // Fallback to cookie if no auth header
        if (!accessToken) {
            const cookieHeader = request.headers.get('cookie') || '';
            const tokenMatch = cookieHeader.match(/sb-[^-]+-auth-token=([^;]+)/);
            accessToken = tokenMatch ? decodeURIComponent(tokenMatch[1]) : null;
        }

        if (!accessToken) {
            console.log('[DELETE USER] No access token found');
            return NextResponse.json(
                { error: 'Não autorizado. Faça login para continuar.', success: false },
                { status: 401 }
            );
        }

        // Verify user with Supabase
        const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(accessToken);

        if (authError || !user) {
            console.log('[DELETE USER] Auth error:', authError?.message);
            return NextResponse.json(
                { error: 'Sessão inválida. Faça login novamente.', success: false },
                { status: 401 }
            );
        }

        // Get user profile
        const { data: profile } = await supabaseAdmin
            .from('users')
            .select('role, condo_id')
            .eq('id', user.id)
            .single();

        if (!profile) {
            return NextResponse.json(
                { error: 'Perfil não encontrado', success: false },
                { status: 404 }
            );
        }

        console.log('[DELETE USER] Session:', user.email, profile.role);


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
        const isSuperadmin = profile.role === 'superadmin';
        const isSindico = profile.role === 'sindico';

        if (!isSuperadmin && !isSindico) {
            console.log('[DELETE USER] Permission denied for role:', profile.role);
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
        if (isSindico && !isSuperadmin && targetUser.condo_id !== profile.condo_id) {
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

        // ========================================
        // COMPREHENSIVE CLEANUP - ALL USER FOREIGN KEYS
        // ========================================

        console.log('[DELETE USER] Starting comprehensive cleanup...');

        // 1. Delete user's own records
        await supabaseAdmin.from('residents').delete().eq('user_id', targetUserId);
        await supabaseAdmin.from('reservations').delete().eq('user_id', targetUserId);
        await supabaseAdmin.from('enquete_votes').delete().eq('user_id', targetUserId);
        await supabaseAdmin.from('notifications_sent').delete().eq('sender_id', targetUserId);
        await supabaseAdmin.from('deliveries').delete().eq('created_by', targetUserId);
        await supabaseAdmin.from('assembly_presence').delete().eq('user_id', targetUserId);
        await supabaseAdmin.from('system_logs').delete().eq('user_id', targetUserId);
        await supabaseAdmin.from('impersonations').delete().eq('impersonator_id', targetUserId);
        await supabaseAdmin.from('impersonations').delete().eq('target_user_id', targetUserId);
        await supabaseAdmin.from('camera_access_logs').delete().eq('user_id', targetUserId);
        await supabaseAdmin.from('camera_events').delete().eq('user_id', targetUserId);
        await supabaseAdmin.from('camera_alerts').delete().eq('user_id', targetUserId);

        // 2. Clear references (set to NULL) - preserve records but remove user link
        await supabaseAdmin.from('reservations').update({ aprovado_por: null }).eq('aprovado_por', targetUserId);
        await supabaseAdmin.from('assembleias').update({ created_by: null }).eq('created_by', targetUserId);
        await supabaseAdmin.from('documents').update({ uploaded_by: null }).eq('uploaded_by', targetUserId);
        await supabaseAdmin.from('maintenance_orders').update({ created_by: null }).eq('created_by', targetUserId);
        await supabaseAdmin.from('resident_invoices').update({ created_by: null }).eq('created_by', targetUserId);
        await supabaseAdmin.from('occurrences').update({ resolvido_por: null }).eq('resolvido_por', targetUserId);
        await supabaseAdmin.from('visitor_logs').update({ user_id: null }).eq('user_id', targetUserId);

        // 3. Delete invoices where user is the morador (tenant/resident)
        await supabaseAdmin.from('resident_invoices').delete().eq('morador_id', targetUserId);

        console.log('[DELETE USER] Comprehensive cleanup completed');

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


        console.log(`[DELETE USER] SUCCESS - User ${user.email} deleted user ${targetUserId}`);

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
        // Get auth token from Supabase cookie
        const cookieHeader = request.headers.get('cookie') || '';
        const tokenMatch = cookieHeader.match(/sb-[^-]+-auth-token=([^;]+)/);
        const accessToken = tokenMatch ? decodeURIComponent(tokenMatch[1]) : null;

        if (!accessToken) {
            return NextResponse.json(
                { error: 'Não autorizado' },
                { status: 401 }
            );
        }

        // Verify user
        const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(accessToken);

        if (authError || !user) {
            return NextResponse.json(
                { error: 'Não autorizado' },
                { status: 401 }
            );
        }

        const { data: profile, error } = await supabaseAdmin
            .from('users')
            .select('*')
            .eq('id', user.id)
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
