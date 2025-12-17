-- Migration: Criar tabela de integrações por condomínio
-- Suporta múltiplos tipos de integração (pagamentos, whatsapp, etc.)
-- Armazena credenciais criptografadas de forma isolada por cliente

-- ============================================
-- TABELA: condo_integrations
-- Armazena credenciais de integração de cada condomínio
-- ============================================

CREATE TABLE IF NOT EXISTS condo_integrations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    condo_id UUID NOT NULL REFERENCES condos(id) ON DELETE CASCADE,
    
    -- Tipo de integração
    tipo TEXT NOT NULL CHECK (tipo IN ('pagamentos', 'whatsapp', 'email', 'sms', 'outro')),
    
    -- Provider específico (mercadopago, asaas, evolution, meta, etc.)
    provider TEXT NOT NULL,
    
    -- Credenciais em JSON (serão criptografadas pela aplicação)
    -- Exemplos:
    -- Mercado Pago: {"access_token": "xxx", "public_key": "xxx"}
    -- Evolution: {"evolution_url": "xxx", "instance_name": "xxx", "api_key": "xxx"}
    -- Banco tradicional: {"certificado_hash": "xxx", "convenio": "xxx", "oauth_token": "xxx"}
    credentials JSONB NOT NULL DEFAULT '{}'::jsonb,
    
    -- Configurações extras (não sensíveis)
    config JSONB NOT NULL DEFAULT '{}'::jsonb,
    
    -- Status
    ativo BOOLEAN DEFAULT true,
    
    -- Datas importantes
    data_implantacao TIMESTAMPTZ,
    data_ultima_verificacao TIMESTAMPTZ,
    
    -- Auditoria
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    
    -- Apenas uma integração ativa por tipo/provider por condomínio
    UNIQUE(condo_id, tipo, provider)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_condo_integrations_condo_id ON condo_integrations(condo_id);
CREATE INDEX IF NOT EXISTS idx_condo_integrations_tipo ON condo_integrations(tipo);
CREATE INDEX IF NOT EXISTS idx_condo_integrations_ativo ON condo_integrations(ativo) WHERE ativo = true;

-- Comentários
COMMENT ON TABLE condo_integrations IS 'Armazena credenciais de integração de cada condomínio (multi-tenant)';
COMMENT ON COLUMN condo_integrations.tipo IS 'Tipo: pagamentos, whatsapp, email, sms, outro';
COMMENT ON COLUMN condo_integrations.provider IS 'Provider: mercadopago, asaas, evolution, meta, bb, itau, etc.';
COMMENT ON COLUMN condo_integrations.credentials IS 'Credenciais sensíveis em JSON (access tokens, api keys, etc.)';
COMMENT ON COLUMN condo_integrations.config IS 'Configurações não sensíveis (horários, nome perfil, etc.)';

-- ============================================
-- RLS: Apenas superadmin pode ver/editar
-- ============================================

ALTER TABLE condo_integrations ENABLE ROW LEVEL SECURITY;

-- Superadmin tem acesso total
CREATE POLICY "Superadmin full access on condo_integrations"
    ON condo_integrations
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role = 'superadmin'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role = 'superadmin'
        )
    );

-- Síndico pode ver apenas suas integrações (sem credenciais sensíveis)
-- Nota: A aplicação deve filtrar as credenciais antes de retornar
CREATE POLICY "Sindico read own integrations"
    ON condo_integrations
    FOR SELECT
    TO authenticated
    USING (
        condo_id IN (
            SELECT condo_id FROM users 
            WHERE id = auth.uid() 
            AND role = 'sindico'
        )
    );

-- ============================================
-- TRIGGER: Atualizar updated_at
-- ============================================

CREATE OR REPLACE FUNCTION update_condo_integrations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_condo_integrations_updated_at ON condo_integrations;
CREATE TRIGGER trigger_condo_integrations_updated_at
    BEFORE UPDATE ON condo_integrations
    FOR EACH ROW
    EXECUTE FUNCTION update_condo_integrations_updated_at();

-- ============================================
-- FUNÇÃO: Buscar integração de um condomínio
-- ============================================

CREATE OR REPLACE FUNCTION get_condo_integration(
    p_condo_id UUID,
    p_tipo TEXT,
    p_provider TEXT DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    condo_id UUID,
    tipo TEXT,
    provider TEXT,
    credentials JSONB,
    config JSONB,
    ativo BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ci.id,
        ci.condo_id,
        ci.tipo,
        ci.provider,
        ci.credentials,
        ci.config,
        ci.ativo
    FROM condo_integrations ci
    WHERE ci.condo_id = p_condo_id
      AND ci.tipo = p_tipo
      AND ci.ativo = true
      AND (p_provider IS NULL OR ci.provider = p_provider)
    LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- TABELA: integration_logs (Auditoria)
-- Registra operações de integração para debugging
-- ============================================

CREATE TABLE IF NOT EXISTS integration_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    condo_id UUID REFERENCES condos(id) ON DELETE SET NULL,
    integration_id UUID REFERENCES condo_integrations(id) ON DELETE SET NULL,
    tipo TEXT NOT NULL,
    provider TEXT,
    
    -- Operação
    operation TEXT NOT NULL, -- 'send_message', 'generate_boleto', 'check_payment', etc.
    
    -- Resultado
    success BOOLEAN NOT NULL,
    request_data JSONB, -- Dados enviados (sem credenciais)
    response_data JSONB, -- Resposta recebida
    error_message TEXT,
    
    -- Timing
    duration_ms INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_integration_logs_condo_id ON integration_logs(condo_id);
CREATE INDEX IF NOT EXISTS idx_integration_logs_created_at ON integration_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_integration_logs_success ON integration_logs(success);

-- RLS
ALTER TABLE integration_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Superadmin full access on integration_logs"
    ON integration_logs
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role = 'superadmin'
        )
    );

COMMENT ON TABLE integration_logs IS 'Log de operações de integração para auditoria e debugging';
