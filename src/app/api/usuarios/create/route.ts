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

        // 5. Se for morador, criar também registro na tabela residents
        if (role === 'morador') {
            const { error: residentError } = await supabaseAdmin
                .from('residents')
                .insert({
                    condo_id,
                    user_id: authData.user.id,
                    nome,
                    email,
                    telefone: telefone || null,
                    ativo: true,
                });

            if (residentError) {
                console.warn('[CREATE_USER] Aviso: Não foi possível criar registro de morador:', residentError.message);
                // Não falha a requisição, apenas loga o aviso
            } else {
                console.log('[CREATE_USER] ✅ Morador também cadastrado em residents');
            }
        }

        // Get condo name for email
        let condoNome = '';
        if (condo_id) {
            const { data: condoData } = await supabaseAdmin
                .from('condos')
                .select('nome')
                .eq('id', condo_id)
                .single();
            condoNome = condoData?.nome || '';
        }

        // Send credentials email to new user
        try {
            const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://meucondominiofacil.com';
            console.log('[CREATE_USER] Enviando email para:', email, 'baseUrl:', baseUrl);

            const emailResponse = await fetch(`${baseUrl}/api/email`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    tipo: 'user_credentials',
                    destinatario: email,
                    dados: {
                        nome,
                        email,
                        password,
                        role: role === 'sindico' ? 'Síndico' : role === 'porteiro' ? 'Porteiro' : 'Morador',
                        condoNome,
                        loginUrl: `${baseUrl}/login`
                    },
                    internalCall: true
                })
            });

            const emailResult = await emailResponse.json();

            if (emailResponse.ok && emailResult.success) {
                console.log('[CREATE_USER] ✅ Email enviado com sucesso para:', email);
            } else {
                console.error('[CREATE_USER] ❌ Falha ao enviar email:', emailResult.error || 'Erro desconhecido');
            }
        } catch (emailError: any) {
            console.error('[CREATE_USER] ❌ Exceção ao enviar email:', emailError?.message || emailError);
            // Don't fail the request, just log the error
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
