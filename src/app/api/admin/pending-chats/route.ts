import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, getSessionFromReq } from '@/lib/supabase/admin';

/**
 * GET /api/admin/pending-chats
 * Retorna a contagem de chats de suporte com mensagens não respondidas pelo admin
 */
export async function GET(request: NextRequest) {
    try {
        // Verificar autenticação
        const session = await getSessionFromReq(request);

        if (!session || !session.isSuperadmin) {
            return NextResponse.json({ count: 0 });
        }

        // Buscar chats com mensagens não lidas (última mensagem não é do admin)
        const { data: chats, error } = await supabaseAdmin
            .from('support_chats')
            .select(`
                id,
                status,
                chat_messages!inner (
                    id,
                    sender_type,
                    created_at
                )
            `)
            .eq('status', 'aberto')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('[PENDING-CHATS] Error:', error);
            return NextResponse.json({ count: 0 });
        }

        // Contar chats onde a última mensagem é do usuário (não admin)
        let pendingCount = 0;
        for (const chat of chats || []) {
            const messages = chat.chat_messages || [];
            if (messages.length > 0) {
                // Ordenar mensagens por data (mais recente primeiro)
                const sortedMessages = messages.sort((a: any, b: any) =>
                    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                );
                // Se a última mensagem é do usuário, está pendente
                if (sortedMessages[0].sender_type === 'user') {
                    pendingCount++;
                }
            }
        }

        return NextResponse.json({ count: pendingCount });

    } catch (error: any) {
        console.error('[PENDING-CHATS] Error:', error);
        return NextResponse.json({ count: 0 });
    }
}
