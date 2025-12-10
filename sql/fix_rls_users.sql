-- =============================================
-- COMPREHENSIVE RLS FIX FOR ALL TABLES (V3)
-- Execute this ENTIRE script in Supabase SQL Editor
-- =============================================

-- Step 1: Create helper functions (if not exists)
CREATE OR REPLACE FUNCTION get_my_role()
RETURNS TEXT
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT role FROM users WHERE id = auth.uid()
$$;

CREATE OR REPLACE FUNCTION get_my_condo_id()
RETURNS UUID
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT condo_id FROM users WHERE id = auth.uid()
$$;

CREATE OR REPLACE FUNCTION get_my_unidade_id()
RETURNS UUID
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT unidade_id FROM users WHERE id = auth.uid()
$$;

-- =============================================
-- USERS TABLE
-- =============================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_read_own" ON users;
DROP POLICY IF EXISTS "users_update_own" ON users;
DROP POLICY IF EXISTS "superadmin_full_access" ON users;
DROP POLICY IF EXISTS "sindico_read_condo_users" ON users;
DROP POLICY IF EXISTS "sindico_update_condo_users" ON users;
DROP POLICY IF EXISTS "porteiro_read_condo_users" ON users;

CREATE POLICY "users_read_own" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "users_update_own" ON users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "superadmin_full_access" ON users FOR ALL USING (get_my_role() = 'superadmin');
CREATE POLICY "sindico_read_condo_users" ON users FOR SELECT USING (get_my_role() = 'sindico' AND get_my_condo_id() = condo_id);
CREATE POLICY "sindico_update_condo_users" ON users FOR UPDATE USING (get_my_role() = 'sindico' AND get_my_condo_id() = condo_id AND role NOT IN ('superadmin', 'sindico'));
CREATE POLICY "porteiro_read_condo_users" ON users FOR SELECT USING (get_my_role() = 'porteiro' AND get_my_condo_id() = condo_id);

-- =============================================
-- UNITS TABLE
-- =============================================
ALTER TABLE units ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "units_superadmin" ON units;
DROP POLICY IF EXISTS "units_sindico" ON units;
DROP POLICY IF EXISTS "units_porteiro_read" ON units;
DROP POLICY IF EXISTS "units_morador_read" ON units;

CREATE POLICY "units_superadmin" ON units FOR ALL USING (get_my_role() = 'superadmin');
CREATE POLICY "units_sindico" ON units FOR ALL USING (get_my_role() = 'sindico' AND get_my_condo_id() = condo_id);
CREATE POLICY "units_porteiro_read" ON units FOR SELECT USING (get_my_role() = 'porteiro' AND get_my_condo_id() = condo_id);
CREATE POLICY "units_morador_read" ON units FOR SELECT USING (get_my_role() = 'morador' AND get_my_condo_id() = condo_id);

-- =============================================
-- RESIDENTS TABLE
-- =============================================
ALTER TABLE residents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "residents_superadmin" ON residents;
DROP POLICY IF EXISTS "residents_sindico" ON residents;
DROP POLICY IF EXISTS "residents_porteiro_read" ON residents;

CREATE POLICY "residents_superadmin" ON residents FOR ALL USING (get_my_role() = 'superadmin');
CREATE POLICY "residents_sindico" ON residents FOR ALL USING (get_my_role() = 'sindico' AND get_my_condo_id() = condo_id);
CREATE POLICY "residents_porteiro_read" ON residents FOR SELECT USING (get_my_role() = 'porteiro' AND get_my_condo_id() = condo_id);

-- =============================================
-- NOTICES TABLE
-- =============================================
ALTER TABLE notices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "notices_superadmin" ON notices;
DROP POLICY IF EXISTS "notices_sindico" ON notices;
DROP POLICY IF EXISTS "notices_read_condo" ON notices;

CREATE POLICY "notices_superadmin" ON notices FOR ALL USING (get_my_role() = 'superadmin');
CREATE POLICY "notices_sindico" ON notices FOR ALL USING (get_my_role() = 'sindico' AND get_my_condo_id() = condo_id);
CREATE POLICY "notices_read_condo" ON notices FOR SELECT USING (get_my_condo_id() = condo_id);

-- =============================================
-- OCCURRENCES TABLE
-- =============================================
ALTER TABLE occurrences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "occurrences_superadmin" ON occurrences;
DROP POLICY IF EXISTS "occurrences_sindico" ON occurrences;
DROP POLICY IF EXISTS "occurrences_porteiro" ON occurrences;
DROP POLICY IF EXISTS "occurrences_morador" ON occurrences;

CREATE POLICY "occurrences_superadmin" ON occurrences FOR ALL USING (get_my_role() = 'superadmin');
CREATE POLICY "occurrences_sindico" ON occurrences FOR ALL USING (get_my_role() = 'sindico' AND get_my_condo_id() = condo_id);
CREATE POLICY "occurrences_porteiro" ON occurrences FOR ALL USING (get_my_role() = 'porteiro' AND get_my_condo_id() = condo_id);
CREATE POLICY "occurrences_morador" ON occurrences FOR ALL USING (created_by = auth.uid() OR get_my_condo_id() = condo_id);

