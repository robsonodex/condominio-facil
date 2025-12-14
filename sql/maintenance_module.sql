-- Gestão de Manutenção - Fornecedores
CREATE TABLE IF NOT EXISTS maintenance_suppliers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    condo_id UUID NOT NULL REFERENCES condos(id) ON DELETE CASCADE,
    nome TEXT NOT NULL,
    especialidade TEXT, -- Ex: Encanador, Eletricista, Pintor
    telefone TEXT,
    email TEXT,
    rating NUMERIC(2,1) DEFAULT 0 CHECK (rating >= 0 AND rating <= 5),
    total_servicos INTEGER DEFAULT 0,
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Gestão de Manutenção - Ordens de Serviço
CREATE TABLE IF NOT EXISTS maintenance_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    condo_id UUID NOT NULL REFERENCES condos(id) ON DELETE CASCADE,
    titulo TEXT NOT NULL,
    descricao TEXT,
    tipo TEXT CHECK (tipo IN ('preventiva', 'corretiva', 'urgente')) DEFAULT 'corretiva',
    status TEXT CHECK (status IN ('agendado', 'em_execucao', 'concluido', 'cancelado')) DEFAULT 'agendado',
    prioridade TEXT CHECK (prioridade IN ('baixa', 'media', 'alta')) DEFAULT 'media',
    local TEXT, -- Ex: "Bloco A - Apto 101" ou "Área de Lazer"
    fornecedor_id UUID REFERENCES maintenance_suppliers(id) ON DELETE SET NULL,
    data_agendada TIMESTAMP WITH TIME ZONE,
    data_inicio TIMESTAMP WITH TIME ZONE,
    data_conclusao TIMESTAMP WITH TIME ZONE,
    valor_estimado NUMERIC(10,2),
    valor_realizado NUMERIC(10,2),
    observacoes TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_maintenance_suppliers_condo ON maintenance_suppliers(condo_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_suppliers_ativo ON maintenance_suppliers(ativo);
CREATE INDEX IF NOT EXISTS idx_maintenance_orders_condo ON maintenance_orders(condo_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_orders_status ON maintenance_orders(status);
CREATE INDEX IF NOT EXISTS idx_maintenance_orders_fornecedor ON maintenance_orders(fornecedor_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_orders_data ON maintenance_orders(data_agendada);

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_maintenance_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER maintenance_suppliers_updated_at
    BEFORE UPDATE ON maintenance_suppliers
    FOR EACH ROW
    EXECUTE FUNCTION update_maintenance_updated_at();

CREATE TRIGGER maintenance_orders_updated_at
    BEFORE UPDATE ON maintenance_orders
    FOR EACH ROW
    EXECUTE FUNCTION update_maintenance_updated_at();

-- RLS Policies
ALTER TABLE maintenance_suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_orders ENABLE ROW LEVEL SECURITY;

-- Políticas para fornecedores
CREATE POLICY "Fornecedores visíveis para membros do condomínio"
    ON maintenance_suppliers FOR SELECT
    USING (
        condo_id IN (SELECT condo_id FROM users WHERE id = auth.uid())
        OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'superadmin')
    );

CREATE POLICY "Síndico/Admin pode gerenciar fornecedores"
    ON maintenance_suppliers FOR ALL
    USING (
        condo_id IN (SELECT condo_id FROM users WHERE id = auth.uid() AND role IN ('sindico', 'superadmin'))
    );

-- Políticas para ordens de serviço
CREATE POLICY "Ordens visíveis para membros do condomínio"
    ON maintenance_orders FOR SELECT
    USING (
        condo_id IN (SELECT condo_id FROM users WHERE id = auth.uid())
        OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'superadmin')
    );

CREATE POLICY "Síndico/Admin pode gerenciar ordens"
    ON maintenance_orders FOR ALL
    USING (
        condo_id IN (SELECT condo_id FROM users WHERE id = auth.uid() AND role IN ('sindico', 'superadmin'))
    );

-- Dados de exemplo (opcional)
-- INSERT INTO maintenance_suppliers (condo_id, nome, especialidade, telefone, email, rating, total_servicos) VALUES
-- ((SELECT id FROM condos LIMIT 1), 'Hidráulica Silva', 'Encanador', '(11) 98765-4321', 'contato@hidraulicasilva.com', 4.5, 12),
-- ((SELECT id FROM condos LIMIT 1), 'Elétrica Luz', 'Eletricista', '(11) 97654-3210', 'luz@eletrica.com', 4.8, 8),
-- ((SELECT id FROM condos LIMIT 1), 'Pinturas Premium', 'Pintor', '(11) 96543-2109', 'pinturas@premium.com', 4.2, 15);
