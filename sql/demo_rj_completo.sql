-- =====================================================
-- MODO DEMO COMPLETO - Residencial Jardim Atlântico
-- Condomínio Fictício no Rio de Janeiro para Demonstração
-- Execute este SQL no Supabase para criar ambiente demo realista
-- =====================================================

-- IDENTIDADE DO CONDOMÍNIO
-- Nome: Residencial Jardim Atlântico
-- Endereço: Rua Barão da Torre, 450 - Ipanema
-- Rio de Janeiro - RJ, CEP: 22411-002
-- Perfil: Condomínio residencial médio/grande
-- 4 Blocos (A, B, C, D) com 48 unidades
-- Portaria 24h

-- =====================================================
-- 1. CONDOMÍNIO DEMO
-- =====================================================
INSERT INTO condos (id, nome, cnpj, endereco, cidade, estado, cep, telefone, email_contato, status, created_at)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    'Residencial Jardim Atlântico',
    '12.345.678/0001-90',
    'Rua Barão da Torre, 450 - Ipanema',
    'Rio de Janeiro',
    'RJ',
    '22411-002',
    '(21) 3874-5500',
    'sindico@jardimatlântico.com.br',
    'ativo',
    NOW() - INTERVAL '8 months'
) ON CONFLICT (id) DO UPDATE SET
    nome = EXCLUDED.nome,
    endereco = EXCLUDED.endereco,
    cidade = EXCLUDED.cidade,
    estado = EXCLUDED.estado;

-- =====================================================
-- 2. UNIDADES - 4 Blocos, 12 apartamentos cada (48 total)
-- =====================================================
INSERT INTO units (id, condo_id, bloco, numero_unidade, metragem, vaga, created_at) VALUES
-- Bloco A (apartamentos de frente, maiores)
('00000000-0000-0000-0001-000000000101', '00000000-0000-0000-0000-000000000001', 'A', '101', 85, 'A-01', NOW()),
('00000000-0000-0000-0001-000000000102', '00000000-0000-0000-0000-000000000001', 'A', '102', 72, 'A-02', NOW()),
('00000000-0000-0000-0001-000000000201', '00000000-0000-0000-0000-000000000001', 'A', '201', 85, 'A-03', NOW()),
('00000000-0000-0000-0001-000000000202', '00000000-0000-0000-0000-000000000001', 'A', '202', 72, 'A-04', NOW()),
('00000000-0000-0000-0001-000000000301', '00000000-0000-0000-0000-000000000001', 'A', '301', 85, 'A-05', NOW()),
('00000000-0000-0000-0001-000000000302', '00000000-0000-0000-0000-000000000001', 'A', '302', 72, 'A-06', NOW()),
('00000000-0000-0000-0001-000000000401', '00000000-0000-0000-0000-000000000001', 'A', '401', 85, 'A-07', NOW()),
('00000000-0000-0000-0001-000000000402', '00000000-0000-0000-0000-000000000001', 'A', '402', 72, 'A-08', NOW()),
('00000000-0000-0000-0001-000000000501', '00000000-0000-0000-0000-000000000001', 'A', '501', 110, 'A-09/10', NOW()),
('00000000-0000-0000-0001-000000000502', '00000000-0000-0000-0000-000000000001', 'A', '502', 72, 'A-11', NOW()),
('00000000-0000-0000-0001-000000000601', '00000000-0000-0000-0000-000000000001', 'A', '601', 150, 'A-12/13', NOW()),
('00000000-0000-0000-0001-000000000602', '00000000-0000-0000-0000-000000000001', 'A', '602', 72, NULL, NOW()),
-- Bloco B
('00000000-0000-0000-0001-000000000103', '00000000-0000-0000-0000-000000000001', 'B', '101', 68, 'B-01', NOW()),
('00000000-0000-0000-0001-000000000104', '00000000-0000-0000-0000-000000000001', 'B', '102', 68, 'B-02', NOW()),
('00000000-0000-0000-0001-000000000203', '00000000-0000-0000-0000-000000000001', 'B', '201', 68, 'B-03', NOW()),
('00000000-0000-0000-0001-000000000204', '00000000-0000-0000-0000-000000000001', 'B', '202', 68, 'B-04', NOW()),
('00000000-0000-0000-0001-000000000303', '00000000-0000-0000-0000-000000000001', 'B', '301', 68, 'B-05', NOW()),
('00000000-0000-0000-0001-000000000304', '00000000-0000-0000-0000-000000000001', 'B', '302', 68, 'B-06', NOW()),
('00000000-0000-0000-0001-000000000403', '00000000-0000-0000-0000-000000000001', 'B', '401', 68, 'B-07', NOW()),
('00000000-0000-0000-0001-000000000404', '00000000-0000-0000-0000-000000000001', 'B', '402', 68, 'B-08', NOW()),
('00000000-0000-0000-0001-000000000503', '00000000-0000-0000-0000-000000000001', 'B', '501', 68, 'B-09', NOW()),
('00000000-0000-0000-0001-000000000504', '00000000-0000-0000-0000-000000000001', 'B', '502', 68, 'B-10', NOW()),
('00000000-0000-0000-0001-000000000603', '00000000-0000-0000-0000-000000000001', 'B', '601', 95, 'B-11/12', NOW()),
('00000000-0000-0000-0001-000000000604', '00000000-0000-0000-0000-000000000001', 'B', '602', 68, NULL, NOW()),
-- Bloco C
('00000000-0000-0000-0001-000000000105', '00000000-0000-0000-0000-000000000001', 'C', '101', 65, 'C-01', NOW()),
('00000000-0000-0000-0001-000000000106', '00000000-0000-0000-0000-000000000001', 'C', '102', 65, 'C-02', NOW()),
('00000000-0000-0000-0001-000000000205', '00000000-0000-0000-0000-000000000001', 'C', '201', 65, 'C-03', NOW()),
('00000000-0000-0000-0001-000000000206', '00000000-0000-0000-0000-000000000001', 'C', '202', 65, 'C-04', NOW()),
('00000000-0000-0000-0001-000000000305', '00000000-0000-0000-0000-000000000001', 'C', '301', 65, 'C-05', NOW()),
('00000000-0000-0000-0001-000000000306', '00000000-0000-0000-0000-000000000001', 'C', '302', 65, 'C-06', NOW()),
('00000000-0000-0000-0001-000000000405', '00000000-0000-0000-0000-000000000001', 'C', '401', 65, 'C-07', NOW()),
('00000000-0000-0000-0001-000000000406', '00000000-0000-0000-0000-000000000001', 'C', '402', 65, 'C-08', NOW()),
('00000000-0000-0000-0001-000000000505', '00000000-0000-0000-0000-000000000001', 'C', '501', 65, 'C-09', NOW()),
('00000000-0000-0000-0001-000000000506', '00000000-0000-0000-0000-000000000001', 'C', '502', 65, 'C-10', NOW()),
('00000000-0000-0000-0001-000000000605', '00000000-0000-0000-0000-000000000001', 'C', '601', 90, 'C-11/12', NOW()),
('00000000-0000-0000-0001-000000000606', '00000000-0000-0000-0000-000000000001', 'C', '602', 65, NULL, NOW()),
-- Bloco D
('00000000-0000-0000-0001-000000000107', '00000000-0000-0000-0000-000000000001', 'D', '101', 60, 'D-01', NOW()),
('00000000-0000-0000-0001-000000000108', '00000000-0000-0000-0000-000000000001', 'D', '102', 60, 'D-02', NOW()),
('00000000-0000-0000-0001-000000000207', '00000000-0000-0000-0000-000000000001', 'D', '201', 60, 'D-03', NOW()),
('00000000-0000-0000-0001-000000000208', '00000000-0000-0000-0000-000000000001', 'D', '202', 60, 'D-04', NOW()),
('00000000-0000-0000-0001-000000000307', '00000000-0000-0000-0000-000000000001', 'D', '301', 60, 'D-05', NOW()),
('00000000-0000-0000-0001-000000000308', '00000000-0000-0000-0000-000000000001', 'D', '302', 60, 'D-06', NOW()),
('00000000-0000-0000-0001-000000000407', '00000000-0000-0000-0000-000000000001', 'D', '401', 60, 'D-07', NOW()),
('00000000-0000-0000-0001-000000000408', '00000000-0000-0000-0000-000000000001', 'D', '402', 60, 'D-08', NOW()),
('00000000-0000-0000-0001-000000000507', '00000000-0000-0000-0000-000000000001', 'D', '501', 60, 'D-09', NOW()),
('00000000-0000-0000-0001-000000000508', '00000000-0000-0000-0000-000000000001', 'D', '502', 60, 'D-10', NOW()),
('00000000-0000-0000-0001-000000000607', '00000000-0000-0000-0000-000000000001', 'D', '601', 85, 'D-11/12', NOW()),
('00000000-0000-0000-0001-000000000608', '00000000-0000-0000-0000-000000000001', 'D', '602', 60, NULL, NOW())
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- 3. USUÁRIOS - Síndico, Subsíndico, Porteiros e Moradores
-- =====================================================

