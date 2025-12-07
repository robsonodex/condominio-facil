-- =============================================
-- Condomínio Fácil - Database Schema
-- Execute this SQL in Supabase SQL Editor
-- =============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- 1. PLANS (Planos de Assinatura)
-- =============================================
CREATE TABLE IF NOT EXISTS plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome_plano TEXT NOT NULL,
  limite_unidades INT NOT NULL,
  valor_mensal DECIMAL(10,2) NOT NULL,
  descricao TEXT,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Insert default plans
INSERT INTO plans (nome_plano, limite_unidades, valor_mensal, descricao, ativo) VALUES
  ('Básico', 20, 99.90, 'Ideal para condomínios pequenos', true),
  ('Intermediário', 40, 179.90, 'Para condomínios médios', true),
  ('Avançado', 60, 249.90, 'Para condomínios maiores', true);

-- =============================================
-- 2. CONDOS (Condomínios)
-- =============================================
CREATE TABLE IF NOT EXISTS condos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome TEXT NOT NULL,
  cnpj TEXT,
  endereco TEXT,
  cidade TEXT,
  estado TEXT,
  cep TEXT,
  telefone TEXT,
  email_contato TEXT,
  plano_id UUID REFERENCES plans(id),
  status TEXT DEFAULT 'teste' CHECK (status IN ('ativo', 'suspenso', 'teste')),
  data_inicio DATE DEFAULT CURRENT_DATE,
  data_fim_teste DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================
