import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

/**
 * GET /api/invites/public/[id]
 * Busca dados públicos de um convite para exibição na página pública
 * NÃO requer autenticação - apenas retorna dados básicos
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        // Validar que é um UUID válido
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(id)) {
            return NextResponse.json(
                { error: 'ID inválido' },
                { status: 400 }
            );
        }

        // Buscar convite usando supabaseAdmin (bypassa RLS)
        const { data: invite, error } = await supabaseAdmin
            .from('guest_invites')
            .select(`
                id, guest_name, visit_date, visit_time_start, visit_time_end, status,
                condo:condos(nome, endereco),
                unit:units(bloco, numero_unidade)
            `)
            .eq('id', id)
            .single();

        if (error || !invite) {
            return NextResponse.json(
                { error: 'Convite não encontrado' },
                { status: 404 }
            );
        }

        // Retornar dados públicos do convite
        return NextResponse.json({ invite });

    } catch (error) {
        console.error('[INVITE PUBLIC] Error:', error);
        return NextResponse.json(
            { error: 'Erro ao buscar convite' },
            { status: 500 }
        );
    }
}
