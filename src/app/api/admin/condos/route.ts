import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

/**
 * DELETE /api/admin/condos
 * Deleta um condomínio e todos os dados relacionados
 * Apenas para superadmin
 */
export async function DELETE(request: NextRequest) {
    try {
        // Get token from Authorization header
        const authHeader = request.headers.get('authorization');
        const token = authHeader?.replace('Bearer ', '');

        if (!token) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        // Verify user
        const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
        if (authError || !user) {
            return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
        }

        // Check if superadmin
        const { data: profile } = await supabaseAdmin
            .from('users')
            .select('role')
            .eq('email', user.email)
            .single();

        if (!profile || profile.role !== 'superadmin') {
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

        // 3. Delete occurrences
        await supabaseAdmin.from('occurrences').delete().eq('condo_id', condoId);
        console.log('[DELETE CONDO] Deleted occurrences');

        // 4. Delete visitors
        await supabaseAdmin.from('visitors').delete().eq('condo_id', condoId);
        console.log('[DELETE CONDO] Deleted visitors');

        // 5. Delete financial_entries
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

        // 9. Delete units
        await supabaseAdmin.from('units').delete().eq('condo_id', condoId);
        console.log('[DELETE CONDO] Deleted units');

        // 10. Delete subscriptions
        await supabaseAdmin.from('subscriptions').delete().eq('condo_id', condoId);
        console.log('[DELETE CONDO] Deleted subscriptions');

        // 11. Update users to remove condo_id reference (don't delete users)
        await supabaseAdmin.from('users').update({ condo_id: null }).eq('condo_id', condoId);
        console.log('[DELETE CONDO] Updated users');

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
