-- SOLUÇÃO SIMPLES: Deletar usuário antigo e inserir o novo

-- 1. Deletar usuário antigo (CASCADE vai deletar as referências)
DELETE FROM users WHERE id = '00000000-0000-0000-0000-000000001001';

-- 2. Inserir novo usuário com o UUID do auth
INSERT INTO users (id, email, nome, telefone, role, condo_id, ativo, created_at)
VALUES (
    'e4b89c3d-34d7-4396-9002-6da8fba8b84e',
    'demo@condofacil.com',
    'Ricardo Mendes Figueiredo',
    '(21) 99876-5432',
    'sindico',
    '00000000-0000-0000-0000-000000000001',
    true,
    NOW()
);

-- 3. Verificar
SELECT id, email, nome, role, condo_id FROM users WHERE email = 'demo@condofacil.com';
