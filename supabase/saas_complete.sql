-- =============================================
-- Condomínio Fácil - Schema Completo SaaS
-- Execute no Supabase SQL Editor
-- =============================================

-- =============================================
-- 1. TABELA DE FATURAS (INVOICES)
-- =============================================
CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  condo_id UUID REFERENCES condos(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES subscriptions(id),
  numero VARCHAR(20) UNIQUE,
  valor DECIMAL(10,2) NOT NULL,
  status VARCHAR(20) DEFAULT 'pendente' CHECK (status IN ('pendente', 'pago', 'vencido', 'cancelado')),
  data_vencimento DATE NOT NULL,
  data_pagamento TIMESTAMPTZ,
  metodo_pagamento VARCHAR(20), -- pix, cartao, boleto
  gateway_id VARCHAR(100), -- ID no Mercado Pago
  gateway_url TEXT, -- URL de pagamento
  pix_code TEXT,
  pix_qrcode TEXT,
  boleto_url TEXT,
  boleto_codigo VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_invoices_condo ON invoices(condo_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_vencimento ON invoices(data_vencimento);

-- RLS
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can see invoices of their condo" ON invoices
  FOR SELECT USING (
    condo_id IN (SELECT condo_id FROM users WHERE id = auth.uid())
    OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'superadmin')
  );

CREATE POLICY "Superadmin can manage all invoices" ON invoices
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'superadmin')
  );

-- Função para gerar número da fatura
CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.numero := 'INV-' || TO_CHAR(NOW(), 'YYYYMM') || '-' || LPAD(NEXTVAL('invoice_seq')::TEXT, 5, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE SEQUENCE IF NOT EXISTS invoice_seq START 1;

CREATE TRIGGER set_invoice_number
  BEFORE INSERT ON invoices
  FOR EACH ROW
  WHEN (NEW.numero IS NULL)
  EXECUTE FUNCTION generate_invoice_number();

-- =============================================
-- 2. TABELA DE LOGS DE EMAIL
-- =============================================
CREATE TABLE IF NOT EXISTS email_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  condo_id UUID REFERENCES condos(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  tipo VARCHAR(50) NOT NULL, -- welcome, trial_ending, invoice, overdue, blocked, payment_confirmed
  destinatario VARCHAR(255) NOT NULL,
  assunto VARCHAR(255) NOT NULL,
  status VARCHAR(20) DEFAULT 'enviado' CHECK (status IN ('enviado', 'falhou', 'pendente')),
  erro TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_email_logs_condo ON email_logs(condo_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_tipo ON email_logs(tipo);

ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Superadmin can see all email logs" ON email_logs
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'superadmin')
  );

-- =============================================
-- 3. TABELA DE ACEITES LEGAIS
-- =============================================
CREATE TABLE IF NOT EXISTS legal_acceptances (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  email VARCHAR(255) NOT NULL,
  tipo VARCHAR(50) NOT NULL, -- termos, privacidade, contrato
  versao VARCHAR(20) DEFAULT '1.0',
  ip_address VARCHAR(45),
  user_agent TEXT,
  aceito_em TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_legal_user ON legal_acceptances(user_id);
CREATE INDEX IF NOT EXISTS idx_legal_tipo ON legal_acceptances(tipo);

ALTER TABLE legal_acceptances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Superadmin can see all acceptances" ON legal_acceptances
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'superadmin')
  );

CREATE POLICY "Users can insert their own acceptances" ON legal_acceptances
  FOR INSERT WITH CHECK (true);

-- =============================================
-- 4. ATUALIZAÇÃO DA TABELA SUBSCRIPTIONS
-- =============================================
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS bloqueado BOOLEAN DEFAULT false;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS data_bloqueio TIMESTAMPTZ;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS motivo_bloqueio TEXT;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS dias_atraso INTEGER DEFAULT 0;

-- =============================================
-- 5. FUNÇÃO: VERIFICAR ASSINATURAS VENCIDAS
-- Executar diariamente via cron
-- =============================================
CREATE OR REPLACE FUNCTION check_overdue_subscriptions()
RETURNS TABLE(
  subscription_id UUID,
  condo_id UUID,
  dias_atraso INTEGER,
  acao TEXT
) AS $$
DECLARE
  sub RECORD;
