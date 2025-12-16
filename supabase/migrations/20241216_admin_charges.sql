-- Tabela para registrar cobranças avulsas do sistema para os condomínios
-- Ex: Taxa de implantação, serviços extras, costumizações

CREATE TABLE IF NOT EXISTS admin_charges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    condo_id UUID REFERENCES condos(id) ON DELETE CASCADE,
    valor DECIMAL(10, 2) NOT NULL,
    descricao TEXT NOT NULL,
    status TEXT DEFAULT 'pendente', -- pendente, pago, cancelado
    data_vencimento TIMESTAMP WITH TIME ZONE,
    data_pagamento TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS
ALTER TABLE admin_charges ENABLE ROW LEVEL SECURITY;

-- Apenas superadmin pode ver e gerenciar
CREATE POLICY "Superadmin pode fazer tudo em admin_charges"
    ON admin_charges
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'superadmin'
        )
    );
