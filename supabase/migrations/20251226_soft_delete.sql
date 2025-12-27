-- =============================================
-- SOFT DELETE STRATEGY (VERSÃO CORRIGIDA)
-- Versão: 1.1
-- Data: 26/12/2024
-- Descrição: Implementa Soft Delete com verificação
--            de tabelas existentes
-- =============================================

-- ============================================
-- PARTE 1: ADICIONAR COLUNAS deleted_at
-- (Ignora tabelas que não existem)
-- ============================================

DO $$
DECLARE
    tables_to_update TEXT[] := ARRAY[
        'condos',
        'users',
        'units',
        'financial_entries',
        'ocorrencias',
        'avisos',
        'notifications',
        'reservas',
        'visitantes',
        'admin_charges',
        'support_tickets',
        'support_messages',
        'support_chats',
        'chat_messages',
        'areas_comuns',
        'moradores',
        'assinaturas',
        'suggestions',
        'suggestion_votes',
        'marketplace_ads',
        'service_recommendations',
        'marketplace_interests',
        'manutencao_schedule',
        'manutencao_history',
        'governanca_enquetes',
        'governanca_assembleias',
        'governanca_documents',
        'guest_invites',
        'mensageria_entregas',
        'chat_sindico_conversas',
        'chat_sindico_mensagens',
        'ai_interactions',
        'configuracoes_smtp',
        'email_logs',
        'turbo_entries',
        'unit_reforms',
        'fire_tax_payments',
        'building_inspections',
        'quote_audits',
        'price_learning_logs'
    ];
    t TEXT;
BEGIN
    FOREACH t IN ARRAY tables_to_update LOOP
        -- Verificar se a tabela existe
        IF EXISTS (SELECT FROM pg_tables WHERE tablename = t AND schemaname = 'public') THEN
            -- Verificar se a coluna já existe
            IF NOT EXISTS (
                SELECT FROM information_schema.columns 
                WHERE table_schema = 'public' 
                AND table_name = t 
                AND column_name = 'deleted_at'
            ) THEN
                EXECUTE format('ALTER TABLE %I ADD COLUMN deleted_at TIMESTAMPTZ DEFAULT NULL', t);
                RAISE NOTICE 'Adicionada coluna deleted_at em %', t;
            ELSE
                RAISE NOTICE 'Coluna deleted_at já existe em %', t;
            END IF;
        ELSE
            RAISE NOTICE 'Tabela % não existe, ignorando', t;
        END IF;
    END LOOP;
END $$;

-- ============================================
-- PARTE 2: CRIAR ÍNDICES PARCIAIS
-- ============================================

-- Índices principais (apenas se tabelas existirem)
DO $$
BEGIN
    -- Condos
    IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'condos') THEN
        CREATE INDEX IF NOT EXISTS idx_condos_active ON condos(id) WHERE deleted_at IS NULL;
        CREATE INDEX IF NOT EXISTS idx_condos_deleted ON condos(deleted_at) WHERE deleted_at IS NOT NULL;
    END IF;
    
    -- Users
    IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'users') THEN
        CREATE INDEX IF NOT EXISTS idx_users_active ON users(id) WHERE deleted_at IS NULL;
        CREATE INDEX IF NOT EXISTS idx_users_condo_active ON users(condo_id) WHERE deleted_at IS NULL;
        CREATE INDEX IF NOT EXISTS idx_users_deleted ON users(deleted_at) WHERE deleted_at IS NOT NULL;
    END IF;
    
    -- Units
    IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'units') THEN
        CREATE INDEX IF NOT EXISTS idx_units_active ON units(condo_id) WHERE deleted_at IS NULL;
    END IF;
    
    -- Financial entries
    IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'financial_entries') THEN
        CREATE INDEX IF NOT EXISTS idx_financial_entries_active ON financial_entries(condo_id) WHERE deleted_at IS NULL;
        CREATE INDEX IF NOT EXISTS idx_financial_entries_deleted ON financial_entries(deleted_at) WHERE deleted_at IS NOT NULL;
    END IF;
    
    -- Notifications
    IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'notifications') THEN
        CREATE INDEX IF NOT EXISTS idx_notifications_active ON notifications(user_id) WHERE deleted_at IS NULL;
    END IF;
    
    -- Marketplace
    IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'marketplace_ads') THEN
        CREATE INDEX IF NOT EXISTS idx_marketplace_ads_active ON marketplace_ads(condo_id) WHERE deleted_at IS NULL;
    END IF;
