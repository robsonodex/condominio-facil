import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, getSessionFromReq, logEvent } from '@/lib/supabase/admin';

/**
 * POST /api/residents
 * Create a new resident with associated user
 */
export async function POST(request: NextRequest) {
    try {
        const session = await getSessionFromReq(request);

        if (!session) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        if (!session.isSindico && !session.isSuperadmin) {
            return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
        }

        const body = await request.json();
        const { nome, email, telefone, condo_id, unidade_id, tipo } = body;

        // Validate required fields
        if (!nome || !email || !condo_id || !unidade_id) {
            return NextResponse.json({ error: 'Campos obrigatórios: nome, email, condo_id, unidade_id' }, { status: 400 });
        }

        // Validate síndico can only create for their own condo
        if (session.isSindico && session.condoId !== condo_id) {
            return NextResponse.json({ error: 'Acesso negado ao condomínio' }, { status: 403 });
        }

        // Check if user already exists
        const { data: existingUser } = await supabaseAdmin
            .from('users')
            .select('id')
            .eq('email', email)
            .single();

        let userId: string;

        if (existingUser) {
            userId = existingUser.id;
            // Update existing user's condo and unit
            await supabaseAdmin.from('users').update({
                condo_id,
                unidade_id,
            }).eq('id', userId);
        } else {
            // Create new user
            const { data: newUser, error: userError } = await supabaseAdmin.from('users').insert({
                nome,
                email,
                telefone: telefone || null,
                role: 'morador',
                condo_id,
                unidade_id,
                ativo: true,
            }).select().single();

            if (userError) {
                console.error('[RESIDENTS] User insert error:', userError);
                return NextResponse.json({ error: userError.message }, { status: 500 });
            }

            userId = newUser.id;
        }

        // Create resident record
        const { data: resident, error: resError } = await supabaseAdmin.from('residents').insert({
            user_id: userId,
            condo_id,
            unidade_id,
            tipo: tipo || 'proprietario',
            ativo: true,
        }).select('*, user:users(*), unit:units(bloco, numero_unidade)').single();

        if (resError) {
            console.error('[RESIDENTS] Resident insert error:', resError);
            return NextResponse.json({ error: resError.message }, { status: 500 });
        }

        await logEvent('RESIDENT_CREATED', 'info', { residentId: resident.id, userId, createdBy: session.userId });

        return NextResponse.json({ success: true, data: resident }, { status: 201 });

    } catch (error: any) {
        console.error('[RESIDENTS] Unexpected error:', error);
        return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
    }
}

/**
 * GET /api/residents
 * List residents (filtered by condo for síndico)
 */
export async function GET(request: NextRequest) {
    try {
        const session = await getSessionFromReq(request);

        if (!session) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const condo_id = searchParams.get('condo_id');

        let query = supabaseAdmin
            .from('residents')
            .select('*, user:users(*), unit:units(bloco, numero_unidade), condo:condos(nome)')
            .order('created_at', { ascending: false });

        // Síndico can only see their own condo
        if (session.isSindico) {
            query = query.eq('condo_id', session.condoId);
        } else if (condo_id) {
            query = query.eq('condo_id', condo_id);
        }

        const { data, error } = await query;

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ data });

    } catch (error: any) {
        console.error('[RESIDENTS] GET error:', error);
        return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
    }
}

/**
 * PUT /api/residents
 * Update an existing resident
 */
export async function PUT(request: NextRequest) {
    try {
        const session = await getSessionFromReq(request);

        if (!session) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        if (!session.isSindico && !session.isSuperadmin) {
            return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
        }

        const body = await request.json();
        const { id, nome, telefone, unidade_id, tipo, ativo, user_id } = body;

        if (!id) {
            return NextResponse.json({ error: 'ID obrigatório' }, { status: 400 });
        }

        // Update user if user_id provided
        if (user_id) {
            await supabaseAdmin.from('users').update({
                nome,
                telefone: telefone || null,
            }).eq('id', user_id);
        }

        // Update resident
        const { data, error } = await supabaseAdmin.from('residents').update({
            unidade_id,
            tipo,
            ativo,
            updated_at: new Date().toISOString(),
        }).eq('id', id).select().single();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, data });

    } catch (error: any) {
        console.error('[RESIDENTS] PUT error:', error);
        return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
    }
}

/**
 * DELETE /api/residents
 * Delete a resident
 */
export async function DELETE(request: NextRequest) {
    try {
        const session = await getSessionFromReq(request);

        if (!session) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        if (!session.isSindico && !session.isSuperadmin) {
            return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'ID obrigatório' }, { status: 400 });
        }

        const { error } = await supabaseAdmin.from('residents').delete().eq('id', id);

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        await logEvent('RESIDENT_DELETED', 'info', { residentId: id, deletedBy: session.userId });

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error('[RESIDENTS] DELETE error:', error);
        return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
    }
}
