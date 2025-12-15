-- Script para deletar o usuário demo: Ricardo Mendes Figueiredo (demo@condofacil.com)
-- ID: e4b89c3d-34d7-4396-9002-6da8fba8b84e

-- Execute este script no Supabase SQL Editor

DO $$
DECLARE
    target_user_id UUID := 'e4b89c3d-34d7-4396-9002-6da8fba8b84e';
BEGIN
    -- 1. Deletar todos os registros relacionados ao usuário
    DELETE FROM residents WHERE user_id = target_user_id;
    DELETE FROM reservations WHERE user_id = target_user_id;
    DELETE FROM enquete_votes WHERE user_id = target_user_id;
    DELETE FROM notifications_sent WHERE sender_id = target_user_id;
    DELETE FROM assembly_presence WHERE user_id = target_user_id;
    DELETE FROM system_logs WHERE user_id = target_user_id;
    DELETE FROM impersonations WHERE impersonator_id = target_user_id OR target_user_id = target_user_id;
    DELETE FROM resident_invoices WHERE morador_id = target_user_id;
    
    -- 2. Limpar referências (set to NULL)
    UPDATE reservations SET aprovado_por = NULL WHERE aprovado_por = target_user_id;
    UPDATE documents SET uploaded_by = NULL WHERE uploaded_by = target_user_id;
    UPDATE maintenance_orders SET created_by = NULL WHERE created_by = target_user_id;
    UPDATE resident_invoices SET created_by = NULL WHERE created_by = target_user_id;
    UPDATE occurrences SET resolvido_por = NULL WHERE resolvido_por = target_user_id;
    
    -- 3. Assembleias - tentar update primeiro, se não funcionar, deletar
    UPDATE assembleias SET created_by = NULL WHERE created_by = target_user_id;
    
    -- Se update não funcionar, deletar as assembleias
    DELETE FROM assembleias WHERE created_by = target_user_id;
    
    -- 4. Deletar o perfil do usuário
    DELETE FROM users WHERE id = target_user_id;
    
    -- 5. Tentar deletar do auth (pode falhar se já foi deletado)
    -- DELETE FROM auth.users WHERE id = target_user_id;
    
    RAISE NOTICE 'Usuário % deletado com sucesso!', target_user_id;
END $$;

-- Verificar se foi deletado
SELECT * FROM users WHERE email = 'demo@condofacil.com';
