-- ===========================================
-- CORREÇÃO DE RLS - 26/12/2024
-- Habilitar RLS nas tabelas que estão sem
-- ===========================================

-- 1. Habilitar RLS nas tabelas identificadas pelo linter
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.turbo_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.governanca_enquetes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.occurrence_comments ENABLE ROW LEVEL SECURITY;

-- 2. Políticas para notifications (já existem, mas RLS estava desabilitado)
-- As políticas existentes serão ativadas automaticamente quando RLS é habilitado

-- 3. Políticas para support_chats
DROP POLICY IF EXISTS "support_chats_select" ON public.support_chats;
DROP POLICY IF EXISTS "support_chats_insert" ON public.support_chats;
DROP POLICY IF EXISTS "support_chats_update" ON public.support_chats;

CREATE POLICY "support_chats_select" ON public.support_chats
    FOR SELECT USING (
        user_id = auth.uid()
        OR assigned_to = auth.uid()
        OR EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() 
            AND role IN ('superadmin', 'sindico')
        )
    );

CREATE POLICY "support_chats_insert" ON public.support_chats
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "support_chats_update" ON public.support_chats
    FOR UPDATE USING (
        user_id = auth.uid()
        OR assigned_to = auth.uid()
        OR EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() 
            AND role IN ('superadmin', 'sindico')
        )
    );

-- 4. Políticas para chat_messages
DROP POLICY IF EXISTS "chat_messages_select" ON public.chat_messages;
DROP POLICY IF EXISTS "chat_messages_insert" ON public.chat_messages;

CREATE POLICY "chat_messages_select" ON public.chat_messages
    FOR SELECT USING (
        sender_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM public.support_chats sc
            WHERE sc.id = chat_messages.chat_id
            AND (sc.user_id = auth.uid() OR sc.assigned_to = auth.uid())
        )
        OR EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() 
            AND role IN ('superadmin', 'sindico')
        )
    );

CREATE POLICY "chat_messages_insert" ON public.chat_messages
    FOR INSERT WITH CHECK (sender_id = auth.uid());

-- 5. Políticas para turbo_entries
DROP POLICY IF EXISTS "turbo_entries_select" ON public.turbo_entries;
DROP POLICY IF EXISTS "turbo_entries_insert" ON public.turbo_entries;
DROP POLICY IF EXISTS "turbo_entries_update" ON public.turbo_entries;

CREATE POLICY "turbo_entries_select" ON public.turbo_entries
    FOR SELECT USING (
        EXISTS (
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
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() 
            AND (
                condo_id = turbo_entries.condo_id
                OR role = 'superadmin'
            )
            AND role IN ('porteiro', 'sindico', 'superadmin')
        )
    );

CREATE POLICY "turbo_entries_update" ON public.turbo_entries
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() 
            AND (
                condo_id = turbo_entries.condo_id
                OR role = 'superadmin'
            )
        )
    );

-- 6. Políticas para governanca_enquetes
DROP POLICY IF EXISTS "governanca_enquetes_select" ON public.governanca_enquetes;
DROP POLICY IF EXISTS "governanca_enquetes_insert" ON public.governanca_enquetes;
DROP POLICY IF EXISTS "governanca_enquetes_update" ON public.governanca_enquetes;
DROP POLICY IF EXISTS "governanca_enquetes_delete" ON public.governanca_enquetes;

CREATE POLICY "governanca_enquetes_select" ON public.governanca_enquetes
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() 
            AND (
                condo_id = governanca_enquetes.condo_id
                OR role = 'superadmin'
            )
        )
    );

CREATE POLICY "governanca_enquetes_insert" ON public.governanca_enquetes
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() 
            AND (
                condo_id = governanca_enquetes.condo_id
                OR role = 'superadmin'
            )
            AND role IN ('sindico', 'superadmin')
        )
    );

CREATE POLICY "governanca_enquetes_update" ON public.governanca_enquetes
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() 
            AND (
                condo_id = governanca_enquetes.condo_id
                OR role = 'superadmin'
            )
            AND role IN ('sindico', 'superadmin')
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

-- 7. Políticas para occurrence_comments
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
            AND (
                o.criado_por_user_id = auth.uid()
                OR u.condo_id = o.condo_id
                OR u.role = 'superadmin'
            )
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

-- 8. Corrigir views com SECURITY DEFINER (mudar para SECURITY INVOKER)
-- Isso requer recriar as views

-- Nota: As views legal_acceptances_summary, support_metrics, recent_errors, invoices_view
-- precisam ser recriadas com SECURITY INVOKER. 
-- Como não tenho a definição original, isso deve ser feito manualmente no Supabase.

-- Para referência, o comando seria:
-- CREATE OR REPLACE VIEW nome_da_view 
-- WITH (security_invoker = true) AS
-- <definição original da view>;
