-- =====================================================
-- GOVERNANCE 2.0 - UPGRADE MIGRATION
-- =====================================================

-- 1. Upgrade Assembleias Table
ALTER TABLE assembleias 
ADD COLUMN IF NOT EXISTS virtual_link TEXT,
ADD COLUMN IF NOT EXISTS ata_url TEXT,
ADD COLUMN IF NOT EXISTS is_virtual BOOLEAN DEFAULT false;

-- 2. Create Assembleia Pautas (Agenda Items / Shopping List of decisions)
CREATE TABLE IF NOT EXISTS assembleia_pautas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assembleia_id UUID NOT NULL REFERENCES assembleias(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    order_index INT DEFAULT 0,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'voting', 'approved', 'rejected', 'discussion')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create Assembleia Votes
CREATE TABLE IF NOT EXISTS assembleia_votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pauta_id UUID NOT NULL REFERENCES assembleia_pautas(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id),
    unit_id UUID REFERENCES units(id), -- Critical for "One Vote Per Unit" logic
    vote TEXT NOT NULL CHECK (vote IN ('yes', 'no', 'abstain')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(pauta_id, unit_id) -- Prevent multiple votes from same unit
);

-- 4. Upgrade Enquetes for Security & Weights
ALTER TABLE enquetes 
ADD COLUMN IF NOT EXISTS anonymous BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS owners_only BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS one_vote_per_unit BOOLEAN DEFAULT true;

-- 5. Upgrade Enquete Votes to track Unit
ALTER TABLE enquete_votes 
ADD COLUMN IF NOT EXISTS unit_id UUID REFERENCES units(id);

-- Backfill unit_id for existing votes (best effort based on user's current unit)
UPDATE enquete_votes 
SET unit_id = (
    SELECT unit_id FROM residents 
    WHERE user_id = enquete_votes.user_id 
    LIMIT 1
) 
WHERE unit_id IS NULL;

-- Enforce Unique Constraints if one_vote_per_unit is active
-- Note: We can't easily add a conditional unique constraint in standard Postgres without a partial index, 
-- but we will enforce this via RLS/Application Logic.
CREATE UNIQUE INDEX IF NOT EXISTS idx_enquete_votes_unit 
ON enquete_votes(enquete_id, unit_id) 
WHERE unit_id IS NOT NULL;


-- =====================================================
-- RLS POLICIES FOR NEW TABLES
-- =====================================================

-- Pautas
ALTER TABLE assembleia_pautas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view pautas of their condo"
    ON assembleia_pautas FOR SELECT
    USING (assembleia_id IN (
        SELECT id FROM assembleias 
        WHERE condo_id IN (SELECT condo_id FROM users WHERE id = auth.uid())
    ));

CREATE POLICY "Sindicos can manage pautas"
    ON assembleia_pautas FOR ALL
    USING (assembleia_id IN (
        SELECT id FROM assembleias 
        WHERE condo_id IN (SELECT condo_id FROM users WHERE id = auth.uid() AND role IN ('sindico', 'superadmin'))
    ));

-- Assembleia Votes
ALTER TABLE assembleia_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view votes (if public) or own vote"
    ON assembleia_votes FOR SELECT
    USING (
        user_id = auth.uid() OR 
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('sindico', 'superadmin'))
    );

CREATE POLICY "Users can vote if resident/owner"
    ON assembleia_votes FOR INSERT
    WITH CHECK (
        user_id = auth.uid() AND
        -- Ensure user belongs to the condo of the assembly via the pauta
        EXISTS (
            SELECT 1 FROM assembleia_pautas p
            JOIN assembleias a ON a.id = p.assembleia_id
            JOIN condos c ON c.id = a.condo_id
            WHERE p.id = pauta_id
            AND c.id = (SELECT condo_id FROM users WHERE id = auth.uid())
        )
    );
