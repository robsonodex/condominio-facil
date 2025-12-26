-- ===========================================
-- CORREÇÃO DE RLS - 26/12/2024
-- Baseado na estrutura REAL das tabelas
-- ===========================================

-- 1. Habilitar RLS nas tabelas
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.turbo_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.governanca_enquetes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.occurrence_comments ENABLE ROW LEVEL SECURITY;

-- ===========================================
-- 2. NOTIFICATIONS (user_id, condo_id)
-- ===========================================
DROP POLICY IF EXISTS "notifications_select" ON public.notifications;
DROP POLICY IF EXISTS "notifications_insert" ON public.notifications;
DROP POLICY IF EXISTS "notifications_update" ON public.notifications;

CREATE POLICY "notifications_select" ON public.notifications
    FOR SELECT USING (
        user_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() 
            AND (role = 'superadmin' OR (role = 'sindico' AND condo_id = notifications.condo_id))
        )
    );

CREATE POLICY "notifications_insert" ON public.notifications
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() 
            AND role IN ('superadmin', 'sindico')
        )
    );

CREATE POLICY "notifications_update" ON public.notifications
    FOR UPDATE USING (
        user_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() 
            AND role IN ('superadmin', 'sindico')
        )
    );

-- ===========================================
-- 3. SUPPORT_CHATS (user_id, condo_id, atendente_id)
-- ===========================================
DROP POLICY IF EXISTS "support_chats_select" ON public.support_chats;
DROP POLICY IF EXISTS "support_chats_insert" ON public.support_chats;
DROP POLICY IF EXISTS "support_chats_update" ON public.support_chats;

CREATE POLICY "support_chats_select" ON public.support_chats
    FOR SELECT USING (
        user_id = auth.uid()
        OR atendente_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() 
            AND role = 'superadmin'
        )
    );

CREATE POLICY "support_chats_insert" ON public.support_chats
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "support_chats_update" ON public.support_chats
    FOR UPDATE USING (
        user_id = auth.uid()
        OR atendente_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() 
            AND role = 'superadmin'
        )
    );

-- ===========================================
-- 4. CHAT_MESSAGES (sender_id, chat_id)
-- ===========================================
DROP POLICY IF EXISTS "chat_messages_select" ON public.chat_messages;
DROP POLICY IF EXISTS "chat_messages_insert" ON public.chat_messages;

CREATE POLICY "chat_messages_select" ON public.chat_messages
    FOR SELECT USING (
        sender_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM public.support_chats sc
            WHERE sc.id = chat_messages.chat_id
            AND (sc.user_id = auth.uid() OR sc.atendente_id = auth.uid())
        )
        OR EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() 
            AND role = 'superadmin'
        )
    );

CREATE POLICY "chat_messages_insert" ON public.chat_messages
    FOR INSERT WITH CHECK (sender_id = auth.uid());

-- ===========================================
-- 5. TURBO_ENTRIES (condo_id, porteiro_id)
-- ===========================================
DROP POLICY IF EXISTS "turbo_entries_select" ON public.turbo_entries;
DROP POLICY IF EXISTS "turbo_entries_insert" ON public.turbo_entries;
DROP POLICY IF EXISTS "turbo_entries_update" ON public.turbo_entries;

CREATE POLICY "turbo_entries_select" ON public.turbo_entries
    FOR SELECT USING (
        porteiro_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() 
            AND (
                condo_id = turbo_entries.condo_id
                OR role = 'superadmin'
            )
        )
    );

CREATE POLICY "turbo_entries_insert" ON public.turbo_entries
    FOR INSERT WITH CHECK (
        porteiro_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() 
            AND role IN ('porteiro', 'sindico', 'superadmin')
            AND (condo_id = turbo_entries.condo_id OR role = 'superadmin')
        )
    );

CREATE POLICY "turbo_entries_update" ON public.turbo_entries
    FOR UPDATE USING (
        porteiro_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() 
            AND (
                condo_id = turbo_entries.condo_id
                OR role = 'superadmin'
            )
        )
    );

-- ===========================================
-- 6. GOVERNANCA_ENQUETES (condo_id)
-- ===========================================
DROP POLICY IF EXISTS "governanca_enquetes_select" ON public.governanca_enquetes;
DROP POLICY IF EXISTS "governanca_enquetes_insert" ON public.governanca_enquetes;
DROP POLICY IF EXISTS "governanca_enquetes_update" ON public.governanca_enquetes;
DROP POLICY IF EXISTS "governanca_enquetes_delete" ON public.governanca_enquetes;

CREATE POLICY "governanca_enquetes_select" ON public.governanca_enquetes
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() 
            AND (condo_id = governanca_enquetes.condo_id OR role = 'superadmin')
        )
    );

CREATE POLICY "governanca_enquetes_insert" ON public.governanca_enquetes
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() 
            AND role IN ('sindico', 'superadmin')
            AND (condo_id = governanca_enquetes.condo_id OR role = 'superadmin')
        )
    );

CREATE POLICY "governanca_enquetes_update" ON public.governanca_enquetes
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() 
            AND role IN ('sindico', 'superadmin')
            AND (condo_id = governanca_enquetes.condo_id OR role = 'superadmin')
        )
    );

CREATE POLICY "governanca_enquetes_delete" ON public.governanca_enquetes
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() 
            AND role IN ('sindico', 'superadmin')
        )
    );

-- ===========================================
-- 7. OCCURRENCE_COMMENTS (user_id, occurrence_id)
-- ===========================================
DROP POLICY IF EXISTS "occurrence_comments_select" ON public.occurrence_comments;
DROP POLICY IF EXISTS "occurrence_comments_insert" ON public.occurrence_comments;
DROP POLICY IF EXISTS "occurrence_comments_update" ON public.occurrence_comments;
DROP POLICY IF EXISTS "occurrence_comments_delete" ON public.occurrence_comments;

CREATE POLICY "occurrence_comments_select" ON public.occurrence_comments
    FOR SELECT USING (
        user_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM public.occurrences o
            JOIN public.users u ON u.id = auth.uid()
            WHERE o.id = occurrence_comments.occurrence_id
            AND (u.condo_id = o.condo_id OR u.role = 'superadmin')
        )
    );

CREATE POLICY "occurrence_comments_insert" ON public.occurrence_comments
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "occurrence_comments_update" ON public.occurrence_comments
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "occurrence_comments_delete" ON public.occurrence_comments
    FOR DELETE USING (
        user_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() 
            AND role IN ('sindico', 'superadmin')
        )
    );
