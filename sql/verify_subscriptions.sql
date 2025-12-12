-- Script para verificar e corrigir problemas na página de Assinatura
-- Execute este script no Supabase SQL Editor

-- 1. Verificar se existem assinaturas cadastradas
SELECT 
    s.id,
    s.condo_id,
    c.nome as condo_nome,
    s.status,
    s.data_inicio,
    s.data_fim,
    s.valor_mensal_cobrado,
    p.nome_plano,
    p.valor_mensal
FROM subscriptions s
LEFT JOIN condos c ON c.id = s.condo_id
LEFT JOIN plans p ON p.id = s.plano_id
ORDER BY s.created_at DESC
LIMIT 20;

-- 2. Verificar políticas RLS da tabela subscriptions
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'subscriptions';

-- 3. Se não houver assinaturas, criar uma assinatura de teste para cada condomínio
-- ATENÇÃO: Execute apenas se necessário!
/*
INSERT INTO subscriptions (condo_id, plano_id, status, data_inicio, data_fim, valor_mensal_cobrado)
SELECT 
    c.id as condo_id,
    (SELECT id FROM plans WHERE nome_plano = 'Básico' LIMIT 1) as plano_id,
    'teste' as status,
    CURRENT_DATE as data_inicio,
    CURRENT_DATE + INTERVAL '30 days' as data_fim,
    49.90 as valor_mensal_cobrado
FROM condos c
WHERE NOT EXISTS (
    SELECT 1 FROM subscriptions s WHERE s.condo_id = c.id
);
*/

-- 4. Verificar se a tabela plans tem dados
SELECT id, nome_plano, valor_mensal, descricao
FROM plans
ORDER BY valor_mensal;

-- 5. Criar política RLS se não existir (para sindico ver sua própria assinatura)
DO $$
BEGIN
    -- Drop existing policy if exists
    DROP POLICY IF EXISTS "Sindicos podem ver assinatura do proprio condo" ON subscriptions;
    
    -- Create new policy
    CREATE POLICY "Sindicos podem ver assinatura do proprio condo"
    ON subscriptions
    FOR SELECT
    TO authenticated
    USING (
        condo_id IN (
            SELECT condo_id 
            FROM users 
            WHERE id = auth.uid()
        )
    );
END $$;

-- 6. Verificar se usuários têm condo_id preenchido
SELECT 
    u.id,
    u.nome,
    u.email,
    u.role,
    u.condo_id,
    c.nome as condo_nome
FROM users u
LEFT JOIN condos c ON c.id = u.condo_id
WHERE u.role IN ('sindico', 'superadmin')
ORDER BY u.created_at DESC
LIMIT 20;
