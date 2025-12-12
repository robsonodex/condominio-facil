-- Migration para criar tabela de pagamentos PIX/Boleto
-- Execute este script no Supabase SQL Editor

-- 1. Tabela de Pagamentos
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    condo_id UUID NOT NULL REFERENCES condos(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id),
    invoice_id UUID REFERENCES resident_invoices(id),
    
    -- Payment details
    amount DECIMAL(10, 2) NOT NULL,
    payment_method TEXT NOT NULL CHECK (payment_method IN ('pix', 'boleto', 'credit_card', 'debit_card')),
    provider TEXT NOT NULL CHECK (provider IN ('mercadopago', 'gerencianet', 'pagarme', 'manual')),
    
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
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'paid', 'failed', 'cancelled', 'expired')),
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    paid_at TIMESTAMPTZ,
    
    -- Additional data
    metadata JSONB DEFAULT '{}'::jsonb,
    
    UNIQUE(provider_payment_id)
);

-- 2. Tabela de Logs de Webhooks
CREATE TABLE IF NOT EXISTS payment_webhooks_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_id UUID REFERENCES payments(id),
    
    -- Webhook details
    provider TEXT NOT NULL,
    event_type TEXT NOT NULL,
    provider_id TEXT,
    
    -- Request data
    payload JSONB NOT NULL,
    headers JSONB,
    
    -- Processing
    processed BOOLEAN DEFAULT FALSE,
    processed_at TIMESTAMPTZ,
    error TEXT,
    
    -- Timestamps
    received_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Deduplication
    idempotency_key TEXT,
    UNIQUE(provider, idempotency_key)
);

-- 3. Índices para performance
CREATE INDEX IF NOT EXISTS idx_payments_condo ON payments(condo_id);
CREATE INDEX IF NOT EXISTS idx_payments_user ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_invoice ON payments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_provider_id ON payments(provider_payment_id);
CREATE INDEX IF NOT EXISTS idx_payments_created ON payments(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_webhooks_payment ON payment_webhooks_log(payment_id);
CREATE INDEX IF NOT EXISTS idx_webhooks_processed ON payment_webhooks_log(processed);
CREATE INDEX IF NOT EXISTS idx_webhooks_provider_id ON payment_webhooks_log(provider_id);

-- 4. RLS Policies

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Users can view their own payments
CREATE POLICY "Users can view own payments"
ON payments FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Sindico can view condo payments
CREATE POLICY "Sindico can view condo payments"
ON payments FOR SELECT
TO authenticated
USING (
    condo_id IN (
        SELECT condo_id 
        FROM users 
        WHERE id = auth.uid() AND role IN ('sindico', 'superadmin')
    )
);

-- System can manage all payments (for API calls)
CREATE POLICY "Service role full access"
ON payments FOR ALL
TO service_role
USING (TRUE)
WITH CHECK (TRUE);

-- Webhooks log (only service role)
ALTER TABLE payment_webhooks_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role webhooks access"
ON payment_webhooks_log FOR ALL
TO service_role
USING (TRUE)
WITH CHECK (TRUE);

-- 5. Function to update payment status
CREATE OR REPLACE FUNCTION update_payment_status()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    
    -- Set paid_at when status changes to paid
    IF NEW.status = 'paid' AND OLD.status != 'paid' THEN
        NEW.paid_at = NOW();
        
        -- Update invoice if linked
        IF NEW.invoice_id IS NOT NULL THEN
            UPDATE resident_invoices
            SET status = 'paid', paid_at = NOW()
            WHERE id = NEW.invoice_id;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER payment_status_update
BEFORE UPDATE ON payments
FOR EACH ROW
EXECUTE FUNCTION update_payment_status();

-- 6. Verificar estrutura criada
SELECT 
    table_name,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public' 
AND table_name IN ('payments', 'payment_webhooks_log')
ORDER BY table_name;