-- Síndico
INSERT INTO users (id, email, nome, telefone, role, condo_id, ativo, created_at) VALUES
('00000000-0000-0000-0000-000000001001', 'sindico.demo@jardimatlântico.com.br', 'Ricardo Mendes Figueiredo', '(21) 99876-5432', 'sindico', '00000000-0000-0000-0000-000000000001', true, NOW() - INTERVAL '8 months')
ON CONFLICT (id) DO NOTHING;

-- Subsíndico (também morador do A-501)
INSERT INTO users (id, email, nome, telefone, role, condo_id, unidade_id, ativo, created_at) VALUES
('00000000-0000-0000-0000-000000001002', 'subsindico.demo@jardimatlântico.com.br', 'Adriana Costa Ribeiro', '(21) 99765-4321', 'morador', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0001-000000000501', true, NOW() - INTERVAL '8 months')
ON CONFLICT (id) DO NOTHING;

-- Porteiros (3 turnos - manhã, tarde, noite)
INSERT INTO users (id, email, nome, telefone, role, condo_id, ativo, created_at) VALUES
('00000000-0000-0000-0000-000000001010', 'porteiro1.demo@jardimatlântico.com.br', 'Jorge Luiz da Silva', '(21) 98765-1001', 'porteiro', '00000000-0000-0000-0000-000000000001', true, NOW() - INTERVAL '6 months'),
('00000000-0000-0000-0000-000000001011', 'porteiro2.demo@jardimatlântico.com.br', 'Carlos Eduardo Santos', '(21) 98765-1002', 'porteiro', '00000000-0000-0000-0000-000000000001', true, NOW() - INTERVAL '4 months'),
('00000000-0000-0000-0000-000000001012', 'porteiro3.demo@jardimatlântico.com.br', 'Marcos Antônio Souza', '(21) 98765-1003', 'porteiro', '00000000-0000-0000-0000-000000000001', true, NOW() - INTERVAL '2 months'),
('00000000-0000-0000-0000-000000001013', 'folguista.demo@jardimatlântico.com.br', 'Wellington Ferreira Lima', '(21) 98765-1004', 'porteiro', '00000000-0000-0000-0000-000000000001', true, NOW() - INTERVAL '1 month')
ON CONFLICT (id) DO NOTHING;

-- Moradores variados (famílias, solteiros, idosos, alguns inadimplentes)
INSERT INTO users (id, email, nome, telefone, role, condo_id, unidade_id, ativo, created_at) VALUES
-- Bloco A
('00000000-0000-0000-0000-000000002001', 'mariahelena@email.com', 'Maria Helena Rodrigues', '(21) 99111-2001', 'morador', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0001-000000000101', true, NOW() - INTERVAL '7 months'),
('00000000-0000-0000-0000-000000002002', 'fernandoalves@email.com', 'Fernando Alves Pereira', '(21) 99111-2002', 'morador', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0001-000000000102', true, NOW() - INTERVAL '6 months'),
('00000000-0000-0000-0000-000000002003', 'patricialima@email.com', 'Patrícia Lima Santos', '(21) 99111-2003', 'morador', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0001-000000000201', true, NOW() - INTERVAL '5 months'),
('00000000-0000-0000-0000-000000002004', 'robertocarlos@email.com', 'Roberto Carlos Nascimento', '(21) 99111-2004', 'morador', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0001-000000000202', true, NOW() - INTERVAL '8 months'),
('00000000-0000-0000-0000-000000002005', 'anaclaudia@email.com', 'Ana Cláudia Ferreira', '(21) 99111-2005', 'morador', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0001-000000000301', true, NOW() - INTERVAL '4 months'),
('00000000-0000-0000-0000-000000002006', 'marcosvieira@email.com', 'Marcos Vieira de Oliveira', '(21) 99111-2006', 'morador', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0001-000000000302', true, NOW() - INTERVAL '3 months'),
('00000000-0000-0000-0000-000000002007', 'claudiamachado@email.com', 'Cláudia Machado Torres', '(21) 99111-2007', 'morador', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0001-000000000401', true, NOW() - INTERVAL '6 months'),
('00000000-0000-0000-0000-000000002008', 'andersonbrito@email.com', 'Anderson Brito Costa', '(21) 99111-2008', 'morador', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0001-000000000402', true, NOW() - INTERVAL '2 months'),
('00000000-0000-0000-0000-000000002009', 'reginafernandes@email.com', 'Regina Fernandes Lopes', '(21) 99111-2009', 'morador', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0001-000000000502', true, NOW() - INTERVAL '7 months'),
('00000000-0000-0000-0000-000000002010', 'eduardogomes@email.com', 'Eduardo Gomes Martins', '(21) 99111-2010', 'morador', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0001-000000000601', true, NOW() - INTERVAL '8 months'),
-- Bloco B
('00000000-0000-0000-0000-000000002011', 'julianasouza@email.com', 'Juliana Souza Carvalho', '(21) 99111-2011', 'morador', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0001-000000000103', true, NOW() - INTERVAL '5 months'),
('00000000-0000-0000-0000-000000002012', 'rafaelmoreira@email.com', 'Rafael Moreira da Silva', '(21) 99111-2012', 'morador', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0001-000000000104', true, NOW() - INTERVAL '4 months'),
('00000000-0000-0000-0000-000000002013', 'lucianaaraujo@email.com', 'Luciana Araújo Pinto', '(21) 99111-2013', 'morador', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0001-000000000203', true, NOW() - INTERVAL '6 months'),
('00000000-0000-0000-0000-000000002014', 'thiagoperes@email.com', 'Thiago Peres Almeida', '(21) 99111-2014', 'morador', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0001-000000000204', true, NOW() - INTERVAL '3 months'),
('00000000-0000-0000-0000-000000002015', 'camilaoliveira@email.com', 'Camila Oliveira Reis', '(21) 99111-2015', 'morador', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0001-000000000303', true, NOW() - INTERVAL '7 months'),
('00000000-0000-0000-0000-000000002016', 'henriquecosta@email.com', 'Henrique Costa Barreto', '(21) 99111-2016', 'morador', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0001-000000000304', true, NOW() - INTERVAL '2 months'),
('00000000-0000-0000-0000-000000002017', 'vanessalopes@email.com', 'Vanessa Lopes Miranda', '(21) 99111-2017', 'morador', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0001-000000000403', true, NOW() - INTERVAL '5 months'),
('00000000-0000-0000-0000-000000002018', 'fabiorodrigues@email.com', 'Fábio Rodrigues Neto', '(21) 99111-2018', 'morador', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0001-000000000404', true, NOW() - INTERVAL '4 months'),
('00000000-0000-0000-0000-000000002019', 'danielamonteiro@email.com', 'Daniela Monteiro Cruz', '(21) 99111-2019', 'morador', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0001-000000000503', true, NOW() - INTERVAL '6 months'),
('00000000-0000-0000-0000-000000002020', 'leonardofaria@email.com', 'Leonardo Faria Duarte', '(21) 99111-2020', 'morador', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0001-000000000603', true, NOW() - INTERVAL '3 months'),
-- Bloco C
('00000000-0000-0000-0000-000000002021', 'beatriznogueira@email.com', 'Beatriz Nogueira Castro', '(21) 99111-2021', 'morador', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0001-000000000105', true, NOW() - INTERVAL '7 months'),
('00000000-0000-0000-0000-000000002022', 'guilhermemelo@email.com', 'Guilherme Melo Teixeira', '(21) 99111-2022', 'morador', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0001-000000000106', true, NOW() - INTERVAL '5 months'),
('00000000-0000-0000-0000-000000002023', 'larissamartins@email.com', 'Larissa Martins Cardoso', '(21) 99111-2023', 'morador', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0001-000000000205', true, NOW() - INTERVAL '4 months'),
('00000000-0000-0000-0000-000000002024', 'gabrielsantos@email.com', 'Gabriel Santos Vieira', '(21) 99111-2024', 'morador', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0001-000000000206', true, NOW() - INTERVAL '6 months'),
('00000000-0000-0000-0000-000000002025', 'isabellafreitas@email.com', 'Isabella Freitas Ramos', '(21) 99111-2025', 'morador', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0001-000000000305', true, NOW() - INTERVAL '3 months'),
('00000000-0000-0000-0000-000000002026', 'lucascampos@email.com', 'Lucas Campos Borges', '(21) 99111-2026', 'morador', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0001-000000000306', true, NOW() - INTERVAL '8 months'),
('00000000-0000-0000-0000-000000002027', 'manuelalima@email.com', 'Manuela Lima Azevedo', '(21) 99111-2027', 'morador', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0001-000000000405', true, NOW() - INTERVAL '2 months'),
('00000000-0000-0000-0000-000000002028', 'pedrohenrique@email.com', 'Pedro Henrique Correia', '(21) 99111-2028', 'morador', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0001-000000000406', true, NOW() - INTERVAL '5 months'),
('00000000-0000-0000-0000-000000002029', 'carolinarocha@email.com', 'Carolina Rocha Mendes', '(21) 99111-2029', 'morador', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0001-000000000505', true, NOW() - INTERVAL '4 months'),
('00000000-0000-0000-0000-000000002030', 'ricardofelipe@email.com', 'Ricardo Felipe Barros', '(21) 99111-2030', 'morador', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0001-000000000605', true, NOW() - INTERVAL '7 months'),
-- Bloco D
('00000000-0000-0000-0000-000000002031', 'fernandabatista@email.com', 'Fernanda Batista Cunha', '(21) 99111-2031', 'morador', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0001-000000000107', true, NOW() - INTERVAL '6 months'),
('00000000-0000-0000-0000-000000002032', 'mauricioandrade@email.com', 'Maurício Andrade Nunes', '(21) 99111-2032', 'morador', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0001-000000000108', true, NOW() - INTERVAL '3 months'),
('00000000-0000-0000-0000-000000002033', 'priscilamoura@email.com', 'Priscila Moura Braga', '(21) 99111-2033', 'morador', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0001-000000000207', true, NOW() - INTERVAL '5 months'),
('00000000-0000-0000-0000-000000002034', 'alexandrenunis@email.com', 'Alexandre Nunes Medeiros', '(21) 99111-2034', 'morador', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0001-000000000208', true, NOW() - INTERVAL '4 months'),
('00000000-0000-0000-0000-000000002035', 'tatianasouza@email.com', 'Tatiana Souza Prado', '(21) 99111-2035', 'morador', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0001-000000000307', true, NOW() - INTERVAL '7 months'),
('00000000-0000-0000-0000-000000002036', 'brunolacerda@email.com', 'Bruno Lacerda Fontes', '(21) 99111-2036', 'morador', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0001-000000000308', true, NOW() - INTERVAL '2 months'),
('00000000-0000-0000-0000-000000002037', 'alinecorrea@email.com', 'Aline Corrêa Tavares', '(21) 99111-2037', 'morador', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0001-000000000407', true, NOW() - INTERVAL '6 months'),
('00000000-0000-0000-0000-000000002038', 'diegopacheco@email.com', 'Diego Pacheco Moreira', '(21) 99111-2038', 'morador', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0001-000000000408', true, NOW() - INTERVAL '3 months'),
('00000000-0000-0000-0000-000000002039', 'renatacastro@email.com', 'Renata Castro Leal', '(21) 99111-2039', 'morador', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0001-000000000507', true, NOW() - INTERVAL '5 months'),
('00000000-0000-0000-0000-000000002040', 'sergioribeiro@email.com', 'Sérgio Ribeiro Matos', '(21) 99111-2040', 'morador', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0001-000000000607', true, NOW() - INTERVAL '8 months')
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- 4. LANÇAMENTOS FINANCEIROS - Histórico 6+ meses
-- =====================================================
-- Taxas de luz, água, gás (concessionárias do RJ)
-- Folha de pagamento, manutenção, limpeza
-- Receitas de condomínio, multas, reservas

INSERT INTO financial_entries (id, condo_id, tipo, categoria, descricao, valor, data_vencimento, data_pagamento, status, forma_pagamento, created_at) VALUES
-- JUNHO/2024
(gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 'receita', 'condominio', 'Taxa condominial - Junho/2024', 67200.00, '2024-06-10', '2024-06-08', 'pago', 'pix', NOW() - INTERVAL '6 months'),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 'despesa', 'funcionarios', 'Folha de pagamento - Porteiros e Zelador', 18500.00, '2024-06-05', '2024-06-05', 'pago', 'transferencia', NOW() - INTERVAL '6 months'),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 'despesa', 'agua', 'CEDAE - Água e esgoto', 4850.00, '2024-06-15', '2024-06-14', 'pago', 'boleto', NOW() - INTERVAL '6 months'),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 'despesa', 'energia', 'Light - Energia elétrica áreas comuns', 3200.00, '2024-06-20', '2024-06-18', 'pago', 'boleto', NOW() - INTERVAL '6 months'),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 'despesa', 'limpeza', 'LimpRJ Serviços - Limpeza mensal', 4500.00, '2024-06-25', '2024-06-23', 'pago', 'transferencia', NOW() - INTERVAL '6 months'),
-- JULHO/2024
(gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 'receita', 'condominio', 'Taxa condominial - Julho/2024', 67200.00, '2024-07-10', '2024-07-09', 'pago', 'pix', NOW() - INTERVAL '5 months'),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 'despesa', 'funcionarios', 'Folha de pagamento - Porteiros e Zelador', 18500.00, '2024-07-05', '2024-07-05', 'pago', 'transferencia', NOW() - INTERVAL '5 months'),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 'despesa', 'agua', 'CEDAE - Água e esgoto', 5120.00, '2024-07-15', '2024-07-12', 'pago', 'boleto', NOW() - INTERVAL '5 months'),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 'despesa', 'energia', 'Light - Energia elétrica áreas comuns', 3450.00, '2024-07-20', '2024-07-19', 'pago', 'boleto', NOW() - INTERVAL '5 months'),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 'despesa', 'manutencao', 'Elevadores Atlas - Manutenção preventiva', 2800.00, '2024-07-15', '2024-07-14', 'pago', 'boleto', NOW() - INTERVAL '5 months'),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 'despesa', 'limpeza', 'LimpRJ Serviços - Limpeza mensal', 4500.00, '2024-07-25', '2024-07-24', 'pago', 'transferencia', NOW() - INTERVAL '5 months'),
-- AGOSTO/2024
(gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 'receita', 'condominio', 'Taxa condominial - Agosto/2024', 67200.00, '2024-08-10', '2024-08-11', 'pago', 'boleto', NOW() - INTERVAL '4 months'),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 'despesa', 'funcionarios', 'Folha de pagamento - Porteiros e Zelador', 18500.00, '2024-08-05', '2024-08-05', 'pago', 'transferencia', NOW() - INTERVAL '4 months'),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 'despesa', 'agua', 'CEDAE - Água e esgoto', 4980.00, '2024-08-15', '2024-08-15', 'pago', 'boleto', NOW() - INTERVAL '4 months'),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 'despesa', 'energia', 'Light - Energia elétrica áreas comuns', 3380.00, '2024-08-20', '2024-08-20', 'pago', 'boleto', NOW() - INTERVAL '4 months'),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 'despesa', 'manutencao', 'Dedetização - Alfa Dedetização RJ', 1200.00, '2024-08-10', '2024-08-09', 'pago', 'pix', NOW() - INTERVAL '4 months'),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 'despesa', 'limpeza', 'LimpRJ Serviços - Limpeza mensal', 4500.00, '2024-08-25', '2024-08-23', 'pago', 'transferencia', NOW() - INTERVAL '4 months'),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 'receita', 'multa', 'Multa por atraso - Apt B-302', 134.40, '2024-08-15', '2024-08-20', 'pago', 'pix', NOW() - INTERVAL '4 months'),
-- SETEMBRO/2024
(gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 'receita', 'condominio', 'Taxa condominial - Setembro/2024', 67200.00, '2024-09-10', '2024-09-10', 'pago', 'pix', NOW() - INTERVAL '3 months'),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 'despesa', 'funcionarios', 'Folha de pagamento - Porteiros e Zelador', 18500.00, '2024-09-05', '2024-09-05', 'pago', 'transferencia', NOW() - INTERVAL '3 months'),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 'despesa', 'agua', 'CEDAE - Água e esgoto', 5340.00, '2024-09-15', '2024-09-13', 'pago', 'boleto', NOW() - INTERVAL '3 months'),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 'despesa', 'energia', 'Light - Energia elétrica áreas comuns', 3580.00, '2024-09-20', '2024-09-19', 'pago', 'boleto', NOW() - INTERVAL '3 months'),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 'despesa', 'manutencao', 'Bombas KSB - Manutenção preventiva', 1850.00, '2024-09-12', '2024-09-12', 'pago', 'boleto', NOW() - INTERVAL '3 months'),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 'despesa', 'limpeza', 'LimpRJ Serviços - Limpeza mensal', 4500.00, '2024-09-25', '2024-09-24', 'pago', 'transferencia', NOW() - INTERVAL '3 months'),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 'receita', 'reserva', 'Taxa de reserva - Salão de Festas (Apt A-301)', 350.00, '2024-09-14', '2024-09-14', 'pago', 'pix', NOW() - INTERVAL '3 months'),
-- OUTUBRO/2024
(gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 'receita', 'condominio', 'Taxa condominial - Outubro/2024', 67200.00, '2024-10-10', '2024-10-09', 'pago', 'pix', NOW() - INTERVAL '2 months'),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 'despesa', 'funcionarios', 'Folha de pagamento - Porteiros e Zelador', 18500.00, '2024-10-05', '2024-10-04', 'pago', 'transferencia', NOW() - INTERVAL '2 months'),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 'despesa', 'agua', 'CEDAE - Água e esgoto', 5180.00, '2024-10-15', '2024-10-14', 'pago', 'boleto', NOW() - INTERVAL '2 months'),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 'despesa', 'energia', 'Light - Energia elétrica áreas comuns', 3620.00, '2024-10-20', '2024-10-18', 'pago', 'boleto', NOW() - INTERVAL '2 months'),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 'despesa', 'manutencao', 'Elevadores Atlas - Manutenção preventiva', 2800.00, '2024-10-15', '2024-10-15', 'pago', 'boleto', NOW() - INTERVAL '2 months'),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 'despesa', 'limpeza', 'LimpRJ Serviços - Limpeza mensal', 4500.00, '2024-10-25', '2024-10-24', 'pago', 'transferencia', NOW() - INTERVAL '2 months'),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 'despesa', 'seguranca', 'Intelbras - Manutenção CFTV', 890.00, '2024-10-18', '2024-10-18', 'pago', 'pix', NOW() - INTERVAL '2 months'),
-- NOVEMBRO/2024
(gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 'receita', 'condominio', 'Taxa condominial - Novembro/2024', 67200.00, '2024-11-10', '2024-11-08', 'pago', 'pix', NOW() - INTERVAL '1 month'),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 'despesa', 'funcionarios', 'Folha de pagamento - Porteiros e Zelador', 18500.00, '2024-11-05', '2024-11-05', 'pago', 'transferencia', NOW() - INTERVAL '1 month'),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 'despesa', 'agua', 'CEDAE - Água e esgoto', 5420.00, '2024-11-15', '2024-11-14', 'pago', 'boleto', NOW() - INTERVAL '1 month'),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 'despesa', 'energia', 'Light - Energia elétrica áreas comuns', 3890.00, '2024-11-20', '2024-11-19', 'pago', 'boleto', NOW() - INTERVAL '1 month'),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 'despesa', 'limpeza', 'LimpRJ Serviços - Limpeza mensal', 4500.00, '2024-11-25', '2024-11-25', 'pago', 'transferencia', NOW() - INTERVAL '1 month'),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 'despesa', 'manutencao', 'Reparo portão garagem - JB Portões', 1450.00, '2024-11-18', '2024-11-18', 'pago', 'pix', NOW() - INTERVAL '1 month'),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 'receita', 'reserva', 'Taxa de reserva - Churrasqueira (Apt C-401)', 200.00, '2024-11-23', '2024-11-23', 'pago', 'pix', NOW() - INTERVAL '1 month'),
-- DEZEMBRO/2024 (mês atual)
(gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 'receita', 'condominio', 'Taxa condominial - Dezembro/2024', 67200.00, '2024-12-10', '2024-12-09', 'pago', 'pix', NOW() - INTERVAL '3 days'),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 'despesa', 'funcionarios', 'Folha de pagamento - Porteiros e Zelador', 18500.00, '2024-12-05', '2024-12-05', 'pago', 'transferencia', NOW() - INTERVAL '7 days'),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 'despesa', 'funcionarios', '13º Salário - Porteiros e Zelador', 18500.00, '2024-12-20', NULL, 'previsto', NULL, NOW()),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 'despesa', 'agua', 'CEDAE - Água e esgoto', 5280.00, '2024-12-15', NULL, 'em_aberto', NULL, NOW()),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 'despesa', 'energia', 'Light - Energia elétrica áreas comuns', 4100.00, '2024-12-20', NULL, 'previsto', NULL, NOW()),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 'despesa', 'limpeza', 'LimpRJ Serviços - Limpeza mensal', 4500.00, '2024-12-25', NULL, 'previsto', NULL, NOW()),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 'despesa', 'manutencao', 'Elevadores Atlas - Manutenção preventiva', 2800.00, '2024-12-15', '2024-12-12', 'pago', 'boleto', NOW() - INTERVAL '1 day'),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 'despesa', 'outros', 'Decoração de Natal - áreas comuns', 2200.00, '2024-12-01', '2024-12-01', 'pago', 'pix', NOW() - INTERVAL '11 days')
ON CONFLICT DO NOTHING;

-- =====================================================
-- 5. AVISOS / COMUNICADOS
-- =====================================================
INSERT INTO notices (id, condo_id, titulo, mensagem, publico_alvo, data_publicacao, data_expiracao, created_at) VALUES
(gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 'Manutenção Elevadores - Bloco A', 'Informamos que no dia 18/12 (quarta-feira), das 8h às 12h, haverá manutenção preventiva nos elevadores do Bloco A. Pedimos desculpas pelo transtorno.', 'todos', NOW() - INTERVAL '3 days', NOW() + INTERVAL '7 days', NOW() - INTERVAL '3 days'),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 'Assembleia Geral Ordinária - Janeiro/2025', 'Convocamos todos os condôminos para Assembleia Geral Ordinária no dia 15/01/2025, às 19h, no Salão de Festas. Pauta: Aprovação de contas 2024, Previsão orçamentária 2025, Eleição do novo Conselho Fiscal.', 'todos', NOW() - INTERVAL '5 days', NOW() + INTERVAL '35 days', NOW() - INTERVAL '5 days'),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 'Boas Festas!', 'A administração do Residencial Jardim Atlântico deseja a todos os moradores e colaboradores um Feliz Natal e um Próspero Ano Novo! Que 2025 seja repleto de paz, saúde e harmonia em nossa comunidade.', 'todos', NOW() - INTERVAL '1 day', NOW() + INTERVAL '20 days', NOW() - INTERVAL '1 day'),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 'Limpeza da Caixa d''Água', 'No próximo sábado (21/12), a equipe da CEDAE realizará limpeza e higienização das caixas d''água. Recomendamos armazenar água para uso durante o período de 6h às 14h.', 'todos', NOW() - INTERVAL '2 days', NOW() + INTERVAL '10 days', NOW() - INTERVAL '2 days'),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 'Horário de Funcionamento - Fim de Ano', 'Informamos os horários de funcionamento durante as festas: 24/12 e 31/12 - Portaria em escala especial. Administração retorna em 02/01/2025.', 'todos', NOW() - INTERVAL '4 days', NOW() + INTERVAL '22 days', NOW() - INTERVAL '4 days'),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 'URGENTE - Vazamento no Bloco C', 'Identificamos vazamento no 3º andar do Bloco C. Equipe de manutenção já está no local. Moradores do bloco podem sentir redução de pressão temporária.', 'todos', NOW() - INTERVAL '6 hours', NOW() + INTERVAL '1 day', NOW() - INTERVAL '6 hours'),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 'Resultado da Enquete - Horário Academia', 'Encerramos a enquete sobre horário da academia. Resultado: 24h - 65% dos votos. A partir de Janeiro/2025, a academia funcionará 24 horas.', 'todos', NOW() - INTERVAL '15 days', NULL, NOW() - INTERVAL '15 days'),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 'Obras na Rua Barão da Torre', 'A Prefeitura informou que haverá obras de recapeamento na Rua Barão da Torre entre os dias 16 e 20/12. Recomendamos utilizar rotas alternativas.', 'todos', NOW() - INTERVAL '8 days', NOW() + INTERVAL '5 days', NOW() - INTERVAL '8 days')
ON CONFLICT DO NOTHING;

