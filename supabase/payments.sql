-- =============================================
-- Condomínio Fácil - Payments Schema
-- Execute this SQL in Supabase SQL Editor
-- =============================================

-- Payments Table
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  condo_id UUID REFERENCES condos(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES subscriptions(id),
  valor DECIMAL(10,2) NOT NULL,
  status TEXT DEFAULT 'pendente' CHECK (status IN ('pendente', 'pago', 'cancelado', 'expirado')),
  pix_code TEXT,
  pix_qrcode_base64 TEXT,
  txid TEXT, -- Transaction ID from Banco Inter
  data_vencimento DATE NOT NULL,
  data_pagamento TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_payments_condo ON payments(condo_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);

-- Enable RLS
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can see payments of their condo" ON payments
  FOR SELECT USING (
    condo_id IN (SELECT condo_id FROM users WHERE id = auth.uid())
    OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'superadmin')
  );

CREATE POLICY "Superadmin can manage all payments" ON payments
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'superadmin')
  );

CREATE POLICY "System can insert payments" ON payments
  FOR INSERT WITH CHECK (true);

-- =============================================
-- Update subscriptions to add more fields
-- =============================================
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS ultimo_pagamento TIMESTAMPTZ;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS proximo_vencimento DATE;

-- =============================================
-- Function to check and update subscription status
-- Run this daily via pg_cron
-- =============================================
CREATE OR REPLACE FUNCTION check_subscription_status()
RETURNS void AS $$
BEGIN
  -- Suspend subscriptions with overdue payments
  UPDATE subscriptions 
  SET status = 'suspenso'
  WHERE status = 'ativo' 
  AND data_fim < CURRENT_DATE - INTERVAL '5 days';
  
  -- Activate subscriptions with recent payments
  UPDATE subscriptions s
  SET status = 'ativo', data_fim = data_fim + INTERVAL '1 month'
  FROM payments p
  WHERE p.subscription_id = s.id
  AND p.status = 'pago'
  AND p.data_pagamento > s.data_fim - INTERVAL '7 days';
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- Done! Run check_subscription_status() daily
-- =============================================
