-- =====================================================
-- CRON JOBS - Condomínio Fácil v5.2
-- Executar após habilitar pg_cron no Supabase
-- =====================================================

-- IMPORTANTE: Para habilitar pg_cron no Supabase:
-- 1. Vá em Database > Extensions
-- 2. Habilite a extensão "pg_cron"
-- 3. Execute este script

-- =====================================================
-- 1. LIMPEZA DE DADOS TEMPORÁRIOS
-- =====================================================

-- Limpar snapshots expirados (executar a cada hora)
SELECT cron.schedule(
    'cleanup-expired-snapshots',
    '0 * * * *', -- A cada hora
    $$SELECT cleanup_expired_snapshots()$$
);

-- Limpar streams expirados (executar a cada hora)
SELECT cron.schedule(
    'cleanup-expired-streams',
    '30 * * * *', -- A cada hora, minuto 30
    $$SELECT cleanup_expired_streams()$$
);

-- =====================================================
-- 2. RESET DO MODO DEMO (diário às 04:00)
-- =====================================================

SELECT cron.schedule(
    'reset-demo-data',
    '0 4 * * *', -- Diariamente às 04:00
    $$SELECT reset_demo_data()$$
);

-- =====================================================
-- 3. AUTOMAÇÕES DE INADIMPLÊNCIA
-- =====================================================

-- Função principal de automação de inadimplência
CREATE OR REPLACE FUNCTION run_inadimplencia_automations()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_result JSONB := '{"lembretes": 0, "multas": 0, "cobrancas": 0}'::JSONB;
    v_settings RECORD;
    v_condo RECORD;
    v_lembrete_count INT := 0;
    v_multa_count INT := 0;
    v_cobranca_count INT := 0;
BEGIN
    -- Processar cada condomínio com automação ativa
    FOR v_condo IN 
        SELECT DISTINCT c.id, c.nome
        FROM condos c
        JOIN automation_settings a ON a.condo_id = c.id
        WHERE a.lembrete_ativo = true OR a.multa_automatica = true OR a.cobranca_automatica = true
    LOOP
        -- Buscar configurações do condomínio
        SELECT * INTO v_settings 
        FROM automation_settings 
        WHERE condo_id = v_condo.id;
        
        -- 1. LEMBRETES
        IF v_settings.lembrete_ativo THEN
            -- Marcar cobranças que precisam de lembrete
            UPDATE resident_invoices
            SET metadata = COALESCE(metadata, '{}'::JSONB) || '{"lembrete_enviado": true}'::JSONB
            WHERE condo_id = v_condo.id
              AND status = 'pendente'
              AND data_vencimento < CURRENT_DATE - v_settings.dias_lembrete
              AND (metadata->>'lembrete_enviado' IS NULL OR metadata->>'lembrete_enviado' = 'false');
            
            GET DIAGNOSTICS v_lembrete_count = ROW_COUNT;
            
            -- TODO: Integrar envio real de WhatsApp/Email
        END IF;
        
        -- 2. MULTAS AUTOMÁTICAS
        IF v_settings.multa_automatica THEN
            -- Aplicar multa em cobranças atrasadas
            UPDATE resident_invoices
            SET 
                valor = valor * (1 + v_settings.multa_percentual / 100),
                metadata = COALESCE(metadata, '{}'::JSONB) || 
                    jsonb_build_object(
                        'multa_aplicada', true,
                        'multa_percentual', v_settings.multa_percentual,
                        'data_multa', CURRENT_DATE
                    )
            WHERE condo_id = v_condo.id
              AND status = 'pendente'
              AND data_vencimento < CURRENT_DATE - v_settings.dias_multa
              AND (metadata->>'multa_aplicada' IS NULL OR metadata->>'multa_aplicada' = 'false');
            
            GET DIAGNOSTICS v_multa_count = ROW_COUNT;
        END IF;
        
        -- 3. COBRANÇA AUTOMÁTICA (apenas marcar para geração)
        IF v_settings.cobranca_automatica THEN
            -- Marcar para geração de cobrança via Mercado Pago
            UPDATE resident_invoices
            SET metadata = COALESCE(metadata, '{}'::JSONB) || '{"gerar_mp": true}'::JSONB
            WHERE condo_id = v_condo.id
              AND status = 'pendente'
              AND data_vencimento < CURRENT_DATE - v_settings.dias_cobranca_automatica
              AND (metadata->>'gerar_mp' IS NULL OR metadata->>'gerar_mp' = 'false')
              AND mp_payment_id IS NULL;
            
            GET DIAGNOSTICS v_cobranca_count = ROW_COUNT;
            
            -- TODO: Integrar geração real via API Mercado Pago
        END IF;
    END LOOP;
    
    v_result := jsonb_build_object(
        'lembretes', v_lembrete_count,
        'multas', v_multa_count,
        'cobrancas', v_cobranca_count,
        'executed_at', NOW()
    );
    
    -- Log da execução
    INSERT INTO system_errors (tipo, prioridade, mensagem, resolvido, payload)
    VALUES ('automacao_inadimplencia', 'baixa', 'Automação executada com sucesso', true, v_result);
    
    RETURN v_result;
