import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createClient as createServerClient } from '@/lib/supabase/server';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
    try {
        // Verificar se usuário logado é admin
        const supabase = await createServerClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        const { data: profile } = await supabase
            .from('users')
            .select('role')
            .eq('email', user.email)
            .single();

        if (!profile || (profile.role !== 'superadmin' && profile.role !== 'sindico')) {
            return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
        }

        // Dados do novo usuário
        const body = await request.json();
        const { nome, email, senha, telefone, role, condo_id, ativo } = body;

        if (!nome || !email || !senha) {
            return NextResponse.json({
                error: 'Nome, email e senha são obrigatórios'
            }, { status: 400 });
        }

        // Verificar se email já existe na tabela users
        const { data: existingUser } = await supabase
            .from('users')
            .select('id')
            .eq('email', email)
            .single();

        if (existingUser) {
            return NextResponse.json({
                error: `Já existe um usuário cadastrado com o email "${email}". Por favor, use outro email.`
            }, { status: 400 });
        }

        // Criar usuário no Supabase Auth (usando service_role)
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password: senha,
            email_confirm: true, // Confirma email automaticamente
            user_metadata: { nome }
        });

        if (authError) {
            if (authError.message.includes('already')) {
                return NextResponse.json({
                    error: `Já existe um usuário cadastrado com o email "${email}". Por favor, use outro email.`
                }, { status: 400 });
            }
            return NextResponse.json({
                error: `Erro ao criar usuário: ${authError.message}`
            }, { status: 500 });
        }

        // Inserir na tabela users
        const { error: dbError } = await supabase
            .from('users')
            .insert({
                id: authData.user.id,
                nome,
                email,
                telefone: telefone || null,
                role: role || 'morador',
                condo_id: condo_id || null,
                ativo: ativo !== false
            });

        if (dbError) {
            // Se falhou na tabela, deletar do auth
            await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
            return NextResponse.json({
                error: `Erro ao salvar dados: ${dbError.message}`
            }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            message: `Usuário "${nome}" criado com sucesso!`,
            user: {
                id: authData.user.id,
                email,
                nome
            }
        });

    } catch (error: any) {
        console.error('User creation error:', error);
        return NextResponse.json({
            error: `Erro inesperado: ${error.message}`
        }, { status: 500 });
    }
}
