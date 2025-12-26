-- Migration: RJ Module - Taxa de Incêndio FUNESBOM
-- Controle de pagamento da taxa anual de bombeiros

CREATE TABLE IF NOT EXISTS fire_tax_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  condo_id UUID REFERENCES condos(id) ON DELETE CASCADE,
  cbmerj_numero VARCHAR(50), -- Código do imóvel no Corpo de Bombeiros
  exercicio INT NOT NULL, -- Ano fiscal (2024, 2025...)
  data_vencimento DATE,
  data_pagamento DATE,
  valor DECIMAL(10,2),
  comprovante_url TEXT,
  status VARCHAR(20) DEFAULT 'pendente' CHECK (status IN ('pendente', 'pago', 'vencido')),
  observacoes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Evitar duplicatas por ano
  UNIQUE(condo_id, exercicio)
);

-- Tabela para armazenar o número CBMERJ do condomínio
-- (pode ser adicionado na tabela condos se preferir)
ALTER TABLE condos ADD COLUMN IF NOT EXISTS cbmerj_numero VARCHAR(50);
ALTER TABLE condos ADD COLUMN IF NOT EXISTS certificado_bombeiros_url TEXT;
ALTER TABLE condos ADD COLUMN IF NOT EXISTS certificado_bombeiros_validade DATE;

-- Índices
CREATE INDEX IF NOT EXISTS idx_fire_tax_condo ON fire_tax_payments(condo_id);
CREATE INDEX IF NOT EXISTS idx_fire_tax_exercicio ON fire_tax_payments(exercicio);
CREATE INDEX IF NOT EXISTS idx_fire_tax_status ON fire_tax_payments(status);

-- RLS
ALTER TABLE fire_tax_payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Síndicos podem ver taxas do seu condomínio" ON fire_tax_payments;
DROP POLICY IF EXISTS "Síndicos podem gerenciar taxas do seu condomínio" ON fire_tax_payments;

CREATE POLICY "Síndicos podem ver taxas do seu condomínio"
ON fire_tax_payments FOR SELECT
USING (
  condo_id IN (SELECT condo_id FROM users WHERE id = auth.uid())
);

CREATE POLICY "Síndicos podem gerenciar taxas do seu condomínio"
ON fire_tax_payments FOR ALL
USING (
  condo_id IN (SELECT condo_id FROM users WHERE id = auth.uid() AND role IN ('sindico', 'superadmin'))
);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_fire_tax_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_fire_tax_updated_at ON fire_tax_payments;

CREATE TRIGGER trigger_fire_tax_updated_at
BEFORE UPDATE ON fire_tax_payments
FOR EACH ROW EXECUTE FUNCTION update_fire_tax_updated_at();

-- Comentários
COMMENT ON TABLE fire_tax_payments IS 'Controle da Taxa de Incêndio FUNESBOM - Obrigatória anual no RJ';
COMMENT ON COLUMN fire_tax_payments.cbmerj_numero IS 'Código do imóvel no Corpo de Bombeiros Militar do RJ';
COMMENT ON COLUMN fire_tax_payments.exercicio IS 'Ano fiscal do pagamento';
