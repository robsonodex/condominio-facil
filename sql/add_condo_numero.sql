-- =====================================================
-- ADICIONAR COLUNA CONDO_ID_NUMERO PARA CONDOMÍNIOS
-- Execute este script no Supabase SQL Editor
-- =====================================================

-- 1. Adicionar coluna condo_numero na tabela condos
ALTER TABLE condos ADD COLUMN IF NOT EXISTS condo_numero INTEGER;

-- 2. Atualizar condomínios existentes com IDs sequenciais
DO $$
DECLARE
    r RECORD;
    counter INTEGER := 1;
BEGIN
    FOR r IN (SELECT id FROM condos ORDER BY created_at)
    LOOP
        UPDATE condos SET condo_numero = counter WHERE id = r.id;
        counter := counter + 1;
    END LOOP;
END $$;

-- Verificar resultado
SELECT id, nome, condo_numero, status, created_at FROM condos ORDER BY condo_numero;
