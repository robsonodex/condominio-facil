# Condomínio Fácil

Sistema SaaS multi-tenant para gestão de condomínios pequenos no Brasil.

## 🚀 Tecnologias

### Sistema Web
- **Frontend**: Next.js 14 (App Router), TypeScript, React
- **Estilização**: Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **PDF**: jsPDF
- **Gráficos**: Recharts

### Aplicativo Mobile (NOVO!)
- **Framework**: React Native + Expo SDK 50
- **Navegação**: Expo Router
- **Estado**: Zustand + TanStack Query
- **Repositório**: https://github.com/robsonodex/app-condominio-facil.git

## 📋 Funcionalidades

### Papéis de Usuário

1. **Super Admin** - Gestão de todos os condomínios, planos e assinaturas
2. **Síndico** - Gestão completa do condomínio (financeiro, moradores, ocorrências)
3. **Porteiro** - Controle de visitantes e registro de ocorrências
4. **Morador** - Visualização de avisos, boletos e ocorrências

### Módulos Web

- ✅ Dashboard com KPIs e gráficos
- ✅ Gestão de Unidades (CRUD)
- ✅ Gestão de Moradores (CRUD)
- ✅ Financeiro (receitas/despesas, inadimplência)
- ✅ Avisos/Comunicados
- ✅ Ocorrências (reclamações, manutenção, incidentes)
- ✅ Portaria (entrada/saída de visitantes)
- ✅ Relatórios com geração de PDF
- ✅ Painel SuperAdmin (condomínios, planos, usuários, assinaturas)

### Módulos Mobile (13 completos!)

- ✅ Dashboard com estatísticas em tempo real
- ✅ Gestão Financeira (CRUD)
- ✅ Moradores (CRUD)
- ✅ Ocorrências (CRUD com workflow)
- ✅ Avisos (CRUD com RBAC)
- ✅ Reservas de áreas comuns
- ✅ Portaria (visitantes + encomendas)
- ✅ Governança (enquetes, assembleias, documentos)
- ✅ SuperAdmin (condos, users, assinaturas)
- ✅ Push Notifications
- ✅ Câmera integrada
- ✅ Upload de arquivos

📱 **Documentação completa**: [MOBILE_APP.md](./MOBILE_APP.md)

## 🛠️ Instalação

### 1. Clone o projeto

```bash
cd d:\saas\condominio-facil
```

### 2. Instale as dependências

```bash
npm install
```

### 3. Configure o Supabase

1. Crie um projeto no [Supabase](https://supabase.com)
2. Execute o SQL em `supabase/schema.sql` no SQL Editor
3. Copie as credenciais e crie o arquivo `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anon
```

### 4. Configure a Autenticação no Supabase

1. Vá em Authentication > Providers
2. Habilite Email/Password
3. Configure o Site URL: `http://localhost:3000`
4. Configure Redirect URLs: `http://localhost:3000/auth/callback`

### 5. Inicie o servidor de desenvolvimento

```bash
npm run dev
```

Acesse: http://localhost:3000

## 📁 Estrutura do Projeto

```
src/
├── app/
│   ├── (auth)/           # Páginas de autenticação
│   │   ├── login/
│   │   ├── register/
│   │   └── forgot-password/
│   ├── (dashboard)/      # Páginas protegidas
│   │   ├── dashboard/
│   │   ├── financeiro/
│   │   ├── moradores/
│   │   ├── unidades/
│   │   ├── avisos/
│   │   ├── ocorrencias/
│   │   ├── portaria/
│   │   └── relatorios/
│   └── admin/            # Painel SuperAdmin
│       ├── condominios/
│       ├── planos/
│       ├── assinaturas/
│       └── usuarios/
├── components/
│   ├── ui/               # Componentes base (Button, Input, Card, etc)
│   └── shared/           # Componentes compartilhados (Sidebar, Header)
├── hooks/                # Custom hooks (useAuth, useUser)
├── lib/                  # Utilitários e configurações
│   └── supabase/         # Clientes Supabase
└── types/                # TypeScript types
```

## 🔒 Segurança

- Row Level Security (RLS) configurado em todas as tabelas
- Multi-tenant: dados isolados por condomínio
- Autenticação via Supabase Auth
- Middleware de proteção de rotas

## 📊 Banco de Dados

O schema inclui 12 tabelas principais:

1. `plans` - Planos de assinatura
2. `condos` - Condomínios
3. `units` - Unidades/apartamentos
4. `users` - Usuários
5. `residents` - Moradores
6. `financial_entries` - Lançamentos financeiros
7. `notices` - Avisos/comunicados
8. `notice_reads` - Controle de leitura
9. `occurrences` - Ocorrências
10. `visitors` - Visitantes
11. `subscriptions` - Assinaturas
12. `financial_reports` - Relatórios gerados

## 🤖 Automações

Funções SQL para executar via pg_cron ou Supabase Scheduled Functions:

- `update_overdue_financial_entries()` - Atualiza status de pagamentos atrasados
- `suspend_expired_trials()` - Suspende condomínios com trial expirado

## 🚀 Deploy

### Vercel (Recomendado)

1. Conecte seu repositório ao Vercel
2. Adicione as variáveis de ambiente
3. Deploy automático a cada push

```bash
npm run build
```

## 📝 Licença

Projeto privado - Todos os direitos reservados.
