-- =============================================
-- Sistema de Suporte e Tickets
-- Execute no Supabase SQL Editor
-- =============================================

-- =============================================
-- 1. TABELA DE TICKETS
-- =============================================
CREATE TABLE IF NOT EXISTS support_tickets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    condo_id UUID NOT NULL REFERENCES condos(id) ON DELETE CASCADE,
    unit_id UUID REFERENCES units(id) ON DELETE SET NULL,
    requester_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Informações do ticket
    subject TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('tecnico', 'financeiro', 'geral', 'outro')),
    
    -- Prioridade e Status
    priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'priority')),
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'pending', 'resolved', 'closed')),
    
    -- Atribuição
    assignee_id UUID REFERENCES users(id) ON DELETE SET NULL,
    
    -- SLA
    sla_deadline TIMESTAMPTZ NOT NULL,
    sla_breached BOOLEAN DEFAULT FALSE,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    closed_at TIMESTAMPTZ
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_support_tickets_condo ON support_tickets(condo_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_requester ON support_tickets(requester_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_priority ON support_tickets(priority);
CREATE INDEX IF NOT EXISTS idx_support_tickets_sla ON support_tickets(sla_deadline);
CREATE INDEX IF NOT EXISTS idx_support_tickets_assignee ON support_tickets(assignee_id);

-- =============================================
-- 2. TABELA DE MENSAGENS
-- =============================================
CREATE TABLE IF NOT EXISTS support_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_id UUID NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    attachments JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_support_messages_ticket ON support_messages(ticket_id);
CREATE INDEX IF NOT EXISTS idx_support_messages_user ON support_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_support_messages_created ON support_messages(created_at);

-- =============================================
-- 3. TABELA DE LOGS
-- =============================================
CREATE TABLE IF NOT EXISTS support_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_id UUID REFERENCES support_tickets(id) ON DELETE CASCADE,
    actor_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    payload JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_support_logs_ticket ON support_logs(ticket_id);
CREATE INDEX IF NOT EXISTS idx_support_logs_actor ON support_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_support_logs_created ON support_logs(created_at);

-- =============================================
-- 4. ROW LEVEL SECURITY (RLS)
-- =============================================

ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_logs ENABLE ROW LEVEL SECURITY;

-- Support Tickets Policies
DROP POLICY IF EXISTS "Superadmin full access to support tickets" ON support_tickets;
CREATE POLICY "Superadmin full access to support tickets" ON support_tickets
    FOR ALL USING (
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'superadmin')
    );

DROP POLICY IF EXISTS "Sindico can see tickets from their condo" ON support_tickets;
CREATE POLICY "Sindico can see tickets from their condo" ON support_tickets
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role = 'sindico' 
            AND condo_id = support_tickets.condo_id
        )
    );

DROP POLICY IF EXISTS "Users can see their own tickets" ON support_tickets;
CREATE POLICY "Users can see their own tickets" ON support_tickets
    FOR SELECT USING (requester_id = auth.uid());

DROP POLICY IF EXISTS "Users can create tickets" ON support_tickets;
CREATE POLICY "Users can create tickets" ON support_tickets
    FOR INSERT WITH CHECK (requester_id = auth.uid());

DROP POLICY IF EXISTS "Sindico can update tickets from their condo" ON support_tickets;
CREATE POLICY "Sindico can update tickets from their condo" ON support_tickets
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role = 'sindico' 
            AND condo_id = support_tickets.condo_id
        )
    );

-- Support Messages Policies
DROP POLICY IF EXISTS "Users can see messages from accessible tickets" ON support_messages;
CREATE POLICY "Users can see messages from accessible tickets" ON support_messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM support_tickets st
            WHERE st.id = support_messages.ticket_id
            AND (
                -- Superadmin vê tudo
                EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'superadmin')
                -- Síndico vê tickets do seu condomínio
                OR EXISTS (
                    SELECT 1 FROM users 
                    WHERE id = auth.uid() 
                    AND role = 'sindico' 
                    AND condo_id = st.condo_id
                )
                -- Usuário vê seus próprios tickets
                OR st.requester_id = auth.uid()
            )
        )
    );

DROP POLICY IF EXISTS "Users can insert messages in accessible tickets" ON support_messages;
CREATE POLICY "Users can insert messages in accessible tickets" ON support_messages
    FOR INSERT WITH CHECK (
        user_id = auth.uid()
        AND EXISTS (
            SELECT 1 FROM support_tickets st
            WHERE st.id = support_messages.ticket_id
            AND (
                EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'superadmin')
                OR EXISTS (
                    SELECT 1 FROM users 
                    WHERE id = auth.uid() 
                    AND role = 'sindico' 
                    AND condo_id = st.condo_id
                )
                OR st.requester_id = auth.uid()
            )
        )
    );

-- Support Logs Policies
DROP POLICY IF EXISTS "Superadmin full access to support logs" ON support_logs;
CREATE POLICY "Superadmin full access to support logs" ON support_logs
    FOR ALL USING (
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'superadmin')
    );

DROP POLICY IF EXISTS "Sindico can see logs from their condo tickets" ON support_logs;
CREATE POLICY "Sindico can see logs from their condo tickets" ON support_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM support_tickets st
            JOIN users u ON u.id = auth.uid()
            WHERE st.id = support_logs.ticket_id
            AND u.role = 'sindico'
            AND u.condo_id = st.condo_id
        )
    );

