-- =====================================================
-- ADICIONAR COLUNA CLIENTE_ID PARA SÍNDICOS
-- Execute este script no Supabase SQL Editor
-- =====================================================

-- 1. Adicionar coluna cliente_id na tabela users
ALTER TABLE users ADD COLUMN IF NOT EXISTS cliente_id SERIAL;

-- 2. Criar índice único para cliente_id apenas para síndicos
-- (evita duplicatas mas permite NULL para outros tipos de usuário)

-- 3. Atualizar síndicos existentes com IDs sequenciais
-- Os IDs serão atribuídos automaticamente pelo SERIAL

-- 4. Criar função para gerar próximo cliente_id
CREATE OR REPLACE FUNCTION get_next_cliente_id()
RETURNS INTEGER AS $$
DECLARE
    next_id INTEGER;
BEGIN
    SELECT COALESCE(MAX(cliente_id), 0) + 1 INTO next_id FROM users WHERE role = 'sindico';
    RETURN next_id;
END;
$$ LANGUAGE plpgsql;

-- 5. Atualizar síndicos existentes que não têm cliente_id
DO $$
DECLARE
    r RECORD;
    counter INTEGER := 1;
BEGIN
    FOR r IN (SELECT id FROM users WHERE role = 'sindico' AND cliente_id IS NULL ORDER BY created_at)
    LOOP
        UPDATE users SET cliente_id = counter WHERE id = r.id;
        counter := counter + 1;
    END LOOP;
END $$;

-- Verificar resultado
SELECT id, nome, email, role, cliente_id FROM users WHERE role = 'sindico' ORDER BY cliente_id;
