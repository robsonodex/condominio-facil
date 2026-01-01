-- ============================================
-- SEED DATA: FEATURE FLAGS
-- Execute este script para popular as features do sistema
-- ============================================

INSERT INTO feature_flags (feature_key, feature_name, feature_description, feature_category, is_available, icon, sidebar_label, sidebar_href, sidebar_order)
VALUES
-- 1. Módulo Bancário
('module_banking', 'Módulo Bancário', 'Geração de boletos, retorno CNAB, PIX e integração bancária completa (BB, Itaú, etc).', 'module', true, 'Landmark', 'Cobrança', '/cobranca', 16),

-- 2. Portaria Remota/Digital
('module_portaria', 'Controle de Portaria', 'Gestão de visitantes, encomendas, prestadores de serviço e controle de acesso facial.', 'module', true, 'Shield', 'Portaria', '/portaria', 9),

-- 3. Integração WhatsApp
('module_whatsapp', 'Integração WhatsApp', 'Envio automático de notificações, boletos e comunicados via WhatsApp.', 'integration', true, 'MessageSquare', 'WhatsApp', '/whatsapp', 14),

-- 4. Assistente IA
('module_ai_assistant', 'Assistente IA', 'Assistente virtual inteligente para síndicos e moradores (dúvidas, regimento, etc).', 'addon', true, 'Bot', 'Assistente IA', '/assistente-ia', 15),

-- 5. Chat Interno
('module_chat', 'Chat Interno', 'Canal de comunicação direta e segura entre moradores e administração.', 'module', true, 'MessageCircle', 'Chat', '/chat', 13),

-- 6. Gestão Financeira (Básico)
('module_financeiro', 'Gestão Financeira', 'Contas a pagar, receber, fluxo de caixa e demonstrativos.', 'module', true, 'DollarSign', 'Financeiro', '/financeiro', 2)

ON CONFLICT (feature_key) DO UPDATE SET
    feature_name = EXCLUDED.feature_name,
    feature_description = EXCLUDED.feature_description,
    feature_category = EXCLUDED.feature_category,
    icon = EXCLUDED.icon,
    sidebar_label = EXCLUDED.sidebar_label,
    sidebar_href = EXCLUDED.sidebar_href,
    sidebar_order = EXCLUDED.sidebar_order;

-- Exemplo: Ativar módulo bancário para o primeiro condomínio encontrado (OPCIONAL)
-- DO $$
-- DECLARE
--   v_condo_id UUID;
-- BEGIN
--   SELECT id INTO v_condo_id FROM condos LIMIT 1;
--   IF v_condo_id IS NOT NULL THEN
--     INSERT INTO condo_features (condo_id, feature_key, is_enabled)
--     VALUES (v_condo_id, 'module_banking', true)
--     ON CONFLICT DO NOTHING;
--   END IF;
-- END $$;