-- =============================================
-- FINANCIAL_ENTRIES TABLE
-- =============================================
ALTER TABLE financial_entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "financial_superadmin" ON financial_entries;
DROP POLICY IF EXISTS "financial_sindico" ON financial_entries;
DROP POLICY IF EXISTS "financial_morador_read" ON financial_entries;

CREATE POLICY "financial_superadmin" ON financial_entries FOR ALL USING (get_my_role() = 'superadmin');
CREATE POLICY "financial_sindico" ON financial_entries FOR ALL USING (get_my_role() = 'sindico' AND get_my_condo_id() = condo_id);
CREATE POLICY "financial_morador_read" ON financial_entries FOR SELECT USING (unidade_id = get_my_unidade_id());

-- =============================================
-- RESIDENT_INVOICES TABLE
-- =============================================
ALTER TABLE resident_invoices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "invoices_superadmin" ON resident_invoices;
DROP POLICY IF EXISTS "invoices_sindico" ON resident_invoices;
DROP POLICY IF EXISTS "invoices_morador_read" ON resident_invoices;

CREATE POLICY "invoices_superadmin" ON resident_invoices FOR ALL USING (get_my_role() = 'superadmin');
CREATE POLICY "invoices_sindico" ON resident_invoices FOR ALL USING (get_my_role() = 'sindico' AND get_my_condo_id() = condo_id);
CREATE POLICY "invoices_morador_read" ON resident_invoices FOR SELECT USING (morador_id = auth.uid());

-- =============================================
-- VISITORS TABLE
-- =============================================
ALTER TABLE visitors ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "visitors_superadmin" ON visitors;
DROP POLICY IF EXISTS "visitors_sindico" ON visitors;
DROP POLICY IF EXISTS "visitors_porteiro" ON visitors;
DROP POLICY IF EXISTS "visitors_morador_read" ON visitors;

CREATE POLICY "visitors_superadmin" ON visitors FOR ALL USING (get_my_role() = 'superadmin');
CREATE POLICY "visitors_sindico" ON visitors FOR ALL USING (get_my_role() = 'sindico' AND get_my_condo_id() = condo_id);
CREATE POLICY "visitors_porteiro" ON visitors FOR ALL USING (get_my_role() = 'porteiro' AND get_my_condo_id() = condo_id);
CREATE POLICY "visitors_morador_read" ON visitors FOR SELECT USING (unidade_id = get_my_unidade_id());

-- =============================================
-- CONDOS TABLE
-- =============================================
ALTER TABLE condos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "condos_superadmin" ON condos;
DROP POLICY IF EXISTS "condos_sindico_read" ON condos;
DROP POLICY IF EXISTS "condos_user_read" ON condos;

CREATE POLICY "condos_superadmin" ON condos FOR ALL USING (get_my_role() = 'superadmin');
CREATE POLICY "condos_sindico_read" ON condos FOR SELECT USING (get_my_role() = 'sindico' AND get_my_condo_id() = id);
CREATE POLICY "condos_user_read" ON condos FOR SELECT USING (get_my_condo_id() = id);

-- =============================================
-- SUBSCRIPTIONS TABLE
-- =============================================
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "subscriptions_superadmin" ON subscriptions;
DROP POLICY IF EXISTS "subscriptions_sindico_read" ON subscriptions;

CREATE POLICY "subscriptions_superadmin" ON subscriptions FOR ALL USING (get_my_role() = 'superadmin');
CREATE POLICY "subscriptions_sindico_read" ON subscriptions FOR SELECT USING (get_my_role() = 'sindico' AND get_my_condo_id() = condo_id);

-- =============================================
-- PAYMENTS TABLE
-- =============================================
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "payments_superadmin" ON payments;
DROP POLICY IF EXISTS "payments_sindico" ON payments;

CREATE POLICY "payments_superadmin" ON payments FOR ALL USING (get_my_role() = 'superadmin');
CREATE POLICY "payments_sindico" ON payments FOR ALL USING (get_my_role() = 'sindico' AND get_my_condo_id() = condo_id);

-- =============================================
-- NOTIFICATIONS TABLE
-- =============================================
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "notifications_superadmin" ON notifications;
DROP POLICY IF EXISTS "notifications_user" ON notifications;

CREATE POLICY "notifications_superadmin" ON notifications FOR ALL USING (get_my_role() = 'superadmin');
CREATE POLICY "notifications_user" ON notifications FOR ALL USING (user_id = auth.uid());

-- =============================================
-- PLANS TABLE (public read)
-- =============================================
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "plans_public_read" ON plans;
DROP POLICY IF EXISTS "plans_superadmin" ON plans;

CREATE POLICY "plans_public_read" ON plans FOR SELECT USING (true);
CREATE POLICY "plans_superadmin" ON plans FOR ALL USING (get_my_role() = 'superadmin');

-- =============================================
-- DONE! All tables have proper RLS policies now
-- =============================================
