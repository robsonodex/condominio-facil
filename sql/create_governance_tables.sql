-- Migration para criar tabelas de Governança e Manutenção
-- Execute este script ANTES do seed_governance.sql

-- 1. Tabela de Assembleias
CREATE TABLE IF NOT EXISTS assembleias (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    condo_id UUID NOT NULL REFERENCES condos(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    agenda TEXT,
    start_at TIMESTAMPTZ NOT NULL,
    end_at TIMESTAMPTZ,
    status TEXT DEFAULT 'agendada' CHECK (status IN ('agendada', 'em_andamento', 'concluida', 'cancelada')),
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Tabela de Enquetes
CREATE TABLE IF NOT EXISTS enquetes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    condo_id UUID NOT NULL REFERENCES condos(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    options JSONB NOT NULL DEFAULT '[]'::jsonb,
    start_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    end_at TIMESTAMPTZ,
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Tabela de Votos das Enquetes
CREATE TABLE IF NOT EXISTS enquete_votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    enquete_id UUID NOT NULL REFERENCES enquetes(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id),
    option_id TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(enquete_id, user_id)
);

-- 4. Tabela de Documentos de Governança
CREATE TABLE IF NOT EXISTS governance_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    condo_id UUID NOT NULL REFERENCES condos(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    file_url TEXT,
    folder TEXT,
    storage_path TEXT,
    category TEXT CHECK (category IN ('regimento', 'ata', 'contrato', 'financeiro', 'outro')),
    uploaded_by UUID NOT NULL REFERENCES users(id),
    uploaded_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Tabela de Equipamentos de Manutenção
CREATE TABLE IF NOT EXISTS manutencao_equipments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    condo_id UUID NOT NULL REFERENCES condos(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('Elevador', 'Bomba', 'Extintor', 'Portão', 'Outro')),
    location TEXT,
    status TEXT DEFAULT 'ativo' CHECK (status IN ('ativo', 'inativo', 'manutencao')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Tabela de Agendamentos de Manutenção
CREATE TABLE IF NOT EXISTS manutencao_schedule (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    equipment_id UUID NOT NULL REFERENCES manutencao_equipments(id) ON DELETE CASCADE,
    next_date DATE NOT NULL,
    frequency TEXT CHECK (frequency IN ('daily', 'weekly', 'monthly', 'quarterly', 'yearly')),
    description TEXT,
    completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_assembleias_condo ON assembleias(condo_id);
CREATE INDEX IF NOT EXISTS idx_enquetes_condo ON enquetes(condo_id);
CREATE INDEX IF NOT EXISTS idx_enquete_votes_enquete ON enquete_votes(enquete_id);
CREATE INDEX IF NOT EXISTS idx_governance_docs_condo ON governance_documents(condo_id);
CREATE INDEX IF NOT EXISTS idx_manutencao_equip_condo ON manutencao_equipments(condo_id);
CREATE INDEX IF NOT EXISTS idx_manutencao_sched_equip ON manutencao_schedule(equipment_id);

-- RLS Policies

-- Assembleias
ALTER TABLE assembleias ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view assembleias of their condo"
ON assembleias FOR SELECT
TO authenticated
USING (condo_id IN (SELECT condo_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Sindicos can create assembleias"
ON assembleias FOR INSERT
TO authenticated
WITH CHECK (
    condo_id IN (SELECT condo_id FROM users WHERE id = auth.uid() AND role = 'sindico')
);

-- Enquetes
ALTER TABLE enquetes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view enquetes of their condo"
ON enquetes FOR SELECT
TO authenticated
USING (condo_id IN (SELECT condo_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Sindicos can create enquetes"
ON enquetes FOR INSERT
TO authenticated
WITH CHECK (
    condo_id IN (SELECT condo_id FROM users WHERE id = auth.uid() AND role IN ('sindico', 'superadmin'))
);

-- Votos
ALTER TABLE enquete_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own votes"
ON enquete_votes FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can vote"
ON enquete_votes FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Documentos
ALTER TABLE governance_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view documents of their condo"
ON governance_documents FOR SELECT
TO authenticated
USING (condo_id IN (SELECT condo_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Sindicos can upload documents"
ON governance_documents FOR INSERT
TO authenticated
WITH CHECK (
    condo_id IN (SELECT condo_id FROM users WHERE id = auth.uid() AND role IN ('sindico', 'superadmin'))
);

-- Equipamentos
ALTER TABLE manutencao_equipments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view equipments of their condo"
ON manutencao_equipments FOR SELECT
TO authenticated
USING (condo_id IN (SELECT condo_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Sindicos can manage equipments"
ON manutencao_equipments FOR ALL
TO authenticated
USING (condo_id IN (SELECT condo_id FROM users WHERE id = auth.uid() AND role IN ('sindico', 'superadmin')));

-- Agendamentos
ALTER TABLE manutencao_schedule ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view schedules of their condo equipments"
ON manutencao_schedule FOR SELECT
TO authenticated
USING (
    equipment_id IN (
        SELECT id FROM manutencao_equipments 
        WHERE condo_id IN (SELECT condo_id FROM users WHERE id = auth.uid())
    )
);

CREATE POLICY "Sindicos can manage schedules"
ON manutencao_schedule FOR ALL
TO authenticated
USING (
    equipment_id IN (
        SELECT id FROM manutencao_equipments 
        WHERE condo_id IN (SELECT condo_id FROM users WHERE id = auth.uid() AND role IN ('sindico', 'superadmin'))
    )
);

-- Verificar tabelas criadas
SELECT 
    table_name,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public' 
AND table_name IN ('assembleias', 'enquetes', 'enquete_votes', 'governance_documents', 'manutencao_equipments', 'manutencao_schedule')
ORDER BY table_name;
