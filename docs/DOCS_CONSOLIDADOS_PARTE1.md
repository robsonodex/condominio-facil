# Meu Condomínio Fácil - Documentação Completa

## Parte 1: Visão Geral e Arquitetura

**Versão:** 8.3  
**Última Atualização:** 27/12/2024  
**CNPJ:** 57.444.727/0001-85

---

## 📋 Índice Geral da Documentação

| Parte | Arquivo | Conteúdo |
|-------|---------|----------|
| **Parte 1** | `DOCS_CONSOLIDADOS_PARTE1.md` | Visão Geral, Arquitetura, Stack Tecnológica |
| **Parte 2** | `DOCS_CONSOLIDADOS_PARTE2.md` | Banco de Dados, Tabelas, RLS |
| **Parte 3** | `DOCS_CONSOLIDADOS_PARTE3.md` | APIs (110+ endpoints) |
| **Parte 4** | `DOCS_CONSOLIDADOS_PARTE4.md` | Integrações (Mercado Pago, WhatsApp, SMTP) |
| **Parte 5** | `DOCS_CONSOLIDADOS_PARTE5.md` | Manual do Usuário, Vendas, Deploy |

---

## 1. Visão Geral

**Meu Condomínio Fácil** é uma plataforma SaaS completa para gestão condominial, oferecendo ferramentas modernas para síndicos, moradores, porteiros e administradores.

### Modelo de Negócio

1. **Você é o dono da plataforma** (SuperAdmin)
2. **Síndicos/Administradoras** são seus clientes
3. Cada cliente paga uma **mensalidade** para usar o sistema
4. Você recebe pagamentos recorrentes (MRR - Monthly Recurring Revenue)

### Fluxo de Aquisição

```
Cliente acessa o site e se cadastra
        ↓
Período de teste grátis (7 dias)
        ↓
Você recebe notificação no painel Admin
        ↓
Você aprova o condomínio
        ↓
Fim do teste → Cliente escolhe um plano
        ↓
Cliente paga (PIX/Cartão/Boleto)
        ↓
Você ativa a assinatura no sistema
        ↓
Cobrança mensal automática
```

---

## 2. Stack Tecnológica

### Frontend Web

| Tecnologia | Versão | Uso |
|------------|--------|-----|
| Next.js | 15 | Framework (App Router) |
| React | 19 | UI Library |
| TypeScript | 5 | Linguagem |
| TailwindCSS | 3.4 | Estilização |
| Shadcn/UI | - | Componentes (Radix primitives) |
| Lucide React | - | Ícones |
| Recharts | - | Gráficos |
| jsPDF | - | Geração de PDFs |
| XLSX | - | Exportação Excel |

### Frontend Mobile

| Tecnologia | Uso |
|------------|-----|
| React Native | Framework mobile |
| Expo SDK 50 | Ambiente de desenvolvimento |
| Expo Router | Navegação file-based |
| Zustand | Estado global |
| TanStack Query | Data fetching e cache |

### Backend

| Tecnologia | Uso |
|------------|-----|
| Next.js API Routes | Serverless via Vercel |
| Supabase Auth | Autenticação (JWT) |
| Nodemailer 6.9.7 | Envio de e-mails |
| Vercel Cron | Jobs agendados |

### Banco de Dados

| Tecnologia | Uso |
|------------|-----|
| PostgreSQL 15 | SGBD (via Supabase) |
| Supabase Client | ORM/Query Builder |
| Row Level Security | Segurança de dados |

### Infraestrutura

| Serviço | Uso |
|---------|-----|
| Vercel | Hospedagem Web |
| Supabase Cloud | Hospedagem DB |
| Supabase Storage | Arquivos |
| GitHub Actions | CI/CD |

### Serviços Externos

| Serviço | Uso |
|---------|-----|
| Mercado Pago | Pagamentos |
| Evolution API | WhatsApp |
| OpenAI GPT-4 | Assistente IA |
| SMTP (configurável) | E-mail |

