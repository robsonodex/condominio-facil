-- Migração para melhorias no Mural de Avisos
-- Adiciona marcação de leitura e tipos de comunicados

-- 1. Criar tabela de marcação de leitura se não existir
CREATE TABLE IF NOT EXISTS notice_reads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    notice_id UUID REFERENCES notices(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    read_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(notice_id, user_id)
);

-- 2. Adicionar campos extras na tabela notices
ALTER TABLE notices ADD COLUMN IF NOT EXISTS tipo_aviso TEXT DEFAULT 'informativo' CHECK (tipo_aviso IN ('informativo', 'comunicado', 'urgente', 'convocacao'));
ALTER TABLE notices ADD COLUMN IF NOT EXISTS prioridade TEXT DEFAULT 'baixa' CHECK (prioridade IN ('baixa', 'media', 'alta'));
ALTER TABLE notices ADD COLUMN IF NOT EXISTS fixado BOOLEAN DEFAULT false;

-- RLS para notice_reads
ALTER TABLE notice_reads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Usuários podem ver suas próprias marcações de leitura" ON notice_reads;
CREATE POLICY "Usuários podem ver suas próprias marcações de leitura"
    ON notice_reads FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuários podem marcar avisos como lidos" ON notice_reads;
CREATE POLICY "Usuários podem marcar avisos como lidos"
    ON notice_reads FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Comentários
COMMENT ON COLUMN notices.tipo_aviso IS 'Tipo do aviso: informativo, comunicado (oficial), urgente ou convocacao (assembleia)';
COMMENT ON COLUMN notices.prioridade IS 'Prioridade visual do aviso';
COMMENT ON COLUMN notices.fixado IS 'Se verdadeiro, o aviso fica no topo da lista';
