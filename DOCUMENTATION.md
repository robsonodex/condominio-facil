# Condomínio Fácil - Documentação Técnica

## 1. Arquitetura do Sistema

### Stack Tecnológico
- **Frontend**: Next.js 14 (App Router), React 18, TypeScript
- **Estilização**: Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Realtime)
- **Deploy**: Vercel
- **Gráficos**: Recharts
- **PDF**: jsPDF

### Estrutura de Diretórios
```
condominio-facil/
├── src/
│   ├── app/                    # App Router (páginas)
│   │   ├── (dashboard)/        # Área autenticada
│   │   ├── admin/              # SuperAdmin
│   │   ├── login/              # Autenticação
│   │   └── globals.css         # Estilos globais
│   ├── components/
│   │   ├── ui/                 # Componentes base
│   │   └── shared/             # Componentes compartilhados
│   ├── hooks/                  # Custom hooks (useAuth, useUser)
│   ├── lib/                    # Utilitários e configs
│   │   └── supabase/           # Clientes Supabase
│   └── types/                  # TypeScript types
├── supabase/
│   ├── schema.sql              # Schema principal
│   └── notifications.sql       # Schema notificações
└── vercel.json                 # Config deploy
```

---

## 2. Banco de Dados

### Tabelas Principais
| Tabela | Descrição |
|--------|-----------|
| `condos` | Condomínios cadastrados |
| `plans` | Planos de assinatura |
| `users` | Usuários do sistema |
| `units` | Unidades/apartamentos |
| `residents` | Moradores |
| `financial_entries` | Lançamentos financeiros |
| `notices` | Avisos/comunicados |
| `occurrences` | Ocorrências |
| `visitors` | Visitantes |
| `subscriptions` | Assinaturas |
| `notifications` | Notificações do sistema |

### Row Level Security (RLS)
Todas as tabelas têm RLS habilitado para garantir isolamento multi-tenant.

---

## 3. Papéis de Usuário

| Role | Permissões |
|------|------------|
| `superadmin` | Acesso total ao sistema |
| `sindico` | Gestão do condomínio próprio |
| `porteiro` | Visitantes e ocorrências |
| `morador` | Visualização e criação de ocorrências |

---

## 4. Como Rodar Localmente

```bash
# 1. Clonar o projeto
git clone https://github.com/seu-usuario/condominio-facil.git
cd condominio-facil

# 2. Instalar dependências
npm install

# 3. Configurar variáveis
cp env.example .env.local
# Edite .env.local com suas credenciais Supabase

# 4. Executar SQL no Supabase
# - supabase/schema.sql
# - supabase/notifications.sql

# 5. Rodar em desenvolvimento
npm run dev
```

---

## 5. Deploy

Ver arquivo [DEPLOY.md](./DEPLOY.md) para guia completo.

### Resumo
1. Conectar repositório ao Vercel
2. Configurar variáveis de ambiente
3. Deploy automático a cada push

---

## 6. Sistema de Notificações

### Tipos de Notificação
- `aviso` - Avisos gerais
- `vencimento` - Mensalidade próxima
- `atraso` - Mensalidade atrasada
- `sistema` - Notificações do sistema

### Automação
Executar diariamente a função `create_billing_notifications()` via pg_cron.

---

## 7. Manutenção Futura

### Tarefas Recomendadas
- [ ] Backups automáticos do banco
- [ ] Monitoramento de erros (Sentry)
- [ ] Analytics de uso
- [ ] Testes automatizados

### Comandos Úteis
```bash
# Build de produção
npm run build

# Verificar tipos
npx tsc --noEmit

# Lint
npm run lint
```

---

## 8. Contato

Desenvolvido por Condomínio Fácil © 2024
