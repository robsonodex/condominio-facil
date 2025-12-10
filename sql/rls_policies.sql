-- =============================================
-- RLS Policies Review & Enhancement
-- Execute in Supabase SQL Editor
-- =============================================

-- NOTE: This file contains reviewed policies.
-- Some may already exist - errors on creation are OK.

-- =============================================
-- SUBSCRIPTIONS - Allow síndico to see their own
-- =============================================

-- Drop existing restrictive policy if exists
DROP POLICY IF EXISTS "Superadmin access subscriptions" ON subscriptions;

-- Superadmin full access
CREATE POLICY "subscriptions_superadmin" ON subscriptions
    FOR ALL USING (
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'superadmin')
    );

-- Síndico can read their own subscription
CREATE POLICY "subscriptions_sindico_read" ON subscriptions
    FOR SELECT USING (
        condo_id = (SELECT condo_id FROM users WHERE id = auth.uid() AND role = 'sindico')
    );

-- =============================================
-- FINANCIAL_ENTRIES - Enhanced policies
-- =============================================

-- Drop existing policies
DROP POLICY IF EXISTS "Superadmin and sindico access financial" ON financial_entries;
DROP POLICY IF EXISTS "Morador sees own unit financial" ON financial_entries;

-- Superadmin full access
CREATE POLICY "financial_superadmin" ON financial_entries
    FOR ALL USING (
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'superadmin')
    );

-- Síndico full access to their condo
CREATE POLICY "financial_sindico" ON financial_entries
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role = 'sindico' 
            AND condo_id = financial_entries.condo_id
        )
    );

-- Morador read-only on their unit
CREATE POLICY "financial_morador_read" ON financial_entries
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role = 'morador' 
            AND unidade_id = financial_entries.unidade_id
        )
    );

-- =============================================
-- VISITORS - Enhanced policies
-- =============================================

-- Drop existing policy
DROP POLICY IF EXISTS "Access visitors" ON visitors;

-- Superadmin full access
CREATE POLICY "visitors_superadmin" ON visitors
    FOR ALL USING (
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'superadmin')
    );

-- Síndico full access to their condo
CREATE POLICY "visitors_sindico" ON visitors
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role = 'sindico' 
            AND condo_id = visitors.condo_id
        )
    );

-- Porteiro full access to their condo
CREATE POLICY "visitors_porteiro" ON visitors
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role = 'porteiro' 
            AND condo_id = visitors.condo_id
        )
    );

-- Morador read-only on their unit's visitors
CREATE POLICY "visitors_morador_read" ON visitors
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role = 'morador' 
            AND unidade_id = visitors.unidade_id
        )
    );

-- =============================================
-- RESIDENTS - Enhanced policies
-- =============================================

-- Drop existing policy
DROP POLICY IF EXISTS "Access residents" ON residents;

-- Superadmin full access
CREATE POLICY "residents_superadmin" ON residents
    FOR ALL USING (
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'superadmin')
    );

-- Síndico full access to their condo
CREATE POLICY "residents_sindico" ON residents
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role = 'sindico' 
            AND condo_id = residents.condo_id
        )
    );

-- Porteiro read-only to their condo residents
CREATE POLICY "residents_porteiro_read" ON residents
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role = 'porteiro' 
            AND condo_id = residents.condo_id
        )
    );

-- =============================================
-- Done! Run this in Supabase SQL Editor
-- =============================================
