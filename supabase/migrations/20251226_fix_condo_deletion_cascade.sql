-- Migration: Fix Condo and User Deletion Cascade
-- Date: 2025-12-26
-- Description: Adds ON DELETE CASCADE to tables that reference users or condos to ensure a complete clean up when a condo is deleted.
-- NOTE: Uses DO blocks to safely handle cases where columns or tables may not exist.

-- 1. CHAT SINDICO
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'chat_sindico_conversas') THEN
        ALTER TABLE chat_sindico_conversas DROP CONSTRAINT IF EXISTS chat_sindico_conversas_morador_id_fkey;
        ALTER TABLE chat_sindico_conversas ADD CONSTRAINT chat_sindico_conversas_morador_id_fkey FOREIGN KEY (morador_id) REFERENCES users(id) ON DELETE CASCADE;
        
        ALTER TABLE chat_sindico_conversas DROP CONSTRAINT IF EXISTS chat_sindico_conversas_sindico_id_fkey;
        ALTER TABLE chat_sindico_conversas ADD CONSTRAINT chat_sindico_conversas_sindico_id_fkey FOREIGN KEY (sindico_id) REFERENCES users(id) ON DELETE CASCADE;
    END IF;
END $$;

DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'chat_sindico_mensagens') THEN
        ALTER TABLE chat_sindico_mensagens DROP CONSTRAINT IF EXISTS chat_sindico_mensagens_sender_id_fkey;
        ALTER TABLE chat_sindico_mensagens ADD CONSTRAINT chat_sindico_mensagens_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE;
        
        ALTER TABLE chat_sindico_mensagens DROP CONSTRAINT IF EXISTS chat_sindico_mensagens_condo_id_fkey;
        ALTER TABLE chat_sindico_mensagens ADD CONSTRAINT chat_sindico_mensagens_condo_id_fkey FOREIGN KEY (condo_id) REFERENCES condos(id) ON DELETE CASCADE;
    END IF;
END $$;

DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'chat_sindico_templates') THEN
        ALTER TABLE chat_sindico_templates DROP CONSTRAINT IF EXISTS chat_sindico_templates_sindico_id_fkey;
        ALTER TABLE chat_sindico_templates ADD CONSTRAINT chat_sindico_templates_sindico_id_fkey FOREIGN KEY (sindico_id) REFERENCES users(id) ON DELETE CASCADE;
    END IF;
END $$;


-- 2. SUGGESTIONS
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'suggestions') THEN
        ALTER TABLE suggestions DROP CONSTRAINT IF EXISTS suggestions_user_id_fkey;
        ALTER TABLE suggestions ADD CONSTRAINT suggestions_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
        
        ALTER TABLE suggestions DROP CONSTRAINT IF EXISTS suggestions_condo_id_fkey;
        ALTER TABLE suggestions ADD CONSTRAINT suggestions_condo_id_fkey FOREIGN KEY (condo_id) REFERENCES condos(id) ON DELETE CASCADE;
    END IF;
END $$;


-- 3. SUPPORT CHATS (OLD SYSTEM)
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'support_chats') THEN
        ALTER TABLE support_chats DROP CONSTRAINT IF EXISTS support_chats_user_id_fkey;
        ALTER TABLE support_chats ADD CONSTRAINT support_chats_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
        
        ALTER TABLE support_chats DROP CONSTRAINT IF EXISTS support_chats_condo_id_fkey;
        ALTER TABLE support_chats ADD CONSTRAINT support_chats_condo_id_fkey FOREIGN KEY (condo_id) REFERENCES condos(id) ON DELETE CASCADE;
    END IF;
END $$;

DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'chat_messages') THEN
        ALTER TABLE chat_messages DROP CONSTRAINT IF EXISTS chat_messages_sender_id_fkey;
        ALTER TABLE chat_messages ADD CONSTRAINT chat_messages_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE;
    END IF;
END $$;


-- 4. IMPERSONATION & AUDIT (Checks for column existence)
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'impersonations') THEN
        ALTER TABLE impersonations DROP CONSTRAINT IF EXISTS impersonations_impersonator_id_fkey;
        ALTER TABLE impersonations ADD CONSTRAINT impersonations_impersonator_id_fkey FOREIGN KEY (impersonator_id) REFERENCES users(id) ON DELETE CASCADE;
        
        ALTER TABLE impersonations DROP CONSTRAINT IF EXISTS impersonations_target_user_id_fkey;
        ALTER TABLE impersonations ADD CONSTRAINT impersonations_target_user_id_fkey FOREIGN KEY (target_user_id) REFERENCES users(id) ON DELETE CASCADE;
        
        -- Only add target_condo_id constraint if the column exists
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'impersonations' AND column_name = 'target_condo_id') THEN
            ALTER TABLE impersonations DROP CONSTRAINT IF EXISTS impersonations_target_condo_id_fkey;
            ALTER TABLE impersonations ADD CONSTRAINT impersonations_target_condo_id_fkey FOREIGN KEY (target_condo_id) REFERENCES condos(id) ON DELETE CASCADE;
        END IF;
    END IF;
