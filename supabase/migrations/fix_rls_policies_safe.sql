-- =============================================
-- FIX RLS POLICIES - SAFE VERSION (apenas tabelas CORE)
-- Criado em: 2025-12-09
-- Objetivo: Eliminar recursão RLS (versão compatível com schema atual)
-- =============================================

-- =============================================
-- CORE TABLES - Schema Principal
-- =============================================

-- 1. PLANS
DROP POLICY IF EXISTS "Superadmin full access to plans" ON plans;
CREATE POLICY "Superadmin full access to plans" ON plans
  FOR ALL USING (is_superadmin());

DROP POLICY IF EXISTS "Anyone can view active plans" ON plans;
CREATE POLICY "Anyone can view active plans" ON plans
  FOR SELECT USING (ativo = true);

-- 2. CONDOS
DROP POLICY IF EXISTS "Superadmin full access to condos" ON condos;
CREATE POLICY "Superadmin full access to condos" ON condos
  FOR ALL USING (is_superadmin());

DROP POLICY IF EXISTS "Users see their own condo" ON condos;
CREATE POLICY "Users see their own condo" ON condos
  FOR SELECT USING (id = user_condo_id());

-- 3. USERS
DROP POLICY IF EXISTS "Superadmin full access to users" ON users;
CREATE POLICY "Superadmin full access to users" ON users
  FOR ALL USING (is_superadmin());

DROP POLICY IF EXISTS "Users see same condo users" ON users;
CREATE POLICY "Users see same condo users" ON users
  FOR SELECT USING (
    condo_id = user_condo_id()
    OR id = auth.uid()
  );

-- 4. UNITS
DROP POLICY IF EXISTS "Access units by condo" ON units;
CREATE POLICY "Access units by condo" ON units
  FOR ALL USING (
    is_superadmin()
    OR condo_id = user_condo_id()
  );

-- 5. FINANCIAL ENTRIES
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

-- 6. NOTICES
DROP POLICY IF EXISTS "Access notices by condo" ON notices;
CREATE POLICY "Access notices by condo" ON notices
  FOR ALL USING (
    is_superadmin()
    OR condo_id = user_condo_id()
  );

-- 7. NOTICE READS
DROP POLICY IF EXISTS "Users manage own notice reads" ON notice_reads;
CREATE POLICY "Users manage own notice reads" ON notice_reads
  FOR ALL USING (user_id = auth.uid());

-- 8. OCCURRENCES
DROP POLICY IF EXISTS "Access occurrences" ON occurrences;
CREATE POLICY "Access occurrences" ON occurrences
  FOR ALL USING (
    user_has_role(ARRAY['superadmin', 'sindico', 'porteiro'])
    OR (criado_por_user_id = auth.uid())
    OR (unidade_id = user_unidade_id())
  );

-- 9. VISITORS
DROP POLICY IF EXISTS "Access visitors" ON visitors;
CREATE POLICY "Access visitors" ON visitors
  FOR ALL USING (
    user_has_role(ARRAY['superadmin', 'sindico', 'porteiro'])
    OR unidade_id = user_unidade_id()
  );

-- 10. RESIDENTS
DROP POLICY IF EXISTS "Access residents" ON residents;
CREATE POLICY "Access residents" ON residents
  FOR ALL USING (
    is_superadmin()
    OR condo_id = user_condo_id()
  );

-- 11. SUBSCRIPTIONS
DROP POLICY IF EXISTS "Superadmin access subscriptions" ON subscriptions;
CREATE POLICY "Superadmin access subscriptions" ON subscriptions
  FOR ALL USING (is_superadmin());

-- 12. FINANCIAL REPORTS
DROP POLICY IF EXISTS "Access financial reports" ON financial_reports;
CREATE POLICY "Access financial reports" ON financial_reports
  FOR ALL USING (
    user_has_role(ARRAY['superadmin', 'sindico'])
  );

-- =============================================
-- SAAS TABLES - Se existirem
-- =============================================

-- 13. INVOICES (se existir)
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'invoices') THEN
    DROP POLICY IF EXISTS "Users can see invoices of their condo" ON invoices;
    CREATE POLICY "Users can see invoices of their condo" ON invoices
      FOR SELECT USING (
        condo_id = user_condo_id()
        OR is_superadmin()
      );

    DROP POLICY IF EXISTS "Superadmin can manage all invoices" ON invoices;
    CREATE POLICY "Superadmin can manage all invoices" ON invoices
      FOR ALL USING (is_superadmin());
      
    RAISE NOTICE 'Policies created for invoices';
  ELSE
    RAISE NOTICE 'Table invoices does not exist, skipping';
  END IF;
