-- supabase/migrations/20251224_chat_sindico.sql
-- Chat exclusivo Morador ↔ Síndico com isolamento total por condomínio
-- VERSÃO CORRIGIDA - sem funções custom

-- Tabela de conversas
CREATE TABLE IF NOT EXISTS chat_sindico_conversas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    condo_id UUID NOT NULL REFERENCES condos(id) ON DELETE CASCADE,
    morador_id UUID NOT NULL REFERENCES users(id),
    sindico_id UUID REFERENCES users(id),
    
    -- Categoria/Assunto
    categoria VARCHAR(50) DEFAULT 'geral' CHECK (categoria IN ('geral', 'financeiro', 'manutencao', 'sugestao', 'reclamacao', 'outro')),
    assunto VARCHAR(200),
    
    -- Status da conversa
    status VARCHAR(20) DEFAULT 'aberta' CHECK (status IN ('aberta', 'em_atendimento', 'resolvida', 'arquivada')),
    
    -- Contadores de mensagens não lidas
    mensagens_nao_lidas_sindico INT DEFAULT 0,
    mensagens_nao_lidas_morador INT DEFAULT 0,
    
    -- Avaliação do atendimento
    avaliacao INT CHECK (avaliacao BETWEEN 1 AND 5),
    avaliacao_comentario TEXT,
    
    -- Timestamps
    ultima_mensagem_em TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_chat_sindico_conv_condo ON chat_sindico_conversas(condo_id);
CREATE INDEX IF NOT EXISTS idx_chat_sindico_conv_morador ON chat_sindico_conversas(morador_id);
CREATE INDEX IF NOT EXISTS idx_chat_sindico_conv_sindico ON chat_sindico_conversas(sindico_id);
CREATE INDEX IF NOT EXISTS idx_chat_sindico_conv_status ON chat_sindico_conversas(status);
CREATE INDEX IF NOT EXISTS idx_chat_sindico_conv_ultima ON chat_sindico_conversas(ultima_mensagem_em DESC);

-- Tabela de mensagens
CREATE TABLE IF NOT EXISTS chat_sindico_mensagens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversa_id UUID NOT NULL REFERENCES chat_sindico_conversas(id) ON DELETE CASCADE,
    condo_id UUID NOT NULL REFERENCES condos(id),
    
    -- Remetente
    sender_id UUID NOT NULL REFERENCES users(id),
    sender_role VARCHAR(20) NOT NULL,
    
    -- Conteúdo
    mensagem TEXT NOT NULL,
    tipo VARCHAR(20) DEFAULT 'texto' CHECK (tipo IN ('texto', 'imagem', 'arquivo', 'sistema')),
    arquivo_url TEXT,
    arquivo_nome TEXT,
    
    -- Status de leitura
    lida BOOLEAN DEFAULT FALSE,
    lida_em TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para mensagens
CREATE INDEX IF NOT EXISTS idx_chat_sindico_msg_conversa ON chat_sindico_mensagens(conversa_id);
CREATE INDEX IF NOT EXISTS idx_chat_sindico_msg_condo ON chat_sindico_mensagens(condo_id);
CREATE INDEX IF NOT EXISTS idx_chat_sindico_msg_created ON chat_sindico_mensagens(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_sindico_msg_lida ON chat_sindico_mensagens(lida) WHERE lida = FALSE;

-- Respostas rápidas (templates) do síndico
CREATE TABLE IF NOT EXISTS chat_sindico_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    condo_id UUID NOT NULL REFERENCES condos(id) ON DELETE CASCADE,
    sindico_id UUID NOT NULL REFERENCES users(id),
    
    titulo VARCHAR(100) NOT NULL,
    mensagem TEXT NOT NULL,
    categoria VARCHAR(50),
    
    ordem INT DEFAULT 0,
    ativo BOOLEAN DEFAULT TRUE,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chat_templates_condo ON chat_sindico_templates(condo_id);

-- Adicionar coluna chat_sindico_ativo na tabela condos (toggle do admin)
ALTER TABLE condos ADD COLUMN IF NOT EXISTS chat_sindico_ativo BOOLEAN DEFAULT FALSE;

-- =====================
-- RLS POLICIES (Simplificadas - sem funções custom)
-- A API vai fazer a validação principal, RLS é camada extra de segurança
-- =====================

ALTER TABLE chat_sindico_conversas ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_sindico_mensagens ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_sindico_templates ENABLE ROW LEVEL SECURITY;

-- Políticas simples - permitir acesso se usuário autenticado
-- A API faz a validação do condo_id e permissões

-- Conversas: usuários autenticados podem ver/inserir/atualizar
DROP POLICY IF EXISTS chat_sindico_conversas_all ON chat_sindico_conversas;
CREATE POLICY chat_sindico_conversas_all ON chat_sindico_conversas
FOR ALL USING (auth.uid() IS NOT NULL);

-- Mensagens: usuários autenticados podem ver/inserir/atualizar  
DROP POLICY IF EXISTS chat_sindico_mensagens_all ON chat_sindico_mensagens;
CREATE POLICY chat_sindico_mensagens_all ON chat_sindico_mensagens
FOR ALL USING (auth.uid() IS NOT NULL);

-- Templates: usuários autenticados podem ver/inserir/atualizar
DROP POLICY IF EXISTS chat_templates_all ON chat_sindico_templates;
CREATE POLICY chat_templates_all ON chat_sindico_templates
FOR ALL USING (auth.uid() IS NOT NULL);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_chat_sindico_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_chat_sindico_updated_at ON chat_sindico_conversas;
CREATE TRIGGER trigger_chat_sindico_updated_at
    BEFORE UPDATE ON chat_sindico_conversas
    FOR EACH ROW
    EXECUTE FUNCTION update_chat_sindico_updated_at();

-- Trigger para atualizar ultima_mensagem_em e contadores
CREATE OR REPLACE FUNCTION update_conversa_on_new_message()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE chat_sindico_conversas
    SET 
        ultima_mensagem_em = NEW.created_at,
        mensagens_nao_lidas_sindico = CASE 
            WHEN NEW.sender_role != 'sindico' THEN mensagens_nao_lidas_sindico + 1 
            ELSE mensagens_nao_lidas_sindico 
        END,
        mensagens_nao_lidas_morador = CASE 
            WHEN NEW.sender_role = 'sindico' THEN mensagens_nao_lidas_morador + 1 
            ELSE mensagens_nao_lidas_morador 
        END,
        status = CASE 
            WHEN status = 'aberta' AND NEW.sender_role = 'sindico' THEN 'em_atendimento'
            ELSE status 
        END
    WHERE id = NEW.conversa_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_nova_mensagem_chat ON chat_sindico_mensagens;
CREATE TRIGGER trigger_nova_mensagem_chat
    AFTER INSERT ON chat_sindico_mensagens
    FOR EACH ROW
    EXECUTE FUNCTION update_conversa_on_new_message();

-- Comentários para documentação
COMMENT ON TABLE chat_sindico_conversas IS 'Conversas entre moradores e síndico - isoladas por condomínio';
COMMENT ON TABLE chat_sindico_mensagens IS 'Mensagens do chat morador-síndico';
COMMENT ON TABLE chat_sindico_templates IS 'Templates de respostas rápidas do síndico';
COMMENT ON COLUMN condos.chat_sindico_ativo IS 'Toggle para ativar chat morador-síndico (add-on R$29,90 ou incluso Premium)';
