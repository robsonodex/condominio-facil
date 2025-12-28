import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, getSessionFromReq } from '@/lib/supabase/admin';

/**
 * DELETE /api/admin/condos
 * Deleta um condomínio e todos os dados relacionados
 * Apenas para superadmin
 */
export async function DELETE(request: NextRequest) {
    try {
        // Verificar autenticação e permissões
        const session = await getSessionFromReq(request);
        if (!session) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        if (!session.isSuperadmin) {
            return NextResponse.json({ error: 'Apenas superadmin pode deletar condomínios' }, { status: 403 });
        }

        // Get condo ID from query
        const { searchParams } = new URL(request.url);
        const condoId = searchParams.get('id');

        if (!condoId) {
            return NextResponse.json({ error: 'ID do condomínio é obrigatório' }, { status: 400 });
        }

        console.log('[DELETE CONDO] Starting deletion for:', condoId);

        // Delete in correct order to respect foreign keys
        // 1. Delete notice_reads
        await supabaseAdmin.from('notice_reads').delete().eq('condo_id', condoId);
        console.log('[DELETE CONDO] Deleted notice_reads');

        // 2. Delete notices
        await supabaseAdmin.from('notices').delete().eq('condo_id', condoId);
        console.log('[DELETE CONDO] Deleted notices');

        // 3. Delete occurrences & comments
        await supabaseAdmin.from('occurrence_comments').delete().filter('occurrence_id', 'in',
            supabaseAdmin.from('occurrences').select('id').eq('condo_id', condoId)
        );
        await supabaseAdmin.from('occurrences').delete().eq('condo_id', condoId);
        console.log('[DELETE CONDO] Deleted occurrences and comments');

        // 4. Delete visitors
        await supabaseAdmin.from('visitors').delete().eq('condo_id', condoId);
        console.log('[DELETE CONDO] Deleted visitors');

        // 5. Delete financial logs and entries
        await supabaseAdmin.from('financial_entries').delete().eq('condo_id', condoId);
        console.log('[DELETE CONDO] Deleted financial_entries');

        // 6. Delete resident_invoices
        await supabaseAdmin.from('resident_invoices').delete().eq('condo_id', condoId);
        console.log('[DELETE CONDO] Deleted resident_invoices');

        // 7. Delete payments
        await supabaseAdmin.from('payments').delete().eq('condo_id', condoId);
        console.log('[DELETE CONDO] Deleted payments');

        // 8. Delete residents
        await supabaseAdmin.from('residents').delete().eq('condo_id', condoId);
        console.log('[DELETE CONDO] Deleted residents');

        // 8.1. Delete Chat Síndico data
        await supabaseAdmin.from('chat_sindico_mensagens').delete().eq('condo_id', condoId);
        await supabaseAdmin.from('chat_sindico_templates').delete().eq('condo_id', condoId);
        await supabaseAdmin.from('chat_sindico_conversas').delete().eq('condo_id', condoId);
        console.log('[DELETE CONDO] Deleted Chat Síndico data');

        // 8.2. Delete Suggestions and Votes
        await supabaseAdmin.from('suggestion_votes').delete().filter('suggestion_id', 'in',
            supabaseAdmin.from('suggestions').select('id').eq('condo_id', condoId)
        );
        await supabaseAdmin.from('suggestions').delete().eq('condo_id', condoId);
        console.log('[DELETE CONDO] Deleted Suggestions data');

        // 8.3. Delete Notifications
        await supabaseAdmin.from('notifications').delete().eq('condo_id', condoId);
        console.log('[DELETE CONDO] Deleted notifications');

        // 8.4. Delete Support Chats (Legado)
        await supabaseAdmin.from('support_chats').delete().eq('condo_id', condoId);
        console.log('[DELETE CONDO] Deleted legacy support chats');

        // 8.5. Get all unit IDs from this condo
        const { data: units } = await supabaseAdmin
            .from('units')
            .select('id')
            .eq('condo_id', condoId);

        const unitIds = units?.map(u => u.id) || [];
        console.log('[DELETE CONDO] Found', unitIds.length, 'units to delete');

        // 8.6. Clear unidade_id from ALL users that reference these units
        if (unitIds.length > 0) {
            await supabaseAdmin
                .from('users')
                .update({ unidade_id: null })
                .in('unidade_id', unitIds);
            console.log('[DELETE CONDO] Cleared unidade_id from users');
        }

        // 8.7. Delete deliveries
        await supabaseAdmin.from('deliveries').delete().eq('condo_id', condoId);
        console.log('[DELETE CONDO] Deleted deliveries');

        // 8.8. Delete maintenance
        await supabaseAdmin.from('maintenance_orders').delete().eq('condo_id', condoId);
        await supabaseAdmin.from('maintenance_suppliers').delete().eq('condo_id', condoId);
        console.log('[DELETE CONDO] Deleted maintenance data');

        // 8.9. Delete engagement data (polls, assemblies)
        await supabaseAdmin.from('polls').delete().eq('condo_id', condoId);
        await supabaseAdmin.from('assemblies').delete().eq('condo_id', condoId);
        console.log('[DELETE CONDO] Deleted engagement data');

        // 8.10. Delete documents, common areas and reservations
        await supabaseAdmin.from('documents').delete().eq('condo_id', condoId);
        await supabaseAdmin.from('common_areas').delete().eq('condo_id', condoId);
        await supabaseAdmin.from('reservations').delete().eq('condo_id', condoId);
        console.log('[DELETE CONDO] Deleted assets and reservations');

        // 8.11. Delete Audit and Impersonation Logs
        await supabaseAdmin.from('impersonation_action_logs').delete().filter('impersonation_id', 'in',
            supabaseAdmin.from('impersonations').select('id').eq('target_condo_id', condoId)
        );
        await supabaseAdmin.from('impersonations').delete().eq('target_condo_id', condoId);
        await supabaseAdmin.from('audit_logs').delete().eq('condo_id', condoId);
        console.log('[DELETE CONDO] Deleted audit and impersonation logs');

        // 8.12. Delete Integration data
        await supabaseAdmin.from('integration_logs').delete().eq('condo_id', condoId);
        await supabaseAdmin.from('condo_integrations').delete().eq('condo_id', condoId);
        console.log('[DELETE CONDO] Deleted integration data');

        // 9. Delete units
        await supabaseAdmin.from('units').delete().eq('condo_id', condoId);
        console.log('[DELETE CONDO] Deleted units');

        // 10. Delete subscriptions
        await supabaseAdmin.from('subscriptions').delete().eq('condo_id', condoId);
        console.log('[DELETE CONDO] Deleted subscriptions');

        // 11. Get all users from this condo (before updating them)
        const { data: condoUsers } = await supabaseAdmin
            .from('users')
            .select('id, email, role')
            .eq('condo_id', condoId);

        console.log('[DELETE CONDO] Found', condoUsers?.length || 0, 'users to delete');

        // 11.1. Delete users completely (except superadmins)
        // This prevents email conflicts when re-registering users
        if (condoUsers && condoUsers.length > 0) {
            for (const user of condoUsers) {
                try {
                    // Don't delete superadmins - just remove condo reference
                    if (user.role === 'superadmin') {
                        await supabaseAdmin
                            .from('users')
                            .update({ condo_id: null, unidade_id: null })
                            .eq('id', user.id);
                        console.log('[DELETE CONDO] Preserved superadmin, removed condo ref:', user.email);
                        continue;
                    }

                    // Delete from Supabase Auth first
                    await supabaseAdmin.auth.admin.deleteUser(user.id);
                    console.log('[DELETE CONDO] Deleted auth user:', user.email);

                    // Delete legal acceptances (manual cleanup as extra layer)
                    await supabaseAdmin.from('legal_acceptances').delete().eq('user_id', user.id);
                    console.log('[DELETE CONDO] Deleted legal acceptances for:', user.email);

                    // Then delete from users table
                    await supabaseAdmin
                        .from('users')
                        .delete()
                        .eq('id', user.id);
                    console.log('[DELETE CONDO] Deleted user record:', user.email);

                } catch (userDeleteError) {
                    console.error('[DELETE CONDO] Error deleting user:', user.email, userDeleteError);
                    // Continue with other users even if one fails
                }
            }
        }

        // 12. Finally delete the condo
        const { error: deleteError } = await supabaseAdmin.from('condos').delete().eq('id', condoId);

        if (deleteError) {
            console.error('[DELETE CONDO] Error deleting condo:', deleteError);
            return NextResponse.json({ error: deleteError.message }, { status: 500 });
        }

        console.log('[DELETE CONDO] Successfully deleted condo:', condoId);
        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error('[DELETE CONDO] Exception:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
