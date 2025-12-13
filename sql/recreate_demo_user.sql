-- =====================================================
-- SOLUÇÃO DEFINITIVA: Recriar usuário demo do zero
-- =====================================================

-- PASSO 1: Limpar tudo relacionado ao usuário antigo
-- ----------------------------------------------------

-- Atualizar todas as referências para um UUID temporário
UPDATE financial_entries SET created_by = '00000000-0000-0000-0000-000000000999' WHERE created_by = '00000000-0000-0000-0000-000000001001';
UPDATE notices SET created_by = '00000000-0000-0000-0000-000000000999' WHERE created_by = '00000000-0000-0000-0000-000000001001';
UPDATE occurrences SET criado_por_user_id = '00000000-0000-0000-0000-000000000999' WHERE criado_por_user_id = '00000000-0000-0000-0000-000000001001';
UPDATE reservations SET user_id = '00000000-0000-0000-0000-000000000999' WHERE user_id = '00000000-0000-0000-0000-000000001001';
UPDATE reservations SET aprovado_por = '00000000-0000-0000-0000-000000000999' WHERE aprovado_por = '00000000-0000-0000-0000-000000001001';
UPDATE visitors SET registrado_por_user_id = '00000000-0000-0000-0000-000000000999' WHERE registrado_por_user_id = '00000000-0000-0000-0000-000000001001';
UPDATE assembleias SET created_by = '00000000-0000-0000-0000-000000000999' WHERE created_by = '00000000-0000-0000-0000-000000001001';
UPDATE enquetes SET created_by = '00000000-0000-0000-0000-000000000999' WHERE created_by = '00000000-0000-0000-0000-000000001001';
UPDATE governance_documents SET uploaded_by = '00000000-0000-0000-0000-000000000999' WHERE uploaded_by = '00000000-0000-0000-0000-000000001001';
UPDATE resident_invoices SET created_by = '00000000-0000-0000-0000-000000000999' WHERE created_by = '00000000-0000-0000-0000-000000001001';
UPDATE deliveries SET created_by = '00000000-0000-0000-0000-000000000999' WHERE created_by = '00000000-0000-0000-0000-000000001001';

-- Deletar usuário antigo
DELETE FROM users WHERE id = '00000000-0000-0000-0000-000000001001';

-- PASSO 2: Agora vá no Supabase Dashboard
-- ----------------------------------------------------
-- 1. Authentication > Users
-- 2. Delete o usuário sindico.demo@jardimatlantico.com.br se existir
-- 3. Clique "Add user" > "Create new user"
-- 4. Email: demo@condofacil.com
-- 5. Password: demo2024
-- 6. ✅ Auto Confirm User
-- 7. COPIE o UUID gerado
-- 8. Cole o UUID abaixo e execute o PASSO 3

-- PASSO 3: Criar usuário na tabela users com o UUID copiado
-- ----------------------------------------------------
-- SUBSTITUA 'UUID_COPIADO_AQUI' pelo UUID que você copiou

INSERT INTO users (id, email, nome, telefone, role, condo_id, ativo, created_at)
VALUES (
    'UUID_COPIADO_AQUI'::uuid,  -- ⚠️ COLE O UUID AQUI
    'demo@condofacil.com',
    'Ricardo Mendes Figueiredo',
    '(21) 99876-5432',
    'sindico',
    '00000000-0000-0000-0000-000000000001',
    true,
    NOW()
);

-- PASSO 4: Atualizar referências para o novo UUID
-- ----------------------------------------------------
-- SUBSTITUA 'UUID_COPIADO_AQUI' pelo mesmo UUID

UPDATE financial_entries SET created_by = 'UUID_COPIADO_AQUI'::uuid WHERE created_by = '00000000-0000-0000-0000-000000000999';
UPDATE notices SET created_by = 'UUID_COPIADO_AQUI'::uuid WHERE created_by = '00000000-0000-0000-0000-000000000999';
UPDATE occurrences SET criado_por_user_id = 'UUID_COPIADO_AQUI'::uuid WHERE criado_por_user_id = '00000000-0000-0000-0000-000000000999';
UPDATE reservations SET user_id = 'UUID_COPIADO_AQUI'::uuid WHERE user_id = '00000000-0000-0000-0000-000000000999';
UPDATE reservations SET aprovado_por = 'UUID_COPIADO_AQUI'::uuid WHERE aprovado_por = '00000000-0000-0000-0000-000000000999';
UPDATE visitors SET registrado_por_user_id = 'UUID_COPIADO_AQUI'::uuid WHERE registrado_por_user_id = '00000000-0000-0000-0000-000000000999';
UPDATE assembleias SET created_by = 'UUID_COPIADO_AQUI'::uuid WHERE created_by = '00000000-0000-0000-0000-000000000999';
UPDATE enquetes SET created_by = 'UUID_COPIADO_AQUI'::uuid WHERE created_by = '00000000-0000-0000-0000-000000000999';
UPDATE governance_documents SET uploaded_by = 'UUID_COPIADO_AQUI'::uuid WHERE uploaded_by = '00000000-0000-0000-0000-000000000999';
UPDATE resident_invoices SET created_by = 'UUID_COPIADO_AQUI'::uuid WHERE created_by = '00000000-0000-0000-0000-000000000999';
UPDATE deliveries SET created_by = 'UUID_COPIADO_AQUI'::uuid WHERE created_by = '00000000-0000-0000-0000-000000000999';

-- PASSO 5: Verificar
-- ----------------------------------------------------
SELECT 
    u.id,
    u.email,
    u.nome,
    u.role,
    c.nome as condominio
FROM users u
LEFT JOIN condos c ON c.id = u.condo_id
WHERE u.email = 'demo@condofacil.com';

-- =====================================================
-- CREDENCIAIS FINAIS
-- =====================================================
-- Email: demo@condofacil.com
-- Senha: demo2024
-- =====================================================
