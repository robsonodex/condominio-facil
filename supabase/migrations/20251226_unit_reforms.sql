-- Migration: RJ Module - Obras e Reformas (NBR 16.280)
-- Tabela para controle de reformas nas unidades

CREATE TABLE IF NOT EXISTS unit_reforms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  condo_id UUID REFERENCES condos(id) ON DELETE CASCADE,
  unit_id UUID REFERENCES units(id) ON DELETE CASCADE,
  solicitante_id UUID REFERENCES users(id) ON DELETE SET NULL,
  
  -- Descrição da obra
  descricao TEXT NOT NULL,
  tipo_obra VARCHAR(50) DEFAULT 'reforma' CHECK (tipo_obra IN ('reforma', 'manutencao', 'instalacao', 'estrutural')),
  
  -- Documentos obrigatórios (NBR 16.280)
  art_rrt_url TEXT NOT NULL, -- ART ou RRT obrigatório por lei
  cronograma_url TEXT,
  projeto_url TEXT,
  
  -- Datas previstas
  inicio_previsto DATE,
  fim_previsto DATE,
  
  -- Status do fluxo de aprovação
  status VARCHAR(20) DEFAULT 'analise' CHECK (status IN (
    'analise',      -- Aguardando análise do síndico
    'pendente',     -- Síndico solicitou ajustes
    'autorizada',   -- Aprovada
    'rejeitada',    -- Negada
    'em_andamento', -- Obra iniciada
    'concluida',    -- Finalizada
    'cancelada'     -- Cancelada pelo morador
  )),
  
  -- Histórico de aprovação
  motivo_rejeicao TEXT,
  observacoes_sindico TEXT,
  aprovado_por UUID REFERENCES users(id),
  aprovado_em TIMESTAMPTZ,
  
  -- Notificação aos vizinhos
  vizinhos_notificados BOOLEAN DEFAULT false,
  data_notificacao_vizinhos TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_unit_reforms_condo ON unit_reforms(condo_id);
CREATE INDEX IF NOT EXISTS idx_unit_reforms_unit ON unit_reforms(unit_id);
CREATE INDEX IF NOT EXISTS idx_unit_reforms_status ON unit_reforms(status);
CREATE INDEX IF NOT EXISTS idx_unit_reforms_solicitante ON unit_reforms(solicitante_id);

-- RLS
ALTER TABLE unit_reforms ENABLE ROW LEVEL SECURITY;

-- Moradores podem ver suas próprias solicitações
CREATE POLICY "Moradores podem ver suas reformas"
ON unit_reforms FOR SELECT
USING (
  solicitante_id = auth.uid() 
  OR condo_id IN (SELECT condo_id FROM users WHERE id = auth.uid())
);

-- Moradores podem criar reformas para suas unidades
CREATE POLICY "Moradores podem solicitar reformas"
ON unit_reforms FOR INSERT
WITH CHECK (
  solicitante_id = auth.uid()
);

-- Síndicos podem gerenciar reformas do condomínio
CREATE POLICY "Síndicos podem gerenciar reformas"
ON unit_reforms FOR ALL
USING (
  condo_id IN (SELECT condo_id FROM users WHERE id = auth.uid() AND role IN ('sindico', 'superadmin'))
);

-- Moradores podem atualizar suas reformas pendentes
CREATE POLICY "Moradores podem atualizar reformas pendentes"
ON unit_reforms FOR UPDATE
USING (
  solicitante_id = auth.uid() AND status IN ('analise', 'pendente')
);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_unit_reforms_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_unit_reforms_updated_at
BEFORE UPDATE ON unit_reforms
FOR EACH ROW EXECUTE FUNCTION update_unit_reforms_updated_at();

-- Comentários
COMMENT ON TABLE unit_reforms IS 'Controle de Obras e Reformas conforme NBR 16.280 - Upload de ART/RRT obrigatório';
COMMENT ON COLUMN unit_reforms.art_rrt_url IS 'Anotação de Responsabilidade Técnica (ART) ou Registro de Responsabilidade Técnica (RRT) - OBRIGATÓRIO';
COMMENT ON COLUMN unit_reforms.status IS 'analise: Aguardando | pendente: Ajustes | autorizada: OK | rejeitada: Negada | em_andamento: Iniciada | concluida: Fim';
