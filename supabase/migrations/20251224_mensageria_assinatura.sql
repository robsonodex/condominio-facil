-- supabase/migrations/20251224_mensageria_assinatura.sql
-- Adicionar campo de assinatura para retirada de encomendas

-- Adicionar campo signature_url
ALTER TABLE mensageria_entregas ADD COLUMN IF NOT EXISTS signature_url TEXT;

-- Comentário
COMMENT ON COLUMN mensageria_entregas.signature_url IS 'URL da assinatura manuscrita de confirmação de recebimento';

-- Criar bucket para assinaturas (se não existir, criar via dashboard ou API)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('signatures', 'signatures', false) ON CONFLICT DO NOTHING;
