-- =============================================
-- Condomínio Fácil - Correções de Segurança
-- Execute no Supabase SQL Editor
-- =============================================

-- =============================================
-- 1. ADICIONAR CAMPO gateway_payment_id UNIQUE
-- Para garantir idempotência nos webhooks
-- =============================================
ALTER TABLE invoices 
ADD COLUMN IF NOT EXISTS gateway_payment_id VARCHAR(100) UNIQUE;

CREATE INDEX IF NOT EXISTS idx_invoices_gateway_payment_id 
ON invoices(gateway_payment_id);

-- =============================================
-- 2. ATUALIZAR STATUS DA SUBSCRIPTION
-- Adicionar campo 'suspenso' se não existir
-- =============================================
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM pg_type t 
        JOIN pg_enum e ON t.oid = e.enumtypid 
        WHERE t.typname = 'subscription_status' AND e.enumlabel = 'suspenso'
    ) THEN
        -- Se estiver usando CHECK constraint em vez de ENUM
        ALTER TABLE subscriptions 
        DROP CONSTRAINT IF EXISTS subscriptions_status_check;
        
        ALTER TABLE subscriptions 
        ADD CONSTRAINT subscriptions_status_check 
        CHECK (status IN ('ativo', 'pendente_pagamento', 'cancelado', 'suspenso', 'teste'));
    END IF;
END $$;

-- =============================================
-- 3. TABELA DE RATE LIMITING (opcional, para produção)
-- =============================================
CREATE TABLE IF NOT EXISTS rate_limits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    endpoint VARCHAR(100) NOT NULL,
    request_count INTEGER DEFAULT 1,
    window_start TIMESTAMPTZ DEFAULT now(),
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, endpoint)
);

CREATE INDEX IF NOT EXISTS idx_rate_limits_user ON rate_limits(user_id, endpoint);

-- RLS
ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own rate limits" ON rate_limits;
CREATE POLICY "Users manage own rate limits" ON rate_limits
    FOR ALL USING (user_id = auth.uid());

-- =============================================
-- 4. FUNÇÃO: Limpar dados do usuário (LGPD)
-- =============================================
CREATE OR REPLACE FUNCTION delete_user_data(p_user_id UUID)
RETURNS TABLE(
    deleted_notices INTEGER,
    deleted_occurrences INTEGER,
    deleted_visitors INTEGER,
    deleted_notice_reads INTEGER,
    deleted_email_logs INTEGER,
    deleted_legal_acceptances INTEGER,
    anonymized_user BOOLEAN
) AS $$
DECLARE
    v_notices INTEGER;
    v_occurrences INTEGER;
    v_visitors INTEGER;
    v_notice_reads INTEGER;
    v_email_logs INTEGER;
    v_legal INTEGER;
BEGIN
    -- Deletar leituras de avisos
    DELETE FROM notice_reads WHERE user_id = p_user_id;
    GET DIAGNOSTICS v_notice_reads = ROW_COUNT;
    
    -- Deletar logs de email relacionados
    DELETE FROM email_logs WHERE user_id = p_user_id;
    GET DIAGNOSTICS v_email_logs = ROW_COUNT;
    
    -- Deletar aceites legais (manter registro anonimizado por compliance)
    UPDATE legal_acceptances 
    SET email = 'deletado_' || id::text || '@anonimizado.lgpd',
        user_id = NULL
    WHERE user_id = p_user_id;
    GET DIAGNOSTICS v_legal = ROW_COUNT;
    
    -- Anonimizar ocorrências criadas pelo usuário (não deletar para histórico)
    UPDATE occurrences 
    SET criado_por_user_id = NULL 
    WHERE criado_por_user_id = p_user_id;
    GET DIAGNOSTICS v_occurrences = ROW_COUNT;
    
    -- Anonimizar visitantes registrados pelo usuário
    UPDATE visitors 
    SET registrado_por_user_id = NULL 
    WHERE registrado_por_user_id = p_user_id;
    GET DIAGNOSTICS v_visitors = ROW_COUNT;
    
    -- Anonimizar dados do usuário (não deletar para integridade referencial)
    UPDATE users SET
        nome = 'Usuário Removido',
        email = 'deletado_' || id::text || '@anonimizado.lgpd',
        telefone = NULL,
        ativo = false
    WHERE id = p_user_id;
    
    -- Deletar do auth.users (Supabase Auth)
    -- NOTA: Isso deve ser feito via Supabase Admin API
    
    RETURN QUERY SELECT 
        0::INTEGER as deleted_notices,
        v_occurrences,
        v_visitors,
        v_notice_reads,
        v_email_logs,
        v_legal,
        true as anonymized_user;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- 5. FUNÇÃO: Verificar cobrança recorrente
-- Executar via pg_cron mensalmente
-- =============================================
CREATE OR REPLACE FUNCTION generate_monthly_invoices()
RETURNS TABLE(
    condo_id UUID,
    invoice_id UUID,
    valor DECIMAL
) AS $$
DECLARE
    sub RECORD;
    new_invoice_id UUID;
BEGIN
    FOR sub IN 
        SELECT 
            s.id as subscription_id,
            s.condo_id,
            s.valor_mensal_cobrado,
            s.data_fim,
            c.email_contato
        FROM subscriptions s
        JOIN condos c ON s.condo_id = c.id
        WHERE s.status = 'ativo'
        AND s.bloqueado = false
        AND s.data_fim <= CURRENT_DATE + INTERVAL '3 days'
        -- Não gerar se já existe fatura pendente para este mês
        AND NOT EXISTS (
            SELECT 1 FROM invoices i 
            WHERE i.condo_id = s.condo_id 
            AND i.status = 'pendente'
            AND DATE_TRUNC('month', i.created_at) = DATE_TRUNC('month', CURRENT_DATE)
        )
    LOOP
        INSERT INTO invoices (
            condo_id,
            subscription_id,
            valor,
            status,
            data_vencimento
        ) VALUES (
            sub.condo_id,
            sub.subscription_id,
            sub.valor_mensal_cobrado,
            'pendente',
            sub.data_fim + INTERVAL '1 day'
        ) RETURNING id INTO new_invoice_id;
        
        condo_id := sub.condo_id;
        invoice_id := new_invoice_id;
        valor := sub.valor_mensal_cobrado;
        RETURN NEXT;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- PRONTO! Execute este script no Supabase.
-- =============================================
