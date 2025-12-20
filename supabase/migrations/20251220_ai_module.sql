-- Migration: Módulo de IA Multi-Tenant
-- Data: 20/12/2024
-- Descrição: Cria estrutura para agentes de IA isolados por condomínio

-- ============================================
-- TABELA: ai_agents (1 agente por condomínio)
-- ============================================

CREATE TABLE IF NOT EXISTS ai_agents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    condo_id UUID NOT NULL REFERENCES condos(id) ON DELETE CASCADE,
    
    -- Personalização
    nome_agente VARCHAR(100) NOT NULL DEFAULT 'Assistente do Condomínio',
    tom_resposta VARCHAR(20) DEFAULT 'formal' CHECK (tom_resposta IN ('formal', 'direto', 'amigavel')),
    instrucoes_personalizadas TEXT,
    
    -- Status
    ativo BOOLEAN DEFAULT true,
    
    -- Auditoria
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    
    -- 1 agente por condomínio (não por síndico!)
    UNIQUE(condo_id)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_ai_agents_condo ON ai_agents(condo_id);
CREATE INDEX IF NOT EXISTS idx_ai_agents_ativo ON ai_agents(ativo) WHERE ativo = true;

COMMENT ON TABLE ai_agents IS 'Agente de IA exclusivo de cada condomínio (multi-tenant)';
COMMENT ON COLUMN ai_agents.tom_resposta IS 'Tom: formal, direto, amigavel';

-- ============================================
-- TABELA: ai_documents (Base de conhecimento)
-- ============================================

CREATE TABLE IF NOT EXISTS ai_documents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    condo_id UUID NOT NULL REFERENCES condos(id) ON DELETE CASCADE,
    
    -- Documento
    tipo VARCHAR(50) NOT NULL CHECK (tipo IN ('regimento', 'convencao', 'ata', 'decisao', 'faq', 'outro')),
    titulo VARCHAR(200) NOT NULL,
    conteudo_texto TEXT NOT NULL,
    
    -- Versionamento
    versao INT DEFAULT 1,
    
    -- Aprovação pelo síndico
    aprovado_por UUID REFERENCES users(id),
    aprovado_em TIMESTAMPTZ,
    
    -- Status
    ativo BOOLEAN DEFAULT true,
    
    -- Auditoria
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES users(id)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_ai_documents_condo ON ai_documents(condo_id);
CREATE INDEX IF NOT EXISTS idx_ai_documents_tipo ON ai_documents(tipo);
CREATE INDEX IF NOT EXISTS idx_ai_documents_ativo ON ai_documents(ativo) WHERE ativo = true;

COMMENT ON TABLE ai_documents IS 'Base de conhecimento da IA por condomínio';
COMMENT ON COLUMN ai_documents.tipo IS 'Tipo: regimento, convencao, ata, decisao, faq, outro';

-- ============================================
-- TABELA: ai_settings (Configurações e limites)
-- ============================================

CREATE TABLE IF NOT EXISTS ai_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    condo_id UUID NOT NULL REFERENCES condos(id) ON DELETE CASCADE,
    
    -- Permissões
    roles_permitidos TEXT[] DEFAULT ARRAY['sindico', 'morador', 'inquilino'],
    temas_bloqueados TEXT[] DEFAULT ARRAY[]::TEXT[],
    
    -- Limites
    limite_mensagens_mes INT DEFAULT 500,
    mensagens_usadas_mes INT DEFAULT 0,
    mes_referencia VARCHAR(7), -- '2024-12' para controle mensal
    
    -- Opções
    disclaimer_ativo BOOLEAN DEFAULT true,
    modo_manutencao BOOLEAN DEFAULT false,
    
    -- Auditoria
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- 1 config por condomínio
    UNIQUE(condo_id)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_ai_settings_condo ON ai_settings(condo_id);

COMMENT ON TABLE ai_settings IS 'Configurações do módulo de IA por condomínio';

-- ============================================
-- TABELA: ai_interactions (Log de interações)
-- ============================================

