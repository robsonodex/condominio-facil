# API Routes - Documentação

## Estrutura Geral

Todas as rotas da API estão em `/src/app/api/` e seguem o padrão de API Routes do Next.js 15.

### Padrão de Autenticação

```typescript
import { createClient } from '@/lib/supabase/server';

export async function GET/POST/PUT/DELETE(request: NextRequest) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
        return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }
    
    // Lógica da rota
}
```

## Módulos de API

### 1. Admin (`/api/admin/*`)

**Autenticação**: Apenas superadmin

| Endpoint | Método | Descrição |
|----------|--------|-----------|
| `/api/admin/condos` | GET | Lista todos os condomínios |
| `/api/admin/condos` | POST | Cria novo cond

omínio |
| `/api/admin/condos` | DELETE | Exclui condomínio (com CASCADE) |
| `/api/admin/usuarios` | GET | Lista todos os usuários do sistema |
| `/api/admin/assinaturas` | GET | Lista todas as assinaturas ativas |
| `/api/admin/cobrancas` | GET | Relatório de cobranças global |
| `/api/admin/smtp-global` | GET/POST/DELETE | Config SMTP global |
| `/api/admin/smtp-global/test` | POST | Testa conexão SMTP |
| `/api/admin/pending-chats` | GET | Contador de chats pendentes |
| `/api/admin/condos-chat` | GET | Lista conversas de todos condos |

### 2. Autenticação (`/api/auth/*`)

| Endpoint | Método | Descrição |
|----------|--------|-----------|
| `/api/auth/signin` | POST | Login de usuário |
| `/api/auth/signup` | POST | Registro de novo usuário |
| `/api/auth/signout` | POST | Logout |
| `/api/auth/reset-password` | POST | Envio de e-mail de recuperação |

### 3. Financeiro (`/api/financial/*`)

**Autenticação**: Síndico

| Endpoint | Método | Descrição |
|----------|--------|-----------|
| `/api/financial` | GET | Lista transações financeiras |
| `/api/financial` | POST | Cria nova transação |
| `/api/financial` | PUT | Atualiza transação |
| `/api/financial` | DELETE | Remove transação |

**Exemplo de Response**:
```json
{
  "data": [
    {
      "id": "uuid",
      "condo_id": "uuid",
      "tipo": "receita|despesa",
      "descricao": "string",
      "valor": 1500.00,
      "data": "2024-01-15",
      "categoria": "string",
      "created_at": "timestamp"
    }
  ]
}
```

### 4. Cobranças (`/api/billing/*`)

**Autenticação**: Síndico

| Endpoint | Método | Descrição |
|----------|--------|-----------|
| `/api/billing` | GET | Lista cobranças do condomínio |
| `/api/billing` | POST | Cria cobrança para moradores |
| `/api/billing/send-invoice` | POST | Envia e-mail com fatura |

**Body para criação**:
```json
{
  "unidade_id": "uuid",
  "valor": 500.00,
  "descricao": "Condomínio Janeiro/2024",
  "vencimento": "2024-01-10",
  "tipo": "boleto|pix"
}
```

### 5. Chat Síndico (`/api/chat-sindico/*`)

**Autenticação**: Síndico ou Morador

| Endpoint | Método | Descrição |
|----------|--------|-----------|
| `/api/chat-sindico` | GET | Lista conversas do usuário |
| `/api/chat-sindico/messages` | GET | Mensagens de uma conversa |
| `/api/chat-sindico/messages` | POST | Envia nova mensagem |

### 6. Configurações SMTP (`/api/configuracoes-smtp/*`)

**Autenticação**: Síndico

| Endpoint | Método | Descrição |
|----------|--------|-----------|
| `/api/configuracoes-smtp` | GET | Busca config SMTP do condo |
| `/api/configuracoes-smtp` | POST | Salva config SMTP |
| `/api/configuracoes-smtp` | DELETE | Remove config SMTP |
| `/api/configuracoes-smtp/test` | POST | Testa conexão SMTP |

### 7. E-mail (`/api/email/*`)

| Endpoint | Método | Descrição |
|----------|--------|-----------|
| `/api/email` | POST | Envia e-mail genérico |
| `/api/email/send-invoice` | POST | Envia e-mail com fatura |

**Sistema de Prioridade de SMTP**:
1. SMTP do condomínio (se configurado)
2. SMTP global do superadmin (fallback)
3. Log como pendente se nenhum configurado

### 8. Notificações (`/api/notifications/*`)

**Autenticação**: Qualquer usuário autenticado

| Endpoint | Método | Descrição |
|----------|--------|-----------|
| `/api/notifications` | GET | Lista notificações do usuário |
| `/api/notifications` | POST | Cria notificação |
| `/api/notifications/mark-read` | PUT | Marca como lida |