---

## 3. Arquitetura do Sistema

```
┌──────────────────────────────────────────────────────┐
│                  CAMADA DE APRESENTAÇÃO               │
│  ┌─────────────────┐          ┌──────────────────┐   │
│  │  Web App        │          │   Mobile App    │   │
│  │  (Next.js 15)   │          │  (React Native)  │   │
│  │  - SSR          │          │  - Expo          │   │
│  │  - App Router   │          │  - iOS/Android   │   │
│  └────────┬────────┘          └────────┬─────────┘   │
└───────────┼──────────────────────────────┼───────────┘
            │                              │
            ▼                              ▼
┌──────────────────────────────────────────────────────┐
│              CAMADA DE APLICAÇÃO (API)                │
│  ┌──────────────────────────────────────────────┐    │
│  │        Next.js API Routes (Serverless)       │    │
│  │  - 110+ endpoints                            │    │
│  │  - Autenticação via Supabase Auth            │    │
│  │  - Validação de permissões (RLS + código)    │    │
│  └─────────────────┬────────────────────────────┘    │
└────────────────────┼─────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────┐
│           CAMADA DE DADOS E SERVIÇOS                  │
│  ┌────────────────┐  ┌──────────────────────────┐    │
│  │   Supabase     │  │  Serviços Externos       │    │
│  │  - PostgreSQL  │  │  - Mercado Pago          │    │
│  │  - Auth        │  │  - Evolution API         │    │
│  │  - Storage     │  │  - OpenAI (GPT)          │    │
│  │  - Realtime    │  │  - SMTP (Nodemailer)     │    │
│  └────────────────┘  └──────────────────────────┘    │
└──────────────────────────────────────────────────────┘
```

---

## 4. Estrutura de Pastas

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
│   │   │   ├── client.ts       # Browser (Singleton)
│   │   │   ├── server.ts       # Server (por request)
│   │   │   ├── admin.ts        # Admin (bypass RLS)
│   │   │   └── middleware.ts   # Middleware auth
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

## 5. Perfis de Usuário

### 5.1 SuperAdmin (Você)

**Permissões:**
- Gestão de todos os condomínios
- Gestão de planos e assinaturas
- Impersonificação de usuários
- Central de suporte
- Configuração SMTP global
- Ferramentas de emergência

**Módulos Acessíveis:**
- `/admin` - Dashboard admin
- `/admin/condominios` - Gerenciar condos
- `/admin/planos` - Gerenciar planos
- `/admin/usuarios` - Gerenciar usuários
- `/admin/assinaturas` - Gerenciar assinaturas
- `/admin/email` - SMTP global
- `/admin/suporte` - Central de suporte

### 5.2 Síndico (Cliente)

**Permissões:**
- Gestão completa do condomínio
- Financeiro e cobranças
- Cadastro de moradores
- Avisos e notificações
- Ocorrências e reservas
- Relatórios
- Configuração de integrações

**Módulos Acessíveis:**
| Módulo | Rota | Descrição |
|--------|------|-----------|
| Dashboard | `/dashboard` | KPIs e gráficos |
| Financeiro | `/financeiro` | Receitas e despesas |
| Cobranças | `/cobrancas` | Boletos e PIX |
| Moradores | `/moradores` | Cadastro e importação |
| Unidades | `/unidades` | Blocos e apartamentos |
| Avisos | `/avisos` | Comunicados |
| Ocorrências | `/ocorrencias` | Chamados + Chat |
| Reservas | `/reservas` | Áreas comuns |
| Relatórios | `/relatorios` | PDF/Excel |
| Governança | `/governanca/*` | Assembleias e enquetes |
| Manutenção | `/manutencao` | Ordens de serviço |
| Configurações | `/configuracoes/*` | SMTP, PIX, WhatsApp |

### 5.3 Morador/Inquilino

