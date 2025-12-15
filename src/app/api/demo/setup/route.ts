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
                    telefone: '(11) 99999-0000'
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
                    condo_id: demoCondo!.id,
                    telefone: '(11) 99999-0000',
                    ativo: true
                });
        } else {
            // Atualizar para garantir que está vinculado ao condo demo
            await supabaseAdmin
                .from('users')
                .update({
                    role: 'sindico',
                    condo_id: demoCondo!.id,
                    ativo: true
                })
                .eq('id', demoUser!.id);
        }
        // 5. Verificar/criar assinatura Premium para o demo ter todas as features
        const { data: existingSubscription } = await supabaseAdmin
            .from('subscriptions')
            .select('id')
            .eq('condo_id', demoCondo!.id)
            .single();

        if (!existingSubscription) {
            // Buscar plano Premium
            let { data: premiumPlan } = await supabaseAdmin
                .from('plans')
                .select('id')
                .ilike('nome', '%premium%')
                .single();

            // Se não tem Premium, criar um plano demo
            if (!premiumPlan) {
                const { data: newPlan } = await supabaseAdmin
                    .from('plans')
                    .insert({
                        nome: 'Premium Demo',
                        descricao: 'Plano completo para demonstração',
                        preco: 0,
                        ativo: true
                    })
                    .select()
                    .single();
                premiumPlan = newPlan;
            }

            if (premiumPlan) {
                await supabaseAdmin
                    .from('subscriptions')
                    .insert({
                        condo_id: demoCondo!.id,
                        plano_id: premiumPlan.id,
                        status: 'ativa',
                        data_inicio: new Date().toISOString().split('T')[0],
                        data_fim: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
                    });
                console.log('[DEMO] Assinatura Premium criada');
            }
        }

        // 6. Criar dados de exemplo
        console.log('[DEMO SETUP] Chamando createDemoData para condo:', demoCondo!.id);
        await createDemoData(demoCondo!.id, demoUser!.id);
        console.log('[DEMO SETUP] createDemoData concluído');

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
    console.log('[DEMO] Iniciando criação de dados para condo:', condoId);

    try {
        const now = new Date();
        const today = now.toISOString().split('T')[0];

        // ==========================================
        // UNIDADES (12 apartamentos)
        // ==========================================
        console.log('[DEMO] Criando unidades...');
        const units = [];
        for (let bloco of ['A', 'B']) {
            for (let andar = 1; andar <= 3; andar++) {
                for (let num = 1; num <= 2; num++) {
                    units.push({
                        condo_id: condoId,
                        bloco,
                        numero_unidade: `${andar}0${num}`
                    });
                }
            }
        }

        const { data: insertedUnits, error: unitsError } = await supabaseAdmin
            .from('units')
            .insert(units)
            .select();

        if (unitsError) {
            console.error('[DEMO] Erro ao criar unidades:', unitsError);
            throw new Error('Erro ao criar unidades: ' + unitsError.message);
        }

        console.log('[DEMO] Unidades criadas:', insertedUnits?.length || 0);

        // ==========================================
        // MORADORES (10 pessoas realistas)
        // ==========================================
        console.log('[DEMO] Criando moradores...');
        const moradores = [
            { nome: 'João Carlos Silva', email: 'joao.silva@demo.com', telefone: '(11) 98765-1234', cpf: '123.456.789-00' },
            { nome: 'Maria Fernanda Santos', email: 'maria.santos@demo.com', telefone: '(11) 98765-2345', cpf: '234.567.890-11' },
            { nome: 'Pedro Henrique Costa', email: 'pedro.costa@demo.com', telefone: '(11) 98765-3456', cpf: '345.678.901-22' },
            { nome: 'Ana Beatriz Oliveira', email: 'ana.oliveira@demo.com', telefone: '(11) 98765-4567', cpf: '456.789.012-33' },
            { nome: 'Carlos Eduardo Pereira', email: 'carlos.pereira@demo.com', telefone: '(11) 98765-5678', cpf: '567.890.123-44' },
            { nome: 'Juliana Almeida', email: 'juliana.almeida@demo.com', telefone: '(11) 98765-6789', cpf: '678.901.234-55' },
            { nome: 'Roberto Nascimento', email: 'roberto.nasc@demo.com', telefone: '(11) 98765-7890', cpf: '789.012.345-66' },
            { nome: 'Fernanda Lima', email: 'fernanda.lima@demo.com', telefone: '(11) 98765-8901', cpf: '890.123.456-77' },
            { nome: 'Ricardo Mendes', email: 'ricardo.mendes@demo.com', telefone: '(11) 98765-9012', cpf: '901.234.567-88' },
            { nome: 'Patrícia Souza', email: 'patricia.souza@demo.com', telefone: '(11) 98765-0123', cpf: '012.345.678-99' },
        ];

        if (!insertedUnits || insertedUnits.length === 0) {
            console.error('[DEMO] Nenhuma unidade foi criada!');
            throw new Error('Falha ao criar unidades - array vazio');
        }

        for (let i = 0; i < moradores.length && i < insertedUnits.length; i++) {
            const { error: residentError } = await supabaseAdmin.from('residents').insert({
                condo_id: condoId,
                unidade_id: insertedUnits[i].id,
                ...moradores[i],
                tipo: i === 0 ? 'proprietario' : (i % 3 === 0 ? 'inquilino' : 'proprietario'),
                ativo: true
            });

            if (residentError) {
                console.error(`[DEMO] Erro ao criar morador ${i}:`, residentError);
            }
        }
        console.log('[DEMO] Moradores criados:', moradores.length);

        // ==========================================
        // AVISOS (5)
        // ==========================================
        console.log('[DEMO] Criando avisos...');
        const { error: noticesError } = await supabaseAdmin.from('notices').insert([
            { condo_id: condoId, titulo: 'Manutenção Elevador', conteudo: 'Manutenção preventiva dia 20/01', created_by: userId },
            { condo_id: condoId, titulo: 'Limpeza Caixa Dágua', conteudo: 'Limpeza dia 25/01', created_by: userId },
            { condo_id: condoId, titulo: 'Assembleia', conteudo: 'Assembleia dia 30/01 às 19h', created_by: userId },
            { condo_id: condoId, titulo: 'Pintura Fachada', conteudo: 'Início da pintura - 2 semanas', created_by: userId },
            { condo_id: condoId, titulo: 'Horário Piscina', conteudo: 'Novo horário: 8h às 20h', created_by: userId },
        ]);
        if (noticesError) console.error('[DEMO] Erro avisos:', noticesError);
        else console.log('[DEMO] Avisos: 5');

        // ==========================================
        // OCORRÊNCIAS (5)
        // ==========================================
        console.log('[DEMO] Criando ocorrências...');
        const { error: occError } = await supabaseAdmin.from('occurrences').insert([
            { condo_id: condoId, titulo: 'Barulho excessivo', descricao: 'Barulho apto 301', user_id: userId, status: 'aberta' },
            { condo_id: condoId, titulo: 'Vazamento', descricao: 'Vazamento apto 102', user_id: userId, status: 'em_andamento' },
            { condo_id: condoId, titulo: 'Lâmpada queimada', descricao: 'Corredor 2º andar', user_id: userId, status: 'resolvida' },
            { condo_id: condoId, titulo: 'Portão defeito', descricao: 'Portão garagem', user_id: userId, status: 'aberta' },
            { condo_id: condoId, titulo: 'Interfone', descricao: 'Interfone apto 201', user_id: userId, status: 'em_andamento' },
        ]);
        if (occError) console.error('[DEMO] Erro ocorrências:', occError);
        else console.log('[DEMO] Ocorrências: 5');

        // ==========================================
        // VISITANTES (10)
        // ==========================================
        await supabaseAdmin.from('visitors').insert([
            { condo_id: condoId, nome: 'Entregador iFood', tipo: 'delivery', destino: 'Apt 101', observacao: 'Pedido de comida', status: 'saiu', created_by: userId },
            { condo_id: condoId, nome: 'José da Manutenção', tipo: 'prestador', destino: 'Apt 203', observacao: 'Conserto do chuveiro', status: 'no_condominio', created_by: userId },
            { condo_id: condoId, nome: 'Dra. Mariana', tipo: 'visitante', destino: 'Apt 102', observacao: 'Visita médica', status: 'saiu', created_by: userId },
            { condo_id: condoId, nome: 'Correios', tipo: 'delivery', destino: 'Portaria', observacao: 'Entrega de encomenda', status: 'saiu', created_by: userId },
            { condo_id: condoId, nome: 'Família do Sr. João', tipo: 'visitante', destino: 'Apt 101', observacao: 'Visita familiar', status: 'no_condominio', created_by: userId },
            { condo_id: condoId, nome: 'Técnico NET', tipo: 'prestador', destino: 'Apt 301', observacao: 'Instalação internet', status: 'saiu', created_by: userId },
            { condo_id: condoId, nome: 'Entregador Amazon', tipo: 'delivery', destino: 'Portaria', observacao: 'Pacote grande', status: 'saiu', created_by: userId },
            { condo_id: condoId, nome: 'Representante Comercial', tipo: 'visitante', destino: 'Apt 202', observacao: 'Reunião de negócios', status: 'saiu', created_by: userId },
            { condo_id: condoId, nome: 'Amigos do Pedro', tipo: 'visitante', destino: 'Apt 103', observacao: 'Festa de aniversário', status: 'no_condominio', created_by: userId },
            { condo_id: condoId, nome: 'Uber Eats', tipo: 'delivery', destino: 'Apt 201', observacao: 'Pedido restaurante', status: 'saiu', created_by: userId },
        ]);

        // ==========================================
        // LANÇAMENTOS FINANCEIROS (20)
        // ==========================================
        const financialEntries = [
            // Receitas
            { tipo: 'receita', categoria: 'Taxa Condominial', descricao: 'Arrecadação Janeiro', valor: 15000, status: 'pago' },
            { tipo: 'receita', categoria: 'Taxa Condominial', descricao: 'Arrecadação Fevereiro', valor: 14500, status: 'pago' },
            { tipo: 'receita', categoria: 'Taxa Condominial', descricao: 'Arrecadação Março', valor: 15200, status: 'pago' },
            { tipo: 'receita', categoria: 'Fundo de Reserva', descricao: 'Contribuição trimestral', valor: 3000, status: 'pago' },
            { tipo: 'receita', categoria: 'Aluguel Salão', descricao: 'Evento particular', valor: 500, status: 'pago' },
            { tipo: 'receita', categoria: 'Multas', descricao: 'Multa por infração', valor: 200, status: 'pago' },
            // Despesas
            { tipo: 'despesa', categoria: 'Folha de Pagamento', descricao: 'Salários funcionários', valor: 8500, status: 'pago' },
            { tipo: 'despesa', categoria: 'Energia Elétrica', descricao: 'Conta de luz áreas comuns', valor: 1800, status: 'pago' },
            { tipo: 'despesa', categoria: 'Água', descricao: 'Conta de água', valor: 950, status: 'pago' },
            { tipo: 'despesa', categoria: 'Manutenção', descricao: 'Reparo elevador', valor: 1200, status: 'pago' },
            { tipo: 'despesa', categoria: 'Manutenção', descricao: 'Limpeza caixa água', valor: 600, status: 'pago' },
            { tipo: 'despesa', categoria: 'Segurança', descricao: 'Empresa monitoramento', valor: 800, status: 'pago' },
            { tipo: 'despesa', categoria: 'Jardinagem', descricao: 'Manutenção jardim', valor: 450, status: 'pago' },
            { tipo: 'despesa', categoria: 'Limpeza', descricao: 'Material de limpeza', valor: 320, status: 'pago' },
            { tipo: 'despesa', categoria: 'Administração', descricao: 'Taxa administradora', valor: 1500, status: 'pago' },
            { tipo: 'despesa', categoria: 'Seguros', descricao: 'Seguro predial mensal', valor: 750, status: 'pago' },
            // Pendentes
            { tipo: 'despesa', categoria: 'Manutenção', descricao: 'Pintura fachada (parcela 1)', valor: 5000, status: 'pendente' },
            { tipo: 'receita', categoria: 'Taxa Condominial', descricao: 'Arrecadação Abril', valor: 15000, status: 'pendente' },
            { tipo: 'despesa', categoria: 'Energia Elétrica', descricao: 'Conta luz próximo mês', valor: 1900, status: 'pendente' },
            { tipo: 'despesa', categoria: 'Água', descricao: 'Conta água próximo mês', valor: 1000, status: 'pendente' },
        ];

        for (const entry of financialEntries) {
            await supabaseAdmin.from('financial_entries').insert({
                condo_id: condoId,
                ...entry,
                data_vencimento: today
            });
        }

        // ==========================================
        // FORNECEDORES (3)
        // ==========================================
        const { data: suppliersData } = await supabaseAdmin.from('maintenance_suppliers').insert([
            { condo_id: condoId, nome: 'Hidráulica Silva', especialidade: 'Encanador', telefone: '(11) 91234-5678', email: 'hidraulica.silva@demo.com', rating: 4.8, total_servicos: 15, ativo: true },
            { condo_id: condoId, nome: 'Elétrica Rápida', especialidade: 'Eletricista', telefone: '(11) 92345-6789', email: 'eletrica.rapida@demo.com', rating: 4.5, total_servicos: 22, ativo: true },
            { condo_id: condoId, nome: 'Pinturas Premium', especialidade: 'Pintor', telefone: '(11) 93456-7890', email: 'pinturas.premium@demo.com', rating: 4.9, total_servicos: 8, ativo: true },
        ]).select();

        // ==========================================
        // MANUTENÇÕES (5)
        // ==========================================
        if (suppliersData && suppliersData.length > 0) {
            await supabaseAdmin.from('maintenance_orders').insert([
                { condo_id: condoId, titulo: 'Revisão do sistema hidráulico', descricao: 'Manutenção preventiva anual', tipo: 'preventiva', prioridade: 'media', status: 'concluido', local: 'Casa de máquinas', fornecedor_id: suppliersData[0].id, valor_estimado: 800, valor_realizado: 750, data_agendada: today, data_conclusao: today, created_by: userId },
                { condo_id: condoId, titulo: 'Troca de lâmpadas LED', descricao: 'Substituição de lâmpadas antigas por LED', tipo: 'preventiva', prioridade: 'baixa', status: 'concluido', local: 'Corredores', fornecedor_id: suppliersData[1].id, valor_estimado: 500, valor_realizado: 480, data_agendada: today, data_conclusao: today, created_by: userId },
                { condo_id: condoId, titulo: 'Reparo vazamento garagem', descricao: 'Conserto urgente de vazamento na garagem', tipo: 'corretiva', prioridade: 'alta', status: 'em_execucao', local: 'Garagem B', fornecedor_id: suppliersData[0].id, valor_estimado: 1200, data_agendada: today, created_by: userId },
                { condo_id: condoId, titulo: 'Pintura do hall de entrada', descricao: 'Renovação da pintura do hall', tipo: 'preventiva', prioridade: 'media', status: 'agendado', local: 'Hall entrada', fornecedor_id: suppliersData[2].id, valor_estimado: 2500, data_agendada: today, created_by: userId },
                { condo_id: condoId, titulo: 'Manutenção portão eletrônico', descricao: 'Lubrificação e ajustes do motor', tipo: 'preventiva', prioridade: 'media', status: 'agendado', local: 'Portão principal', fornecedor_id: suppliersData[1].id, valor_estimado: 350, data_agendada: today, created_by: userId },
            ]);
        }

        // ==========================================
        // ENCOMENDAS (5)
        // ==========================================
        await supabaseAdmin.from('deliveries').insert([
            { condo_id: condoId, destinatario: 'João Carlos Silva', unidade: '101', remetente: 'Amazon', tipo: 'pacote', status: 'aguardando', observacao: 'Caixa grande', created_by: userId },
            { condo_id: condoId, destinatario: 'Maria Fernanda Santos', unidade: '102', remetente: 'Mercado Livre', tipo: 'pacote', status: 'entregue', observacao: 'Envelope pequeno', created_by: userId },
            { condo_id: condoId, destinatario: 'Pedro Henrique Costa', unidade: '103', remetente: 'Magazine Luiza', tipo: 'pacote', status: 'aguardando', observacao: 'Eletrodoméstico', created_by: userId },
            { condo_id: condoId, destinatario: 'Ana Beatriz Oliveira', unidade: '201', remetente: 'Correios', tipo: 'carta', status: 'entregue', observacao: 'Carta registrada', created_by: userId },
            { condo_id: condoId, destinatario: 'Carlos Eduardo Pereira', unidade: '202', remetente: 'Shopee', tipo: 'pacote', status: 'aguardando', observacao: 'Múltiplos pacotes', created_by: userId },
        ]);

        // ==========================================
        // ENQUETES (2)
        // ==========================================
        await supabaseAdmin.from('polls').insert([
            { condo_id: condoId, titulo: 'Horário de funcionamento da piscina', descricao: 'Vote no melhor horário para a piscina funcionar aos finais de semana.', status: 'ativa', data_inicio: today, data_fim: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], created_by: userId },
            { condo_id: condoId, titulo: 'Instalação de câmeras adicionais', descricao: 'Você é a favor da instalação de mais câmeras de segurança?', status: 'ativa', data_inicio: today, data_fim: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], created_by: userId },
        ]);

        // ==========================================
        // ASSEMBLEIAS (2)
        // ==========================================
        await supabaseAdmin.from('assemblies').insert([
            { condo_id: condoId, titulo: 'Assembleia Geral Ordinária', descricao: 'Prestação de contas anual e eleição do novo síndico.', tipo: 'ordinaria', status: 'agendada', data_realizacao: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), local: 'Salão de Festas', created_by: userId },
            { condo_id: condoId, titulo: 'Aprovação da Reforma da Fachada', descricao: 'Discussão e votação sobre a reforma da fachada do prédio.', tipo: 'extraordinaria', status: 'agendada', data_realizacao: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString(), local: 'Salão de Festas', created_by: userId },
        ]);

        // ==========================================
        // DOCUMENTOS (3)
        // ==========================================
        await supabaseAdmin.from('documents').insert([
            { condo_id: condoId, titulo: 'Regimento Interno', descricao: 'Regras de convivência e uso das áreas comuns.', categoria: 'regulamento', arquivo_url: '/demo/regimento.pdf', created_by: userId },
            { condo_id: condoId, titulo: 'Convenção do Condomínio', descricao: 'Convenção condominial registrada em cartório.', categoria: 'legal', arquivo_url: '/demo/convencao.pdf', created_by: userId },
            { condo_id: condoId, titulo: 'Ata da Última Assembleia', descricao: 'Ata da assembleia realizada em janeiro.', categoria: 'ata', arquivo_url: '/demo/ata.pdf', created_by: userId },
        ]);

        console.log('[DEMO] Dados de demonstração criados com sucesso!');
    } catch (error: any) {
        console.error('[DEMO] ERRO CRÍTICO ao criar dados:', error);
        console.error('[DEMO] Stack:', error.stack);
        throw error; // Re-throw para o handler principal pegar
    }
}
