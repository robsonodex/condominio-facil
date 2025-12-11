# Condomínio Fácil - Documentação Oficial Unificada

**Versão:** 5.2  
**Data:** 11 de Dezembro de 2024  
**Status:** ✅ Estável / Pronto para Lançamento  
**Última Atualização:** 11/12/2024 14:40

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

---

## 8. Correções Recentes (10/12/2024)

### 🔴 Críticas

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

**1. Editar/Excluir lançamentos financeiros**
- Síndico agora pode editar e excluir lançamentos no `/financeiro`
- Arquivo: `src/app/(dashboard)/financeiro/page.tsx`

**2. Excluir ocorrências**
- Síndico/Porteiro pode excluir ocorrências
- Arquivo: `src/app/(dashboard)/ocorrencias/page.tsx`

**3. PIX estático na assinatura**
- Chave PIX fixa exibida na página
- Botão "Copiar" para facilitar
- Botão WhatsApp para enviar comprovante
- Arquivo: `src/app/(dashboard)/assinatura/page.tsx`

**4. Painel Admin - Cobranças**
- Nova página `/admin/cobrancas` para superadmin
- Lista todas cobranças de moradores do sistema
- Estatísticas e filtros
- Arquivos: `src/app/admin/cobrancas/page.tsx`, `src/app/api/admin/billing/route.ts`

---

## 9. Roadmap e Melhorias Futuras

### ✅ Implementado (v5.0 - 11/12/2024)
- [x] Reservas de áreas comuns (calendário, aprovação, conflitos)
- [x] PWA (manifest, service worker, install banner)
- [x] Relatórios PDF/Excel (financeiro, cobranças, ocorrências, moradores)
- [x] Portaria Profissional (tela cheia, foto, crachá, busca)
- [x] WhatsApp (templates de mensagens, links automáticos)
- [x] Landing page "Implantação em 7 dias" (`/implantacao`)
- [x] Notificações push (service worker configurado)

### 🔜 Próximas Entregas
- [ ] App Mobile (React Native/Expo)
- [ ] Encomendas na portaria
- [ ] Integração com câmeras IP
- [ ] Tour guiado para novos usuários
- [ ] Modo demonstração para vendas

---

**© 2024 Nodex Soluções - Todos os direitos reservados.**

