-- ============================================
-- DESTINOS PERSONALIZADOS PARA PORTARIA
-- Executar no Supabase SQL Editor
-- ============================================

-- 1. Criar tabela de destinos personalizados
CREATE TABLE IF NOT EXISTS custom_destinations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    condo_id UUID NOT NULL REFERENCES condos(id) ON DELETE CASCADE,
    nome VARCHAR(100) NOT NULL,
    descricao TEXT,
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Índices
CREATE INDEX IF NOT EXISTS idx_custom_destinations_condo ON custom_destinations(condo_id);
CREATE INDEX IF NOT EXISTS idx_custom_destinations_ativo ON custom_destinations(condo_id, ativo);

-- 3. Habilitar RLS
ALTER TABLE custom_destinations ENABLE ROW LEVEL SECURITY;

-- 4. Policies
-- Superadmin pode tudo
DROP POLICY IF EXISTS "superadmin_all_destinations" ON custom_destinations;
CREATE POLICY "superadmin_all_destinations" ON custom_destinations
    FOR ALL USING (is_superadmin());

-- Síndico pode gerenciar destinos do seu condomínio
DROP POLICY IF EXISTS "sindico_manage_destinations" ON custom_destinations;
CREATE POLICY "sindico_manage_destinations" ON custom_destinations
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role = 'sindico' 
            AND condo_id = custom_destinations.condo_id
        )
    );

-- Porteiro e morador podem ver destinos do seu condomínio
DROP POLICY IF EXISTS "users_view_destinations" ON custom_destinations;
CREATE POLICY "users_view_destinations" ON custom_destinations
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND condo_id = custom_destinations.condo_id
        )
    );

-- 5. Função para criar destinos padrão para novo condomínio
CREATE OR REPLACE FUNCTION create_default_destinations()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO custom_destinations (condo_id, nome) VALUES
        (NEW.id, 'Portaria'),
        (NEW.id, 'Salão de Festas'),
        (NEW.id, 'Área de Lazer'),
        (NEW.id, 'Piscina'),
        (NEW.id, 'Academia'),
        (NEW.id, 'Churrasqueira');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Trigger para criar destinos automaticamente
DROP TRIGGER IF EXISTS trigger_create_default_destinations ON condos;
CREATE TRIGGER trigger_create_default_destinations
    AFTER INSERT ON condos
    FOR EACH ROW
    EXECUTE FUNCTION create_default_destinations();

-- 7. Criar destinos para condomínios existentes (executar uma vez)
INSERT INTO custom_destinations (condo_id, nome)
SELECT c.id, d.nome
FROM condos c
CROSS JOIN (
    VALUES 
        ('Portaria'),
        ('Salão de Festas'),
        ('Área de Lazer'),
        ('Piscina'),
        ('Academia'),
        ('Churrasqueira')
) AS d(nome)
WHERE NOT EXISTS (
    SELECT 1 FROM custom_destinations cd 
    WHERE cd.condo_id = c.id AND cd.nome = d.nome
);
