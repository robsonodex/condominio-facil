import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

async function getUserFromToken(request: NextRequest) {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    if (!token) return null;

    const { data: { user } } = await supabaseAdmin.auth.getUser(token);
    if (!user) return null;

    const { data: profile } = await supabaseAdmin
        .from('users')
        .select('id, role, condo_id, unidade_id, nome')
        .eq('email', user.email)
        .single();

    return profile;
}

// GET: Listar reservas
export async function GET(request: NextRequest) {
    try {
        const profile = await getUserFromToken(request);
        if (!profile) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const areaId = searchParams.get('area_id');
        const startDate = searchParams.get('start_date');
        const endDate = searchParams.get('end_date');
        const status = searchParams.get('status');

        let query = supabaseAdmin
            .from('reservations')
            .select(`
                *,
                area:common_areas(id, nome),
                user:users!user_id(id, nome),
                unidade:units(bloco, numero_unidade)
            `)
            .eq('condo_id', profile.condo_id)
            .order('data_reserva', { ascending: true });

        if (areaId) query = query.eq('area_id', areaId);
        if (startDate) query = query.gte('data_reserva', startDate);
        if (endDate) query = query.lte('data_reserva', endDate);
        if (status) query = query.eq('status', status);

        const { data, error } = await query;
        if (error) throw error;

        return NextResponse.json({ reservations: data || [] });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// POST: Criar reserva
export async function POST(request: NextRequest) {
    try {
        const profile = await getUserFromToken(request);
        if (!profile) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        const body = await request.json();
        const { area_id, data_reserva, horario_inicio, horario_fim, num_convidados, observacoes } = body;

        if (!area_id || !data_reserva || !horario_inicio || !horario_fim) {
            return NextResponse.json({ error: 'Campos obrigatórios: area_id, data_reserva, horario_inicio, horario_fim' }, { status: 400 });
        }

        // Verificar área
        const { data: area } = await supabaseAdmin
            .from('common_areas')
            .select('*')
            .eq('id', area_id)
            .single();

        if (!area) {
            return NextResponse.json({ error: 'Área não encontrada' }, { status: 404 });
        }

        // Verificar conflito
        const { data: conflicts } = await supabaseAdmin
            .from('reservations')
            .select('id')
            .eq('area_id', area_id)
            .eq('data_reserva', data_reserva)
            .in('status', ['pendente', 'aprovada'])
            .or(`and(horario_inicio.lt.${horario_fim},horario_fim.gt.${horario_inicio})`);

        if (conflicts && conflicts.length > 0) {
            return NextResponse.json({ error: 'Já existe uma reserva neste horário' }, { status: 409 });
        }

        // Criar reserva
        const reservationData = {
            condo_id: profile.condo_id,
            area_id,
            user_id: profile.id,
            unidade_id: profile.unidade_id,
            data_reserva,
            horario_inicio,
            horario_fim,
            num_convidados: num_convidados || 0,
            observacoes,
            status: area.requer_aprovacao ? 'pendente' : 'aprovada',
            valor_cobrado: area.valor_taxa || 0,
        };

        const { data, error } = await supabaseAdmin
            .from('reservations')
            .insert(reservationData)
            .select(`
                *,
                area:common_areas(nome),
                user:users!user_id(nome)
            `)
            .single();

        if (error) throw error;

        return NextResponse.json({
            reservation: data,
            message: area.requer_aprovacao ? 'Reserva enviada para aprovação' : 'Reserva confirmada!'
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// PUT: Atualizar reserva (aprovar/rejeitar/cancelar)
export async function PUT(request: NextRequest) {
    try {
        const profile = await getUserFromToken(request);
        if (!profile) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        const body = await request.json();
        const { id, action, motivo_rejeicao } = body;

        if (!id || !action) {
            return NextResponse.json({ error: 'ID e action são obrigatórios' }, { status: 400 });
        }

        // Buscar reserva
        const { data: reservation } = await supabaseAdmin
            .from('reservations')
            .select('*')
            .eq('id', id)
            .single();

        if (!reservation) {
            return NextResponse.json({ error: 'Reserva não encontrada' }, { status: 404 });
        }

        // Verificar permissão
        const isSindico = ['sindico', 'superadmin'].includes(profile.role);
        const isOwner = reservation.user_id === profile.id;

        let updateData: any = { updated_at: new Date().toISOString() };

        switch (action) {
            case 'aprovar':
                if (!isSindico) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
                updateData.status = 'aprovada';
                updateData.aprovado_por = profile.id;
                updateData.data_aprovacao = new Date().toISOString();
                break;
            case 'rejeitar':
                if (!isSindico) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
                updateData.status = 'rejeitada';
                updateData.motivo_rejeicao = motivo_rejeicao;
                break;
            case 'cancelar':
                if (!isOwner && !isSindico) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
                updateData.status = 'cancelada';
                break;
            default:
                return NextResponse.json({ error: 'Ação inválida' }, { status: 400 });
        }

        const { data, error } = await supabaseAdmin
            .from('reservations')
            .update(updateData)
            .eq('id', id)
            .select(`
                *,
                area:common_areas(nome),
                user:users!user_id(id, nome, email)
            `)
            .single();

        if (error) throw error;

        // Enviar notificação ao morador
        if (action === 'aprovar' || action === 'rejeitar') {
            const isApproved = action === 'aprovar';

            await supabaseAdmin.from('notifications').insert({
                condo_id: reservation.condo_id,
                user_id: reservation.user_id,
                title: isApproved ? '✅ Reserva Aprovada!' : '❌ Reserva Rejeitada',
                message: isApproved
                    ? `Sua reserva para ${data.area?.nome} foi aprovada! Data: ${data.data_reserva}, horário: ${data.horario_inicio} às ${data.horario_fim}`
                    : `Sua reserva para ${data.area?.nome} foi rejeitada. Motivo: ${motivo_rejeicao || 'Não informado'}`,
                type: 'sistema',
                link: '/reservas'
            });
        }

        return NextResponse.json({ reservation: data });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// DELETE: Cancelar reserva
export async function DELETE(request: NextRequest) {
    try {
        const profile = await getUserFromToken(request);
        if (!profile) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'ID é obrigatório' }, { status: 400 });
        }

        const { error } = await supabaseAdmin
            .from('reservations')
            .update({ status: 'cancelada' })
            .eq('id', id)
            .or(`user_id.eq.${profile.id},condo_id.eq.${profile.condo_id}`);

        if (error) throw error;
        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
