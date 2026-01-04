-- =============================================
-- Migration: Create condo_sidebar_config table
-- Date: 2026-01-04
-- =============================================

CREATE TABLE IF NOT EXISTS condo_sidebar_config (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    condo_id UUID NOT NULL REFERENCES condos(id) ON DELETE CASCADE,
    menu_items JSONB DEFAULT '[]'::jsonb,
    theme JSONB DEFAULT '{}'::jsonb,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
    UNIQUE(condo_id)
);

-- Enable RLS
ALTER TABLE condo_sidebar_config ENABLE ROW LEVEL SECURITY;

-- Policies

-- 1. Read access: Allow all authenticated users from the same condo
CREATE POLICY "sidebar_config_read_condo" ON condo_sidebar_config
    FOR SELECT
    TO authenticated
    USING (
        condo_id IN (
            SELECT condo_id FROM users WHERE id = auth.uid()
        )
        OR
        EXISTS (
            SELECT 1 FROM users WHERE id = auth.uid() AND role = 'superadmin'
        )
    );

-- 2. Write access: Allow sindico from same condo or superadmin
CREATE POLICY "sidebar_config_write_sindico" ON condo_sidebar_config
    FOR ALL
    TO authenticated
    USING (
        (
            condo_id IN (
                SELECT condo_id FROM users WHERE id = auth.uid() AND role = 'sindico'
            )
        )
        OR
        EXISTS (
            SELECT 1 FROM users WHERE id = auth.uid() AND role = 'superadmin'
        )
    );
