import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, getSessionFromReq } from '@/lib/supabase/admin';
import { cookies } from 'next/headers';

// Configuration
const IMPERSONATION_COOKIE_NAME = 'impersonation_session';
const COOKIE_MAX_AGE = 60 * 60; // 1 hour

export async function POST(request: NextRequest) {
    try {
        console.log('[IMPERSONATE] POST request started');

        // 1. Validate Superadmin Session
        const session = await getSessionFromReq(request);
        if (!session) {
            console.log('[IMPERSONATE] No session found');
            return NextResponse.json({ error: 'Sessão não encontrada. Faça login novamente.' }, { status: 401 });
        }

        if (!session.isSuperadmin) {
            console.log('[IMPERSONATE] Not superadmin:', session.role);
            return NextResponse.json({ error: 'Acesso negado. Apenas superadmin.' }, { status: 403 });
        }

        const body = await request.json();
        const { target_user_id } = body;

        if (!target_user_id) {
            return NextResponse.json({ error: 'ID do usuário alvo é obrigatório' }, { status: 400 });
        }

        console.log('[IMPERSONATE] Target user:', target_user_id);

        // 2. Validate Target User Exists
        const { data: targetUser, error: userError } = await supabaseAdmin
            .from('users')
            .select('id, role, nome, email, ativo')
            .eq('id', target_user_id)
            .single();

        if (userError) {
            console.error('[IMPERSONATE] User query error:', userError);
            return NextResponse.json({ error: `Erro ao buscar usuário: ${userError.message}` }, { status: 500 });
        }

        if (!targetUser) {
            console.log('[IMPERSONATE] User not found:', target_user_id);
            return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
        }

        console.log('[IMPERSONATE] Found target user:', targetUser.nome);

        // 3. Create Impersonation Session
        const expiresAt = new Date(Date.now() + COOKIE_MAX_AGE * 1000).toISOString();

        const { data: imp, error: impError } = await supabaseAdmin
            .from('impersonations')
            .insert({
                impersonator_id: session.userId,
                target_user_id: target_user_id,
                expires_at: expiresAt,
                reason: 'Support/Debugging'
            })
            .select('*')
            .single();

        if (impError) {
            console.error('[IMPERSONATE] Insert error:', impError);
            return NextResponse.json({
                error: `Erro ao criar sessão: ${impError.message}. Verifique se a tabela impersonations existe no banco.`
            }, { status: 500 });
        }

        console.log('[IMPERSONATE] Session created:', imp.id);

        // 4. Set HttpOnly Cookie
        const cookieStore = await cookies();
        cookieStore.set(IMPERSONATION_COOKIE_NAME, imp.id, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: COOKIE_MAX_AGE,
            path: '/',
        });

        // 5. Audit Log (Start) - não bloquear se falhar
        try {
            await supabaseAdmin.from('impersonation_action_logs').insert({
                impersonation_id: imp.id,
                impersonator_id: session.userId,
                target_user_id: target_user_id,
                method: 'POST',
                path: '/api/impersonate',
                payload: { action: 'START_IMPERSONATION', target: targetUser.nome },
                response_status: 200
            });
        } catch (logError) {
            console.warn('[IMPERSONATE] Audit log failed:', logError);
        }

        console.log('[IMPERSONATE] Success!');
        return NextResponse.json({ success: true, impersonation: imp });

    } catch (error: any) {
        console.error('[IMPERSONATE] Error:', error);
        return NextResponse.json({ error: `Erro interno: ${error.message}` }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const cookieStore = await cookies();
        const impId = cookieStore.get(IMPERSONATION_COOKIE_NAME)?.value;

        if (!impId) {
            return NextResponse.json({ error: 'No active impersonation' }, { status: 400 });
        }

        // Verify session (optional: only superadmin can end? Or anyone holding the cookie?)
        // Safer to verify cookie validity against DB

        // 1. Update DB (End session)
        const { data: imp, error } = await supabaseAdmin
            .from('impersonations')
            .update({ ended_at: new Date().toISOString() })
            .eq('id', impId)
            .select('*')
            .single();

        if (imp) {
            // 2. Audit Log (End)
            await supabaseAdmin.from('impersonation_action_logs').insert({
                impersonation_id: imp.id,
                impersonator_id: imp.impersonator_id, // stored in table
                target_user_id: imp.target_user_id,
                method: 'DELETE',
                path: '/api/impersonate',
                payload: { action: 'END_IMPERSONATION' },
                response_status: 200
            });
        }

        // 3. Remove Cookie
        cookieStore.delete(IMPERSONATION_COOKIE_NAME);

        return NextResponse.json({ success: true });

    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function GET(request: NextRequest) {
    // Return status
    const cookieStore = await cookies();
    const impId = cookieStore.get(IMPERSONATION_COOKIE_NAME)?.value;

    if (!impId) {
        return NextResponse.json({ active: false });
    }

    // Check DB validity
    const { data: imp } = await supabaseAdmin
        .from('impersonations')
        .select('*, target:users!target_user_id(role, nome, email)')
        .eq('id', impId)
        .is('ended_at', null)
        .gt('expires_at', new Date().toISOString())
        .single();

    if (!imp) {
        // Active cookie but invalid/expired DB session -> Clear cookie
        // Note: GET shouldn't mutate state strictly, but clearing bad cookie is UX friendly.
        // But headers are read-only in GET usually if not using response? 
        // We'll just return active: false.
        return NextResponse.json({ active: false });
    }

    // Return details
    return NextResponse.json({
        active: true,
        impersonation: imp,
        targetUser: imp.target // If join works
    });
}
