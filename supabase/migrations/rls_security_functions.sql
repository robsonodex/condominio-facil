-- =============================================
-- RLS Security Functions - SECURITY DEFINER
-- Criado em: 2025-12-09
-- Objetivo: Evitar recursão RLS em policies que consultam tabela users
-- =============================================

-- =============================================
-- 1. FUNÇÃO: Verificar se usuário autenticado é superadmin
-- =============================================
CREATE OR REPLACE FUNCTION is_superadmin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() AND role = 'superadmin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

COMMENT ON FUNCTION is_superadmin IS 'Verifica se o usuário autenticado (auth.uid()) tem role = superadmin. SECURITY DEFINER evita recursão RLS.';

-- =============================================
-- 2. FUNÇÃO: Retornar condo_id do usuário autenticado
-- =============================================
CREATE OR REPLACE FUNCTION user_condo_id()
RETURNS UUID AS $$
BEGIN
  RETURN (SELECT condo_id FROM public.users WHERE id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

COMMENT ON FUNCTION user_condo_id IS 'Retorna o condo_id do usuário autenticado. SECURITY DEFINER evita recursão RLS.';

-- =============================================
-- 3. FUNÇÃO: Retornar role do usuário autenticado
-- =============================================
CREATE OR REPLACE FUNCTION user_role()
RETURNS TEXT AS $$
BEGIN
  RETURN (SELECT role FROM public.users WHERE id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

COMMENT ON FUNCTION user_role IS 'Retorna a role do usuário autenticado. SECURITY DEFINER evita recursão RLS.';

-- =============================================
-- 4. FUNÇÃO: Retornar unidade_id do usuário autenticado
-- =============================================
CREATE OR REPLACE FUNCTION user_unidade_id()
RETURNS UUID AS $$
BEGIN
  RETURN (SELECT unidade_id FROM public.users WHERE id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

COMMENT ON FUNCTION user_unidade_id IS 'Retorna a unidade_id do usuário autenticado. SECURITY DEFINER evita recursão RLS.';

-- =============================================
-- 5. FUNÇÃO: Verificar se usuário pertence a um condo específico
-- =============================================
CREATE OR REPLACE FUNCTION user_belongs_to_condo(p_condo_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() AND condo_id = p_condo_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

COMMENT ON FUNCTION user_belongs_to_condo IS 'Verifica se o usuário autenticado pertence ao condo especificado. SECURITY DEFINER evita recursão RLS.';

-- =============================================
-- 6. FUNÇÃO: Verificar se usuário tem uma das roles permitidas
-- =============================================
CREATE OR REPLACE FUNCTION user_has_role(p_roles TEXT[])
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() AND role = ANY(p_roles)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

COMMENT ON FUNCTION user_has_role IS 'Verifica se o usuário autenticado tem uma das roles especificadas no array. SECURITY DEFINER evita recursão RLS.';

-- =============================================
-- GRANTS: Permitir execução pública (RLS policies)
-- =============================================
GRANT EXECUTE ON FUNCTION is_superadmin() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION user_condo_id() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION user_role() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION user_unidade_id() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION user_belongs_to_condo(UUID) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION user_has_role(TEXT[]) TO authenticated, anon;

-- =============================================
-- FIM - Functions criadas com sucesso
-- =============================================
