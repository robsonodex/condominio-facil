-- ===========================================
-- SUGESTÕES (já criadas, usar DROP IF EXISTS)
-- ===========================================

-- Tabela de Sugestões
CREATE TABLE IF NOT EXISTS suggestions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    condo_id UUID REFERENCES condos(id) ON DELETE SET NULL,
    titulo TEXT NOT NULL,
    descricao TEXT NOT NULL,
    categoria TEXT DEFAULT 'geral',
    status TEXT DEFAULT 'pendente',
    votes_count INTEGER DEFAULT 0,
    is_public BOOLEAN DEFAULT true,
    resposta_admin TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de Votos
CREATE TABLE IF NOT EXISTS suggestion_votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    suggestion_id UUID REFERENCES suggestions(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(suggestion_id, user_id)
);

-- Funções RPC - remover existentes primeiro
DROP FUNCTION IF EXISTS increment_suggestion_votes(UUID);
DROP FUNCTION IF EXISTS decrement_suggestion_votes(UUID);

CREATE OR REPLACE FUNCTION increment_suggestion_votes(p_suggestion_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE suggestions SET votes_count = votes_count + 1 WHERE id = p_suggestion_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION decrement_suggestion_votes(p_suggestion_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE suggestions SET votes_count = GREATEST(0, votes_count - 1) WHERE id = p_suggestion_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===========================================
-- CHAT DE SUPORTE EM TEMPO REAL
-- ===========================================

-- Tabela de Conversas de Suporte
CREATE TABLE IF NOT EXISTS support_chats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    condo_id UUID REFERENCES condos(id) ON DELETE SET NULL,
    assunto TEXT NOT NULL,
    status TEXT DEFAULT 'aberto', -- aberto, em_atendimento, resolvido, fechado
    prioridade TEXT DEFAULT 'normal', -- baixa, normal, alta, urgente
    atendente_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    ultima_mensagem_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de Mensagens do Chat
CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chat_id UUID REFERENCES support_chats(id) ON DELETE CASCADE NOT NULL,
    sender_id UUID REFERENCES auth.users(id) ON DELETE SET NULL NOT NULL,
    sender_type TEXT NOT NULL, -- 'user' ou 'admin'
    mensagem TEXT NOT NULL,
    lida BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_support_chats_user ON support_chats(user_id);
CREATE INDEX IF NOT EXISTS idx_support_chats_status ON support_chats(status);
CREATE INDEX IF NOT EXISTS idx_support_chats_atendente ON support_chats(atendente_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_chat ON chat_messages(chat_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created ON chat_messages(created_at);

-- Habilitar RLS
ALTER TABLE support_chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Políticas para support_chats
DROP POLICY IF EXISTS "usuarios_veem_seus_chats" ON support_chats;
CREATE POLICY "usuarios_veem_seus_chats" ON support_chats
    FOR SELECT USING (
        user_id = auth.uid() OR 
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'superadmin')
    );

DROP POLICY IF EXISTS "usuarios_criam_chats" ON support_chats;
CREATE POLICY "usuarios_criam_chats" ON support_chats
    FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "superadmins_atualizam_chats" ON support_chats;
CREATE POLICY "superadmins_atualizam_chats" ON support_chats
    FOR UPDATE USING (
        user_id = auth.uid() OR 
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'superadmin')
    );

-- Políticas para chat_messages
DROP POLICY IF EXISTS "usuarios_veem_mensagens_dos_seus_chats" ON chat_messages;
CREATE POLICY "usuarios_veem_mensagens_dos_seus_chats" ON chat_messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM support_chats 
            WHERE id = chat_messages.chat_id 
            AND (user_id = auth.uid() OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'superadmin'))
        )
    );

DROP POLICY IF EXISTS "usuarios_enviam_mensagens" ON chat_messages;
CREATE POLICY "usuarios_enviam_mensagens" ON chat_messages
    FOR INSERT WITH CHECK (
        sender_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM support_chats 
            WHERE id = chat_messages.chat_id 
            AND (user_id = auth.uid() OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'superadmin'))
        )
    );

DROP POLICY IF EXISTS "marcar_mensagens_como_lidas" ON chat_messages;
CREATE POLICY "marcar_mensagens_como_lidas" ON chat_messages
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM support_chats 
            WHERE id = chat_messages.chat_id 
            AND (user_id = auth.uid() OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'superadmin'))
        )
    );

-- Habilitar Realtime para as tabelas
ALTER PUBLICATION supabase_realtime ADD TABLE support_chats;
ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;
