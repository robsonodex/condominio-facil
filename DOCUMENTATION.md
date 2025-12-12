# Condomínio Fácil - Documentação Oficial Unificada

**Versão:** 6.2  
**Data:** 12 de Dezembro de 2024  
**Status:** ✅ Estável / Pronto para Lançamento  
**Última Atualização:** 12/12/2024 17:15

---

## 📚 Índice

1. [Visão Geral e Escopo](#1-visão-geral-e-escopo)
2. [Arquitetura Completa do Sistema](#2-arquitetura-completa-do-sistema)
3. [Módulos e Funcionalidades](#3-módulos-e-funcionalidades)
4. [Estrutura de Arquivos](#4-estrutura-de-arquivos)
5. [APIs do Sistema](#5-apis-do-sistema)
6. [Autenticação e Permissões (RBAC)](#6-autenticação-e-permissões-rbac)
7. [Banco de Dados e RLS](#7-banco-de-dados-e-rls)
8. [Correções Recentes (10/12/2024)](#8-correções-recentes-10122024)
9. [Roadmap e Melhorias Futuras](#9-roadmap-e-melhorias-futuras)

---

## 1. Visão Geral e Escopo

### O que é o Condomínio Fácil?

**Condomínio Fácil** é uma plataforma SaaS multi-tenant para gestão completa de condomínios residenciais e comerciais. Permite administração financeira, operacional e comunicação entre síndicos, porteiros e moradores.

### Perfis de Usuário

| Perfil | Descrição | Acesso |
|--------|-----------|--------|
| **Superadmin** | Administrador global da plataforma | Acesso total a todos os condomínios |
| **Síndico** | Gestor do condomínio | Acesso total ao seu condomínio |
| **Porteiro** | Funcionário operacional | Portaria, visitantes, ocorrências |
| **Morador** | Residente da unidade | Visualização e abertura de ocorrências |

### Stack Tecnológica

- **Frontend:** Next.js 14 (App Router)
- **Estilização:** Tailwind CSS + shadcn/ui
- **Backend:** API Routes Next.js
- **Banco de Dados:** Supabase (PostgreSQL)
- **Autenticação:** Supabase Auth
- **Hospedagem:** Vercel
- **Pagamentos:** Mercado Pago

---

## 2. Arquitetura Completa do Sistema

```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND                              │
│  Next.js 14 (App Router) + React 18 + Tailwind CSS          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  /src/app/(dashboard)/*   → Páginas autenticadas            │
│  /src/app/(public)/*      → Landing page, login, register   │
│  /src/app/admin/*         → Painel superadmin               │
│  /src/app/api/*           → API Routes                      │
│                                                              │
├─────────────────────────────────────────────────────────────┤
│                         HOOKS                                │
│  useAuth   → Gerencia sessão e autenticação                  │
│  useUser   → Perfil, permissões, impersonação               │
│  useToast  → Notificações na interface                       │
├─────────────────────────────────────────────────────────────┤
│                      SUPABASE                                │
│  Auth      → Login/Registro/Sessão                          │
│  Database  → PostgreSQL com RLS                             │
│  Storage   → (futuro) Arquivos e imagens                    │
└─────────────────────────────────────────────────────────────┘
```

### Fluxo de Autenticação

1. Usuário faz login via `/login`
2. `useAuth` chama Supabase Auth
3. Após autenticação, busca profile via `/api/auth/profile` (bypass RLS)
4. `useUser` determina permissões com base no `role` e `condo_id`
5. Sidebar e páginas filtram conteúdo conforme permissões

---

## 3. Módulos e Funcionalidades

### 3.1 Dashboard (`/dashboard`)

**Função:** Visão geral do condomínio com métricas principais.

**Componentes:**
- Cards de estatísticas (unidades, inadimplência, ocorrências, saldo)
- Gráficos de receita x despesa
- Lista de ocorrências recentes
- Avisos recentes

**Permissões:**
- Superadmin: Vê todos os condomínios
- Síndico: Vê apenas seu condomínio
- Morador: Dashboard simplificado

---

### 3.2 Financeiro (`/financeiro`)

**Função:** Gestão de receitas e despesas do condomínio.

**Recursos:**
- Criar lançamentos (receita/despesa)
- Editar lançamentos existentes ✅ **NOVO**
- Excluir lançamentos ✅ **NOVO**
- Filtrar por tipo e status
- Estatísticas de receitas, despesas e inadimplência

**Permissões:**
- Superadmin/Síndico: CRUD completo
- Morador: Apenas visualização dos seus lançamentos

---

### 3.3 Cobranças (`/cobrancas`)

**Função:** Criar e gerenciar cobranças para moradores.

**Recursos:**
- Criar nova cobrança
- Enviar link de pagamento por email
- Integração Mercado Pago (boleto, PIX, cartão)
- Cancelar cobranças

**API:** `/api/resident-billing`

---

### 3.4 Moradores (`/moradores`)

**Função:** Cadastro de moradores vinculados às unidades.

**Recursos:**
- Listar moradores do condomínio
- Associar morador à unidade
- Histórico de moradores

---

### 3.5 Unidades (`/unidades`)

**Função:** Gestão das unidades (apartamentos/casas).

**Recursos:**
- CRUD de unidades
- Bloco e número da unidade
- Vincular moradores

---

### 3.6 Usuários (`/usuarios`)

**Função:** Gerenciar usuários do sistema.

**Recursos:**
- Criar usuários (síndico, porteiro, morador)
- Editar dados e permissões
- Ativar/desativar usuários
- Enviar email de redefinição de senha

**API:** `/api/usuarios/create`

---

### 3.7 Avisos (`/avisos`)

**Função:** Mural de comunicados do condomínio.

**Recursos:**
- Criar avisos (título, descrição, prioridade)
- Visualizar avisos publicados
- Filtrar por categoria

---

### 3.8 Ocorrências (`/ocorrencias`)

**Função:** Registro de incidentes e solicitações.

**Recursos:**
- Abrir nova ocorrência
- Atribuir responsável
- Alterar status (aberta → em andamento → resolvida)
- Excluir ocorrências ✅ **NOVO**

**Permissões:**
- Síndico/Porteiro: CRUD completo
- Morador: Criar e ver suas ocorrências

---

### 3.9 Portaria Profissional (`/portaria`) ✅ **ATUALIZADO**

**Função:** Dashboard avançado de controle de visitantes.

**Recursos:**
- Dashboard em tela cheia (modo fullscreen)
- Entrada/saída rápida com um clique
- Captura de foto via webcam
- Impressão de crachá de visitante
- Busca por CPF, placa ou nome
- Histórico em tempo real (atualização automática)
- Estatísticas: visitantes ativos, entregas, prestadores

---

### 3.10 Reservas de Áreas Comuns (`/reservas`) ✅ **NOVO**

**Função:** Sistema completo de reserva de salões, churrasqueiras e áreas.

**Recursos:**
- CRUD de áreas comuns (síndico)
- Calendário interativo com visualização mensal
- Reserva com horário início/fim
- Verificação automática de conflitos
- Fluxo de aprovação (automático ou manual)
- Taxa opcional por reserva
- Regras personalizadas por área

**APIs:** `/api/common-areas`, `/api/reservations`  
**SQL:** `sql/reservations_module.sql`

---

### 3.11 Relatórios (`/relatorios`) ✅ **NOVO**

**Função:** Exportação de relatórios profissionais em PDF e Excel.

**Tipos de Relatório:**
- Financeiro (receitas/despesas)
- Cobranças de moradores
- Ocorrências
- Moradores/Usuários
- Unidades

**Recursos:**
- Filtro por período
- Cabeçalho profissional com logo
- Download em PDF (jsPDF) ou Excel (XLSX)

---

### 3.12 Assinatura (`/assinatura`)

**Função:** Gerenciar assinatura do condomínio na plataforma.

**Recursos:**
- Visualizar plano atual
- Gerar pagamento (cartão, boleto)
- PIX estático com chave fixa
- Botão WhatsApp para enviar comprovante

---

### 3.13 Admin - Painel Geral (`/admin`)

**Função:** Visão global para Superadmin.

**Recursos:**
- Dashboard com métricas globais
- MRR, total de condomínios, usuários
- Gráficos de crescimento

---

### 3.14 Admin - Condomínios (`/admin/condominios`)

**Função:** Gerenciar todos os condomínios.

**Recursos:**
- Listar todos os condomínios
- Excluir condomínio (com cascade delete de dependências)

**API:** `/api/admin/condos` (DELETE com cascade)

---

### 3.15 Admin - Planos (`/admin/planos`)

**Função:** Criar e editar planos de assinatura.

---

### 3.16 Admin - Usuários (`/admin/usuarios`)

**Função:** Visualizar todos os usuários do sistema.

---

### 3.17 Admin - Assinaturas (`/admin/assinaturas`)

**Função:** Gerenciar assinaturas de todos os condomínios.

**Recursos:**
- Listar assinaturas
- Filtrar por status
- MRR com fallback automático
- Botão "Cobrar" para enviar notificação

---

### 3.18 Admin - Cobranças (`/admin/cobrancas`)

**Função:** Gerenciar cobranças de assinaturas.

**Recursos:**
- Botão "Nova Cobrança" para assinaturas ativas
- Seleção múltipla de assinaturas
- Envio de cobrança por email
- Estatísticas (total, pendentes, recebido)

**API:** `/api/admin/billing`, `/api/billing/send-invoice`

---

### 3.19 Status Geral (`/status`) ✅ **NOVO v5.2**

**Função:** Visão geral da saúde do sistema.

**Recursos:**
- Status de cada módulo (Financeiro, Cobranças, Portaria, Reservas, etc.)
- Alertas visuais (OK, Atenção, Erro)
- Ações rápidas para correção
- Atualização em tempo real

**Permissões:** Síndico e Superadmin

---

### 3.20 Central de Notificações (`/notificacoes`) ✅ **NOVO v5.2**

**Função:** Enviar comunicados multi-canal para moradores.

**Canais:**
- Push Notification
- WhatsApp
- Email
- Aviso Interno

**Destinatários:**
- Todos os moradores
- Bloco específico
- Unidade específica
- Porteiros

**Recursos:**
- Histórico de envios
- Estatísticas por canal

---

### 3.21 Automações de Inadimplência (`/automacoes`) ✅ **NOVO v5.2**

**Função:** Regras automáticas para cobranças atrasadas.

**Regras Configuráveis:**
- Lembrete após X dias
- Multa automática após Y dias
- Cobrança automática após Z dias
- Relatório mensal de inadimplentes

**Parâmetros:**
- Percentual de multa
- Juros diários
- Canais (WhatsApp/Email)

---

### 3.22 Módulo de Câmeras (`/portaria/cameras`) ✅ **NOVO v5.2**

**Função:** Visualização ao vivo de câmeras IP (sem gravação).

**Recursos:**
- Lista de câmeras com status
- Stream ao vivo (WebRTC/HLS)
- Captura de snapshots (TTL 24h)
- Validação de rede local obrigatória
- Probe de status (RTSP/ONVIF)

**Requisitos das Câmeras:**
- RTSP habilitado
- ONVIF Perfil S
- Codec H.264
- IP fixo, cabeada

**APIs:** `/api/cameras/*`  
**SQL:** `sql/cameras_module.sql`  
**Docs:** `docs/CAMERAS_MODULE.md`

---

### 3.23 Modo DEMO ✅ **NOVO v5.2**

**Função:** Ambiente de demonstração com dados fictícios.

**Recursos:**
- Botão "Entrar como Síndico DEMO" na tela de login
- Condomínio fictício pré-populado
- Reset automático diário

**Credenciais Demo:**
- Email: `sindico.demo@condofacil.com`
- Senha: `demo123456`

---

### 3.24 Admin - Painel de Erros (`/admin/erros`) ✅ **NOVO v5.2**

**Função:** Monitoramento de falhas do sistema.

**Recursos:**
- Log de erros em tempo real
- Prioridades (alta, média, baixa)
- Problemas de integridade (unidades sem morador, etc.)
- Ações rápidas para resolver

**Permissões:** Apenas Superadmin

---

### 3.25 Checklist de Implantação ✅ **NOVO v5.2**

**Função:** Guiar síndicos novos na configuração inicial.

**Exibição:** Dashboard (apenas síndicos, primeiros 30 dias)

**Tarefas Monitoradas:**
- Cadastrar unidades
- Cadastrar moradores
- Configurar financeiro
- Criar primeiro aviso

**Recursos:**
- Progresso automático
- Botão "Concluir Implantação"

---

### 3.26 Módulo de Mensageria e Encomendas (Portaria) ✅ **NOVO v5.1**

**Função:** Gestão completa de encomendas com notificações automáticas.

**Fluxo:**
1. Porteiro registra entrega (foto, dados, tracking).
2. Morador recebe WhatsApp/Email com link de confirmação.
3. Morador retira (status atualizado).
4. Ou: Porteiro registra devolução/cancelamento.

**Recursos:**
- Registro de entregas com foto
- Notificações multicanal (WhatsApp/Email)
- Worker de envio em background com retry
- Confirmação de retirada pelo morador (link seguro)
- Dashboard da portaria com filtros

**APIs:** `/api/portaria/deliveries`
**SQL:** `sql/deliveries_module.sql`

---

### 3.28 Governança - Assembleias Digitais 3.0 (`/governanca/assembleias`) ✅ **ATUALIZADO v6.2**

**Função:** Sistema completo de assembleias digitais com votação formal, quórum, presença, auditoria e geração de ATA.

**Novidades v6.2:**
- ✅ **Votação Formal** - 1 voto por unidade, estilo WhatsApp
- ✅ **Controle de Presença** - Check-in com IP, user-agent, geolocalização
- ✅ **Tipos de Quórum** - Maioria simples, absoluta, 2/3, unanimidade, personalizado
- ✅ **Bloqueio de Inadimplentes** - Opcional, configurável por dias
- ✅ **Auditoria Completa** - Log de todas as ações
- ✅ **Geração de ATA** - Com hash SHA256 e QR code de verificação
- ✅ **Verificação Pública** - Endpoint para validar autenticidade da ATA

**Status da Assembleia:**
- `draft` - Rascunho (editável)
- `scheduled` - Agendada (convocação enviada)
- `open` - Aberta (votação em andamento)
- `voting_closed` - Votação encerrada (consolidando)
- `finalized` - Concluída (ata gerada)
- `cancelled` - Cancelada

**Recursos:**
- Criar assembleias com múltiplas pautas
- Configurar quórum por pauta
- Check-in de presença digital
- Votação A FAVOR / CONTRA / ABSTENÇÃO
- Cálculo automático de resultados
- Geração de ATA com hash SHA256
- QR Code para verificação pública
- Trilha de auditoria completa

**APIs:**
- `GET/POST /api/governanca/assembleias` - CRUD assembleias
- `GET/POST /api/governanca/assembleias/[id]/pautas` - CRUD pautas
- `POST /api/governanca/assembleias/[id]/pautas/[pautaId]/vote` - Votar
- `GET/POST /api/governanca/assembleias/[id]/presence` - Check-in
- `POST /api/governanca/assembleias/[id]/close` - Encerrar e gerar ATA
- `GET /api/governanca/assembleias/[id]/ata` - Obter ATA
- `GET /api/governanca/ata/verify/[hash]` - Verificação pública

**SQL Migration:** `sql/upgrade_governance_3.0_assembleia_digital.sql`

**Tabelas:**
- `assembly_pautas` - Pautas da assembleia
- `assembly_presences` - Presenças registradas
- `assembly_votes` - Votos formais (1 por unidade)
- `assembly_audit_logs` - Trilha de auditoria
- `assembly_atas` - Atas geradas com hash

---

### 3.29 Governança - Enquetes 2.1 (`/governanca/enquetes`) ✅ **ATUALIZADO v6.1**

**Função:** Sistema completo de votação estilo WhatsApp com múltiplas perguntas e gráficos.

**Novidades v6.1:**
- ✅ **Múltiplas Perguntas por Enquete** - Crie enquetes com várias perguntas
- ✅ **Form Builder Dinâmico** - Interface visual para construir perguntas e opções
- ✅ **Pizza Charts (Gráficos)** - Visualização de resultados com gráficos de pizza (recharts)
- ✅ **Respostas Discursivas** - Além de múltipla escolha, agora aceita respostas de texto
- ✅ **Um Voto por Unidade** - Opção para limitar votação por unidade
- ✅ **Período de Votação** - Configurar data início/fim

**Tipos de Pergunta:**
- `single_choice` - Múltipla escolha (única resposta)
- `text` - Texto discursivo livre

**Recursos:**
- Criar enquetes com Form Builder visual
- Adicionar/remover perguntas dinamicamente
- Adicionar/remover opções de resposta
- Configurar tipo de cada pergunta
- Votar em enquetes ativas
- Visualizar resultados em tempo real com Pizza Charts 🍕
- Histórico de votações
- RLS policies para segurança

**Permissões:** Todos podem votar, Síndico cria enquetes

**APIs:** 
- `/api/governanca/enquetes` (GET/POST)
- `/api/governanca/enquetes/[id]` (GET - detalhes com perguntas)
- `/api/governanca/enquetes/vote` (POST - votar)

**SQL Migrations:** 
- `sql/upgrade_governance_2.0.sql` - Estrutura base
- `sql/upgrade_governance_2.1_polls.sql` - Tabelas: `enquete_questions`, `enquete_options`, `enquete_answers`
- `sql/fix_visibility_and_seed.sql` - RLS e dados de exemplo

---

### 3.30 Governança - Documentos (`/governanca/documents`) ✅ **NOVO v6.0**

**Função:** Repositório digital de documentos do condomínio.

**Recursos:**
- Upload de documentos (regimento, atas, contratos)
- Categorização (regimento, ata, contrato, financeiro, outro)
- Pastas organizacionais
- Controle de acesso por perfil
- Histórico de uploads

**Permissões:** Síndico faz upload, todos visualizam

**APIs:** `/api/governanca/documents`  
**SQL:** `sql/create_governance_tables.sql`

---

### 3.31 Manutenção Preventiva (`/manutencao`) ✅ **NOVO v6.0**

**Função:** Gestão de equipamentos e manutenções programadas.

**Recursos:**
- Cadastro de equipamentos (elevador, bomba, extintor, portão)
- Agendamento de manutenções (mensal, trimestral, anual)
- Controle de status (ativo, inativo, em manutenção)
- Histórico de manutenções realizadas
- Alertas de manutenção próxima

**Tipos de Equipamento:**
- Elevador
- Bomba de água
- Extintor
- Portão automático
- Outros

**Permissões:** Síndico e Superadmin

**APIs:** `/api/manutencao/equipments`, `/api/manutencao/schedule`  
**SQL:** `sql/create_governance_tables.sql`

---

### 3.32 Checklist de Implantação ✅ **NOVO v5.2**

**Itens Críticos para Produção:**

- [ ] **Migrations Aplicadas:** Executar `sql/deliveries_module.sql` no Supabase.
- [ ] **Bucket Supabase:** Criar bucket `delivery-photos` (público ou autenticado).
- [ ] **Worker Ativo:** Configurar Cron Job para `/api/cron/process-notifications` (ex: a cada 1 min).
- [ ] **Credenciais:** Configurar SMTP e WhatsApp Token nas variáveis de ambiente.
- [ ] **UI Validada:** Verificar telas de listagem e cadastro em Mobile e Desktop.
- [ ] **E2E Testado:** Rodar `/api/test/messaging-flow`.
- [ ] **Logs:** Monitorar `system_logs` para falhas de envio.

---

## 4. Estrutura de Arquivos

```
src/
├── app/
│   ├── (dashboard)/           # Páginas autenticadas
│   │   ├── dashboard/
│   │   ├── financeiro/
│   │   ├── cobrancas/
│   │   ├── moradores/
│   │   ├── unidades/
│   │   ├── usuarios/
│   │   ├── avisos/
│   │   ├── ocorrencias/
│   │   ├── portaria/
│   │   ├── assinatura/
│   │   └── perfil/
│   ├── (public)/              # Páginas públicas
│   │   ├── landing/
│   │   ├── login/
│   │   └── register/
│   ├── admin/                 # Painel Superadmin
│   │   ├── page.tsx           # Dashboard admin
│   │   ├── condominios/
│   │   ├── planos/
│   │   ├── usuarios/
│   │   ├── assinaturas/
│   │   └── cobrancas/         # ✅ NOVO
│   └── api/                   # API Routes
│       ├── auth/profile/      # ✅ NOVO - Busca profile bypass RLS
│       ├── admin/billing/     # ✅ NOVO - Cobranças admin
│       ├── checkout/
│       ├── resident-billing/
│       ├── usuarios/
│       ├── impersonate/
│       └── webhooks/
├── components/
│   ├── ui/                    # Componentes base (Button, Card, etc)
│   ├── shared/                # Sidebar, Header, Layout
│   └── admin/                 # Componentes do painel admin
├── hooks/
│   ├── useAuth.tsx            # Autenticação e sessão
│   └── useUser.ts             # Permissões e perfil
├── lib/
│   ├── supabase/
│   │   ├── client.ts          # Cliente browser
│   │   ├── server.ts          # Cliente server
│   │   └── admin.ts           # Cliente admin (bypass RLS)
│   └── utils.ts               # Funções utilitárias
└── types/
    └── database.ts            # Tipos TypeScript
```

---

## 5. APIs do Sistema

### Autenticação

| Endpoint | Método | Descrição |
|----------|--------|-----------|
| `/api/auth/profile` | GET | Busca profile do usuário (bypass RLS) ✅ **NOVO** |

### Cobranças

| Endpoint | Método | Descrição |
|----------|--------|-----------|
| `/api/resident-billing` | GET | Lista cobranças |
| `/api/resident-billing` | POST | Cria nova cobrança |
| `/api/resident-billing` | DELETE | Cancela cobrança |
| `/api/admin/billing` | GET | Lista todas cobranças (admin) ✅ **NOVO** |
| `/api/admin/billing` | DELETE | Cancela cobrança (admin) ✅ **NOVO** |

### Checkout/Pagamentos

| Endpoint | Método | Descrição |
|----------|--------|-----------|
| `/api/checkout` | POST | Gera pagamento Mercado Pago |
| `/api/webhooks/mercadopago` | POST | Webhook de confirmação |

### Usuários

| Endpoint | Método | Descrição |
|----------|--------|-----------|
| `/api/usuarios/create` | POST | Cria novo usuário |

### Impersonação

| Endpoint | Método | Descrição |
|----------|--------|-----------|
| `/api/impersonate` | POST | Inicia impersonação |
| `/api/impersonate` | DELETE | Encerra impersonação |

### Mensageria e Encomendas (Portaria) ✅ **NOVO v5.1**

| Endpoint | Método | Descrição |
|----------|--------|-----------|
| `/api/portaria/deliveries` | GET | Lista entregas (filtros: condo, status, unit) |
| `/api/portaria/deliveries` | POST | Cria nova entrega |
| `/api/portaria/deliveries/[id]/confirm` | POST | Confirmação de retirada |
| `/api/portaria/deliveries/[id]/return` | POST | Registrar devolução |
| `/api/cron/process-notifications` | GET | Worker de envio de notificações |

### Governança ✅ **NOVO v6.0**

| Endpoint | Método | Descrição |
|----------|--------|-----------|
| `/api/governanca/assembleias` | GET | Lista assembleias do condomínio |
| `/api/governanca/assembleias` | POST | Cria nova assembleia (síndico) |
| `/api/governanca/enquetes` | GET | Lista enquetes ativas e encerradas |
| `/api/governanca/enquetes` | POST | Cria nova enquete (síndico) |
| `/api/governanca/enquetes/[id]/vote` | POST | Registra voto em enquete |
| `/api/governanca/documents` | GET | Lista documentos do condomínio |
| `/api/governanca/documents` | POST | Upload de documento (síndico) |

### Assembleia Digital 3.0 ✅ **NOVO v6.2**

| Endpoint | Método | Descrição |
|----------|--------|-----------|
| `/api/governanca/assembleias/[id]/pautas` | GET | Lista pautas da assembleia |
| `/api/governanca/assembleias/[id]/pautas` | POST | Cria nova pauta (síndico) |
| `/api/governanca/assembleias/[id]/pautas/[pautaId]/vote` | POST | Vota em uma pauta |
| `/api/governanca/assembleias/[id]/presence` | GET | Lista presenças |
| `/api/governanca/assembleias/[id]/presence` | POST | Check-in de presença |
| `/api/governanca/assembleias/[id]/close` | POST | Encerra assembleia e gera ATA |
| `/api/governanca/assembleias/[id]/ata` | GET | Obtém ATA gerada |
| `/api/governanca/ata/verify/[hash]` | GET | Verificação pública da ATA |

### Manutenção ✅ **NOVO v6.0**

| Endpoint | Método | Descrição |
|----------|--------|-----------|
| `/api/manutencao/equipments` | GET | Lista equipamentos cadastrados |
| `/api/manutencao/equipments` | POST | Cadastra novo equipamento |
| `/api/manutencao/schedule` | POST | Agenda manutenção preventiva |

---

## 6. Autenticação e Permissões (RBAC)

### Tabela de Permissões

| Recurso | SUPERADMIN | Síndico | Porteiro | Morador |
|---------|:----------:|:-------:|:--------:|:-------:|
| Acesso Global | ✅ | ❌ | ❌ | ❌ |
| Financeiro (CRUD) | ✅ | ✅ | ❌ | Ver próprios |
| Cobranças | ✅ | ✅ | ❌ | Ver próprias |
| Usuários | ✅ | ✅ | ❌ | ❌ |
| Unidades | ✅ | ✅ | Ver | ❌ |
| Ocorrências | ✅ | ✅ | ✅ | Criar/Ver |
| Portaria | ✅ | ✅ | ✅ | ❌ |
| Impersonação | ✅ | ❌ | ❌ | ❌ |

### Hooks de Autorização

**useAuth:** Gerencia sessão do Supabase Auth
- `signIn`, `signUp`, `signOut`
- `resetPassword`
- `profile` do usuário

**useUser:** Permissões e helpers
- `isSuperAdmin`, `isSindico`, `isPorteiro`, `isMorador`
- `condoId` do usuário
- `isImpersonating` (se admin está acessando como outro)

---

## 7. Banco de Dados e RLS

### Row Level Security (RLS)

O sistema usa funções `SECURITY DEFINER` para evitar recursão nas policies:

```sql
-- Funções helper (executam como superuser)
CREATE FUNCTION get_my_role() RETURNS TEXT ...
CREATE FUNCTION get_my_condo_id() RETURNS UUID ...
CREATE FUNCTION get_my_unidade_id() RETURNS UUID ...

-- Exemplo de policy
CREATE POLICY "sindico_access" ON financial_entries
FOR ALL USING (
  get_my_role() = 'sindico' AND get_my_condo_id() = condo_id
);
```

### Tabelas com RLS

- `users` - Perfis de usuário
- `condos` - Condomínios
- `units` - Unidades
- `residents` - Moradores
- `financial_entries` - Lançamentos financeiros
- `resident_invoices` - Cobranças
- `notices` - Avisos
- `occurrences` - Ocorrências
- `visitors` - Visitantes
- `subscriptions` - Assinaturas
- `payments` - Pagamentos
- `notifications` - Notificações
- `plans` - Planos (público para leitura)
- `deliveries` - Entregas e Encomendas ✅ **NOVO v5.1**
- `delivery_notifications` - Log de envios de mensageria ✅ **NOVO v5.1**
- `assembleias` - Assembleias do condomínio ✅ **NOVO v6.0**
- `enquetes` - Enquetes e votações ✅ **NOVO v6.0**
- `enquete_votes` - Votos nas enquetes ✅ **NOVO v6.0**
- `enquete_questions` - Perguntas das enquetes ✅ **NOVO v6.1**
- `enquete_options` - Opções de resposta ✅ **NOVO v6.1**
- `enquete_answers` - Respostas dos usuários ✅ **NOVO v6.1**
- `governance_documents` - Documentos de governança ✅ **NOVO v6.0**
- `manutencao_equipments` - Equipamentos para manutenção ✅ **NOVO v6.0**
- `manutencao_schedule` - Agendamentos de manutenção ✅ **NOVO v6.0**
- `assembly_pautas` - Pautas de assembleia ✅ **NOVO v6.2**
- `assembly_presences` - Presenças em assembleia ✅ **NOVO v6.2**
- `assembly_votes` - Votos formais ✅ **NOVO v6.2**
- `assembly_audit_logs` - Auditoria de assembleia ✅ **NOVO v6.2**
- `assembly_atas` - Atas com hash SHA256 ✅ **NOVO v6.2**

---

## 8. Correções Recentes (11/12/2024)

### 🔴 Críticas

**1. Erros de Build do Vercel**
- **Problema:** Build falhava com erros de compilação do diretório mobile e imports não resolvidos
- **Causa:** Next.js tentando compilar código React Native e Select components não exportados
- **Solução:** 
  - Configurado Next.js para ignorar pasta mobile no webpack
  - Desabilitado ESLint durante build (roda separadamente)
  - Removidos imports não utilizados
- **Arquivos:** `next.config.ts`, `eslint.config.mjs`

**2. Loading infinito na página de Assinatura**
- **Problema:** Página ficava carregando eternamente quando não havia assinatura
- **Causa:** `.single()` lançava erro quando não encontrava assinatura
- **Solução:** Mudado para `.maybeSingle()` e adicionado try-catch-finally
- **Arquivo:** `/app/(dashboard)/assinatura/page.tsx`

**3. Botões de Governança não funcionavam**
- **Problema:** Cadastro de assembleias, enquetes e documentos não funcionava
- **Causa:** APIs usando nomes de tabelas incorretos (governanca_* em vez de nomes corretos)
- **Solução:** 
  - Corrigido `governanca_assembleias` → `assembleias`
  - Corrigido `governanca_enquetes` → `enquetes`
  - Corrigido `governanca_documents` → `governance_documents`
- **Arquivos:** `/api/governanca/*/route.ts`

**4. Regressão de Autenticação**
- **Problema:** Após merge, usuários não conseguiam fazer login
- **Causa:** Arquivo `auth.ts` quebrado importado do merge com função inexistente
- **Solução:** 
  - Deletado arquivo `src/lib/auth.ts`
  - Substituído todas as importações por `createClient` direto
  - Corrigidas todas as APIs de governança e manutenção
- **Arquivos:** Todos os arquivos de API de governança

**5. Tabelas de Governança não existiam**
- **Problema:** SQL falhava ao popular dados de exemplo
- **Causa:** Tabelas não haviam sido criadas no banco
- **Solução:** Criado script completo de migração com RLS
- **Arquivo:** `sql/create_governance_tables.sql`

### 🟢 Correções Anteriores (10/12/2024)

**1. Logout ao atualizar página / trocar perfil**
- **Problema:** Usuário era deslogado ao navegar ou atualizar
- **Causa:** `fetchProfile` em `useAuth` usava cliente RLS que bloqueava leitura
- **Solução:** Criado `/api/auth/profile` que usa `supabaseAdmin` para bypass RLS
- **Arquivos:** `src/hooks/useAuth.tsx`, `src/app/api/auth/profile/route.ts`

**2. "Não Autorizado" ao criar cobrança como síndico**
- **Causa:** API `/api/resident-billing` consultava profile via cliente RLS
- **Solução:** Alterado para usar `supabaseAdmin` em todas as queries
- **Arquivo:** `src/app/api/resident-billing/route.ts`

**3. RLS recursivo bloqueando queries**
- **Causa:** Policies faziam `SELECT FROM users` dentro de policy de `users`
- **Solução:** Criadas funções `SECURITY DEFINER` (get_my_role, get_my_condo_id)
- **Arquivo:** `sql/fix_rls_users.sql`

### 🟡 Funcionalidades Adicionadas

**1. Módulo de Governança Completo** ✅ **v6.0**
- Assembleias digitais
- Sistema de enquetes com votação
- Repositório de documentos
- RLS policies configuradas
- Scripts SQL de criação e seed

**2. Módulo de Manutenção Preventiva** ✅ **v6.0**
- Cadastro de equipamentos
- Agendamento de manutenções
- Controle de status
- Histórico de manutenções

**3. Editar/Excluir lançamentos financeiros**
- Síndico agora pode editar e excluir lançamentos no `/financeiro`
- Arquivo: `src/app/(dashboard)/financeiro/page.tsx`

**4. Excluir ocorrências**
- Síndico/Porteiro pode excluir ocorrências
- Arquivo: `src/app/(dashboard)/ocorrencias/page.tsx`

**5. PIX estático na assinatura**
- Chave PIX fixa exibida na página
- Botão "Copiar" para facilitar
- Botão WhatsApp para enviar comprovante
- Arquivo: `src/app/(dashboard)/assinatura/page.tsx`

**6. Painel Admin - Cobranças**
- Nova página `/admin/cobrancas` para superadmin
- Lista todas cobranças de moradores do sistema
- Estatísticas e filtros
- Arquivos: `src/app/admin/cobrancas/page.tsx`, `src/app/api/admin/billing/route.ts`

---

## 9. Roadmap e Melhorias Futuras

### ✅ Implementado (v5.1 - 11/12/2024)
- [x] Reservas de áreas comuns (calendário, aprovação, conflitos)
- [x] PWA (manifest, service worker, install banner)
- [x] Relatórios PDF/Excel (financeiro, cobranças, ocorrências, moradores)
- [x] Portaria Profissional (tela cheia, foto, crachá, busca)
- [x] WhatsApp (templates de mensagens, links automáticos)
- [x] Landing page "Implantação em 7 dias" (`/implantacao`)
- [x] Notificações push (service worker configurado)
- [x] Encomendas na portaria (Mensageria, notificações, confirmação)
- [x] Módulo de Câmeras IP (Visualização em tempo real)

### 🔜 Próximas Entregas
- [ ] App Mobile (React Native/Expo)
- [ ] Tour guiado para novos usuários
- [ ] Integração nativa WhatsApp Business API (atualmente mock)

---

**© 2024 Nodex Soluções - Todos os direitos reservados.**