-- =====================================================
-- 6. OCORRÊNCIAS
-- =====================================================
INSERT INTO occurrences (id, condo_id, unidade_id, criado_por_user_id, tipo, titulo, descricao, status, prioridade, data_abertura, data_fechamento, created_at) VALUES
(gen_random_uuid(), '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0001-000000000303', '00000000-0000-0000-0000-000000002015', 'reclamacao', 'Barulho excessivo após 22h', 'Morador do apartamento acima está realizando obras/barulho intenso após às 22h, descumprindo regimento interno.', 'aberta', 'alta', NOW() - INTERVAL '2 days', NULL, NOW() - INTERVAL '2 days'),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000001', NULL, '00000000-0000-0000-0000-000000001010', 'manutencao', 'Lâmpada queimada - Hall Bloco B', 'Lâmpada do hall do 2º andar do Bloco B queimada. Necessita troca.', 'em_andamento', 'media', NOW() - INTERVAL '3 days', NULL, NOW() - INTERVAL '3 days'),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000001', NULL, '00000000-0000-0000-0000-000000001001', 'manutencao', 'Vazamento piscina', 'Identificado pequeno vazamento na área da piscina. Empresa contratada para reparo.', 'em_andamento', 'alta', NOW() - INTERVAL '5 days', NULL, NOW() - INTERVAL '5 days'),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0001-000000000206', '00000000-0000-0000-0000-000000002024', 'reclamacao', 'Cachorro latindo constantemente', 'O cachorro do vizinho do andar de cima late durante todo o dia, atrapalhando o home office.', 'aberta', 'media', NOW() - INTERVAL '4 days', NULL, NOW() - INTERVAL '4 days'),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000001', NULL, '00000000-0000-0000-0000-000000001012', 'incidente', 'Tentativa de acesso indevido', 'Indivíduo suspeito tentou entrar afirmando ser entregador sem comprovação. Negado acesso e registrado ocorrência.', 'resolvida', 'alta', NOW() - INTERVAL '10 days', NOW() - INTERVAL '10 days', NOW() - INTERVAL '10 days'),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000001', NULL, '00000000-0000-0000-0000-000000001001', 'manutencao', 'Portão garagem com defeito', 'Portão automático da garagem apresentando falha no sensor. Já solicitado reparo.', 'resolvida', 'alta', NOW() - INTERVAL '25 days', NOW() - INTERVAL '20 days', NOW() - INTERVAL '25 days'),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0001-000000000401', '00000000-0000-0000-0000-000000002007', 'outro', 'Infiltração no teto', 'Apareceu mancha de infiltração no teto do banheiro. Solicito vistoria para verificar origem.', 'em_andamento', 'media', NOW() - INTERVAL '7 days', NULL, NOW() - INTERVAL '7 days'),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000001', NULL, '00000000-0000-0000-0000-000000002030', 'reclamacao', 'Uso indevido de vaga de garagem', 'Veículo não identificado estacionado na vaga C-11/12 que pertence ao apto 601 do Bloco C.', 'resolvida', 'baixa', NOW() - INTERVAL '12 days', NOW() - INTERVAL '11 days', NOW() - INTERVAL '12 days')
ON CONFLICT DO NOTHING;

