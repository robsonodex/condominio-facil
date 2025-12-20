-- Migration: Adicionar campo ai_ativo na tabela condos
-- Data: 20/12/2024
-- Descrição: Campo para controlar ativação do módulo de IA por condomínio

-- Adicionar campo ai_ativo (default false = precisa pagar para ativar)
ALTER TABLE condos ADD COLUMN IF NOT EXISTS ai_ativo BOOLEAN DEFAULT false;

-- Comentário
COMMENT ON COLUMN condos.ai_ativo IS 'Controla se o módulo de IA está ativo para este condomínio (você ativa manualmente após pagamento)';

-- Índice
CREATE INDEX IF NOT EXISTS idx_condos_ai_ativo ON condos(ai_ativo) WHERE ai_ativo = true;
