-- =====================================================
-- CORRIGIR EMAIL DO USUÁRIO DEMO (sem acentos)
-- =====================================================

-- Atualizar email para versão sem acento
UPDATE users 
SET email = 'sindico.demo@jardimatlantico.com.br'
WHERE id = '00000000-0000-0000-0000-000000001001';

-- Atualizar também no auth.users
UPDATE auth.users 
SET email = 'sindico.demo@jardimatlantico.com.br'
WHERE id = '00000000-0000-0000-0000-000000001001';

-- Verificar
SELECT id, email, nome FROM users WHERE id = '00000000-0000-0000-0000-000000001001';
SELECT id, email FROM auth.users WHERE id = '00000000-0000-0000-0000-000000001001';

-- =====================================================
-- NOVAS CREDENCIAIS (SEM ACENTO)
-- =====================================================
-- Email: sindico.demo@jardimatlantico.com.br
-- Senha: demo2024
-- =====================================================