-- =====================================================
-- 7. ÁREAS COMUNS
-- =====================================================
INSERT INTO common_areas (id, condo_id, nome, descricao, capacidade_maxima, valor_taxa, requer_aprovacao, horario_abertura, horario_fechamento, regras, ativo, created_at) VALUES
('00000000-0000-0000-0002-000000000001', '00000000-0000-0000-0000-000000000001', 'Salão de Festas', 'Salão climatizado com cozinha completa, banheiros masculino e feminino, área de 120m². Capacidade para 80 pessoas.', 80, 350.00, true, '08:00', '23:00', 'Horário máximo: 23h. Som interno até 22h. Limpeza por conta do condômino. Taxa de limpeza: R$ 150,00 caso não seja entregue limpo.', true, NOW() - INTERVAL '8 months'),
('00000000-0000-0000-0002-000000000002', '00000000-0000-0000-0000-000000000001', 'Churrasqueira 1', 'Área de churrasqueira coberta com mesa para 15 pessoas, bancada e pia.', 20, 200.00, true, '10:00', '22:00', 'Reserva antecipada obrigatória. Limpeza por conta do condômino.', true, NOW() - INTERVAL '8 months'),
('00000000-0000-0000-0002-000000000003', '00000000-0000-0000-0000-000000000001', 'Churrasqueira 2', 'Área de churrasqueira descoberta próxima à piscina.', 15, 150.00, true, '10:00', '22:00', 'Uso restrito a moradores e convidados. Máximo 15 pessoas.', true, NOW() - INTERVAL '8 months'),
('00000000-0000-0000-0002-000000000004', '00000000-0000-0000-0000-000000000001', 'Quadra Poliesportiva', 'Quadra poliesportiva com marcação para futebol de salão, basquete e vôlei.', 20, 0.00, false, '07:00', '22:00', 'Uso livre. Calçados adequados obrigatórios. Proibido alimentação na quadra.', true, NOW() - INTERVAL '8 months'),
('00000000-0000-0000-0002-000000000005', '00000000-0000-0000-0000-000000000001', 'Piscina', 'Piscina adulto e infantil com deck molhado.', 50, 0.00, false, '07:00', '21:00', 'Uso obrigatório de trajes de banho. Menores de 12 anos acompanhados. Proibido vidro.', true, NOW() - INTERVAL '8 months'),
('00000000-0000-0000-0002-000000000006', '00000000-0000-0000-0000-000000000001', 'Sauna', 'Sauna seca e úmida.', 8, 0.00, false, '08:00', '20:00', 'Uso adulto. Toalha obrigatória. Máximo 30 minutos.', true, NOW() - INTERVAL '8 months'),
('00000000-0000-0000-0002-000000000007', '00000000-0000-0000-0000-000000000001', 'Academia', 'Academia completa com equipamentos de musculação e cardio.', 15, 0.00, false, '00:00', '23:59', 'Uso livre para moradores. Toalha obrigatória. Limpar equipamentos após uso.', true, NOW() - INTERVAL '8 months'),
('00000000-0000-0000-0002-000000000008', '00000000-0000-0000-0000-000000000001', 'Playground', 'Área de lazer infantil com brinquedos.', 20, 0.00, false, '08:00', '20:00', 'Crianças até 12 anos. Acompanhamento de responsável obrigatório para menores de 8 anos.', true, NOW() - INTERVAL '8 months'),
('00000000-0000-0000-0002-000000000009', '00000000-0000-0000-0000-000000000001', 'Salão de Jogos', 'Sala com mesa de sinuca, pebolim, ping-pong e videogame.', 12, 0.00, false, '09:00', '22:00', 'Proibido apostas. Menores de 14 anos acompanhados.', true, NOW() - INTERVAL '8 months')
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- 8. RESERVAS
-- =====================================================
INSERT INTO reservations (id, condo_id, area_id, user_id, unidade_id, data_reserva, horario_inicio, horario_fim, num_convidados, observacoes, status, aprovado_por, data_aprovacao, valor_cobrado, created_at) VALUES
-- Reservas passadas (concluídas)
(gen_random_uuid(), '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0002-000000000001', '00000000-0000-0000-0000-000000002005', '00000000-0000-0000-0001-000000000301', CURRENT_DATE - 20, '14:00', '22:00', 45, 'Aniversário de 15 anos', 'concluida', '00000000-0000-0000-0000-000000001001', NOW() - INTERVAL '25 days', 350.00, NOW() - INTERVAL '30 days'),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0002-000000000002', '00000000-0000-0000-0000-000000002020', '00000000-0000-0000-0001-000000000603', CURRENT_DATE - 14, '12:00', '18:00', 12, 'Churrasco família', 'concluida', '00000000-0000-0000-0000-000000001001', NOW() - INTERVAL '18 days', 200.00, NOW() - INTERVAL '20 days'),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0002-000000000001', '00000000-0000-0000-0000-000000002010', '00000000-0000-0000-0001-000000000601', CURRENT_DATE - 7, '18:00', '23:00', 60, 'Confraternização de fim de ano', 'concluida', '00000000-0000-0000-0000-000000001001', NOW() - INTERVAL '14 days', 350.00, NOW() - INTERVAL '15 days'),
-- Reservas futuras (aprovadas)
(gen_random_uuid(), '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0002-000000000001', '00000000-0000-0000-0000-000000002001', '00000000-0000-0000-0001-000000000101', CURRENT_DATE + 10, '16:00', '23:00', 50, 'Réveillon - festa particular', 'aprovada', '00000000-0000-0000-0000-000000001001', NOW() - INTERVAL '5 days', 350.00, NOW() - INTERVAL '10 days'),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0002-000000000003', '00000000-0000-0000-0000-000000002025', '00000000-0000-0000-0001-000000000305', CURRENT_DATE + 5, '12:00', '17:00', 10, 'Almoço família', 'aprovada', '00000000-0000-0000-0000-000000001001', NOW() - INTERVAL '2 days', 150.00, NOW() - INTERVAL '7 days'),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0002-000000000002', '00000000-0000-0000-0000-000000002035', '00000000-0000-0000-0001-000000000307', CURRENT_DATE + 15, '11:00', '18:00', 15, 'Aniversário do filho', 'pendente', NULL, NULL, 200.00, NOW() - INTERVAL '1 day'),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0002-000000000004', '00000000-0000-0000-0000-000000002012', '00000000-0000-0000-0001-000000000104', CURRENT_DATE + 2, '18:00', '20:00', 8, 'Futebol com amigos', 'aprovada', '00000000-0000-0000-0000-000000001001', NOW() - INTERVAL '3 days', 0.00, NOW() - INTERVAL '5 days'),
-- Reserva rejeitada
(gen_random_uuid(), '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0002-000000000001', '00000000-0000-0000-0000-000000002016', '00000000-0000-0000-0001-000000000304', CURRENT_DATE + 10, '14:00', '22:00', 70, 'Casamento', 'rejeitada', '00000000-0000-0000-0000-000000001001', NOW() - INTERVAL '8 days', 350.00, NOW() - INTERVAL '12 days')
ON CONFLICT DO NOTHING;

