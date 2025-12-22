-- supabase/migrations/20251222_impersonation_and_audit.sql
-- Sistema de Impersonificação e Auditoria para SuperAdmin

-- ==========================================
-- 1. TABELA DE IMPERSONAÇÕES
-- ==========================================
CREATE TABLE IF NOT EXISTS impersonations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    impersonator_id uuid NOT NULL REFERENCES users(id),
    target_user_id uuid NOT NULL REFERENCES users(id),
    target_condo_id uuid REFERENCES condos(id),
    reason text,
    started_at timestamptz DEFAULT now(),
    ended_at timestamptz,
    expires_at timestamptz NOT NULL,
    ip_address text,
    user_agent text,
    created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_impersonations_active 
    ON impersonations(impersonator_id, ended_at) 
    WHERE ended_at IS NULL;

-- ==========================================
-- 2. LOGS DE AÇÕES DURANTE IMPERSONIFICAÇÃO
-- ==========================================
CREATE TABLE IF NOT EXISTS impersonation_action_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    impersonation_id uuid REFERENCES impersonations(id) ON DELETE CASCADE,
    impersonator_id uuid REFERENCES users(id),
    target_user_id uuid REFERENCES users(id),
    method text,
    path text,
    payload jsonb,
    response_status int,
    created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_imp_action_logs_session 
    ON impersonation_action_logs(impersonation_id, created_at DESC);

-- ==========================================
-- 3. LOGS DE AUDITORIA GERAL
-- ==========================================
CREATE TABLE IF NOT EXISTS audit_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES users(id),
    condo_id uuid REFERENCES condos(id),
    action text NOT NULL, -- 'create', 'update', 'delete', 'login', 'logout', 'impersonate'
    entity_type text, -- 'user', 'condo', 'notice', 'occurrence', etc
    entity_id uuid,
    old_data jsonb,
    new_data jsonb,
    description text,
    ip_address text,
    user_agent text,
    metadata jsonb DEFAULT '{}',
    created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_condo ON audit_logs(condo_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action, created_at DESC);

-- ==========================================
-- 4. RLS POLICIES
-- ==========================================

-- Impersonations: apenas superadmin pode ver/criar
ALTER TABLE impersonations ENABLE ROW LEVEL SECURITY;

CREATE POLICY impersonations_superadmin_all ON impersonations
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'superadmin'
        )
    );

-- Impersonation Action Logs: apenas superadmin
ALTER TABLE impersonation_action_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY imp_action_logs_superadmin ON impersonation_action_logs
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'superadmin'
        )
    );

-- Audit Logs: superadmin vê tudo, síndico vê apenas do seu condo
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY audit_logs_superadmin ON audit_logs
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'superadmin'
        )
    );

CREATE POLICY audit_logs_sindico ON audit_logs
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'sindico'
            AND users.condo_id = audit_logs.condo_id
        )
    );

-- ==========================================
-- 5. FUNÇÃO HELPER PARA REGISTRAR AUDIT LOG
-- ==========================================
CREATE OR REPLACE FUNCTION log_audit(
    p_user_id uuid,
    p_condo_id uuid,
    p_action text,
    p_entity_type text,
    p_entity_id uuid,
    p_description text,
    p_old_data jsonb DEFAULT NULL,
    p_new_data jsonb DEFAULT NULL,
    p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_log_id uuid;
BEGIN
    INSERT INTO audit_logs (
        user_id, condo_id, action, entity_type, entity_id,
        description, old_data, new_data, metadata
    )
    VALUES (
        p_user_id, p_condo_id, p_action, p_entity_type, p_entity_id,
        p_description, p_old_data, p_new_data, p_metadata
    )
    RETURNING id INTO v_log_id;
    
    RETURN v_log_id;
END;
$$;
