-- Migration: Add occurrence comments for chat functionality
-- Date: 2025-12-23

-- 1. Create the table
CREATE TABLE IF NOT EXISTS occurrence_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    occurrence_id UUID NOT NULL REFERENCES occurrences(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Performance indexes
CREATE INDEX IF NOT EXISTS idx_occurrence_comments_occurrence ON occurrence_comments(occurrence_id);
CREATE INDEX IF NOT EXISTS idx_occurrence_comments_user ON occurrence_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_occurrence_comments_created ON occurrence_comments(created_at);

-- 3. Enable RLS
ALTER TABLE occurrence_comments ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies
DROP POLICY IF EXISTS "Users can see comments of accessible occurrences" ON occurrence_comments;
CREATE POLICY "Users can see comments of accessible occurrences" ON occurrence_comments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM occurrences o
            WHERE o.id = occurrence_comments.occurrence_id
            AND (
                user_has_role(ARRAY['superadmin', 'sindico', 'porteiro'])
                OR o.criado_por_user_id = auth.uid()
                OR o.unidade_id = user_unidade_id()
            )
        )
    );

DROP POLICY IF EXISTS "Users can create comments in accessible occurrences" ON occurrence_comments;
CREATE POLICY "Users can create comments in accessible occurrences" ON occurrence_comments
    FOR INSERT WITH CHECK (
        auth.uid() = user_id
        AND EXISTS (
            SELECT 1 FROM occurrences o
            WHERE o.id = occurrence_comments.occurrence_id
            AND (
                user_has_role(ARRAY['superadmin', 'sindico', 'porteiro'])
                OR o.criado_por_user_id = auth.uid()
                OR o.unidade_id = user_unidade_id()
            )
        )
    );

DROP POLICY IF EXISTS "Users can delete their own comments" ON occurrence_comments;
CREATE POLICY "Users can delete their own comments" ON occurrence_comments
    FOR DELETE USING (
        auth.uid() = user_id
        OR user_has_role(ARRAY['superadmin', 'sindico'])
    );

-- 5. Realtime
-- Check if table is already in publication to avoid errors
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND schemaname = 'public' 
        AND tablename = 'occurrence_comments'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE occurrence_comments;
    END IF;
END $$;

-- 6. Trigger for updated_at
CREATE OR REPLACE FUNCTION update_occurrence_comments_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_occurrence_comments_timestamp ON occurrence_comments;
CREATE TRIGGER update_occurrence_comments_timestamp
    BEFORE UPDATE ON occurrence_comments
    FOR EACH ROW
    EXECUTE FUNCTION update_occurrence_comments_timestamp();
