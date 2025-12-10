-- Corrigir RLS policy para usuários possam ver seu próprio perfil pelo email
-- Executar no Supabase SQL Editor

-- Atualizar policy para permitir que usuário veja seu próprio perfil pelo email também
DROP POLICY IF EXISTS "users_view_self" ON users;
CREATE POLICY "users_view_self" ON users
    FOR SELECT USING (
        id = auth.uid() 
        OR email = auth.email() 
        OR is_superadmin()
    );
