-- =============================================
-- Sistema de Notificações In-App
-- Execute no Supabase SQL Editor
-- =============================================

-- Criar tabela SE NÃO EXISTIR
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    condo_id UUID REFERENCES condos(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(20) DEFAULT 'info',
    is_read BOOLEAN DEFAULT false,
    link VARCHAR(500),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Adicionar colunas que podem estar faltando (se a tabela já existia)
DO $$
BEGIN
    -- Adicionar is_read se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'notifications' AND column_name = 'is_read') THEN
        ALTER TABLE notifications ADD COLUMN is_read BOOLEAN DEFAULT false;
    END IF;

    -- Adicionar link se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'notifications' AND column_name = 'link') THEN
        ALTER TABLE notifications ADD COLUMN link VARCHAR(500);
    END IF;

    -- Adicionar type se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'notifications' AND column_name = 'type') THEN
        ALTER TABLE notifications ADD COLUMN type VARCHAR(20) DEFAULT 'info';
    END IF;
END $$;

-- Índices (IF NOT EXISTS já ignora se existir)
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_condo ON notifications(condo_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at);

-- RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can see their notifications" ON notifications;
CREATE POLICY "Users can see their notifications" ON notifications
    FOR SELECT USING (
        user_id = auth.uid()
        OR condo_id IN (SELECT condo_id FROM users WHERE id = auth.uid())
        OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'superadmin')
    );

DROP POLICY IF EXISTS "Users can update their notifications" ON notifications;
CREATE POLICY "Users can update their notifications" ON notifications
    FOR UPDATE USING (
        user_id = auth.uid()
        OR condo_id IN (SELECT condo_id FROM users WHERE id = auth.uid())
    );

DROP POLICY IF EXISTS "System can insert notifications" ON notifications;
CREATE POLICY "System can insert notifications" ON notifications
    FOR INSERT WITH CHECK (true);

-- Função para criar notificação de cobrança
CREATE OR REPLACE FUNCTION create_billing_notification(
    p_condo_id UUID,
    p_title VARCHAR(255),
    p_message TEXT,
    p_link VARCHAR(500) DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    notification_id UUID;
BEGIN
    INSERT INTO notifications (condo_id, title, message, type, link)
    VALUES (p_condo_id, p_title, p_message, 'billing', p_link)
    RETURNING id INTO notification_id;
    
    RETURN notification_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON TABLE notifications IS 'Notificações in-app para usuários';
COMMENT ON FUNCTION create_billing_notification IS 'Cria notificação de cobrança para um condomínio';
