-- ============================================
-- SISTEMA DE COBRANÇA DE MORADORES
-- Executar no Supabase SQL Editor
-- ============================================

-- 1. Tabela de cobranças para moradores
CREATE TABLE IF NOT EXISTS resident_invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    condo_id UUID NOT NULL REFERENCES condos(id) ON DELETE CASCADE,
    morador_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    unidade_id UUID REFERENCES units(id) ON DELETE SET NULL,
    descricao TEXT NOT NULL,
    valor DECIMAL(10,2) NOT NULL CHECK (valor > 0),
    data_vencimento DATE NOT NULL,
    status TEXT DEFAULT 'pendente' CHECK (status IN ('pendente', 'pago', 'cancelado', 'vencido')),
    gateway_id TEXT, -- ID da preferência do Mercado Pago
    gateway_payment_id TEXT, -- ID do pagamento quando confirmado
    link_pagamento TEXT,
    data_pagamento TIMESTAMPTZ,
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Índices
CREATE INDEX IF NOT EXISTS idx_resident_invoices_condo ON resident_invoices(condo_id);
CREATE INDEX IF NOT EXISTS idx_resident_invoices_morador ON resident_invoices(morador_id);
CREATE INDEX IF NOT EXISTS idx_resident_invoices_status ON resident_invoices(status);
CREATE INDEX IF NOT EXISTS idx_resident_invoices_vencimento ON resident_invoices(data_vencimento);
CREATE INDEX IF NOT EXISTS idx_resident_invoices_gateway ON resident_invoices(gateway_id);

-- 3. Habilitar RLS
ALTER TABLE resident_invoices ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies

-- Superadmin pode tudo
CREATE POLICY "superadmin_resident_invoices" ON resident_invoices
    FOR ALL USING (get_my_role() = 'superadmin');

-- Síndico pode gerenciar cobranças do seu condomínio
CREATE POLICY "sindico_resident_invoices" ON resident_invoices
    FOR ALL USING (
        get_my_role() = 'sindico' 
        AND condo_id = get_my_condo()
    );

-- Morador pode ver suas próprias cobranças
CREATE POLICY "morador_view_invoices" ON resident_invoices
    FOR SELECT USING (morador_id = auth.uid());

-- 5. Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_resident_invoice_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_resident_invoice ON resident_invoices;
CREATE TRIGGER trigger_update_resident_invoice
    BEFORE UPDATE ON resident_invoices
    FOR EACH ROW
    EXECUTE FUNCTION update_resident_invoice_timestamp();

-- 6. Verificar criação
SELECT 'resident_invoices criada com sucesso!' as resultado;
