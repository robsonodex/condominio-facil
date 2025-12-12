-- ============================================================
-- ASSEMBLEIA DIGITAL 3.0 - MIGRAÇÃO COMPLETA
-- Condomínio Fácil - Módulo de Governança Formal
-- Data: 12/12/2024
-- ============================================================

-- ============================================================
-- 1. PRIMEIRO: REMOVER CONSTRAINTS ANTIGOS
-- ============================================================

-- Remove constraints antigos ANTES de qualquer alteração
ALTER TABLE assembleias DROP CONSTRAINT IF EXISTS assembleias_status_check;
ALTER TABLE assembleias DROP CONSTRAINT IF EXISTS assembleias_type_check;

-- ============================================================
-- 2. CORREÇÃO DE DADOS EXISTENTES
-- ============================================================

-- Agora podemos atualizar livremente (sem constraint ativo)
UPDATE assembleias 
SET status = 'scheduled' 
WHERE status NOT IN ('draft', 'scheduled', 'open', 'voting_closed', 'finalized', 'cancelled')
   OR status IS NULL;

-- ============================================================
-- 3. ADICIONAR NOVAS COLUNAS
-- ============================================================

ALTER TABLE assembleias 
ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'simple',
ADD COLUMN IF NOT EXISTS require_presence BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS block_defaulters BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS defaulter_days INTEGER DEFAULT 30,
ADD COLUMN IF NOT EXISTS quorum_install INTEGER DEFAULT 50,
ADD COLUMN IF NOT EXISTS opened_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS closed_at TIMESTAMPTZ;

-- ============================================================
-- 4. ADICIONAR NOVOS CONSTRAINTS
-- ============================================================

-- Agora adiciona os novos constraints
ALTER TABLE assembleias ADD CONSTRAINT assembleias_status_check 
    CHECK (status IN ('draft', 'scheduled', 'open', 'voting_closed', 'finalized', 'cancelled'));

DO $$
BEGIN
    ALTER TABLE assembleias ADD CONSTRAINT assembleias_type_check 
        CHECK (type IN ('simple', 'formal'));
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================
-- 3. TABELA DE PAUTAS
-- ============================================================

CREATE TABLE IF NOT EXISTS assembly_pautas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assembly_id UUID NOT NULL REFERENCES assembleias(id) ON DELETE CASCADE,
    order_index INTEGER NOT NULL DEFAULT 0,
    title TEXT NOT NULL,
    description TEXT,
    quorum_type TEXT NOT NULL DEFAULT 'simple' CHECK (quorum_type IN ('simple', 'absolute', 'two_thirds', 'unanimous', 'custom')),
    quorum_custom INTEGER, -- Para quórum personalizado
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'voting', 'closed')),
    result TEXT CHECK (result IN ('approved', 'rejected', 'tie', 'no_quorum')),
    votes_yes INTEGER DEFAULT 0,
    votes_no INTEGER DEFAULT 0,
    votes_abstain INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_assembly_pautas_assembly_id ON assembly_pautas(assembly_id);

-- ============================================================
-- 4. TABELA DE PRESENÇAS
-- ============================================================

