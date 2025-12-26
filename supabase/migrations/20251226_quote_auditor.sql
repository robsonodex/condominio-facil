-- Migration: Auditor Condominial com IA
-- Tabela de Benchmarks de Preços com busca semântica (embeddings)

-- 1. Habilitar a extensão de vetores (pgvector)
create extension if not exists vector;

-- 2. Tabela de Benchmarks (Preços de Referência do RJ)
create table if not exists price_benchmarks (
  id uuid primary key default gen_random_uuid(),
  category varchar(50) not null, -- ex: 'Manutenção', 'Obras', 'Limpeza'
  service_description text not null,
  embedding vector(1536), -- Para o modelo text-embedding-3-small
  avg_price_rj decimal(10,2) not null, -- Preço médio no Rio
  min_price_rj decimal(10,2), -- Preço mínimo observado
  max_price_rj decimal(10,2), -- Preço máximo observado
  unit varchar(20) not null, -- 'global', 'hora', 'm2', 'mensal', 'unidade'
  confidence_score float default 0.9, -- Quão confiável é esse dado
  source varchar(100), -- Fonte do dado (ex: 'SINICON', 'pesquisa mercado')
  updated_at timestamptz default now(),
  created_at timestamptz default now()
);

-- Índice para busca vetorial (essencial para performance)
create index if not exists price_benchmarks_embedding_idx 
on price_benchmarks using ivfflat (embedding vector_cosine_ops) with (lists = 100);

-- Índice por categoria
create index if not exists idx_price_benchmarks_category on price_benchmarks(category);

-- 3. Função de Busca por Similaridade (O Cérebro da Busca)
create or replace function match_services (
  query_embedding vector(1536),
  match_threshold float default 0.75,
  match_count int default 3
)
returns table (
  id uuid,
  category varchar,
  service_description text,
  avg_price_rj decimal,
  min_price_rj decimal,
  max_price_rj decimal,
  unit varchar,
  similarity float
)
language plpgsql
as $$
begin
  return query
  select
    price_benchmarks.id,
    price_benchmarks.category,
    price_benchmarks.service_description,
    price_benchmarks.avg_price_rj,
    price_benchmarks.min_price_rj,
    price_benchmarks.max_price_rj,
    price_benchmarks.unit,
    1 - (price_benchmarks.embedding <=> query_embedding) as similarity
  from price_benchmarks
  where price_benchmarks.embedding is not null
    and 1 - (price_benchmarks.embedding <=> query_embedding) > match_threshold
  order by price_benchmarks.embedding <=> query_embedding
  limit match_count;
end;
$$;

-- 4. Tabela de Histórico de Auditorias (para aprendizado e relatórios)
create table if not exists quote_audits (
  id uuid primary key default gen_random_uuid(),
  condo_id uuid references condos(id) on delete cascade,
  user_id uuid references users(id) on delete set null,
  
  -- Dados do orçamento original
  original_file_url text,
  original_file_name varchar(255),
  
  -- Dados extraídos pelo GPT
  extracted_items jsonb, -- Array de itens extraídos
  supplier_name varchar(255),
  
  -- Resultado da auditoria
  status varchar(20) default 'pending' check (status in ('pending', 'approved', 'alert', 'error')),
  total_original decimal(10,2),
  total_benchmark decimal(10,2),
  savings_potential decimal(10,2),
  variance_percentage float,
  
  -- Detalhes
  audit_details jsonb, -- Detalhes item a item
  message text,
  
  created_at timestamptz default now()
);

-- Índices
create index if not exists idx_quote_audits_condo on quote_audits(condo_id);
create index if not exists idx_quote_audits_status on quote_audits(status);
create index if not exists idx_quote_audits_created on quote_audits(created_at);

-- RLS
alter table price_benchmarks enable row level security;
alter table quote_audits enable row level security;

-- Benchmarks são públicos (leitura)
drop policy if exists "Benchmarks são públicos para leitura" on price_benchmarks;
create policy "Benchmarks são públicos para leitura"
on price_benchmarks for select using (true);

-- Auditorias são privadas por condomínio
drop policy if exists "Auditorias visíveis por condomínio" on quote_audits;
create policy "Auditorias visíveis por condomínio"
on quote_audits for select
using (condo_id in (select condo_id from users where id = auth.uid()));

drop policy if exists "Síndicos podem criar auditorias" on quote_audits;
create policy "Síndicos podem criar auditorias"
on quote_audits for insert
with check (condo_id in (select condo_id from users where id = auth.uid() and role in ('sindico', 'superadmin')));