-- =====================================================
-- 9. VISITANTES / PORTARIA
-- =====================================================
INSERT INTO visitors (id, condo_id, unidade_id, nome, documento, tipo, placa_veiculo, data_hora_entrada, data_hora_saida, registrado_por_user_id, observacoes, created_at) VALUES
-- Hoje
(gen_random_uuid(), '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0001-000000000101', 'Carlos Alberto Mendes', '123.456.789-00', 'visitante', 'RIO2A34', NOW() - INTERVAL '3 hours', NOW() - INTERVAL '1 hour', '00000000-0000-0000-0000-000000001010', 'Tio da moradora', NOW() - INTERVAL '3 hours'),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0001-000000000205', 'iFood Entregas', '00.000.000/0001-00', 'entrega', 'PCX8F57', NOW() - INTERVAL '45 minutes', NOW() - INTERVAL '40 minutes', '00000000-0000-0000-0000-000000001010', 'Entrega de almoço', NOW() - INTERVAL '45 minutes'),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0001-000000000401', 'José Pereira - Eletricista', '987.654.321-00', 'prestador_servico', NULL, NOW() - INTERVAL '2 hours', NULL, '00000000-0000-0000-0000-000000001010', 'Manutenção elétrica autorizada', NOW() - INTERVAL '2 hours'),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0001-000000000303', 'Amazon Logística', '33.298.876/0001-02', 'entrega', 'KXM7D89', NOW() - INTERVAL '1 hour', NOW() - INTERVAL '55 minutes', '00000000-0000-0000-0000-000000001010', 'Pacote', NOW() - INTERVAL '1 hour'),
-- Ontem
(gen_random_uuid(), '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0001-000000000601', 'Maria Aparecida Silva', '111.222.333-44', 'visitante', NULL, NOW() - INTERVAL '1 day' - INTERVAL '6 hours', NOW() - INTERVAL '1 day' - INTERVAL '2 hours', '00000000-0000-0000-0000-000000001011', 'Visita familiar', NOW() - INTERVAL '1 day' - INTERVAL '6 hours'),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0001-000000000207', 'Mercado Livre Envios', '30.558.477/0001-11', 'entrega', 'QRP5B21', NOW() - INTERVAL '1 day' - INTERVAL '4 hours', NOW() - INTERVAL '1 day' - INTERVAL '3 hours' - INTERVAL '50 minutes', '00000000-0000-0000-0000-000000001011', 'Entrega caixa grande', NOW() - INTERVAL '1 day' - INTERVAL '4 hours'),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0001-000000000105', 'Light S.A. - Leitura', '00.000.000/0001-00', 'prestador_servico', NULL, NOW() - INTERVAL '1 day' - INTERVAL '5 hours', NOW() - INTERVAL '1 day' - INTERVAL '4 hours', '00000000-0000-0000-0000-000000001011', 'Leitura de medidores', NOW() - INTERVAL '1 day' - INTERVAL '5 hours'),
-- Últimos dias
(gen_random_uuid(), '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0001-000000000503', 'Correios', '34.028.316/0007-07', 'entrega', NULL, NOW() - INTERVAL '2 days' - INTERVAL '3 hours', NOW() - INTERVAL '2 days' - INTERVAL '2 hours' - INTERVAL '50 minutes', '00000000-0000-0000-0000-000000001012', 'Carta registrada', NOW() - INTERVAL '2 days' - INTERVAL '3 hours'),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0001-000000000306', 'Fernando Costa Lima', '555.666.777-88', 'visitante', 'ABC1D23', NOW() - INTERVAL '2 days' - INTERVAL '8 hours', NOW() - INTERVAL '2 days' - INTERVAL '4 hours', '00000000-0000-0000-0000-000000001012', 'Amigo do morador', NOW() - INTERVAL '2 days' - INTERVAL '8 hours'),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0001-000000000407', 'Desentupidora Zona Sul', '12.345.678/0001-99', 'prestador_servico', 'LMN4E56', NOW() - INTERVAL '3 days' - INTERVAL '10 hours', NOW() - INTERVAL '3 days' - INTERVAL '8 hours', '00000000-0000-0000-0000-000000001010', 'Serviço contratado pelo morador', NOW() - INTERVAL '3 days' - INTERVAL '10 hours'),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0001-000000000201', 'Dra. Ana Paula Fernandes', '999.888.777-66', 'visitante', NULL, NOW() - INTERVAL '4 days' - INTERVAL '7 hours', NOW() - INTERVAL '4 days' - INTERVAL '6 hours', '00000000-0000-0000-0000-000000001011', 'Médica - visita domiciliar', NOW() - INTERVAL '4 days' - INTERVAL '7 hours')
ON CONFLICT DO NOTHING;
-- =====================================================
-- 10. GOVERNANÇA - ASSEMBLEIAS
-- =====================================================
-- Status válidos (schema 3.0): draft, scheduled, open, voting_closed, finalized, cancelled
INSERT INTO assembleias (id, condo_id, title, description, start_at, status, created_by, created_at) VALUES
-- Assembleia futura agendada
('00000000-0000-0000-0003-000000000001', '00000000-0000-0000-0000-000000000001', 'Assembleia Geral Ordinária - Janeiro/2025', 'Pauta: 1. Aprovação das contas de 2024; 2. Previsão orçamentária 2025; 3. Eleição do Conselho Fiscal; 4. Assuntos gerais.', '2025-01-15 19:00:00', 'scheduled', '00000000-0000-0000-0000-000000001001', NOW() - INTERVAL '5 days'),
-- Assembleia passada (encerrada)
('00000000-0000-0000-0003-000000000002', '00000000-0000-0000-0000-000000000001', 'Assembleia Extraordinária - Reforma Piscina', 'Votação para aprovação da reforma da área de lazer e piscina. Orçamento apresentado: R$ 45.000,00', '2024-10-20 19:00:00', 'finalized', '00000000-0000-0000-0000-000000001001', NOW() - INTERVAL '2 months'),
-- Assembleia passada
('00000000-0000-0000-0003-000000000003', '00000000-0000-0000-0000-000000000001', 'Assembleia Geral Ordinária - Julho/2024', 'Aprovação de contas do 1º semestre e definição de taxa extra para fundo de reserva.', '2024-07-15 19:00:00', 'finalized', '00000000-0000-0000-0000-000000001001', NOW() - INTERVAL '5 months')
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- 11. GOVERNANÇA - ENQUETES
-- =====================================================
INSERT INTO enquetes (id, condo_id, title, description, options, start_at, end_at, created_by, created_at) VALUES
-- Enquete em andamento
('00000000-0000-0000-0004-000000000001', '00000000-0000-0000-0000-000000000001', 'Instalação de Carregadores para Veículos Elétricos', 'Você é a favor da instalação de carregadores para veículos elétricos na garagem do condomínio? O custo estimado é de R$ 3.500/unidade, rateado entre os moradores interessados.', '[{"id":"sim","label":"Sim, sou a favor"},{"id":"nao","label":"Não, sou contra"},{"id":"abstencao","label":"Abstenção"}]', NOW() - INTERVAL '3 days', NOW() + INTERVAL '12 days', '00000000-0000-0000-0000-000000001001', NOW() - INTERVAL '3 days'),
-- Enquete finalizada
('00000000-0000-0000-0004-000000000002', '00000000-0000-0000-0000-000000000001', 'Horário de Funcionamento da Academia', 'Qual o melhor horário para funcionamento da academia do condomínio?', '[{"id":"6-22","label":"6h às 22h"},{"id":"7-23","label":"7h às 23h"},{"id":"24h","label":"24 horas"}]', NOW() - INTERVAL '30 days', NOW() - INTERVAL '15 days', '00000000-0000-0000-0000-000000001001', NOW() - INTERVAL '30 days'),
-- Outra enquete finalizada
('00000000-0000-0000-0004-000000000003', '00000000-0000-0000-0000-000000000001', 'Permissão de Animais nas Áreas Comuns', 'Você é a favor de permitir a circulação de animais de estimação nas áreas comuns (com guia e focinheira para cães de grande porte)?', '[{"id":"sim","label":"Sim, permitir"},{"id":"nao","label":"Não permitir"},{"id":"restringir","label":"Permitir com restrições de horário"}]', NOW() - INTERVAL '60 days', NOW() - INTERVAL '45 days', '00000000-0000-0000-0000-000000001001', NOW() - INTERVAL '60 days')
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- 12. GOVERNANÇA - DOCUMENTOS
-- =====================================================
INSERT INTO governance_documents (id, condo_id, name, description, file_url, category, uploaded_by, created_at) VALUES
(gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 'Regimento Interno 2024', 'Regimento interno atualizado em janeiro de 2024', 'https://storage.example.com/regimento-interno-2024.pdf', 'regimento', '00000000-0000-0000-0000-000000001001', NOW() - INTERVAL '11 months'),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 'Convenção do Condomínio', 'Convenção registrada em cartório', 'https://storage.example.com/convencao-condominial.pdf', 'contrato', '00000000-0000-0000-0000-000000001001', NOW() - INTERVAL '8 months'),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 'Ata AGO Julho/2024', 'Ata da Assembleia Geral Ordinária de Julho/2024', 'https://storage.example.com/ata-ago-julho-2024.pdf', 'ata', '00000000-0000-0000-0000-000000001001', NOW() - INTERVAL '5 months'),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 'Ata AGE Outubro/2024 - Reforma Piscina', 'Ata da Assembleia Extraordinária sobre reforma da piscina', 'https://storage.example.com/ata-age-outubro-2024.pdf', 'ata', '00000000-0000-0000-0000-000000001001', NOW() - INTERVAL '2 months'),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 'Prestação de Contas 2023', 'Balancete anual do exercício de 2023', 'https://storage.example.com/prestacao-contas-2023.pdf', 'financeiro', '00000000-0000-0000-0000-000000001001', NOW() - INTERVAL '11 months'),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 'Previsão Orçamentária 2024', 'Orçamento aprovado para o exercício de 2024', 'https://storage.example.com/orcamento-2024.pdf', 'financeiro', '00000000-0000-0000-0000-000000001001', NOW() - INTERVAL '11 months')
ON CONFLICT DO NOTHING;

