import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, getSessionFromReq } from '@/lib/supabase/admin';

// GET: Listar condominios com chat ativo
export async function GET(request: NextRequest) {
    try {
        const session = await getSessionFromReq(request);
        if (!session?.isSuperadmin) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        const { data: condos, error } = await supabaseAdmin
            .from('condos')
            .select('id, nome')
            .eq('chat_sindico_ativo', true)
            .order('nome');

        if (error) throw error;

        return NextResponse.json({ condos: condos || [] });
    } catch (error: any) {
        console.error('[ADMIN-CONDOS-CHAT] Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
