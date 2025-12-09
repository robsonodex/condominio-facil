-- =============================================
-- FIX RLS POLICIES - Substituir consultas diretas por SECURITY DEFINER functions
-- Criado em: 2025-12-09
-- Objetivo: Eliminar recursão RLS causada por SELECT users dentro de policies
-- Total de policies reescritas: 23+
-- =============================================

-- =============================================
-- SCHEMA.SQL - Policies Principais
-- =============================================

-- 1. PLANS -----------------------------------------------
DROP POLICY IF EXISTS "Superadmin full access to plans" ON plans;
CREATE POLICY "Superadmin full access to plans" ON plans
  FOR ALL USING (is_superadmin());

-- 2. CONDOS -----------------------------------------------
DROP POLICY IF EXISTS "Superadmin full access to condos" ON condos;
CREATE POLICY "Superadmin full access to condos" ON condos
  FOR ALL USING (is_superadmin());

DROP POLICY IF EXISTS "Users see their own condo" ON condos;
CREATE POLICY "Users see their own condo" ON condos
  FOR SELECT USING (id = user_condo_id());

-- 3. USERS -----------------------------------------------
DROP POLICY IF EXISTS "Superadmin full access to users" ON users;
CREATE POLICY "Superadmin full access to users" ON users
  FOR ALL USING (is_superadmin());

DROP POLICY IF EXISTS "Users see same condo users" ON users;
CREATE POLICY "Users see same condo users" ON users
  FOR SELECT USING (
    condo_id = user_condo_id()
    OR id = auth.uid()
  );

-- 4. UNITS -----------------------------------------------
DROP POLICY IF EXISTS "Access units by condo" ON units;
CREATE POLICY "Access units by condo" ON units
  FOR ALL USING (
    is_superadmin()
    OR condo_id = user_condo_id()
  );

-- 5. FINANCIAL ENTRIES -----------------------------------------------
DROP POLICY IF EXISTS "Superadmin and sindico access financial" ON financial_entries;
CREATE POLICY "Superadmin and sindico access financial" ON financial_entries
  FOR ALL USING (
    user_has_role(ARRAY['superadmin', 'sindico']) 
    AND (condo_id = user_condo_id() OR is_superadmin())
  );

DROP POLICY IF EXISTS "Morador sees own unit financial" ON financial_entries;
CREATE POLICY "Morador sees own unit financial" ON financial_entries
  FOR SELECT USING (
    unidade_id = user_unidade_id()
  );

-- 6. NOTICES -----------------------------------------------
DROP POLICY IF EXISTS "Access notices by condo" ON notices;
CREATE POLICY "Access notices by condo" ON notices
  FOR ALL USING (
    is_superadmin()
    OR condo_id = user_condo_id()
  );

-- 7. OCCURRENCES -----------------------------------------------
DROP POLICY IF EXISTS "Access occurrences" ON occurrences;
CREATE POLICY "Access occurrences" ON occurrences
  FOR ALL USING (
    user_has_role(ARRAY['superadmin', 'sindico', 'porteiro'])
    OR (criado_por_user_id = auth.uid())
    OR (unidade_id = user_unidade_id())
  );

-- 8. VISITORS -----------------------------------------------
DROP POLICY IF EXISTS "Access visitors" ON visitors;
CREATE POLICY "Access visitors" ON visitors
  FOR ALL USING (
    user_has_role(ARRAY['superadmin', 'sindico', 'porteiro'])
    OR unidade_id = user_unidade_id()
  );

-- 9. RESIDENTS -----------------------------------------------
DROP POLICY IF EXISTS "Access residents" ON residents;
CREATE POLICY "Access residents" ON residents
  FOR ALL USING (
    is_superadmin()
    OR condo_id = user_condo_id()
  );

-- 10. SUBSCRIPTIONS -----------------------------------------------
DROP POLICY IF EXISTS "Superadmin access subscriptions" ON subscriptions;
CREATE POLICY "Superadmin access subscriptions" ON subscriptions
  FOR ALL USING (is_superadmin());

-- 11. FINANCIAL REPORTS -----------------------------------------------
DROP POLICY IF EXISTS "Access financial reports" ON financial_reports;
CREATE POLICY "Access financial reports" ON financial_reports
  FOR ALL USING (
    user_has_role(ARRAY['superadmin', 'sindico'])
  );

-- =============================================
-- SAAS_COMPLETE.SQL - Policies SaaS
-- =============================================

-- 12. INVOICES -----------------------------------------------
DROP POLICY IF EXISTS "Users can see invoices of their condo" ON invoices;
CREATE POLICY "Users can see invoices of their condo" ON invoices
  FOR SELECT USING (
    condo_id = user_condo_id()
    OR is_superadmin()
  );

