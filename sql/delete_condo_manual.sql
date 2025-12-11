-- =============================================
-- Script para permitir exclusão de condomínios
-- Execute este script no SQL Editor do Supabase ANTES de tentar excluir
-- =============================================

-- 1. Ver os condomínios e seus IDs
SELECT id, nome, status FROM condos ORDER BY created_at DESC;

-- 2. Para excluir um condomínio específico, execute os comandos abaixo
-- SUBSTITUA 'SEU_CONDO_ID_AQUI' pelo ID do condomínio que você quer excluir

-- Exemplo: SET @condo_id = 'abc123-xyz...';
-- No Supabase, você precisa copiar o ID e usar diretamente nos comandos

-- ========== COPIE O BLOCO ABAIXO E SUBSTITUA O ID ==========

-- Definir o ID do condomínio a excluir (substitua pelo ID real)
DO $$
DECLARE
    condo_to_delete UUID := '00000000-0000-0000-0000-000000000000'; -- SUBSTITUA AQUI
BEGIN
    -- Limpar referências em users
    UPDATE users SET unidade_id = NULL WHERE unidade_id IN (
        SELECT id FROM units WHERE condo_id = condo_to_delete
    );
    UPDATE users SET condo_id = NULL WHERE condo_id = condo_to_delete;
    
    -- Deletar registros relacionados
    DELETE FROM notice_reads WHERE notice_id IN (
        SELECT id FROM notices WHERE condo_id = condo_to_delete
    );
    DELETE FROM notices WHERE condo_id = condo_to_delete;
    DELETE FROM occurrences WHERE condo_id = condo_to_delete;
    DELETE FROM visitors WHERE condo_id = condo_to_delete;
    DELETE FROM financial_entries WHERE condo_id = condo_to_delete;
    DELETE FROM resident_invoices WHERE condo_id = condo_to_delete;
    DELETE FROM payments WHERE condo_id = condo_to_delete;
    DELETE FROM residents WHERE condo_id = condo_to_delete;
    DELETE FROM units WHERE condo_id = condo_to_delete;
    DELETE FROM subscriptions WHERE condo_id = condo_to_delete;
    DELETE FROM condos WHERE id = condo_to_delete;
    
    RAISE NOTICE 'Condomínio excluído com sucesso!';
END $$;
