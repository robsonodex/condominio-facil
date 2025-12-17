# Meu Condomínio Fácil

Sistema SaaS **100% WEB** para gestão de condomínios pequenos e médios no Brasil.

**CNPJ:** 57.444.727/0001-85

---

## ⚠️ AVISO IMPORTANTE

Este sistema é **100% WEB** (acessado via navegador). **NÃO existe aplicativo nativo** para Android ou iOS.

O acesso mobile é feito através do navegador ou via PWA (Progressive Web App) instalado na tela inicial do celular.

---

## 🚀 Tecnologias

### Sistema Web
- **Frontend**: Next.js 14 (App Router), TypeScript, React
- **Estilização**: Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **PDF**: jsPDF
- **Gráficos**: Recharts
- **Hospedagem**: Vercel

---

## 📋 Funcionalidades

### Papéis de Usuário

1. **Super Admin** - Gestão de todos os condomínios, planos e assinaturas
2. **Síndico** - Gestão completa do condomínio (financeiro, moradores, ocorrências)
3. **Porteiro** - Controle de visitantes e registro de ocorrências
4. **Morador** - Visualização de avisos, boletos e ocorrências

### Módulos Inclusos (por plano)

| Módulo | Básico | Profissional | Premium |
|--------|--------|--------------|---------|
| Dashboard | ✅ | ✅ | ✅ |
| Gestão Financeira | ✅ | ✅ | ✅ |
| Moradores | ✅ | ✅ | ✅ |
| Unidades | ✅ | ✅ | ✅ |
| Avisos | ✅ | ✅ | ✅ |
| Cobranças (manual) | ✅ | ✅ | ✅ |
| Portaria Virtual | ❌ | ✅ | ✅ |
| Encomendas | ❌ | ✅ | ✅ |
| Reservas | ❌ | ✅ | ✅ |
| Ocorrências | ❌ | ✅ | ✅ |
| Relatórios | ❌ | ✅ | ✅ |
| Câmeras | ❌ | ❌ | ✅ |
| Governança | ❌ | ❌ | ✅ |
| Automações | ❌ | ❌ | ✅ |

### Serviços de Implantação (Opcionais)

⚠️ **NÃO inclusos nos planos padrão** - contratados separadamente:

| Serviço | Descrição | Implantação | Mensal |
|---------|-----------|-------------|--------|
| Integração Bancária | PIX dinâmico, boleto automático, conciliação | R$ 999 | +R$ 199 |
| Integração WhatsApp | Mensagens automáticas via Evolution API | R$ 697 | +R$ 149 |

**Disponível para**: Planos Profissional e Premium

---

## 🛠️ Instalação (Desenvolvimento)

### 1. Clone o projeto

```bash
git clone [repo-url]
cd condominio-facil
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
SUPABASE_SERVICE_ROLE_KEY=sua-service-role-key
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

---

## 📁 Estrutura do Projeto

```
src/
├── app/
│   ├── (auth)/           # Páginas de autenticação
│   ├── (dashboard)/      # Páginas protegidas
│   ├── (public)/         # Páginas públicas (landing, termos)
│   └── admin/            # Painel SuperAdmin
├── components/
│   ├── ui/               # Componentes base
│   └── shared/           # Componentes compartilhados
├── hooks/                # Custom hooks
├── lib/                  # Utilitários e configurações
│   ├── supabase/         # Clientes Supabase
│   ├── integrations/     # Service de integrações multi-tenant
│   ├── whatsapp/         # Providers WhatsApp
│   └── payments/         # Providers pagamentos
└── types/                # TypeScript types
```

---

## 🔒 Segurança

- Row Level Security (RLS) configurado em todas as tabelas
- Multi-tenant: dados isolados por condomínio
- Autenticação via Supabase Auth
- Middleware de proteção de rotas
- Conformidade com LGPD

---

## 📊 Banco de Dados

Principais tabelas:

- `plans` - Planos de assinatura
- `condos` - Condomínios
- `units` - Unidades/apartamentos
- `users` - Usuários
- `residents` - Moradores
- `financial_entries` - Lançamentos financeiros
- `notices` - Avisos/comunicados
- `occurrences` - Ocorrências
- `visitors` - Visitantes
- `subscriptions` - Assinaturas
- `condo_integrations` - Credenciais de integração multi-tenant

---

## 📚 Documentação

| Arquivo | Descrição |
|---------|-----------|
| `MANUAL_COMPLETO.md` | Manual completo do sistema |
| `VENDAS.md` | Guia de vendas e scripts |
| `DEPLOY.md` | Guia de deploy |
| `docs/INTEGRACAO_BANCARIA.md` | Manual de integração bancária |
| `docs/INTEGRACAO_WHATSAPP.md` | Manual de integração WhatsApp |
| `legal/termos_uso_v1.0.md` | Termos de uso |
| `legal/lgpd_v1.0.md` | Política LGPD |

---

## 🚀 Deploy

### Vercel (Recomendado)

1. Conecte seu repositório ao Vercel
2. Adicione as variáveis de ambiente
3. Deploy automático a cada push

```bash
npm run build
```

---

## 📝 Licença

Projeto privado - Todos os direitos reservados.

**CNPJ:** 57.444.727/0001-85

---

**Última atualização:** 17/12/2025