### 9. Ocorrências (`/api/portaria/*`)

**Autenticação**: Síndico, Morador, Porteiro

| Endpoint | Método | Descrição |
|----------|--------|-----------|
| `/api/portaria/occurrences` | GET | Lista ocorrências |
| `/api/portaria/occurrences` | POST | Cria ocorrência |
| `/api/portaria/occurrences` | PUT | Atualiza status |
| `/api/portaria/visitors` | GET/POST | Visitantes |
| `/api/portaria/packages` | GET/POST | Encomendas |

### 10. Reservas (`/api/reservations/*`)

**Autenticação**: Síndico ou Morador

| Endpoint | Método | Descrição |
|----------|--------|-----------|
| `/api/reservations` | GET | Lista reservas |
| `/api/reservations` | POST | Cria reserva |
| `/api/reservations` | DELETE | Cancela reserva |
| `/api/common-areas` | GET | Lista áreas comuns |

**Validações**:
- Verifica disponibilidade de horário
- Impede reservas em horários conflitantes
- Respeita regras de antecedência mínima

### 11. Sugestões (`/api/suggestions/*`)

**Autenticação**: Qualquer usuário do condo

| Endpoint | Método | Descrição |
|----------|--------|-----------|
| `/api/suggestions` | GET | Lista sugestões |
| `/api/suggestions` | POST | Cria sugestão |
| `/api/suggestions/vote` | POST | Vota em sugestão |

### 12. Governança (`/api/governanca/*`)

**Autenticação**: Síndico

| Endpoint | Método | Descrição |
|----------|--------|-----------|
| `/api/governanca/enquetes` | GET/POST | Enquetes |
| `/api/governanca/enquetes/vote` | POST | Votar em enquete |
| `/api/governanca/assembleias` | GET/POST | Assembleias |
| `/api/governanca/documents` | GET/POST | Documentos |

### 13. Assistente IA (`/api/ai/*`)

**Autenticação**: Síndico ou Morador (conforme plano)

| Endpoint | Método | Descrição |
|----------|--------|-----------|
| `/api/ai/chat` | POST | Chat com GPT |
| `/api/ai/suggestions` | POST | Sugestões IA |
| `/api/ai/documents` | POST | Análise de documentos |

### 14. PIX (`/api/pix/*`)

**Autenticação**: Síndico

| Endpoint | Método | Descrição |
|----------|--------|-----------|
| `/api/pix` | GET | Busca config PIX |
| `/api/pix` | POST | Salva config PIX |

### 15. Planos (`/api/plan-features/*`)

**Autenticação**: Qualquer usuário

| Endpoint | Método | Descrição |
|----------|--------|-----------|
| `/api/plan-features` | GET | Retorna features do plano ativo |

**Response**:
```json
{
  "hasOccurrences": true,
  "hasCommonAreas": true,
  "hasReports": true,
  "hasDeliveries": true,
  "hasAssemblies": false,
  "hasPolls": false,
  "hasDocuments": false,
  "hasMaintenance": false,
  "maxUnits": 50,
  "hasAI": false,
  "hasMensageria": true,
  "hasChatSindico": true
}
```

### 16. Webhooks (`/api/webhooks/*`)

| Endpoint | Método | Descrição |
|----------|--------|-----------|
| `/api/webhooks/mercadopago` | POST | Webhook Mercado Pago |

**Tratamento de Eventos**:
- `payment.created`
- `payment.approved`
- `payment.rejected`
- Atualiza status da assinatura

### 17. Cron Jobs (`/api/cron/*`)

**Autenticação**: Vercel Cron (secret token)

| Endpoint | Descrição | Frequência |
|----------|-----------|-----------|
| `/api/cron/check-trial` | Verifica trials expirados | Diário |
| `/api/cron/send-reminders` | Envia lembretes de pagamento | Diário |
| `/api/cron/cleanup` | Limpeza de dados antigos | Semanal |

## Tratamento de Erros

Todos os endpoints retornam erros no formato padrão:

```json
{
  "error": "Mensagem de erro",
  "details": "Detalhes adicionais (opcional)",
  "code": "ERRO_CODIGO (opcional)"
}
```

### Códigos HTTP

- `200`: Sucesso
- `201`: Criado com sucesso
- `400`: Requisição inválida
- `401`: Não autorizado
- `403`: Sem permissão
- `404`: Não encontrado
- `500`: Erro interno

## Rate Limiting

Implementado via Vercel Edge Config (produção):
- 100 requisições/minuto por IP em rotas públicas
- 300 requisições/minuto para usuários autenticados
- 1000 requisições/minuto para admin

## CORS

Configurado para aceitar apenas domínios autorizados:
- `meucondominiofacil.com`
- `*.vercel.app` (staging)
- `localhost:3000` (desenvolvimento)
