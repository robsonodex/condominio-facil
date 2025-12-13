-- =====================================================
-- ATUALIZAR TODAS AS REFERÊNCIAS PARA O NOVO UUID
-- =====================================================

-- UUID antigo: 00000000-0000-0000-0000-000000001001
-- UUID novo: e4b89c3d-34d7-4396-9002-6da8fba8b84e

-- 1. Atualizar todas as tabelas que referenciam o usuário
-- (Removidas tabelas que não têm essas colunas)
UPDATE notices SET created_by = 'e4b89c3d-34d7-4396-9002-6da8fba8b84e' WHERE created_by = '00000000-0000-0000-0000-000000001001';
UPDATE occurrences SET criado_por_user_id = 'e4b89c3d-34d7-4396-9002-6da8fba8b84e' WHERE criado_por_user_id = '00000000-0000-0000-0000-000000001001';
UPDATE reservations SET user_id = 'e4b89c3d-34d7-4396-9002-6da8fba8b84e' WHERE user_id = '00000000-0000-0000-0000-000000001001';
UPDATE reservations SET aprovado_por = 'e4b89c3d-34d7-4396-9002-6da8fba8b84e' WHERE aprovado_por = '00000000-0000-0000-0000-000000001001';
UPDATE visitors SET registrado_por_user_id = 'e4b89c3d-34d7-4396-9002-6da8fba8b84e' WHERE registrado_por_user_id = '00000000-0000-0000-0000-000000001001';
UPDATE assembleias SET created_by = 'e4b89c3d-34d7-4396-9002-6da8fba8b84e' WHERE created_by = '00000000-0000-0000-0000-000000001001';
UPDATE enquetes SET created_by = 'e4b89c3d-34d7-4396-9002-6da8fba8b84e' WHERE created_by = '00000000-0000-0000-0000-000000001001';
UPDATE governance_documents SET uploaded_by = 'e4b89c3d-34d7-4396-9002-6da8fba8b84e' WHERE uploaded_by = '00000000-0000-0000-0000-000000001001';
UPDATE resident_invoices SET created_by = 'e4b89c3d-34d7-4396-9002-6da8fba8b84e' WHERE created_by = '00000000-0000-0000-0000-000000001001';
UPDATE resident_invoices SET morador_id = 'e4b89c3d-34d7-4396-9002-6da8fba8b84e' WHERE morador_id = '00000000-0000-0000-0000-000000001001';
UPDATE deliveries SET created_by = 'e4b89c3d-34d7-4396-9002-6da8fba8b84e' WHERE created_by = '00000000-0000-0000-0000-000000001001';
UPDATE residents SET user_id = 'e4b89c3d-34d7-4396-9002-6da8fba8b84e' WHERE user_id = '00000000-0000-0000-0000-000000001001';
UPDATE notifications_sent SET sender_id = 'e4b89c3d-34d7-4396-9002-6da8fba8b84e' WHERE sender_id = '00000000-0000-0000-0000-000000001001';

-- 2. Agora atualizar o ID do usuário
UPDATE users 
SET id = 'e4b89c3d-34d7-4396-9002-6da8fba8b84e',
    email = 'demo@condofacil.com'
WHERE id = '00000000-0000-0000-0000-000000001001';

-- 3. Verificar
SELECT 
    u.id,
    u.email,
    u.nome,
    u.role,
    c.nome as condominio
FROM users u
LEFT JOIN condos c ON c.id = u.condo_id
WHERE u.email = 'demo@condofacil.com';

-- 4. Contar dados vinculados
SELECT 
    'financial_entries' as tabela,
    COUNT(*) as total
FROM financial_entries WHERE created_by = 'e4b89c3d-34d7-4396-9002-6da8fba8b84e'
UNION ALL
SELECT 'notices', COUNT(*) FROM notices WHERE created_by = 'e4b89c3d-34d7-4396-9002-6da8fba8b84e'
UNION ALL
SELECT 'occurrences', COUNT(*) FROM occurrences WHERE criado_por_user_id = 'e4b89c3d-34d7-4396-9002-6da8fba8b84e';

-- =====================================================
-- CREDENCIAIS FINAIS
-- =====================================================
-- Email: demo@condofacil.com
-- Senha: demo2024
-- UUID: e4b89c3d-34d7-4396-9002-6da8fba8b84e
-- =====================================================
