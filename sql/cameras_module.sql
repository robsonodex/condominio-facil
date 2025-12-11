-- =====================================================
-- MÓDULO DE CÂMERAS - Condomínio Fácil v5.2
-- Apenas visualização ao vivo + snapshots (sem gravação)
-- =====================================================

-- 1. Tabela de Gateways de Câmeras (um por condomínio)
CREATE TABLE IF NOT EXISTS camera_gateways (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    condo_id UUID NOT NULL REFERENCES condos(id) ON DELETE CASCADE,
    
    -- Identificação
    nome VARCHAR(100) NOT NULL DEFAULT 'Gateway Principal',
    descricao TEXT,
    
    -- Rede
    ip_address VARCHAR(45) NOT NULL,
    subnet_mask VARCHAR(45) DEFAULT '255.255.255.0',
    port INT DEFAULT 8554,
    
    -- Autenticação
    api_key VARCHAR(255),
    api_secret VARCHAR(255),
    
    -- Status
    status VARCHAR(20) DEFAULT 'pendente', -- 'ativo', 'pendente', 'offline', 'erro'
    last_heartbeat TIMESTAMPTZ,
    last_error TEXT,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(condo_id)
);

-- 2. Tabela de Câmeras
CREATE TABLE IF NOT EXISTS cameras (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    condo_id UUID NOT NULL REFERENCES condos(id) ON DELETE CASCADE,
    gateway_id UUID REFERENCES camera_gateways(id) ON DELETE SET NULL,
    
    -- Identificação
    nome VARCHAR(100) NOT NULL,
    descricao TEXT,
    localizacao VARCHAR(255), -- Ex: "Entrada principal", "Garagem B1"
    
    -- Rede (obrigatório mesma LAN)
    ip_address VARCHAR(45) NOT NULL,
    port INT DEFAULT 554,
    network_type VARCHAR(20) DEFAULT 'local', -- apenas 'local' suportado
    
    -- RTSP/ONVIF Config
    rtsp_path VARCHAR(255) DEFAULT '/stream1',
    rtsp_username VARCHAR(100),
    rtsp_password VARCHAR(255),
    onvif_enabled BOOLEAN DEFAULT true,
    onvif_port INT DEFAULT 80,
    
    -- Specs da câmera
    codec VARCHAR(20) DEFAULT 'H.264',
    resolucao VARCHAR(20) DEFAULT '720p',
    fps INT DEFAULT 15,
    
    -- Validação de rede
    reachable BOOLEAN DEFAULT false,
    last_probe TIMESTAMPTZ,
    probe_result JSONB,
    
    -- Status
    status VARCHAR(20) DEFAULT 'pendente', -- 'ativo', 'pendente', 'offline', 'erro'
    streaming BOOLEAN DEFAULT false,
    last_frame TIMESTAMPTZ,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Tabela de Streams (tokens de acesso)
CREATE TABLE IF NOT EXISTS camera_streams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    camera_id UUID NOT NULL REFERENCES cameras(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    
    -- Token
    stream_token VARCHAR(255) NOT NULL UNIQUE,
    stream_type VARCHAR(20) DEFAULT 'webrtc', -- 'webrtc', 'hls'
    stream_url TEXT,
    
    -- Validade
    expires_at TIMESTAMPTZ NOT NULL,
    
    -- Uso
    last_access TIMESTAMPTZ,
    access_count INT DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Tabela de Snapshots (TTL 24h)
CREATE TABLE IF NOT EXISTS camera_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    camera_id UUID NOT NULL REFERENCES cameras(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    
    -- Imagem
    image_url TEXT NOT NULL, -- URL temporária ou base64
    thumbnail_url TEXT,
    
    -- Contexto
    motivo VARCHAR(100), -- 'manual', 'ocorrencia', 'visitante', 'evento'
    occurrence_id UUID REFERENCES occurrences(id) ON DELETE SET NULL,
    visitor_id UUID REFERENCES visitors(id) ON DELETE SET NULL,
    
    -- TTL
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '24 hours'),
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Tabela de Eventos da Câmera
CREATE TABLE IF NOT EXISTS camera_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    camera_id UUID NOT NULL REFERENCES cameras(id) ON DELETE CASCADE,
    condo_id UUID NOT NULL REFERENCES condos(id) ON DELETE CASCADE,
    
    -- Evento
    tipo VARCHAR(50) NOT NULL, -- 'acesso', 'movimento', 'offline', 'online', 'snapshot', 'erro'
    descricao TEXT,
    
    -- Contexto
    user_id UUID REFERENCES users(id),
    metadata JSONB,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- RLS POLICIES
-- =====================================================

ALTER TABLE camera_gateways ENABLE ROW LEVEL SECURITY;
ALTER TABLE cameras ENABLE ROW LEVEL SECURITY;
ALTER TABLE camera_streams ENABLE ROW LEVEL SECURITY;
ALTER TABLE camera_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE camera_events ENABLE ROW LEVEL SECURITY;

-- Gateways: apenas síndico e superadmin
CREATE POLICY "Sindico manages gateways"
    ON camera_gateways FOR ALL
    USING (condo_id = get_my_condo_id() AND get_my_role() IN ('sindico', 'superadmin'));

CREATE POLICY "Superadmin full access gateways"
    ON camera_gateways FOR ALL
    USING (get_my_role() = 'superadmin');

-- Cameras: síndico gerencia, porteiro visualiza
CREATE POLICY "Sindico manages cameras"
    ON cameras FOR ALL
    USING (condo_id = get_my_condo_id() AND get_my_role() IN ('sindico', 'superadmin'));

CREATE POLICY "Porteiro views cameras"
    ON cameras FOR SELECT
    USING (condo_id = get_my_condo_id() AND get_my_role() = 'porteiro');

-- Streams: usuário acessa próprios tokens
CREATE POLICY "User manages own streams"
    ON camera_streams FOR ALL
    USING (user_id = auth.uid());

CREATE POLICY "Sindico manages all streams"
    ON camera_streams FOR ALL
    USING (EXISTS (
        SELECT 1 FROM cameras c 
        WHERE c.id = camera_streams.camera_id 
        AND c.condo_id = get_my_condo_id()
        AND get_my_role() IN ('sindico', 'superadmin')
    ));

-- Snapshots
CREATE POLICY "Condo users view snapshots"
    ON camera_snapshots FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM cameras c 
        WHERE c.id = camera_snapshots.camera_id 
        AND c.condo_id = get_my_condo_id()
    ));