CREATE TABLE IF NOT EXISTS assembly_presences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assembly_id UUID NOT NULL REFERENCES assembleias(id) ON DELETE CASCADE,
    unit_id UUID NOT NULL REFERENCES units(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    checked_at TIMESTAMPTZ DEFAULT NOW(),
    ip_address TEXT,
    user_agent TEXT,
    geolocation TEXT,
    selfie_url TEXT,
    method TEXT DEFAULT 'button' CHECK (method IN ('button', 'qrcode', 'whatsapp')),
    
    UNIQUE(assembly_id, unit_id) -- Uma presença por unidade
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_assembly_presences_assembly_id ON assembly_presences(assembly_id);
CREATE INDEX IF NOT EXISTS idx_assembly_presences_unit_id ON assembly_presences(unit_id);

-- ============================================================
-- 5. TABELA DE VOTOS FORMAIS
-- ============================================================

CREATE TABLE IF NOT EXISTS assembly_votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pauta_id UUID NOT NULL REFERENCES assembly_pautas(id) ON DELETE CASCADE,
    unit_id UUID NOT NULL REFERENCES units(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    choice TEXT NOT NULL CHECK (choice IN ('yes', 'no', 'abstain')),
    origin TEXT DEFAULT 'web' CHECK (origin IN ('web', 'mobile', 'whatsapp')),
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(pauta_id, unit_id) -- Um voto por unidade por pauta
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_assembly_votes_pauta_id ON assembly_votes(pauta_id);
CREATE INDEX IF NOT EXISTS idx_assembly_votes_unit_id ON assembly_votes(unit_id);

-- ============================================================
-- 6. TABELA DE AUDITORIA
-- ============================================================

CREATE TABLE IF NOT EXISTS assembly_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assembly_id UUID REFERENCES assembleias(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    actor_id UUID REFERENCES auth.users(id),
    actor_role TEXT,
    target_type TEXT,
    target_id UUID,
    details JSONB,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_assembly_audit_logs_assembly_id ON assembly_audit_logs(assembly_id);
CREATE INDEX IF NOT EXISTS idx_assembly_audit_logs_event_type ON assembly_audit_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_assembly_audit_logs_created_at ON assembly_audit_logs(created_at);

-- ============================================================
-- 7. TABELA DE ATAS
-- ============================================================

CREATE TABLE IF NOT EXISTS assembly_atas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assembly_id UUID NOT NULL REFERENCES assembleias(id) ON DELETE CASCADE UNIQUE,
    content JSONB NOT NULL,
    hash_sha256 TEXT NOT NULL UNIQUE,
    qr_code_url TEXT,
    pdf_url TEXT,
    generated_at TIMESTAMPTZ DEFAULT NOW(),
    generated_by UUID NOT NULL REFERENCES auth.users(id)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_assembly_atas_hash ON assembly_atas(hash_sha256);

-- ============================================================
-- 8. RLS POLICIES
-- ============================================================

-- Habilitar RLS
ALTER TABLE assembly_pautas ENABLE ROW LEVEL SECURITY;
ALTER TABLE assembly_presences ENABLE ROW LEVEL SECURITY;
ALTER TABLE assembly_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE assembly_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE assembly_atas ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 8.1 POLICIES PARA PAUTAS
-- ============================================================

DROP POLICY IF EXISTS "pautas_select_same_condo" ON assembly_pautas;
CREATE POLICY "pautas_select_same_condo" ON assembly_pautas
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM assembleias a 
            WHERE a.id = assembly_pautas.assembly_id 
            AND a.condo_id = get_my_condo_id()
        )
    );

DROP POLICY IF EXISTS "pautas_insert_sindico" ON assembly_pautas;
CREATE POLICY "pautas_insert_sindico" ON assembly_pautas
    FOR INSERT WITH CHECK (
        get_my_role() IN ('superadmin', 'sindico')
        AND EXISTS (
            SELECT 1 FROM assembleias a 
            WHERE a.id = assembly_pautas.assembly_id 
            AND a.condo_id = get_my_condo_id()
        )
    );

DROP POLICY IF EXISTS "pautas_update_sindico" ON assembly_pautas;
CREATE POLICY "pautas_update_sindico" ON assembly_pautas
    FOR UPDATE USING (
        get_my_role() IN ('superadmin', 'sindico')
        AND EXISTS (
            SELECT 1 FROM assembleias a 
            WHERE a.id = assembly_pautas.assembly_id 
            AND a.condo_id = get_my_condo_id()
        )
    );

DROP POLICY IF EXISTS "pautas_delete_sindico" ON assembly_pautas;
CREATE POLICY "pautas_delete_sindico" ON assembly_pautas
    FOR DELETE USING (
        get_my_role() IN ('superadmin', 'sindico')
        AND EXISTS (
            SELECT 1 FROM assembleias a 
            WHERE a.id = assembly_pautas.assembly_id 
            AND a.condo_id = get_my_condo_id()
        )
    );

-- ============================================================
-- 8.2 POLICIES PARA PRESENÇAS
-- ============================================================

DROP POLICY IF EXISTS "presences_select_same_condo" ON assembly_presences;
CREATE POLICY "presences_select_same_condo" ON assembly_presences
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM assembleias a 
            WHERE a.id = assembly_presences.assembly_id 
            AND a.condo_id = get_my_condo_id()
        )
    );

