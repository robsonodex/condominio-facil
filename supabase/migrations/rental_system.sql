-- =============================================
-- Sistema de Cobrança de Aluguel
-- Execute no Supabase SQL Editor
-- =============================================

-- =============================================
-- 1. TABELA DE CONTRATOS DE ALUGUEL
-ear- =============================================
CREATE TABLE IF NOT EXISTS rental_contracts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    condo_id UUID NOT NULL REFERENCES condos(id) ON DELETE CASCADE,
    unit_id UUID NOT NULL REFERENCES units(id) ON DELETE CASCADE,
    landlord_id UUID REFERENCES users(id), -- proprietário/síndico
    tenant_id UUID REFERENCES users(id), -- inquilino
    
    -- Valores
    monthly_rent NUMERIC(12,2) NOT NULL,
    include_condo_fee BOOLEAN DEFAULT false,
    additional_charges JSONB DEFAULT '{}', -- {agua: 50, iptu: 100}
    
    -- Datas
    start_date DATE NOT NULL,
    end_date DATE, -- NULL = indeterminado
    billing_day SMALLINT DEFAULT 5 CHECK (billing_day BETWEEN 1 AND 28),
    
    -- Juros e multa
    late_fee_percent NUMERIC(5,2) DEFAULT 2.0, -- multa %
    daily_interest_percent NUMERIC(5,4) DEFAULT 0.033, -- juros diário %
    
    -- Status
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'paused', 'cancelled', 'ended')),
    notes TEXT,
    
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_rental_contracts_condo ON rental_contracts(condo_id);
CREATE INDEX IF NOT EXISTS idx_rental_contracts_unit ON rental_contracts(unit_id);
CREATE INDEX IF NOT EXISTS idx_rental_contracts_tenant ON rental_contracts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_rental_contracts_status ON rental_contracts(status);

-- RLS
ALTER TABLE rental_contracts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Sindico can manage contracts of their condo" ON rental_contracts;
CREATE POLICY "Sindico can manage contracts of their condo" ON rental_contracts
    FOR ALL USING (
        condo_id IN (SELECT condo_id FROM users WHERE id = auth.uid() AND role IN ('sindico', 'superadmin'))
    );

DROP POLICY IF EXISTS "Tenant can view their contracts" ON rental_contracts;
CREATE POLICY "Tenant can view their contracts" ON rental_contracts
    FOR SELECT USING (tenant_id = auth.uid());

-- =============================================
-- 2. TABELA DE FATURAS DE ALUGUEL
-- =============================================
CREATE TABLE IF NOT EXISTS rent_invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    contract_id UUID NOT NULL REFERENCES rental_contracts(id) ON DELETE CASCADE,
    
    -- Identificação
    invoice_number TEXT UNIQUE,
    reference_month DATE NOT NULL, -- primeiro dia do mês de referência
    due_date DATE NOT NULL,
    
    -- Valores
    rent_amount NUMERIC(12,2) NOT NULL,
    condo_fee NUMERIC(12,2) DEFAULT 0,
    additional_charges NUMERIC(12,2) DEFAULT 0,
    late_fee NUMERIC(12,2) DEFAULT 0, -- multa aplicada
    interest NUMERIC(12,2) DEFAULT 0, -- juros aplicados
    discount NUMERIC(12,2) DEFAULT 0,
    total NUMERIC(12,2) NOT NULL,
    
    -- Pagamento
    payment_method VARCHAR(20) DEFAULT 'any' CHECK (payment_method IN ('boleto', 'pix', 'any', 'card')),
    provider_id VARCHAR(100), -- ID Mercado Pago
    boleto_url TEXT,
    barcode VARCHAR(60),
    pix_qr TEXT,
    pix_code TEXT,
    
    -- Status
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'cancelled', 'overdue')),
    paid_at TIMESTAMPTZ,
    paid_amount NUMERIC(12,2),
    
    -- Email
    email_sent_at TIMESTAMPTZ,
    reminder_sent_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_rent_invoices_contract ON rent_invoices(contract_id);
CREATE INDEX IF NOT EXISTS idx_rent_invoices_due_date ON rent_invoices(due_date);
CREATE INDEX IF NOT EXISTS idx_rent_invoices_status ON rent_invoices(status);
CREATE INDEX IF NOT EXISTS idx_rent_invoices_provider_id ON rent_invoices(provider_id);
CREATE INDEX IF NOT EXISTS idx_rent_invoices_reference ON rent_invoices(reference_month);

-- RLS
ALTER TABLE rent_invoices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Sindico can manage invoices of their condo" ON rent_invoices;
CREATE POLICY "Sindico can manage invoices of their condo" ON rent_invoices
    FOR ALL USING (
        contract_id IN (
            SELECT id FROM rental_contracts 
            WHERE condo_id IN (SELECT condo_id FROM users WHERE id = auth.uid() AND role IN ('sindico', 'superadmin'))
        )
    );

DROP POLICY IF EXISTS "Tenant can view their invoices" ON rent_invoices;
CREATE POLICY "Tenant can view their invoices" ON rent_invoices
    FOR SELECT USING (
        contract_id IN (SELECT id FROM rental_contracts WHERE tenant_id = auth.uid())
    );

-- =============================================
-- 3. FUNÇÕES AUXILIARES
-- =============================================

-- Gerar número de fatura
CREATE OR REPLACE FUNCTION generate_rent_invoice_number()
RETURNS TEXT AS $$
BEGIN
    RETURN 'ALG-' || TO_CHAR(now(), 'YYYYMM') || '-' || LPAD(nextval('rent_invoice_seq')::TEXT, 5, '0');
END;
$$ LANGUAGE plpgsql;