-- =====================================================
-- 13. MANUTENÇÃO - EQUIPAMENTOS
-- =====================================================
INSERT INTO manutencao_equipments (id, condo_id, name, type, location, status, created_at) VALUES
('00000000-0000-0000-0005-000000000001', '00000000-0000-0000-0000-000000000001', 'Elevador Social - Bloco A', 'Elevador', 'Bloco A', 'ativo', NOW() - INTERVAL '8 months'),
('00000000-0000-0000-0005-000000000002', '00000000-0000-0000-0000-000000000001', 'Elevador Social - Bloco B', 'Elevador', 'Bloco B', 'ativo', NOW() - INTERVAL '8 months'),
('00000000-0000-0000-0005-000000000003', '00000000-0000-0000-0000-000000000001', 'Elevador Social - Bloco C', 'Elevador', 'Bloco C', 'ativo', NOW() - INTERVAL '8 months'),
('00000000-0000-0000-0005-000000000004', '00000000-0000-0000-0000-000000000001', 'Elevador Social - Bloco D', 'Elevador', 'Bloco D', 'ativo', NOW() - INTERVAL '8 months'),
('00000000-0000-0000-0005-000000000005', '00000000-0000-0000-0000-000000000001', 'Bomba de Recalque Principal', 'Bomba', 'Casa de Máquinas', 'ativo', NOW() - INTERVAL '8 months'),
('00000000-0000-0000-0005-000000000006', '00000000-0000-0000-0000-000000000001', 'Bomba de Recalque Reserva', 'Bomba', 'Casa de Máquinas', 'ativo', NOW() - INTERVAL '8 months'),
('00000000-0000-0000-0005-000000000007', '00000000-0000-0000-0000-000000000001', 'Portão Automático Garagem', 'Portão', 'Entrada Garagem', 'ativo', NOW() - INTERVAL '8 months'),
('00000000-0000-0000-0005-000000000008', '00000000-0000-0000-0000-000000000001', 'Portão Automático Pedestres', 'Portão', 'Entrada Principal', 'ativo', NOW() - INTERVAL '8 months'),
('00000000-0000-0000-0005-000000000009', '00000000-0000-0000-0000-000000000001', 'Sistema de CFTV', 'Outro', 'Portaria', 'ativo', NOW() - INTERVAL '8 months'),
('00000000-0000-0000-0005-000000000010', '00000000-0000-0000-0000-000000000001', 'Gerador de Emergência', 'Outro', 'Casa de Máquinas', 'ativo', NOW() - INTERVAL '8 months'),
('00000000-0000-0000-0005-000000000011', '00000000-0000-0000-0000-000000000001', 'Bomba da Piscina', 'Bomba', 'Casa de Máquinas Piscina', 'manutencao', NOW() - INTERVAL '8 months'),
('00000000-0000-0000-0005-000000000012', '00000000-0000-0000-0000-000000000001', 'Central de Interfones', 'Outro', 'Portaria', 'ativo', NOW() - INTERVAL '8 months')
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- 14. MANUTENÇÃO - AGENDAMENTOS
-- =====================================================
INSERT INTO manutencao_schedule (id, equipment_id, next_date, frequency, description, created_at) VALUES
-- Elevadores - mensal
(gen_random_uuid(), '00000000-0000-0000-0005-000000000001', CURRENT_DATE + 5, 'monthly', 'Manutenção preventiva mensal - Atlas Schindler', NOW() - INTERVAL '8 months'),
(gen_random_uuid(), '00000000-0000-0000-0005-000000000002', CURRENT_DATE + 5, 'monthly', 'Manutenção preventiva mensal - Atlas Schindler', NOW() - INTERVAL '8 months'),
(gen_random_uuid(), '00000000-0000-0000-0005-000000000003', CURRENT_DATE + 5, 'monthly', 'Manutenção preventiva mensal - Atlas Schindler', NOW() - INTERVAL '8 months'),
(gen_random_uuid(), '00000000-0000-0000-0005-000000000004', CURRENT_DATE + 5, 'monthly', 'Manutenção preventiva mensal - Atlas Schindler', NOW() - INTERVAL '8 months'),
-- Bombas - trimestral
(gen_random_uuid(), '00000000-0000-0000-0005-000000000005', CURRENT_DATE + 45, 'quarterly', 'Manutenção preventiva trimestral - KSB', NOW() - INTERVAL '8 months'),
(gen_random_uuid(), '00000000-0000-0000-0005-000000000006', CURRENT_DATE + 45, 'quarterly', 'Manutenção preventiva trimestral - KSB', NOW() - INTERVAL '8 months'),
-- Portões - semestral
(gen_random_uuid(), '00000000-0000-0000-0005-000000000007', CURRENT_DATE + 90, 'yearly', 'Manutenção preventiva semestral - JB Portões', NOW() - INTERVAL '8 months'),
(gen_random_uuid(), '00000000-0000-0000-0005-000000000008', CURRENT_DATE + 90, 'yearly', 'Manutenção preventiva semestral - JB Portões', NOW() - INTERVAL '8 months'),
-- CFTV - trimestral
(gen_random_uuid(), '00000000-0000-0000-0005-000000000009', CURRENT_DATE + 30, 'quarterly', 'Verificação e manutenção preventiva - Intelbras', NOW() - INTERVAL '8 months'),
-- Gerador - semestral
(gen_random_uuid(), '00000000-0000-0000-0005-000000000010', CURRENT_DATE + 120, 'yearly', 'Teste de funcionamento e manutenção preventiva', NOW() - INTERVAL '8 months'),
-- Piscina - mensal
(gen_random_uuid(), '00000000-0000-0000-0005-000000000011', CURRENT_DATE + 15, 'monthly', 'Manutenção e limpeza do sistema', NOW() - INTERVAL '8 months')
ON CONFLICT DO NOTHING;

