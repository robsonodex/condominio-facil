-- ===========================================
-- CORREÇÃO: CHAT DE SUPORTE
-- Execute este SQL para corrigir as tabelas
-- ===========================================

-- Dropar tabelas antigas se existirem (para recriar)
DROP TABLE IF EXISTS chat_messages CASCADE;
DROP TABLE IF EXISTS support_chats CASCADE;

-- Tabela de Conversas de Suporte
CREATE TABLE support_chats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    condo_id UUID,
    assunto TEXT NOT NULL,
    status TEXT DEFAULT 'aberto',
    prioridade TEXT DEFAULT 'normal',
    atendente_id UUID,
    ultima_mensagem_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de Mensagens do Chat
CREATE TABLE chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chat_id UUID REFERENCES support_chats(id) ON DELETE CASCADE NOT NULL,
    sender_id UUID NOT NULL,
    sender_type TEXT NOT NULL,
    mensagem TEXT NOT NULL,
    lida BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_support_chats_user ON support_chats(user_id);
CREATE INDEX idx_support_chats_status ON support_chats(status);
CREATE INDEX idx_support_chats_atendente ON support_chats(atendente_id);
CREATE INDEX idx_chat_messages_chat ON chat_messages(chat_id);
CREATE INDEX idx_chat_messages_created ON chat_messages(created_at);

-- Desabilitar RLS para simplicidade (usando service role)
ALTER TABLE support_chats DISABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages DISABLE ROW LEVEL SECURITY;

-- Habilitar Realtime
DO $$
BEGIN
    -- Verificar se as tabelas já estão na publicação
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND tablename = 'support_chats'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE support_chats;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND tablename = 'chat_messages'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;
    END IF;
END $$;
