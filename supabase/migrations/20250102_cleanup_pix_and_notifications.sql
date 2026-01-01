-- 1. Limpar 'SAO PAULO' das cidades PIX que foram inseridas como padrão incorreto
UPDATE condos 
SET pix_cidade = NULL 
WHERE pix_cidade = 'SAO PAULO';

-- 2. Garantir que a coluna 'read_at' (ou 'data_leitura') existe na tabela notifications
-- O frontend está usando 'data_leitura', vamos adicionar essa coluna se não existir
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'notifications' AND column_name = 'data_leitura') THEN
        ALTER TABLE notifications ADD COLUMN data_leitura TIMESTAMPTZ;
    END IF;
END $$;

-- 3. Melhorar a RLS das notificações para garantir que Moradores e Porteiros vejam as suas
-- (Isso reforça o que já deveria estar lá, mas garante que não há bloqueios)
DROP POLICY IF EXISTS "Users can see their notifications" ON notifications;
CREATE POLICY "Users can see their notifications" ON notifications
    FOR SELECT USING (
        user_id = auth.uid()
        OR (condo_id IN (SELECT condo_id FROM users WHERE id = auth.uid()) 
            AND (SELECT role FROM users WHERE id = auth.uid()) IN ('sindico', 'admin', 'porteiro'))
        OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'superadmin')
    );
