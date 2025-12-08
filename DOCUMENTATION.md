# Condomínio Fácil - Manual Completo

## 1. Visão Geral

**Condomínio Fácil** é um SaaS para gestão de condomínios com:
- Dashboard executivo com métricas em tempo real
- Gestão de moradores, unidades e financeiro
- Controle de portaria e visitantes
- Sistema de ocorrências
- Pagamentos via Mercado Pago (PIX, cartão, boleto)
- E-mails transacionais automáticos

---

## 2. Stack Tecnológico

| Tecnologia | Uso |
|------------|-----|
| Next.js 16 | Frontend + API Routes |
| TypeScript | Tipagem estática |
| Tailwind CSS | Estilização |
| Supabase | Banco de dados + Auth |
| Mercado Pago | Gateway de pagamento |
| Nodemailer | Envio de e-mails SMTP |
| Recharts | Gráficos |
| Vercel | Deploy |

---

## 3. Estrutura do Projeto

```
condominio-facil/
├── src/
│   ├── app/
│   │   ├── (dashboard)/       # Páginas autenticadas
│   │   │   ├── dashboard/     # Dashboard principal
│   │   │   ├── moradores/     # Gestão de moradores
│   │   │   ├── financeiro/    # Lançamentos financeiros
│   │   │   ├── avisos/        # Comunicados
│   │   │   ├── ocorrencias/   # Ocorrências
│   │   │   ├── unidades/      # Unidades/apartamentos
│   │   │   ├── usuarios/      # Usuários do condomínio
│   │   │   ├── portaria/      # Controle de visitantes
│   │   │   └── relatorios/    # Relatórios
│   │   ├── admin/             # Painel Super Admin
│   │   │   ├── usuarios/      # Todos os usuários
│   │   │   ├── condominios/   # Todos os condomínios
│   │   │   ├── assinaturas/   # Assinaturas e MRR
│   │   │   ├── planos/        # Planos
│   │   │   ├── emails/        # Logs de e-mail
│   │   │   └── legal/         # Aceites legais
│   │   ├── api/
│   │   │   ├── checkout/      # Mercado Pago
│   │   │   ├── email/         # Envio de e-mails
│   │   │   └── webhooks/      # Webhooks MP
│   │   └── (public)/          # Páginas públicas
│   ├── components/ui/         # Componentes reutilizáveis
│   ├── hooks/                 # useAuth, useUser
│   └── lib/supabase/          # Clientes Supabase
├── supabase/
│   ├── schema.sql             # Schema principal
│   └── saas_complete.sql      # Schema SaaS (invoices, etc)
└── .env.local                 # Variáveis de ambiente
```

---

## 4. Papéis de Usuário

| Role | Acesso |
|------|--------|
| `superadmin` | Painel admin, todos os condomínios |
| `sindico` | Gestão completa do seu condomínio |
| `porteiro` | Portaria, visitantes, ocorrências |
| `morador` | Visualização, criar ocorrências |

---

## 5. Configuração

### 5.1 Variáveis de Ambiente

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx

# App
NEXT_PUBLIC_APP_URL=https://seudominio.vercel.app

# Mercado Pago
MERCADOPAGO_ACCESS_TOKEN=APP_USR-xxx

# SMTP (Hostinger)
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=465
SMTP_USER=noreply@seudominio.com.br
SMTP_PASS=sua_senha
SMTP_FROM=noreply@seudominio.com.br
```

### 5.2 Banco de Dados

Execute no Supabase SQL Editor:
1. `supabase/schema.sql` - Schema principal
2. `supabase/saas_complete.sql` - Faturas, logs, funções

---

## 6. Integrações

### 6.1 Mercado Pago

**Endpoint:** `/api/checkout`

```json
POST /api/checkout
{
  "condoId": "uuid",
  "valor": 99.90,
  "metodoPagamento": "pix|cartao|boleto",
  "email": "email@exemplo.com",
  "nome": "Nome"
}
```

**Resposta:**
```json
{
  "success": true,
  "paymentUrl": "https://mercadopago.com/...",
  "pixCode": "00020126...",
  "pixQrcode": "base64..."
}
```

**Webhook:** `/api/webhooks/mercadopago`
- Validação HMAC-SHA256
- Atualiza status de faturas
- Libera assinaturas

### 6.2 E-mail SMTP

**Endpoint:** `/api/email`

```json
POST /api/email
{
  "tipo": "welcome|invoice|overdue|blocked|payment_confirmed",
  "destinatario": "email@exemplo.com",
  "dados": { "nome": "João", ... }
}
```

**Templates disponíveis:**
- `welcome` - Boas-vindas
- `trial_ending` - Fim do trial
- `invoice` - Nova fatura
- `overdue` - Fatura atrasada
- `blocked` - Acesso bloqueado
- `payment_confirmed` - Pagamento confirmado

### 6.3 Exclusão de Usuários (LGPD)

**Endpoint:** `/api/user/delete`

**Exclusão Administrativa (Superadmin/Síndico):**
```bash
DELETE /api/user/delete?id=UUID_DO_USUARIO
Authorization: Bearer TOKEN
```

**Resposta:**
```json
{
  "success": true,
  "message": "Usuário excluído permanentemente."
}
```

**Auto-Exclusão (LGPD):**
```json
DELETE /api/user/delete
{
  "confirmacao": "EXCLUIR MEUS DADOS"
}
```

**Funcionalidades:**
- Superadmin e síndico podem excluir qualquer usuário
- Síndico só pode excluir usuários do seu condomínio
- Exclusão permanente via função `hard_delete_user`
- Dados relacionados removidos via `ON DELETE CASCADE`
- Anonimização prévia via função `delete_user_data` (LGPD)

---

## 7. Banco de Dados

### Tabelas Principais

| Tabela | Descrição |
|--------|-----------|
| `condos` | Condomínios |
| `users` | Usuários |
| `units` | Unidades |
| `residents` | Moradores |
| `financial_entries` | Lançamentos |
| `notices` | Avisos |
| `occurrences` | Ocorrências |
| `visitors` | Visitantes |
| `plans` | Planos |
| `subscriptions` | Assinaturas |
| `invoices` | Faturas |
| `email_logs` | Logs de e-mail |
| `legal_acceptances` | Aceites legais |

### Funções SQL

- `check_overdue_subscriptions()` - Verifica inadimplência
- `release_subscription(condo_id, meses)` - Libera após pagamento
- `get_admin_metrics()` - Métricas do admin
- `generate_monthly_invoice(subscription_id)` - Gera fatura

---

## 8. Deploy

### Vercel

1. Conecte o repositório GitHub
2. Configure variáveis de ambiente
3. Deploy automático a cada push

### Variáveis obrigatórias na Vercel:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_APP_URL`
- `MERCADOPAGO_ACCESS_TOKEN`
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`

---

## 9. Comandos

```bash
# Desenvolvimento
npm run dev

# Build
npm run build

# Lint
npm run lint
```

---

## 10. Manutenção

### Tarefas Diárias (via Supabase pg_cron)
- `check_overdue_subscriptions()` - Verificar inadimplência
- Enviar e-mails de cobrança

### Monitoramento
- Logs de e-mail em `/admin/emails`
- Métricas em `/admin`
- Faturas em `/admin/assinaturas`

---

## 11. Contato

**Condomínio Fácil** © 2024
Desenvolvido por Nodex Soluções
