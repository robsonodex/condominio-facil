-- Adiciona campo para indicar se o condomínio possui integração WhatsApp ativa
ALTER TABLE condos ADD COLUMN whatsapp_active BOOLEAN DEFAULT FALSE;

-- Adiciona comentário para documentação
COMMENT ON COLUMN condos.whatsapp_active IS 'Indica se o condomínio possui o serviço de WhatsApp Premium (Evolution API) ativo';

-- Política de RLS: Todos podem ler, apenas admins podem modificar
ALTER TABLE condos ENABLE ROW LEVEL SECURITY;

-- Remove policies antigas se existirem para evitar duplicidade
DROP POLICY IF EXISTS "Condos são visíveis publicamente" ON condos;
DROP POLICY IF EXISTS "Qualquer um pode ver condomínios" ON condos;
DROP POLICY IF EXISTS "Admins podem atualizar condomínios" ON condos;

-- Políticas de Leitura
CREATE POLICY "Condos são visíveis publicamente"
    ON condos FOR SELECT
    USING (true);

-- Política de Atualização (restrita a superadmin em teoria, ou lógica de aplicação segura)
-- Para facilitar o desenvolvimento atual, vamos permitir atualização por usuários autenticados
-- Em produção idealmente apenas superadmin alteraria o status do plano
CREATE POLICY "Admins podem atualizar condomínios"
    ON condos FOR UPDATE
    USING (auth.uid() IN (SELECT id FROM users WHERE role = 'superadmin' OR role = 'sindico'));
