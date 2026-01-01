# 01 - Visão Geral do Sistema

## 📋 O que é o Meu Condomínio Fácil?

O **Meu Condomínio Fácil** é uma plataforma SaaS (Software as a Service) multi-tenant de última geração, projetada para simplificar e modernizar a gestão de condomínios residenciais e comerciais. O sistema une automação financeira, segurança de ponta e ferramentas social em uma interface intuitiva e responsiva.

## 🎯 Objetivo
Transformar a gestão condominial em uma experiência digital fluida, reduzindo a burocracia para o síndico e aumentando a conveniência e segurança para os moradores.

## 🏗️ Arquitetura Core

### Multi-Tenancy
O sistema utiliza uma arquitetura de banco de dados única com isolamento lógico via **RLS (Row Level Security)** do Supabase. Cada recurso (morador, unidade, cobrança) está vinculado a um `condo_id`, garantindo que um condomínio jamais tenha acesso aos dados de outro.

### Stack Tecnológica
- **Front-end**: Next.js 15 (App Router), React 19, Tailwind CSS.
- **Back-end**: Next.js API Routes (Route Handlers).
- **Banco de Dados & Auth**: Supabase (PostgreSQL + GoTrue).
- **Integrações**: Mercado Pago, Asaas, AWS Rekognition.

## 💎 Diferenciais Estratégicos (V10.0)
1. **Permissões Granulares**: Módulos que podem ser ativados/desativados sob demanda por condomínio.
2. **Portaria 4.0**: Inteligência Artificial para reconhecimento facial e leitura de placas.
3. **Banking Integrado**: Cobrança automatizada sem necessidade de arquivos remessa/retorno manuais (via API).
4. **Customização Extrema**: Sidebar e recursos adaptáveis ao perfil de cada cliente.
