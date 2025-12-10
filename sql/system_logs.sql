-- =============================================
-- System Logs Table
-- For monitoring and error tracking
-- Execute in Supabase SQL Editor
-- =============================================

CREATE TABLE IF NOT EXISTS system_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event TEXT NOT NULL,
    level TEXT NOT NULL DEFAULT 'info' CHECK (level IN ('info', 'warn', 'error', 'debug')),
    meta JSONB DEFAULT '{}',
    user_id UUID REFERENCES users(id),
    condo_id UUID REFERENCES condos(id),
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Create index for efficient queries
CREATE INDEX IF NOT EXISTS idx_system_logs_level ON system_logs(level);
CREATE INDEX IF NOT EXISTS idx_system_logs_event ON system_logs(event);
CREATE INDEX IF NOT EXISTS idx_system_logs_created_at ON system_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_system_logs_user_id ON system_logs(user_id);

-- Enable RLS
ALTER TABLE system_logs ENABLE ROW LEVEL SECURITY;

-- Only superadmin can read logs
CREATE POLICY "Superadmin access logs" ON system_logs
    FOR ALL USING (
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'superadmin')
    );

-- Service role can always insert (for server-side logging)
CREATE POLICY "Service role insert logs" ON system_logs
    FOR INSERT WITH CHECK (true);

-- =============================================
-- Function to clean old logs (run via pg_cron)
-- =============================================
CREATE OR REPLACE FUNCTION clean_old_logs()
RETURNS void AS $$
BEGIN
    -- Delete logs older than 30 days (except errors which keep for 90 days)
    DELETE FROM system_logs
    WHERE created_at < now() - interval '30 days'
    AND level != 'error';

    DELETE FROM system_logs
    WHERE created_at < now() - interval '90 days'
    AND level = 'error';
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- View for recent errors (for dashboard)
-- =============================================
CREATE OR REPLACE VIEW recent_errors AS
SELECT 
    id,
    event,
    meta,
    user_id,
    condo_id,
    created_at
FROM system_logs
WHERE level = 'error'
AND created_at > now() - interval '24 hours'
ORDER BY created_at DESC
LIMIT 50;