-- =============================================
-- 5. TRIGGERS
-- =============================================

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_support_ticket_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_support_tickets_timestamp ON support_tickets;
CREATE TRIGGER update_support_tickets_timestamp
    BEFORE UPDATE ON support_tickets
    FOR EACH ROW
    EXECUTE FUNCTION update_support_ticket_timestamp();

-- =============================================
-- 6. FUNÇÕES AUXILIARES
-- =============================================

-- Função para calcular SLA deadline baseado no plano
CREATE OR REPLACE FUNCTION calculate_sla_deadline(
    p_condo_id UUID,
    p_priority TEXT
)
RETURNS TIMESTAMPTZ AS $$
DECLARE
    v_plan_name TEXT;
    v_sla_hours INTEGER;
BEGIN
    -- Buscar nome do plano do condomínio
    SELECT p.nome_plano INTO v_plan_name
    FROM subscriptions s
    JOIN plans p ON s.plano_id = p.id
    WHERE s.condo_id = p_condo_id
    AND s.status = 'ativo'
    LIMIT 1;
    
    -- Definir SLA baseado no plano
    IF v_plan_name = 'Básico' THEN
        v_sla_hours := 48;
    ELSIF v_plan_name = 'Profissional' OR v_plan_name = 'Intermediário' THEN
        v_sla_hours := 12;
    ELSIF v_plan_name = 'Avançado' THEN
        IF p_priority = 'priority' THEN
            v_sla_hours := 4;
        ELSE
            v_sla_hours := 4;
        END IF;
    ELSE
        v_sla_hours := 48; -- Default
    END IF;
    
    RETURN now() + (v_sla_hours || ' hours')::INTERVAL;
END;
$$ LANGUAGE plpgsql;

-- Função para verificar se pode usar prioridade específica
CREATE OR REPLACE FUNCTION can_use_priority(
    p_condo_id UUID,
    p_priority TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
    v_plan_name TEXT;
BEGIN
    -- Priority só disponível para plano Avançado
    IF p_priority != 'priority' THEN
        RETURN TRUE;
    END IF;
    
    SELECT p.nome_plano INTO v_plan_name
    FROM subscriptions s
    JOIN plans p ON s.plano_id = p.id
    WHERE s.condo_id = p_condo_id
    AND s.status = 'ativo'
    LIMIT 1;
    
    RETURN v_plan_name = 'Avançado';
END;
$$ LANGUAGE plpgsql;

-- Função para verificar SLA estourado (executar via cron)
CREATE OR REPLACE FUNCTION check_sla_breaches()
RETURNS INTEGER AS $$
DECLARE
    v_count INTEGER := 0;
    ticket RECORD;
BEGIN
    FOR ticket IN
        SELECT id, condo_id, subject, requester_id
        FROM support_tickets
        WHERE sla_deadline < now()
        AND status NOT IN ('resolved', 'closed')
        AND sla_breached = FALSE
    LOOP
        -- Marcar como SLA estourado
        UPDATE support_tickets
        SET sla_breached = TRUE
        WHERE id = ticket.id;
        
        -- Criar log
        INSERT INTO support_logs (ticket_id, action, payload)
        VALUES (
            ticket.id,
            'sla_breached',
            jsonb_build_object(
                'ticket_id', ticket.id,
                'subject', ticket.subject
            )
        );
        
        v_count := v_count + 1;
    END LOOP;
    
    RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- 7. VIEW PARA MÉTRICAS
-- =============================================

CREATE OR REPLACE VIEW support_metrics AS
SELECT
    COUNT(*) FILTER (WHERE status = 'open') as tickets_open,
    COUNT(*) FILTER (WHERE status = 'in_progress') as tickets_in_progress,
    COUNT(*) FILTER (WHERE status = 'pending') as tickets_pending,
    COUNT(*) FILTER (WHERE status = 'resolved') as tickets_resolved,
    COUNT(*) FILTER (WHERE status = 'closed') as tickets_closed,
    COUNT(*) FILTER (WHERE priority = 'priority') as tickets_priority,
    COUNT(*) FILTER (WHERE sla_breached = TRUE AND status NOT IN ('resolved', 'closed')) as tickets_sla_breached,
    AVG(EXTRACT(EPOCH FROM (closed_at - created_at))/3600) FILTER (WHERE closed_at IS NOT NULL) as avg_resolution_hours,
    COUNT(*) as total_tickets
FROM support_tickets;

-- =============================================
-- COMENTÁRIOS
-- =============================================

COMMENT ON TABLE support_tickets IS 'Tickets de suporte com SLA por plano';
COMMENT ON TABLE support_messages IS 'Mensagens/comentários dos tickets';
COMMENT ON TABLE support_logs IS 'Logs de ações nos tickets';
COMMENT ON FUNCTION calculate_sla_deadline IS 'Calcula deadline SLA baseado no plano (Básico: 48h, Profissional: 12h, Avançado: 4h)';
COMMENT ON FUNCTION can_use_priority IS 'Verifica se condomínio pode usar prioridade "priority" (apenas plano Avançado)';
COMMENT ON FUNCTION check_sla_breaches IS 'Identifica e marca tickets com SLA estourado (executar via pg_cron)';