DROP POLICY IF EXISTS "presences_insert_authenticated" ON assembly_presences;
CREATE POLICY "presences_insert_authenticated" ON assembly_presences
    FOR INSERT WITH CHECK (
        auth.uid() = user_id
        AND EXISTS (
            SELECT 1 FROM assembleias a 
            WHERE a.id = assembly_presences.assembly_id 
            AND a.condo_id = get_my_condo_id()
            AND a.status = 'open'
        )
    );

-- ============================================================
-- 8.3 POLICIES PARA VOTOS
-- ============================================================

DROP POLICY IF EXISTS "votes_select_same_condo" ON assembly_votes;
CREATE POLICY "votes_select_same_condo" ON assembly_votes
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM assembly_pautas p
            JOIN assembleias a ON a.id = p.assembly_id
            WHERE p.id = assembly_votes.pauta_id 
            AND a.condo_id = get_my_condo_id()
        )
    );

DROP POLICY IF EXISTS "votes_insert_authenticated" ON assembly_votes;
CREATE POLICY "votes_insert_authenticated" ON assembly_votes
    FOR INSERT WITH CHECK (
        auth.uid() = user_id
        AND EXISTS (
            SELECT 1 FROM assembly_pautas p
            JOIN assembleias a ON a.id = p.assembly_id
            WHERE p.id = assembly_votes.pauta_id 
            AND a.condo_id = get_my_condo_id()
            AND a.status = 'open'
            AND p.status = 'voting'
        )
    );

-- ============================================================
-- 8.4 POLICIES PARA AUDITORIA
-- ============================================================

DROP POLICY IF EXISTS "audit_select_sindico" ON assembly_audit_logs;
CREATE POLICY "audit_select_sindico" ON assembly_audit_logs
    FOR SELECT USING (
        get_my_role() IN ('superadmin', 'sindico')
        AND (
            assembly_id IS NULL
            OR EXISTS (
                SELECT 1 FROM assembleias a 
                WHERE a.id = assembly_audit_logs.assembly_id 
                AND a.condo_id = get_my_condo_id()
            )
        )
    );

DROP POLICY IF EXISTS "audit_insert_system" ON assembly_audit_logs;
CREATE POLICY "audit_insert_system" ON assembly_audit_logs
    FOR INSERT WITH CHECK (true); -- Sistema pode inserir sempre

-- ============================================================
-- 8.5 POLICIES PARA ATAS
-- ============================================================

DROP POLICY IF EXISTS "atas_select_same_condo" ON assembly_atas;
CREATE POLICY "atas_select_same_condo" ON assembly_atas
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM assembleias a 
            WHERE a.id = assembly_atas.assembly_id 
            AND a.condo_id = get_my_condo_id()
        )
    );

DROP POLICY IF EXISTS "atas_insert_sindico" ON assembly_atas;
CREATE POLICY "atas_insert_sindico" ON assembly_atas
    FOR INSERT WITH CHECK (
        get_my_role() IN ('superadmin', 'sindico')
        AND EXISTS (
            SELECT 1 FROM assembleias a 
            WHERE a.id = assembly_atas.assembly_id 
            AND a.condo_id = get_my_condo_id()
        )
    );

-- ============================================================
-- 9. FUNÇÃO PARA VERIFICAÇÃO PÚBLICA DE ATA
-- ============================================================

CREATE OR REPLACE FUNCTION verify_ata_hash(p_hash TEXT)
RETURNS TABLE (
    valid BOOLEAN,
    assembly_id UUID,
    assembly_title TEXT,
    condo_name TEXT,
    generated_at TIMESTAMPTZ
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        true as valid,
        a.assembly_id,
        ass.title as assembly_title,
        c.name as condo_name,
        a.generated_at
    FROM assembly_atas a
    JOIN assembleias ass ON ass.id = a.assembly_id
    JOIN condos c ON c.id = ass.condo_id
    WHERE a.hash_sha256 = p_hash;
    
    IF NOT FOUND THEN
        RETURN QUERY SELECT false, NULL::UUID, NULL::TEXT, NULL::TEXT, NULL::TIMESTAMPTZ;
    END IF;
END;
$$;

-- ============================================================
-- FIM DA MIGRAÇÃO
-- ============================================================
