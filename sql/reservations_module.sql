-- =============================================
-- MÓDULO DE RESERVAS DE ÁREAS COMUNS
-- Execute este script no SQL Editor do Supabase
-- =============================================

-- 1. Tabela de Áreas Comuns
CREATE TABLE IF NOT EXISTS common_areas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    condo_id UUID NOT NULL REFERENCES condos(id) ON DELETE CASCADE,
    nome TEXT NOT NULL,
    descricao TEXT,
    capacidade_maxima INTEGER DEFAULT 20,
    valor_taxa DECIMAL(10,2) DEFAULT 0,
    requer_aprovacao BOOLEAN DEFAULT false,
    horario_abertura TIME DEFAULT '08:00',
    horario_fechamento TIME DEFAULT '22:00',
    dias_permitidos TEXT[] DEFAULT ARRAY['seg','ter','qua','qui','sex','sab','dom'],
    foto_url TEXT,
    regras TEXT,
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Tabela de Reservas
CREATE TABLE IF NOT EXISTS reservations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    condo_id UUID NOT NULL REFERENCES condos(id) ON DELETE CASCADE,
    area_id UUID NOT NULL REFERENCES common_areas(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id),
    unidade_id UUID REFERENCES units(id),
    data_reserva DATE NOT NULL,
    horario_inicio TIME NOT NULL,
    horario_fim TIME NOT NULL,
    num_convidados INTEGER DEFAULT 0,
    observacoes TEXT,
    status TEXT DEFAULT 'pendente' CHECK (status IN ('pendente', 'aprovada', 'rejeitada', 'cancelada', 'concluida')),
    motivo_rejeicao TEXT,
    aprovado_por UUID REFERENCES users(id),
    data_aprovacao TIMESTAMPTZ,
    valor_cobrado DECIMAL(10,2) DEFAULT 0,
    comprovante_pagamento TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Índices para performance
CREATE INDEX IF NOT EXISTS idx_reservations_condo ON reservations(condo_id);
CREATE INDEX IF NOT EXISTS idx_reservations_area ON reservations(area_id);
CREATE INDEX IF NOT EXISTS idx_reservations_data ON reservations(data_reserva);
CREATE INDEX IF NOT EXISTS idx_reservations_status ON reservations(status);
CREATE INDEX IF NOT EXISTS idx_common_areas_condo ON common_areas(condo_id);

-- 4. RLS Policies

ALTER TABLE common_areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;

-- Áreas Comuns: Todos do condomínio podem ver
CREATE POLICY "common_areas_select" ON common_areas
    FOR SELECT USING (
        condo_id IN (SELECT condo_id FROM users WHERE id = auth.uid())
        OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'superadmin')
    );

-- Áreas Comuns: Síndico pode gerenciar
CREATE POLICY "common_areas_insert" ON common_areas
    FOR INSERT WITH CHECK (
        condo_id IN (SELECT condo_id FROM users WHERE id = auth.uid() AND role IN ('sindico', 'superadmin'))
    );

CREATE POLICY "common_areas_update" ON common_areas
    FOR UPDATE USING (
        condo_id IN (SELECT condo_id FROM users WHERE id = auth.uid() AND role IN ('sindico', 'superadmin'))
    );

CREATE POLICY "common_areas_delete" ON common_areas
    FOR DELETE USING (
        condo_id IN (SELECT condo_id FROM users WHERE id = auth.uid() AND role IN ('sindico', 'superadmin'))
    );

-- Reservas: Ver do próprio condomínio
CREATE POLICY "reservations_select" ON reservations
    FOR SELECT USING (
        condo_id IN (SELECT condo_id FROM users WHERE id = auth.uid())
        OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'superadmin')
    );

-- Reservas: Usuário pode criar
CREATE POLICY "reservations_insert" ON reservations
    FOR INSERT WITH CHECK (
        user_id = auth.uid() AND
        condo_id IN (SELECT condo_id FROM users WHERE id = auth.uid())
    );

-- Reservas: Próprio usuário ou síndico pode atualizar
CREATE POLICY "reservations_update" ON reservations
    FOR UPDATE USING (
        user_id = auth.uid() OR
        condo_id IN (SELECT condo_id FROM users WHERE id = auth.uid() AND role IN ('sindico', 'superadmin'))
    );

-- Reservas: Próprio usuário ou síndico pode deletar
CREATE POLICY "reservations_delete" ON reservations
    FOR DELETE USING (
        user_id = auth.uid() OR
        condo_id IN (SELECT condo_id FROM users WHERE id = auth.uid() AND role IN ('sindico', 'superadmin'))
    );

-- 5. Função para verificar conflito de reserva
CREATE OR REPLACE FUNCTION check_reservation_conflict(
    p_area_id UUID,
    p_data DATE,
    p_inicio TIME,
    p_fim TIME,
    p_exclude_id UUID DEFAULT NULL
) RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM reservations
        WHERE area_id = p_area_id
        AND data_reserva = p_data
        AND status IN ('pendente', 'aprovada')
        AND (p_exclude_id IS NULL OR id != p_exclude_id)
        AND (
            (horario_inicio < p_fim AND horario_fim > p_inicio)
        )
    );
END;
$$ LANGUAGE plpgsql;