CREATE TABLE IF NOT EXISTS ai_interactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    condo_id UUID NOT NULL REFERENCES condos(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),
    
    -- Conversa
    pergunta TEXT NOT NULL,
    resposta TEXT NOT NULL,
    
    -- Métricas
    tokens_usados INT DEFAULT 0,
    tempo_resposta_ms INT,
    
    -- Feedback do usuário
    feedback VARCHAR(10) CHECK (feedback IN ('positivo', 'negativo')),
    
    -- Auditoria
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para relatórios
CREATE INDEX IF NOT EXISTS idx_ai_interactions_condo ON ai_interactions(condo_id);
CREATE INDEX IF NOT EXISTS idx_ai_interactions_user ON ai_interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_interactions_date ON ai_interactions(created_at);
CREATE INDEX IF NOT EXISTS idx_ai_interactions_feedback ON ai_interactions(feedback) WHERE feedback IS NOT NULL;

COMMENT ON TABLE ai_interactions IS 'Histórico de perguntas e respostas da IA';

-- ============================================
-- TABELA: ai_audit_log (Auditoria jurídica)
-- ============================================

CREATE TABLE IF NOT EXISTS ai_audit_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    condo_id UUID NOT NULL REFERENCES condos(id) ON DELETE CASCADE,
    
    -- Ação
    acao VARCHAR(50) NOT NULL, -- 'documento_enviado', 'config_alterada', 'agente_ativado', etc.
    descricao TEXT,
    
    -- Contexto
    user_id UUID REFERENCES users(id),
    ip_address INET,
    user_agent TEXT,
    
    -- Dados alterados (JSON)
    dados_anteriores JSONB,
    dados_novos JSONB,
    
    -- Auditoria
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_ai_audit_condo ON ai_audit_log(condo_id);
CREATE INDEX IF NOT EXISTS idx_ai_audit_date ON ai_audit_log(created_at);
CREATE INDEX IF NOT EXISTS idx_ai_audit_acao ON ai_audit_log(acao);

COMMENT ON TABLE ai_audit_log IS 'Log de auditoria para proteção jurídica';

-- ============================================
-- RLS: Isolamento por condomínio (CRÍTICO!)
-- ============================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE ai_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_audit_log ENABLE ROW LEVEL SECURITY;

-- Função auxiliar para pegar condo_id do usuário logado
CREATE OR REPLACE FUNCTION get_user_condo_id()
RETURNS UUID AS $$
BEGIN
    RETURN (SELECT condo_id FROM users WHERE id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- POLÍTICAS: ai_agents
-- ============================================

-- Superadmin: acesso total
CREATE POLICY "Superadmin full access on ai_agents"
    ON ai_agents FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'superadmin'))
    WITH CHECK (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'superadmin'));

-- Síndico: CRUD do próprio condomínio
CREATE POLICY "Sindico manage own ai_agents"
    ON ai_agents FOR ALL TO authenticated
    USING (
        condo_id = get_user_condo_id() 
        AND EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'sindico')
    )
    WITH CHECK (
        condo_id = get_user_condo_id() 
        AND EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'sindico')
    );

-- Morador/porteiro: apenas leitura do próprio condomínio
CREATE POLICY "Users read own ai_agents"
    ON ai_agents FOR SELECT TO authenticated
    USING (condo_id = get_user_condo_id());

-- ============================================
-- POLÍTICAS: ai_documents
-- ============================================

CREATE POLICY "Superadmin full access on ai_documents"
    ON ai_documents FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'superadmin'))
    WITH CHECK (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'superadmin'));

CREATE POLICY "Sindico manage own ai_documents"
    ON ai_documents FOR ALL TO authenticated
    USING (
        condo_id = get_user_condo_id() 
        AND EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'sindico')
    )
    WITH CHECK (
        condo_id = get_user_condo_id() 
        AND EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'sindico')
    );