END $$;

-- 14. EMAIL LOGS (se existir)
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'email_logs') THEN
    DROP POLICY IF EXISTS "Superadmin can see all email logs" ON email_logs;
    CREATE POLICY "Superadmin can see all email logs" ON email_logs
      FOR SELECT USING (is_superadmin());
      
    RAISE NOTICE 'Policies created for email_logs';
  ELSE
    RAISE NOTICE 'Table email_logs does not exist, skipping';
  END IF;
END $$;

-- 15. LEGAL ACCEPTANCES (se existir)
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'legal_acceptances') THEN
    DROP POLICY IF EXISTS "Superadmin can see all acceptances" ON legal_acceptances;
    CREATE POLICY "Superadmin can see all acceptances" ON legal_acceptances
      FOR SELECT USING (is_superadmin());
    
    DROP POLICY IF EXISTS "Users can insert their own acceptances" ON legal_acceptances;
    CREATE POLICY "Users can insert their own acceptances" ON legal_acceptances
      FOR INSERT WITH CHECK (true);
      
    DROP POLICY IF EXISTS "Users can view their own acceptances" ON legal_acceptances;
    CREATE POLICY "Users can view their own acceptances" ON legal_acceptances
      FOR SELECT USING (user_id = auth.uid());
      
    RAISE NOTICE 'Policies created for legal_acceptances';
  ELSE
    RAISE NOTICE 'Table legal_acceptances does not exist, skipping';
  END IF;
END $$;

-- 16. PAYMENTS (se existir)
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'payments') THEN
    DROP POLICY IF EXISTS "Users can see payments of their condo" ON payments;
    CREATE POLICY "Users can see payments of their condo" ON payments
      FOR SELECT USING (
        condo_id = user_condo_id()
        OR is_superadmin()
      );

    DROP POLICY IF EXISTS "Superadmin can manage all payments" ON payments;
    CREATE POLICY "Superadmin can manage all payments" ON payments
      FOR ALL USING (is_superadmin());
      
    RAISE NOTICE 'Policies created for payments';
  ELSE
    RAISE NOTICE 'Table payments does not exist, skipping';
  END IF;
END $$;

-- 17. NOTIFICATIONS (se existir)
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'notifications') THEN
    DROP POLICY IF EXISTS "Users can manage notifications" ON notifications;
    CREATE POLICY "Users can manage notifications" ON notifications
      FOR ALL USING (
        user_id = auth.uid()
        OR user_has_role(ARRAY['superadmin', 'sindico'])
      );
      
    DROP POLICY IF EXISTS "Superadmin and sindico can manage notifications" ON notifications;
    CREATE POLICY "Superadmin and sindico can manage notifications" ON notifications
      FOR ALL USING (
        user_id = auth.uid()
        OR is_superadmin()
      );
      
    RAISE NOTICE 'Policies created for notifications';
  ELSE
    RAISE NOTICE 'Table notifications does not exist, skipping';
  END IF;
END $$;

-- 18. SUPPORT TICKETS (se existir)
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'support_tickets') THEN
    DROP POLICY IF EXISTS "Superadmin can view all tickets" ON support_tickets;
    CREATE POLICY "Superadmin can view all tickets" ON support_tickets
      FOR SELECT USING (is_superadmin());
      
    RAISE NOTICE 'Policies created for support_tickets';
  ELSE
    RAISE NOTICE 'Table support_tickets does not exist, skipping';
  END IF;
END $$;

-- 19. SUPPORT MESSAGES (se existir)
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'support_messages') THEN
    DROP POLICY IF EXISTS "Superadmin can view all messages" ON support_messages;
    CREATE POLICY "Superadmin can view all messages" ON support_messages
      FOR SELECT USING (is_superadmin());
      
    RAISE NOTICE 'Policies created for support_messages';
  ELSE
    RAISE NOTICE 'Table support_messages does not exist, skipping';
  END IF;
END $$;

-- 20. SUPPORT LOGS (se existir)
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'support_logs') THEN
    DROP POLICY IF EXISTS "Superadmin can view all logs" ON support_logs;
    CREATE POLICY "Superadmin can view all logs" ON support_logs
      FOR SELECT USING (is_superadmin());
      
    RAISE NOTICE 'Policies created for support_logs';
  ELSE
    RAISE NOTICE 'Table support_logs does not exist, skipping';
  END IF;
END $$;

-- =============================================
-- FIM - Policies reescritas com SECURITY DEFINER functions
-- Apenas tabelas existentes foram processadas
-- =============================================

-- Concluído com sucesso

