-- =============================================
-- ROLLBACK RLS POLICIES
-- Criado em: 2025-12-09
-- Objetivo: Reverter changes de fix_rls_policies.sql em caso de erro
-- =============================================

-- =============================================
-- STEP 1: Dropar SECURITY DEFINER Functions
-- =============================================
DROP FUNCTION IF EXISTS is_superadmin();
DROP FUNCTION IF EXISTS user_condo_id();
DROP FUNCTION IF EXISTS user_role();
DROP FUNCTION IF EXISTS user_unidade_id();
DROP FUNCTION IF EXISTS user_belongs_to_condo(UUID);
DROP FUNCTION IF EXISTS user_has_role(TEXT[]);

-- =============================================
-- STEP 2: Restaurar Policies Originais
-- (copiar do schema.sql ANTES do fix)
-- =============================================

-- PLANS
DROP POLICY IF EXISTS "Superadmin full access to plans" ON plans;
CREATE POLICY "Superadmin full access to plans" ON plans
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'superadmin')
  );

-- CONDOS
DROP POLICY IF EXISTS "Superadmin full access to condos" ON condos;
CREATE POLICY "Superadmin full access to condos" ON condos
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'superadmin')
  );

DROP POLICY IF EXISTS "Users see their own condo" ON condos;
CREATE POLICY "Users see their own condo" ON condos
  FOR SELECT USING (
    id = (SELECT condo_id FROM users WHERE id = auth.uid())
  );

-- USERS
DROP POLICY IF EXISTS "Superadmin full access to users" ON users;
CREATE POLICY "Superadmin full access to users" ON users
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'superadmin')
  );

DROP POLICY IF EXISTS "Users see same condo users" ON users;
CREATE POLICY "Users see same condo users" ON users
  FOR SELECT USING (
    condo_id = (SELECT condo_id FROM users WHERE id = auth.uid())
    OR id = auth.uid()
  );

-- UNITS
DROP POLICY IF EXISTS "Access units by condo" ON units;
CREATE POLICY "Access units by condo" ON units
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'superadmin')
    OR condo_id = (SELECT condo_id FROM users WHERE id = auth.uid())
  );

-- FINANCIAL ENTRIES
DROP POLICY IF EXISTS "Superadmin and sindico access financial" ON financial_entries;
CREATE POLICY "Superadmin and sindico access financial" ON financial_entries
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('superadmin', 'sindico') AND (condo_id = financial_entries.condo_id OR role = 'superadmin'))
  );

DROP POLICY IF EXISTS "Morador sees own unit financial" ON financial_entries;
CREATE POLICY "Morador sees own unit financial" ON financial_entries
  FOR SELECT USING (
    unidade_id = (SELECT unidade_id FROM users WHERE id = auth.uid())
  );

-- NOTICES
DROP POLICY IF EXISTS "Access notices by condo" ON notices;
CREATE POLICY "Access notices by condo" ON notices
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'superadmin')
    OR condo_id = (SELECT condo_id FROM users WHERE id = auth.uid())
  );

-- OCCURRENCES
DROP POLICY IF EXISTS "Access occurrences" ON occurrences;
CREATE POLICY "Access occurrences" ON occurrences
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('superadmin', 'sindico', 'porteiro'))
    OR (criado_por_user_id = auth.uid())
    OR (unidade_id = (SELECT unidade_id FROM users WHERE id = auth.uid()))
  );

-- VISITORS
DROP POLICY IF EXISTS "Access visitors" ON visitors;
CREATE POLICY "Access visitors" ON visitors
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('superadmin', 'sindico', 'porteiro'))
    OR unidade_id = (SELECT unidade_id FROM users WHERE id = auth.uid())
  );

-- RESIDENTS
DROP POLICY IF EXISTS "Access residents" ON residents;
CREATE POLICY "Access residents" ON residents
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'superadmin')
    OR condo_id = (SELECT condo_id FROM users WHERE id = auth.uid())
  );

-- SUBSCRIPTIONS
DROP POLICY IF EXISTS "Superadmin access subscriptions" ON subscriptions;
CREATE POLICY "Superadmin access subscriptions" ON subscriptions
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'superadmin')
  );

-- FINANCIAL REPORTS
DROP POLICY IF EXISTS "Access financial reports" ON financial_reports;
CREATE POLICY "Access financial reports" ON financial_reports
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('superadmin', 'sindico'))
  );

-- INVOICES
DROP POLICY IF EXISTS "Users can see invoices of their condo" ON invoices;
CREATE POLICY "Users can see invoices of their condo" ON invoices
  FOR SELECT USING (
    condo_id IN (SELECT condo_id FROM users WHERE id = auth.uid())
    OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'superadmin')
  );

DROP POLICY IF EXISTS "Superadmin can manage all invoices" ON invoices;
CREATE POLICY "Superadmin can manage all invoices" ON invoices
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'superadmin')
  );

-- EMAIL LOGS
DROP POLICY IF EXISTS "Superadmin can see all email logs" ON email_logs;
CREATE POLICY "Superadmin can see all email logs" ON email_logs
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'superadmin')
  );

-- LEGAL ACCEPTANCES
DROP POLICY IF EXISTS "Superadmin can see all acceptances" ON legal_acceptances;
CREATE POLICY "Superadmin can see all acceptances" ON legal_acceptances
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'superadmin')
  );

-- PAYMENTS
DROP POLICY IF EXISTS "Users can see payments of their condo" ON payments;
CREATE POLICY "Users can see payments of their condo" ON payments
  FOR SELECT USING (
    condo_id IN (SELECT condo_id FROM users WHERE id = auth.uid())
    OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'superadmin')
  );

DROP POLICY IF EXISTS "Superadmin can manage all payments" ON payments;
CREATE POLICY "Superadmin can manage all payments" ON payments
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'superadmin')
  );

-- =============================================
-- FIM - Rollback completo
-- =============================================