-- =====================================================
-- 15. ENCOMENDAS / DELIVERIES
-- =====================================================
-- (Nota: Requer que a tabela deliveries e residents existam)
-- Inserindo entregas demo diretamente se as tabelas existirem

-- =====================================================
-- 16. NOTIFICAÇÕES ENVIADAS
-- =====================================================
INSERT INTO notifications_sent (id, condo_id, sender_id, tipo, destinatario_tipo, destinatario_valor, titulo, mensagem, status, created_at) VALUES
(gen_random_uuid(), '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000001001', 'aviso', 'todos', NULL, 'Manutenção Elevadores - Bloco A', 'Informamos que no dia 18/12 haverá manutenção preventiva nos elevadores do Bloco A.', 'enviado', NOW() - INTERVAL '3 days'),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000001001', 'aviso', 'todos', NULL, 'Assembleia Geral Ordinária', 'Convocação para AGO em 15/01/2025 às 19h.', 'enviado', NOW() - INTERVAL '5 days'),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000001001', 'email', 'bloco', 'C', 'URGENTE - Vazamento no Bloco C', 'Identificamos vazamento no 3º andar. Equipe já no local.', 'enviado', NOW() - INTERVAL '6 hours'),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000001001', 'push', 'todos', NULL, 'Boas Festas!', 'Feliz Natal e Próspero Ano Novo!', 'enviado', NOW() - INTERVAL '1 day'),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000001001', 'whatsapp', 'unidade', 'A-301', 'Reserva Aprovada', 'Sua reserva do Salão de Festas foi aprovada.', 'enviado', NOW() - INTERVAL '5 days'),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000001010', 'push', 'unidade', 'B-201', 'Encomenda Recebida', 'Você tem uma encomenda aguardando na portaria.', 'enviado', NOW() - INTERVAL '1 day')
ON CONFLICT DO NOTHING;

