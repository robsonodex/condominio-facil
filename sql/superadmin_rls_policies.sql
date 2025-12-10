-- ============================================
-- RLS POLICIES: SUPERADMIN FULL ACCESS
-- Execute este script no Supabase SQL Editor
-- ============================================

-- POLÍTICA GERAL: SUPERADMIN tem acesso TOTAL a todas as tabelas
-- Isso funciona verificando se o usuário logado tem role = 'superadmin'

-- Função helper para verificar se é superadmin
CREATE OR REPLACE FUNCTION is_superadmin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.users 
        WHERE id = auth.uid() 
        AND role = 'superadmin'
        AND ativo = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- USERS TABLE
-- ============================================
DROP POLICY IF EXISTS "superadmin_all_users" ON users;
CREATE POLICY "superadmin_all_users" ON users
    FOR ALL USING (is_superadmin());

DROP POLICY IF EXISTS "users_view_self" ON users;
CREATE POLICY "users_view_self" ON users
    FOR SELECT USING (id = auth.uid() OR is_superadmin());

DROP POLICY IF EXISTS "sindico_manage_condo_users" ON users;
CREATE POLICY "sindico_manage_condo_users" ON users
    FOR ALL USING (
        is_superadmin() OR
        (EXISTS (
            SELECT 1 FROM users u 
            WHERE u.id = auth.uid() 
            AND u.role = 'sindico' 
            AND u.condo_id = users.condo_id
        ))
    );

-- ============================================
-- CONDOS TABLE
-- ============================================
DROP POLICY IF EXISTS "superadmin_all_condos" ON condos;
CREATE POLICY "superadmin_all_condos" ON condos
    FOR ALL USING (is_superadmin());

DROP POLICY IF EXISTS "users_view_own_condo" ON condos;
CREATE POLICY "users_view_own_condo" ON condos
    FOR SELECT USING (
        is_superadmin() OR
        id IN (SELECT condo_id FROM users WHERE id = auth.uid())
    );

-- ============================================
-- UNITS TABLE
-- ============================================
DROP POLICY IF EXISTS "superadmin_all_units" ON units;
CREATE POLICY "superadmin_all_units" ON units
    FOR ALL USING (is_superadmin());

DROP POLICY IF EXISTS "condo_members_view_units" ON units;
CREATE POLICY "condo_members_view_units" ON units
    FOR SELECT USING (
        is_superadmin() OR
        condo_id IN (SELECT condo_id FROM users WHERE id = auth.uid())
    );

DROP POLICY IF EXISTS "sindico_manage_units" ON units;
CREATE POLICY "sindico_manage_units" ON units
    FOR ALL USING (
        is_superadmin() OR
        (EXISTS (
            SELECT 1 FROM users u 
            WHERE u.id = auth.uid() 
            AND u.role = 'sindico' 
            AND u.condo_id = units.condo_id
        ))
    );

-- ============================================
-- RESIDENTS TABLE
-- ============================================
DROP POLICY IF EXISTS "superadmin_all_residents" ON residents;
CREATE POLICY "superadmin_all_residents" ON residents
    FOR ALL USING (is_superadmin());

DROP POLICY IF EXISTS "sindico_manage_residents" ON residents;
CREATE POLICY "sindico_manage_residents" ON residents
    FOR ALL USING (
        is_superadmin() OR
        (EXISTS (
            SELECT 1 FROM users u 
            WHERE u.id = auth.uid() 
            AND u.role IN ('sindico', 'porteiro')
            AND u.condo_id = residents.condo_id
        ))
    );

-- ============================================
-- FINANCIAL_ENTRIES TABLE
-- ============================================
DROP POLICY IF EXISTS "superadmin_all_financial" ON financial_entries;
CREATE POLICY "superadmin_all_financial" ON financial_entries
    FOR ALL USING (is_superadmin());

DROP POLICY IF EXISTS "sindico_manage_financial" ON financial_entries;
CREATE POLICY "sindico_manage_financial" ON financial_entries
    FOR ALL USING (
        is_superadmin() OR
        (EXISTS (
            SELECT 1 FROM users u 
            WHERE u.id = auth.uid() 
            AND u.role = 'sindico' 
            AND u.condo_id = financial_entries.condo_id
        ))
    );

-- ============================================
-- VISITORS TABLE
-- ============================================
DROP POLICY IF EXISTS "superadmin_all_visitors" ON visitors;
CREATE POLICY "superadmin_all_visitors" ON visitors
    FOR ALL USING (is_superadmin());

