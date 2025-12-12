-- =====================================================
-- GOVERNANCE 2.1 - POLLS UPGRADE (uCondo Benchmark)
-- =====================================================

-- 1. Create Questions Table (Supports Multiple Questions per Enquete)
CREATE TABLE IF NOT EXISTS enquete_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    enquete_id UUID NOT NULL REFERENCES enquetes(id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('single_choice', 'multiple_choice', 'text')),
    order_index INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create Options Table (For Choice Questions)
CREATE TABLE IF NOT EXISTS enquete_options (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id UUID NOT NULL REFERENCES enquete_questions(id) ON DELETE CASCADE,
    label TEXT NOT NULL,
    order_index INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create Answers Table (Stores Votes & Text Responses)
CREATE TABLE IF NOT EXISTS enquete_answers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id UUID NOT NULL REFERENCES enquete_questions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id),
    unit_id UUID REFERENCES units(id), -- Critical for "One Vote Per Unit" check
    
    -- For Choice Questions
    option_id UUID REFERENCES enquete_options(id),
    
    -- For Text Questions
    text_response TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraint: A unit can only answer a question once
    -- (Unless we want to allow re-voting, but 'one vote per unit' usually implies unique)
    UNIQUE(question_id, unit_id)
);

-- 4. RLS Policies

-- Questions
ALTER TABLE enquete_questions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public view questions" ON enquete_questions;
CREATE POLICY "Public view questions" ON enquete_questions FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Sindico manage questions" ON enquete_questions;
CREATE POLICY "Sindico manage questions" ON enquete_questions FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM enquetes e JOIN users u ON u.condo_id = e.condo_id WHERE e.id = enquete_questions.enquete_id AND u.id = auth.uid() AND u.role IN ('sindico', 'superadmin'))
);

-- Options
ALTER TABLE enquete_options ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public view options" ON enquete_options;
CREATE POLICY "Public view options" ON enquete_options FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Sindico manage options" ON enquete_options;
CREATE POLICY "Sindico manage options" ON enquete_options FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM enquete_questions q JOIN enquetes e ON e.id = q.enquete_id JOIN users u ON u.condo_id = e.condo_id WHERE q.id = enquete_options.question_id AND u.id = auth.uid() AND u.role IN ('sindico', 'superadmin'))
);

-- Answers
ALTER TABLE enquete_answers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public view answers" ON enquete_answers;
CREATE POLICY "Public view answers" ON enquete_answers FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Users insert answers" ON enquete_answers;
CREATE POLICY "Users insert answers" ON enquete_answers FOR INSERT TO authenticated WITH CHECK (
    user_id = auth.uid()    
);

-- Indexing for Performance
CREATE INDEX IF NOT EXISTS idx_questions_enquete ON enquete_questions(enquete_id);
CREATE INDEX IF NOT EXISTS idx_options_question ON enquete_options(question_id);
CREATE INDEX IF NOT EXISTS idx_answers_question ON enquete_answers(question_id);
CREATE INDEX IF NOT EXISTS idx_answers_unit ON enquete_answers(unit_id);