CREATE POLICY "Users read own ai_documents"
    ON ai_documents FOR SELECT TO authenticated
    USING (condo_id = get_user_condo_id() AND ativo = true);

-- ============================================
-- POLÍTICAS: ai_settings
-- ============================================

CREATE POLICY "Superadmin full access on ai_settings"
    ON ai_settings FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'superadmin'))
    WITH CHECK (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'superadmin'));

CREATE POLICY "Sindico manage own ai_settings"
    ON ai_settings FOR ALL TO authenticated
    USING (
        condo_id = get_user_condo_id() 
        AND EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'sindico')
    )
    WITH CHECK (
        condo_id = get_user_condo_id() 
        AND EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'sindico')
    );

CREATE POLICY "Users read own ai_settings"
    ON ai_settings FOR SELECT TO authenticated
    USING (condo_id = get_user_condo_id());

-- ============================================
-- POLÍTICAS: ai_interactions
-- ============================================

CREATE POLICY "Superadmin full access on ai_interactions"
    ON ai_interactions FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'superadmin'))
    WITH CHECK (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'superadmin'));

-- Síndico: ver todas interações do condomínio
CREATE POLICY "Sindico read all ai_interactions"
    ON ai_interactions FOR SELECT TO authenticated
    USING (
        condo_id = get_user_condo_id() 
        AND EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'sindico')
    );

-- Usuário: inserir e ver apenas suas próprias interações
CREATE POLICY "Users insert own ai_interactions"
    ON ai_interactions FOR INSERT TO authenticated
    WITH CHECK (
        condo_id = get_user_condo_id() 
        AND user_id = auth.uid()
    );

CREATE POLICY "Users read own ai_interactions"
    ON ai_interactions FOR SELECT TO authenticated
    USING (user_id = auth.uid());

-- Usuário: atualizar feedback das próprias interações
CREATE POLICY "Users update own ai_interactions feedback"
    ON ai_interactions FOR UPDATE TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- ============================================
-- POLÍTICAS: ai_audit_log
-- ============================================

CREATE POLICY "Superadmin full access on ai_audit_log"
    ON ai_audit_log FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'superadmin'))
    WITH CHECK (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'superadmin'));

-- Síndico: apenas leitura do próprio condomínio
CREATE POLICY "Sindico read own ai_audit_log"
    ON ai_audit_log FOR SELECT TO authenticated
    USING (
        condo_id = get_user_condo_id() 
        AND EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'sindico')
    );

-- Inserção via API (sem RLS para inserção programática)
CREATE POLICY "System insert ai_audit_log"
    ON ai_audit_log FOR INSERT TO authenticated
    WITH CHECK (true);

-- ============================================
-- TRIGGERS: Atualizar updated_at
-- ============================================

CREATE OR REPLACE FUNCTION update_ai_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_ai_agents_updated_at
    BEFORE UPDATE ON ai_agents
    FOR EACH ROW EXECUTE FUNCTION update_ai_updated_at();

CREATE TRIGGER trigger_ai_documents_updated_at
    BEFORE UPDATE ON ai_documents
    FOR EACH ROW EXECUTE FUNCTION update_ai_updated_at();

CREATE TRIGGER trigger_ai_settings_updated_at
    BEFORE UPDATE ON ai_settings
    FOR EACH ROW EXECUTE FUNCTION update_ai_updated_at();

-- ============================================
-- FUNÇÃO: Resetar contador mensal de mensagens
-- ============================================

CREATE OR REPLACE FUNCTION reset_ai_monthly_usage()
RETURNS void AS $$
DECLARE
    current_month VARCHAR(7);
BEGIN
    current_month := to_char(NOW(), 'YYYY-MM');
    
    UPDATE ai_settings
    SET mensagens_usadas_mes = 0, mes_referencia = current_month
    WHERE mes_referencia IS DISTINCT FROM current_month;
END;
$$ LANGUAGE plpgsql;

-- Comentário final
COMMENT ON FUNCTION reset_ai_monthly_usage IS 'Executar via cron no início de cada mês';
