-- ==========================================================
-- SCRIPT DE AUDITORIA COMPLETA DO BANCO DE DADOS
-- Projeto: Meu Condomínio Fácil
-- Objetivo: Extrair metadados, estrutura e estatísticas de uso
-- ==========================================================

-- 1. LISTAR TODAS AS TABELAS E NÚMERO DE REGISTROS (Aproximado)
-- Útil para ter uma visão geral do volume de dados
SELECT 
    schemaname as esquema, 
    relname as tabela, 
    n_live_tup as total_registros 
FROM 
    pg_stat_user_tables 
WHERE 
    schemaname = 'public'
ORDER BY 
    n_live_tup DESC;


-- 2. LISTAR TODAS AS COLUNAS, TIPOS E CONSTRAINTS
-- O "DNA" do banco de dados
SELECT 
    table_name as tabela, 
    column_name as coluna, 
    data_type as tipo_dado, 
    is_nullable as aceita_nulo,
    column_default as valor_padrao
FROM 
    information_schema.columns 
WHERE 
    table_schema = 'public' 
ORDER BY 
    table_name, ordinal_position;


-- 3. LISTAR TODAS AS CHAVES ESTRANGEIRAS (RELACIONAMENTOS)
SELECT
    tc.table_name AS tabela_origem, 
    kcu.column_name AS coluna_origem, 
    ccu.table_name AS tabela_destino,
    ccu.column_name AS coluna_destino 
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_schema = 'public';


-- 4. LISTAR TODAS AS POLÍTICAS DE SEGURANÇA (RLS)
-- Crucial para auditoria de segurança multi-tenant
SELECT 
    schemaname, 
    tablename, 
    policyname, 
    permissive, 
    roles, 
    cmd, 
    qual
FROM 
    pg_policies
WHERE 
    schemaname = 'public';


-- 5. LISTAR EXTENSÕES INSTALADAS
SELECT * FROM pg_extension;


-- 6. TAMANHO DAS TABELAS NO DISCO
SELECT
    relname AS tabela,
    pg_size_pretty(pg_total_relation_size(relid)) AS tamanho_total,
    pg_size_pretty(pg_relation_size(relid)) AS tamanho_dados,
    pg_size_pretty(pg_total_relation_size(relid) - pg_relation_size(relid)) AS tamanho_indices
FROM pg_catalog.pg_statio_user_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(relid) DESC;
