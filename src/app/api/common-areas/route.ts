import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, getSessionFromReq } from '@/lib/supabase/admin';

// GET: Listar áreas comuns
export async function GET(request: NextRequest) {
    try {
        const session = await getSessionFromReq(request);
        if (!session) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const condoId = searchParams.get('condo_id') || session.condoId;

        const { data, error } = await supabaseAdmin
            .from('common_areas')
            .select('*')
            .eq('condo_id', condoId)
            .eq('ativo', true)
            .order('nome');

        if (error) throw error;
        return NextResponse.json({ areas: data || [] });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// POST: Criar área comum
export async function POST(request: NextRequest) {
    try {
        const session = await getSessionFromReq(request);
        if (!session || !['sindico', 'superadmin'].includes(session.role)) {
            return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
        }

        const body = await request.json();
        const { nome, descricao, capacidade_maxima, valor_taxa, requer_aprovacao, horario_abertura, horario_fechamento, dias_permitidos, regras } = body;

        if (!nome) {
            return NextResponse.json({ error: 'Nome é obrigatório' }, { status: 400 });
        }

        const { data, error } = await supabaseAdmin
            .from('common_areas')
            .insert({
                condo_id: session.condoId,
                nome,
                descricao,
                capacidade_maxima: capacidade_maxima || 20,
                valor_taxa: valor_taxa || 0,
                requer_aprovacao: requer_aprovacao || false,
                horario_abertura: horario_abertura || '08:00',
                horario_fechamento: horario_fechamento || '22:00',
                dias_permitidos: dias_permitidos || ['seg', 'ter', 'qua', 'qui', 'sex', 'sab', 'dom'],
                regras,
            })
            .select()
            .single();

        if (error) throw error;
        return NextResponse.json({ area: data });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// PUT: Atualizar área comum
export async function PUT(request: NextRequest) {
    try {
        const session = await getSessionFromReq(request);
        if (!session || !['sindico', 'superadmin'].includes(session.role)) {
            return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
        }

        const body = await request.json();
        const { id, ...updateData } = body;

        if (!id) {
            return NextResponse.json({ error: 'ID é obrigatório' }, { status: 400 });
        }

        const { data, error } = await supabaseAdmin
            .from('common_areas')
            .update({ ...updateData, updated_at: new Date().toISOString() })
            .eq('id', id)
            .eq('condo_id', session.condoId)
            .select()
            .single();

        if (error) throw error;
        return NextResponse.json({ area: data });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// DELETE: Desativar área comum
export async function DELETE(request: NextRequest) {
    try {
        const session = await getSessionFromReq(request);
        if (!session || !['sindico', 'superadmin'].includes(session.role)) {
            return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'ID é obrigatório' }, { status: 400 });
        }

        const { error } = await supabaseAdmin
            .from('common_areas')
            .update({ ativo: false })
            .eq('id', id)
            .eq('condo_id', session.condoId);

        if (error) throw error;
        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
