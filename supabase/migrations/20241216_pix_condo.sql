-- Migration: Adicionar campos PIX na tabela condos
-- Permite que cada condomínio configure sua própria chave PIX

ALTER TABLE condos ADD COLUMN IF NOT EXISTS pix_chave TEXT;
ALTER TABLE condos ADD COLUMN IF NOT EXISTS pix_tipo TEXT CHECK (pix_tipo IN ('cpf', 'cnpj', 'email', 'telefone', 'aleatoria'));
ALTER TABLE condos ADD COLUMN IF NOT EXISTS pix_nome_recebedor TEXT;
ALTER TABLE condos ADD COLUMN IF NOT EXISTS pix_cidade TEXT DEFAULT 'SAO PAULO';

COMMENT ON COLUMN condos.pix_chave IS 'Chave PIX do condomínio para receber pagamentos';
COMMENT ON COLUMN condos.pix_tipo IS 'Tipo da chave PIX: cpf, cnpj, email, telefone ou aleatoria';
COMMENT ON COLUMN condos.pix_nome_recebedor IS 'Nome que aparece no comprovante PIX';
COMMENT ON COLUMN condos.pix_cidade IS 'Cidade para QR Code PIX (maiúsculas, sem acentos)';
