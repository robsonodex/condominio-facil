-- Migration: QR Code Pass - Sistema de Convites para Visitantes
-- Permite que moradores criem convites digitais com QR Code para visitantes

CREATE TABLE IF NOT EXISTS guest_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  condo_id UUID NOT NULL REFERENCES condos(id) ON DELETE CASCADE,
  unit_id UUID NOT NULL REFERENCES units(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  guest_name TEXT NOT NULL,
  valid_from TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  valid_until TIMESTAMPTZ NOT NULL,
  token_hash TEXT NOT NULL UNIQUE, -- SHA-256 hash do JWT
  status VARCHAR(20) DEFAULT 'pendente' CHECK (status IN ('pendente', 'usado', 'expirado', 'cancelado')),
  used_at TIMESTAMPTZ,
  validated_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices de performance
CREATE INDEX IF NOT EXISTS idx_guest_invites_condo ON guest_invites(condo_id);
CREATE INDEX IF NOT EXISTS idx_guest_invites_unit ON guest_invites(unit_id);
CREATE INDEX IF NOT EXISTS idx_guest_invites_status ON guest_invites(status);
CREATE INDEX IF NOT EXISTS idx_guest_invites_token_hash ON guest_invites(token_hash);
CREATE INDEX IF NOT EXISTS idx_guest_invites_valid_until ON guest_invites(valid_until);
CREATE INDEX IF NOT EXISTS idx_guest_invites_created_by ON guest_invites(created_by);

-- RLS
ALTER TABLE guest_invites ENABLE ROW LEVEL SECURITY;

-- Políticas RLS

-- Superadmin: acesso total
DROP POLICY IF EXISTS "Superadmin acesso total guest_invites" ON guest_invites;
CREATE POLICY "Superadmin acesso total guest_invites"
ON guest_invites FOR ALL
USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'superadmin')
);

-- Síndico: pode ver todos do seu condomínio
DROP POLICY IF EXISTS "Síndico vê convites do condomínio" ON guest_invites;
CREATE POLICY "Síndico vê convites do condomínio"
ON guest_invites FOR SELECT
USING (
  condo_id IN (
    SELECT condo_id FROM users 
    WHERE id = auth.uid() AND role = 'sindico'
  )
);

-- Morador: pode criar e ver/cancelar seus próprios convites
DROP POLICY IF EXISTS "Morador cria convites da sua unidade" ON guest_invites;
CREATE POLICY "Morador cria convites da sua unidade"
ON guest_invites FOR INSERT
WITH CHECK (
  unit_id IN (SELECT unidade_id FROM users WHERE id = auth.uid())
  AND created_by = auth.uid()
);

DROP POLICY IF EXISTS "Morador vê seus convites" ON guest_invites;
CREATE POLICY "Morador vê seus convites"
ON guest_invites FOR SELECT
USING (
  created_by = auth.uid()
);

DROP POLICY IF EXISTS "Morador cancela seus convites" ON guest_invites;
CREATE POLICY "Morador cancela seus convites"
ON guest_invites FOR UPDATE
USING (
  created_by = auth.uid() AND status = 'pendente'
)
WITH CHECK (
  status = 'cancelado' -- Só pode alterar para cancelado
);

-- Porteiro: pode ver convites pendentes para validação e atualizar status
DROP POLICY IF EXISTS "Porteiro valida convites pendentes" ON guest_invites;
CREATE POLICY "Porteiro valida convites pendentes"
ON guest_invites FOR SELECT
USING (
  condo_id IN (
    SELECT condo_id FROM users 
    WHERE id = auth.uid() AND role IN ('porteiro', 'sindico')
  )
  AND status = 'pendente'
);

DROP POLICY IF EXISTS "Porteiro atualiza status do convite" ON guest_invites;
CREATE POLICY "Porteiro atualiza status do convite"
ON guest_invites FOR UPDATE
USING (
  condo_id IN (
    SELECT condo_id FROM users 
    WHERE id = auth.uid() AND role IN ('porteiro', 'sindico')
  )
)
WITH CHECK (
  status IN ('usado', 'expirado') -- Porteiro pode marcar como usado ou expirado
);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_guest_invites_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_guest_invites_updated_at ON guest_invites;
CREATE TRIGGER trigger_guest_invites_updated_at
BEFORE UPDATE ON guest_invites
FOR EACH ROW EXECUTE FUNCTION update_guest_invites_updated_at();

-- Comentários
COMMENT ON TABLE guest_invites IS 'Convites digitais para visitantes com QR Code';
COMMENT ON COLUMN guest_invites.token_hash IS 'Hash SHA-256 do JWT para validação segura';
COMMENT ON COLUMN guest_invites.valid_from IS 'Data/hora de início da validade do convite';
COMMENT ON COLUMN guest_invites.valid_until IS 'Data/hora de expiração do convite';
COMMENT ON COLUMN guest_invites.validated_by IS 'ID do porteiro que validou o convite';
