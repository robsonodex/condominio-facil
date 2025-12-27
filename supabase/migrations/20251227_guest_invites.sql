-- Migration: Create guest_invites table
-- Created: 2025-12-27

CREATE TABLE IF NOT EXISTS guest_invites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    condo_id UUID NOT NULL REFERENCES condos(id) ON DELETE CASCADE,
    unit_id UUID REFERENCES units(id) ON DELETE SET NULL,
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    guest_name VARCHAR(255) NOT NULL,
    guest_document VARCHAR(20),
    guest_phone VARCHAR(20),
    guest_email VARCHAR(255),
    visit_date DATE NOT NULL,
    visit_time_start TIME,
    visit_time_end TIME,
    purpose VARCHAR(100) DEFAULT 'visita',
    vehicle_plate VARCHAR(10),
    vehicle_model VARCHAR(100),
    notes TEXT,
    qr_code_token UUID DEFAULT gen_random_uuid(),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'used', 'expired', 'cancelled')),
    used_at TIMESTAMP WITH TIME ZONE,
    validated_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_guest_invites_condo ON guest_invites(condo_id);
CREATE INDEX IF NOT EXISTS idx_guest_invites_unit ON guest_invites(unit_id);
CREATE INDEX IF NOT EXISTS idx_guest_invites_created_by ON guest_invites(created_by);
CREATE INDEX IF NOT EXISTS idx_guest_invites_date ON guest_invites(visit_date);
CREATE INDEX IF NOT EXISTS idx_guest_invites_qr_token ON guest_invites(qr_code_token);
CREATE INDEX IF NOT EXISTS idx_guest_invites_status ON guest_invites(status);

-- RLS Policies
ALTER TABLE guest_invites ENABLE ROW LEVEL SECURITY;

-- Moradores podem ver e criar seus próprios convites
CREATE POLICY "Users can view own invites" ON guest_invites
    FOR SELECT USING (auth.uid() = created_by);

CREATE POLICY "Users can create invites" ON guest_invites
    FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update own invites" ON guest_invites
    FOR UPDATE USING (auth.uid() = created_by);

-- Síndicos e porteiros podem ver todos os convites do condomínio
CREATE POLICY "Admins can view all condo invites" ON guest_invites
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.condo_id = guest_invites.condo_id
            AND users.role IN ('sindico', 'porteiro', 'superadmin')
        )
    );

-- Porteiros podem validar convites
CREATE POLICY "Porteiros can update invites" ON guest_invites
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.condo_id = guest_invites.condo_id
            AND users.role IN ('porteiro', 'sindico', 'superadmin')
        )
    );

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_guest_invites_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_guest_invites_updated_at
    BEFORE UPDATE ON guest_invites
    FOR EACH ROW
    EXECUTE FUNCTION update_guest_invites_updated_at();
