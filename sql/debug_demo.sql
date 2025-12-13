-- =====================================================
-- DIAGNÓSTICO: Por que o síndico demo não vê dados?
-- =====================================================

-- 1. Verificar se o usuário está vinculado ao condomínio correto
SELECT 
    u.id,
    u.email,
    u.nome,
    u.role,
    u.condo_id,
    c.nome as condominio_nome
FROM users u
LEFT JOIN condos c ON c.id = u.condo_id
WHERE u.email = 'sindico.demo@jardimatlântico.com.br';

-- 2. Verificar se o condomínio demo existe
SELECT * FROM condos WHERE id = '00000000-0000-0000-0000-000000000001';

-- 3. Contar dados do condomínio demo
SELECT 
    'units' as tabela,
    COUNT(*) as total
FROM units WHERE condo_id = '00000000-0000-0000-0000-000000000001'
UNION ALL
SELECT 'users', COUNT(*) FROM users WHERE condo_id = '00000000-0000-0000-0000-000000000001'
UNION ALL
SELECT 'financial_entries', COUNT(*) FROM financial_entries WHERE condo_id = '00000000-0000-0000-0000-000000000001'
UNION ALL
SELECT 'notices', COUNT(*) FROM notices WHERE condo_id = '00000000-0000-0000-0000-000000000001'
UNION ALL
SELECT 'occurrences', COUNT(*) FROM occurrences WHERE condo_id = '00000000-0000-0000-0000-000000000001'
UNION ALL
SELECT 'visitors', COUNT(*) FROM visitors WHERE condo_id = '00000000-0000-0000-0000-000000000001'
UNION ALL
SELECT 'reservations', COUNT(*) FROM reservations WHERE condo_id = '00000000-0000-0000-0000-000000000001';

-- =====================================================
-- SOLUÇÃO: Garantir que o usuário está vinculado
-- =====================================================

UPDATE users 
SET 
    condo_id = '00000000-0000-0000-0000-000000000001',
    role = 'sindico',
    ativo = true
WHERE email = 'sindico.demo@jardimatlântico.com.br';

-- Verificar novamente
SELECT 
    u.id,
    u.email,
    u.nome,
    u.role,
    u.condo_id,
    u.ativo,
    c.nome as condominio
FROM users u
LEFT JOIN condos c ON c.id = u.condo_id
WHERE u.email = 'sindico.demo@jardimatlântico.com.br';
