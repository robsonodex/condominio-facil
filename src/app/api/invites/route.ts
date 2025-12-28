import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, getSessionFromReq } from '@/lib/supabase/admin';

/**
 * GET /api/invites
 * Lista os convites do usuário (morador vê os seus, síndico vê todos do condomínio)
 */
export async function GET(request: NextRequest) {
    try {
        const session = await getSessionFromReq(request);

        if (!session) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status');

        let query = supabaseAdmin
            .from('guest_invites')
            .select(`
                *,
                unit:units(bloco, numero_unidade),
                creator:users!created_by(nome),
                validator:users!validated_by(nome)
            `)
            .order('created_at', { ascending: false });

        // Filtrar por role
        if (session.role === 'morador') {
            query = query.eq('created_by', session.userId);
        } else if (session.role === 'sindico' || session.role === 'porteiro') {
            query = query.eq('condo_id', session.condoId);
        }
        // Superadmin vê todos

        // Filtrar por status se especificado
        if (status) {
            query = query.eq('status', status);
        }

        // Limite de resultados
        query = query.limit(100);

        const { data, error } = await query;

        if (error) {
            console.error('[INVITES] List error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // Transformar dados para compatibilidade com frontend (adicionar valid_from/valid_until)
        const transformedData = (data || []).map((invite: Record<string, unknown>) => ({
            ...invite,
            valid_from: `${invite.visit_date}T${invite.visit_time_start || '00:00'}:00`,
            valid_until: `${invite.visit_date}T${invite.visit_time_end || '23:59'}:00`,
        }));

        return NextResponse.json({ data: transformedData });

    } catch (error: unknown) {
        console.error('[INVITES] GET error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Erro interno';
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}

/**
 * DELETE /api/invites
 * Cancela um convite (apenas o criador pode cancelar convites pendentes)
 */
export async function DELETE(request: NextRequest) {
    try {
        const session = await getSessionFromReq(request);

        if (!session) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const inviteId = searchParams.get('id');

        if (!inviteId) {
            return NextResponse.json({ error: 'ID do convite é obrigatório' }, { status: 400 });
        }

        // Buscar convite para verificar permissão
        const { data: invite, error: fetchError } = await supabaseAdmin
            .from('guest_invites')
            .select('id, created_by, status')
            .eq('id', inviteId)
            .single();

        if (fetchError || !invite) {
            return NextResponse.json({ error: 'Convite não encontrado' }, { status: 404 });
        }

        // Verificar se o usuário pode cancelar
        if (session.role === 'morador' && invite.created_by !== session.userId) {
            return NextResponse.json({ error: 'Você não pode cancelar este convite' }, { status: 403 });
        }

        // Permitir exclusão de qualquer convite (não apenas pendentes)

        // Cancelar o convite
        const { error: updateError } = await supabaseAdmin
            .from('guest_invites')
            .update({ status: 'cancelled' })
            .eq('id', inviteId);

        if (updateError) {
            console.error('[INVITES] Cancel error:', updateError);
            return NextResponse.json({ error: updateError.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, message: 'Convite cancelado' });

    } catch (error: unknown) {
        console.error('[INVITES] DELETE error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Erro interno';
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}
