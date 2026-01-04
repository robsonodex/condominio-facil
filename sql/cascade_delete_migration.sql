-- =============================================
-- Migration: Add ON DELETE CASCADE to Foreign Keys
-- Execute in Supabase SQL Editor (Staging first!)
-- Date: 2026-01-04 (FIXED VERSION)
-- =============================================

-- IMPORTANT: This version uses DO blocks to safely check
-- if tables/columns exist before altering them

-- =============================================
-- Helper function to safely add cascade
-- =============================================
DO $$
DECLARE
    tables_to_update TEXT[] := ARRAY[
        'users',
        'units',
        'residents',
        'notices',
        'notice_reads',
        'occurrences',
        'visitors',
        'deliveries',
        'common_areas',
        'reservations',
        'financial_entries',
        'documents',
        'subscriptions',
        'payments',
        'resident_invoices',
        'maintenance_orders',
        'maintenance_suppliers',
        'audit_logs',
        'suggestions',
        'notifications',
        'chat_sindico_conversas',
        'chat_sindico_templates',
        'chat_sindico_mensagens',
        'support_chats',
        'integration_logs',
        'condo_integrations',
        'condo_features',
        'condo_certificates',
        'enquetes',
        'enquete_votes',
        'assembleias',
        'polls'
    ];
    tbl TEXT;
    constraint_name TEXT;
BEGIN
    FOREACH tbl IN ARRAY tables_to_update
    LOOP
        -- Check if table exists
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = tbl AND table_schema = 'public') THEN
            -- Check if condo_id column exists
            IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = tbl AND column_name = 'condo_id' AND table_schema = 'public') THEN
                -- Find existing constraint name
                SELECT conname INTO constraint_name
                FROM pg_constraint c
                JOIN pg_class t ON c.conrelid = t.oid
                JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = ANY(c.conkey)
                WHERE t.relname = tbl
                  AND a.attname = 'condo_id'
                  AND c.contype = 'f'
                LIMIT 1;
                
                IF constraint_name IS NOT NULL THEN
                    -- Drop existing constraint
                    EXECUTE format('ALTER TABLE %I DROP CONSTRAINT IF EXISTS %I', tbl, constraint_name);
                    RAISE NOTICE 'Dropped constraint % on %', constraint_name, tbl;
                END IF;
                
                -- Add new constraint with CASCADE
                EXECUTE format('ALTER TABLE %I ADD CONSTRAINT %I_condo_id_fkey FOREIGN KEY (condo_id) REFERENCES condos(id) ON DELETE CASCADE', tbl, tbl);
                RAISE NOTICE 'Added CASCADE constraint to %', tbl;
            ELSE
                RAISE NOTICE 'Table % does not have condo_id column, skipping', tbl;
            END IF;
        ELSE
            RAISE NOTICE 'Table % does not exist, skipping', tbl;
        END IF;
    END LOOP;
END $$;

-- =============================================
-- Special case: impersonations has target_condo_id
-- =============================================
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'impersonations' AND table_schema = 'public') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'impersonations' AND column_name = 'target_condo_id' AND table_schema = 'public') THEN
            ALTER TABLE impersonations DROP CONSTRAINT IF EXISTS impersonations_target_condo_id_fkey;
            ALTER TABLE impersonations ADD CONSTRAINT impersonations_target_condo_id_fkey 
                FOREIGN KEY (target_condo_id) REFERENCES condos(id) ON DELETE CASCADE;
            RAISE NOTICE 'Added CASCADE to impersonations.target_condo_id';
        END IF;
    END IF;
END $$;

-- =============================================
-- Verification Query (run after migration)
-- =============================================
-- SELECT 
--     tc.table_name, 
--     tc.constraint_name,
--     rc.delete_rule
-- FROM information_schema.table_constraints tc
-- JOIN information_schema.referential_constraints rc 
--     ON tc.constraint_name = rc.constraint_name
-- WHERE rc.delete_rule = 'CASCADE'
--   AND tc.constraint_type = 'FOREIGN KEY'
-- ORDER BY tc.table_name;
