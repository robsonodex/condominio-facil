-- Adicionar colunas para suporte a anexos nas mensagens
ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS attachment_url TEXT;
ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS attachment_type TEXT; -- 'image', 'file', etc.

-- Criar bucket de storage para anexos do suporte (se não existir)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('support-attachments', 'support-attachments', true)
ON CONFLICT (id) DO NOTHING;

-- Policies para Storage (support-attachments)

-- Permitir leitura pública (para simplificar exibição)
DROP POLICY IF EXISTS "Anexos de suporte são públicos" ON storage.objects;
CREATE POLICY "Anexos de suporte são públicos"
ON storage.objects FOR SELECT
USING (bucket_id = 'support-attachments');

-- Permitir upload para usuários autenticados (qualquer usuário logado pode enviar anexo no suporte)
DROP POLICY IF EXISTS "Usuários autenticados podem enviar anexos" ON storage.objects;
CREATE POLICY "Usuários autenticados podem enviar anexos"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'support-attachments' 
    AND auth.role() = 'authenticated'
);

-- Permitir deleção (opcional, por enquanto vamos focar em insert)
-- Geralmente não deixamos usuário deletar anexo de suporte para histórico

-- Atualizar types/database.ts se necessário (mas como usamos inferência ou tipos manuais no frontend, faremos lá)
