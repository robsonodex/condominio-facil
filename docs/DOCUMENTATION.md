# Condomínio Fácil - Documentação Técnica Completa

## Índice

1. [Visão Geral](#visão-geral)
2. [Stack Tecnológica](#stack-tecnológica)
3. [Estrutura de Pastas](#estrutura-de-pastas)
4. [Perfis de Usuário](#perfis-de-usuário)
5. [APIs (110+ endpoints)](#apis)
6. [Páginas do Dashboard (55+)](#páginas-do-dashboard)
7. [Banco de Dados](#banco-de-dados)
8. [Integrações](#integrações)
9. [Sistema de E-mail](#sistema-de-email)
10. [Segurança](#segurança)

---

## Visão Geral

**Meu Condomínio Fácil** é uma plataforma SaaS completa para gestão condominial, oferecendo ferramentas modernas para síndicos, moradores, porteiros e administradores.

**CNPJ:** 57.444.727/0001-85  
**Versão:** 9.0 (Unified AI)  
**Última Atualização:** 28/12/2025

---

## Stack Tecnológica

| Camada | Tecnologia |
|--------|------------|
| Frontend | Next.js 15 (App Router), React 19, TypeScript |
| Estilização | TailwindCSS, Shadcn/UI |
| Backend | Next.js API Routes (Serverless) |
| Banco de Dados | Supabase (PostgreSQL) |
| Autenticação | Supabase Auth |
| Storage | Supabase Storage |
| Hospedagem | Vercel |
| E-mail | Nodemailer (SMTP configurável) |
| Pagamentos | Mercado Pago |
| Mobile | React Native + Expo (WebView) |
| IA | OpenAI GPT-4o |

---

## Estrutura de Pastas

```
condominio-facil/
├── src/
│   ├── app/
│   │   ├── (dashboard)/        # 55+ páginas autenticadas
│   │   ├── (public)/           # Páginas públicas
│   │   ├── api/                # 110+ API Routes
│   │   └── admin/              # Painel Superadmin
│   ├── components/
│   │   ├── ui/                 # Componentes Shadcn
│   │   ├── shared/             # Sidebar, Header, etc
│   │   ├── admin/              # Componentes admin
│   │   └── payments/           # Componentes pagamento
│   ├── lib/
│   │   ├── supabase/           # Clientes Supabase
│   │   ├── emails/             # Templates de e-mail
│   │   ├── smtp-crypto.ts      # Criptografia SMTP
│   │   └── email-helper.ts     # Helper envio direto
│   └── hooks/                  # React Hooks
├── supabase/
│   └── migrations/             # 40+ migrations SQL
├── mobile/                     # App React Native
├── docs/                       # Documentação técnica
└── tests/                      # Testes E2E
```

---

## Perfis de Usuário

### 1. SuperAdmin
- Gestão de todos os condomínios
- Gestão de planos e assinaturas
- Impersonificação de usuários
- Central de suporte
- Configuração SMTP global
- Ferramentas de emergência

### 2. Síndico
- Gestão completa do condomínio
- Financeiro e cobranças
- Cadastro de moradores
- Avisos e notificações
- Ocorrências e reservas
- Relatórios
- Configuração de integrações

### 3. Morador/Inquilino
- Visualização de avisos
- Minhas cobranças
- Ocorrências e reservas
- Chat com síndico
- Marketplace interno
- Minhas encomendas
- Meus convites QR

### 4. Porteiro
- Portaria virtual
- Registro de visitantes
- Controle de encomendas
- Câmeras (se disponível)
- Avisos

---

## APIs

### APIs de Administração (`/api/admin/*`)

| Rota | Método | Descrição |
|------|--------|-----------|
| `/api/admin/billing` | POST | Processar cobrança |
| `/api/admin/chats` | GET | Listar chats de suporte |
| `/api/admin/chats/[id]` | GET/PATCH | Gerenciar chat específico |
| `/api/admin/condos` | GET/POST | Gerenciar condomínios |
| `/api/admin/condos-chat` | GET | Chats por condomínio |
| `/api/admin/embeddings/generate` | POST | Gerar embeddings IA |
| `/api/admin/pending-chats` | GET | Chats pendentes |
| `/api/admin/smtp-global` | GET/POST | Config SMTP global |
| `/api/admin/smtp-global/test` | POST | Testar SMTP |
| `/api/admin/subscriptions` | GET/POST | Gerenciar assinaturas |
| `/api/admin/users` | GET/POST | CRUD de usuários |

### APIs de Autenticação (`/api/auth/*`)

| Rota | Método | Descrição |
|------|--------|-----------|
| `/api/auth/login` | POST | Login |
| `/api/auth/profile` | GET/PATCH | Perfil do usuário |
| `/api/auth/complete-registration` | POST | Completar registro |
| `/api/auth/verify-email` | POST | Verificar e-mail |

### APIs de IA (`/api/ai/*`)

| Rota | Método | Descrição |
|------|--------|-----------|
| `/api/ai/agent` | POST | Agente IA |
| `/api/ai/chat` | POST | Chat GPT |
| `/api/ai/documents` | POST | Upload documentos IA |

### APIs de Câmeras (`/api/cameras/*`)

| Rota | Método | Descrição |
|------|--------|-----------|
| `/api/cameras` | GET/POST | CRUD câmeras |
| `/api/cameras/[id]/probe` | GET | Verificar câmera |
| `/api/cameras/[id]/snapshot` | GET | Capturar frame |
| `/api/cameras/[id]/stream-token` | GET | Token de stream |
| `/api/cameras/gateways` | GET | Listar gateways |

### APIs de Chat (`/api/chat-*`)

| Rota | Método | Descrição |
|------|--------|-----------|
| `/api/chat-sindico` | GET/POST | Chat morador↔síndico |
| `/api/chat-sindico/[id]` | GET/PATCH | Conversa específica |

### APIs de Checkout/Pagamento (`/api/checkout/*`)

| Rota | Método | Descrição |
|------|--------|-----------|
| `/api/checkout` | POST | Criar checkout |
| `/api/checkout/boleto` | POST | Gerar boleto |
| `/api/checkout/pix` | POST | Gerar PIX |
| `/api/checkout/rent` | POST | Checkout aluguel |

### APIs de E-mail (`/api/email/*`)

| Rota | Método | Descrição |
|------|--------|-----------|
| `/api/email` | POST | Enviar e-mail |
| `/api/email/resend` | POST | Reenviar e-mail |
| `/api/configuracoes-smtp` | GET/POST | SMTP por condomínio |
| `/api/configuracoes-smtp/test` | POST | Testar SMTP condo |

### APIs de Cron Jobs (`/api/cron/*`)

| Rota | Método | Descrição |
|------|--------|-----------|
| `/api/cron/health-check` | GET | Verificar saúde |
| `/api/cron/manutencao-check` | GET | Checar manutenções |
| `/api/cron/master` | GET | Cron mestre |
| `/api/cron/process-notifications` | GET | Processar notificações |
| `/api/cron/reconcile-payments` | GET | Conciliar pagamentos |

### APIs de Financeiro (`/api/financial/*`)

| Rota | Método | Descrição |
|------|--------|-----------|
| `/api/financial/entries` | GET/POST | Lançamentos |
| `/api/financeiro/audit` | POST | Auditoria IA |
| `/api/billing/send-invoice` | POST | Enviar fatura |

### APIs de Demo (`/api/demo/*`)

| Rota | Método | Descrição |
|------|--------|-----------|
| `/api/demo` | GET | Dados demo |
| `/api/demo/setup` | POST | Criar ambiente demo |
| `/api/demo/reset` | POST | Resetar demo |

### APIs de Emergência

| Rota | Método | Descrição |
|------|--------|-----------|
| `/api/emergency-repair` | POST | Ferramentas emergência (superadmin) |
| `/api/public-reset` | POST | Reset senha público |

### Outras APIs Importantes

| Rota | Método | Descrição |
|------|--------|-----------|
| `/api/check-trial` | GET | Verificar trial |
| `/api/common-areas` | GET/POST | Áreas comuns |
| `/api/contracts/rent` | GET/POST | Contratos aluguel |
| `/api/destinations` | GET/POST | Destinos notificação |
| `/api/governanca/*` | GET/POST | Governança digital |
| `/api/manutencao/*` | GET/POST | Manutenção preventiva |
| `/api/marketplace/*` | GET/POST | Marketplace interno |
| `/api/mercadopago/*` | POST | Webhooks MP |
| `/api/moradores/*` | GET/POST | Gestão moradores |
| `/api/notifications/*` | GET/POST | Notificações |
| `/api/ocorrencias/*` | GET/POST | Ocorrências |
| `/api/onboard` | POST | Onboarding |
| `/api/plan-features` | GET | Features do plano |
| `/api/portaria/*` | GET/POST | Portaria |
| `/api/qr-pass/*` | GET/POST | Convites QR |
| `/api/reservas/*` | GET/POST | Reservas |
| `/api/sugestoes/*` | GET/POST | Sugestões |
| `/api/support/*` | GET/POST | Suporte |
| `/api/taxa-incendio/*` | GET/POST | Taxa incêndio |
| `/api/units/*` | GET/POST | Unidades |
| `/api/users/*` | GET/POST | Usuários |
| `/api/whatsapp/*` | POST | Integração WhatsApp |

---

## Páginas do Dashboard

### Páginas Gerais

| Rota | Perfis | Descrição |
|------|--------|-----------|
| `/dashboard` | Todos | Dashboard principal |
| `/perfil` | Todos | Meu perfil |
| `/avisos` | Todos | Avisos do condomínio |
| `/sugestoes` | Todos | Caixa de sugestões |

### Páginas do Síndico

| Rota | Descrição |
|------|-----------|
| `/status` | Status geral do sistema |
| `/financeiro` | Gestão financeira |
| `/cobrancas` | Cobranças de moradores |
| `/moradores` | Cadastro de moradores |
| `/moradores/importar` | Importar CSV |
| `/unidades` | Gestão de unidades |
| `/usuarios` | Gestão de usuários |
| `/ocorrencias` | Gestão de ocorrências |
| `/reservas` | Reservas de áreas |
| `/relatorios` | Relatórios PDF/Excel |
| `/notificacoes` | Central de notificações |
| `/chat-moradores` | Chat com moradores |
| `/automacoes` | Regras automáticas |
| `/manutencao` | Manutenção preventiva |
| `/obras` | Obras e reformas |
| `/mensageria` | Entregas/Encomendas |
| `/assinatura` | Plano e pagamento |
| `/auditor-orcamentos` | Auditoria IA de orçamentos |
| `/taxa-incendio` | Gestão taxa incêndio |

### Páginas de Governança (`/governanca/*`)

| Rota | Descrição |
|------|-----------|
| `/governanca/assembleias` | Assembleias virtuais |
| `/governanca/enquetes` | Enquetes e votações |
| `/governanca/documents` | Documentos oficiais |
| `/governanca/autovistoria` | Autovistoria predial |

### Páginas de Configurações (`/configuracoes/*`)

| Rota | Descrição |
|------|-----------|
| `/configuracoes/condominio` | Dados do condomínio |
| `/configuracoes/pix` | Configurar PIX |
| `/configuracoes/email` | SMTP do condomínio |
| `/configuracoes/integracao-whatsapp` | WhatsApp oficial |
| `/configuracoes/integracao-pagamentos` | Mercado Pago |
| `/configuracoes/assistente` | Assistente IA |
| `/configuracoes/destinos` | Destinos notificação |

### Páginas do Morador

| Rota | Descrição |
|------|-----------|
| `/minhas-cobrancas` | Minhas cobranças |
| `/minhas-notificacoes` | Minhas notificações |
| `/minhas-encomendas` | Minhas encomendas |
| `/meus-convites` | Convites QR |
| `/marketplace` | Marketplace interno |
| `/marketplace/novo` | Criar anúncio |
| `/marketplace/indicar` | Indicar profissional |
| `/assistente` | Chat com IA |

### Páginas do Porteiro

| Rota | Descrição |
|------|-----------|
| `/portaria` | Registro de visitantes |
| `/portaria/turbo` | Modo tela cheia |
| `/portaria/deliveries/new` | Nova encomenda |
| `/portaria/deliveries/list` | Lista encomendas |
| `/portaria/cameras` | Visualizar câmeras |

### Páginas Admin (`/admin/*`)

| Rota | Descrição |
|------|-----------|
| `/admin` | Dashboard admin |
| `/admin/condominios` | Gerenciar condos |
| `/admin/planos` | Gerenciar planos |
| `/admin/usuarios` | Gerenciar usuários |
| `/admin/assinaturas` | Gerenciar assinaturas |
| `/admin/cobrancas` | Cobranças globais |
| `/admin/email` | SMTP global |
| `/admin/suporte` | Central de suporte |
| `/admin/erros` | Logs de erros |

### Páginas de Emergência

| Rota | Descrição |
|------|-----------|
| `/reset-emergencia` | Reset senha público |
| `/emergency-repair` | Ferramentas admin |

---

## Banco de Dados

### Tabelas Principais

| Tabela | Descrição |
|--------|-----------|
| `users` | Usuários do sistema |
| `condos` | Condomínios |
| `units` | Unidades/Apartamentos |
| `plans` | Planos de assinatura |
| `subscriptions` | Assinaturas ativas |
| `financial_entries` | Lançamentos financeiros |
| `billings` | Cobranças |
| `notices` | Avisos |
| `occurrences` | Ocorrências |
| `reservations` | Reservas |
| `visitors` | Visitantes |
| `deliveries` | Encomendas |
| `notifications` | Notificações |
| `chat_conversations` | Conversas chat |
| `chat_messages` | Mensagens chat |
| `support_tickets` | Tickets suporte |
| `configuracoes_smtp` | Configurações SMTP |
| `email_logs` | Logs de e-mail |
| `marketplace_ads` | Anúncios marketplace |
| `service_recommendations` | Indicações profissionais |
| `assemblies` | Assembleias |
| `polls` | Enquetes |
| `documents` | Documentos |
| `maintenance_orders` | Ordens manutenção |
| `suppliers` | Fornecedores |
| `cameras` | Câmeras |
| `qr_passes` | Convites QR |
| `common_areas` | Áreas comuns |

---

## Integrações

### Mercado Pago
- Checkout transparente
- PIX dinâmico
- Boleto
- Webhooks de confirmação

### WhatsApp (Evolution API)
- Mensagens automáticas
- Notificações de cobranças
- Avisos urgentes

### OpenAI
- Assistente IA para moradores
- Auditor de orçamentos
- Embeddings de documentos

---

## Sistema de E-mail

### Arquitetura (v8.2)

```
API/Função → email-helper.ts → Nodemailer → SMTP
                    ↓
              configuracoes_smtp (banco)
                    ↓
              Senha criptografada (AES-256-GCM)
```

### Templates Disponíveis
- `welcome` - Boas-vindas
- `user_credentials` - Credenciais de acesso
- `billing_notification` - Notificação de cobrança
- `payment_confirmed` - Pagamento confirmado
- `condo_trial` - Período de teste
- `condo_active` - Condomínio ativado
- `occurrence_update` - Atualização ocorrência
- `reservation_confirmed` - Reserva confirmada

---

## Segurança

### Autenticação
- Supabase Auth (email/senha)
- Sessão via cookies HTTP-only
- Token JWT automático

### Proteção de Dados
- RLS (Row Level Security) em todas tabelas
- Multi-tenant por condomínio
- HTTPS automático (Vercel)

### Criptografia
- Senhas SMTP: AES-256-GCM
- Chave via `SMTP_ENCRYPTION_KEY`

### Ferramentas de Emergência
- `/reset-emergencia` - Reset público com chave secreta
- `/emergency-repair` - Superadmin only

---

**Documento Atualizado:** 28/12/2025  
**Versão do Sistema:** 9.0 (Unified AI)
