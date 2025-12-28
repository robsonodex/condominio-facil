import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, getSessionFromReq, logEvent } from '@/lib/supabase/admin';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

const JWT_SECRET = process.env.JWT_INVITE_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || 'fallback-secret-change-me';

interface InvitePayload {
    inviteId: string;
    condoId: string;
    unitId: string;
    guestName: string;
    iat: number;
    exp: number;
}

/**
 * POST /api/invites/create
 * Cria um novo convite para visitante e retorna dados do QR Code
 */
export async function POST(request: NextRequest) {
    try {
        const session = await getSessionFromReq(request);

        if (!session) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        // Apenas moradores podem criar convites
        if (session.role !== 'morador') {
            return NextResponse.json({ error: 'Apenas moradores podem criar convites' }, { status: 403 });
        }

        const body = await request.json();
        const { guest_name, valid_from, valid_until } = body;

        // Validações
        if (!guest_name || guest_name.trim().length === 0) {
            return NextResponse.json({ error: 'Nome do visitante é obrigatório' }, { status: 400 });
        }

        // Buscar dados da unidade do morador
        const { data: userData, error: userError } = await supabaseAdmin
            .from('users')
            .select('unidade_id, condo_id')
            .eq('id', session.userId)
            .single();

        if (userError || !userData?.unidade_id) {
            return NextResponse.json({ error: 'Morador não está vinculado a uma unidade' }, { status: 400 });
        }

        // Datas de validade
        const validFrom = valid_from ? new Date(valid_from) : new Date();
        const validUntil = valid_until ? new Date(valid_until) : new Date(Date.now() + 4 * 60 * 60 * 1000); // +4h default

        // Validar datas
        if (validUntil <= validFrom) {
            return NextResponse.json({ error: 'Data de término deve ser posterior à data de início' }, { status: 400 });
        }

        // Máximo de 7 dias
        const maxValidUntil = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        if (validUntil > maxValidUntil) {
            return NextResponse.json({ error: 'Convite não pode ter validade superior a 7 dias' }, { status: 400 });
        }

        // Gerar ID do convite
        const inviteId = crypto.randomUUID();

        // Criar payload do JWT
        const payload: Omit<InvitePayload, 'iat' | 'exp'> = {
            inviteId,
            condoId: userData.condo_id,
            unitId: userData.unidade_id,
            guestName: guest_name.trim(),
        };

        // Assinar JWT
        const expiresIn = Math.floor((validUntil.getTime() - Date.now()) / 1000);
        const token = jwt.sign(payload, JWT_SECRET, { expiresIn });

        // Salvar no banco usando as colunas corretas da tabela
        const visitDate = validFrom.toISOString().split('T')[0]; // Extrair apenas a data
        const visitTimeStart = validFrom.toTimeString().split(' ')[0].substring(0, 5); // HH:MM
        const visitTimeEnd = validUntil.toTimeString().split(' ')[0].substring(0, 5); // HH:MM

        const { data: invite, error: insertError } = await supabaseAdmin
            .from('guest_invites')
            .insert({
                id: inviteId,
                condo_id: userData.condo_id,
                unit_id: userData.unidade_id,
                created_by: session.userId,
                guest_name: guest_name.trim(),
                visit_date: visitDate,
                visit_time_start: visitTimeStart,
                visit_time_end: visitTimeEnd,
                status: 'pending',
            })
            .select(`
                *,
                unit:units(bloco, numero_unidade),
                creator:users!created_by(nome)
            `)
            .single();

        if (insertError) {
            console.error('[INVITES] Insert error:', insertError);
            return NextResponse.json({ error: insertError.message }, { status: 500 });
        }

        await logEvent('INVITE_CREATED', 'info', { inviteId, guestName: guest_name, createdBy: session.userId });

        // Retornar dados para gerar QR Code no frontend
        // Construir valid_from e valid_until para compatibilidade com o frontend
        const responseValidFrom = `${invite.visit_date}T${invite.visit_time_start || '00:00'}:00`;
        const responseValidUntil = `${invite.visit_date}T${invite.visit_time_end || '23:59'}:00`;

        return NextResponse.json({
            success: true,
            invite: {
                id: invite.id,
                guest_name: invite.guest_name,
                valid_from: responseValidFrom,
                valid_until: responseValidUntil,
                status: invite.status,
                unit: invite.unit,
            },
            qrData: invite.id, // Usar UUID para QR Code (mais simples e confiável)
        }, { status: 201 });

    } catch (error: unknown) {
        console.error('[INVITES] Create error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Erro interno';
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}