-- =====================================================
-- 17. ASSINATURA DO CONDOMÍNIO
-- =====================================================
INSERT INTO subscriptions (id, condo_id, plano_id, status, data_inicio, data_renovacao, valor_mensal_cobrado, observacoes, created_at)
SELECT 
    gen_random_uuid(),
    '00000000-0000-0000-0000-000000000001',
    id,
    'ativo',
    CURRENT_DATE - 240,
    CURRENT_DATE + 125,
    249.90,
    'Plano Avançado - 60 unidades. Cliente desde Abril/2024.',
    NOW() - INTERVAL '8 months'
FROM plans WHERE nome_plano = 'Avançado' LIMIT 1
ON CONFLICT DO NOTHING;

-- =====================================================
-- 18. RESUMO DOS DADOS DEMO
-- =====================================================
-- Condomínio: Residencial Jardim Atlântico
-- Localização: Rua Barão da Torre, 450 - Ipanema, RJ
-- Blocos: 4 (A, B, C, D)
-- Total de Unidades: 48
-- Síndico: Ricardo Mendes Figueiredo
-- Subsíndico: Adriana Costa Ribeiro
-- Porteiros: 4 (3 turnos + folguista)
-- Moradores cadastrados: 40+
-- Áreas comuns: 9 (Salão, 2 Churrasqueiras, Quadra, Piscina, Sauna, Academia, Playground, Salão de Jogos)
-- Histórico financeiro: 6+ meses
-- Portaria 24h com registro de visitantes
-- Sistema de encomendas
-- Governança: Assembleias, Enquetes, Documentos
-- Manutenção: 12 equipamentos com agendamentos

SELECT 'Dados demo do Residencial Jardim Atlântico inseridos com sucesso!' as status;
