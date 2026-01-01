-- ============================================
-- CONDO INTEGRATIONS (EXTENDED)
-- ============================================

CREATE TABLE IF NOT EXISTS condo_integrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    condo_id UUID NOT NULL REFERENCES condos(id) ON DELETE CASCADE,
    tipo VARCHAR(50) NOT NULL, -- 'pagamentos', 'whatsapp', 'email', 'sms'
    provider VARCHAR(50) NOT NULL, -- 'mercadopago', 'asaas', 'twilio', 'resend'
    credentials JSONB NOT NULL DEFAULT '{}',
    config JSONB DEFAULT '{}',
    ativo BOOLEAN DEFAULT TRUE,
    data_implantacao TIMESTAMPTZ DEFAULT now(),
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(condo_id, tipo, provider)
);

CREATE TABLE IF NOT EXISTS integration_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    condo_id UUID NOT NULL REFERENCES condos(id) ON DELETE CASCADE,
    integration_id UUID REFERENCES condo_integrations(id),
    tipo VARCHAR(50),
    provider VARCHAR(50),
    operation VARCHAR(100),
    success BOOLEAN,
    request_data JSONB,
    response_data JSONB,
    error_message TEXT,
    duration_ms INTEGER,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- ADVANCED CONCIERGE (PHASE 3)
-- ============================================

CREATE TABLE IF NOT EXISTS visitor_faces (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    condo_id UUID NOT NULL REFERENCES condos(id) ON DELETE CASCADE,
    visitor_id UUID REFERENCES visitors(id) ON DELETE CASCADE,
    face_token VARCHAR(255) NOT NULL, -- AWS Rekognition FaceId
    image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS intercom_devices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    condo_id UUID NOT NULL REFERENCES condos(id) ON DELETE CASCADE,
    unit_id UUID NOT NULL REFERENCES units(id) ON DELETE CASCADE,
    device_name VARCHAR(100),
    device_model VARCHAR(100),
    ip_address VARCHAR(50),
    status VARCHAR(20) DEFAULT 'offline',
    last_ping TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS intercom_calls (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    condo_id UUID NOT NULL REFERENCES condos(id) ON DELETE CASCADE,
    visitor_id UUID REFERENCES visitors(id),
    unit_id UUID NOT NULL REFERENCES units(id),
    device_id UUID REFERENCES intercom_devices(id),
    direction VARCHAR(10) DEFAULT 'inbound', -- inbound, outbound
    status VARCHAR(20) DEFAULT 'pending', -- pending, accepted, rejected, missed
    duration_seconds INTEGER,
    recording_url TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- DEMO SYSTEM (PHASE 6)
-- ============================================

CREATE TABLE IF NOT EXISTS demo_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    condo_id UUID NOT NULL REFERENCES condos(id) ON DELETE CASCADE,
    email VARCHAR(200) NOT NULL,
    session_token UUID DEFAULT gen_random_uuid(),
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- RLS POLICIES
-- ============================================

ALTER TABLE condo_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE integration_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE visitor_faces ENABLE ROW LEVEL SECURITY;
ALTER TABLE intercom_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE intercom_calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE demo_sessions ENABLE ROW LEVEL SECURITY;

-- Superadmin can see everything
-- Admins/Sindicos can see their owns
CREATE POLICY "Admins can manage integrations" ON condo_integrations
    FOR ALL USING (condo_id IN (SELECT condo_id FROM users WHERE id = auth.uid() AND role IN ('sindico', 'admin', 'superadmin')));

CREATE POLICY "Admins can see logs" ON integration_logs
    FOR SELECT USING (condo_id IN (SELECT condo_id FROM users WHERE id = auth.uid() AND role IN ('sindico', 'admin', 'superadmin')));

CREATE POLICY "Portaria can see faces" ON visitor_faces
    FOR SELECT USING (condo_id IN (SELECT condo_id FROM users WHERE id = auth.uid() AND role IN ('porteiro', 'sindico', 'admin', 'superadmin')));
