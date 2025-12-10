import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, getSessionFromReq } from '@/lib/supabase/admin';

export async function POST(request: NextRequest) {
    try {
        // 1. Check Authentication & Permission
        const session = await getSessionFromReq(request);
        if (!session) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        // Only Superadmin or Sindico can create users
        if (!session.isSuperadmin && !session.isSindico) {
            return NextResponse.json({ error: 'Permissões insuficientes' }, { status: 403 });
        }

        const body = await request.json();
        const { email, password, nome, telefone, role, condo_id } = body;

        // 2. Validate Request
        if (!email || !password || !nome || !role || !condo_id) {
            return NextResponse.json(
                { error: 'Campos obrigatórios: email, password, nome, role, condo_id' },
                { status: 400 }
            );
        }

        // Sindico can only create for their own condo
        if (session.isSindico && session.condoId !== condo_id) {
            return NextResponse.json({ error: 'Acesso negado ao condomínio' }, { status: 403 });
        }

        // 3. Create Auth User (Service Role)
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: { nome }
        });

        if (authError) {
            console.error('[CREATE_USER] Auth error:', authError);
            return NextResponse.json(
                { error: `Erro na autenticação: ${authError.message}` },
                { status: 400 }
            );
        }

        if (!authData.user) {
            return NextResponse.json({ error: 'Falha ao criar usuário Auth' }, { status: 500 });
        }

        // 4. Create Profile (Service Role)
        const { error: profileError } = await supabaseAdmin
            .from('users')
            .insert({
                id: authData.user.id,
                email,
                nome,
                telefone: telefone || null,
                role,
                condo_id,
                ativo: true,
            });

        if (profileError) {
            console.error('[CREATE_USER] Profile error:', profileError);
            // Rollback auth user
            await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
            return NextResponse.json(
                { error: `Erro ao criar perfil: ${profileError.message}` },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            user: {
                id: authData.user.id,
                email,
                nome,
                role,
                condo_id
            }
        });

    } catch (error: any) {
        console.error('[CREATE_USER] Unexpected error:', error);
        return NextResponse.json(
            { error: error.message || 'Erro interno no servidor' },
            { status: 500 }
        );
    }
}