CREATE POLICY "Staff creates snapshots"
    ON camera_snapshots FOR INSERT
    WITH CHECK (EXISTS (
        SELECT 1 FROM cameras c 
        WHERE c.id = camera_snapshots.camera_id 
        AND c.condo_id = get_my_condo_id()
        AND get_my_role() IN ('sindico', 'porteiro', 'superadmin')
    ));

-- Events
CREATE POLICY "Condo users view camera events"
    ON camera_events FOR SELECT
    USING (condo_id = get_my_condo_id());

CREATE POLICY "Staff logs camera events"
    ON camera_events FOR INSERT
    WITH CHECK (condo_id = get_my_condo_id() AND get_my_role() IN ('sindico', 'porteiro', 'superadmin'));

-- =====================================================
-- FUNÇÕES
-- =====================================================

-- Gerar token de stream (válido por 1 hora)
CREATE OR REPLACE FUNCTION create_camera_token(
    p_camera_id UUID,
    p_user_id UUID,
    p_stream_type VARCHAR DEFAULT 'webrtc'
)
RETURNS TABLE (token VARCHAR, expires_at TIMESTAMPTZ, stream_url TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_token VARCHAR;
    v_expires TIMESTAMPTZ;
    v_camera cameras;
    v_gateway camera_gateways;
    v_stream_url TEXT;
BEGIN
    -- Buscar câmera
    SELECT * INTO v_camera FROM cameras WHERE id = p_camera_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Câmera não encontrada';
    END IF;
    
    -- Verificar se está ativa
    IF v_camera.status != 'ativo' THEN
        RAISE EXCEPTION 'Câmera não está ativa';
    END IF;
    
    -- Buscar gateway
    SELECT * INTO v_gateway FROM camera_gateways WHERE id = v_camera.gateway_id;
    
    -- Gerar token
    v_token := encode(gen_random_bytes(32), 'hex');
    v_expires := NOW() + INTERVAL '1 hour';
    
    -- Montar URL do stream
    IF p_stream_type = 'hls' THEN
        v_stream_url := format('http://%s:%s/hls/%s/index.m3u8?token=%s', 
            v_gateway.ip_address, v_gateway.port, v_camera.id, v_token);
    ELSE
        v_stream_url := format('ws://%s:%s/webrtc/%s?token=%s', 
            v_gateway.ip_address, v_gateway.port, v_camera.id, v_token);
    END IF;
    
    -- Inserir stream
    INSERT INTO camera_streams (camera_id, user_id, stream_token, stream_type, stream_url, expires_at)
    VALUES (p_camera_id, p_user_id, v_token, p_stream_type, v_stream_url, v_expires);
    
    -- Log evento
    INSERT INTO camera_events (camera_id, condo_id, tipo, descricao, user_id)
    VALUES (p_camera_id, v_camera.condo_id, 'acesso', 'Stream iniciado', p_user_id);
    
    RETURN QUERY SELECT v_token, v_expires, v_stream_url;
END;
$$;

-- Validar se câmera está na mesma sub-rede
CREATE OR REPLACE FUNCTION validate_camera_subnet(
    p_camera_ip VARCHAR,
    p_gateway_ip VARCHAR,
    p_subnet_mask VARCHAR DEFAULT '255.255.255.0'
)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
    camera_parts INT[];
    gateway_parts INT[];
    mask_parts INT[];
    i INT;
BEGIN
    -- Parse IPs
    camera_parts := string_to_array(p_camera_ip, '.')::INT[];
    gateway_parts := string_to_array(p_gateway_ip, '.')::INT[];
    mask_parts := string_to_array(p_subnet_mask, '.')::INT[];
    
    -- Verificar se está na mesma sub-rede
    FOR i IN 1..4 LOOP
        IF (camera_parts[i] & mask_parts[i]) != (gateway_parts[i] & mask_parts[i]) THEN
            RETURN FALSE;
        END IF;
    END LOOP;
    
    RETURN TRUE;
END;
$$;

-- Limpar snapshots expirados (executar via cron)
CREATE OR REPLACE FUNCTION cleanup_expired_snapshots()
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    deleted_count INT;
BEGIN
    DELETE FROM camera_snapshots WHERE expires_at < NOW();
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$;

-- Limpar streams expirados
CREATE OR REPLACE FUNCTION cleanup_expired_streams()
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    deleted_count INT;
BEGIN
    DELETE FROM camera_streams WHERE expires_at < NOW();
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$;

-- =====================================================
-- ÍNDICES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_cameras_condo ON cameras(condo_id);
CREATE INDEX IF NOT EXISTS idx_cameras_gateway ON cameras(gateway_id);
CREATE INDEX IF NOT EXISTS idx_cameras_status ON cameras(status);
CREATE INDEX IF NOT EXISTS idx_camera_streams_token ON camera_streams(stream_token);
CREATE INDEX IF NOT EXISTS idx_camera_streams_expires ON camera_streams(expires_at);
CREATE INDEX IF NOT EXISTS idx_camera_snapshots_camera ON camera_snapshots(camera_id);
CREATE INDEX IF NOT EXISTS idx_camera_snapshots_expires ON camera_snapshots(expires_at);
CREATE INDEX IF NOT EXISTS idx_camera_events_camera ON camera_events(camera_id);
CREATE INDEX IF NOT EXISTS idx_camera_events_condo ON camera_events(condo_id);
CREATE INDEX IF NOT EXISTS idx_camera_events_created ON camera_events(created_at DESC);

-- Conceder permissões
GRANT EXECUTE ON FUNCTION create_camera_token TO authenticated;
GRANT EXECUTE ON FUNCTION validate_camera_subnet TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_expired_snapshots TO service_role;
GRANT EXECUTE ON FUNCTION cleanup_expired_streams TO service_role;
