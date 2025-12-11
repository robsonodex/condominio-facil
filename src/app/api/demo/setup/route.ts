import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

const DEMO_EMAIL = 'sindico.demo@condofacil.com';
const DEMO_PASSWORD = 'demo123456';
const DEMO_CONDO_NAME = 'Residencial Demo';

export async function POST(request: NextRequest) {
    try {
        // 1. Verificar se usuário demo já existe
        const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
        let demoUser = existingUsers?.users?.find(u => u.email === DEMO_EMAIL);

        // 2. Se não existe, criar o usuário demo
        if (!demoUser) {
            const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
                email: DEMO_EMAIL,
                password: DEMO_PASSWORD,
                email_confirm: true,
                user_metadata: {
                    nome: 'Síndico Demo',
                    role: 'sindico'
                }
            });

            if (createError) {
                console.error('Error creating demo user:', createError);
                return NextResponse.json({
                    error: 'Erro ao criar usuário demo: ' + createError.message
                }, { status: 500 });
            }

            demoUser = newUser.user;
        }

        // 3. Verificar/criar condomínio demo
        let { data: demoCondo } = await supabaseAdmin
            .from('condos')
            .select('id')
            .eq('nome', DEMO_CONDO_NAME)
            .single();

        if (!demoCondo) {
            // Criar condomínio demo
            const { data: newCondo, error: condoError } = await supabaseAdmin
                .from('condos')
                .insert({
                    nome: DEMO_CONDO_NAME,
                    endereco: 'Av. Demonstração, 1000',
                    cidade: 'São Paulo',
                    estado: 'SP',
                    cep: '01234-567',
                    cnpj: '00.000.000/0001-00',
                    telefone: '(11) 99999-0000',
                    email: 'demo@condofacil.com'
                })
                .select()
                .single();

            if (condoError) {
                console.error('Error creating demo condo:', condoError);
                return NextResponse.json({
                    error: 'Erro ao criar condomínio demo: ' + condoError.message
                }, { status: 500 });
            }

            demoCondo = newCondo;
        }

        // 4. Verificar/criar profile do usuário
        const { data: existingProfile } = await supabaseAdmin
            .from('users')
            .select('id')
            .eq('id', demoUser!.id)
            .single();

        if (!existingProfile) {
            await supabaseAdmin
                .from('users')
                .insert({
                    id: demoUser!.id,
                    email: DEMO_EMAIL,
                    nome: 'Síndico Demo',
                    role: 'sindico',
                    condo_id: demoCondo.id,
                    telefone: '(11) 99999-0000',
                    ativo: true
                });
        } else {
            // Atualizar para garantir que está vinculado ao condo demo
            await supabaseAdmin
                .from('users')
                .update({
                    role: 'sindico',
                    condo_id: demoCondo.id,
                    ativo: true
                })
                .eq('id', demoUser!.id);
        }

        // 5. Criar dados de exemplo se não existirem
        await createDemoData(demoCondo.id, demoUser!.id);

        return NextResponse.json({
            success: true,
            email: DEMO_EMAIL,
            password: DEMO_PASSWORD,
            message: 'Ambiente demo pronto!'
        });

    } catch (error: any) {
        console.error('Error setting up demo:', error);
        return NextResponse.json({
            error: 'Erro ao configurar demo: ' + error.message
        }, { status: 500 });
    }
}

async function createDemoData(condoId: string, userId: string) {
    // Verificar se já tem unidades
    const { count: unitsCount } = await supabaseAdmin
        .from('units')
        .select('id', { count: 'exact', head: true })
        .eq('condo_id', condoId);

    if (unitsCount && unitsCount > 0) {
        return; // Já tem dados
    }

    // Criar unidades
    const units = [];
    for (let bloco of ['A', 'B']) {
        for (let andar = 1; andar <= 3; andar++) {
            for (let apt = 1; apt <= 2; apt++) {
                units.push({
                    condo_id: condoId,
                    bloco,
                    numero: `${andar}0${apt}`,
                    andar,
                    tipo: 'apartamento',
                    area: 65 + Math.floor(Math.random() * 30),
                    status: 'ocupada'
                });
            }
        }
    }

    await supabaseAdmin.from('units').insert(units);

    // Criar alguns avisos
    await supabaseAdmin.from('notices').insert([
        {
            condo_id: condoId,
            titulo: 'Bem-vindo ao Modo Demo!',
            descricao: 'Este é um ambiente de demonstração. Explore todas as funcionalidades do sistema.',
            prioridade: 'alta',
            created_by: userId
        },
        {
            condo_id: condoId,
            titulo: 'Manutenção Preventiva',
            descricao: 'A manutenção dos elevadores será realizada no próximo sábado.',
            prioridade: 'media',
            created_by: userId
        },
        {
            condo_id: condoId,
            titulo: 'Reunião de Condomínio',
            descricao: 'Reunião ordinária dia 15 às 19h no salão de festas.',
            prioridade: 'baixa',
            created_by: userId
        }
    ]);

    // Criar alguns lançamentos financeiros
    const now = new Date();
    await supabaseAdmin.from('financial_entries').insert([
        {
            condo_id: condoId,
            tipo: 'receita',
            categoria: 'Taxa Condominial',
            descricao: 'Arrecadação mensal',
            valor: 15000,
            data_vencimento: now.toISOString().split('T')[0],
            status: 'pago'
        },
        {
            condo_id: condoId,
            tipo: 'despesa',
            categoria: 'Manutenção',
            descricao: 'Limpeza de caixa d\'água',
            valor: 800,
            data_vencimento: now.toISOString().split('T')[0],
            status: 'pago'
        },
        {
            condo_id: condoId,
            tipo: 'despesa',
            categoria: 'Energia',
            descricao: 'Conta de luz áreas comuns',
            valor: 1200,
            data_vencimento: now.toISOString().split('T')[0],
            status: 'pendente'
        }
    ]);
}
