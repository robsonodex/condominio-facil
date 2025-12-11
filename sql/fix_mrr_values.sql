-- =============================================
-- Script para preencher valor_mensal_cobrado nas assinaturas
-- Execute este script no SQL Editor do Supabase
-- =============================================

-- 1. Verificar assinaturas sem valor definido
SELECT 
    s.id,
    s.status,
    s.valor_mensal_cobrado,
    p.nome_plano,
    p.valor_mensal AS valor_do_plano,
    c.nome AS condo_nome
FROM subscriptions s
JOIN plans p ON s.plano_id = p.id
JOIN condos c ON s.condo_id = c.id
WHERE s.valor_mensal_cobrado IS NULL OR s.valor_mensal_cobrado = 0;

-- 2. Atualizar assinaturas para usar o valor do plano
UPDATE subscriptions s
SET valor_mensal_cobrado = p.valor_mensal
FROM plans p
WHERE s.plano_id = p.id
AND (s.valor_mensal_cobrado IS NULL OR s.valor_mensal_cobrado = 0);

-- 3. Verificar resultado
SELECT 
    s.id,
    s.status,
    s.valor_mensal_cobrado,
    p.nome_plano,
    c.nome AS condo_nome
FROM subscriptions s
JOIN plans p ON s.plano_id = p.id
JOIN condos c ON s.condo_id = c.id
ORDER BY s.created_at DESC;

-- 4. Verificar MRR total
SELECT 
    SUM(valor_mensal_cobrado) AS mrr_total,
    COUNT(*) AS total_assinaturas_ativas
FROM subscriptions
WHERE status = 'ativo';