DROP POLICY IF EXISTS "porteiro_manage_visitors" ON visitors;
CREATE POLICY "porteiro_manage_visitors" ON visitors
    FOR ALL USING (
        is_superadmin() OR
        (EXISTS (
            SELECT 1 FROM users u 
            WHERE u.id = auth.uid() 
            AND u.role IN ('sindico', 'porteiro')
            AND u.condo_id = visitors.condo_id
        ))
    );

-- ============================================
-- OCCURRENCES TABLE
-- ============================================
DROP POLICY IF EXISTS "superadmin_all_occurrences" ON occurrences;
CREATE POLICY "superadmin_all_occurrences" ON occurrences
    FOR ALL USING (is_superadmin());

DROP POLICY IF EXISTS "condo_members_manage_occurrences" ON occurrences;
CREATE POLICY "condo_members_manage_occurrences" ON occurrences
    FOR ALL USING (
        is_superadmin() OR
        condo_id IN (SELECT condo_id FROM users WHERE id = auth.uid())
    );

-- ============================================
-- NOTICES TABLE
-- ============================================
DROP POLICY IF EXISTS "superadmin_all_notices" ON notices;
CREATE POLICY "superadmin_all_notices" ON notices
    FOR ALL USING (is_superadmin());

DROP POLICY IF EXISTS "sindico_manage_notices" ON notices;
CREATE POLICY "sindico_manage_notices" ON notices
    FOR ALL USING (
        is_superadmin() OR
        (EXISTS (
            SELECT 1 FROM users u 
            WHERE u.id = auth.uid() 
            AND u.role = 'sindico' 
            AND u.condo_id = notices.condo_id
        ))
    );

DROP POLICY IF EXISTS "condo_members_view_notices" ON notices;
CREATE POLICY "condo_members_view_notices" ON notices
    FOR SELECT USING (
        is_superadmin() OR
        condo_id IN (SELECT condo_id FROM users WHERE id = auth.uid())
    );

-- ============================================
-- SUBSCRIPTIONS TABLE
-- ============================================
DROP POLICY IF EXISTS "superadmin_all_subscriptions" ON subscriptions;
CREATE POLICY "superadmin_all_subscriptions" ON subscriptions
    FOR ALL USING (is_superadmin());

DROP POLICY IF EXISTS "sindico_view_subscription" ON subscriptions;
CREATE POLICY "sindico_view_subscription" ON subscriptions
    FOR SELECT USING (
        is_superadmin() OR
        condo_id IN (SELECT condo_id FROM users WHERE id = auth.uid() AND role = 'sindico')
    );

-- ============================================
-- PLANS TABLE (public for viewing)
-- ============================================
DROP POLICY IF EXISTS "anyone_view_active_plans" ON plans;
CREATE POLICY "anyone_view_active_plans" ON plans
    FOR SELECT USING (ativo = true OR is_superadmin());

DROP POLICY IF EXISTS "superadmin_manage_plans" ON plans;
CREATE POLICY "superadmin_manage_plans" ON plans
    FOR ALL USING (is_superadmin());

-- ============================================
-- INVOICES TABLE
-- ============================================
DROP POLICY IF EXISTS "superadmin_all_invoices" ON invoices;
CREATE POLICY "superadmin_all_invoices" ON invoices
    FOR ALL USING (is_superadmin());

DROP POLICY IF EXISTS "sindico_view_invoices" ON invoices;
CREATE POLICY "sindico_view_invoices" ON invoices
    FOR SELECT USING (
        is_superadmin() OR
        condo_id IN (SELECT condo_id FROM users WHERE id = auth.uid() AND role = 'sindico')
    );

-- ============================================
-- LEGAL_ACCEPTANCES TABLE
-- ============================================
DROP POLICY IF EXISTS "superadmin_all_legal" ON legal_acceptances;
CREATE POLICY "superadmin_all_legal" ON legal_acceptances
    FOR ALL USING (is_superadmin());

DROP POLICY IF EXISTS "users_manage_own_legal" ON legal_acceptances;
CREATE POLICY "users_manage_own_legal" ON legal_acceptances
    FOR ALL USING (user_id = auth.uid() OR is_superadmin());

-- ============================================
-- SYSTEM_LOGS TABLE (superadmin only)
-- ============================================
DROP POLICY IF EXISTS "superadmin_only_logs" ON system_logs;
CREATE POLICY "superadmin_only_logs" ON system_logs
    FOR ALL USING (is_superadmin());

-- ============================================
-- GRANT para service role (usado pelas APIs)
-- ============================================
-- O service role já tem acesso total, não precisa de policies

SELECT 'RLS SUPERADMIN POLICIES CREATED SUCCESSFULLY' as status;
