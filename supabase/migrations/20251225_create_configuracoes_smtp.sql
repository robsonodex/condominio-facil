-- Tabela para configurações SMTP por condomínio
-- Execute este SQL no Supabase Dashboard > SQL Editor

CREATE TABLE IF NOT EXISTS configuracoes_smtp (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  condominio_id UUID REFERENCES condos(id) ON DELETE CASCADE UNIQUE,
  smtp_host VARCHAR(255) NOT NULL,
  smtp_port INTEGER NOT NULL DEFAULT 587,
  smtp_user VARCHAR(255) NOT NULL,
  smtp_password TEXT NOT NULL,
  smtp_from_email VARCHAR(255) NOT NULL,
  smtp_from_name VARCHAR(255),
  smtp_secure BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Habilitar RLS
ALTER TABLE configuracoes_smtp ENABLE ROW LEVEL SECURITY;

-- Policy: Síndico e Superadmin podem gerenciar configurações do próprio condomínio
CREATE POLICY "Sindico can manage own SMTP config"
ON configuracoes_smtp FOR ALL
USING (
  condominio_id IN (
    SELECT condo_id FROM users 
    WHERE id = auth.uid() AND role IN ('sindico', 'superadmin')
  )
  OR
  EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'superadmin'
  )
);

-- Índice para busca rápida
CREATE INDEX idx_configuracoes_smtp_condominio ON configuracoes_smtp(condominio_id);

-- Comentário na tabela
COMMENT ON TABLE configuracoes_smtp IS 'Configurações de servidor SMTP para envio de emails por condomínio';
