-- ============================================
-- FIX DEFINITIVO: Resolver recursão infinita em RLS
-- O problema: policies que fazem SELECT na tabela users causam loop
-- Solução: usar funções SECURITY DEFINER que bypassam RLS
-- ============================================

-- 1. Dropar TODAS as policies existentes
DROP POLICY IF EXISTS "users_own_profile" ON users;
DROP POLICY IF EXISTS "users_superadmin" ON users;
DROP POLICY IF EXISTS "users_sindico" ON users;
DROP POLICY IF EXISTS "users_update_self" ON users;
DROP POLICY IF EXISTS "users_superadmin_all" ON users;
DROP POLICY IF EXISTS "users_sindico_manage" ON users;
DROP POLICY IF EXISTS "users_read_self" ON users;

-- 2. Criar função para obter o role do usuário (SECURITY DEFINER bypassa RLS)
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
DECLARE
    user_role TEXT;
BEGIN
    SELECT role INTO user_role
    FROM public.users
    WHERE id = auth.uid()
    AND ativo = true;
    RETURN user_role;
EXCEPTION WHEN OTHERS THEN
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- 3. Criar função para obter o condo_id do usuário
CREATE OR REPLACE FUNCTION get_user_condo_id()
RETURNS UUID AS $$
DECLARE
    user_condo UUID;
BEGIN
    SELECT condo_id INTO user_condo
    FROM public.users
    WHERE id = auth.uid()
    AND ativo = true;
    RETURN user_condo;
EXCEPTION WHEN OTHERS THEN
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- 4. Recriar função is_superadmin se não existir
CREATE OR REPLACE FUNCTION is_superadmin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN get_user_role() = 'superadmin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- 5. Criar função is_sindico
CREATE OR REPLACE FUNCTION is_sindico()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN get_user_role() = 'sindico';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- 6. Garantir RLS ativo
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- 7. Criar policies SEM recursão (usando funções)

-- Policy 1: Usuário pode ver seu próprio perfil
CREATE POLICY "users_own_profile" ON users
    FOR SELECT USING (id = auth.uid());

-- Policy 2: Superadmin pode fazer tudo
CREATE POLICY "users_superadmin" ON users
    FOR ALL USING (is_superadmin());

-- Policy 3: Síndico pode gerenciar usuários do seu condomínio
CREATE POLICY "users_sindico" ON users
    FOR ALL USING (
        is_sindico() 
        AND condo_id = get_user_condo_id()
        AND condo_id IS NOT NULL
    );

-- Policy 4: Usuário pode atualizar seu próprio perfil
CREATE POLICY "users_update_self" ON users
    FOR UPDATE USING (id = auth.uid());

-- 8. Verificar resultado
SELECT policyname FROM pg_policies WHERE tablename = 'users';
