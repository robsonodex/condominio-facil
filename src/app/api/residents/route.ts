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

        // Send welcome email to new resident
        try {
            // Get condo name
            const { data: condo } = await supabaseAdmin
                .from('condos')
                .select('nome')
                .eq('id', condo_id)
                .single();

            // Get unit info
            const { data: unit } = await supabaseAdmin
                .from('units')
                .select('bloco, numero_unidade')
                .eq('id', unidade_id)
                .single();

            const unidadeLabel = unit
                ? `${unit.bloco ? unit.bloco + ' - ' : ''}${unit.numero_unidade}`
                : null;

            // Send welcome email (non-blocking)
            const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://meucondominiofacil.com';
            fetch(`${appUrl}/api/email`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    tipo: 'morador_welcome',
                    destinatario: email,
                    internalCall: true,
                    condoId: condo_id,
                    userId: userId,
                    dados: {
                        nome,
                        email,
                        condoNome: condo?.nome || 'seu condomínio',
                        unidade: unidadeLabel,
                        loginUrl: `${appUrl}/login`,
                    }
                })
            }).then(res => {
                if (res.ok) {
                    console.log(`[RESIDENTS] Welcome email sent to ${email}`);
                } else {
                    console.warn(`[RESIDENTS] Failed to send welcome email to ${email}`);
                }
            }).catch(err => {
                console.error('[RESIDENTS] Error sending welcome email:', err.message);
            });
        } catch (emailError: any) {
            // Don't fail the resident creation if email fails
            console.error('[RESIDENTS] Error preparing welcome email:', emailError.message);
        }

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
 * Delete a resident and associated user/auth
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

        // Get resident's user_id for auth deletion
        const { data: resident } = await supabaseAdmin
            .from('residents')
            .select('user_id, condo_id')
            .eq('id', id)
            .single();

        if (!resident) {
            return NextResponse.json({ error: 'Morador não encontrado' }, { status: 404 });
        }

        // Validate síndico can only delete from their own condo
        if (session.isSindico && resident.condo_id !== session.condoId) {
            return NextResponse.json({ error: 'Acesso negado ao condomínio' }, { status: 403 });
        }

        // Delete from Supabase Auth first (prevents email conflict on re-registration)
        if (resident.user_id) {
            try {
                const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(resident.user_id);
                if (authError) {
                    console.error('[RESIDENTS] Auth deletion error:', authError);
                } else {
                    console.log('[RESIDENTS] Auth user deleted:', resident.user_id);
                }
            } catch (authErr) {
                console.error('[RESIDENTS] Auth deletion exception:', authErr);
                // Continue with deletion even if auth fails
            }

            // Delete from users table
            await supabaseAdmin.from('users').delete().eq('id', resident.user_id);
            console.log('[RESIDENTS] User record deleted:', resident.user_id);
        }

        // Delete resident record
        const { error } = await supabaseAdmin.from('residents').delete().eq('id', id);

        if (error) {
            console.error('[RESIDENTS] Delete error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        await logEvent('RESIDENT_DELETED', 'info', {
            residentId: id,
            userId: resident.user_id,
            deletedBy: session.userId
        });

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error('[RESIDENTS] DELETE error:', error);
        return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
    }
}
