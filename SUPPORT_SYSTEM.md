# 🎫 Sistema de Suporte e Tickets

## Visão Geral

Sistema completo de suporte com tickets, SLA por plano, suporte prioritário exclusivo para plano Avançado, gestão de mensagens, notificações e métricas.

---

## 🎯 Funcionalidades

### Para Moradores e Síndicos
- ✅ Criar tickets de suporte
- ✅ Acompanhar status e SLA
- ✅ Trocar mensagens com a equipe
- ✅ Upload de anexos (futuro)
- ✅ Histórico completo

### Para Superadmin
- ✅ Dashboard de métricas
- ✅ Gestão de todos os tickets
- ✅ Atribuição de agentes
- ✅ Controle de SLA
- ✅ Relatórios e analytics

---

## 📊 SLA por Plano

| Plano | SLA Padrão | Suporte Prioritário |
|-------|------------|---------------------|
| Básico (R$ 99,90) | 48 horas | ❌ Não disponível |
| Profissional (R$ 179,90) | 12 horas | ❌ Não disponível |
| **Avançado (R$ 249,90)** | **4 horas** | **✅ Disponível** |

### Prioridades

- **🔵 Baixa (low)**: Dúvidas, sugestões
- **🟢 Normal (normal)**: Problemas não urgentes
- **🟡 Alta (high)**: Problemas que afetam operação
- **🔴 Prioritário (priority)**: **Apenas Plano Avançado** - Atendimento em 4h

---

## 🗄️ Estrutura do Banco de Dados

### Tabela `support_tickets`

```sql
CREATE TABLE support_tickets (
    id UUID PRIMARY KEY,
    condo_id UUID REFERENCES condos(id),
    requester_id UUID REFERENCES users(id),
    subject TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT, -- tecnico|financeiro|geral|outro
    priority TEXT, -- low|normal|high|priority
    status TEXT, -- open|in_progress|pending|resolved|closed
    assignee_id UUID REFERENCES users(id),
    sla_deadline TIMESTAMPTZ NOT NULL,
    sla_breached BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT now(),
    closed_at TIMESTAMPTZ
);
```

### Tabela `support_messages`

```sql
CREATE TABLE support_messages (
    id UUID PRIMARY KEY,
    ticket_id UUID REFERENCES support_tickets(id),
    user_id UUID REFERENCES users(id),
    message TEXT NOT NULL,
    attachments JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT now()
);
```

### Tabela `support_logs`

```sql
CREATE TABLE support_logs (
    id UUID PRIMARY KEY,
    ticket_id UUID REFERENCES support_tickets(id),
    actor_id UUID REFERENCES users(id),
    action TEXT NOT NULL,
    payload JSONB,
    created_at TIMESTAMPTZ DEFAULT now()
);
```

---

## 🔐 Segurança (RLS)

### Políticas Implementadas

**support_tickets:**
- Superadmin: acesso total
- Síndico: vê tickets do seu condomínio
- Morador/Porteiro: vê apenas seus próprios tickets

**support_messages:**
- Usuários podem enviar mensagens em tickets que têm acesso
- Síndico e superadmin podem responder qualquer ticket do escopo

**support_logs:**
- Superadmin: acesso total
- Síndico: vê logs de tickets do seu condomínio

---

## 📡 APIs Disponíveis

### POST /api/support/tickets
Criar novo ticket

**Body:**
```json
{
  "subject": "Problema com login",
  "description": "Não consigo acessar o sistema",
  "category": "tecnico",
  "priority": "normal",
  "unit_id": "uuid-opcional"
}
```

**Validações:**
- Verifica se plano suporta prioridade solicitada
- Calcula SLA automaticamente
- Envia email de confirmação

---

### GET /api/support/tickets
Listar tickets com filtros

**Query Params:**
- `status`: open, in_progress, pending, resolved, closed
- `priority`: low, normal, high, priority
- `category`: tecnico, financeiro, geral, outro
- `sla_status`: breached
- `search`: busca em subject/description

---

### GET /api/support/tickets/[id]
Detalhes do ticket + mensagens

**Response:**
```json
{
  "ticket": {
    "id": "uuid",
    "subject": "...",
    "status": "open",
    "sla_deadline": "2024-12-10T14:00:00Z",
    "sla_breached": false,
    "messages": [...]
  }
}
```

---

### POST /api/support/tickets/[id]/messages
Enviar mensagem em um ticket

**Body:**
```json
{
  "message": "Consegui resolver o problema",
  "attachments": []
}
```

---

### PATCH /api/support/tickets/[id]
Atualizar ticket (síndico/superadmin)

**Body:**
```json
{
  "status": "in_progress",
  "priority": "high",
  "assignee_id": "uuid-do-agente"
}
```

---

### POST /api/support/tickets/[id]/close
Fechar ticket

**Body:**
```json
{
  "resolution_note": "Problema resolvido após reset de senha"
}
```

---

### GET /api/support/admin/metrics
Métricas do sistema (superadmin apenas)

**Response:**
```json
{
  "tickets_open": 15,
  "tickets_in_progress": 8,
  "tickets_resolved": 120,
  "tickets_sla_breached": 2,
  "avg_resolution_hours": 6.5,
  "total_tickets": 150,
  "recent_tickets_7d": 23
}
```

---

## 📧 E-mails Automáticos

### 1. Novo Ticket Criado

**Template:** `support_new_ticket`
**Enviado para:** Solicitante
**Quando:** Ao criar ticket

**Conteúdo:**
- Número do ticket
- Assunto
- Prioridade
- Prazo de SLA
- Link para acompanhar

---

### 2. Nova Mensagem