BEGIN
  FOR sub IN 
    SELECT 
      s.id,
      s.condo_id,
      s.status,
      s.data_fim,
      s.bloqueado,
      CURRENT_DATE - s.data_fim::DATE as dias
    FROM subscriptions s
    WHERE s.status IN ('ativo', 'teste')
    AND s.data_fim < CURRENT_DATE
  LOOP
    -- Atualizar dias de atraso
    UPDATE subscriptions SET dias_atraso = sub.dias WHERE id = sub.id;
    
    subscription_id := sub.id;
    condo_id := sub.condo_id;
    dias_atraso := sub.dias;
    
    IF sub.dias >= 10 AND NOT sub.bloqueado THEN
      -- Bloquear acesso após 10 dias
      UPDATE subscriptions 
      SET bloqueado = true, 
          data_bloqueio = NOW(),
          motivo_bloqueio = 'Inadimplência - ' || sub.dias || ' dias de atraso',
          status = 'suspenso'
      WHERE id = sub.id;
      acao := 'BLOQUEADO';
    ELSIF sub.dias >= 5 THEN
      acao := 'AVISO_URGENTE';
    ELSIF sub.dias >= 3 THEN
      acao := 'AVISO_VENCIDO';
    ELSE
      acao := 'VENCIDO';
    END IF;
    
    RETURN NEXT;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- 6. FUNÇÃO: LIBERAR ASSINATURA APÓS PAGAMENTO
-- =============================================
CREATE OR REPLACE FUNCTION release_subscription(p_condo_id UUID, p_meses INTEGER DEFAULT 1)
RETURNS VOID AS $$
BEGIN
  UPDATE subscriptions
  SET 
    bloqueado = false,
    data_bloqueio = NULL,
    motivo_bloqueio = NULL,
    dias_atraso = 0,
    status = 'ativo',
    data_fim = CURRENT_DATE + (p_meses * INTERVAL '1 month')
  WHERE condo_id = p_condo_id;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- 7. FUNÇÃO: CALCULAR MÉTRICAS DO ADMIN
-- =============================================
CREATE OR REPLACE FUNCTION get_admin_metrics()
RETURNS TABLE(
  total_condos BIGINT,
  condos_ativos BIGINT,
  condos_teste BIGINT,
  condos_suspensos BIGINT,
  condos_inadimplentes BIGINT,
  mrr DECIMAL,
  receita_mes DECIMAL,
  churn_rate DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    (SELECT COUNT(*) FROM condos WHERE ativo = true) as total_condos,
    (SELECT COUNT(*) FROM subscriptions WHERE status = 'ativo') as condos_ativos,
    (SELECT COUNT(*) FROM subscriptions WHERE status = 'teste') as condos_teste,
    (SELECT COUNT(*) FROM subscriptions WHERE status = 'suspenso') as condos_suspensos,
    (SELECT COUNT(*) FROM subscriptions WHERE dias_atraso > 0) as condos_inadimplentes,
    (SELECT COALESCE(SUM(valor_mensal_cobrado), 0) FROM subscriptions WHERE status = 'ativo') as mrr,
    (SELECT COALESCE(SUM(valor), 0) FROM invoices WHERE status = 'pago' AND DATE_TRUNC('month', data_pagamento) = DATE_TRUNC('month', CURRENT_DATE)) as receita_mes,
    CASE 
      WHEN (SELECT COUNT(*) FROM subscriptions) > 0 
      THEN ((SELECT COUNT(*) FROM subscriptions WHERE status = 'cancelado')::DECIMAL / (SELECT COUNT(*) FROM subscriptions)::DECIMAL * 100)
      ELSE 0
    END as churn_rate;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- 8. VIEW: FATURAS COM DADOS DO CONDOMÍNIO
-- =============================================
CREATE OR REPLACE VIEW invoices_view AS
SELECT 
  i.*,
  c.nome as condo_nome,
  s.status as subscription_status,
  p.nome_plano
FROM invoices i
LEFT JOIN condos c ON i.condo_id = c.id
LEFT JOIN subscriptions s ON i.subscription_id = s.id
LEFT JOIN plans p ON s.plano_id = p.id;

-- =============================================
-- 9. FUNÇÃO: GERAR FATURA MENSAL
-- =============================================
CREATE OR REPLACE FUNCTION generate_monthly_invoice(p_subscription_id UUID)
RETURNS UUID AS $$
DECLARE
  v_invoice_id UUID;
  v_sub RECORD;
BEGIN
  -- Buscar dados da assinatura
  SELECT s.*, c.id as condo_id
  INTO v_sub
  FROM subscriptions s
  JOIN condos c ON s.condo_id = c.id
  WHERE s.id = p_subscription_id;
  
  -- Criar fatura
  INSERT INTO invoices (
    condo_id,
    subscription_id,
    valor,
    data_vencimento,
    status
  ) VALUES (
    v_sub.condo_id,
    p_subscription_id,
    v_sub.valor_mensal_cobrado,
    v_sub.data_fim,
    'pendente'
  ) RETURNING id INTO v_invoice_id;
  
  RETURN v_invoice_id;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- PRONTO! Execute este script no Supabase.
-- =============================================
