-- Dados de exemplo para módulo de Manutenção
-- Execute após rodar maintenance_module.sql

-- Inserir fornecedores de exemplo
INSERT INTO maintenance_suppliers (condo_id, nome, especialidade, telefone, email, rating, total_servicos)
SELECT 
    id,
    'Hidráulica Silva',
    'Encanador',
    '(11) 98765-4321',
    'contato@hidraulicasilva.com',
    4.8,
    15
FROM condos
LIMIT 1;

INSERT INTO maintenance_suppliers (condo_id, nome, especialidade, telefone, email, rating, total_servicos)
SELECT 
    id,
    'Elétrica Luz & Força',
    'Eletricista',
    '(11) 97654-3210',
    'luz@eletrica.com',
    4.5,
    12
FROM condos
LIMIT 1;

INSERT INTO maintenance_suppliers (condo_id, nome, especialidade, telefone, email, rating, total_servicos)
SELECT 
    id,
    'Pinturas Premium',
    'Pintor',
    '(11) 96543-2109',
    'pinturas@premium.com',
    4.2,
    8
FROM condos
LIMIT 1;

-- Inserir ordens de serviço de exemplo
INSERT INTO maintenance_orders (
    condo_id, 
    titulo, 
    descricao, 
    tipo, 
    status, 
    prioridade, 
    local, 
    fornecedor_id,
    data_agendada,
    valor_estimado
)
SELECT 
    c.id,
    'Vazamento Chuv

eiro - Apto 101',
    'Reparo de vazamento no chuveiro do banheiro social',
    'corretiva',
    'agendado',
    'alta',
    'Bloco A - Apto 101',
    s.id,
    NOW() + INTERVAL '2 days',
    250.00
FROM condos c
CROSS JOIN maintenance_suppliers s
WHERE s.especialidade = 'Encanador'
LIMIT 1;

INSERT INTO maintenance_orders (
    condo_id, 
    titulo, 
    descricao, 
    tipo, 
    status, 
    prioridade, 
    local, 
    fornecedor_id,
    data_agendada,
    data_inicio,
    valor_estimado
)
SELECT 
    c.id,
    'Troca de Lâmpadas - Área de Lazer',
    'Substituição de 10 lâmpadas queimadas',
    'preventiva',
    'em_execucao',
    'media',
    'Área de Lazer',
    s.id,
    NOW(),
    NOW(),
    380.00
FROM condos c
CROSS JOIN maintenance_suppliers s
WHERE s.especialidade = 'Eletricista'
LIMIT 1;

INSERT INTO maintenance_orders (
    condo_id, 
    titulo, 
    descricao, 
    tipo, 
    status, 
    prioridade, 
    local, 
    fornecedor_id,
    data_agendada,
    data_inicio,
    data_conclusao,
    valor_estimado,
    valor_realizado
)
SELECT 
    c.id,
    'Pintura da Fachada',
    'Pintura completa da fachada principal',
    'preventiva',
    'concluido',
    'baixa',
    'Fachada Principal',
    s.id,
    NOW() - INTERVAL '10 days',
    NOW() - INTERVAL '8 days',
    NOW() - INTERVAL '2 days',
    5500.00,
    5200.00
FROM condos c
CROSS JOIN maintenance_suppliers s
WHERE s.especialidade = 'Pintor'
LIMIT 1;