END;
$$;

-- Agendar automação de inadimplência (diariamente às 08:00)
SELECT cron.schedule(
    'run-inadimplencia-automations',
    '0 8 * * *', -- Diariamente às 08:00
    $$SELECT run_inadimplencia_automations()$$
);

-- =====================================================
-- 4. RELATÓRIO MENSAL DE INADIMPLENTES
-- =====================================================

CREATE OR REPLACE FUNCTION generate_inadimplencia_report()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_settings RECORD;
    v_condo RECORD;
    v_report JSONB;
    v_total_inadimplentes INT := 0;
    v_total_valor DECIMAL := 0;
BEGIN
    FOR v_condo IN 
        SELECT DISTINCT c.id, c.nome
        FROM condos c
        JOIN automation_settings a ON a.condo_id = c.id
        WHERE a.relatorio_automatico = true
    LOOP
        -- Calcular inadimplência do condomínio
        SELECT 
            COUNT(*),
            COALESCE(SUM(valor), 0)
        INTO v_total_inadimplentes, v_total_valor
        FROM resident_invoices
        WHERE condo_id = v_condo.id
          AND status = 'pendente'
          AND data_vencimento < CURRENT_DATE;
        
        v_report := jsonb_build_object(
            'condo_id', v_condo.id,
            'condo_nome', v_condo.nome,
            'total_inadimplentes', v_total_inadimplentes,
            'valor_total', v_total_valor,
            'generated_at', NOW()
        );
        
        -- Salvar notificação para o síndico
        INSERT INTO notifications_sent (
            condo_id, 
            tipo, 
            titulo, 
            mensagem, 
            destinatario_tipo, 
            status
        )
        SELECT 
            v_condo.id,
            'email',
            'Relatório Mensal de Inadimplência',
            format('Condomínio: %s\nTotal de inadimplentes: %s\nValor total: R$ %s', 
                v_condo.nome, v_total_inadimplentes, v_total_valor),
            'sindico',
            'pendente';
        
        -- TODO: Integrar envio real de email
    END LOOP;
    
    RETURN v_report;
END;
$$;

-- Agendar relatório mensal (dia 1 às 09:00)
SELECT cron.schedule(
    'monthly-inadimplencia-report',
    '0 9 1 * *', -- Dia 1 de cada mês às 09:00
    $$SELECT generate_inadimplencia_report()$$
);

-- =====================================================
-- 5. HEALTH CHECK DO SISTEMA
-- =====================================================

CREATE OR REPLACE FUNCTION system_health_check()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_result JSONB;
    v_cameras_offline INT;
    v_gateways_offline INT;
    v_pending_invoices INT;
    v_old_invoices INT;
BEGIN
    -- Verificar câmeras offline
    SELECT COUNT(*) INTO v_cameras_offline
    FROM cameras
    WHERE status != 'ativo' OR last_probe < NOW() - INTERVAL '24 hours';
    
    -- Verificar gateways offline
    SELECT COUNT(*) INTO v_gateways_offline
    FROM camera_gateways
    WHERE last_heartbeat < NOW() - INTERVAL '1 hour';
    
    -- Cobranças pendentes há muito tempo
    SELECT COUNT(*) INTO v_pending_invoices
    FROM resident_invoices
    WHERE status = 'pendente';
    
    SELECT COUNT(*) INTO v_old_invoices
    FROM resident_invoices
    WHERE status = 'pendente' AND data_vencimento < NOW() - INTERVAL '60 days';
    
    v_result := jsonb_build_object(
        'cameras_offline', v_cameras_offline,
        'gateways_offline', v_gateways_offline,
        'pending_invoices', v_pending_invoices,
        'old_invoices_60d', v_old_invoices,
        'checked_at', NOW()
    );
    
    -- Registrar problemas se houver
    IF v_cameras_offline > 0 OR v_gateways_offline > 0 OR v_old_invoices > 10 THEN
        INSERT INTO system_errors (tipo, prioridade, mensagem, resolvido, payload)
        VALUES (
            'health_check', 
            CASE WHEN v_old_invoices > 10 THEN 'alta' ELSE 'media' END,
            format('Health Check: %s câmeras offline, %s gateways offline, %s cobranças antigas', 
                v_cameras_offline, v_gateways_offline, v_old_invoices),
            false,
            v_result
        );
    END IF;
    
    RETURN v_result;
END;
$$;

-- Agendar health check (a cada 6 horas)
SELECT cron.schedule(
    'system-health-check',
    '0 */6 * * *', -- A cada 6 horas
    $$SELECT system_health_check()$$
);

-- =====================================================
-- LISTAR JOBS AGENDADOS
-- =====================================================

-- Para ver os jobs agendados:
-- SELECT * FROM cron.job;

-- Para remover um job:
-- SELECT cron.unschedule('nome-do-job');

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================

GRANT EXECUTE ON FUNCTION run_inadimplencia_automations TO service_role;
GRANT EXECUTE ON FUNCTION generate_inadimplencia_report TO service_role;
GRANT EXECUTE ON FUNCTION system_health_check TO service_role;
