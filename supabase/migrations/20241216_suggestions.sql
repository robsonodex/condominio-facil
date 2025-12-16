-- Tabela de Sugestões
CREATE TABLE IF NOT EXISTS suggestions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    condo_id UUID REFERENCES condos(id) ON DELETE SET NULL,
    titulo TEXT NOT NULL,
    descricao TEXT NOT NULL,
    categoria TEXT DEFAULT 'geral',
    status TEXT DEFAULT 'pendente', -- pendente, em_analise, implementado, rejeitado
    votes_count INTEGER DEFAULT 0,
    is_public BOOLEAN DEFAULT true,
    resposta_admin TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de Votos em Sugestões
CREATE TABLE IF NOT EXISTS suggestion_votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    suggestion_id UUID REFERENCES suggestions(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(suggestion_id, user_id)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_suggestions_status ON suggestions(status);
CREATE INDEX IF NOT EXISTS idx_suggestions_votes ON suggestions(votes_count DESC);
CREATE INDEX IF NOT EXISTS idx_suggestion_votes_suggestion ON suggestion_votes(suggestion_id);
CREATE INDEX IF NOT EXISTS idx_suggestion_votes_user ON suggestion_votes(user_id);

-- Função para incrementar votos
CREATE OR REPLACE FUNCTION increment_suggestion_votes(suggestion_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE suggestions SET votes_count = votes_count + 1 WHERE id = suggestion_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para decrementar votos
CREATE OR REPLACE FUNCTION decrement_suggestion_votes(suggestion_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE suggestions SET votes_count = GREATEST(0, votes_count - 1) WHERE id = suggestion_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS
ALTER TABLE suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE suggestion_votes ENABLE ROW LEVEL SECURITY;

-- Políticas para suggestions
CREATE POLICY "Usuários podem ver sugestões públicas ou do seu condomínio" ON suggestions
    FOR SELECT USING (is_public = true OR condo_id = (SELECT condo_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Usuários autenticados podem criar sugestões" ON suggestions
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Superadmins podem atualizar qualquer sugestão" ON suggestions
    FOR UPDATE USING (
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'superadmin')
    );

-- Políticas para suggestion_votes
CREATE POLICY "Usuários podem ver seus votos" ON suggestion_votes
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Usuários podem votar" ON suggestion_votes
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Usuários podem remover seus votos" ON suggestion_votes
    FOR DELETE USING (user_id = auth.uid());
