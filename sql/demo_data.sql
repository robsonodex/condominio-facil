-- =====================================================
-- MODO DEMO - Condomínio Fictício para Demonstração
-- Execute este SQL no Supabase para criar ambiente demo
-- =====================================================

-- 1. Criar condomínio demo
INSERT INTO condos (id, nome, endereco, cidade, estado, cep, telefone, email_contato, created_at)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    'Residencial Demo',
    'Rua das Demonstrações, 100',
    'São Paulo',
    'SP',
    '01310-100',
    '(11) 99999-0000',
    'demo@condofacil.com',
    NOW()
) ON CONFLICT (id) DO NOTHING;

-- 2. Criar usuário síndico demo
INSERT INTO users (id, email, nome, telefone, role, condo_id, ativo, created_at)
VALUES (
    '00000000-0000-0000-0000-000000001001',
    'sindico.demo@condofacil.com',
    'João Silva (Demo)',
    '(11) 99999-1001',
    'sindico',
    '00000000-0000-0000-0000-000000000001',
    true,
    NOW()
) ON CONFLICT (id) DO NOTHING;

-- 3. Criar usuário porteiro demo
INSERT INTO users (id, email, nome, telefone, role, condo_id, ativo, created_at)
VALUES (
    '00000000-0000-0000-0000-000000001002',
    'porteiro.demo@condofacil.com',
    'Carlos Santos (Demo)',
    '(11) 99999-1002',
    'porteiro',
    '00000000-0000-0000-0000-000000000001',
    true,
    NOW()
) ON CONFLICT (id) DO NOTHING;

-- 4. Criar 10 unidades demo
INSERT INTO units (id, condo_id, bloco, numero_unidade, tipo_unidade, area_m2, created_at)
VALUES
    ('00000000-0000-0000-0001-000000000001', '00000000-0000-0000-0000-000000000001', 'A', '101', 'apartamento', 65, NOW()),
    ('00000000-0000-0000-0001-000000000002', '00000000-0000-0000-0000-000000000001', 'A', '102', 'apartamento', 65, NOW()),
    ('00000000-0000-0000-0001-000000000003', '00000000-0000-0000-0000-000000000001', 'A', '201', 'apartamento', 75, NOW()),
    ('00000000-0000-0000-0001-000000000004', '00000000-0000-0000-0000-000000000001', 'A', '202', 'apartamento', 75, NOW()),
    ('00000000-0000-0000-0001-000000000005', '00000000-0000-0000-0000-000000000001', 'A', '301', 'apartamento', 85, NOW()),
    ('00000000-0000-0000-0001-000000000006', '00000000-0000-0000-0000-000000000001', 'B', '101', 'apartamento', 65, NOW()),
    ('00000000-0000-0000-0001-000000000007', '00000000-0000-0000-0000-000000000001', 'B', '102', 'apartamento', 65, NOW()),
    ('00000000-0000-0000-0001-000000000008', '00000000-0000-0000-0000-000000000001', 'B', '201', 'apartamento', 75, NOW()),
    ('00000000-0000-0000-0001-000000000009', '00000000-0000-0000-0000-000000000001', 'B', '202', 'apartamento', 75, NOW()),
    ('00000000-0000-0000-0001-000000000010', '00000000-0000-0000-0000-000000000001', 'B', '301', 'apartamento', 85, NOW())
ON CONFLICT (id) DO NOTHING;

