-- =====================================================
-- MÓDULO DE COMPLIANCE E CERTIFICADOS
-- Condomínio Fácil - Certificates Module
-- =====================================================

-- 1. Criar ENUM para tipos de certificado
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'certificate_type') THEN
        CREATE TYPE certificate_type AS ENUM (
            'CBMERJ',
            'RIA_ELEVADORES', 
            'SEGURO_PREDIAL',
            'LIMPEZA_CISTERNA',
            'OUTROS'
        );
    END IF;
END $$;

-- 2. Tabela principal de certificados
CREATE TABLE IF NOT EXISTS condo_certificates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    condo_id UUID NOT NULL REFERENCES condos(id) ON DELETE CASCADE,
    
    -- Identificação do documento
    name VARCHAR(255) NOT NULL,
    type certificate_type NOT NULL DEFAULT 'OUTROS',
    
    -- Datas
    issued_at DATE NOT NULL,
    expires_at DATE NOT NULL,
    
    -- Arquivo
    document_url TEXT NOT NULL,
    
    -- Metadata
    notes TEXT,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Índices para performance
CREATE INDEX IF NOT EXISTS idx_condo_certificates_condo ON condo_certificates(condo_id);
CREATE INDEX IF NOT EXISTS idx_condo_certificates_expires ON condo_certificates(expires_at);
CREATE INDEX IF NOT EXISTS idx_condo_certificates_type ON condo_certificates(type);

-- 4. Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_condo_certificates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_condo_certificates_updated_at ON condo_certificates;
CREATE TRIGGER trg_condo_certificates_updated_at
    BEFORE UPDATE ON condo_certificates
    FOR EACH ROW
    EXECUTE FUNCTION update_condo_certificates_updated_at();

-- =====================================================
-- RLS POLICIES
-- =====================================================

ALTER TABLE condo_certificates ENABLE ROW LEVEL SECURITY;

-- Síndico gerencia certificados do próprio condomínio
DROP POLICY IF EXISTS "condo_certificates_sindico_all" ON condo_certificates;
CREATE POLICY "condo_certificates_sindico_all" ON condo_certificates
    FOR ALL
    USING (
        condo_id = get_my_condo_id() 
        AND get_my_role() IN ('sindico', 'admin')
    );

-- Superadmin acesso total
DROP POLICY IF EXISTS "condo_certificates_superadmin" ON condo_certificates;
CREATE POLICY "condo_certificates_superadmin" ON condo_certificates
    FOR ALL
    USING (get_my_role() = 'superadmin');

-- Porteiro visualiza certificados
DROP POLICY IF EXISTS "condo_certificates_porteiro_read" ON condo_certificates;
CREATE POLICY "condo_certificates_porteiro_read" ON condo_certificates
    FOR SELECT
    USING (
        condo_id = get_my_condo_id() 
        AND get_my_role() = 'porteiro'
    );

-- Morador visualiza certificados
DROP POLICY IF EXISTS "condo_certificates_morador_read" ON condo_certificates;
CREATE POLICY "condo_certificates_morador_read" ON condo_certificates
    FOR SELECT
    USING (
        condo_id = get_my_condo_id() 
        AND get_my_role() = 'morador'
    );

-- Service role bypass
DROP POLICY IF EXISTS "condo_certificates_service" ON condo_certificates;
CREATE POLICY "condo_certificates_service" ON condo_certificates
    FOR ALL
    USING (auth.role() = 'service_role');

-- =====================================================
-- FUNÇÃO AUXILIAR: Calcular status do certificado
-- =====================================================

CREATE OR REPLACE FUNCTION get_certificate_status(p_expires_at DATE)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
    days_until_expiry INT;
BEGIN
    days_until_expiry := p_expires_at - CURRENT_DATE;
    
    IF days_until_expiry < 0 THEN
        RETURN 'expired';
    ELSIF days_until_expiry <= 7 THEN
        RETURN 'critical';
    ELSIF days_until_expiry <= 60 THEN
        RETURN 'warning';
    ELSE
        RETURN 'valid';
    END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION get_certificate_status TO authenticated;
