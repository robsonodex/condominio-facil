import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/support/tickets/[id] - Detalhes do ticket
export async function GET(
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

        // Buscar ticket com mensagens
        const { data: ticket, error } = await supabase
            .from('support_tickets')
            .select(`
                *,
                requester:users!requester_id(id, nome, email),
                assignee:users!assignee_id(id, nome, email),
                unit:units(id, numero_unidade, bloco),
                condo:condos(id, nome),
                messages:support_messages(
                    *,
                    user:users(id, nome, role)
                )
            `)
            .eq('id', ticketId)
            .single();

        if (error || !ticket) {
            return NextResponse.json({ error: 'Ticket não encontrado' }, { status: 404 });
        }

        // Ordenar mensagens por data
        if (ticket.messages) {
            ticket.messages.sort((a: any, b: any) =>
                new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
            );
        }

        return NextResponse.json({ ticket });

    } catch (error: any) {
        console.error('Get ticket error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// PATCH /api/support/tickets/[id] - Atualizar ticket
export async function PATCH(
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
            .select('role, condo_id')
            .eq('id', user.id)
            .single();

        // Apenas superadmin e síndico podem atualizar
        if (profile?.role !== 'superadmin' && profile?.role !== 'sindico') {
            return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
        }

        const body = await request.json();
        const { status, priority, assignee_id } = body;

        const updates: any = {};
        if (status) updates.status = status;
        if (priority) updates.priority = priority;
        if (assignee_id !== undefined) updates.assignee_id = assignee_id;

        // Se fechar, registrar timestamp
        if (status === 'closed' || status === 'resolved') {
            updates.closed_at = new Date().toISOString();
        }

        const { data: ticket, error } = await supabase
            .from('support_tickets')
            .update(updates)
            .eq('id', ticketId)
            .select()
            .single();

        if (error) {
            console.error('Update ticket error:', error);
            return NextResponse.json({ error: 'Erro ao atualizar ticket' }, { status: 500 });
        }

        // Criar log
        await supabase.from('support_logs').insert({
            ticket_id: ticketId,
            actor_id: user.id,
            action: 'ticket_updated',
            payload: updates
        });

        return NextResponse.json({ success: true, ticket });

    } catch (error: any) {
        console.error('Patch ticket error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