DROP POLICY IF EXISTS "Superadmin can manage all invoices" ON invoices;
CREATE POLICY "Superadmin can manage all invoices" ON invoices
  FOR ALL USING (is_superadmin());

-- 13. EMAIL LOGS -----------------------------------------------
DROP POLICY IF EXISTS "Superadmin can see all email logs" ON email_logs;
CREATE POLICY "Superadmin can see all email logs" ON email_logs
  FOR SELECT USING (is_superadmin());

-- 14. LEGAL ACCEPTANCES -----------------------------------------------
DROP POLICY IF EXISTS "Superadmin can see all acceptances" ON legal_acceptances;
CREATE POLICY "Superadmin can see all acceptances" ON legal_acceptances
  FOR SELECT USING (is_superadmin());

-- =============================================
-- PAYMENTS.SQL - Policies de Pagamento
-- =============================================

-- 15 & 16. PAYMENTS -----------------------------------------------
DROP POLICY IF EXISTS "Users can see payments of their condo" ON payments;
CREATE POLICY "Users can see payments of their condo" ON payments
  FOR SELECT USING (
    condo_id = user_condo_id()
    OR is_superadmin()
  );

DROP POLICY IF EXISTS "Superadmin can manage all payments" ON payments;
CREATE POLICY "Superadmin can manage all payments" ON payments
  FOR ALL USING (is_superadmin());

-- =============================================
-- NOTIFICATIONS.SQL - Policies de Notificações
-- =============================================

-- 17. NOTIFICATIONS -----------------------------------------------
DROP POLICY IF EXISTS "Users can manage notifications" ON notifications;
CREATE POLICY "Users can manage notifications" ON notifications
  FOR ALL USING (
    user_id = auth.uid()
    OR user_has_role(ARRAY['superadmin', 'sindico'])
  );

-- =============================================
-- SUPPORT_SYSTEM.SQL - Policies de Suporte
-- =============================================

-- 18. SUPPORT TICKETS -----------------------------------------------
DROP POLICY IF EXISTS "Superadmin can view all tickets" ON support_tickets;
CREATE POLICY "Superadmin can view all tickets" ON support_tickets
  FOR SELECT USING (is_superadmin());

-- 19. SUPPORT MESSAGES -----------------------------------------------
DROP POLICY IF EXISTS "Superadmin can view all messages" ON support_messages;
CREATE POLICY "Superadmin can view all messages" ON support_messages
  FOR SELECT USING (is_superadmin());

-- 20. SUPPORT LOGS -----------------------------------------------
DROP POLICY IF EXISTS "Superadmin can view all logs" ON support_logs;
CREATE POLICY "Superadmin can view all logs" ON support_logs
  FOR SELECT USING (is_superadmin());

-- =============================================
-- NOTIFICATIONS_SYSTEM.SQL - Policies Adicionais
-- =============================================

-- 21. NOTIFICATIONS (adicional) -----------------------------------------------
DROP POLICY IF EXISTS "Superadmin and sindico can manage notifications" ON notifications;
CREATE POLICY "Superadmin and sindico can manage notifications" ON notifications
  FOR ALL USING (
    user_id = auth.uid()
    OR is_superadmin()
  );

-- =============================================
-- BOLETO_SYSTEM.SQL - Policies de Boletos
-- =============================================

-- 22. PAYMENT LOGS -----------------------------------------------
DROP POLICY IF EXISTS "Superadmin can view all payment logs" ON payment_logs;
CREATE POLICY "Superadmin can view all payment logs" ON payment_logs
  FOR SELECT USING (is_superadmin());

-- =============================================
-- RENTAL_SYSTEM.SQL - Policies de Aluguéis
-- =============================================

-- 23. RENTAL CONTRACTS -----------------------------------------------
DROP POLICY IF EXISTS "Access rental contracts by condo" ON rental_contracts;
CREATE POLICY "Access rental contracts by condo" ON rental_contracts
  FOR ALL USING (
    is_superadmin()
    OR condo_id = user_condo_id()
  );

-- 24. RENT INVOICES -----------------------------------------------
DROP POLICY IF EXISTS "Access rent invoices by condo" ON rent_invoices;
CREATE POLICY "Access rent invoices by condo" ON rent_invoices
  FOR ALL USING (
    is_superadmin()
    OR user_belongs_to_condo((SELECT condo_id FROM rental_contracts WHERE id = contract_id))
  );

-- =============================================
-- FIM - Todas as policies foram reescritas com SECURITY DEFINER functions
-- Total: 24 policies atualizadas
-- =============================================

-- Comentário final
COMMENT ON POLICY "Superadmin full access to plans" ON plans IS 'Reescrita usando is_superadmin() SECURITY DEFINER - evita recursão RLS';
COMMENT ON POLICY "Superadmin full access to condos" ON condos IS 'Reescrita usando is_superadmin() SECURITY DEFINER - evita recursão RLS';