-- 5. Seed Data (Preços de Referência do Rio de Janeiro)
-- Nota: Os embeddings serão gerados via script separado
insert into price_benchmarks (category, service_description, avg_price_rj, min_price_rj, max_price_rj, unit, source) values
-- Manutenção
('Manutenção', 'Limpeza e Higienização de Cisterna até 10.000L', 850.00, 650.00, 1200.00, 'global', 'pesquisa mercado RJ 2024'),
('Manutenção', 'Limpeza e Higienização de Cisterna até 20.000L', 1200.00, 900.00, 1600.00, 'global', 'pesquisa mercado RJ 2024'),
('Manutenção', 'Manutenção Preventiva de Portão Eletrônico (Mensal)', 350.00, 250.00, 500.00, 'mensal', 'pesquisa mercado RJ 2024'),
('Manutenção', 'Manutenção Corretiva de Portão Eletrônico', 450.00, 300.00, 700.00, 'global', 'pesquisa mercado RJ 2024'),
('Manutenção', 'Manutenção de Elevador (Mensal por cabine)', 1800.00, 1400.00, 2500.00, 'mensal', 'pesquisa mercado RJ 2024'),
('Manutenção', 'Dedetização de Área Comum (até 500m2)', 380.00, 280.00, 550.00, 'global', 'pesquisa mercado RJ 2024'),
('Manutenção', 'Limpeza de Caixa de Gordura', 450.00, 300.00, 650.00, 'global', 'pesquisa mercado RJ 2024'),

-- Obras
('Obras', 'Pintura de Fachada Predial (Mão de obra + Material)', 85.00, 65.00, 120.00, 'm2', 'SINICON RJ 2024'),
('Obras', 'Impermeabilização de Laje (Manta asfáltica)', 95.00, 75.00, 140.00, 'm2', 'SINICON RJ 2024'),
('Obras', 'Reforma de Guarita Completa', 25000.00, 18000.00, 40000.00, 'global', 'pesquisa mercado RJ 2024'),
('Obras', 'Instalação de Cerca Elétrica (metro linear)', 45.00, 35.00, 65.00, 'metro', 'pesquisa mercado RJ 2024'),

-- Segurança
('Segurança', 'Recarga de Extintor CO2 6kg', 120.00, 90.00, 160.00, 'unidade', 'pesquisa mercado RJ 2024'),
('Segurança', 'Recarga de Extintor Pó Químico 4kg', 65.00, 45.00, 90.00, 'unidade', 'pesquisa mercado RJ 2024'),
('Segurança', 'Manutenção de Sistema de Alarme (Mensal)', 280.00, 200.00, 400.00, 'mensal', 'pesquisa mercado RJ 2024'),
('Segurança', 'Instalação de Câmera de Segurança (com infra)', 650.00, 450.00, 950.00, 'unidade', 'pesquisa mercado RJ 2024'),

-- Jardinagem
('Jardinagem', 'Manutenção de Jardim (Mensal, até 500m2)', 1200.00, 800.00, 1800.00, 'mensal', 'pesquisa mercado RJ 2024'),
('Jardinagem', 'Poda de Árvore de Grande Porte', 450.00, 300.00, 700.00, 'unidade', 'pesquisa mercado RJ 2024'),

-- Limpeza
('Limpeza', 'Terceirização de Limpeza (Diarista 8h/dia)', 180.00, 140.00, 250.00, 'diaria', 'pesquisa mercado RJ 2024'),
('Limpeza', 'Limpeza de Vidros em Altura (Rapel)', 12.00, 8.00, 18.00, 'm2', 'pesquisa mercado RJ 2024'),

-- Elétrica
('Elétrica', 'Manutenção Elétrica Predial (Mensal)', 950.00, 700.00, 1400.00, 'mensal', 'pesquisa mercado RJ 2024'),
('Elétrica', 'Troca de Quadro de Distribuição', 2500.00, 1800.00, 3500.00, 'global', 'pesquisa mercado RJ 2024'),

-- Hidráulica
('Hidráulica', 'Desentupimento de Esgoto (até 30m)', 650.00, 400.00, 950.00, 'global', 'pesquisa mercado RJ 2024'),
('Hidráulica', 'Reparo de Bomba D''Água', 800.00, 500.00, 1200.00, 'global', 'pesquisa mercado RJ 2024')

on conflict do nothing;

-- Comentários
comment on table price_benchmarks is 'Benchmarks de preços de serviços para auditoria automática de orçamentos';
comment on table quote_audits is 'Histórico de auditorias de orçamentos realizadas pelo sistema de IA';
comment on function match_services is 'Busca semântica de serviços similares usando embeddings vetoriais';
