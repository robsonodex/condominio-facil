-- =============================================
-- RLS Policy: Allow Síndico to Delete Moradores
-- Execute in Supabase SQL Editor
-- Date: 2026-01-04
-- =============================================

-- Drop existing policy if exists
DROP POLICY IF EXISTS "Sindico_Delete_Moradores" ON users;

-- Policy: Síndico can delete moradores from their own condo
CREATE POLICY "Sindico_Delete_Moradores" ON users
AS PERMISSIVE FOR DELETE
TO authenticated
USING (
  -- User being deleted must be a morador
  role = 'morador'
  AND
  -- And must belong to the same condo as the síndico performing the action
  condo_id IN (
    SELECT condo_id FROM users 
    WHERE id = auth.uid() AND role = 'sindico'
  )
);

-- Also allow superadmin to delete any user
DROP POLICY IF EXISTS "Superadmin_Delete_Users" ON users;

CREATE POLICY "Superadmin_Delete_Users" ON users
AS PERMISSIVE FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() AND role = 'superadmin'
  )
);

-- =============================================
-- Verification: Test the policy
-- =============================================
-- SELECT * FROM pg_policies WHERE tablename = 'users' AND cmd = 'DELETE';
