-- Script para popular dados de exemplo nas páginas de Governança
-- Execute este script no Supabase SQL Editor para ver conteúdo nas páginas

-- 1. Criar algumas assembleias de exemplo
INSERT INTO assembleias (condo_id, title, description, start_at, status, created_by)
SELECT 
    c.id as condo_id,
    'Assembleia Ordinária - ' || TO_CHAR(CURRENT_DATE + INTERVAL '7 days', 'MM/YYYY') as title,
    'Discussão sobre melhorias no condomínio e aprovação de contas' as description,
    CURRENT_TIMESTAMP + INTERVAL '7 days' as start_at,
    'agendada' as status,
    u.id as created_by
FROM condos c
CROSS JOIN LATERAL (
    SELECT id FROM users WHERE condo_id = c.id AND role = 'sindico' LIMIT 1
) u
WHERE NOT EXISTS (
    SELECT 1 FROM assembleias WHERE condo_id = c.id
)
LIMIT 5;

-- 2. Criar algumas enquetes de exemplo
INSERT INTO enquetes (condo_id, title, description, options, start_at, end_at, created_by)
SELECT 
    c.id as condo_id,
    'Aprovação de Reforma na Piscina' as title,
    'Votação para aprovar a reforma da área de lazer' as description,
    '[
        {"id": "sim", "label": "Sim, aprovar reforma"},
        {"id": "nao", "label": "Não, manter como está"},
        {"id": "revisar", "label": "Revisar orçamento"}
    ]'::jsonb as options,
    CURRENT_TIMESTAMP as start_at,
    CURRENT_TIMESTAMP + INTERVAL '30 days' as end_at,
    u.id as created_by
FROM condos c
CROSS JOIN LATERAL (
    SELECT id FROM users WHERE condo_id = c.id AND role = 'sindico' LIMIT 1
) u
WHERE NOT EXISTS (
    SELECT 1 FROM enquetes WHERE condo_id = c.id
)
LIMIT 3;

-- Adicionar mais uma enquete
INSERT INTO enquetes (condo_id, title, description, options, start_at, end_at, created_by)
SELECT 
    c.id as condo_id,
    'Horário de Funcionamento da Academia' as title,
    'Qual o melhor horário para funcionamento da academia?' as description,
    '[
        {"id": "6-22", "label": "6h às 22h"},
        {"id": "7-23", "label": "7h às 23h"},
        {"id": "24h", "label": "24 horas"}
    ]'::jsonb as options,
    CURRENT_TIMESTAMP as start_at,
    CURRENT_TIMESTAMP + INTERVAL '15 days' as end_at,
    u.id as created_by
FROM condos c
CROSS JOIN LATERAL (
    SELECT id FROM users WHERE condo_id = c.id AND role = 'sindico' LIMIT 1
) u
WHERE NOT EXISTS (
    SELECT 1 FROM enquetes WHERE condo_id = c.id AND title LIKE '%Academia%'
)
LIMIT 3;

-- 3. Criar alguns documentos de exemplo
INSERT INTO governance_documents (condo_id, name, description, file_url, category, uploaded_by)
SELECT 
    c.id as condo_id,
    'Regimento Interno 2024' as name,
    'Regras e normas do condomínio' as description,
    'https://exemplo.com/regimento.pdf' as file_url,
    'regimento' as category,
    u.id as uploaded_by
FROM condos c
CROSS JOIN LATERAL (
    SELECT id FROM users WHERE condo_id = c.id AND role = 'sindico' LIMIT 1
) u
WHERE NOT EXISTS (
    SELECT 1 FROM governance_documents WHERE condo_id = c.id
)
LIMIT 3;

INSERT INTO governance_documents (condo_id, name, description, file_url, category, uploaded_by)
SELECT 
    c.id as condo_id,
    'Ata da Última Assembleia' as name,
    'Registro da assembleia de aprovação de contas' as description,
    'https://exemplo.com/ata.pdf' as file_url,
    'ata' as category,
    u.id as uploaded_by
FROM condos c
CROSS JOIN LATERAL (
    SELECT id FROM users WHERE condo_id = c.id AND role = 'sindico' LIMIT 1
) u
WHERE NOT EXISTS (
    SELECT 1 FROM governance_documents WHERE condo_id = c.id AND name LIKE '%Ata%'
)
LIMIT 3;

-- Verificar dados criados
SELECT 'Assembleias criadas:' as tipo, COUNT(*) as total FROM assembleias
UNION ALL
SELECT 'Enquetes criadas:', COUNT(*) FROM enquetes
UNION ALL
SELECT 'Documentos criados:', COUNT(*) FROM governance_documents;

-- 4. Criar equipamentos de manutenção de exemplo
INSERT INTO manutencao_equipments (condo_id, name, type, location, status)
SELECT 
    c.id as condo_id,
    'Elevador Social' as name,
    'Elevador' as type,
    'Bloco A' as location,
    'ativo' as status
FROM condos c
WHERE NOT EXISTS (
    SELECT 1 FROM manutencao_equipments WHERE condo_id = c.id
)
LIMIT 5;

INSERT INTO manutencao_equipments (condo_id, name, type, location, status)
SELECT 
    c.id as condo_id,
    'Bomba de Água Principal' as name,
    'Bomba' as type,
    'Casa de Máquinas' as location,
    'ativo' as status
FROM condos c
WHERE NOT EXISTS (
    SELECT 1 FROM manutencao_equipments WHERE condo_id = c.id AND type = 'Bomba'
)
LIMIT 5;

INSERT INTO manutencao_equipments (condo_id, name, type, location, status)
SELECT 
    c.id as condo_id,
    'Portão Automático Principal' as name,
    'Portão' as type,
    'Entrada Principal' as location,
    'ativo' as status
FROM condos c
WHERE NOT EXISTS (
    SELECT 1 FROM manutencao_equipments WHERE condo_id = c.id AND type = 'Portão'
)
LIMIT 5;

-- 5. Criar agendamentos de manutenção
INSERT INTO manutencao_schedule (equipment_id, next_date, frequency, description)
SELECT 
    e.id as equipment_id,
    CURRENT_DATE + INTERVAL '15 days' as next_date,
    'monthly' as frequency,
    'Manutenção preventiva mensal' as description
FROM manutencao_equipments e
WHERE NOT EXISTS (
    SELECT 1 FROM manutencao_schedule WHERE equipment_id = e.id
)
LIMIT 10;

-- Verificar TODOS os dados criados
SELECT 'Assembleias criadas:' as tipo, COUNT(*) as total FROM assembleias
UNION ALL
SELECT 'Enquetes criadas:', COUNT(*) FROM enquetes
UNION ALL
SELECT 'Documentos criados:', COUNT(*) FROM governance_documents
UNION ALL
SELECT 'Equipamentos criados:', COUNT(*) FROM manutencao_equipments
UNION ALL
SELECT 'Agendamentos criados:', COUNT(*) FROM manutencao_schedule;
