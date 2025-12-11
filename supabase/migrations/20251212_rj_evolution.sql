-- supabase/migrations/20251212_rj_evolution.sql
-- Portaria Turbo
CREATE TABLE IF NOT EXISTS turbo_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  condo_id uuid NOT NULL REFERENCES condos(id) ON DELETE CASCADE,
  porteiro_id uuid NOT NULL REFERENCES users(id),
  entry_type text NOT NULL CHECK (entry_type IN ('visitante','prestador','encomenda')),
  name text,
  document text,
  plate text,
  qr_data text,
  ocr_text text,
  photo_url text,
  created_at timestamptz DEFAULT now(),
  processed boolean DEFAULT false
);
CREATE INDEX IF NOT EXISTS idx_turbo_condo_created ON turbo_entries(condo_id, created_at);

-- Governança: Enquetes
CREATE TABLE IF NOT EXISTS governanca_enquetes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  condo_id uuid NOT NULL REFERENCES condos(id),
  title text NOT NULL,
  description text,
  options jsonb NOT NULL,
  votes jsonb DEFAULT '[]'::jsonb,
  visible boolean DEFAULT true,
  start_at timestamptz,
  end_at timestamptz,
  created_by uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now()
);

-- Governança: Assembleias
CREATE TABLE IF NOT EXISTS governanca_assembleias (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  condo_id uuid REFERENCES condos(id),
  title text NOT NULL,
  agenda jsonb,
  documents jsonb DEFAULT '[]'::jsonb,
  start_at timestamptz,
  end_at timestamptz,
  attendance jsonb DEFAULT '[]'::jsonb,
  votes jsonb DEFAULT '[]'::jsonb,
  created_by uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now()
);

-- Governança: Documents
CREATE TABLE IF NOT EXISTS governanca_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  condo_id uuid REFERENCES condos(id),
  folder text,
  name text NOT NULL,
  storage_path text NOT NULL,
  metadata jsonb DEFAULT '{}',
  version int DEFAULT 1,
  uploaded_by uuid REFERENCES users(id),
  uploaded_at timestamptz DEFAULT now()
);

-- Manutenção
CREATE TABLE IF NOT EXISTS manutencao_equipments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  condo_id uuid REFERENCES condos(id),
  name text NOT NULL,
  type text,
  location text,
  status text DEFAULT 'ok' CHECK (status IN ('ok','pendente','vencido')),
  created_at timestamptz DEFAULT now()
);
CREATE TABLE IF NOT EXISTS manutencao_schedule (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  equipment_id uuid REFERENCES manutencao_equipments(id) ON DELETE CASCADE,
  condo_id uuid REFERENCES condos(id),
  next_date date,
  frequency text,
  metadata jsonb DEFAULT '{}',
  notified boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);
CREATE TABLE IF NOT EXISTS manutencao_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  equipment_id uuid REFERENCES manutencao_equipments(id),
  performed_at timestamptz,
  performed_by uuid REFERENCES users(id),
  notes text,
  created_at timestamptz DEFAULT now()
);

-- RLS examples (assumes helper funcs exist)
ALTER TABLE turbo_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY turbo_read ON turbo_entries FOR SELECT USING (get_my_condo_id() = condo_id OR get_my_role() = 'superadmin');
CREATE POLICY turbo_insert ON turbo_entries FOR INSERT WITH CHECK (get_my_condo_id() = condo_id OR get_my_role() = 'superadmin');

ALTER TABLE governanca_enquetes ENABLE ROW LEVEL SECURITY;
CREATE POLICY enquete_read ON governanca_enquetes FOR SELECT USING (get_my_condo_id() = condo_id OR get_my_role() = 'superadmin');
CREATE POLICY enquete_insert ON governanca_enquetes FOR INSERT WITH CHECK (get_my_condo_id() = condo_id OR get_my_role() = 'superadmin');

ALTER TABLE governanca_assembleias ENABLE ROW LEVEL SECURITY;
CREATE POLICY assembleia_read ON governanca_assembleias FOR SELECT USING (get_my_condo_id() = condo_id OR get_my_role() = 'superadmin');
CREATE POLICY assembleia_insert ON governanca_assembleias FOR INSERT WITH CHECK (get_my_condo_id() = condo_id OR get_my_role() = 'superadmin');

ALTER TABLE governanca_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY documents_read ON governanca_documents FOR SELECT USING (get_my_condo_id() = condo_id OR get_my_role() = 'superadmin');
CREATE POLICY documents_insert ON governanca_documents FOR INSERT WITH CHECK (get_my_condo_id() = condo_id OR get_my_role() = 'superadmin');

ALTER TABLE manutencao_equipments ENABLE ROW LEVEL SECURITY;
CREATE POLICY manut_read ON manutencao_equipments FOR SELECT USING (get_my_condo_id() = condo_id OR get_my_role() = 'superadmin');
CREATE POLICY manut_insert ON manutencao_equipments FOR INSERT WITH CHECK (get_my_condo_id() = condo_id OR get_my_role() = 'superadmin');

ALTER TABLE manutencao_schedule ENABLE ROW LEVEL SECURITY;
CREATE POLICY schedule_read ON manutencao_schedule FOR SELECT USING (get_my_condo_id() = condo_id OR get_my_role() = 'superadmin');
CREATE POLICY schedule_insert ON manutencao_schedule FOR INSERT WITH CHECK (get_my_condo_id() = condo_id OR get_my_role() = 'superadmin');

ALTER TABLE manutencao_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY history_read ON manutencao_history FOR SELECT USING (get_my_condo_id() = condo_id OR get_my_role() = 'superadmin');
CREATE POLICY history_insert ON manutencao_history FOR INSERT WITH CHECK (get_my_condo_id() = condo_id OR get_my_role() = 'superadmin');
