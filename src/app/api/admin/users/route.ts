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
        const {
            nome,
            email,
            senha,
            telefone,
            role,
            condo_id,
            ativo,
            // Campos extras para síndico
            condo_nome,
            plano_id,
            periodo_teste,
            ativar_imediatamente
        } = body;

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

        // Criar usuário no Supabase Auth
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password: senha,
            email_confirm: true,
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

        let finalCondoId = condo_id || null;

        // Se for síndico e tiver dados de plano, criar condomínio e subscription
        if (role === 'sindico' && condo_nome && plano_id) {
            // Buscar dados do plano
            const { data: plan } = await supabase
                .from('plans')
                .select('valor_mensal')
                .eq('id', plano_id)
                .single();

            // Calcular datas
            const hoje = new Date();
            let dataFim: Date;
            let status: string;

            if (ativar_imediatamente) {
                status = 'ativo';
                dataFim = new Date(hoje);
                dataFim.setMonth(dataFim.getMonth() + 1);
            } else if (periodo_teste) {
                status = 'teste';
                dataFim = new Date(hoje);
                dataFim.setDate(dataFim.getDate() + 7);
            } else {
                status = 'ativo';
                dataFim = new Date(hoje);
                dataFim.setMonth(dataFim.getMonth() + 1);
            }

            // Criar condomínio
            const { data: newCondo, error: condoError } = await supabase
                .from('condos')
                .insert({
                    nome: condo_nome,
                    plano_id: plano_id,
                    status: status,
                    data_inicio: hoje.toISOString().split('T')[0],
                    data_fim_teste: periodo_teste ? dataFim.toISOString().split('T')[0] : null,
                })
                .select('id')
                .single();

            if (condoError) {
                await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
                return NextResponse.json({
                    error: `Erro ao criar condomínio: ${condoError.message}`
                }, { status: 500 });
            }

            finalCondoId = newCondo.id;

            // Criar subscription
            const { error: subError } = await supabase
                .from('subscriptions')
                .insert({
                    condo_id: newCondo.id,
                    plano_id: plano_id,
                    status: status,
                    data_inicio: hoje.toISOString().split('T')[0],
                    data_fim: dataFim.toISOString().split('T')[0],
                    valor_mensal_cobrado: plan?.valor_mensal || 0,
                });

            if (subError) {
                console.error('Subscription error:', subError);
                // Continua mesmo com erro de subscription
            }
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
                condo_id: finalCondoId,
                ativo: ativo !== false
            });

        if (dbError) {
            await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
            return NextResponse.json({
                error: `Erro ao salvar dados: ${dbError.message}`
            }, { status: 500 });
        }

        let message = `Usuário "${nome}" criado com sucesso!`;
        if (role === 'sindico' && condo_nome) {
            message += ` Condomínio "${condo_nome}" criado.`;
            if (periodo_teste && !ativar_imediatamente) {
                message += ` Período de teste: 7 dias.`;
            } else {
                message += ` Ativado imediatamente.`;
            }
        }

        return NextResponse.json({
            success: true,
            message,
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
