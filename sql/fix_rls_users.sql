-- =============================================
-- FIX RLS POLICIES FOR USERS TABLE (V2)
-- Fixes recursion issue by using SECURITY DEFINER function
-- =============================================

-- Step 1: Create a helper function that bypasses RLS
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

-- Step 2: Drop ALL existing policies on users table
DROP POLICY IF EXISTS "users_view_own" ON users;
DROP POLICY IF EXISTS "users_update_own" ON users;
DROP POLICY IF EXISTS "superadmin_all" ON users;
DROP POLICY IF EXISTS "sindico_view_condo" ON users;
DROP POLICY IF EXISTS "sindico_update_condo" ON users;
DROP POLICY IF EXISTS "porteiro_view_condo" ON users;
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Superadmin can view all profiles" ON users;
DROP POLICY IF EXISTS "Sindico can view condo profiles" ON users;
DROP POLICY IF EXISTS "Porteiro can view condo profiles" ON users;
DROP POLICY IF EXISTS "Sindico can update condo profiles" ON users;
DROP POLICY IF EXISTS "Enable read access for all users" ON users;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON users;

-- Step 3: Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Step 4: Create NON-RECURSIVE policies using the helper functions

-- 4.1 Users can read their own profile (simple, no recursion)
CREATE POLICY "users_read_own" ON users
FOR SELECT USING (
  auth.uid() = id
);

-- 4.2 Users can update their own profile
CREATE POLICY "users_update_own" ON users
FOR UPDATE USING (
  auth.uid() = id
);

-- 4.3 Superadmin can do everything (uses function, no recursion)
CREATE POLICY "superadmin_full_access" ON users
FOR ALL USING (
  get_my_role() = 'superadmin'
);

-- 4.4 Sindico can VIEW users in their condo
CREATE POLICY "sindico_read_condo_users" ON users
FOR SELECT USING (
  get_my_role() = 'sindico' AND get_my_condo_id() = condo_id
);

-- 4.5 Sindico can UPDATE users in their condo (not superadmins/sindicos)
CREATE POLICY "sindico_update_condo_users" ON users
FOR UPDATE USING (
  get_my_role() = 'sindico' 
  AND get_my_condo_id() = condo_id
  AND role NOT IN ('superadmin', 'sindico')
);

-- 4.6 Porteiro can VIEW users in their condo
CREATE POLICY "porteiro_read_condo_users" ON users
FOR SELECT USING (
  get_my_role() = 'porteiro' AND get_my_condo_id() = condo_id
);

-- =============================================
-- FIX RESIDENT_INVOICES (Billing) - Same approach
-- =============================================
ALTER TABLE resident_invoices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "billing_superadmin" ON resident_invoices;
DROP POLICY IF EXISTS "billing_sindico" ON resident_invoices;
DROP POLICY IF EXISTS "billing_morador_read" ON resident_invoices;

-- Superadmin full access
CREATE POLICY "invoices_superadmin" ON resident_invoices
FOR ALL USING (
  get_my_role() = 'superadmin'
);

-- Sindico full access to own condo invoices
CREATE POLICY "invoices_sindico" ON resident_invoices
FOR ALL USING (
  get_my_role() = 'sindico' AND get_my_condo_id() = condo_id
);

-- Morador can read their own invoices
CREATE POLICY "invoices_morador_read" ON resident_invoices
FOR SELECT USING (
  morador_id = auth.uid()
);

-- =============================================
-- FIX FINANCIAL_ENTRIES RLS
-- =============================================
ALTER TABLE financial_entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "financial_superadmin" ON financial_entries;
DROP POLICY IF EXISTS "financial_sindico" ON financial_entries;
DROP POLICY IF EXISTS "financial_morador_read" ON financial_entries;

-- Superadmin full access
CREATE POLICY "financial_superadmin" ON financial_entries
FOR ALL USING (
  get_my_role() = 'superadmin'
);

-- Sindico full access to own condo entries
CREATE POLICY "financial_sindico" ON financial_entries
FOR ALL USING (
  get_my_role() = 'sindico' AND get_my_condo_id() = condo_id
);

-- Morador can read their own unit entries
CREATE POLICY "financial_morador_read" ON financial_entries
FOR SELECT USING (
  unidade_id = (SELECT unidade_id FROM users WHERE id = auth.uid())
);

-- =============================================
-- DONE! Execute this in Supabase SQL Editor
-- =============================================
