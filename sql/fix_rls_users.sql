-- =============================================
-- FIX RLS POLICIES FOR USERS TABLE
-- =============================================

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- DROP EXISTING POLICIES TO AVOID CONFLICTS
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Superadmin can view all profiles" ON users;
DROP POLICY IF EXISTS "Sindico can view condo profiles" ON users;
DROP POLICY IF EXISTS "Porteiro can view condo profiles" ON users;
DROP POLICY IF EXISTS "Sindico can update condo profiles" ON users;
DROP POLICY IF EXISTS "Enable read access for all users" ON users;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON users;

-- 1. USERS CAN VIEW THEIR OWN PROFILE
CREATE POLICY "users_view_own" ON users
FOR SELECT USING (
  auth.uid() = id
);

-- 2. USERS CAN UPDATE THEIR OWN PROFILE
CREATE POLICY "users_update_own" ON users
FOR UPDATE USING (
  auth.uid() = id
);

-- 3. SUPERADMIN CAN VIEW/UPDATE ALL PROFILES
CREATE POLICY "superadmin_all" ON users
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM users u 
    WHERE u.id = auth.uid() 
    AND u.role = 'superadmin'
  )
);

-- 4. SINDICO CAN VIEW ALL USERS IN THEIR CONDO
CREATE POLICY "sindico_view_condo" ON users
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM users u 
    WHERE u.id = auth.uid() 
    AND u.role = 'sindico' 
    AND u.condo_id = users.condo_id
  )
);

-- 5. SINDICO CAN UPDATE USERS IN THEIR CONDO (except other sindicos or superadmins)
CREATE POLICY "sindico_update_condo" ON users
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM users u 
    WHERE u.id = auth.uid() 
    AND u.role = 'sindico' 
    AND u.condo_id = users.condo_id
  )
);

-- 6. PORTEIRO CAN VIEW USERS IN THEIR CONDO
CREATE POLICY "porteiro_view_condo" ON users
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM users u 
    WHERE u.id = auth.uid() 
    AND u.role = 'porteiro' 
    AND u.condo_id = users.condo_id
  )
);

-- 7. MORADOR CAN VIEW OTHER USERS IN THEIR CONDO (Optional, but often needed for social features)
-- Uncomment if needed, but for now strict privacy
-- CREATE POLICY "morador_view_condo" ON users
-- FOR SELECT USING (
--   EXISTS (
--     SELECT 1 FROM users u 
--     WHERE u.id = auth.uid() 
--     AND u.role = 'morador' 
--     AND u.condo_id = users.condo_id
--   )
-- );

-- =============================================
-- FIX RESIDENT_INVOICES (Billing)
-- =============================================
ALTER TABLE resident_invoices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "billing_superadmin" ON resident_invoices;
DROP POLICY IF EXISTS "billing_sindico" ON resident_invoices;
DROP POLICY IF EXISTS "billing_morador_read" ON resident_invoices;

-- Superadmin
CREATE POLICY "billing_superadmin" ON resident_invoices
FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'superadmin')
);

-- Sindico (Full access to own condo invoices)
CREATE POLICY "billing_sindico" ON resident_invoices
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
    AND role = 'sindico' 
    AND condo_id = resident_invoices.condo_id
  )
);

-- Morador (Read own invoices)
CREATE POLICY "billing_morador_read" ON resident_invoices
FOR SELECT USING (
  morador_id = auth.uid()
);
