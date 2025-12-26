-- ===========================================
-- DIAGNOSTICO: VER ESTRUTURA COMPLETA DO BANCO
-- Execute no SQL Editor do Supabase
-- ===========================================

-- 1. LISTAR TODAS AS TABELAS COM SUAS COLUNAS
SELECT 
    t.table_name,
    c.column_name,
    c.data_type,
    c.is_nullable,
    c.column_default
FROM information_schema.tables t
LEFT JOIN information_schema.columns c 
    ON t.table_name = c.table_name 
    AND t.table_schema = c.table_schema
WHERE t.table_schema = 'public' 
AND t.table_type = 'BASE TABLE'
ORDER BY t.table_name, c.ordinal_position;

-- ===========================================
-- 2. VER STATUS DE RLS EM TODAS AS TABELAS
-- ===========================================
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- ===========================================
-- 3. VER TODAS AS POLICIES DE RLS
-- ===========================================
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- ===========================================
-- 4. RESUMO: TABELAS COM E SEM RLS
-- ===========================================
SELECT 
    tablename,
    CASE WHEN rowsecurity THEN '✅ RLS Ativo' ELSE '❌ RLS Desabilitado' END as status_rls,
    (SELECT COUNT(*) FROM pg_policies WHERE pg_policies.tablename = pg_tables.tablename) as total_policies
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY rowsecurity, tablename;

-- ===========================================
-- 5. ESTRUTURA ESPECÍFICA DAS TABELAS COM PROBLEMA
-- ===========================================

-- support_chats
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'support_chats' AND table_schema = 'public'
ORDER BY ordinal_position;

-- chat_messages
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'chat_messages' AND table_schema = 'public'
ORDER BY ordinal_position;

-- notifications
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'notifications' AND table_schema = 'public'
ORDER BY ordinal_position;

-- turbo_entries
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'turbo_entries' AND table_schema = 'public'
ORDER BY ordinal_position;

-- governanca_enquetes
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'governanca_enquetes' AND table_schema = 'public'
ORDER BY ordinal_position;

-- occurrence_comments
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'occurrence_comments' AND table_schema = 'public'
ORDER BY ordinal_position;
