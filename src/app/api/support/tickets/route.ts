import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// POST /api/support/tickets - Criar novo ticket
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();

        // Autenticação obrigatória
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        // Buscar perfil do usuário
        const { data: profile } = await supabase
            .from('users')
            .select('id, condo_id, role')
            .eq('id', user.id)
            .single();

        if (!profile || !profile.condo_id) {
            return NextResponse.json({ error: 'Perfil inválido' }, { status: 403 });
        }

        const body = await request.json();
        const { subject, description, category, priority = 'normal', unit_id, attachments = [] } = body;

        // Validações
        if (!subject || !description || !category) {
            return NextResponse.json({ error: 'Campos obrigatórios ausentes' }, { status: 400 });
        }

        // Verificar se pode usar prioridade solicitada
        const { data: canUsePriority } = await supabase
            .rpc('can_use_priority', {
                p_condo_id: profile.condo_id,
                p_priority: priority
            });

        if (!canUsePriority && priority === 'priority') {
            return NextResponse.json({
                error: 'Suporte Prioritário disponível apenas no plano Avançado'
            }, { status: 403 });
        }

        // Calcular SLA deadline
        const { data: slaDeadline } = await supabase
            .rpc('calculate_sla_deadline', {
                p_condo_id: profile.condo_id,
                p_priority: priority
            });

        // Criar ticket
        const { data: ticket, error: ticketError } = await supabase
            .from('support_tickets')
            .insert({
                condo_id: profile.condo_id,
                unit_id: unit_id || null,
                requester_id: user.id,
                subject,
                description,
                category,
                priority,
                sla_deadline: slaDeadline
            })
            .select()
            .single();

        if (ticketError) {
            console.error('Error creating ticket:', ticketError);
            return NextResponse.json({ error: 'Erro ao criar ticket' }, { status: 500 });
        }

        // Criar log
        await supabase.from('support_logs').insert({
            ticket_id: ticket.id,
            actor_id: user.id,
            action: 'ticket_created',
            payload: { subject, priority, category }
        });

        // TODO: Enviar e-mail
        try {
            await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/email`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    tipo: 'support_new_ticket',
                    destinatario: user.email,
                    dados: {
                        ticket_number: ticket.id.substring(0, 8).toUpperCase(),
                        subject,
                        priority,
                        sla_deadline: new Date(slaDeadline).toLocaleString('pt-BR')
                    }
                })
            });
        } catch (emailError) {
            console.error('Email error:', emailError);
            // Não bloqueia criação do ticket
        }

        return NextResponse.json({ success: true, ticket });

    } catch (error: any) {
        console.error('Create ticket error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// GET /api/support/tickets - Listar tickets com filtros
export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        const { data: profile } = await supabase
            .from('users')
            .select('id, condo_id, role')
            .eq('id', user.id)
            .single();

        if (!profile) {
            return NextResponse.json({ error: 'Perfil inválido' }, { status: 403 });
        }

        // Parâmetros de filtro
        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status');
        const priority = searchParams.get('priority');
        const category = searchParams.get('category');
        const sla_status = searchParams.get('sla_status');
        const search = searchParams.get('search');

        // Query base
        let query = supabase
            .from('support_tickets')
            .select(`
                *,
                requester:users!requester_id(id, nome, email),
                assignee:users!assignee_id(id, nome),
                unit:units(id, numero_unidade, bloco),
                messages:support_messages(count)
            `)
            .order('created_at', { ascending: false });

        // Filtros por role
        if (profile.role === 'superadmin') {
            // Superadmin vê todos
        } else if (profile.role === 'sindico') {
            query = query.eq('condo_id', profile.condo_id);
        } else {
            // Morador/porteiro vê apenas seus tickets
            query = query.eq('requester_id', user.id);
        }

        // Aplicar filtros
        if (status) query = query.eq('status', status);
        if (priority) query = query.eq('priority', priority);
        if (category) query = query.eq('category', category);
        if (sla_status === 'breached') query = query.eq('sla_breached', true);
        if (search) {
            query = query.or(`subject.ilike.%${search}%,description.ilike.%${search}%`);
        }

        const { data: tickets, error } = await query;

        if (error) {
            console.error('List tickets error:', error);
            return NextResponse.json({ error: 'Erro ao listar tickets' }, { status: 500 });
        }

        return NextResponse.json({ tickets });

    } catch (error: any) {
        console.error('Get tickets error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