END $$;

-- ============================================
-- PARTE 3: FUNÇÃO DE SOFT DELETE CONDOMÍNIO
-- ============================================

CREATE OR REPLACE FUNCTION soft_delete_condo(p_condo_id UUID)
RETURNS JSON AS $$
DECLARE
    v_deleted_at TIMESTAMPTZ := NOW();
    v_table_name TEXT;
    v_count INTEGER := 0;
BEGIN
    -- Verificar se condomínio existe
    IF NOT EXISTS (SELECT 1 FROM condos WHERE id = p_condo_id AND (deleted_at IS NULL OR deleted_at IS NOT NULL)) THEN
        RETURN json_build_object('success', false, 'error', 'Condomínio não encontrado');
    END IF;
    
    -- Verificar se já está deletado
    IF EXISTS (SELECT 1 FROM condos WHERE id = p_condo_id AND deleted_at IS NOT NULL) THEN
        RETURN json_build_object('success', false, 'error', 'Condomínio já está deletado');
    END IF;

    -- Soft delete em tabelas que têm condo_id
    -- (Usando dynamic SQL para ignorar tabelas inexistentes)
    
    -- Financial entries
    IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'financial_entries') THEN
        UPDATE financial_entries SET deleted_at = v_deleted_at WHERE condo_id = p_condo_id AND deleted_at IS NULL;
        GET DIAGNOSTICS v_count = ROW_COUNT;
        RAISE NOTICE 'financial_entries: % registros', v_count;
    END IF;
    
    -- Notifications
    IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'notifications') THEN
        UPDATE notifications SET deleted_at = v_deleted_at WHERE condo_id = p_condo_id AND deleted_at IS NULL;
    END IF;
    
    -- Avisos
    IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'avisos') THEN
        UPDATE avisos SET deleted_at = v_deleted_at WHERE condo_id = p_condo_id AND deleted_at IS NULL;
    END IF;
    
    -- Ocorrências
    IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'ocorrencias') THEN
        UPDATE ocorrencias SET deleted_at = v_deleted_at WHERE condo_id = p_condo_id AND deleted_at IS NULL;
    END IF;
    
    -- Reservas
    IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'reservas') THEN
        UPDATE reservas SET deleted_at = v_deleted_at WHERE condo_id = p_condo_id AND deleted_at IS NULL;
    END IF;
    
    -- Visitantes
    IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'visitantes') THEN
        UPDATE visitantes SET deleted_at = v_deleted_at WHERE condo_id = p_condo_id AND deleted_at IS NULL;
    END IF;
    
    -- Admin charges
    IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'admin_charges') THEN
        UPDATE admin_charges SET deleted_at = v_deleted_at WHERE condo_id = p_condo_id AND deleted_at IS NULL;
    END IF;
    
    -- Support tickets
    IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'support_tickets') THEN
        UPDATE support_tickets SET deleted_at = v_deleted_at WHERE condo_id = p_condo_id AND deleted_at IS NULL;
    END IF;
    
    -- Support chats
    IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'support_chats') THEN
        UPDATE support_chats SET deleted_at = v_deleted_at WHERE condo_id = p_condo_id AND deleted_at IS NULL;
    END IF;
    
    -- Suggestions
    IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'suggestions') THEN
        UPDATE suggestions SET deleted_at = v_deleted_at WHERE condo_id = p_condo_id AND deleted_at IS NULL;
    END IF;
    
    -- Marketplace
    IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'marketplace_ads') THEN
        UPDATE marketplace_ads SET deleted_at = v_deleted_at WHERE condo_id = p_condo_id AND deleted_at IS NULL;
    END IF;
    
    IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'service_recommendations') THEN
        UPDATE service_recommendations SET deleted_at = v_deleted_at WHERE condo_id = p_condo_id AND deleted_at IS NULL;
    END IF;
    
    -- Governança
    IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'governanca_enquetes') THEN
        UPDATE governanca_enquetes SET deleted_at = v_deleted_at WHERE condo_id = p_condo_id AND deleted_at IS NULL;
    END IF;
    
    IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'governanca_assembleias') THEN
        UPDATE governanca_assembleias SET deleted_at = v_deleted_at WHERE condo_id = p_condo_id AND deleted_at IS NULL;
    END IF;
    
    IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'governanca_documents') THEN
        UPDATE governanca_documents SET deleted_at = v_deleted_at WHERE condo_id = p_condo_id AND deleted_at IS NULL;
    END IF;
    
    -- Mensageria
    IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'mensageria_entregas') THEN
        UPDATE mensageria_entregas SET deleted_at = v_deleted_at WHERE condo_id = p_condo_id AND deleted_at IS NULL;
    END IF;
    
    -- Chat síndico
    IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'chat_sindico_conversas') THEN
        UPDATE chat_sindico_conversas SET deleted_at = v_deleted_at WHERE condo_id = p_condo_id AND deleted_at IS NULL;
    END IF;
    
    -- Guest invites
    IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'guest_invites') THEN
        UPDATE guest_invites SET deleted_at = v_deleted_at WHERE condo_id = p_condo_id AND deleted_at IS NULL;
    END IF;
    
    -- Units
    IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'units') THEN
        UPDATE units SET deleted_at = v_deleted_at WHERE condo_id = p_condo_id AND deleted_at IS NULL;
    END IF;
    
    -- Users (exceto superadmin)
    IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'users') THEN
        UPDATE users SET deleted_at = v_deleted_at 
        WHERE condo_id = p_condo_id AND role != 'superadmin' AND deleted_at IS NULL;
    END IF;
    
    -- Assinaturas
    IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'assinaturas') THEN
        UPDATE assinaturas SET deleted_at = v_deleted_at WHERE condo_id = p_condo_id AND deleted_at IS NULL;
    END IF;
    
    -- Por fim, o condomínio
    UPDATE condos SET deleted_at = v_deleted_at WHERE id = p_condo_id;
    
    RETURN json_build_object(
        'success', true, 
        'deleted_at', v_deleted_at,
        'condo_id', p_condo_id,
        'message', 'Condomínio marcado para exclusão. Dados serão removidos após 30 dias.'
    );
    
EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- PARTE 4: FUNÇÃO DE SOFT DELETE USUÁRIO
-- ============================================

CREATE OR REPLACE FUNCTION soft_delete_user(p_user_id UUID)
RETURNS JSON AS $$
DECLARE
    v_deleted_at TIMESTAMPTZ := NOW();
BEGIN
    -- Verificar se usuário existe
    IF NOT EXISTS (SELECT 1 FROM users WHERE id = p_user_id) THEN
        RETURN json_build_object('success', false, 'error', 'Usuário não encontrado');
    END IF;
    
    -- Não permitir deletar superadmin
    IF EXISTS (SELECT 1 FROM users WHERE id = p_user_id AND role = 'superadmin') THEN
        RETURN json_build_object('success', false, 'error', 'Não é permitido excluir superadmin');
    END IF;

    -- Soft delete dados relacionados
    IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'notifications') THEN
        UPDATE notifications SET deleted_at = v_deleted_at WHERE user_id = p_user_id AND deleted_at IS NULL;
    END IF;
    
    IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'marketplace_ads') THEN
        UPDATE marketplace_ads SET deleted_at = v_deleted_at WHERE user_id = p_user_id AND deleted_at IS NULL;
    END IF;
    
    -- Soft delete usuário
    UPDATE users SET deleted_at = v_deleted_at WHERE id = p_user_id;
    
    RETURN json_build_object(
        'success', true,
        'deleted_at', v_deleted_at,
        'user_id', p_user_id
    );
    
EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- PARTE 5: HARD DELETE (LGPD - 30 dias)
-- ============================================

CREATE OR REPLACE FUNCTION hard_delete_expired_records()
RETURNS JSON AS $$
DECLARE
    v_cutoff TIMESTAMPTZ := NOW() - INTERVAL '30 days';
    v_deleted_condos INTEGER := 0;
    v_deleted_users INTEGER := 0;
