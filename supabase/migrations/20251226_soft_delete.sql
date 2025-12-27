-- =============================================
-- SOFT DELETE STRATEGY
-- Versão: 1.0
-- Data: 26/12/2024
-- Descrição: Implementa Soft Delete para evitar
--            timeouts em exclusões em cascata
-- =============================================

-- ============================================
-- PARTE 1: ADICIONAR COLUNAS deleted_at
-- ============================================

-- Função helper para adicionar deleted_at se não existir
CREATE OR REPLACE FUNCTION add_deleted_at_column(table_name TEXT)
RETURNS VOID AS $$
BEGIN
    EXECUTE format('
        ALTER TABLE %I 
        ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL
    ', table_name);
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Erro ao adicionar deleted_at em %: %', table_name, SQLERRM;
END;
$$ LANGUAGE plpgsql;

-- Tabelas principais
SELECT add_deleted_at_column('condos');
SELECT add_deleted_at_column('users');
SELECT add_deleted_at_column('units');
SELECT add_deleted_at_column('financial_entries');
SELECT add_deleted_at_column('occurrences');
SELECT add_deleted_at_column('billings');
SELECT add_deleted_at_column('notices');
SELECT add_deleted_at_column('notifications');
SELECT add_deleted_at_column('reservations');
SELECT add_deleted_at_column('visitors');
SELECT add_deleted_at_column('deliveries');
SELECT add_deleted_at_column('chat_conversations');
SELECT add_deleted_at_column('chat_messages');
SELECT add_deleted_at_column('support_tickets');
SELECT add_deleted_at_column('support_messages');
SELECT add_deleted_at_column('common_areas');
SELECT add_deleted_at_column('residents');
SELECT add_deleted_at_column('subscriptions');
SELECT add_deleted_at_column('marketplace_ads');
SELECT add_deleted_at_column('service_recommendations');
SELECT add_deleted_at_column('maintenance_orders');
SELECT add_deleted_at_column('suppliers');
SELECT add_deleted_at_column('assemblies');
SELECT add_deleted_at_column('polls');
SELECT add_deleted_at_column('documents');
SELECT add_deleted_at_column('qr_passes');

-- Remover função helper (não mais necessária)
DROP FUNCTION IF EXISTS add_deleted_at_column(TEXT);

-- ============================================
-- PARTE 2: CRIAR ÍNDICES PARCIAIS
-- (Apenas registros ativos, muito mais rápido)
-- ============================================

-- Índices para busca de registros ativos
CREATE INDEX IF NOT EXISTS idx_condos_active 
ON condos(id) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_users_active 
ON users(id) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_users_condo_active 
ON users(condo_id) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_units_active 
ON units(condo_id) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_financial_entries_active 
ON financial_entries(condo_id) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_occurrences_active 
ON occurrences(condo_id) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_billings_active 
ON billings(condo_id) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_notices_active 
ON notices(condo_id) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_notifications_active 
ON notifications(user_id) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_reservations_active 
ON reservations(condo_id) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_visitors_active 
ON visitors(condo_id) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_deliveries_active 
ON deliveries(condo_id) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_chat_conversations_active 
ON chat_conversations(condo_id) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_marketplace_ads_active 
ON marketplace_ads(condo_id) WHERE deleted_at IS NULL;

-- Índices para limpeza (registros deletados há mais de 30 dias)
CREATE INDEX IF NOT EXISTS idx_condos_deleted 
ON condos(deleted_at) WHERE deleted_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_users_deleted 
ON users(deleted_at) WHERE deleted_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_financial_entries_deleted 
ON financial_entries(deleted_at) WHERE deleted_at IS NOT NULL;

-- ============================================
-- PARTE 3: VIEWS PARA DADOS ATIVOS
-- (Alternativa se RLS for complexo demais)
-- ============================================

-- View de condomínios ativos
CREATE OR REPLACE VIEW active_condos AS
SELECT * FROM condos WHERE deleted_at IS NULL;

-- View de usuários ativos
CREATE OR REPLACE VIEW active_users AS
SELECT * FROM users WHERE deleted_at IS NULL;

-- View de unidades ativas
CREATE OR REPLACE VIEW active_units AS
SELECT * FROM units WHERE deleted_at IS NULL;

-- ============================================
-- PARTE 4: FUNÇÕES DE SOFT DELETE
-- ============================================

-- Função para soft delete de um condomínio e todos os dados relacionados
CREATE OR REPLACE FUNCTION soft_delete_condo(p_condo_id UUID)
RETURNS JSON AS $$
DECLARE
    v_deleted_at TIMESTAMPTZ := NOW();
    v_counts JSON;
BEGIN
    -- Verificar se condomínio existe e não está deletado
    IF NOT EXISTS (SELECT 1 FROM condos WHERE id = p_condo_id AND deleted_at IS NULL) THEN
        RETURN json_build_object('success', false, 'error', 'Condomínio não encontrado ou já deletado');
    END IF;

    -- Soft delete em cascata (ordem importa para evitar FK violations em hard delete futuro)
    
    -- 1. Mensagens de chat
    UPDATE chat_messages SET deleted_at = v_deleted_at
    WHERE conversation_id IN (
        SELECT id FROM chat_conversations WHERE condo_id = p_condo_id
    ) AND deleted_at IS NULL;
    
    -- 2. Conversas de chat
    UPDATE chat_conversations SET deleted_at = v_deleted_at
    WHERE condo_id = p_condo_id AND deleted_at IS NULL;
    
    -- 3. Mensagens de suporte
    UPDATE support_messages SET deleted_at = v_deleted_at
    WHERE ticket_id IN (
        SELECT id FROM support_tickets WHERE condo_id = p_condo_id
    ) AND deleted_at IS NULL;
    
    -- 4. Tickets de suporte
    UPDATE support_tickets SET deleted_at = v_deleted_at
    WHERE condo_id = p_condo_id AND deleted_at IS NULL;
    
    -- 5. Notificações
    UPDATE notifications SET deleted_at = v_deleted_at
    WHERE condo_id = p_condo_id AND deleted_at IS NULL;
    
    -- 6. Entregas
    UPDATE deliveries SET deleted_at = v_deleted_at
    WHERE condo_id = p_condo_id AND deleted_at IS NULL;
    
    -- 7. Visitantes
    UPDATE visitors SET deleted_at = v_deleted_at
    WHERE condo_id = p_condo_id AND deleted_at IS NULL;
    
    -- 8. Reservas
    UPDATE reservations SET deleted_at = v_deleted_at
    WHERE condo_id = p_condo_id AND deleted_at IS NULL;
    
    -- 9. Áreas comuns
    UPDATE common_areas SET deleted_at = v_deleted_at
    WHERE condo_id = p_condo_id AND deleted_at IS NULL;
    
    -- 10. Ocorrências
    UPDATE occurrences SET deleted_at = v_deleted_at
    WHERE condo_id = p_condo_id AND deleted_at IS NULL;
    
    -- 11. Cobranças
    UPDATE billings SET deleted_at = v_deleted_at
    WHERE condo_id = p_condo_id AND deleted_at IS NULL;
    
    -- 12. Lançamentos financeiros
    UPDATE financial_entries SET deleted_at = v_deleted_at
    WHERE condo_id = p_condo_id AND deleted_at IS NULL;
    
    -- 13. Avisos
    UPDATE notices SET deleted_at = v_deleted_at
    WHERE condo_id = p_condo_id AND deleted_at IS NULL;
    
    -- 14. Marketplace
    UPDATE marketplace_ads SET deleted_at = v_deleted_at
    WHERE condo_id = p_condo_id AND deleted_at IS NULL;
    
    UPDATE service_recommendations SET deleted_at = v_deleted_at
    WHERE condo_id = p_condo_id AND deleted_at IS NULL;
    
    -- 15. Manutenção
    UPDATE maintenance_orders SET deleted_at = v_deleted_at
    WHERE condo_id = p_condo_id AND deleted_at IS NULL;
    
    UPDATE suppliers SET deleted_at = v_deleted_at
    WHERE condo_id = p_condo_id AND deleted_at IS NULL;
    
    -- 16. Governança
    UPDATE assemblies SET deleted_at = v_deleted_at
    WHERE condo_id = p_condo_id AND deleted_at IS NULL;
    
    UPDATE polls SET deleted_at = v_deleted_at
    WHERE condo_id = p_condo_id AND deleted_at IS NULL;
    
    UPDATE documents SET deleted_at = v_deleted_at
    WHERE condo_id = p_condo_id AND deleted_at IS NULL;
    
    -- 17. QR Passes
    UPDATE qr_passes SET deleted_at = v_deleted_at
    WHERE condo_id = p_condo_id AND deleted_at IS NULL;
    
    -- 18. Moradores/Residents
    UPDATE residents SET deleted_at = v_deleted_at
    WHERE unit_id IN (
        SELECT id FROM units WHERE condo_id = p_condo_id
    ) AND deleted_at IS NULL;
    
    -- 19. Unidades
    UPDATE units SET deleted_at = v_deleted_at
    WHERE condo_id = p_condo_id AND deleted_at IS NULL;
    
    -- 20. Usuários do condomínio (exceto superadmin)
    UPDATE users SET deleted_at = v_deleted_at
    WHERE condo_id = p_condo_id 
    AND role != 'superadmin'
    AND deleted_at IS NULL;
    
    -- 21. Assinaturas
    UPDATE subscriptions SET deleted_at = v_deleted_at
    WHERE condo_id = p_condo_id AND deleted_at IS NULL;
    
    -- 22. Por fim, o condomínio
    UPDATE condos SET deleted_at = v_deleted_at
    WHERE id = p_condo_id AND deleted_at IS NULL;
    
    RETURN json_build_object(
        'success', true, 
        'deleted_at', v_deleted_at,
        'condo_id', p_condo_id,
        'message', 'Condomínio marcado para exclusão. Dados serão removidos permanentemente após 30 dias.'
    );
    
EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para soft delete de um usuário
CREATE OR REPLACE FUNCTION soft_delete_user(p_user_id UUID)
RETURNS JSON AS $$
DECLARE
    v_deleted_at TIMESTAMPTZ := NOW();
BEGIN
    -- Verificar se usuário existe
    IF NOT EXISTS (SELECT 1 FROM users WHERE id = p_user_id AND deleted_at IS NULL) THEN
        RETURN json_build_object('success', false, 'error', 'Usuário não encontrado ou já deletado');
    END IF;
    
    -- Não permitir deletar superadmin
    IF EXISTS (SELECT 1 FROM users WHERE id = p_user_id AND role = 'superadmin') THEN
        RETURN json_build_object('success', false, 'error', 'Não é permitido excluir superadmin');
    END IF;

    -- Soft delete dados relacionados
    UPDATE notifications SET deleted_at = v_deleted_at
    WHERE user_id = p_user_id AND deleted_at IS NULL;
    
    UPDATE chat_conversations SET deleted_at = v_deleted_at
    WHERE user_id = p_user_id AND deleted_at IS NULL;
    
    UPDATE occurrences SET deleted_at = v_deleted_at
    WHERE user_id = p_user_id AND deleted_at IS NULL;
    
    UPDATE reservations SET deleted_at = v_deleted_at
    WHERE user_id = p_user_id AND deleted_at IS NULL;
    
    UPDATE marketplace_ads SET deleted_at = v_deleted_at
    WHERE user_id = p_user_id AND deleted_at IS NULL;
    
    -- Soft delete usuário
    UPDATE users SET deleted_at = v_deleted_at
    WHERE id = p_user_id AND deleted_at IS NULL;
    
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

-- Função para hard delete de registros antigos
CREATE OR REPLACE FUNCTION hard_delete_expired_records()
RETURNS JSON AS $$
DECLARE
    v_cutoff TIMESTAMPTZ := NOW() - INTERVAL '30 days';
    v_deleted_condos INTEGER := 0;
    v_deleted_users INTEGER := 0;
    v_deleted_records INTEGER := 0;
BEGIN
    -- ORDEM CRÍTICA: Deletar de baixo para cima (dependências primeiro)
    
    -- 1. Chat messages
    DELETE FROM chat_messages 
    WHERE deleted_at IS NOT NULL AND deleted_at < v_cutoff;
    GET DIAGNOSTICS v_deleted_records = ROW_COUNT;
    
    -- 2. Chat conversations  
    DELETE FROM chat_conversations 
    WHERE deleted_at IS NOT NULL AND deleted_at < v_cutoff;
    
    -- 3. Support messages
    DELETE FROM support_messages 
    WHERE deleted_at IS NOT NULL AND deleted_at < v_cutoff;
    
    -- 4. Support tickets
    DELETE FROM support_tickets 
    WHERE deleted_at IS NOT NULL AND deleted_at < v_cutoff;
    
    -- 5. Notifications
    DELETE FROM notifications 
    WHERE deleted_at IS NOT NULL AND deleted_at < v_cutoff;
    
    -- 6. Deliveries
    DELETE FROM deliveries 
    WHERE deleted_at IS NOT NULL AND deleted_at < v_cutoff;
    
    -- 7. Visitors
    DELETE FROM visitors 
    WHERE deleted_at IS NOT NULL AND deleted_at < v_cutoff;
    
    -- 8. Reservations
    DELETE FROM reservations 
    WHERE deleted_at IS NOT NULL AND deleted_at < v_cutoff;
    
    -- 9. Common areas
    DELETE FROM common_areas 
    WHERE deleted_at IS NOT NULL AND deleted_at < v_cutoff;
    
    -- 10. Occurrences
    DELETE FROM occurrences 
    WHERE deleted_at IS NOT NULL AND deleted_at < v_cutoff;
    
    -- 11. Billings
    DELETE FROM billings 
    WHERE deleted_at IS NOT NULL AND deleted_at < v_cutoff;
    
    -- 12. Financial entries
    DELETE FROM financial_entries 
    WHERE deleted_at IS NOT NULL AND deleted_at < v_cutoff;
    
    -- 13. Notices
    DELETE FROM notices 
    WHERE deleted_at IS NOT NULL AND deleted_at < v_cutoff;
    
    -- 14. Marketplace
    DELETE FROM marketplace_ads 
    WHERE deleted_at IS NOT NULL AND deleted_at < v_cutoff;
    
    DELETE FROM service_recommendations 
    WHERE deleted_at IS NOT NULL AND deleted_at < v_cutoff;
    
    -- 15. Maintenance
    DELETE FROM maintenance_orders 
    WHERE deleted_at IS NOT NULL AND deleted_at < v_cutoff;
    
    DELETE FROM suppliers 
    WHERE deleted_at IS NOT NULL AND deleted_at < v_cutoff;
    
    -- 16. Governance
    DELETE FROM assemblies 
    WHERE deleted_at IS NOT NULL AND deleted_at < v_cutoff;
    
    DELETE FROM polls 
    WHERE deleted_at IS NOT NULL AND deleted_at < v_cutoff;
    
    DELETE FROM documents 
    WHERE deleted_at IS NOT NULL AND deleted_at < v_cutoff;
    
    -- 17. QR Passes
    DELETE FROM qr_passes 
    WHERE deleted_at IS NOT NULL AND deleted_at < v_cutoff;
    
    -- 18. Residents
    DELETE FROM residents 
    WHERE deleted_at IS NOT NULL AND deleted_at < v_cutoff;
    
    -- 19. Units
    DELETE FROM units 
    WHERE deleted_at IS NOT NULL AND deleted_at < v_cutoff;
    
    -- 20. Users
    DELETE FROM users 
    WHERE deleted_at IS NOT NULL AND deleted_at < v_cutoff;
    GET DIAGNOSTICS v_deleted_users = ROW_COUNT;
    
    -- 21. Subscriptions
    DELETE FROM subscriptions 
    WHERE deleted_at IS NOT NULL AND deleted_at < v_cutoff;
    
    -- 22. Condos (por último!)
    DELETE FROM condos 
    WHERE deleted_at IS NOT NULL AND deleted_at < v_cutoff;
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
-- PARTE 6: ATUALIZAR RLS POLICIES
-- ============================================

-- Função helper para verificar se registro está ativo
CREATE OR REPLACE FUNCTION is_active_record(p_deleted_at TIMESTAMPTZ)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN p_deleted_at IS NULL;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Recriar policies principais com filtro de deleted_at
-- NOTA: Executar apenas se as policies existirem

-- CONDOS
DROP POLICY IF EXISTS "condos_select_active" ON condos;
CREATE POLICY "condos_select_active" ON condos FOR SELECT
USING (deleted_at IS NULL);

-- USERS  
DROP POLICY IF EXISTS "users_select_active" ON users;
CREATE POLICY "users_select_active" ON users FOR SELECT
USING (deleted_at IS NULL OR id = auth.uid());

-- UNITS
DROP POLICY IF EXISTS "units_select_active" ON units;
CREATE POLICY "units_select_active" ON units FOR SELECT
USING (deleted_at IS NULL);

-- FINANCIAL_ENTRIES
DROP POLICY IF EXISTS "financial_entries_select_active" ON financial_entries;
CREATE POLICY "financial_entries_select_active" ON financial_entries FOR SELECT
USING (deleted_at IS NULL);

-- OCCURRENCES
DROP POLICY IF EXISTS "occurrences_select_active" ON occurrences;
CREATE POLICY "occurrences_select_active" ON occurrences FOR SELECT
USING (deleted_at IS NULL);

-- BILLINGS
DROP POLICY IF EXISTS "billings_select_active" ON billings;
CREATE POLICY "billings_select_active" ON billings FOR SELECT
USING (deleted_at IS NULL);

-- NOTICES
DROP POLICY IF EXISTS "notices_select_active" ON notices;
CREATE POLICY "notices_select_active" ON notices FOR SELECT
USING (deleted_at IS NULL);

-- NOTIFICATIONS
DROP POLICY IF EXISTS "notifications_select_active" ON notifications;
CREATE POLICY "notifications_select_active" ON notifications FOR SELECT
USING (deleted_at IS NULL);

-- RESERVATIONS
DROP POLICY IF EXISTS "reservations_select_active" ON reservations;
CREATE POLICY "reservations_select_active" ON reservations FOR SELECT
USING (deleted_at IS NULL);

-- VISITORS
DROP POLICY IF EXISTS "visitors_select_active" ON visitors;
CREATE POLICY "visitors_select_active" ON visitors FOR SELECT
USING (deleted_at IS NULL);

-- DELIVERIES
DROP POLICY IF EXISTS "deliveries_select_active" ON deliveries;
CREATE POLICY "deliveries_select_active" ON deliveries FOR SELECT
USING (deleted_at IS NULL);

-- CHAT_CONVERSATIONS
DROP POLICY IF EXISTS "chat_conversations_select_active" ON chat_conversations;
CREATE POLICY "chat_conversations_select_active" ON chat_conversations FOR SELECT
USING (deleted_at IS NULL);

-- CHAT_MESSAGES
DROP POLICY IF EXISTS "chat_messages_select_active" ON chat_messages;
CREATE POLICY "chat_messages_select_active" ON chat_messages FOR SELECT
USING (deleted_at IS NULL);

-- MARKETPLACE_ADS
DROP POLICY IF EXISTS "marketplace_ads_select_active" ON marketplace_ads;
CREATE POLICY "marketplace_ads_select_active" ON marketplace_ads FOR SELECT
USING (deleted_at IS NULL);

-- ============================================
-- PARTE 7: COMENTÁRIOS E DOCUMENTAÇÃO
-- ============================================

COMMENT ON FUNCTION soft_delete_condo(UUID) IS 
'Marca um condomínio e todos os dados relacionados como deletados (soft delete). 
Os dados serão removidos permanentemente após 30 dias pela função hard_delete_expired_records.';

COMMENT ON FUNCTION soft_delete_user(UUID) IS 
'Marca um usuário e seus dados como deletados. Não permite deletar superadmin.';

COMMENT ON FUNCTION hard_delete_expired_records() IS 
'Remove permanentemente registros marcados como deletados há mais de 30 dias. 
Deve ser executado via cron job diariamente. Compliance LGPD.';

-- ============================================
-- PARTE 8: GRANT PERMISSIONS
-- ============================================

-- Permitir que authenticated execute as funções de soft delete
GRANT EXECUTE ON FUNCTION soft_delete_condo(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION soft_delete_user(UUID) TO authenticated;

-- Hard delete apenas via service_role (cron job)
REVOKE EXECUTE ON FUNCTION hard_delete_expired_records() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION hard_delete_expired_records() TO service_role;
