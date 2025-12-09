import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// POST /api/support/tickets/[id]/messages - Enviar mensagem
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const supabase = await createClient();
        const { id: ticketId } = await params;

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        const body = await request.json();
        const { message, attachments = [] } = body;

        if (!message || message.trim() === '') {
            return NextResponse.json({ error: 'Mensagem não pode estar vazia' }, { status: 400 });
        }

        // Verificar se ticket existe e usuário tem acesso
        const { data: ticket } = await supabase
            .from('support_tickets')
            .select('id, requester_id, subject, condo_id')
            .eq('id', ticketId)
            .single();

        if (!ticket) {
            return NextResponse.json({ error: 'Ticket não encontrado' }, { status: 404 });
        }

        // Inserir mensagem
        const { data: newMessage, error: messageError } = await supabase
            .from('support_messages')
            .insert({
                ticket_id: ticketId,
                user_id: user.id,
                message: message.trim(),
                attachments: attachments
            })
            .select(`
                *,
                user:users(id, nome, role)
            `)
            .single();

        if (messageError) {
            console.error('Message error:', messageError);
            return NextResponse.json({ error: 'Erro ao enviar mensagem' }, { status: 500 });
        }

        // Criar log
        await supabase.from('support_logs').insert({
            ticket_id: ticketId,
            actor_id: user.id,
            action: 'message_sent',
            payload: { message_id: newMessage.id }
        });

        // TODO: Notificar outros participantes via email

        return NextResponse.json({ success: true, message: newMessage });

    } catch (error: any) {
        console.error('Post message error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
