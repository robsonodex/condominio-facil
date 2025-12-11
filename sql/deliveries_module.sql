-- 2.1 Tabela deliveries (entregas)
CREATE TABLE IF NOT EXISTS deliveries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  condo_id uuid NOT NULL REFERENCES condos(id) ON DELETE CASCADE,
  unit_id uuid NOT NULL REFERENCES units(id) ON DELETE CASCADE,
  resident_id uuid NULL REFERENCES residents(id),
  created_by uuid NOT NULL REFERENCES users(id),
  received_at timestamptz DEFAULT now(),
  delivered_by text,
  tracking_code text,
  type text,
  status text NOT NULL DEFAULT 'notified' CHECK (status IN ('notified','confirmed','collected','returned','cancelled')),
  notes text,
  photo_url text,
  notification_sent boolean DEFAULT false,
  notification_method jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_deliveries_condo_unit ON deliveries(condo_id, unit_id, status);

-- 2.2 Tabela delivery_notifications
CREATE TABLE IF NOT EXISTS delivery_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  delivery_id uuid NOT NULL REFERENCES deliveries(id) ON DELETE CASCADE,
  channel text NOT NULL CHECK (channel IN ('whatsapp','email')),
  to_address text,
  template_name text,
  payload jsonb,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','sent','failed')),
  attempts int DEFAULT 0,
  last_error text,
  scheduled_at timestamptz,
  sent_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_delivery_notifications_status ON delivery_notifications(status);

-- 2.3 Trigger para criar notificações automáticas
CREATE OR REPLACE FUNCTION public.enqueue_delivery_notifications() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  v_phone text;
  v_email text;
BEGIN
  -- Buscar dados do usuário vinculado ao residente
  SELECT u.telefone, u.email 
  INTO v_phone, v_email
  FROM residents r
  JOIN users u ON u.id = r.user_id
  WHERE r.id = NEW.resident_id;

  -- Whatsapp (apenas se tiver telefone)
  IF v_phone IS NOT NULL THEN
    INSERT INTO delivery_notifications(delivery_id, channel, to_address, template_name, payload, scheduled_at)
    VALUES (NEW.id, 'whatsapp', v_phone, 'delivery_whatsapp', jsonb_build_object('delivery_id', NEW.id), now());
  END IF;

  -- Email (apenas se tiver email)
  IF v_email IS NOT NULL THEN
    INSERT INTO delivery_notifications(delivery_id, channel, to_address, template_name, payload, scheduled_at)
    VALUES (NEW.id, 'email', v_email, 'delivery_email', jsonb_build_object('delivery_id', NEW.id), now());
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enqueue_delivery_notifications ON deliveries;
CREATE TRIGGER trg_enqueue_delivery_notifications
AFTER INSERT ON deliveries
FOR EACH ROW
EXECUTE FUNCTION enqueue_delivery_notifications();

-- 2.4 RLS
ALTER TABLE deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_notifications ENABLE ROW LEVEL SECURITY;

-- Policies for deliveries
DROP POLICY IF EXISTS "deliveries_read" ON deliveries;
CREATE POLICY "deliveries_read" ON deliveries
  FOR SELECT USING (
    auth.role() = 'service_role' OR
    (auth.role() = 'authenticated' AND (
        -- Superadmin bypass (check via public.is_superadmin() or claim if available, using the provided example logic)
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'superadmin')
        OR
        condo_id = (select get_my_condo_id())
    ))
  );

DROP POLICY IF EXISTS "deliveries_insert" ON deliveries;
CREATE POLICY "deliveries_insert" ON deliveries
  FOR INSERT WITH CHECK (
      auth.role() = 'service_role' OR
      (auth.role() = 'authenticated' AND (
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND (role = 'porteiro' OR role = 'superadmin' OR role = 'admin'))
      ))
  );

DROP POLICY IF EXISTS "deliveries_update" ON deliveries;
CREATE POLICY "deliveries_update" ON deliveries
    FOR UPDATE USING (
        auth.role() = 'service_role' OR
        condo_id = (select get_my_condo_id())
    );


-- Policies for notifications
DROP POLICY IF EXISTS "delivery_notifications_read" ON delivery_notifications;
CREATE POLICY "delivery_notifications_read" ON delivery_notifications
  FOR SELECT USING (
    auth.role() = 'service_role' OR
    (auth.role() = 'authenticated' AND (
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'superadmin')
        OR
        delivery_id IN (SELECT id FROM deliveries WHERE condo_id = (select get_my_condo_id()))
    ))
);