-- 3. UNITS (Unidades/Apartamentos)
-- =============================================
CREATE TABLE IF NOT EXISTS units (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  condo_id UUID NOT NULL REFERENCES condos(id) ON DELETE CASCADE,
  bloco TEXT,
  numero_unidade TEXT NOT NULL,
  metragem DECIMAL(10,2),
  vaga TEXT,
  observacoes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================
-- 4. USERS (Usuários)
-- =============================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  telefone TEXT,
  role TEXT NOT NULL CHECK (role IN ('superadmin', 'sindico', 'porteiro', 'morador')),
  condo_id UUID REFERENCES condos(id),
  unidade_id UUID REFERENCES units(id),
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Insert default superadmin
INSERT INTO users (nome, email, role, ativo) VALUES
  ('Administrador', 'admin@condominiofacil.com.br', 'superadmin', true);

-- =============================================
-- 5. RESIDENTS (Moradores)
-- =============================================
CREATE TABLE IF NOT EXISTS residents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  condo_id UUID NOT NULL REFERENCES condos(id),
  unidade_id UUID NOT NULL REFERENCES units(id),
  tipo TEXT DEFAULT 'proprietario' CHECK (tipo IN ('proprietario', 'inquilino')),
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================
-- 6. FINANCIAL_ENTRIES (Lançamentos Financeiros)
-- =============================================
CREATE TABLE IF NOT EXISTS financial_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  condo_id UUID NOT NULL REFERENCES condos(id),
  tipo TEXT NOT NULL CHECK (tipo IN ('receita', 'despesa')),
  categoria TEXT NOT NULL,
  descricao TEXT,
  valor DECIMAL(10,2) NOT NULL,
  data_vencimento DATE NOT NULL,
  data_pagamento DATE,
  unidade_id UUID REFERENCES units(id),
  status TEXT DEFAULT 'previsto' CHECK (status IN ('previsto', 'em_aberto', 'pago', 'atrasado')),
  forma_pagamento TEXT,
  anexo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================
-- 7. NOTICES (Avisos/Comunicados)
-- =============================================
CREATE TABLE IF NOT EXISTS notices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  condo_id UUID NOT NULL REFERENCES condos(id),
  titulo TEXT NOT NULL,
  mensagem TEXT NOT NULL,
  publico_alvo TEXT DEFAULT 'todos' CHECK (publico_alvo IN ('todos', 'somente_moradores', 'somente_sindico_porteiro')),
  data_publicacao TIMESTAMPTZ DEFAULT now(),
  data_expiracao TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================
-- 8. NOTICE_READS (Leitura de Avisos)
-- =============================================
CREATE TABLE IF NOT EXISTS notice_reads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  notice_id UUID NOT NULL REFERENCES notices(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  read_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(notice_id, user_id)
);

-- =============================================
-- 9. OCCURRENCES (Ocorrências)
-- =============================================
CREATE TABLE IF NOT EXISTS occurrences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  condo_id UUID NOT NULL REFERENCES condos(id),
  unidade_id UUID REFERENCES units(id),
  criado_por_user_id UUID NOT NULL REFERENCES users(id),
  tipo TEXT NOT NULL CHECK (tipo IN ('reclamacao', 'incidente', 'manutencao', 'outro')),
  titulo TEXT NOT NULL,
  descricao TEXT,
  status TEXT DEFAULT 'aberta' CHECK (status IN ('aberta', 'em_andamento', 'resolvida', 'cancelada')),
  prioridade TEXT DEFAULT 'media' CHECK (prioridade IN ('baixa', 'media', 'alta')),
  fotos_urls TEXT[],
  responsavel_user_id UUID REFERENCES users(id),
  data_abertura TIMESTAMPTZ DEFAULT now(),
  data_fechamento TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================
-- 10. VISITORS (Visitantes)
-- =============================================
CREATE TABLE IF NOT EXISTS visitors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  condo_id UUID NOT NULL REFERENCES condos(id),
  unidade_id UUID REFERENCES units(id),
  nome TEXT NOT NULL,
  documento TEXT,
  tipo TEXT DEFAULT 'visitante' CHECK (tipo IN ('visitante', 'prestador_servico', 'entrega')),
  placa_veiculo TEXT,
  data_hora_entrada TIMESTAMPTZ DEFAULT now(),
  data_hora_saida TIMESTAMPTZ,
  registrado_por_user_id UUID NOT NULL REFERENCES users(id),
  observacoes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================
-- 11. SUBSCRIPTIONS (Assinaturas)
-- =============================================
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  condo_id UUID NOT NULL REFERENCES condos(id),
  plano_id UUID NOT NULL REFERENCES plans(id),
  status TEXT DEFAULT 'ativo' CHECK (status IN ('ativo', 'pendente_pagamento', 'cancelado')),
  data_inicio DATE DEFAULT CURRENT_DATE,
  data_renovacao DATE,
  data_cancelamento DATE,
  valor_mensal_cobrado DECIMAL(10,2),
  observacoes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================
-- 12. FINANCIAL_REPORTS (Relatórios Gerados)
-- =============================================
CREATE TABLE IF NOT EXISTS financial_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  condo_id UUID NOT NULL REFERENCES condos(id),
  periodo_inicio DATE NOT NULL,
  periodo_fim DATE NOT NULL,
  arquivo_url TEXT NOT NULL,
  gerado_por_user_id UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================
-- INDEXES
-- =============================================
CREATE INDEX IF NOT EXISTS idx_units_condo ON units(condo_id);
CREATE INDEX IF NOT EXISTS idx_users_condo ON users(condo_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_residents_condo ON residents(condo_id);
CREATE INDEX IF NOT EXISTS idx_residents_unit ON residents(unidade_id);
CREATE INDEX IF NOT EXISTS idx_financial_condo ON financial_entries(condo_id);
CREATE INDEX IF NOT EXISTS idx_financial_status ON financial_entries(status);
CREATE INDEX IF NOT EXISTS idx_notices_condo ON notices(condo_id);
CREATE INDEX IF NOT EXISTS idx_occurrences_condo ON occurrences(condo_id);
CREATE INDEX IF NOT EXISTS idx_occurrences_status ON occurrences(status);
CREATE INDEX IF NOT EXISTS idx_visitors_condo ON visitors(condo_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_condo ON subscriptions(condo_id);

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================

-- Enable RLS on all tables
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE condos ENABLE ROW LEVEL SECURITY;
ALTER TABLE units ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE residents ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE notices ENABLE ROW LEVEL SECURITY;
ALTER TABLE notice_reads ENABLE ROW LEVEL SECURITY;
ALTER TABLE occurrences ENABLE ROW LEVEL SECURITY;
ALTER TABLE visitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_reports ENABLE ROW LEVEL SECURITY;

-- Plans: Everyone can read active plans
CREATE POLICY "Anyone can view active plans" ON plans
  FOR SELECT USING (ativo = true);

CREATE POLICY "Superadmin full access to plans" ON plans
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'superadmin')
  );

-- Condos: Superadmin sees all, others see their own
CREATE POLICY "Superadmin full access to condos" ON condos
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'superadmin')
  );

