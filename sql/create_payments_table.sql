-- Migration para criar tabela de pagamentos PIX/Boleto
-- Execute este script no Supabase SQL Editor
-- VERSÃO FINAL - com DROP para limpar schema antigo

-- Limpar tabelas existentes (CUIDADO: isso apaga dados!)
DROP TABLE IF EXISTS payment_webhooks_log CASCADE;
DROP TABLE IF EXISTS payments CASCADE;

-- 1. Tabela de Pagamentos
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    condo_id UUID,
    payer_id UUID,
    invoice_id UUID,
    
    -- Payment details
    amount DECIMAL(10, 2) NOT NULL,
    payment_method TEXT NOT NULL DEFAULT 'pix',
    provider TEXT NOT NULL DEFAULT 'mercadopago',
    
    -- Provider info
    provider_payment_id TEXT,
    provider_transaction_id TEXT,
    
    -- PIX specific
    qr_data TEXT,
    qr_data_base64 TEXT,
    
    -- Boleto specific
    boleto_url TEXT,
    boleto_barcode TEXT,
    
    -- Status tracking
    status TEXT NOT NULL DEFAULT 'pending',
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    paid_at TIMESTAMPTZ,
    
    -- Additional data
    metadata JSONB DEFAULT '{}'::jsonb
);

-- 2. Tabela de Logs de Webhooks
CREATE TABLE payment_webhooks_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_id UUID REFERENCES payments(id) ON DELETE SET NULL,
    provider TEXT NOT NULL,
    event_type TEXT NOT NULL,
    provider_id TEXT,
    payload JSONB NOT NULL,
    headers JSONB,
    processed BOOLEAN DEFAULT FALSE,
    processed_at TIMESTAMPTZ,
    error TEXT,
    received_at TIMESTAMPTZ DEFAULT NOW(),
    idempotency_key TEXT
);

-- 3. Índices
CREATE INDEX idx_payments_condo ON payments(condo_id);
CREATE INDEX idx_payments_payer ON payments(payer_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_provider_id ON payments(provider_payment_id);
CREATE INDEX idx_payments_created ON payments(created_at DESC);
CREATE INDEX idx_webhooks_payment ON payment_webhooks_log(payment_id);

-- 4. RLS
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_webhooks_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "payments_all" ON payments FOR ALL TO service_role USING (TRUE) WITH CHECK (TRUE);
CREATE POLICY "payments_select" ON payments FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "webhooks_all" ON payment_webhooks_log FOR ALL TO service_role USING (TRUE) WITH CHECK (TRUE);

-- 5. Verificar
SELECT 'payments' as tabela, COUNT(*) as colunas FROM information_schema.columns WHERE table_name = 'payments' AND table_schema = 'public'
UNION ALL
SELECT 'payment_webhooks_log', COUNT(*) FROM information_schema.columns WHERE table_name = 'payment_webhooks_log' AND table_schema = 'public';
