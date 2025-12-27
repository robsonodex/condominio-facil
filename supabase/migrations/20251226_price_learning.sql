-- =============================================
-- SISTEMA DE APRENDIZADO DE PREÇOS (Crowdsourcing)
-- Versão: 1.0
-- Data: 26/12/2024
-- =============================================

-- 1. Adicionar controle na tabela de lançamentos financeiros
-- Indica se a despesa já foi processada para o benchmark
ALTER TABLE financial_entries 
ADD COLUMN IF NOT EXISTS benchmark_processed BOOLEAN DEFAULT FALSE;

-- Índice para buscas rápidas de despesas não processadas
CREATE INDEX IF NOT EXISTS idx_financial_entries_benchmark 
ON financial_entries(benchmark_processed) 
WHERE tipo = 'despesa' AND benchmark_processed = FALSE;

-- 2. Melhorar a tabela de benchmarks para suportar estatísticas
-- Verificar se a tabela existe, se não, criar
DO $$
BEGIN
    -- Adicionar colunas se não existirem
    IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'price_benchmarks') THEN
        -- Sample size - quantas despesas compõem essa média
        IF NOT EXISTS (SELECT FROM information_schema.columns 
                       WHERE table_name = 'price_benchmarks' AND column_name = 'sample_size') THEN
            ALTER TABLE price_benchmarks ADD COLUMN sample_size INTEGER DEFAULT 1;
        END IF;
        
        -- Last updated - quando foi atualizado pela última vez
        IF NOT EXISTS (SELECT FROM information_schema.columns 
                       WHERE table_name = 'price_benchmarks' AND column_name = 'last_updated_at') THEN
            ALTER TABLE price_benchmarks ADD COLUMN last_updated_at TIMESTAMPTZ DEFAULT NOW();
        END IF;
        
        -- Price min - para detectar outliers
        IF NOT EXISTS (SELECT FROM information_schema.columns 
                       WHERE table_name = 'price_benchmarks' AND column_name = 'price_min') THEN
            ALTER TABLE price_benchmarks ADD COLUMN price_min DECIMAL(10,2);
        END IF;
        
        -- Price max - para detectar outliers
        IF NOT EXISTS (SELECT FROM information_schema.columns 
                       WHERE table_name = 'price_benchmarks' AND column_name = 'price_max') THEN
            ALTER TABLE price_benchmarks ADD COLUMN price_max DECIMAL(10,2);
        END IF;
        
        -- Total de contribuições (condomínios únicos que contribuíram)
        IF NOT EXISTS (SELECT FROM information_schema.columns 
                       WHERE table_name = 'price_benchmarks' AND column_name = 'contribution_count') THEN
            ALTER TABLE price_benchmarks ADD COLUMN contribution_count INTEGER DEFAULT 0;
        END IF;
        
        -- Desvio padrão (para análise estatística)
        IF NOT EXISTS (SELECT FROM information_schema.columns 
                       WHERE table_name = 'price_benchmarks' AND column_name = 'std_deviation') THEN
            ALTER TABLE price_benchmarks ADD COLUMN std_deviation DECIMAL(10,2);
        END IF;
    END IF;
END $$;

-- 3. Tabela de log de aprendizado (para auditoria)
CREATE TABLE IF NOT EXISTS price_learning_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    financial_entry_id UUID REFERENCES financial_entries(id),
    benchmark_id UUID,
    entry_value DECIMAL(10,2),
    old_avg_price DECIMAL(10,2),
    new_avg_price DECIMAL(10,2),
    similarity_score DECIMAL(5,4),
    was_outlier BOOLEAN DEFAULT FALSE,
    was_updated BOOLEAN DEFAULT FALSE,
    processed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índice para consultas de auditoria
CREATE INDEX IF NOT EXISTS idx_price_learning_logs_date 
ON price_learning_logs(processed_at DESC);

-- 4. Função para calcular média ponderada de forma segura
CREATE OR REPLACE FUNCTION calculate_weighted_avg(
    current_avg DECIMAL(10,2),
    current_sample INTEGER,
    new_value DECIMAL(10,2)
) RETURNS DECIMAL(10,2) AS $$
DECLARE
    old_total DECIMAL(10,2);
    new_sample INTEGER;
BEGIN
    old_total := COALESCE(current_avg, 0) * COALESCE(current_sample, 1);
    new_sample := COALESCE(current_sample, 1) + 1;
    RETURN (old_total + new_value) / new_sample;
END;
$$ LANGUAGE plpgsql;

-- 5. Comentários
COMMENT ON COLUMN financial_entries.benchmark_processed IS 'Indica se esta despesa já foi processada pelo sistema de aprendizado de preços';
COMMENT ON COLUMN price_benchmarks.sample_size IS 'Quantidade de despesas usadas para calcular a média';
COMMENT ON COLUMN price_benchmarks.price_min IS 'Menor valor registrado para este serviço';
COMMENT ON COLUMN price_benchmarks.price_max IS 'Maior valor registrado para este serviço';
COMMENT ON TABLE price_learning_logs IS 'Log de auditoria do sistema de aprendizado de preços';
