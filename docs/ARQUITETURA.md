# Arquitetura do Sistema

## Visão Geral

O **Meu Condomínio Fácil** segue uma arquitetura moderna de aplicação web Full-Stack com componentes serverless.

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
│  │  - 43 módulos de API                         │    │
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
│  │  - Auth        │  │  - Evolution API (WhatsApp)│  │
│  │  - Storage     │  │  - OpenAI (GPT)          │    │
│  │  - Realtime    │  │  - SMTP (Nodemailer)     │    │
│  └────────────────┘  └──────────────────────────┘    │
└──────────────────────────────────────────────────────┘
```

## Stack Tecnológico Completo

### Frontend Web

- **Framework**: Next.js 15 (App Router)
- **React**: v19.0.0
- **Linguagem**: TypeScript 5
- **Estilização**: TailwindCSS 3.4 + tailwindcss-animate
- **Componentes UI**: Shadcn/ui (Radix UI primitives)
- **Ícones**: Lucide React
- **Gráficos**: Recharts
- **Markdown**: react-markdown
- **PDFs**: jsPDF + jsPDF-AutoTable
- **Excel**: XLSX
- **OCR**: Tesseract.js (para leitura de encomendas)

### Frontend Mobile

- **Framework**: React Native + Expo
- **Build**: EAS Build
- **Navegação**: Expo Router (baseado em file-system)
- **Storage**: AsyncStorage + SecureStore
- **WebView**: expo-web-browser

### Backend

- **API**: Next.js API Routes (serverless via Vercel Edge Functions)
- **Autenticação**: Supabase Auth (JWT)
- **E-mail**: Nodemailer 6.9.7
- **Validação**: Zod (se necessário)
- **Cron Jobs**: Vercel Cron

### Banco de Dados

- **SGBD**: PostgreSQL 15 (via Supabase)
- **ORM/Query Builder**: Supabase Client (`@supabase/supabase-js`)
- **Migrations**: SQL puro (31 arquivos em `/supabase/migrations`)
- **Segurança**: Row Level Security (RLS) ativo

### Infraestrutura e Deploy

- **Hospedagem Web**: Vercel
- **Hospedagem DB**: Supabase Cloud
- **CDN**: Vercel Edge Network
- **Storage de Arquivos**: Supabase Storage
- **CI/CD**: GitHub Actions + Vercel Auto-Deploy
- **Monitoramento**: Vercel Analytics + Supabase Logs

### Serviços Externos

- **Pagamentos**: Mercado Pago
- **WhatsApp**: Evolution API (self-hosted ou cloud)
- **IA**: OpenAI GPT-4
- **E-mail**: SMTP configurável (por condomínio) + Gmail/Hostinger/Outlook

---

## Padrões de Arquitetura

### 1. Server Components vs Client Components

**Next.js 15 prioriza Server Components** para melhor performance:

```tsx
// Server Component (padrão)
// src/app/(dashboard)/dashboard/page.tsx
export default async function DashboardPage() {
  const supabase = await createClient(); // Server-side
  const { data } = await supabase.from('transacoes').select();
  return <DashboardView data={data} />;
}

// Client Component (quando necessário)
'use client';
export function InteractiveChart({ data }) {
  const [filter, setFilter] = useState('mes');
  return <Chart data={filtered} />;
}
```

### 2. API Routes Architecture

Cada módulo de API segue o padrão:

```
/src/app/api/[modulo]/
├── route.ts          # GET, POST, PUT, DELETE
├── [id]/
│   └── route.ts      # Operações específicas por ID
└── [subfuncao]/
    └── route.ts      # Subfunções (e.g., /test, /send)
```

Exemplo:
```typescript
// src/app/api/billing/route.ts
export async function GET(request: NextRequest) { ... }
export async function POST(request: NextRequest) { ... }

// src/app/api/billing/send-invoice/route.ts
export async function POST(request: NextRequest) { ... }
```

### 3. Autenticação e Autorização

#### Autenticação (Middleware)
```typescript
// src/middleware.ts
export async function middleware(request: NextRequest) {
  const response = NextResponse.next();
  const supabase = await createClient();
  await supabase.auth.getUser(); // Valida session
  return response;
}
```

#### Autorização (RLS + Código)
```sql
-- Row Level Security (Database)
CREATE POLICY "Users can read own condo data"
  ON cobrancas FOR SELECT
  USING (condo_id IN (
    SELECT condo_id FROM users WHERE id = auth.uid()
  ));
```

```typescript
// API Route (Application)
const { data: profile } = await supabase
  .from('users')
  .select('role, condo_id')
  .eq('id', user.id)
  .single();

