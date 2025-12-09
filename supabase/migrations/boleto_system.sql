-- =============================================
-- Migration: Sistema de Boletos
-- Execute no Supabase SQL Editor
-- =============================================

-- 1. Adicionar campos extras na tabela invoices (se não existirem)
DO $$
BEGIN
    -- Adicionar boleto_barcode se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'invoices' AND column_name = 'boleto_barcode') THEN
        ALTER TABLE invoices ADD COLUMN boleto_barcode VARCHAR(50);
    END IF;

    -- Adicionar boleto_expiration se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'invoices' AND column_name = 'boleto_expiration') THEN
        ALTER TABLE invoices ADD COLUMN boleto_expiration DATE;
    END IF;

    -- Adicionar provider_id se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'invoices' AND column_name = 'provider_id') THEN
        ALTER TABLE invoices ADD COLUMN provider_id VARCHAR(100);
    END IF;

    -- Adicionar provider_method se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'invoices' AND column_name = 'provider_method') THEN
        ALTER TABLE invoices ADD COLUMN provider_method VARCHAR(20);
    END IF;

    -- Adicionar unit_id se não existir (para faturas de unidades)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'invoices' AND column_name = 'unit_id') THEN
        ALTER TABLE invoices ADD COLUMN unit_id UUID REFERENCES units(id);
    END IF;

    -- Adicionar payer_name se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'invoices' AND column_name = 'payer_name') THEN
        ALTER TABLE invoices ADD COLUMN payer_name VARCHAR(255);
    END IF;

    -- Adicionar payer_email se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'invoices' AND column_name = 'payer_email') THEN
        ALTER TABLE invoices ADD COLUMN payer_email VARCHAR(255);
    END IF;

    -- Adicionar payer_cpf_cnpj se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'invoices' AND column_name = 'payer_cpf_cnpj') THEN
        ALTER TABLE invoices ADD COLUMN payer_cpf_cnpj VARCHAR(20);
    END IF;
END $$;

-- 2. Criar tabela de logs de pagamento
CREATE TABLE IF NOT EXISTS payment_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE,
    condo_id UUID REFERENCES condos(id) ON DELETE CASCADE,
    event_type VARCHAR(50) NOT NULL, -- payment.created, payment.updated, etc
    status VARCHAR(30), -- approved, pending, rejected, etc
    provider VARCHAR(20) DEFAULT 'mercadopago',
    provider_payment_id VARCHAR(100),
    raw_payload JSONB,
    processed_at TIMESTAMPTZ DEFAULT now(),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Índices para payment_logs
CREATE INDEX IF NOT EXISTS idx_payment_logs_invoice ON payment_logs(invoice_id);
CREATE INDEX IF NOT EXISTS idx_payment_logs_condo ON payment_logs(condo_id);
CREATE INDEX IF NOT EXISTS idx_payment_logs_event ON payment_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_payment_logs_created ON payment_logs(created_at);

-- RLS para payment_logs
ALTER TABLE payment_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Superadmin can manage payment_logs" ON payment_logs;
CREATE POLICY "Superadmin can manage payment_logs" ON payment_logs
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'superadmin')
  );

DROP POLICY IF EXISTS "Sindico can view condo payment_logs" ON payment_logs;
CREATE POLICY "Sindico can view condo payment_logs" ON payment_logs
  FOR SELECT USING (
    condo_id IN (SELECT condo_id FROM users WHERE id = auth.uid() AND role = 'sindico')
  );

-- 3. Função para gerar invoices mensais
CREATE OR REPLACE FUNCTION generate_monthly_invoices()
RETURNS INTEGER AS $$
DECLARE
    invoice_count INTEGER := 0;
    sub RECORD;
BEGIN
    -- Para cada assinatura ativa
    FOR sub IN 
        SELECT s.id, s.condo_id, s.valor_mensal_cobrado, s.data_renovacao,
               c.nome as condo_nome, c.email_contato
        FROM subscriptions s
        JOIN condos c ON s.condo_id = c.id
        WHERE s.status = 'ativo'
        AND (s.data_renovacao IS NULL OR s.data_renovacao <= CURRENT_DATE)
    LOOP
        -- Criar invoice
        INSERT INTO invoices (
            condo_id, 
            subscription_id, 
            valor, 
            data_vencimento, 
            status,
            metodo_pagamento
        ) VALUES (
            sub.condo_id,
            sub.id,
            sub.valor_mensal_cobrado,
            CURRENT_DATE + INTERVAL '10 days',
            'pendente',
            'boleto'
        );
        
        -- Atualizar data_renovacao
        UPDATE subscriptions 
        SET data_renovacao = CURRENT_DATE + INTERVAL '1 month'
        WHERE id = sub.id;
        
        invoice_count := invoice_count + 1;
    END LOOP;
    
    RETURN invoice_count;
END;
$$ LANGUAGE plpgsql;

-- 4. Função para marcar faturas vencidas
CREATE OR REPLACE FUNCTION mark_overdue_invoices()
RETURNS INTEGER AS $$
DECLARE
    updated_count INTEGER;
BEGIN
    UPDATE invoices
    SET status = 'vencido', updated_at = now()
    WHERE status = 'pendente'
    AND data_vencimento < CURRENT_DATE;
    
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    RETURN updated_count;
END;
$$ LANGUAGE plpgsql;

-- 5. Índice para boleto_barcode
CREATE INDEX IF NOT EXISTS idx_invoices_boleto_barcode ON invoices(boleto_barcode);
CREATE INDEX IF NOT EXISTS idx_invoices_provider_id ON invoices(provider_id);

COMMENT ON TABLE payment_logs IS 'Log de eventos de pagamento do Mercado Pago';
COMMENT ON FUNCTION generate_monthly_invoices() IS 'Gera faturas mensais para assinaturas ativas';
COMMENT ON FUNCTION mark_overdue_invoices() IS 'Marca faturas vencidas';
