-- =============================================
-- Sistema de Aceite Legal Obrigatório
-- Execute no Supabase SQL Editor
-- =============================================

-- =============================================
-- 1. ATUALIZAR TABELA legal_acceptances
-- =============================================

-- Adicionar novos campos
ALTER TABLE legal_acceptances
ADD COLUMN IF NOT EXISTS ip_address VARCHAR(45),
ADD COLUMN IF NOT EXISTS document_version VARCHAR(20) DEFAULT '1.0',
ADD COLUMN IF NOT EXISTS document_hash VARCHAR(64),
ADD COLUMN IF NOT EXISTS plan_at_moment VARCHAR(50),
ADD COLUMN IF NOT EXISTS document_type VARCHAR(50),
ADD COLUMN IF NOT EXISTS accepted_at TIMESTAMPTZ DEFAULT now();

-- Adicionar constraint para document_type
ALTER TABLE legal_acceptances
DROP CONSTRAINT IF EXISTS check_document_type;
ALTER TABLE legal_acceptances
ADD CONSTRAINT check_document_type 
CHECK (document_type IN ('termos_uso', 'politica_privacidade', 'contrato_plano', 'politica_cobranca'));

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_legal_acceptances_user_type ON legal_acceptances(user_id, document_type);
CREATE INDEX IF NOT EXISTS idx_legal_acceptances_type ON legal_acceptances(document_type);
CREATE INDEX IF NOT EXISTS idx_legal_acceptances_created ON legal_acceptances(accepted_at);

-- =============================================
-- 2. FUNÇÃO PARA VERIFICAR ACEITE COMPLETO
-- =============================================

CREATE OR REPLACE FUNCTION has_user_signed_required_documents(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    required_docs TEXT[] := ARRAY['termos_uso', 'politica_privacidade', 'contrato_plano'];
    signed_count INTEGER;
BEGIN
    -- Contar quantos documentos obrigatórios foram aceitos
    SELECT COUNT(DISTINCT document_type) INTO signed_count
    FROM legal_acceptances
    WHERE user_id = p_user_id
    AND document_type = ANY(required_docs);
    
    -- Retornar true se todos foram aceitos
    RETURN signed_count >= array_length(required_docs, 1);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- 3. FUNÇÃO PARA OBTER DOCUMENTOS FALTANTES
-- =============================================

CREATE OR REPLACE FUNCTION get_missing_documents(p_user_id UUID)
RETURNS TEXT[] AS $$
DECLARE
    required_docs TEXT[] := ARRAY['termos_uso', 'politica_privacidade', 'contrato_plano'];
    signed_docs TEXT[];
    missing_docs TEXT[];
BEGIN
    -- Obter documentos já assinados
    SELECT ARRAY_AGG(DISTINCT document_type) INTO signed_docs
    FROM legal_acceptances
    WHERE user_id = p_user_id
    AND document_type = ANY(required_docs);
    
    -- Se nenhum documento foi assinado
    IF signed_docs IS NULL THEN
        RETURN required_docs;
    END IF;
    
    -- Calcular documentos faltantes
    SELECT ARRAY_AGG(doc) INTO missing_docs
    FROM UNNEST(required_docs) AS doc
    WHERE doc != ALL(signed_docs);
    
    -- Retornar array vazio se todos foram assinados
    IF missing_docs IS NULL THEN
        RETURN ARRAY[]::TEXT[];
    END IF;
    
    RETURN missing_docs;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- 4. FUNÇÃO PARA REGISTRAR ACEITE MÚLTIPLO
-- =============================================

CREATE OR REPLACE FUNCTION register_legal_acceptances(
    p_user_id UUID,
    p_ip_address VARCHAR(45),
    p_documents JSONB
)
RETURNS JSONB AS $$
DECLARE
    doc JSONB;
    inserted_count INTEGER := 0;
    user_plan TEXT;
BEGIN
    -- Buscar plano do usuário
    SELECT p.nome_plano INTO user_plan
    FROM users u
    JOIN condos c ON u.condo_id = c.id
    JOIN subscriptions s ON c.id = s.condo_id
    JOIN plans p ON s.plano_id = p.id
    WHERE u.id = p_user_id
    AND s.status = 'ativo'
    LIMIT 1;
    
    -- Se não encontrou plano, usar 'Básico' como padrão
    IF user_plan IS NULL THEN
        user_plan := 'Básico';
    END IF;
    
    -- Inserir cada documento
    FOR doc IN SELECT * FROM jsonb_array_elements(p_documents)
    LOOP
        INSERT INTO legal_acceptances (
            user_id,
            ip_address,
            document_type,
            document_version,
            document_hash,
            plan_at_moment,
            accepted_at
        ) VALUES (
            p_user_id,
            p_ip_address,
            doc->>'document_type',
            doc->>'document_version',
            doc->>'document_hash',
            user_plan,
            now()
        );
        
        inserted_count := inserted_count + 1;
    END LOOP;
    
    RETURN jsonb_build_object(
        'success', true,
        'count', inserted_count,
        'plan', user_plan
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- 5. VIEW PARA AUDITORIA
-- =============================================

CREATE OR REPLACE VIEW legal_acceptances_summary AS
SELECT 
    u.id as user_id,
    u.nome as user_name,
    u.email,
    c.nome as condo_name,
    la.document_type,
    la.document_version,
    la.accepted_at,
    la.ip_address,
    la.plan_at_moment
FROM legal_acceptances la
JOIN users u ON la.user_id = u.id
LEFT JOIN condos c ON u.condo_id = c.id
ORDER BY la.accepted_at DESC;

-- =============================================
-- 6. RLS (Row Level Security)
-- =============================================

-- Permitir usuários verem apenas seus próprios aceites
DROP POLICY IF EXISTS "Users can view their own acceptances" ON legal_acceptances;
CREATE POLICY "Users can view their own acceptances" ON legal_acceptances
    FOR SELECT USING (user_id = auth.uid());

-- Permitir usuários criarem seus próprios aceites
DROP POLICY IF EXISTS "Users can create their own acceptances" ON legal_acceptances;
CREATE POLICY "Users can create their own acceptances" ON legal_acceptances
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- Superadmin pode ver tudo
DROP POLICY IF EXISTS "Superadmin can view all acceptances" ON legal_acceptances;
CREATE POLICY "Superadmin can view all acceptances" ON legal_acceptances
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role = 'superadmin'
        )
    );

-- =============================================
-- COMENTÁRIOS
-- =============================================

COMMENT ON FUNCTION has_user_signed_required_documents IS 'Verifica se usuário aceitou todos os documentos obrigatórios (termos_uso, politica_privacidade, contrato_plano)';
COMMENT ON FUNCTION get_missing_documents IS 'Retorna array de documentos que o usuário ainda não aceitou';
COMMENT ON FUNCTION register_legal_acceptances IS 'Registra múltiplos aceites de uma vez com IP, hash e plano do momento';
COMMENT ON VIEW legal_acceptances_summary IS 'View para auditoria de aceites legais com informações do usuário e condomínio';

-- =============================================
-- DADOS DE TESTE (OPCIONAL)
-- =============================================

-- Limpar aceites antigos para teste
-- DELETE FROM legal_acceptances WHERE document_type IS NULL;