CREATE POLICY "Users see their own condo" ON condos
  FOR SELECT USING (
    id = (SELECT condo_id FROM users WHERE id = auth.uid())
  );

-- Users: Superadmin sees all, others see same condo users
CREATE POLICY "Superadmin full access to users" ON users
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'superadmin')
  );

CREATE POLICY "Users see same condo users" ON users
  FOR SELECT USING (
    condo_id = (SELECT condo_id FROM users WHERE id = auth.uid())
    OR id = auth.uid()
  );

-- Units: Based on condo access
CREATE POLICY "Access units by condo" ON units
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'superadmin')
    OR condo_id = (SELECT condo_id FROM users WHERE id = auth.uid())
  );

-- Financial entries: Síndico and superadmin full access, morador sees own unit
CREATE POLICY "Superadmin and sindico access financial" ON financial_entries
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('superadmin', 'sindico') AND (condo_id = financial_entries.condo_id OR role = 'superadmin'))
  );

CREATE POLICY "Morador sees own unit financial" ON financial_entries
  FOR SELECT USING (
    unidade_id = (SELECT unidade_id FROM users WHERE id = auth.uid())
  );

-- Notices: Based on condo and audience
CREATE POLICY "Access notices by condo" ON notices
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'superadmin')
    OR condo_id = (SELECT condo_id FROM users WHERE id = auth.uid())
  );

-- Occurrences: Based on condo, morador sees own unit
CREATE POLICY "Access occurrences" ON occurrences
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('superadmin', 'sindico', 'porteiro'))
    OR (criado_por_user_id = auth.uid())
    OR (unidade_id = (SELECT unidade_id FROM users WHERE id = auth.uid()))
  );

-- Visitors: Superadmin, sindico, porteiro full access
CREATE POLICY "Access visitors" ON visitors
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('superadmin', 'sindico', 'porteiro'))
    OR unidade_id = (SELECT unidade_id FROM users WHERE id = auth.uid())
  );

-- Residents: Same condo access
CREATE POLICY "Access residents" ON residents
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'superadmin')
    OR condo_id = (SELECT condo_id FROM users WHERE id = auth.uid())
  );

-- Subscriptions: Superadmin only
CREATE POLICY "Superadmin access subscriptions" ON subscriptions
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'superadmin')
  );

-- Financial reports: Sindico and superadmin
CREATE POLICY "Access financial reports" ON financial_reports
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('superadmin', 'sindico'))
  );

-- Notice reads: Users can manage their own reads
CREATE POLICY "Users manage own notice reads" ON notice_reads
  FOR ALL USING (user_id = auth.uid());

-- =============================================
-- TRIGGERS for updated_at
-- =============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_condos_updated_at BEFORE UPDATE ON condos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_units_updated_at BEFORE UPDATE ON units
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_residents_updated_at BEFORE UPDATE ON residents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_financial_entries_updated_at BEFORE UPDATE ON financial_entries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notices_updated_at BEFORE UPDATE ON notices
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_occurrences_updated_at BEFORE UPDATE ON occurrences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- FUNCTION: Auto-update financial status
-- Run daily via pg_cron or Supabase scheduled function
-- =============================================
CREATE OR REPLACE FUNCTION update_overdue_financial_entries()
RETURNS void AS $$
BEGIN
  -- Mark as atrasado if past due and still em_aberto
  UPDATE financial_entries
  SET status = 'atrasado', updated_at = now()
  WHERE data_vencimento < CURRENT_DATE
    AND status = 'em_aberto';
  
  -- Mark as pago if payment date is set
  UPDATE financial_entries
  SET status = 'pago', updated_at = now()
  WHERE data_pagamento IS NOT NULL
    AND status != 'pago';
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- FUNCTION: Suspend expired trial condos
-- Run daily via pg_cron or Supabase scheduled function
-- =============================================
CREATE OR REPLACE FUNCTION suspend_expired_trials()
RETURNS void AS $$
BEGIN
  UPDATE condos
  SET status = 'suspenso', updated_at = now()
  WHERE status = 'teste'
    AND data_fim_teste < CURRENT_DATE
    AND NOT EXISTS (
      SELECT 1 FROM subscriptions 
      WHERE subscriptions.condo_id = condos.id 
      AND subscriptions.status = 'ativo'
    );
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- Done! Your database is ready.
-- =============================================
