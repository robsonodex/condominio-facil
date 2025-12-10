-- ============================================
-- LIMPEZA TOTAL: Remover TODAS as policies duplicadas
-- e criar apenas as 3 essenciais
-- ============================================

-- 1. Dropar TODAS as policies existentes
DROP POLICY IF EXISTS "users_superadmin_all" ON users;
DROP POLICY IF EXISTS "users_sindico_manage" ON users;
DROP POLICY IF EXISTS "Users can see same condo" ON users;
DROP POLICY IF EXISTS "Superadmin full access" ON users;
DROP POLICY IF EXISTS "users_update_own" ON users;
DROP POLICY IF EXISTS "users_read_self" ON users;
DROP POLICY IF EXISTS "users_select_same_condo" ON users;
DROP POLICY IF EXISTS "Users can read own profile" ON users;
DROP POLICY IF EXISTS "Superadmin can see all users" ON users;
DROP POLICY IF EXISTS "Sindico can see condo users" ON users;
DROP POLICY IF EXISTS "Users can see own data" ON users;
DROP POLICY IF EXISTS "Superadmin full access to users" ON users;
DROP POLICY IF EXISTS "Users see same condo users" ON users;
DROP POLICY IF EXISTS "superadmin_all_users" ON users;
DROP POLICY IF EXISTS "sindico_manage_condo_users" ON users;

-- 2. Garantir que RLS está ativo
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- 3. Criar APENAS 3 policies simples e claras

-- Policy 1: Usuário pode ver SEU PRÓPRIO perfil (por ID ou EMAIL)
CREATE POLICY "users_own_profile" ON users
    FOR SELECT USING (
        id = auth.uid()
        OR email = (SELECT email FROM auth.users WHERE id = auth.uid())
    );

-- Policy 2: Superadmin pode fazer TUDO
CREATE POLICY "users_superadmin" ON users
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users u 
            WHERE u.id = auth.uid() 
            AND u.role = 'superadmin'
        )
    );

-- Policy 3: Síndico pode gerenciar usuários do SEU condomínio
CREATE POLICY "users_sindico" ON users
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users u 
            WHERE u.id = auth.uid() 
            AND u.role = 'sindico' 
            AND u.condo_id = users.condo_id
            AND u.condo_id IS NOT NULL
        )
    );

-- Policy 4: Usuário pode atualizar seu próprio perfil
CREATE POLICY "users_update_self" ON users
    FOR UPDATE USING (id = auth.uid());

-- Verificar que ficaram apenas 4 policies
SELECT policyname FROM pg_policies WHERE tablename = 'users';