if (profile.role !== 'sindico') {
  return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
}
```

### 4. State Management

**Não usa Redux/Zustand**. Estado gerenciado via:
- React Hooks (`useState`, `useEffect`)
- Server State via Server Components
- URL state via `searchParams`
- Custom hooks em `/src/hooks/`

Exemplo:
```typescript
// src/hooks/useUser.ts
export function useUser() {
  const [profile, setProfile] = useState<User | null>(null);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  
  useEffect(() => {
    loadProfile();
  }, []);
  
  return { profile, isSuperAdmin, ... };
}
```

### 5. Data Fetching Patterns

#### Server Components (Preferido)
```tsx
export default async function Page() {
  const data = await fetch('...').then(r => r.json());
  return <View data={data} />;
}
```

#### Client Components (quando interativo)
```tsx
'use client';
export function DataTable() {
  const [data, setData] = useState([]);
  
  useEffect(() => {
    fetch('/api/data').then(r => r.json()).then(setData);
  }, []);
  
  return <table>...</table>;
}
```

---

## Segurança

### 1. Row Level Security (RLS)

Todas as tabelas têm RLS ativo:

```sql
-- Exemplo: cobrancas
ALTER TABLE cobrancas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Sindico manages own condo billings"
  ON cobrancas FOR ALL
  USING (
    condo_id IN (
      SELECT condo_id FROM users 
      WHERE id = auth.uid() AND role = 'sindico'
    )
  );
```

### 2. Autenticação Supabase

- **JWT** armazenado em cookies HTTP-only
- **Refresh tokens** automáticos
- **Session** validada em cada request via middleware

### 3. Sanitização de Inputs

- Supabase escapa queries automaticamente (SQL injection protection)
- Next.js escapa HTML (XSS protection)
- Validação de tipos via TypeScript

### 4. HTTPS Obrigatório

- Vercel força HTTPS em produção
- Cookies com flag `secure` e `sameSite`

### 5. Rate Limiting

- Implementado via Vercel Edge Config
- 100 req/min para rotas públicas
- 300 req/min para autenticados

---

## Performance

### 1. Otimizações de Frontend

- **Server Components**: Reduz bundle size do cliente
- **Code Splitting**: Automático por rota
- **Image Optimization**: Next.js `<Image>` component
- **Font Optimization**: Google Fonts via next/font

### 2. Otimizações de Backend

- **Edge Functions**: Deploy em múltiplas regiões
- **Connection Pooling**: Supabase gerencia pool de conexões
- **Caching**:
  - Cache HTTP (max-age headers)
  - Vercel Edge Cache
  - Supabase query cache

### 3. Otimizações de Database

- **Índices**: Todas as foreign keys + campos frequentemente filtrados
- **Particionamento**: (futuro) Tabelas grandes particionadas por condo_id
- **EXPLAIN ANALYZE**: Usado para otimizar queries lentas

---

## Escalabilidade

### Atual
- **Vercel**: Auto-scaling serverless
- **Supabase**: Até 500 conexões simultâneas (plano Pro)
- **Capacidade**: ~1000 condomínios, ~50k usuários

### Futuro (se necessário)
- **Database**: Migração para Supabase Enterprise ou RDS dedicado
- **Cache**: Redis para sessões e cache de queries
- **Queue**: Bull/BullMQ para jobs assíncronos heavy
- **CDN**: CloudFront para assets estáticos

---

## Fluxo de Deploy

```
Developer → Git Push (main branch)
      ↓
GitHub → Webhook → Vercel
      ↓
Vercel:
  1. Install dependencies (npm ci)
  2. Build Next.js (npm run build)
  3. Run tests (npm test)
  4. Deploy to Edge Network
  5. Invalidate cache
      ↓
Production Live (~2min total)
```

**Migrations**: Aplicadas manualmente via Supabase Dashboard (SQL Editor) antes do deploy de código que depende delas.

---

## Monitoramento e Logs

- **Vercel Logs**: Erros de runtime, performance de functions
- **Supabase Logs**: Queries lentas, erros de RLS
- **Sentry** (futuro): Error tracking e alertas
- **Uptime Robot** (futuro): Monitoring de disponibilidade

---

## Diagramas de Componentes

### Arquitetura de Módulos

```
src/
├── app/
│   ├── (dashboard)/       # Authenticated routes
│   │   ├── layout.tsx     # Shared layout c/ Sidebar
│   │   ├── dashboard/
│   │   ├── financeiro/
│   │   ├── cobrancas/
│   │   └── ...
│   ├── (public)/          # Public routes
│   │   ├── login/
│   │   ├── onboard/
│   │   └── ...
│   └── api/               # API Routes (43 modules)
│       ├── admin/
│       ├── billing/
│       ├── chat-sindico/
│       └── ...
├── components/
│   ├── ui/                # Base components (Button, Input, Card, etc)
│   ├── shared/            # Sidebar, Topbar, LinkedInChat
│   ├── admin/             # ImpersonateModal, RoleViewSwitcher
│   └── payments/          # StaticQRCodeModal, PaymentForm
├── lib/
│   ├── supabase/
│   │   ├── client.ts      # Browser client
│   │   ├── server.ts      # Server client
│   │   └── admin.ts       # Admin client (bypass RLS)
│   └── utils.ts           # Helper functions
└── hooks/
    ├── useUser.ts         # Current user + permissions
    └── useViewAsRole.ts   # Role switching (superadmin)
```

### Fluxo de Request

```
Browser Request
    ↓
Next.js Middleware (autenticação)
    ↓
App Router (resolve rota)
    ↓
Page Component (Server ou Client)
    ↓
API Route (se data mutation)
    ↓
Supabase Client
    ↓
PostgreSQL + RLS
    ↓
**Última Atualização:** 28/12/2025  
**Versão:** 9.0 (Unified AI)
```
