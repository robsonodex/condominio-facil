-- ============================================
-- FIX: Corrigir tabela impersonations
-- O problema é que impersonator_id/target_user_id referenciavam auth.users
-- mas precisam referenciar public.users
-- ============================================

-- 1. Dropar tabelas antigas (se existirem)
DROP TABLE IF EXISTS impersonation_action_logs CASCADE;
DROP TABLE IF EXISTS impersonations CASCADE;

-- 2. Recriar tabela impersonations com referência à public.users
CREATE TABLE impersonations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    impersonator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    target_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    ended_at TIMESTAMPTZ,
    reason TEXT
);

-- 3. Índices
CREATE INDEX idx_impersonations_active ON impersonations (id) WHERE ended_at IS NULL;
CREATE INDEX idx_impersonations_expires ON impersonations (expires_at);
CREATE INDEX idx_impersonations_impersonator ON impersonations (impersonator_id);

-- 4. Tabela de logs
CREATE TABLE impersonation_action_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    impersonation_id UUID REFERENCES impersonations(id) ON DELETE SET NULL,
    impersonator_id UUID,
    target_user_id UUID,
    method TEXT,
    path TEXT,
    payload JSONB,
    response_status INT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. RLS
ALTER TABLE impersonations ENABLE ROW LEVEL SECURITY;
ALTER TABLE impersonation_action_logs ENABLE ROW LEVEL SECURITY;

-- 6. Policies - Usar Service Role (supabaseAdmin) para essas tabelas
-- Como essas operações são feitas via supabaseAdmin (service role), 
-- as policies só precisam permitir superadmin para consultas diretas

DROP POLICY IF EXISTS "superadmin_impersonations" ON impersonations;
CREATE POLICY "superadmin_impersonations" ON impersonations
    FOR ALL USING (is_superadmin());

DROP POLICY IF EXISTS "superadmin_logs" ON impersonation_action_logs;
CREATE POLICY "superadmin_logs" ON impersonation_action_logs
    FOR ALL USING (is_superadmin());
