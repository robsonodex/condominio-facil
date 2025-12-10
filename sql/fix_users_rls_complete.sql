-- ============================================
-- FIX COMPLETO: Corrigir RLS da tabela users
-- Problema: policies podem estar causando recursão ou bloqueio
-- ============================================

-- 1. Desativar RLS temporariamente para limpar policies
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- 2. Dropar TODAS as policies existentes na tabela users
DROP POLICY IF EXISTS "users_view_self" ON users;
DROP POLICY IF EXISTS "superadmin_all_users" ON users;
DROP POLICY IF EXISTS "sindico_manage_condo_users" ON users;
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "users_select_own" ON users;
DROP POLICY IF EXISTS "Allow users to read their own data" ON users;

-- 3. Recriar função is_superadmin com SECURITY DEFINER
CREATE OR REPLACE FUNCTION is_superadmin()
RETURNS BOOLEAN AS $$
DECLARE
    user_role TEXT;
BEGIN
    -- Busca direta sem usar RLS (SECURITY DEFINER executa como owner)
    SELECT role INTO user_role
    FROM public.users 
    WHERE id = auth.uid() 
    AND ativo = true;
    
    RETURN user_role = 'superadmin';
EXCEPTION WHEN OTHERS THEN
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Reativar RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- 5. Criar policies limpas e simples

-- Policy 1: Usuário pode ver seu próprio perfil
CREATE POLICY "users_read_self" ON users
    FOR SELECT USING (id = auth.uid());

-- Policy 2: Superadmin pode fazer tudo
CREATE POLICY "users_superadmin_all" ON users
    FOR ALL USING (is_superadmin());

-- Policy 3: Síndico pode gerenciar usuários do seu condomínio
CREATE POLICY "users_sindico_manage" ON users
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users u 
            WHERE u.id = auth.uid() 
            AND u.role = 'sindico' 
            AND u.condo_id = users.condo_id
            AND u.condo_id IS NOT NULL
        )
    );

-- 6. Verificar a função is_superadmin
SELECT is_superadmin();
