-- =====================================================
-- CHECKLIST DE IMPLANTAÇÃO / ONBOARDING PROGRESS
-- =====================================================

-- Tabela para armazenar progresso do onboarding por condomínio
CREATE TABLE IF NOT EXISTS onboarding_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    condo_id UUID NOT NULL REFERENCES condos(id) ON DELETE CASCADE,
    
    -- Checklist items
    cadastrar_unidades BOOLEAN DEFAULT false,
    cadastrar_moradores BOOLEAN DEFAULT false,
    configurar_financeiro BOOLEAN DEFAULT false,
    ativar_cobrancas BOOLEAN DEFAULT false,
    ativar_portaria BOOLEAN DEFAULT false,
    ativar_reservas BOOLEAN DEFAULT false,
    configurar_pwa BOOLEAN DEFAULT false,
    criar_primeiro_aviso BOOLEAN DEFAULT false,
    criar_primeira_cobranca BOOLEAN DEFAULT false,
    ver_relatorio_financeiro BOOLEAN DEFAULT false,
    
    -- Metadata
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(condo_id)
);

-- RLS Policies
ALTER TABLE onboarding_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Sindico can view own onboarding"
    ON onboarding_progress FOR SELECT
    USING (condo_id = get_my_condo_id());

CREATE POLICY "Sindico can update own onboarding"
    ON onboarding_progress FOR UPDATE
    USING (condo_id = get_my_condo_id());

CREATE POLICY "Sindico can insert own onboarding"
    ON onboarding_progress FOR INSERT
    WITH CHECK (condo_id = get_my_condo_id());

CREATE POLICY "Superadmin full access onboarding"
    ON onboarding_progress FOR ALL
    USING (get_my_role() = 'superadmin');

-- Índice
CREATE INDEX IF NOT EXISTS idx_onboarding_condo ON onboarding_progress(condo_id);

-- =====================================================
-- CONFIGURAÇÕES DE AUTOMAÇÃO DE INADIMPLÊNCIA
-- =====================================================

CREATE TABLE IF NOT EXISTS automation_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    condo_id UUID NOT NULL REFERENCES condos(id) ON DELETE CASCADE,
    
    -- Regras de inadimplência
    dias_lembrete INT DEFAULT 3,           -- Dias após vencimento para lembrete
    dias_multa INT DEFAULT 5,              -- Dias após vencimento para multa
    dias_cobranca_automatica INT DEFAULT 15, -- Dias para gerar cobrança automatica
    dias_relatorio_inadimplentes INT DEFAULT 30, -- Dias para enviar relatório
    
    -- Valores
    multa_percentual DECIMAL(5,2) DEFAULT 2.00,
    juros_diario DECIMAL(5,4) DEFAULT 0.0333,
    
    -- Ativação
    lembrete_ativo BOOLEAN DEFAULT true,
    multa_automatica BOOLEAN DEFAULT false,
    cobranca_automatica BOOLEAN DEFAULT false,
    relatorio_automatico BOOLEAN DEFAULT true,
    
    -- Canais
    enviar_whatsapp BOOLEAN DEFAULT true,
    enviar_email BOOLEAN DEFAULT true,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(condo_id)
);

-- RLS
ALTER TABLE automation_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Sindico can manage automation"
    ON automation_settings FOR ALL
    USING (condo_id = get_my_condo_id());

CREATE POLICY "Superadmin full access automation"
    ON automation_settings FOR ALL
    USING (get_my_role() = 'superadmin');

-- =====================================================
-- TABELA DE NOTIFICAÇÕES ENVIADAS
-- =====================================================

CREATE TABLE IF NOT EXISTS notifications_sent (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    condo_id UUID NOT NULL REFERENCES condos(id) ON DELETE CASCADE,
    
    -- Quem enviou
    sender_id UUID REFERENCES users(id),
    
    -- Tipo de notificação
    tipo VARCHAR(50) NOT NULL, -- 'push', 'whatsapp', 'email', 'aviso'
    
    -- Destino
    destinatario_tipo VARCHAR(50), -- 'todos', 'bloco', 'unidade', 'porteiros', 'grupo'
    destinatario_valor TEXT, -- Bloco, unidade_id, etc.
    
    -- Conteúdo
    titulo VARCHAR(255),
    mensagem TEXT NOT NULL,
    
    -- Status
    status VARCHAR(50) DEFAULT 'enviado', -- 'enviado', 'falha', 'pendente'
    erro TEXT,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE notifications_sent ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Sindico can view notifications"
    ON notifications_sent FOR SELECT
    USING (condo_id = get_my_condo_id());

CREATE POLICY "Sindico can send notifications"
    ON notifications_sent FOR INSERT
    WITH CHECK (condo_id = get_my_condo_id());

CREATE POLICY "Superadmin full access notifications"
    ON notifications_sent FOR ALL
    USING (get_my_role() = 'superadmin');

-- =====================================================
-- TABELA DE ERROS DO SISTEMA (PARA PAINEL ADMIN)
-- =====================================================

CREATE TABLE IF NOT EXISTS system_errors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Contexto
    condo_id UUID REFERENCES condos(id) ON DELETE SET NULL,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    
    -- Erro
    tipo VARCHAR(100) NOT NULL, -- 'webhook_mp', 'cobranca_falha', 'email_falha', etc.
    prioridade VARCHAR(20) DEFAULT 'media', -- 'alta', 'media', 'baixa'
    mensagem TEXT NOT NULL,
    stack_trace TEXT,
    
    -- Contexto adicional
    payload JSONB,
    
    -- Status
    resolvido BOOLEAN DEFAULT false,
    resolvido_por UUID REFERENCES users(id),
    resolvido_em TIMESTAMPTZ,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS - Apenas superadmin pode ver erros
ALTER TABLE system_errors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Superadmin can view errors"
    ON system_errors FOR ALL
    USING (get_my_role() = 'superadmin');

-- Índices
CREATE INDEX IF NOT EXISTS idx_errors_tipo ON system_errors(tipo);
CREATE INDEX IF NOT EXISTS idx_errors_prioridade ON system_errors(prioridade);
CREATE INDEX IF NOT EXISTS idx_errors_resolvido ON system_errors(resolvido);
CREATE INDEX IF NOT EXISTS idx_errors_created ON system_errors(created_at DESC);
