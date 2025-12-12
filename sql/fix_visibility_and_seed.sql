-- =====================================================
-- FIX & SEED SCRIPT (Run this to fix visibility and see data)
-- =====================================================

-- 1. Ensure Enquetes Table has RLS Policies
ALTER TABLE enquetes ENABLE ROW LEVEL SECURITY;

-- Allow everyone to see enquetes (filtered by condo_id usually, but simple policy first)
DROP POLICY IF EXISTS "Enquetes visible to all" ON enquetes;
CREATE POLICY "Enquetes visible to all" ON enquetes FOR SELECT TO authenticated USING (true);

-- Allow Sindicos/Superadmin to full manage
DROP POLICY IF EXISTS "Sindicos manage enquetes" ON enquetes;
CREATE POLICY "Sindicos manage enquetes" ON enquetes FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('sindico', 'superadmin'))
);

-- 2. SEED DATA: Create a Sample Enquete (Poll)
-- We insert into a transaction to link questions/options
DO $$
DECLARE
    v_condo_id UUID;
    v_user_id UUID;
    v_enquete_id UUID;
    v_q_choice_id UUID;
    v_q_text_id UUID;
BEGIN
    -- Get first condo and sindico (just to have valid FKs)
    SELECT id INTO v_condo_id FROM condos LIMIT 1;
    SELECT id INTO v_user_id FROM users WHERE role = 'sindico' LIMIT 1;
    
    -- Fallback if no sindico found, usually authenticated user
    IF v_user_id IS NULL THEN
        SELECT auth.uid() INTO v_user_id;
    END IF;

    IF v_condo_id IS NOT NULL THEN
        -- Insert Enquete
        INSERT INTO enquetes (condo_id, title, description, start_at, end_at, created_by, one_vote_per_unit)
        VALUES (
            v_condo_id,
            'Pesquisa: Reforma do Salão de Festas 2025',
            'Queremos saber a opinião de todos sobre as novas cores e móveis.',
            NOW(),
            NOW() + INTERVAL '7 days',
            v_user_id,
            true
        )
        RETURNING id INTO v_enquete_id;

        -- Insert Question 1: Multiple Choice
        INSERT INTO enquete_questions (enquete_id, text, type, order_index)
        VALUES (v_enquete_id, 'Qual estilo de decoração você prefere?', 'single_choice', 0)
        RETURNING id INTO v_q_choice_id;

        -- Options for Q1
        INSERT INTO enquete_options (question_id, label, order_index) VALUES 
        (v_q_choice_id, 'Moderno (Cinza e Branco)', 0),
        (v_q_choice_id, 'Clássico (Madeira e Bege)', 1),
        (v_q_choice_id, 'Industrial (Preto e Metal)', 2);

        -- Insert Question 2: Text
        INSERT INTO enquete_questions (enquete_id, text, type, order_index)
        VALUES (v_enquete_id, 'Tem alguma outra sugestão para o espaço?', 'text', 1)
        RETURNING id INTO v_q_text_id;
        
    END IF;
END $$;