-- 5. Criar 12 moradores demo
INSERT INTO users (id, email, nome, telefone, role, condo_id, unidade_id, ativo, created_at)
VALUES
    ('00000000-0000-0000-0000-000000002001', 'morador1.demo@condofacil.com', 'Maria Oliveira', '(11) 99991-0001', 'morador', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0001-000000000001', true, NOW()),
    ('00000000-0000-0000-0000-000000002002', 'morador2.demo@condofacil.com', 'Pedro Costa', '(11) 99991-0002', 'morador', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0001-000000000002', true, NOW()),
    ('00000000-0000-0000-0000-000000002003', 'morador3.demo@condofacil.com', 'Ana Santos', '(11) 99991-0003', 'morador', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0001-000000000003', true, NOW()),
    ('00000000-0000-0000-0000-000000002004', 'morador4.demo@condofacil.com', 'Lucas Ferreira', '(11) 99991-0004', 'morador', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0001-000000000004', true, NOW()),
    ('00000000-0000-0000-0000-000000002005', 'morador5.demo@condofacil.com', 'Julia Lima', '(11) 99991-0005', 'morador', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0001-000000000005', true, NOW()),
    ('00000000-0000-0000-0000-000000002006', 'morador6.demo@condofacil.com', 'Rafael Souza', '(11) 99991-0006', 'morador', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0001-000000000006', true, NOW()),
    ('00000000-0000-0000-0000-000000002007', 'morador7.demo@condofacil.com', 'Camila Alves', '(11) 99991-0007', 'morador', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0001-000000000007', true, NOW()),
    ('00000000-0000-0000-0000-000000002008', 'morador8.demo@condofacil.com', 'Bruno Martins', '(11) 99991-0008', 'morador', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0001-000000000008', true, NOW()),
    ('00000000-0000-0000-0000-000000002009', 'morador9.demo@condofacil.com', 'Fernanda Rocha', '(11) 99991-0009', 'morador', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0001-000000000009', true, NOW()),
    ('00000000-0000-0000-0000-000000002010', 'morador10.demo@condofacil.com', 'Gabriel Dias', '(11) 99991-0010', 'morador', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0001-000000000010', true, NOW()),
    ('00000000-0000-0000-0000-000000002011', 'morador11.demo@condofacil.com', 'Patricia Nunes', '(11) 99991-0011', 'inquilino', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0001-000000000001', true, NOW()),
    ('00000000-0000-0000-0000-000000002012', 'morador12.demo@condofacil.com', 'Roberto Gomes', '(11) 99991-0012', 'inquilino', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0001-000000000002', true, NOW())
ON CONFLICT (id) DO NOTHING;

-- 6. Criar lançamentos financeiros demo (20 lançamentos)
INSERT INTO financial_entries (id, condo_id, tipo, categoria, descricao, valor, data, status, created_at)
VALUES
    (gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 'receita', 'condominio', 'Taxa condominial - Janeiro', 15000, '2024-01-15', 'pago', NOW()),
    (gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 'despesa', 'manutencao', 'Manutenção elevador', 2500, '2024-01-20', 'pago', NOW()),
    (gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 'receita', 'condominio', 'Taxa condominial - Fevereiro', 15000, '2024-02-15', 'pago', NOW()),
    (gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 'despesa', 'limpeza', 'Serviço de limpeza', 3000, '2024-02-10', 'pago', NOW()),
    (gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 'despesa', 'funcionarios', 'Folha de pagamento', 8000, '2024-02-28', 'pago', NOW()),
    (gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 'receita', 'condominio', 'Taxa condominial - Março', 15000, '2024-03-15', 'pago', NOW()),
    (gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 'despesa', 'manutencao', 'Pintura fachada', 12000, '2024-03-20', 'pago', NOW()),
    (gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 'receita', 'multa', 'Multa atraso - Unidade 101', 150, '2024-03-25', 'pago', NOW()),
    (gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 'receita', 'condominio', 'Taxa condominial - Abril', 15000, '2024-04-15', 'pago', NOW()),
    (gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 'despesa', 'seguranca', 'Sistema de câmeras', 5000, '2024-04-10', 'pago', NOW()),
    (gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 'receita', 'condominio', 'Taxa condominial - Maio', 15000, '2024-05-15', 'pago', NOW()),
    (gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 'despesa', 'manutencao', 'Dedetização', 800, '2024-05-20', 'pago', NOW()),
    (gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 'receita', 'condominio', 'Taxa condominial - Junho', 15000, '2024-06-15', 'pago', NOW()),
    (gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 'despesa', 'funcionarios', 'Folha de pagamento', 8000, '2024-06-28', 'pago', NOW()),
    (gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 'receita', 'condominio', 'Taxa condominial - Novembro', 15000, '2024-11-15', 'em_aberto', NOW()),
    (gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 'despesa', 'manutencao', 'Reparo portão', 1200, '2024-11-10', 'previsto', NOW()),
    (gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 'receita', 'condominio', 'Taxa condominial - Dezembro', 15000, '2024-12-15', 'em_aberto', NOW()),
    (gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 'despesa', 'administrativo', 'Taxas bancárias', 150, '2024-12-05', 'pago', NOW()),
    (gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 'receita', 'reserva', 'Reserva Salão - Festa', 200, '2024-12-01', 'pago', NOW()),
    (gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 'despesa', 'outros', 'Material de escritório', 300, '2024-12-08', 'pago', NOW())
ON CONFLICT DO NOTHING;

-- 7. Criar avisos demo
INSERT INTO notices (id, condo_id, titulo, descricao, prioridade, created_at, created_by)
VALUES
    (gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 'Manutenção programada', 'A manutenção do elevador será realizada no dia 15/12.', 'alta', NOW(), '00000000-0000-0000-0000-000000001001'),
    (gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 'Assembleia Geral', 'Convocamos todos os moradores para assembleia no dia 20/12.', 'media', NOW(), '00000000-0000-0000-0000-000000001001'),
    (gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 'Boas Festas!', 'A administração deseja a todos um Feliz Natal e Próspero Ano Novo!', 'baixa', NOW(), '00000000-0000-0000-0000-000000001001')
ON CONFLICT DO NOTHING;

-- 8. Criar ocorrências demo
INSERT INTO occurrences (id, condo_id, tipo, descricao, status, prioridade, created_at, usuario_id)
VALUES
    (gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 'barulho', 'Barulho excessivo após 22h no bloco A', 'aberta', 'alta', NOW(), '00000000-0000-0000-0000-000000002001'),
    (gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 'manutencao', 'Lâmpada queimada no corredor B', 'em_andamento', 'media', NOW(), '00000000-0000-0000-0000-000000002003'),
    (gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 'seguranca', 'Portão da garagem não fecha corretamente', 'resolvida', 'alta', NOW() - INTERVAL '5 days', '00000000-0000-0000-0000-000000002005')
ON CONFLICT DO NOTHING;

-- 9. Criar áreas comuns demo
INSERT INTO common_areas (id, condo_id, nome, descricao, capacidade, requer_aprovacao, valor_reserva, horario_inicio, horario_fim, created_at)
VALUES
    ('00000000-0000-0000-0002-000000000001', '00000000-0000-0000-0000-000000000001', 'Salão de Festas', 'Salão com cozinha e banheiro', 50, true, 200.00, '08:00', '23:00', NOW()),
    ('00000000-0000-0000-0002-000000000002', '00000000-0000-0000-0000-000000000001', 'Churrasqueira', 'Área com churrasqueira e mesas', 20, true, 100.00, '10:00', '22:00', NOW()),
    ('00000000-0000-0000-0002-000000000003', '00000000-0000-0000-0000-000000000001', 'Quadra Esportiva', 'Quadra poliesportiva', 10, false, 0.00, '06:00', '22:00', NOW())
ON CONFLICT (id) DO NOTHING;

-- 10. Criar reservas demo
INSERT INTO reservations (id, area_id, usuario_id, condo_id, data_reserva, hora_inicio, hora_fim, status, observacoes, created_at)
VALUES
    (gen_random_uuid(), '00000000-0000-0000-0002-000000000001', '00000000-0000-0000-0000-000000002001', '00000000-0000-0000-0000-000000000001', CURRENT_DATE + 7, '14:00', '22:00', 'aprovada', 'Festa de aniversário', NOW()),
    (gen_random_uuid(), '00000000-0000-0000-0002-000000000002', '00000000-0000-0000-0000-000000002003', '00000000-0000-0000-0000-000000000001', CURRENT_DATE + 14, '12:00', '18:00', 'pendente', 'Churrasco família', NOW()),
    (gen_random_uuid(), '00000000-0000-0000-0002-000000000003', '00000000-0000-0000-0000-000000002005', '00000000-0000-0000-0000-000000000001', CURRENT_DATE + 3, '18:00', '20:00', 'aprovada', 'Futebol', NOW())
ON CONFLICT DO NOTHING;

-- 11. Criar visitantes demo
INSERT INTO visitors (id, condo_id, nome, documento, tipo, placa_veiculo, bloco, numero_unidade, data_hora_entrada, registrado_por, created_at)
VALUES
    (gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 'José da Silva', '123.456.789-00', 'visitante', 'ABC-1234', 'A', '101', NOW() - INTERVAL '2 hours', '00000000-0000-0000-0000-000000001002', NOW()),
    (gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 'Entrega Rápida LTDA', '12.345.678/0001-00', 'entrega', 'XYZ-5678', 'B', '201', NOW() - INTERVAL '30 minutes', '00000000-0000-0000-0000-000000001002', NOW()),
    (gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 'Eletricista João', '987.654.321-00', 'prestador', NULL, 'A', '301', NOW() - INTERVAL '1 hour', '00000000-0000-0000-0000-000000001002', NOW())
ON CONFLICT DO NOTHING;

-- 12. Criar assinatura demo (ativa)
INSERT INTO subscriptions (id, condo_id, plan_id, status, data_inicio, data_fim, created_at)
SELECT 
    gen_random_uuid(),
    '00000000-0000-0000-0000-000000000001',
    id,
    'ativo',
    NOW(),
    NOW() + INTERVAL '1 year',
    NOW()
FROM plans WHERE nome_plano = 'Enterprise' LIMIT 1
ON CONFLICT DO NOTHING;

-- =====================================================
-- FUNÇÃO PARA RESETAR DEMO DIARIAMENTE
-- =====================================================
CREATE OR REPLACE FUNCTION reset_demo_data()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    demo_condo_id UUID := '00000000-0000-0000-0000-000000000001';
BEGIN
    -- Limpar dados variáveis do demo
    DELETE FROM visitors WHERE condo_id = demo_condo_id AND created_at < NOW() - INTERVAL '1 day';
    DELETE FROM occurrences WHERE condo_id = demo_condo_id AND created_at < NOW() - INTERVAL '7 days';
    DELETE FROM reservations WHERE condo_id = demo_condo_id AND data_reserva < CURRENT_DATE;
    
    -- Log do reset
    RAISE NOTICE 'Demo data reset at %', NOW();
END;
$$;

-- Conceder permissão
GRANT EXECUTE ON FUNCTION reset_demo_data() TO service_role;
