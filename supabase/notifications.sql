-- =============================================
-- Condomínio Fácil - Notifications Schema
-- Execute this SQL in Supabase SQL Editor
-- =============================================

-- Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  condo_id UUID REFERENCES condos(id),
  user_id UUID REFERENCES users(id),
  titulo TEXT NOT NULL,
  mensagem TEXT NOT NULL,
  tipo TEXT DEFAULT 'aviso' CHECK (tipo IN ('aviso', 'vencimento', 'atraso', 'sistema')),
  lida BOOLEAN DEFAULT false,
  data_leitura TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_condo ON notifications(condo_id);

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can see own notifications" ON notifications
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update own notifications" ON notifications
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Superadmin and Sindico can create notifications" ON notifications
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('superadmin', 'sindico'))
  );

-- =============================================
-- Function: Create billing notifications
-- Run this daily via pg_cron or Supabase scheduled function
-- =============================================
CREATE OR REPLACE FUNCTION create_billing_notifications()
RETURNS void AS $$
DECLARE
  entry RECORD;
BEGIN
  -- Notify about entries due in 5 days
  FOR entry IN 
    SELECT fe.id, fe.valor, fe.data_vencimento, fe.unidade_id, u.id as user_id, c.id as condo_id
    FROM financial_entries fe
    JOIN units un ON un.id = fe.unidade_id
    JOIN users u ON u.unidade_id = un.id
    JOIN condos c ON c.id = fe.condo_id
    WHERE fe.tipo = 'receita'
    AND fe.status = 'em_aberto'
    AND fe.data_vencimento = CURRENT_DATE + INTERVAL '5 days'
  LOOP
    INSERT INTO notifications (condo_id, user_id, titulo, mensagem, tipo)
    VALUES (
      entry.condo_id,
      entry.user_id,
      'Vencimento Próximo',
      'Sua taxa de condomínio no valor de R$ ' || entry.valor || ' vence em 5 dias (' || to_char(entry.data_vencimento, 'DD/MM/YYYY') || ').',
      'vencimento'
    );
  END LOOP;

  -- Notify about overdue entries
  FOR entry IN 
    SELECT fe.id, fe.valor, fe.data_vencimento, fe.unidade_id, u.id as user_id, c.id as condo_id
    FROM financial_entries fe
    JOIN units un ON un.id = fe.unidade_id
    JOIN users u ON u.unidade_id = un.id
    JOIN condos c ON c.id = fe.condo_id
    WHERE fe.tipo = 'receita'
    AND fe.status = 'atrasado'
    AND fe.data_vencimento = CURRENT_DATE - INTERVAL '1 day'
  LOOP
    INSERT INTO notifications (condo_id, user_id, titulo, mensagem, tipo)
    VALUES (
      entry.condo_id,
      entry.user_id,
      'Pagamento Atrasado',
      'Sua taxa de condomínio no valor de R$ ' || entry.valor || ' está em atraso desde ' || to_char(entry.data_vencimento, 'DD/MM/YYYY') || '. Por favor, regularize.',
      'atraso'
    );
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- Done! Run create_billing_notifications() daily
-- =============================================
