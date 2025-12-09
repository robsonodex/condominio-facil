-- ============================================
-- BYPASS MANUAL - ACEITE LEGAL + ROLE SUPERADMIN
-- Execute este SQL no Supabase SQL Editor
-- ============================================

-- 1. ALTERAR ROLE PARA SUPERADMIN
-- Isso fará com que você não precise aceitar termos
UPDATE users 
SET role = 'superadmin'
WHERE email = 'contato@nodexsolucoes.com.br';

-- 2. LIMPAR ACEITES ANTIGOS (se existirem)
DELETE FROM legal_acceptances 
WHERE user_id = (SELECT id FROM users WHERE email = 'contato@nodexsolucoes.com.br');

-- 3. REGISTRAR ACEITE LEGAL (BACKUP)
INSERT INTO legal_acceptances (
    user_id,
    email,
    document_type,
    document_version,
    document_hash,
    ip_address,
    accepted_at
)
SELECT 
    id as user_id,
    email,
    'termos_uso' as document_type,
    '1.0' as document_version,
    'manual_bypass_admin' as document_hash,
    '127.0.0.1' as ip_address,
    NOW() as accepted_at
FROM users 
WHERE email = 'contato@nodexsolucoes.com.br';

INSERT INTO legal_acceptances (
    user_id,
    email,
    document_type,
    document_version,
    document_hash,
    ip_address,
    accepted_at
)
SELECT 
    id as user_id,
    email,
    'politica_privacidade' as document_type,
    '1.0' as document_version,
    'manual_bypass_admin' as document_hash,
    '127.0.0.1' as ip_address,
    NOW() as accepted_at
FROM users 
WHERE email = 'contato@nodexsolucoes.com.br';

INSERT INTO legal_acceptances (
    user_id,
    email,
    document_type,
    document_version,
    document_hash,
    ip_address,
    accepted_at
)
SELECT 
    id as user_id,
    email,
    'contrato_plano' as document_type,
    '1.0' as document_version,
    'manual_bypass_admin' as document_hash,
    '127.0.0.1' as ip_address,
    NOW() as accepted_at
FROM users 
WHERE email = 'contato@nodexsolucoes.com.br';

INSERT INTO legal_acceptances (
    user_id,
    email,
    document_type,
    document_version,
    document_hash,
    ip_address,
    accepted_at
)
SELECT 
    id as user_id,
    email,
    'politica_cobranca' as document_type,
    '1.0' as document_version,
    'manual_bypass_admin' as document_hash,
    '127.0.0.1' as ip_address,
    NOW() as accepted_at
FROM users 
WHERE email = 'contato@nodexsolucoes.com.br';

-- 4. VERIFICAR RESULTADO
SELECT 
    email,
    role,
    (SELECT COUNT(*) FROM legal_acceptances WHERE user_id = users.id) as aceites_count
FROM users 
WHERE email = 'contato@nodexsolucoes.com.br';

-- ============================================
-- RESULTADO ESPERADO:
-- email: contato@nodexsolucoes.com.br
-- role: superadmin
-- aceites_count: 4
-- ============================================
