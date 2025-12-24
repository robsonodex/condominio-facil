-- supabase/migrations/20251224_mensageria.sql
-- Módulo de Mensageria - Sistema de Recebimento e Entrega de Encomendas

-- Tabela principal de entregas/encomendas da mensageria
CREATE TABLE IF NOT EXISTS mensageria_entregas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    condo_id UUID NOT NULL REFERENCES condos(id) ON DELETE CASCADE,
    unit_id UUID REFERENCES units(id),
    morador_id UUID REFERENCES users(id),
    
    -- Dados do recebimento
    remetente VARCHAR(200),
    descricao TEXT,
    tipo VARCHAR(50) DEFAULT 'encomenda' CHECK (tipo IN ('carta', 'encomenda', 'pacote', 'documento', 'outro')),
    codigo_rastreio VARCHAR(100),
    foto_url TEXT,
    
    -- Status e controle
    status VARCHAR(50) DEFAULT 'aguardando' CHECK (status IN ('aguardando', 'notificado', 'retirado', 'devolvido')),
    
    -- Recebimento (pela mensageria)
    recebido_por UUID REFERENCES users(id),
    data_recebimento TIMESTAMPTZ DEFAULT NOW(),
    
    -- Retirada (pelo morador)
    retirado_por_nome VARCHAR(200),
    retirado_por_documento VARCHAR(50),
    data_retirada TIMESTAMPTZ,
    entregue_por UUID REFERENCES users(id),
    
    -- Notificações
    notificado_em TIMESTAMPTZ,
    notificado_via VARCHAR(50)[], -- ['email', 'whatsapp', 'push']
    
    -- Metadados
    observacoes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para otimização
CREATE INDEX IF NOT EXISTS idx_mensageria_condo ON mensageria_entregas(condo_id);
CREATE INDEX IF NOT EXISTS idx_mensageria_unit ON mensageria_entregas(unit_id);
CREATE INDEX IF NOT EXISTS idx_mensageria_morador ON mensageria_entregas(morador_id);
CREATE INDEX IF NOT EXISTS idx_mensageria_status ON mensageria_entregas(status);
CREATE INDEX IF NOT EXISTS idx_mensageria_created ON mensageria_entregas(created_at DESC);

-- Adicionar coluna mensageria_ativo na tabela condos (para ativar/desativar módulo)
ALTER TABLE condos ADD COLUMN IF NOT EXISTS mensageria_ativo BOOLEAN DEFAULT FALSE;

-- RLS Políticas
ALTER TABLE mensageria_entregas ENABLE ROW LEVEL SECURITY;

-- Política de leitura: Porteiro, síndico e morador do próprio condomínio
CREATE POLICY mensageria_select ON mensageria_entregas 
FOR SELECT USING (
    get_my_condo_id() = condo_id 
    OR get_my_role() = 'superadmin'
);

-- Política de inserção: Porteiro e síndico podem cadastrar
CREATE POLICY mensageria_insert ON mensageria_entregas 
FOR INSERT WITH CHECK (
    get_my_condo_id() = condo_id 
    AND get_my_role() IN ('porteiro', 'sindico', 'superadmin')
);

-- Política de atualização: Porteiro e síndico podem atualizar (para registrar retirada)
CREATE POLICY mensageria_update ON mensageria_entregas 
FOR UPDATE USING (
    get_my_condo_id() = condo_id 
    AND get_my_role() IN ('porteiro', 'sindico', 'superadmin')
);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_mensageria_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_mensageria_updated_at ON mensageria_entregas;
CREATE TRIGGER trigger_mensageria_updated_at
    BEFORE UPDATE ON mensageria_entregas
    FOR EACH ROW
    EXECUTE FUNCTION update_mensageria_updated_at();

-- Comentários para documentação
COMMENT ON TABLE mensageria_entregas IS 'Módulo de mensageria - controle de encomendas e entregas';
COMMENT ON COLUMN mensageria_entregas.status IS 'aguardando=chegou, notificado=morador avisado, retirado=entregue, devolvido=retornou';
