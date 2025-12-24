import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, getSessionFromReq } from '@/lib/supabase/admin';

// GET: Buscar mensagens de uma conversa específica
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getSessionFromReq(request);
        if (!session?.isSuperadmin) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        const conversaId = params.id;

        const { data: mensagens, error } = await supabaseAdmin
            .from('chat_sindico_mensagens')
            .select(`
                *,
                sender:users!sender_id(id, nome, role)
            `)
            .eq('conversa_id', conversaId)
            .order('created_at', { ascending: true });

        if (error) throw error;

        return NextResponse.json({
            mensagens: mensagens || [],
            userId: session.userId
        });
    } catch (error: any) {
        console.error('[ADMIN-CHATS-ID] Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
