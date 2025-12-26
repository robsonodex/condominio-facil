-- Migration: RJ Module - Autovistoria (Lei 6.400/RJ)
-- Tabela para controle de vistorias prediais obrigatórias

CREATE TABLE IF NOT EXISTS building_inspections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  condo_id UUID REFERENCES condos(id) ON DELETE CASCADE,
  data_realizacao DATE NOT NULL,
  data_limite_proxima DATE NOT NULL, -- Calculado automaticamente (+5 anos)
  engenheiro_responsavel VARCHAR(255),
  crea_cau_numero VARCHAR(50),
  status VARCHAR(20) DEFAULT 'vigente' CHECK (status IN ('vigente', 'proximo_vencimento', 'vencida')),
  laudo_url TEXT, -- Link para o PDF no Supabase Storage
  comunicado_prefeitura_url TEXT, -- Comprovante de envio à Prefeitura
  observacoes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_building_inspections_condo ON building_inspections(condo_id);
CREATE INDEX IF NOT EXISTS idx_building_inspections_status ON building_inspections(status);
CREATE INDEX IF NOT EXISTS idx_building_inspections_data_limite ON building_inspections(data_limite_proxima);

-- RLS
ALTER TABLE building_inspections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Síndicos podem ver vistorias do seu condomínio"
ON building_inspections FOR SELECT
USING (
  condo_id IN (SELECT condo_id FROM users WHERE id = auth.uid())
);

CREATE POLICY "Síndicos podem gerenciar vistorias do seu condomínio"
ON building_inspections FOR ALL
USING (
  condo_id IN (SELECT condo_id FROM users WHERE id = auth.uid() AND role IN ('sindico', 'superadmin'))
);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_building_inspections_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_building_inspections_updated_at
BEFORE UPDATE ON building_inspections
FOR EACH ROW EXECUTE FUNCTION update_building_inspections_updated_at();

-- Comentários
COMMENT ON TABLE building_inspections IS 'Controle de Autovistoria Predial (Lei 6.400/RJ) - Obrigatória a cada 5 anos';
COMMENT ON COLUMN building_inspections.data_limite_proxima IS 'Data limite para próxima vistoria (5 anos após realização)';
COMMENT ON COLUMN building_inspections.status IS 'vigente: OK | proximo_vencimento: <6 meses | vencida: Passou do prazo';
