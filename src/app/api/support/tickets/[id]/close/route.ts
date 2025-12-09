import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// POST /api/support/tickets/[id]/close - Fechar ticket
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

        const { data: profile } = await supabase
            .from('users')
            .select('role')
            .eq('id', user.id)
            .single();

        // Apenas superadmin e síndico podem fechar tickets
        if (profile?.role !== 'superadmin' && profile?.role !== 'sindico') {
            return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
        }

        const body = await request.json();
        const { resolution_note } = body;

        // Atualizar ticket para closed
        const { data: ticket, error } = await supabase
            .from('support_tickets')
            .update({
                status: 'closed',
                closed_at: new Date().toISOString()
            })
            .eq('id', ticketId)
            .select()
            .single();

        if (error) {
            console.error('Close ticket error:', error);
            return NextResponse.json({ error: 'Erro ao fechar ticket' }, { status: 500 });
        }

        // Se houver nota de resolução, adicionar como mensagem
        if (resolution_note) {
            await supabase.from('support_messages').insert({
                ticket_id: ticketId,
                user_id: user.id,
                message: `[Resolução] ${resolution_note}`
            });
        }

        // Criar log
        await supabase.from('support_logs').insert({
            ticket_id: ticketId,
            actor_id: user.id,
            action: 'ticket_closed',
            payload: { resolution_note }
        });

        // TODO: Enviar e-mail de ticket fechado

        return NextResponse.json({ success: true, ticket });

    } catch (error: any) {
        console.error('Close ticket error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