BEGIN
    -- Deletar tabelas dependentes primeiro (ordem importa!)
    
    -- Tabelas com FK para outras tabelas
    IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'chat_messages') THEN
        DELETE FROM chat_messages WHERE deleted_at IS NOT NULL AND deleted_at < v_cutoff;
    END IF;
    
    IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'chat_sindico_mensagens') THEN
        DELETE FROM chat_sindico_mensagens WHERE deleted_at IS NOT NULL AND deleted_at < v_cutoff;
    END IF;
    
    IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'support_messages') THEN
        DELETE FROM support_messages WHERE deleted_at IS NOT NULL AND deleted_at < v_cutoff;
    END IF;
    
    IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'suggestion_votes') THEN
        DELETE FROM suggestion_votes WHERE deleted_at IS NOT NULL AND deleted_at < v_cutoff;
    END IF;
    
    -- Tabelas principais
    IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'notifications') THEN
        DELETE FROM notifications WHERE deleted_at IS NOT NULL AND deleted_at < v_cutoff;
    END IF;
    
    IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'financial_entries') THEN
        DELETE FROM financial_entries WHERE deleted_at IS NOT NULL AND deleted_at < v_cutoff;
    END IF;
    
    IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'marketplace_ads') THEN
        DELETE FROM marketplace_ads WHERE deleted_at IS NOT NULL AND deleted_at < v_cutoff;
    END IF;
    
    IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'service_recommendations') THEN
        DELETE FROM service_recommendations WHERE deleted_at IS NOT NULL AND deleted_at < v_cutoff;
    END IF;
    
    IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'support_tickets') THEN
        DELETE FROM support_tickets WHERE deleted_at IS NOT NULL AND deleted_at < v_cutoff;
    END IF;
    
    IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'support_chats') THEN
        DELETE FROM support_chats WHERE deleted_at IS NOT NULL AND deleted_at < v_cutoff;
    END IF;
    
    IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'suggestions') THEN
        DELETE FROM suggestions WHERE deleted_at IS NOT NULL AND deleted_at < v_cutoff;
    END IF;
    
    IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'chat_sindico_conversas') THEN
        DELETE FROM chat_sindico_conversas WHERE deleted_at IS NOT NULL AND deleted_at < v_cutoff;
    END IF;
    
    IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'guest_invites') THEN
        DELETE FROM guest_invites WHERE deleted_at IS NOT NULL AND deleted_at < v_cutoff;
    END IF;
    
    IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'mensageria_entregas') THEN
        DELETE FROM mensageria_entregas WHERE deleted_at IS NOT NULL AND deleted_at < v_cutoff;
    END IF;
    
    IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'governanca_enquetes') THEN
        DELETE FROM governanca_enquetes WHERE deleted_at IS NOT NULL AND deleted_at < v_cutoff;
    END IF;
    
    IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'governanca_assembleias') THEN
        DELETE FROM governanca_assembleias WHERE deleted_at IS NOT NULL AND deleted_at < v_cutoff;
    END IF;
    
    IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'governanca_documents') THEN
        DELETE FROM governanca_documents WHERE deleted_at IS NOT NULL AND deleted_at < v_cutoff;
    END IF;
    
    -- Units
    IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'units') THEN
        DELETE FROM units WHERE deleted_at IS NOT NULL AND deleted_at < v_cutoff;
    END IF;
    
    -- Users
    IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'users') THEN
        DELETE FROM users WHERE deleted_at IS NOT NULL AND deleted_at < v_cutoff AND role != 'superadmin';
        GET DIAGNOSTICS v_deleted_users = ROW_COUNT;
    END IF;
    
    -- Condos (por último!)
    DELETE FROM condos WHERE deleted_at IS NOT NULL AND deleted_at < v_cutoff;
    GET DIAGNOSTICS v_deleted_condos = ROW_COUNT;
    
    RETURN json_build_object(
        'success', true,
        'cutoff_date', v_cutoff,
        'condos_deleted', v_deleted_condos,
        'users_deleted', v_deleted_users,
        'executed_at', NOW()
    );
    
EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- PARTE 6: PERMISSIONS
-- ============================================

GRANT EXECUTE ON FUNCTION soft_delete_condo(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION soft_delete_user(UUID) TO authenticated;
REVOKE EXECUTE ON FUNCTION hard_delete_expired_records() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION hard_delete_expired_records() TO service_role;

-- ============================================
-- COMENTÁRIOS
-- ============================================

COMMENT ON FUNCTION soft_delete_condo(UUID) IS 'Soft delete de condomínio e dados relacionados';
COMMENT ON FUNCTION soft_delete_user(UUID) IS 'Soft delete de usuário';
COMMENT ON FUNCTION hard_delete_expired_records() IS 'Remove registros deletados há mais de 30 dias (LGPD)';

-- Mensagem de sucesso
DO $$ BEGIN RAISE NOTICE 'Soft Delete implementado com sucesso!'; END $$;