END $$;

DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'impersonation_action_logs') THEN
        -- Clean up orphaned records first
        DELETE FROM impersonation_action_logs WHERE impersonator_id NOT IN (SELECT id FROM users);
        DELETE FROM impersonation_action_logs WHERE target_user_id NOT IN (SELECT id FROM users);
        
        ALTER TABLE impersonation_action_logs DROP CONSTRAINT IF EXISTS impersonation_action_logs_impersonator_id_fkey;
        ALTER TABLE impersonation_action_logs ADD CONSTRAINT impersonation_action_logs_impersonator_id_fkey FOREIGN KEY (impersonator_id) REFERENCES users(id) ON DELETE CASCADE;
        
        ALTER TABLE impersonation_action_logs DROP CONSTRAINT IF EXISTS impersonation_action_logs_target_user_id_fkey;
        ALTER TABLE impersonation_action_logs ADD CONSTRAINT impersonation_action_logs_target_user_id_fkey FOREIGN KEY (target_user_id) REFERENCES users(id) ON DELETE CASCADE;
    END IF;
END $$;

DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'audit_logs') THEN
        ALTER TABLE audit_logs DROP CONSTRAINT IF EXISTS audit_logs_user_id_fkey;
        ALTER TABLE audit_logs ADD CONSTRAINT audit_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
        
        ALTER TABLE audit_logs DROP CONSTRAINT IF EXISTS audit_logs_condo_id_fkey;
        ALTER TABLE audit_logs ADD CONSTRAINT audit_logs_condo_id_fkey FOREIGN KEY (condo_id) REFERENCES condos(id) ON DELETE CASCADE;
    END IF;
END $$;


-- 5. LEGAL ACCEPTANCES
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'legal_acceptances') THEN
        ALTER TABLE legal_acceptances DROP CONSTRAINT IF EXISTS legal_acceptances_user_id_fkey;
        ALTER TABLE legal_acceptances ADD CONSTRAINT legal_acceptances_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
    END IF;
END $$;


-- 6. OCCURRENCE COMMENTS
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'occurrence_comments') THEN
        ALTER TABLE occurrence_comments DROP CONSTRAINT IF EXISTS occurrence_comments_user_id_fkey;
        ALTER TABLE occurrence_comments ADD CONSTRAINT occurrence_comments_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
    END IF;
END $$;


-- 7. NOTIFICATIONS
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notifications') THEN
        ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_condo_id_fkey;
        ALTER TABLE notifications ADD CONSTRAINT notifications_condo_id_fkey FOREIGN KEY (condo_id) REFERENCES condos(id) ON DELETE CASCADE;
        
        ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_user_id_fkey;
        ALTER TABLE notifications ADD CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
    END IF;
END $$;


-- 8. INTEGRATIONS
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'condo_integrations') THEN
        ALTER TABLE condo_integrations DROP CONSTRAINT IF EXISTS condo_integrations_created_by_fkey;
        ALTER TABLE condo_integrations ADD CONSTRAINT condo_integrations_created_by_fkey FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL;
    END IF;
END $$;

DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'integration_logs') THEN
        ALTER TABLE integration_logs DROP CONSTRAINT IF EXISTS integration_logs_condo_id_fkey;
        ALTER TABLE integration_logs ADD CONSTRAINT integration_logs_condo_id_fkey FOREIGN KEY (condo_id) REFERENCES condos(id) ON DELETE CASCADE;
    END IF;
END $$;



-- 9. USERS -> CONDOS (The main constraint that was failing)
DO $$ BEGIN
    ALTER TABLE users DROP CONSTRAINT IF EXISTS users_condo_id_fkey;
    ALTER TABLE users ADD CONSTRAINT users_condo_id_fkey FOREIGN KEY (condo_id) REFERENCES condos(id) ON DELETE CASCADE;
END $$;


-- 10. SUBSCRIPTIONS -> CONDOS
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'subscriptions') THEN
        ALTER TABLE subscriptions DROP CONSTRAINT IF EXISTS subscriptions_condo_id_fkey;
        ALTER TABLE subscriptions ADD CONSTRAINT subscriptions_condo_id_fkey FOREIGN KEY (condo_id) REFERENCES condos(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Migration completed!
