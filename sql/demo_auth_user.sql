-- =====================================================
-- MÉTODO SIMPLES: Criar usuário demo manualmente
-- =====================================================

-- PASSO 1: Criar usuário no Supabase Dashboard
-- ----------------------------------------------------
-- 1. Acesse: Supabase Dashboard > Authentication > Users
-- 2. Clique: "Add user" > "Create new user"
-- 3. Preencha:
--    Email: sindico.demo@jardimatlântico.com.br
--    Password: demo2024
--    Auto Confirm User: ✅ MARCAR
-- 4. Clique "Create user"
-- 5. COPIE o ID (UUID) do usuário criado
-- 6. VOLTE AQUI e execute o SQL abaixo

-- PASSO 2: Vincular usuário criado aos dados demo
-- ----------------------------------------------------
-- Cole o UUID copiado na linha abaixo (substitua o exemplo)

UPDATE users 
SET 
    id = 'COLE_O_UUID_AQUI'::uuid,  -- ⚠️ SUBSTITUA pelo UUID copiado
    email = 'sindico.demo@jardimatlântico.com.br',
    nome = 'Ricardo Mendes Figueiredo',
    telefone = '(21) 99876-5432',
    role = 'sindico',
    condo_id = '00000000-0000-0000-0000-000000000001',
    ativo = true
WHERE id = '00000000-0000-0000-0000-000000001001';

-- Ou se preferir, delete o antigo e insira com o novo UUID:
-- DELETE FROM users WHERE id = '00000000-0000-0000-0000-000000001001';
-- 
-- INSERT INTO users (id, email, nome, telefone, role, condo_id, ativo)
-- VALUES (
--     'COLE_O_UUID_AQUI'::uuid,
--     'sindico.demo@jardimatlântico.com.br',
--     'Ricardo Mendes Figueiredo',
--     '(21) 99876-5432',
--     'sindico',
--     '00000000-0000-0000-0000-000000000001',
--     true
-- );

-- PASSO 3: Verificar
-- ----------------------------------------------------
SELECT 
    u.id,
    u.email,
    u.nome,
    u.role,
    c.nome as condominio
FROM users u
LEFT JOIN condos c ON c.id = u.condo_id
WHERE u.email = 'sindico.demo@jardimatlântico.com.br';

-- =====================================================
-- CREDENCIAIS DE LOGIN
-- =====================================================
-- Email: sindico.demo@jardimatlântico.com.br
-- Senha: demo2024
-- =====================================================
