# Condomínio Fácil - Documentação Técnica Completa

**Versão:** 2.0  
**Última Atualização:** Dezembro 2024

---

## 📚 Índice

1. [Visão Geral](#1-visão-geral)
2. [Stack Tecnológico](#2-stack-tecnológico)
3. [Estrutura do Projeto](#3-estrutura-do-projeto)
4. [Papéis de Usuário](#4-papéis-de-usuário)
5. [Configuração](#5-configuração)
6. [Funcionalidades Principais](#6-funcionalidades-principais)
7. [Integrações](#7-integrações)
8. [APIs Disponíveis](#8-apis-disponíveis)
9. [Banco de Dados](#9-banco-de-dados)
10. [Sistema de E-mails](#10-sistema-de-e-mails)
11. [Sistema Legal (LGPD)](#11-sistema-legal-lgpd)
12. [Sistema de Suporte](#12-sistema-de-suporte)
13. [Sistema de Aluguéis](#13-sistema-de-aluguéis)
14. [Deploy](#14-deploy)
15. [Manutenção e Monitoramento](#15-manutenção-e-monitoramento)
16. [Testes](#16-testes)
17. [Referências](#17-referências)

---

## 1. Visão Geral

**Condomínio Fácil** é uma plataforma SaaS completa para gestão de condomínios com as seguintes capacidades:

### Recursos Principais
- ✅ **Dashboard Executivo** com métricas em tempo real
- ✅ **Gestão de Moradores** e unidades
- ✅ **Controle Financeiro** completo
- ✅ **Sistema de Aluguéis** com geração automática de boletos
- ✅ **Portaria Digital** com registro de visitantes
- ✅ **Ocorrências** e comunicados
- ✅ **Pagamentos Online** via Mercado Pago (PIX, cartão, boleto)
- ✅ **E-mails Transacionais** automáticos
- ✅ **Sistema de Suporte** com tickets e SLA
- ✅ **Conformidade Legal** com LGPD
- ✅ **Painel Administrativo** para gestão multi-condomínio

### Diferenciais
- 🚀 **Multi-tenant** - Suporta múltiplos condomínios
- 🔐 **Segurança** - Auth JWT, RLS, validação HMAC
- 📧 **Automação** - E-mails, cobranças, relatórios
- 💳 **Pagamentos** - Integração completa com Mercado Pago
- 📊 **Analytics** - Dashboards e métricas em tempo real
- 🏗️ **Escalável** - Arquitetura serverless na Vercel

---

##2. Stack Tecnológico

| Categoria | Tecnologia | Versão | Uso |
|-----------|------------|---------|-----|
| **Frontend** | Next.js | 16.0.7 | Framework React com SSR |
| | TypeScript | 5.x | Tipagem estática |
| | Tailwind CSS | 3.x | Estilização utility-first |
| | Recharts | 2.x | Gráficos e visualizações |
| **Backend** | Next.js API Routes | 16.x | APIs serverless |
| | Supabase | Latest | Database PostgreSQL + Auth |
| | PostgreSQL | 15.x | Banco de dados relacional |
| **Integrações** | Mercado Pago API | V1 | Gateway de pagamento |
| | Nodemailer | 6.x | Envio de e-mails SMTP |
| | Hostinger SMTP | - | Servidor de e-mail |
| **Deploy** | Vercel | Latest | Hospedagem e CI/CD |
| | GitHub | - | Controle de versão |
| **Automação** | pg_cron | Latest | Jobs agendados no PostgreSQL |
| **Segurança** | Supabase Auth | Latest | Autenticação JWT |
| | Row Level Security | - | Segurança em nível de linha |

### Dependências Principais

```json
{
  "@supabase/supabase-js": "^2.x",
  "next": "16.0.7",
  "react": "^19.x",
  "tailwindcss": "^3.x",
  "nodemailer": "^6.x",
  "recharts": "^2.x",
  "zod": "^3.x"
}
```

---

## 3. Estrutura do Projeto

```
condominio-facil/
├── src/
│   ├── app/
│   │   ├── (dashboard)/              # Páginas autenticadas (síndico/porteiro/morador)
│   │   │   ├── dashboard/            # Dashboard principal
│   │   │   ├── moradores/           # Gestão de moradores
│   │   │   ├── financeiro/          # Lançamentos financeiros
│   │   │   ├── avisos/              # Comunicados
│   │   │   ├── ocorrencias/         # Ocorrências
│   │   │   ├── unidades/            # Unidades/apartamentos
│   │   │   ├── usuarios/            # Usuários do condomínio
│   │   │   ├── portaria/            # Controle de visitantes
│   │   │   ├── relatorios/          # Relatórios
│   │   │   ├── suporte/             # ✨ NOVO: Sistema de tickets
│   │   │   └── contratos/           # ✨ NOVO: Contratos de aluguel
│   │   ├── (admin)/                 # Painel Super Admin
│   │   │   ├── usuarios/            # Todos os usuários
│   │   │   ├── condominios/         # Todos os condomínios
│   │   │   ├── assinaturas/         # Assinaturas e MRR
│   │   │   ├── planos/              # Planos
│   │   │   ├── emails/              # ✨ Logs de e-mail
│   │   │   ├── legal/               # ✨ NOVO: Aceites legais
│   │   │   └── metrics/             # Métricas gerais
│   │   ├── (public)/                # Páginas públicas
│   │   │   ├── page.tsx             # Landing page
│   │   │   ├── login/               # Login
│   │   │   ├── register/            # Registro
│   │   │   ├── checkout/            # Checkout Mercado Pago
│   │   │   ├── onboarding/          # ✨ NOVO: Aceite de documentos legais
│   │   │   ├── termos/              # Termos de uso
│   │   │   ├── privacidade/         # Política de privacidade
│   │   │   └── contrato/            # Contrato de serviço
│   │   └── api/
│   │       ├── checkout/            # Mercado Pago
│   │       ├── email/               # ✨ Envio de e-mails (melhorado)
│   │       │   └── resend/          # ✨ NOVO: Reenvio manual
│   │       ├── legal/               # ✨ NOVO: APIs de aceite legal
│   │       │   ├── accept/          # Registrar aceite
│   │       │   ├── check/           # Verificar aceite
│   │       │   └── documents/       # Listar documentos
│   │       ├── support/             # ✨ NOVO: Sistema de suporte
│   │       │   ├── tickets/         # CRUD de tickets
│   │       │   └── admin/           # Métricas de suporte
│   │       ├── onboard/             # Provisioning após pagamento
│   │       ├── webhooks/            # Webhooks Mercado Pago
│   │       ├── user/delete/         # Exclusão LGPD
│   │       └── contracts/rent/      # ✨ NOVO: Contratos de aluguel
│   ├── components/
│   │   └── ui/                      # Componentes reutilizáveis
│   ├── hooks/
│   │   ├── useAuth.tsx              # Hook de autenticação
│   │   └── useUser.tsx              # Hook de usuário
│   ├── lib/
│   │   ├── supabase/                # Clientes Supabase
│   │   ├── emails/                  # ✨ NOVO: Templates de email
│   │   │   ├── support-templates.ts # Templates de suporte
│   │   │   └── legal-templates.ts   # Templates legais
│   │   └── legal/                   # ✨ NOVO: Utilidades legais
│   └── middleware.ts                # Middleware de autenticação
├── supabase/
│   ├── migrations/
│   │   ├── schema.sql               # Schema principal
│   │   ├── saas_complete.sql        # Schema SaaS
│   │   ├── rental_system.sql        # ✨ NOVO: Sistema de aluguéis
│   │   ├── legal_acceptance_system.sql # ✨ NOVO: Sistema legal
│   │   └── support_system.sql       # ✨ NOVO: Sistema de suporte
│   └── config.toml                  # Configuração Supabase
├── legal/                           # ✨ NOVO: Documentos legais
│   ├── termos_de_uso.md
│   ├── politica_de_privacidade.md
│   ├── contrato_de_servico.md
│   └── politica_de_cobranca.md
├── test-email-api.js                # ✨ NOVO: Script de teste de e-mail
├── EMAIL_SETUP.md                   # ✨ NOVO: Guia de configuração de e-mail
├── SUPPORT_SYSTEM.md                # ✨ NOVO: Manual do sistema de suporte
├── DOCUMENTATION.md                  # Esta documentação
└── .env.local                        # Variáveis de ambiente
```

---

## 4. Papéis de Usuário

| Role | Acesso | Permissões |
|------|--------|-----------|
| **`superadmin`** | Painel admin completo | • Todos os condomínios<br>• Gestão de planos<br>• Logs e métricas globais<br>• Configurações do sistema |
| **`sindico`** | Dashboard + Admin parcial | • Gestão completa do condomínio<br>• Moradores e unidades<br>• Financeiro e relatórios<br>• Contratos de aluguel<br>• Tickets de suporte |
| **`porteiro`** | Dashboard limitado | • Portaria e visitantes<br>• Registro de ocorrências<br>• Visualização de avisos |
| **`morador`** | Dashboard básico | • Visualização de dados<br>• Criar ocorrências<br>• Abrir tickets de suporte<br>• Visualizar avisos |

### Hierarquia de Permissões

```
superadmin
    └── Acesso total (todos os condomínios)
        
sindico
    └── Acesso ao condomínio específico
        ├── Gestão financeira
        ├── Gestão de moradores
        ├── Contratos de aluguel
        └── Suporte técnico
        
porteiro
    └── Operações diárias
        ├── Portaria
        ├── Visitantes
        └── Ocorrências
        
morador
    └── Visualização e interação básica
        ├── Avisos
        ├── Ocorrências próprias
        └── Tickets de suporte
```

---

## 5. Configuração

### 5.1 Variáveis de Ambiente

Crie um arquivo `.env.local` na raiz do projeto:

```env
# ========================================
# Supabase Configuration
# ========================================
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...

# ========================================
# Application
# ========================================
NEXT_PUBLIC_APP_URL=https://meucondominiofacil.com

# ========================================
# Mercado Pago
# ========================================
MERCADOPAGO_ACCESS_TOKEN=APP_USR-xxx
MERCADOPAGO_PUBLIC_KEY=APP_USR-xxx
MERCADOPAGO_WEBHOOK_SECRET=your-webhook-secret

# ========================================
# SMTP Email (Hostinger) - ✨ CRÍTICO
# ========================================
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=465
SMTP_USER=noreply@meucondominiofacil.com
SMTP_PASS=your_email_password
SMTP_FROM="Condomínio Fácil <noreply@meucondominiofacil.com>"

# ========================================
# Security
# ========================================
WEBHOOK_SECRET=your-random-secret-string
```

### 5.2 Instalação

```bash
# Clone o repositório
git clone https://github.com/robsonodex/condominio-facil.git

# Instale as dependências
cd condominio-facil
npm install

# Configure as variáveis de ambiente
cp .env.example .env.local
# Edite .env.local com suas credenciais

# Execute as migrações do banco de dados
# (ver seção 9.2)

# Inicie o servidor de desenvolvimento
npm run dev
```

### 5.3 Banco de Dados - Ordem de Execução

Execute no Supabase SQL Editor **na ordem**:

1. `supabase/migrations/schema.sql` - Schema principal
2. `supabase/migrations/saas_complete.sql` - Sistema SaaS
3. `supabase/migrations/rental_system.sql` - ✨ Sistema de aluguéis
4. `supabase/migrations/legal_acceptance_system.sql` - ✨ Sistema legal
5. `supabase/migrations/support_system.sql` - ✨ Sistema de suporte

---

## 6. Funcionalidades Principais

### 6.1 Dashboard Executivo
- Métricas em tempo real (receitas, inadimplência, ocupação)
- Gráficos interativos (Recharts)
- Resumo financeiro mensal
- Alertas e notificações

### 6.2 Gestão de Moradores
- CRUD completo de moradores
- Vinculação a unidades
- Histórico de movimentações
- Dados de contato e documentos

### 6.3 Gestão Financeira
- Lançamentos de receitas e despesas
- Categorização automática
- Geração de relatórios
- Controle de inadimplência

### 6.4 Sistema de Aluguéis ✨ NOVO
- Criação de contratos de aluguel
- Cálculo automático de pró-rata
- Geração mensal de faturas
- Integração com Mercado Pago (boleto/PIX)
- Taxa de condomínio inclusa
- Multa e juros de atraso configuráveis
- Renovação automática de contratos

**Detalhes:** Ver seção [13. Sistema de Aluguéis](#13-sistema-de-aluguéis)

### 6.5 Sistema de Suporte ✨ NOVO
- Tickets de suporte multi-nível
- SLA configurável por prioridade
- Sistema de mensagens em tempo real
- Métricas de atendimento
- Alertas de SLA estourado
- Dashboard de suporte para admins

**Detalhes:** Ver seção [12. Sistema de Suporte](#12-sistema-de-suporte)

### 6.6 Sistema Legal (LGPD) ✨ NOVO
- Aceite obrigatório de documentos legais
- Registro de versões e hashes (SHA256)
- Captura de IP do usuário
- Onboarding legal pós-cadastro
- E-mail de confirmação automático
- Bloqueio de acesso sem aceite

**Detalhes:** Ver seção [11. Sistema Legal](#11-sistema-legal-lgpd)

### 6.7 Portaria Digital
- Registro de visitantes
- Controle de entrada/saída
- Autorização de moradores
- Histórico de acessos

### 6.8 Ocorrências
- Registro de ocorrências
- Categorização  (manutenção, segurança, etc)
- Anexo de fotos
- Acompanhamento de status

### 6.9 Comunicados
- Publicação de avisos
- Segmentação por público
- Priorização de mensagens
- Histórico de comunicações

---

## 7. Integrações

### 7.1 Mercado Pago

**Endpoint:** `/api/checkout`

**Request:**
```json
POST /api/checkout
{
  "condoId": "uuid",
  "valor": 99.90,
  "metodoPagamento": "pix|cartao|boleto",
  "email": "cliente@exemplo.com",
  "nome": "João Silva"
}
```

**Response:**
```json
{
  "success": true,
  "paymentUrl": "https://mercadopago.com.br/checkout/...",
  "pixCode": "00020126580014br.gov.bcb.pix...",
  "pixQrcode": "data:image/png;base64,iVBORw0KGgo..."
}
```

**Webhook:** `/api/webhooks/mercadopago`

**Funcionalidades:**
- ✅ Validação de assinatura HMAC-SHA256
- ✅ Processamento de pagamentos (approved, pending, rejected)
- ✅ Atualização de status de faturas
- ✅ Liberação automática de assinaturas
- ✅ Envio de e-mail de confirmação
- ✅ Proteção contra duplicatas (idempotência)
- ✅ Tratamento de chargeback e reembolsos

**Eventos tratados:**
- `approved` - Pagamento aprovado
- `pending` - Pagamento pendente
- `rejected` - Pagamento rejeitado
- `refunded` - Reembolso processado
- `charged_back` - Contestação de pagamento

### 7.2 SMTP (Hostinger)

Configuração para envio de e-mails transacionais.

**Servidor:** smtp.hostinger.com  
**Porta:** 465 (SSL)  
**Autenticação:** Obrigatória

**Ver:** [10. Sistema de E-mails](#10-sistema-de-e-mails) para detalhes completos.

---

## 8. APIs Disponíveis

### 8.1 Autenticação

```typescript
// Login
POST /api/auth/login
{ email, password }

// Register
POST /api/auth/register
{ email, password, nome }

// Logout
POST /api/auth/logout
```

### 8.2 E-mails ✨ MELHORADO

```typescript
// Enviar e-mail
POST /api/email
{
  tipo: "welcome|invoice|overdue|payment_confirmed|...",
  destinatario: "email@example.com",
  dados: { nome: "João", ... },
  condoId?: "uuid",
  userId?: "uuid",
  internalCall?: true  // ✨ NOVO: Bypass de autenticação
}

// Reenviar e-mail (manual) ✨ NOVO
POST /api/email/resend
{
  userId: "uuid",
  tipo: "welcome|payment_confirmed"
}
```

### 8.3 Legal (LGPD) ✨ NOVO

```typescript
// Registrar aceite
POST /api/legal/accept
{
  documentType: "terms|privacy|service_contract|billing",
  version: "1.0.0",
  ipAddress: "192.168.1.1"
}

// Verificar aceite
GET /api/legal/check

// Listar documentos
GET /api/legal/documents
```

### 8.4 Suporte ✨ NOVO

```typescript
// Criar ticket
POST /api/support/tickets
{
  subject: "Título do ticket",
  description: "Descrição detalhada",
  priority: "baixa|media|alta|critica"
}

// Listar tickets
GET /api/support/tickets?status=aberto&priority=alta

// Adicionar mensagem
POST /api/support/tickets/[id]/messages
{
  content: "Mensagem de resposta"
}

// Fechar ticket
POST /api/support/tickets/[id]/close
```

### 8.5 Contratos de Aluguel ✨ NOVO

```typescript
// Criar contrato
POST /api/contracts/rent
{
  unitId: "uuid",
  tenantName: "Nome do inquilino",
  rentAmount: 1500.00,
  condoFee: 300.00,
  startDate: "2024-01-01",
  endDate: "2024-12-31",
  paymentDay: 10
}

// Listar contratos
GET /api/contracts/rent?status=ativo

// Gerar fatura manual
POST /api/billing/send-invoice
{
  contractId: "uuid",
  referenceMonth: "2024-01"
}
```

### 8.6 Checkout e Pagamentos

```typescript
// Criar checkout
POST /api/checkout
{
  condoId: "uuid",
  valor: 99.90,
  metodoPagamento: "pix|cartao|boleto"
}

// Checkout de aluguel ✨ NOVO
POST /api/checkout/rent
{
  contractId: "uuid",
  invoiceId: "uuid"
}

// Gerar boleto ✨ NOVO
POST /api/checkout/boleto
{
  contractId: "uuid",
  amount: 1800.00
}

// Gerar PIX ✨ NOVO
POST /api/pix
{
  amount: 1800.00,
  description: "Aluguel Apto 101"
}
```

### 8.7 Usuários

```typescript
// Excluir usuário (LGPD)
DELETE /api/user/delete?id=uuid
// ou auto-exclusão:
DELETE /api/user/delete
{ confirmacao: "EXCLUIR MEUS DADOS" }
```

### 8.8 Admin

```typescript
// Métricas globais
GET /api/admin/metrics

// Logs de e-mail
GET /api/admin/emails?status=enviado&tipo=welcome

// Aceites legais
GET /api/admin/legal?accepted=true

// Métricas de suporte ✨ NOVO
GET /api/admin/support/metrics
```

---

## 9. Banco de Dados

### 9.1 Tabelas Principais

| Tabela | Descrição | Linhas Aprox |
|--------|-----------|--------------|
| `condos` | Condomínios cadastrados | Variável |
| `users` | Usuários do sistema | Variável |
| `units` | Unidades/apartamentos | 100-500/condo |
| `residents` | Moradores | 200-1000/condo |
| `financial_entries` | Lançamentos financeiros | Milhares |
| `notices` | Avisos e comunicados | Centenas |
| `occurrences` | Ocorrências registradas | Centenas |
| `visitors` | Controle de visitantes | Milhares |
| `plans` | Planos de assinatura | 3-5 |
| `subscriptions` | Assinaturas ativas | 1/condo |
| `invoices` | Faturas geradas | Milhares |
| `payment_logs` | Logs de pagamento | Milhares |
| `email_logs` | Logs de e-mails enviados | Dezenas de milhares |
| `legal_acceptances` | ✨ Aceites legais | 1-4/usuário |
| `support_tickets` | ✨  Tickets de suporte | Centenas |
| `support_messages` | ✨ Mensagens de tickets | Milhares |
| `rental_contracts` | ✨ Contratos de aluguel | Dezenas |
| `rent_invoices` | ✨ Faturas de aluguel | Centenas |

### 9.2 Esquema Completo de Dados

```sql
-- Ver arquivos:
-- supabase/migrations/schema.sql
-- supabase/migrations/saas_complete.sql
-- supabase/migrations/rental_system.sql
-- supabase/migrations/legal_acceptance_system.sql
-- supabase/migrations/support_system.sql
```

### 9.3 Funções SQL Importantes

#### Financeiro e Assinaturas
```sql
-- Verificar assinaturas vencidas
check_overdue_subscriptions() RETURNS void

-- Liberar assinatura após pagamento
release_subscription(p_condo_id UUID, p_meses INTEGER) RETURNS void

-- Gerar fatura mensal
generate_monthly_invoice(p_subscription_id UUID) RETURNS void

-- Suspender testes expirados
suspend_expired_trials() RETURNS void
```

#### Métricas e Admin
```sql
-- Métricas do painel admin
get_admin_metrics() RETURNS JSON

-- Atualizar lançamentos atrasados
update_overdue_financial_entries() RETURNS void
```

#### Usuários e Legal
```sql
-- Exclusão permanente (LGPD)
hard_delete_user(p_user_id UUID) RETURNS void

-- Anonimização de dados
delete_user_data(p_user_id UUID) RETURNS void

-- Verificar aceite de documentos ✨ NOVO
has_user_signed_required_documents(p_user_id UUID) RETURNS BOOLEAN
```

#### Sistema de Suporte ✨ NOVO
```sql
-- Calcular tempo de resposta SLA
calculate_sla_response_time(p_ticket_id UUID) RETURNS INTERVAL

-- Listar tickets com SLA estourado
get_breached_sla_tickets() RETURNS TABLE
```

#### Sistema de Aluguéis ✨ NOVO
```sql
-- gerar faturas de aluguel do mês
generate_monthly_rent_invoices() RETURNS void

-- Aplicar multa de atraso
apply_late_fees() RETURNS void

-- Enviar lembretes de pagamento
send_payment_reminders() RETURNS void
```

### 9.4 Índices Importantes

```sql
-- Performance em queries frequentes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_condo_id ON users(condo_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_email_logs_status ON email_logs(status);
CREATE INDEX idx_email_logs_created_at ON email_logs(created_at DESC);
CREATE INDEX idx_support_tickets_status ON support_tickets(status); -- ✨ NOVO
CREATE INDEX idx_rental_contracts_unit_id ON rental_contracts(unit_id); -- ✨ NOVO
```

### 9.5 Row Level Security (RLS)

**Política geral:**
- Tabela `users` - RLS **DESABILITADO** (evitar recursão)
- Demais tabelas - RLS **HABILITADO** com políticas por role

**Exemplo de política:**
```sql
CREATE POLICY "Moradores podem ver apenas seus dados"
ON residents
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()
  OR
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND role IN ('sindico', 'superadmin')
  )
);
```

---

## 10. Sistema de E-mails

### 10.1 Templates Disponíveis ✨ MELHORADOS

| Template | Quando é Enviado | Destinatário |
|----------|------------------|--------------|
| `welcome` | ✨ Após cadastro ou checkout | Novo usuário |
| `trial_ending` | X dias antes do fim do trial | Usuário em trial |
| `invoice` | Nova fatura gerada | Síndico/tesoureiro |
| `overdue` | Fatura em atraso | Síndico/tesoureiro |
| `blocked` | Acesso bloqueado por inadimplência | Síndico |
| `payment_confirmed` | ✨ Pagamento aprovado | Pagador |
| `support_new_ticket` | ✨ NOVO: Ticket criado | Usuário + Admin |
| `support_new_message` | ✨ NOVO: Nova mensagem no ticket | Autor do ticket |
| `support_ticket_closed` | ✨ NOVO: Ticket fechado | Autor do ticket |
| `support_sla_breached` | ✨ NOVO: SLA estourado | Equipe de suporte |
| `legal_acceptance_confirmed` | ✨ NOVO: Aceite registrado | Usuário |

### 10.2 Template Welcome ✨ MELHORADO

**Características:**
- ✅ HTML moderno com gradient header
- ✅ Design responsivo (mobile-first)
- ✅ Botão CTA destacado
- ✅ Próximos passos numerados
- ✅ Lista de funcionalidades
- ✅ Informação de suporte
- ✅ Conformidade com boas práticas de e-mail marketing

**Preview:**
```html
<!DOCTYPE html>
<html>
<body style="background-color: #f3f4f6">
  <div style="max-width: 600px; margin: 0 auto;">
    <!-- Header com gradient-->
    <div style="background: linear-gradient(135deg, #059669, #10b981);">
      <h1 style="color: #ffffff;">🏠 Condomínio Fácil</h1>
    </div>
    
    <!-- Conteúdo principal -->
    <div style="padding: 40px 30px;">
      <h2>Bem-vindo, {{nome}}!</h2>
      <p>Sua conta foi criada com sucesso! 🎉</p>
      
      <!-- Destaque do trial -->
      <div style="background: #ecfdf5; border-left: 4px solid #10b981;">
        ✨ Você tem 7 dias grátis para testar!
      </div>
      
      <!-- Botão CTA -->
      <a href="{{loginUrl}}" style="background: #10b981; color: #fff; padding: 16px 40px;">
        Acessar o Sistema →
      </a>
      
      <!-- Próximos passos -->
      <h3>📋 Próximos Passos:</h3>
      <ol>
        <li>Faça seu primeiro login</li>
        <li>Complete seu perfil</li>
        <li>Explore o sistema</li>
        <li>Escolha seu plano</li>
      </ol>
      
      <!-- Funcionalidades -->
      <h3>🚀 O que você pode fazer:</h3>
      <ul>
        <li>Gerenciar moradores e unidades</li>
        <li>Controlar finanças e gerar boletos</li>
        <li>Registrar ocorrências</li>
        <li>Acessar relatórios completos</li>
      </ul>
      
      <!-- Suporte -->
      <p>💬 Precisa de ajuda?<br>
      <a href="mailto:contato@meucondominiofacil.com">contato@meucondominiofacil.com</a></p>
    </div>
  </div>
</body>
</html>
```

### 10.3 Funcionalidades do Sistema de E-mail

**✨ Melhorias Implementadas:**

1. **Retry Logic Automático**
   - 3 tentativas com backoff exponencial (1s, 2s, 3s)
   - Log de cada tentativa
   - Não bloqueia operações críticas

2. **Autenticação Flexível**
   - Auth bypass para calls internas (`internalCall: true`)
   - Rate limiting para prevenir abuso
   - Sanitização de HTML

3. **Database Logging**
   - Todas as tentativas registradas em `email_logs`
   - Status detalhado (enviado, falhou, pendente)
   - Rastreamento de erro completo

4. **API de Reenvio Manual** ✨ NOVO
   - Endpoint: `/api/email/resend`
   - Permissões: superadmin ou sindico
   - Reenvio seguro com validação

### 10.4 Configuração SMTP

**Arquivo:** `EMAIL_SETUP.md`

**Passos:**
1. Criar conta de e-mail no Hostinger
2. Adicionar variáveis ao `.env.local`
3. Configurar variáveis na Vercel
4. Testar com `node test-email-api.js`

**Verificação:**
```sql
SELECT * FROM email_logs 
WHERE created_at > NOW() - INTERVAL '1 day'
ORDER BY created_at DESC;
```

**Monitoramento - Taxa de Sucesso:**
```sql
SELECT 
  status,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 2) as percentage
FROM email_logs
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY status;
```

---

## 11. Sistema Legal (LGPD)

### 11.1 Visão Geral

Sistema completo de aceite de documentos legais conforme LGPD.

**Documentos:**
1. Termos de Uso
2. Política de Privacidade
3. Contrato de Serviço
4. Política de Cobrança

### 11.2 Fluxo de Aceite

```mermaid
graph LR
    A[Novo Usuário] --> B[Cadastro]
    B --> C[Login]
    C --> D{Documentos Aceitos?}
    D -->|Não| E[/onboarding/aceite]
    E --> F{Usuário Aceita?}
    F -->|Sim| G[Registrar Aceite]
    F -->|Não| H[Logout + Mensagem]
    G --> I[Enviar Email]
    I --> J[Liberar Acesso]
    D -->|Sim| J
```

### 11.3 Tabela `legal_acceptances`

```sql
CREATE TABLE legal_acceptances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  condo_id UUID REFERENCES condos(id) ON DELETE SET NULL,
  document_type TEXT NOT NULL, -- 'terms', 'privacy', 'service_contract', 'billing'
  document_version TEXT NOT NULL DEFAULT '1.0.0',
  document_hash TEXT NOT NULL, -- SHA256 do conteúdo
  ip_address TEXT,
  accepted_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 11.4 Middleware de Validação

**Arquivo:** `src/middleware.ts`

**Lógica:**
```typescript
export async function middleware(request: NextRequest) {
  const session = await getSession();
  
  if (session && isProtectedRoute(request)) {
    const hasAccepted = await checkLegalAcceptances(session.user.id);
    
    if (!hasAccepted && !isOnboardingRoute(request)) {
      return NextResponse.redirect('/onboarding/aceite');
    }
  }
  
  return NextResponse.next();
}
```

### 11.5 APIs

```typescript
// Registrar aceite
POST /api/legal/accept
{
  documentType: "terms",
  version: "1.0.0",
  ipAddress: "192.168.1.1"
}

// Verificar se usuário aceitou todos
GET /api/legal/check
Response: { hasAccepted: true }

// Listar documentos pendentes
GET /api/legal/documents
Response: [{
  type: "terms",
  version: "1.0.0",
  required: true
}]
```

### 11.6 Conformidade LGPD

✅ **Registros obrigatórios:**
- Data e hora do aceite
- IP do usuário
- Versão do documento
- Hash SHA256 do conteúdo

✅ **Direitos do titular:**
- Acesso aos dados aceitos
- Solicitação de exclusão
- Portabilidade de dados

---

## 12. Sistema de Suporte

### 12.1 Visão Geral

Sistema completo de tickets de suporte com SLA, prioridades e métricas.

**Manual completo:** `SUPPORT_SYSTEM.md`

### 12.2 Funcionalidades

- ✅ Criação de tickets por usuários
- ✅ Sistema de mensagens em tempo real
- ✅ Prioridades (baixa, média, alta, crítica)
- ✅ SLA configurável por prioridade
- ✅ Alertas de SLA estourado
- ✅ Dashboard de métricas
- ✅ E-mails automáticos

### 12.3 Prioridades e SLA

| Prioridade | Tempo de Resposta | Tempo de Resolução |
|------------|-------------------|-------------------|
| **Crítica** | 1 hora | 4 horas |
| **Alta** | 4 horas | 1 dia |
| **Média** | 1 dia | 3 dias |
| **Baixa** | 3 dias | 7 dias |

### 12.4 Tabelas

```sql
-- Tickets
CREATE TABLE support_tickets (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  condo_id UUID,
  subject TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'aberto', -- aberto, em_andamento, resolvido, fechado
  priority TEXT DEFAULT 'media', -- baixa, media, alta, critica
  sla_breach_at TIMESTAMPTZ, -- Quando o SLA será estourado
  created_at TIMESTAMPTZ DEFAULT NOW(),
resolved_at TIMESTAMPTZ
);

-- Mensagens
CREATE TABLE support_messages (
  id UUID PRIMARY KEY,
  ticket_id UUID REFERENCES support_tickets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  is_internal BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 12.5 Métricas Disponíveis

```sql
-- Dashboard de suporte
SELECT 
  COUNT(*) FILTER (WHERE status = 'aberto') as tickets_abertos,
  COUNT(*) FILTER (WHERE status = 'resolvido') as tickets_resolvidos,
  COUNT(*) FILTER (WHERE sla_breach_at < NOW()) as sla_estourado,
  AVG(EXTRACT(EPOCH FROM (resolved_at - created_at))/3600)::NUMERIC as tempo_medio_resolucao_horas
FROM support_tickets
WHERE created_at > NOW() - INTERVAL '30 days';
```

---

## 13. Sistema de Aluguéis

### 13.1 Visão Geral

Sistema completo para gestão de contratos de aluguel com geração automática de faturas.

### 13.2 Funcionalidades

- ✅ Criação de contratos vinculados a unidades
- ✅ Cálculo de pró-rata (quando contrato não inicia dia 1)
- ✅ Geração automática de faturas mensais (pg_cron)
- ✅ Inclusão de taxa de condomínio
- ✅ Multa e juros de atraso configuráveis
- ✅ Integração com Mercado Pago (boleto/PIX)
- ✅ E-mails automáticos de cobrança

### 13.3 Tabelas

```sql
-- Contratos
CREATE TABLE rental_contracts (
  id UUID PRIMARY KEY,
  unit_id UUID REFERENCES units(id),
  condo_id UUID REFERENCES condos(id),
  tenant_name TEXT NOT NULL,
  rent_amount DECIMAL(10,2) NOT NULL,
  condo_fee DECIMAL(10,2),
  start_date DATE NOT NULL,
  end_date DATE,
  payment_day INTEGER DEFAULT 10,  status TEXT DEFAULT 'ativo', -- ativo, encerrado, inadimplente
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Faturas de aluguel
CREATE TABLE rent_invoices (
  id UUID PRIMARY KEY,
  contract_id UUID REFERENCES rental_contracts(id),
  reference_month DATE NOT NULL,
  rent_amount DECIMAL(10,2),
  condo_fee DECIMAL(10,2),
  late_fee DECIMAL(10,2) DEFAULT 0,
  total_amount DECIMAL(10,2),
  due_date DATE NOT NULL,
  status TEXT DEFAULT 'pendente', -- pendente, pago, atrasado, cancelado
  gateway_id TEXT,
  gateway_payment_id TEXT,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 13.4 Geração Automática de Faturas

**Job pg_cron:**
```sql
SELECT cron.schedule(
  'generate_monthly_rent_invoices',
  '0 1 1 * *', -- Dia 1 de cada mês às 01:00
  'SELECT generate_monthly_rent_invoices()'
);
```

**Função:**
```sql
CREATE OR REPLACE FUNCTION generate_monthly_rent_invoices()
RETURNS void AS $$
DECLARE
  contract RECORD;
BEGIN
  FOR contract IN 
    SELECT * FROM rental_contracts WHERE status = 'ativo'
  LOOP
    INSERT INTO rent_invoices (
      contract_id,
      reference_month,
      rent_amount,
      condo_fee,
      total_amount,
      due_date,
      status
    ) VALUES (
      contract.id,
      DATE_TRUNC('month', NOW()),
      contract.rent_amount,
      contract.condo_fee,
      contract.rent_amount + COALESCE(contract.condo_fee, 0),
      DATE_TRUNC('month', NOW()) + (contract.payment_day || ' days')::INTERVAL,
      'pendente'
    );
  END LOOP;
END;
$$ LANGUAGE plpgsql;
```

### 13.5 Checkout de Aluguel

```typescript
POST /api/checkout/rent
{
  contractId: "uuid",
  invoiceId: "uuid"
}

// Retorna link de pagamento Mercado Pago
Response: {
  success: true,
  paymentUrl: "https://mercadopago.com.br/...",
  pixCode: "00020126..."
}
```

---

## 14. Deploy

### 14.1 Vercel

1. **Conectar repositório GitHub**
   - Acesse vercel.com
   - Clique em "Import Project"
   - Selecione o repositório `condominio-facil`

2. **Configurar variáveis de ambiente**
   - Settings → Environment Variables
   - Adicione TODAS as variáveis do `.env.local`
   - Scope: Production, Preview, Development

3. **Deploy automático**
   - Cada push para `main` dispara novo deploy
   - Build time: ~2-3 minutos
   - Preview deployments para PRs

### 14.2 Variáveis Obrigatórias

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY

# App
NEXT_PUBLIC_APP_URL

# Mercado Pago
MERCADOPAGO_ACCESS_TOKEN
MERCADOPAGO_PUBLIC_KEY
MERCADOPAGO_WEBHOOK_SECRET

# SMTP (crítico para e-mails)
SMTP_HOST
SMTP_PORT
SMTP_USER
SMTP_PASS
SMTP_FROM
```

### 14.3 Checklist de Deploy

- [ ] Variáveis configuradas na Vercel
- [ ] Migrações executadas no Supabase
- [ ] pg_cron jobs agendados
- [ ] Webhook Mercado Pago configurado
- [ ] Domínio customizado configurado
- [ ] SMTP testado e funcionando
- [ ] Logs de erro monitorados

### 14.4 Monitoramento Pós-Deploy

```bash
# Verificar status do deploy
vercel ls

# Ver logs em tempo real
vercel logs --follow

# Rollback se necessário
vercel rollback
```

---

## 15. Manutenção e Monitoramento

### 15.1 Jobs Automáticos (pg_cron)

| Job | Frequência | Função | Status |
|-----|------------|--------|--------|
| `check_overdue_subscriptions` | Diário 01:00 | Verifica inadimplência | ✅ Ativo |
| `update_overdue_financial_entries` | Diário 02:00 | Marca att lançamentos atrasados | ✅ Ativo |
| `generate_monthly_invoices` | Diário 03:00 | Gera faturas SaaS | ✅ Ativo |
| `suspend_expired_trials` | Diário 04:00 | Suspende trials expirados | ✅ Ativo |
| `generate_monthly_rent_invoices` | ✨ Mensal dia 1 01:00 | Gera faturas de aluguel | ✅ Ativo |
| `apply_late_fees` | ✨ Diário 05:00 | Aplica multas de atraso | ✅ Ativo |
| `send_payment_reminders` | ✨ Diário 09:00 | Envia lembretes de pagamento | ✅ Ativo |

**Configurar:**
```sql
-- Verificar jobs ativos
SELECT * FROM cron.job;

-- Agendar novo job
SELECT cron.schedule(
  'nome_do_job',
  '0 1 * * *', -- Cron expression
  'SELECT minha_funcao()'
);

-- Desabilitar job
SELECT cron.unschedule('nome_do_job');
```

### 15.2 Painéis de Monitoramento

**Admin Dashboard (`/admin`):**
- MRR (Monthly Recurring Revenue)
- Churn rate
- Novos cadastros
- Taxa de inadimplência

**Email Logs (`/admin/emails`):**
- Taxa de entrega
- E-mails falhados
- Filtros por tipo e status
- Reenvio manual

**Legal Acceptances (`/admin/legal`):**
- Usuários sem aceite
- Histórico de aceites
- Versões de documentos

**Support Metrics** ✨ NOVO (`/admin/suporte/metrics`):**
- Tickets abertos
- SLA estourado
- Tempo médio de resolução
- Taxa de satisfação

### 15.3 Queries Úteis

**Receita Mensal (MRR):**
```sql
SELECT 
  DATE_TRUNC('month', ativada_em) as mes,
  SUM(valor_mensal_cobrado) as mrr
FROM subscriptions
WHERE status = 'ativo'
GROUP BY mes
ORDER BY mes DESC;
```

**Taxa de Inadimplência:**
```sql
SELECT 
  COUNT(*) FILTER (WHERE bloqueado = TRUE) * 100.0 / COUNT(*) as taxa_inadimplencia
FROM subscriptions;
```

**E-mails falhados (últimas 24h):**
```sql
SELECT destinatario, tipo, erro, created_at
FROM email_logs
WHERE status = 'falhou'
AND created_at > NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;
```

**Tickets com SLA estourado:**
```sql
SELECT id, subject, priority, sla_breach_at, created_at
FROM support_tickets
WHERE status IN ('aberto', 'em_andamento')
AND sla_breach_at < NOW()
ORDER BY sla_breach_at ASC;
```

### 15.4 Backup e Recuperação

**Supabase Auto-Backup:**
- Backups diários automáticos
- Retenção: 7 dias (planográtis) ou 30+ dias (plano pago)
- Restore via dashboard

**Backup Manual:**
```bash
# Exportar schema
pg_dump -h db.xxx.supabase.co -U postgres -s > schema_backup.sql

# Exportar dados
pg_dump -h db.xxx.supabase.co -U postgres -a > data_backup.sql
```

---

## 16. Testes

### 16.1 Teste de E-mail ✨ NOVO

```bash
# Executar teste local
node test-email-api.js

# Resultado esperado:
# ✅ Response Status: 200
# ✅ Status: enviado
# ✅ Attempts: 1
```

**Arquivo:** `test-email-api.js`

### 16.2 Teste de Registro

1. Abrir `http://localhost:3000/register`
2. Criar conta teste
3. Verificar:
   - ✅ Usuário criado no Supabase
   - ✅ E-mail recebido
   - ✅ Log em `email_logs`

### 16.3 Teste de Checkout

1. Criar conta de teste no Mercado Pago Sandbox
2. Configurar webhook test URL (ngrok)
3. Fazer checkout de teste
4. Verificar:
   - ✅ Pagamento aprovado
   - ✅ Subscription ativada
   - ✅ E-mail de confirmação

### 16.4 Teste de Suporte ✨ NOVO

1. Criar ticket via `/suporte`
2. Adicionar mensagem
3. Verificar:
   - ✅ Ticket criado
   - ✅ E-mail enviado
   - ✅ SLA calculado corretamente

### 16.5 Teste de Legal ✨ NOVO

1. Criar usuário novo
2. Fazer login
3. Verificar redirecionamento para `/onboarding/aceite`
4. Aceitar documentos
5. Verificar:
   - ✅ Registro em `legal_acceptances`
   - ✅ E-mail de confirmação
   - ✅ Acesso liberado

---

## 17. Referências

### 17.1 Documentos Relacionados

| Arquivo | Descrição |
|---------|-----------|
| `EMAIL_SETUP.md` | ✨ Guia completo de configuração SMTP |
| `SUPPORT_SYSTEM.md` | ✨ Manual do sistema de suporte |
| `BUILD_FIX_STATUS.md` | ✨ Status de correções de build |
| `MANUAL_COMPLETO.md` | Manual do usuário final |
| `VENDAS.md` | Scripts e guias de vendas |
| `DEPLOY.md` | Guia detalhado de deploy |

### 17.2 Migrações SQL

Executar na ordem:
1. `supabase/migrations/schema.sql`
2. `supabase/migrations/saas_complete.sql`
3. `supabase/migrations/rental_system.sql` ✨
4. `supabase/migrations/legal_acceptance_system.sql` ✨
5. `supabase/migrations/support_system.sql` ✨

### 17.3 Links Úteis

- **Supabase Dashboard:** https://supabase.com/dashboard
- **Vercel Dashboard:** https://vercel.com/dashboard
- **Mercado Pago Developers:** https://www.mercadopago.com.br/developers
- **Next.js Docs:** https://nextjs.org/docs
- **Hostinger SMTP:** https://www.hostinger.com.br

### 17.4 Suporte

**Desenvolvimento:**
- Email: contato@meucondominiofacil.com
- GitHub Issues: https://github.com/robsonodex/condominio-facil/issues

**Produção:**
- Suporte: support@meucondominiofacil.com
- Emergências: WhatsApp configurado

---

## 18. Changelog

### Versão 2.0 (Dezembro 2024) ✨

**Novidades:**
- ✅ Sistema de E-mails aprimorado com retry logic e templates modernos
- ✅ Sistema Legal completo (LGPD)
- ✅ Sistema de Suporte com tickets e SLA
- ✅ Sistema de Aluguéis com geração automática de faturas
- ✅ API de reenvio manual de e-mails
- ✅ Melhorias de segurança e performance

**Correções:**
- 🐛 Autenticação de e-mail para chamadas internas
- 🐛 Build errors em produção
- 🐛 Validação de formulários

**Documentação:**
- 📝 Documentação técnica completa atualizada
- 📝 Guias de configuração (EMAIL_SETUP.md, SUPPORT_SYSTEM.md)
- 📝 Scripts de teste

### Versão 1.0 (2024)

- ✅ MVP inicial com funcionalidades básicas
- ✅ Integração Mercado Pago
- ✅ Dashboard e gestão de moradores
- ✅ Sistema financeiro básico

---

**Condomínio Fácil** © 2024  
Desenvolvido por Nodex Soluções

*Documentação atualizada em: Dezembro 2024*