-- Sequência para número de fatura
CREATE SEQUENCE IF NOT EXISTS rent_invoice_seq START 1;

-- Calcular total da fatura
CREATE OR REPLACE FUNCTION calculate_rent_invoice_total(
    p_rent NUMERIC,
    p_condo_fee NUMERIC,
    p_additional NUMERIC,
    p_late_fee NUMERIC,
    p_interest NUMERIC,
    p_discount NUMERIC
)
RETURNS NUMERIC AS $$
BEGIN
    RETURN GREATEST(0, p_rent + COALESCE(p_condo_fee, 0) + COALESCE(p_additional, 0) 
                     + COALESCE(p_late_fee, 0) + COALESCE(p_interest, 0) - COALESCE(p_discount, 0));
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- =============================================
-- 4. JOB: GERAR FATURAS MENSAIS
-- =============================================
CREATE OR REPLACE FUNCTION generate_rent_invoices_monthly()
RETURNS INTEGER AS $$
DECLARE
    invoice_count INTEGER := 0;
    contract RECORD;
    next_month DATE;
    due_date_calc DATE;
    condo_fee_value NUMERIC;
    additional_value NUMERIC;
    total_value NUMERIC;
BEGIN
    next_month := DATE_TRUNC('month', CURRENT_DATE + INTERVAL '1 month');
    
    FOR contract IN 
        SELECT rc.*, s.valor_mensal_cobrado as subscription_fee
        FROM rental_contracts rc
        LEFT JOIN subscriptions s ON s.condo_id = rc.condo_id AND s.status = 'ativo'
        WHERE rc.status = 'active'
        AND (rc.end_date IS NULL OR rc.end_date >= next_month)
        AND NOT EXISTS (
            SELECT 1 FROM rent_invoices ri 
            WHERE ri.contract_id = rc.id 
            AND ri.reference_month = next_month
        )
    LOOP
        -- Calcular data de vencimento
        due_date_calc := next_month + (contract.billing_day - 1);
        
        -- Taxa de condomínio
        IF contract.include_condo_fee AND contract.subscription_fee IS NOT NULL THEN
            condo_fee_value := contract.subscription_fee;
        ELSE
            condo_fee_value := 0;
        END IF;
        
        -- Cobranças adicionais
        SELECT COALESCE(SUM(value::NUMERIC), 0)
        INTO additional_value
        FROM jsonb_each_text(contract.additional_charges);
        
        -- Total
        total_value := contract.monthly_rent + condo_fee_value + additional_value;
        
        -- Inserir fatura
        INSERT INTO rent_invoices (
            contract_id, invoice_number, reference_month, due_date,
            rent_amount, condo_fee, additional_charges, total,
            payment_method
        ) VALUES (
            contract.id,
            generate_rent_invoice_number(),
            next_month,
            due_date_calc,
            contract.monthly_rent,
            condo_fee_value,
            additional_value,
            total_value,
            'any'
        );
        
        invoice_count := invoice_count + 1;
    END LOOP;
    
    RETURN invoice_count;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- 5. JOB: APLICAR JUROS E MULTA
-- =============================================
CREATE OR REPLACE FUNCTION apply_late_fees()
RETURNS INTEGER AS $$
DECLARE
    updated_count INTEGER := 0;
    inv RECORD;
    days_late INTEGER;
    contract_rec RECORD;
    new_late_fee NUMERIC;
    new_interest NUMERIC;
    new_total NUMERIC;
BEGIN
    FOR inv IN 
        SELECT ri.*, rc.late_fee_percent, rc.daily_interest_percent
        FROM rent_invoices ri
        JOIN rental_contracts rc ON ri.contract_id = rc.id
        WHERE ri.status = 'pending'
        AND ri.due_date < CURRENT_DATE
    LOOP
        days_late := CURRENT_DATE - inv.due_date;
        
        -- Calcular multa (apenas uma vez, no primeiro dia de atraso)
        IF inv.late_fee = 0 THEN
            new_late_fee := inv.rent_amount * (inv.late_fee_percent / 100);
        ELSE
            new_late_fee := inv.late_fee;
        END IF;
        
        -- Calcular juros diários
        new_interest := inv.rent_amount * (inv.daily_interest_percent / 100) * days_late;
        
        -- Novo total
        new_total := inv.rent_amount + COALESCE(inv.condo_fee, 0) + COALESCE(inv.additional_charges, 0)
                     + new_late_fee + new_interest - COALESCE(inv.discount, 0);
        
        -- Atualizar
        UPDATE rent_invoices
        SET status = 'overdue',
            late_fee = new_late_fee,
            interest = new_interest,
            total = new_total,
            updated_at = now()
        WHERE id = inv.id;
        
        updated_count := updated_count + 1;
    END LOOP;
    
    RETURN updated_count;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- 6. TRIGGER PARA UPDATED_AT
-- =============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_rental_contracts_updated_at ON rental_contracts;
CREATE TRIGGER update_rental_contracts_updated_at
    BEFORE UPDATE ON rental_contracts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_rent_invoices_updated_at ON rent_invoices;
CREATE TRIGGER update_rent_invoices_updated_at
    BEFORE UPDATE ON rent_invoices
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- COMENTÁRIOS
-- =============================================
COMMENT ON TABLE rental_contracts IS 'Contratos de aluguel gerenciados pelo síndico';
COMMENT ON TABLE rent_invoices IS 'Faturas mensais de aluguel';
COMMENT ON FUNCTION generate_rent_invoices_monthly() IS 'Gera faturas para o próximo mês (rodar via pg_cron)';
COMMENT ON FUNCTION apply_late_fees() IS 'Aplica multa e juros em faturas vencidas (rodar diariamente)';