**Permissões:**
- Visualização de avisos
- Minhas cobranças
- Ocorrências e reservas
- Chat com síndico
- Marketplace interno
- Minhas encomendas
- Meus convites QR

**Módulos Acessíveis:**
| Módulo | Rota | Descrição |
|--------|------|-----------|
| Dashboard | `/dashboard` | Resumo pessoal |
| Avisos | `/avisos` | Comunicados |
| Minhas Cobranças | `/minhas-cobrancas` | Boletos e PIX |
| Ocorrências | `/ocorrencias` | Abertura e chat |
| Reservas | `/reservas` | Solicitar reserva |
| Marketplace | `/marketplace` | Anúncios internos |
| Encomendas | `/minhas-encomendas` | Minhas entregas |
| Convites | `/meus-convites` | QR Codes |
| Assistente | `/assistente` | Chat com IA |

### 5.4 Porteiro

**Permissões:**
- Registro de visitantes
- Controle de encomendas
- Visualização de avisos
- Câmeras (se disponível)

**Módulos Acessíveis:**
| Módulo | Rota | Descrição |
|--------|------|-----------|
| Portaria | `/portaria` | Registro rápido |
| Portaria Turbo | `/portaria/turbo` | Modo tela cheia |
| Encomendas | `/portaria/deliveries/*` | Gestão entregas |
| Câmeras | `/portaria/cameras` | Visualização |
| Avisos | `/avisos` | Comunicados |

---

## 6. Planos e Preços

| Plano | Preço Mensal | Unidades | Funcionalidades |
|-------|--------------|----------|-----------------|
| **Básico** | R$ 99,90 | Até 20 | Financeiro, Moradores, Avisos, App Móvel |
| **Profissional** | R$ 249,90 | Até 50 | + Portaria, Ocorrências, Reservas, Relatórios |
| **Premium** | R$ 399,90 | Ilimitado | + Câmeras, Governança, IA, Multi-condo |

### Serviços de Implantação (Opcionais)

| Serviço | Implantação | Mensal | Disponível |
|---------|-------------|--------|------------|
| Integração Bancária | R$ 999 | +R$ 199 | Prof + Premium |
| Integração WhatsApp | R$ 697 | +R$ 149 | Prof + Premium |
| Assistente IA | R$ 997 | +R$ 149 | Premium |

---

## 7. Segurança

### 7.1 Autenticação

- **Supabase Auth** (email/senha)
- Sessão via **cookies HTTP-only**
- Token **JWT** automático
- **Refresh tokens** automáticos

### 7.2 Proteção de Dados

- **RLS** (Row Level Security) em todas tabelas
- **Multi-tenant** por condomínio
- **HTTPS** automático (Vercel)

### 7.3 Criptografia

- Senhas SMTP: **AES-256-GCM**
- Chave via `SMTP_ENCRYPTION_KEY`

### 7.4 Padrões de Código

**Browser Client (Singleton):**
```typescript
// src/lib/supabase/client.ts
let browserClient: SupabaseClient | null = null;

export function createClient(): SupabaseClient {
    if (browserClient) return browserClient;
    browserClient = createBrowserClient(url, key);
    return browserClient;
}
```

**Server Client (por request):**
```typescript
// src/lib/supabase/server.ts
export async function createClient() {
    const cookieStore = await cookies();
    return createServerClient(url, key, { cookies: {...} });
}
```

---

## 8. Performance e Escalabilidade

### Connection Pooling (Supavisor)

- **Shared Pooler** ativo
- **Pool Size**: 15 conexões (Nano)
- **Max Clients**: 200 conexões

### Otimizações

- **Server Components**: Reduz bundle size
- **Code Splitting**: Automático por rota
- **Edge Functions**: Deploy multi-região
- **Singleton Pattern**: Browser client

### Capacidade Atual

- ~1000 condomínios
- ~50k usuários
- Até 500 conexões simultâneas

---

**Próximo:** [Parte 2 - Banco de Dados](./DOCS_CONSOLIDADOS_PARTE2.md)