**Template:** `support_new_message`
**Enviado para:** Todas as partes do ticket
**Quando:** Ao adicionar mensagem

---

### 3. Ticket Fechado

**Template:** `support_ticket_closed`
**Enviado para:** Solicitante
**Quando:** Ticket é fechado

---

### 4. SLA Estourado

**Template:** `support_sla_breached`
**Enviado para:** Superadmin e síndico
**Quando:** SLA é ultrapassado

**⚠️ Importante:** Executado via pg_cron a cada 15 minutos

---

## 🚀 Páginas Frontend

### `/suporte`
Lista de tickets do usuário com filtros

**Recursos:**
- Filtros por status, prioridade, categoria
- Busca por texto
- Badge de SLA (verde/amarelo/vermelho)
- Indicador de mensagens não lidas

---

### `/suporte/novo`
Formulário para criar novo ticket

**Campos:**
- Assunto
- Descrição (textarea)
- Categoria (select)
- Prioridade (select)

**Validação:**
- Se selecionar "Prioritário", verifica se plano é Avançado
- Exibe alerta informativo sobre SLA

---

### `/suporte/[id]`
Detalhes do ticket com thread de mensagens

**Recursos:**
- Histórico completo de mensagens
- Informações do solicitante
- Status e prioridade
- Indicador de SLA
- Ações administrativas (se síndico/superadmin):
  - Iniciar atendimento
  - Marcar como resolvido
  - Fechar ticket

---

### `/admin/suporte/metrics`
Dashboard de métricas (superadmin apenas)

**KPIs:**
- Total de tickets
- tickets abertos
- SLA estourado
- Tempo médio de resolução

**Gráficos:**
- Tickets por status (bar chart)
- Tickets por categoria (bar chart)

---

## ⚙️ Funções SQL

### calculate_sla_deadline(condo_id, priority)

Calcula deadline do SLA baseado no plano do condomínio:
- Básico: +48h
- Profissional/Intermediário: +12h
- Avançado: +4h

```sql
SELECT calculate_sla_deadline('uuid-condo', 'normal');
-- Retorna: '2024-12-11 18:00:00+00'
```

---

### can_use_priority(condo_id, priority)

Verifica se condomínio pode usar prioridade específica:
- `priority` só é permitido para Plano Avançado

```sql
SELECT can_use_priority('uuid-condo', 'priority');
-- Retorna: true ou false
```

---

### check_sla_breaches()

Identifica tickets com SLA estourado e:
1. Marca `sla_breached = TRUE`
2. Cria log em `support_logs`
3. Retorna quantidade de tickets afetados

**Executar via pg_cron a cada 15 minutos:**

```sql
SELECT cron.schedule(
    'check_sla_breaches',
    '*/15 * * * *',
    $$ SELECT check_sla_breaches(); $$
);
```

---

## 🧪 Como Testar

### 1. Criar Migration
```bash
# Executar no Supabase SQL Editor
# Arquivo: supabase/migrations/support_system.sql
```

### 2. Testar API Localmente
```bash
# Criar ticket
curl -X POST http://localhost:3000/api/support/tickets \
  -H "Content-Type: application/json" \
  -d '{
    "subject": "Teste",
    "description": "Teste de ticket",
    "category": "geral",
    "priority": "normal"
  }'

# Listar tickets
curl http://localhost:3000/api/support/tickets
```

### 3. Acessar Frontend
```
http://localhost:3000/suporte
http://localhost:3000/suporte/novo
http://localhost:3000/admin/suporte/metrics
```

---

## 📝 Logs e Auditoria

Todas as ações são registradas em `support_logs`:

```sql
SELECT * FROM support_logs WHERE ticket_id = 'uuid' ORDER BY created_at DESC;
```

**Ações registradas:**
- `ticket_created`
- `message_sent`
- `ticket_updated`
- `ticket_closed`
- `sla_breached`

---

## 🔔 Notificações (Futuro)

### Supabase Realtime

```typescript
supabase
    .channel('support_tickets')
    .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'support_tickets'
    }, (payload) => {
        console.log('Novo ticket:', payload.new);
    })
    .subscribe();
```

---

## 📈 Métricas e Relatórios

### View `support_metrics`

```sql
SELECT * FROM support_metrics;
```

**Retorna:**
- `tickets_open`
- `tickets_in_progress`
- `tickets_resolved`
- `tickets_closed`
- `tickets_sla_breached`
- `avg_resolution_hours`

---

## ✅ Checklist de Implementação

- [x] Migration SQL completa
- [x] Funções de SLA e validação
- [x] RLS em todas as tabelas
- [x] API de criação de tickets
- [x] API de listagem com filtros
- [x] API de mensagens
- [x] API de fechar ticket
- [x] API de métricas
- [x] Página de listagem `/suporte`
- [x] Página de criar `/suporte/novo`
- [x] Página de detalhes `/suporte/[id]`
- [x] Painel admin `/admin/suporte/metrics`
- [x] Templates de email (4)
- [x] Integração com sistema de email
- [ ] Job pg_cron para SLA (executar manualmente)
- [ ] Upload de anexos (Supabase Storage)
- [ ] Notificações in-app (Realtime)
- [ ] Tests E2E

---

## 🚀 Próximos Passos

1. **Executar migration no Supabase**
2. **Configurar pg_cron job** (SLA check)
3. **Testar fluxo completo** (criar → responder → fechar)
4. **Validar e-mails** (SMTP configurado?)
5. **Deploy Vercel**
6. **Divulgar na landing page** (Suporte Prioritário como diferencial do Plano Avançado)

---

**Elaborado por:** AntiGravity AI  
**Data:** 09/12/2024  
**Versão:** 1.0
