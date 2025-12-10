-- ============================================
-- FIX: Permitir usuário buscar próprio perfil por EMAIL
-- Problema: frontend busca por email, RLS só permitia por id
-- ============================================

-- Dropar policies antigas
DROP POLICY IF EXISTS "users_read_self" ON users;

-- Recriar policy que permite buscar por ID ou pelo próprio EMAIL
-- Usamos uma subquery para verificar se o email corresponde ao usuário logado
CREATE POLICY "users_read_self" ON users
    FOR SELECT USING (
        id = auth.uid()
        OR email = (SELECT email FROM auth.users WHERE id = auth.uid())
    );
