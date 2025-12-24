import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, getSessionFromReq } from '@/lib/supabase/admin';

// GET: Listar conversas de um condomínio específico
export async function GET(request: NextRequest) {
    try {
        const session = await getSessionFromReq(request);
        if (!session?.isSuperadmin) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const condoId = searchParams.get('condo_id');

        if (!condoId) {
            return NextResponse.json({ error: 'condo_id é obrigatório' }, { status: 400 });
        }

        const { data: conversas, error } = await supabaseAdmin
            .from('chat_sindico_conversas')
            .select(`
                *,
                morador:users!morador_id(id, nome, email, telefone, unidade:units(bloco, numero_unidade))
            `)
            .eq('condo_id', condoId)
            .order('ultima_mensagem_em', { ascending: false, nullsFirst: false });

        if (error) throw error;

        return NextResponse.json({
            conversas: conversas || [],
            userId: session.userId
        });
    } catch (error: any) {
        console.error('[ADMIN-CHATS] Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
