import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, getSessionFromReq } from '@/lib/supabase/admin';

// GET: Buscar mensagens de uma conversa
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getSessionFromReq(request);
        if (!session) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        const conversaId = params.id;

        // Verificar se a conversa pertence ao condomínio e usuário tem acesso
        const { data: conversa } = await supabaseAdmin
            .from('chat_sindico_conversas')
            .select(`
                *,
                morador:users!morador_id(id, nome, email, telefone, unidade:units(bloco, numero_unidade)),
                sindico:users!sindico_id(id, nome)
            `)
            .eq('id', conversaId)
            .eq('condo_id', session.condoId)
            .single();

        if (!conversa) {
            return NextResponse.json({ error: 'Conversa não encontrada' }, { status: 404 });
        }

        // Verificar permissão
        const isMorador = conversa.morador_id === session.userId;
        const isSindico = session.role === 'sindico' || session.role === 'superadmin';

        if (!isMorador && !isSindico) {
            return NextResponse.json({ error: 'Sem permissão para ver esta conversa' }, { status: 403 });
        }

        // Buscar mensagens
        const { searchParams } = new URL(request.url);
        const limit = parseInt(searchParams.get('limit') || '100');
        const before = searchParams.get('before'); // Para paginação

        let query = supabaseAdmin
            .from('chat_sindico_mensagens')
            .select(`
                *,
                sender:users!sender_id(id, nome, role)
            `)
            .eq('conversa_id', conversaId)
            .eq('condo_id', session.condoId)
            .order('created_at', { ascending: true })
            .limit(limit);

        if (before) {
            query = query.lt('created_at', before);
        }

        const { data: mensagens, error } = await query;
        if (error) throw error;

        return NextResponse.json({
            conversa,
            mensagens: mensagens || [],
            userRole: session.role,
            userId: session.userId
        });
    } catch (error: any) {
        console.error('[CHAT-SINDICO] GET /[id] Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
