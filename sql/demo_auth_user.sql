-- =====================================================
-- CRIAR USUÁRIO DEMO NO SUPABASE AUTH
-- Execute este SQL no Supabase SQL Editor
-- =====================================================

-- Este script cria o usuário de autenticação para o síndico demo
-- permitindo login direto sem precisar de impersonation

-- 1. Criar usuário no auth.users (Supabase Auth)
-- IMPORTANTE: Substitua 'YOUR_DEMO_PASSWORD' por uma senha real
INSERT INTO auth.users (
    id,
    instance_id,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
) VALUES (
    '00000000-0000-0000-0000-000000001001'::uuid,
    '00000000-0000-0000-0000-000000000000'::uuid,
    'sindico.demo@jardimatlântico.com.br',
    crypt('demo2024', gen_salt('bf')), -- Senha: demo2024
    NOW(),
    '{"provider": "email", "providers": ["email"]}'::jsonb,
    '{"nome": "Ricardo Mendes Figueiredo"}'::jsonb,
    NOW(),
    NOW(),
    '',
    '',
    '',
    ''
) ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    encrypted_password = EXCLUDED.encrypted_password,
    email_confirmed_at = EXCLUDED.email_confirmed_at,
    updated_at = NOW();

-- 2. Criar entrada correspondente em auth.identities
INSERT INTO auth.identities (
    id,
    user_id,
    provider_id,
    identity_data,
    provider,
    last_sign_in_at,
    created_at,
    updated_at
) VALUES (
    gen_random_uuid(),
    '00000000-0000-0000-0000-000000001001'::uuid,
    'sindico.demo@jardimatlântico.com.br',
    jsonb_build_object(
        'sub', '00000000-0000-0000-0000-000000001001',
        'email', 'sindico.demo@jardimatlântico.com.br'
    ),
    'email',
    NOW(),
    NOW(),
    NOW()
) ON CONFLICT (provider, provider_id) DO NOTHING;

-- 3. Garantir que o usuário na tabela users está com o ID correto
UPDATE users 
SET 
    email = 'sindico.demo@jardimatlântico.com.br',
    nome = 'Ricardo Mendes Figueiredo',
    telefone = '(21) 99876-5432',
    role = 'sindico',
    condo_id = '00000000-0000-0000-0000-000000000001',
    ativo = true
WHERE id = '00000000-0000-0000-0000-000000001001';

-- 4. Verificar se foi criado corretamente
SELECT 
    'Usuário Auth' as tipo,
    email,
    email_confirmed_at IS NOT NULL as confirmado,
    created_at
FROM auth.users 
WHERE id = '00000000-0000-0000-0000-000000001001'

UNION ALL

SELECT 
    'Usuário App' as tipo,
    email,
    ativo as confirmado,
    created_at
FROM users 
WHERE id = '00000000-0000-0000-0000-000000001001';

-- =====================================================
-- CREDENCIAIS DE ACESSO DEMO
-- =====================================================
-- Email: sindico.demo@jardimatlântico.com.br
-- Senha: demo2024
-- =====================================================

SELECT '✅ Usuário demo criado com sucesso! Use as credenciais acima para login.' as status;
