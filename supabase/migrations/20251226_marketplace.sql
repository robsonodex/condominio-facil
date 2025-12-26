-- =============================================
-- MÓDULO MARKETPLACE & INDICAÇÕES
-- Versão: 1.0
-- Data: 26/12/2024
-- =============================================

-- 1. Tabela de Anúncios do Marketplace
CREATE TABLE IF NOT EXISTS marketplace_ads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    condo_id UUID NOT NULL REFERENCES condos(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    unit_id UUID REFERENCES units(id) ON DELETE SET NULL,
    
    -- Dados do Anúncio
    title VARCHAR(200) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2),
    type VARCHAR(20) NOT NULL CHECK (type IN ('venda', 'doacao', 'aluguel', 'servico')),
    category VARCHAR(50),
    photos TEXT[] DEFAULT '{}',
    
    -- Contato
    contact_phone VARCHAR(20),
    contact_whatsapp VARCHAR(20),
    contact_email VARCHAR(255),
    
    -- Controle
    status VARCHAR(20) DEFAULT 'ativo' CHECK (status IN ('ativo', 'pausado', 'vendido', 'expirado')),
    views_count INTEGER DEFAULT 0,
    interested_count INTEGER DEFAULT 0,
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '30 days'),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Tabela de Indicações de Profissionais
CREATE TABLE IF NOT EXISTS service_recommendations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    condo_id UUID NOT NULL REFERENCES condos(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    unit_id UUID REFERENCES units(id) ON DELETE SET NULL,
    
    -- Dados do Profissional
    professional_name VARCHAR(200) NOT NULL,
    category VARCHAR(50) NOT NULL, -- pintor, eletricista, encanador, etc
    phone VARCHAR(20),
    whatsapp VARCHAR(20),
    email VARCHAR(255),
    
    -- Avaliação
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    review_text TEXT,
    would_recommend BOOLEAN DEFAULT true,
    
    -- Fotos do serviço realizado (opcional)
    photos TEXT[] DEFAULT '{}',
    
    -- Controle
    verified BOOLEAN DEFAULT false,
    helpful_count INTEGER DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Tabela de Interesses nos Anúncios
CREATE TABLE IF NOT EXISTS marketplace_interests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ad_id UUID NOT NULL REFERENCES marketplace_ads(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(ad_id, user_id)
);

-- =============================================
-- ÍNDICES
-- =============================================

CREATE INDEX IF NOT EXISTS idx_marketplace_ads_condo ON marketplace_ads(condo_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_ads_user ON marketplace_ads(user_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_ads_type ON marketplace_ads(type);
CREATE INDEX IF NOT EXISTS idx_marketplace_ads_status ON marketplace_ads(status);
CREATE INDEX IF NOT EXISTS idx_marketplace_ads_expires ON marketplace_ads(expires_at);

CREATE INDEX IF NOT EXISTS idx_service_recommendations_condo ON service_recommendations(condo_id);
CREATE INDEX IF NOT EXISTS idx_service_recommendations_category ON service_recommendations(category);
CREATE INDEX IF NOT EXISTS idx_service_recommendations_rating ON service_recommendations(rating DESC);

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================

ALTER TABLE marketplace_ads ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_interests ENABLE ROW LEVEL SECURITY;

-- Políticas para marketplace_ads
CREATE POLICY "Usuários podem ver anúncios do seu condomínio"
    ON marketplace_ads FOR SELECT
    USING (condo_id IN (SELECT condo_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Usuários podem criar anúncios no seu condomínio"
    ON marketplace_ads FOR INSERT
    WITH CHECK (user_id = auth.uid() AND condo_id IN (SELECT condo_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Usuários podem editar seus próprios anúncios"
    ON marketplace_ads FOR UPDATE
    USING (user_id = auth.uid());

CREATE POLICY "Usuários podem deletar seus próprios anúncios"
    ON marketplace_ads FOR DELETE
    USING (user_id = auth.uid());

-- Políticas para service_recommendations
CREATE POLICY "Usuários podem ver indicações do seu condomínio"
    ON service_recommendations FOR SELECT
    USING (condo_id IN (SELECT condo_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Usuários podem criar indicações no seu condomínio"
    ON service_recommendations FOR INSERT
    WITH CHECK (user_id = auth.uid() AND condo_id IN (SELECT condo_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Usuários podem editar suas próprias indicações"
    ON service_recommendations FOR UPDATE
    USING (user_id = auth.uid());

CREATE POLICY "Usuários podem deletar suas próprias indicações"
    ON service_recommendations FOR DELETE
    USING (user_id = auth.uid());

-- Políticas para marketplace_interests
CREATE POLICY "Usuários podem ver interesses nos seus anúncios"
    ON marketplace_interests FOR SELECT
    USING (
        user_id = auth.uid() OR 
        ad_id IN (SELECT id FROM marketplace_ads WHERE user_id = auth.uid())
    );

CREATE POLICY "Usuários podem demonstrar interesse"
    ON marketplace_interests FOR INSERT
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Usuários podem remover seu interesse"
    ON marketplace_interests FOR DELETE
    USING (user_id = auth.uid());

-- =============================================
-- TRIGGER PARA UPDATED_AT
-- =============================================

CREATE OR REPLACE FUNCTION update_marketplace_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_marketplace_ads_updated_at
    BEFORE UPDATE ON marketplace_ads
    FOR EACH ROW
    EXECUTE FUNCTION update_marketplace_updated_at();

CREATE TRIGGER trigger_service_recommendations_updated_at
    BEFORE UPDATE ON service_recommendations
    FOR EACH ROW
    EXECUTE FUNCTION update_marketplace_updated_at();

-- =============================================
-- FUNÇÃO PARA EXPIRAR ANÚNCIOS AUTOMATICAMENTE
-- =============================================

CREATE OR REPLACE FUNCTION expire_old_marketplace_ads()
RETURNS void AS $$
BEGIN
    UPDATE marketplace_ads
    SET status = 'expirado'
    WHERE status = 'ativo' AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Para executar via cron (pg_cron) ou manualmente:
-- SELECT expire_old_marketplace_ads();

-- =============================================
-- DADOS INICIAIS (Categorias sugeridas)
-- =============================================

COMMENT ON TABLE marketplace_ads IS 'Anúncios do marketplace interno do condomínio';
COMMENT ON TABLE service_recommendations IS 'Indicações de profissionais pelos moradores';

-- Categorias sugeridas para anúncios:
-- venda: móveis, eletrodomésticos, roupas, eletrônicos
-- doacao: itens diversos
-- aluguel: vagas de garagem, equipamentos
-- servico: serviços oferecidos por moradores

-- Categorias sugeridas para profissionais:
-- pintor, eletricista, encanador, pedreiro, marceneiro,
-- faxineira, babá, cuidador, personal_trainer, pet_sitter,
-- tecnico_ar, tecnico_tv, jardineiro, dedetizador, serralheiro
