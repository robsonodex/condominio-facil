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
 * POST /api/invites/validate
 * Valida um QR Code de convite (usado pelo porteiro)
 */
export async function POST(request: NextRequest) {
    try {
        const session = await getSessionFromReq(request);

        if (!session) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        // Apenas porteiros e síndicos podem validar
        if (!['porteiro', 'sindico', 'superadmin'].includes(session.role)) {
            return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
        }

        const body = await request.json();
        const { token } = body;

        if (!token) {
            return NextResponse.json({
                valid: false,
                message: 'QR Code inválido - dados não fornecidos',
            });
        }

        let inviteId: string | null = null;
        let tokenHash: string | null = null;
        let decodedJwtCondoId: string | null = null; // To store condoId from JWT if applicable

        // Verificar se é um UUID (ID direto do banco vindo da página pública) 
        // ou um JWT (vindo do componente de compartilhamento direto)
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(token);

        if (isUUID) {
            inviteId = token;
        } else {
            // Verificar e decodificar JWT
            try {
                const decoded = jwt.verify(token, JWT_SECRET) as InvitePayload; // Use InvitePayload for type safety
                inviteId = decoded.inviteId;
                decodedJwtCondoId = decoded.condoId;
                tokenHash = crypto.createHash('sha256').update(token).digest('hex');
            } catch (jwtError: unknown) {
                const errorMessage = jwtError instanceof Error ? jwtError.message : 'Token inválido';

                if (errorMessage.includes('expired')) {
                    return NextResponse.json({
                        valid: false,
                        message: 'Convite expirado',
                    });
                }

                return NextResponse.json({
                    valid: false,
                    message: 'QR Code inválido ou adulterado',
                });
            }
        }

        // Verificar se o convite é do mesmo condomínio (segurança adicional)
        // Esta verificação só é possível se o token for um JWT e contiver o condoId
        if (decodedJwtCondoId && session.role !== 'superadmin' && decodedJwtCondoId !== session.condoId) {
            return NextResponse.json({
                valid: false,
                message: 'Convite de outro condomínio',
            });
        }

        // Buscar convite no banco por ID ou qr_code_token
        let query = supabaseAdmin
            .from('guest_invites')
            .select(`
                *,
                unit:units(bloco, numero_unidade),
                creator:users!created_by(nome)
            `);

        // Sempre buscamos por ID (seja UUID direto ou inviteId do JWT)
        if (inviteId) {
            query = query.eq('id', inviteId);
        } else {
            return NextResponse.json({
                valid: false,
                message: 'QR Code inválido - formato desconhecido',
            });
        }

        const { data: invite, error: fetchError } = await query.single();

        if (fetchError || !invite) {
            return NextResponse.json({
                valid: false,
                message: 'Convite não encontrado ou já processado',
            });
        }

        // Segurança adicional: Verificar se o convite pertence ao condomínio do porteiro
        if (session.role !== 'superadmin' && invite.condo_id !== session.condoId) {
            return NextResponse.json({
                valid: false,
                message: 'ESTE CONVITE PERTENCE A OUTRO CONDOMÍNIO',
            });
        }

        // Verificar status (usando valores em inglês da tabela)
        if (invite.status === 'used') {
            return NextResponse.json({
                valid: false,
                message: 'Convite já foi utilizado',
                usedAt: invite.used_at,
            });
        }

        if (invite.status === 'cancelled') {
            return NextResponse.json({
                valid: false,
                message: 'Convite foi cancelado',
            });
        }

        if (invite.status === 'expired') {
            return NextResponse.json({
                valid: false,
                message: 'Convite expirado',
            });
        }

        // Verificar data de visita
        const now = new Date();
        const today = now.toISOString().split('T')[0];
        const visitDate = invite.visit_date;

        // Montar datetime de início e fim para verificação
        const visitStart = invite.visit_time_start
            ? new Date(`${visitDate}T${invite.visit_time_start}`)
            : new Date(`${visitDate}T00:00:00`);
        const visitEnd = invite.visit_time_end
            ? new Date(`${visitDate}T${invite.visit_time_end}`)
            : new Date(`${visitDate}T23:59:59`);

        if (now < visitStart) {
            return NextResponse.json({
                valid: false,
                message: `Convite válido apenas a partir de ${visitStart.toLocaleString('pt-BR')}`,
            });
        }

        if (now > visitEnd) {
            // Marcar como expirado
            await supabaseAdmin
                .from('guest_invites')
                .update({ status: 'expired' })
                .eq('id', invite.id);

            return NextResponse.json({
                valid: false,
                message: 'Convite expirado',
            });
        }

        // Convite válido! Marcar como usado
        const { error: updateError } = await supabaseAdmin
            .from('guest_invites')
            .update({
                status: 'used',
                used_at: now.toISOString(),
                validated_by: session.userId,
            })
            .eq('id', invite.id);

        if (updateError) {
            console.error('[INVITES] Update error:', updateError);
            // Continua mesmo com erro - o convite é válido
        }

        await logEvent('INVITE_VALIDATED', 'info', {
            inviteId: invite.id,
            guestName: invite.guest_name,
            validatedBy: session.userId,
        });

        // Retornar dados do visitante
        return NextResponse.json({
            valid: true,
            message: 'LIBERADO',
            guest: {
                name: invite.guest_name,
                unit: invite.unit?.numero_unidade,
                block: invite.unit?.bloco,
                createdBy: invite.creator?.nome,
            },
            inviteId: invite.id,
        });

    } catch (error: unknown) {
        console.error('[INVITES] Validate error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Erro interno';
        return NextResponse.json({
            valid: false,
            message: 'Erro ao validar convite: ' + errorMessage,
        }, { status: 500 });
    }
}
