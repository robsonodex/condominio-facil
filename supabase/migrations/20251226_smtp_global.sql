-- Permitir configuração SMTP global (condominio_id = NULL)
-- Execute no Supabase SQL Editor

-- Remover a constraint UNIQUE que exige condominio_id
ALTER TABLE configuracoes_smtp DROP CONSTRAINT IF EXISTS configuracoes_smtp_condominio_id_key;

-- Adicionar constraint UNIQUE que permite NULL (apenas um registro global)
CREATE UNIQUE INDEX IF NOT EXISTS configuracoes_smtp_global_unique ON configuracoes_smtp (condominio_id) WHERE condominio_id IS NOT NULL;

-- Atualizar RLS para permitir superadmin gerenciar config global
DROP POLICY IF EXISTS "Sindico can manage own SMTP config" ON configuracoes_smtp;

CREATE POLICY "Manage SMTP config" ON configuracoes_smtp FOR ALL
USING (
    -- Superadmin pode ver/editar tudo (incluindo config global com condominio_id = NULL)
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'superadmin')
    OR
    -- Síndico pode gerenciar apenas config do próprio condomínio
    condominio_id IN (SELECT condo_id FROM users WHERE id = auth.uid() AND role = 'sindico')
);

COMMENT ON TABLE configuracoes_smtp IS 'Configurações SMTP. condominio_id = NULL indica config global do sistema (superadmin).';
