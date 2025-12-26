# API Routes - Documentação Completa

**Versão:** 8.2  
**Última Atualização:** 26/12/2024  
**Total de Endpoints:** 110+

---

## Índice

1. [Autenticação](#autenticação)
2. [Administração](#administração-apiapiadmin)
3. [Usuários e Perfil](#usuários-e-perfil)
4. [Condomínios](#condomínios)
5. [Financeiro](#financeiro)
6. [Cobranças e Pagamentos](#cobranças-e-pagamentos)
7. [E-mail](#e-mail)
8. [Chat e Comunicação](#chat-e-comunicação)
9. [Portaria](#portaria)
10. [Ocorrências](#ocorrências)
11. [Reservas](#reservas)
12. [Governança](#governança)
13. [Manutenção](#manutenção)
14. [Marketplace](#marketplace)
15. [Integrações](#integrações)
16. [IA e Assistente](#ia-e-assistente)
17. [Câmeras](#câmeras)
18. [Cron Jobs](#cron-jobs)
19. [Emergência](#emergência)

---

## Autenticação

### POST `/api/auth/login`
Login do usuário.

**Body:**
```json
{
  "email": "usuario@email.com",
  "password": "senha123"
}
```

**Response:**
```json
{
  "success": true,
  "user": { "id": "uuid", "email": "...", "role": "sindico" }
}
```

---

### GET `/api/auth/profile`
Retorna perfil do usuário logado.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "id": "uuid",
  "nome": "João Silva",
  "email": "joao@email.com",
  "role": "sindico",
  "condo_id": "uuid"
}
```

---

### PATCH `/api/auth/profile`
Atualiza perfil do usuário.

**Body:**
```json
{
  "nome": "Novo Nome",
  "telefone": "11999999999"
}
```

---

## Administração (`/api/admin/*`)

### GET `/api/admin/condos`
Lista todos os condomínios (superadmin).

**Response:**
```json
{
  "condos": [
    { "id": "uuid", "nome": "Residencial Sol", "status": "ativo" }
  ]
}
```

---

### POST `/api/admin/users`
Cria novo usuário (síndico/morador).

**Body:**
```json
{
  "nome": "Maria Silva",
  "email": "maria@email.com",
  "senha": "123456",
  "role": "sindico",
  "condo_id": "uuid",
  "enviar_email": true
}
```

---

### GET/POST `/api/admin/smtp-global`
Configuração SMTP global.

**GET Response:**
```json
{
  "smtp_host": "smtp.hostinger.com",
  "smtp_port": 465,
  "smtp_user": "noreply@...",
  "smtp_from_email": "noreply@..."
}
```

**POST Body:**
```json
{
  "smtp_host": "smtp.hostinger.com",
  "smtp_port": 465,
  "smtp_user": "noreply@...",
  "smtp_password": "senha",
  "smtp_from_email": "noreply@...",
  "smtp_from_name": "Condomínio Fácil"
}
```

---

### POST `/api/admin/smtp-global/test`
Testa conexão SMTP e envia e-mail real.

**Body:**
```json
{
  "smtp_host": "...",
  "smtp_port": 465,
  "smtp_user": "...",
  "smtp_password": "..."
}
```

**Response:**
```json
{
  "success": true,
  "message": "Email de teste enviado com sucesso!"
}
```

---

### GET `/api/admin/pending-chats`
Retorna quantidade de chats de suporte pendentes.

---

### GET `/api/admin/subscriptions`
Lista todas as assinaturas.

---

### POST `/api/admin/billing`
Processa cobrança de assinatura.

---

## Usuários e Perfil

### GET `/api/users`
Lista usuários do condomínio.

### POST `/api/users`
Cria novo usuário.

### GET `/api/users/[id]`
Detalhes do usuário.

### PATCH `/api/users/[id]`
Atualiza usuário.

### DELETE `/api/users/[id]`
Remove usuário.

---

## Condomínios

### GET `/api/condos`
Lista condomínios.

### GET `/api/condos/[id]`
Detalhes do condomínio.

### PATCH `/api/condos/[id]`
Atualiza condomínio.

---

## Financeiro

### GET `/api/financial/entries`
Lista lançamentos financeiros.

**Query Params:**
- `month`: Mês (1-12)
- `year`: Ano
- `type`: receita | despesa

### POST `/api/financial/entries`
Cria lançamento financeiro.

**Body:**
```json
{
  "tipo": "receita",
  "categoria": "Taxa de condomínio",
  "valor": 500.00,
  "descricao": "Taxa mensal",
  "data": "2024-12-26"
}
```

### POST `/api/financeiro/audit`
Audita orçamento usando IA.

**Body:**
```json
{
  "file": "(base64 do arquivo)",
  "filename": "orcamento.pdf"
}
```

---

## Cobranças e Pagamentos

### GET `/api/billings`
Lista cobranças.

### POST `/api/billings`
Cria cobrança.

### POST `/api/billing/send-invoice`
Envia fatura por e-mail.

### POST `/api/checkout`
Cria checkout Mercado Pago.

### POST `/api/checkout/pix`
Gera código PIX.

### POST `/api/checkout/boleto`
Gera boleto.

---

## E-mail

### POST `/api/email`
Envia e-mail.

**Body:**
```json
{
  "tipo": "user_credentials",
  "destinatario": "usuario@email.com",
  "dados": {
    "nome": "João",
    "email": "joao@email.com",
    "password": "123456"
  }
}
```

**Tipos disponíveis:**
- `welcome` - Boas-vindas
- `user_credentials` - Credenciais
- `billing_notification` - Cobrança
- `payment_confirmed` - Pagamento confirmado
- `condo_trial` - Período de teste
- `condo_active` - Ativação
- `occurrence_update` - Ocorrência
- `reservation_confirmed` - Reserva

### POST `/api/email/resend`
Reenvia e-mail.

### GET/POST `/api/configuracoes-smtp`
SMTP por condomínio.

### POST `/api/configuracoes-smtp/test`
Testa SMTP do condomínio.

---

## Chat e Comunicação

### GET `/api/chat-sindico`
Lista conversas do chat morador↔síndico.

### POST `/api/chat-sindico`
Envia mensagem.

**Body:**
```json
{
  "message": "Olá, preciso de ajuda",
  "category": "financeiro"
}
```

### GET `/api/chat-sindico/[id]`
Detalhes da conversa.

---

## Portaria

### GET `/api/portaria/visitors`
Lista visitantes.

### POST `/api/portaria/visitors`
Registra visitante.

### GET/POST `/api/portaria/deliveries`
Gestão de encomendas.

### POST `/api/portaria/checkout`
Checkout de visitante/encomenda.

---

## Ocorrências

### GET `/api/ocorrencias`
Lista ocorrências.

### POST `/api/ocorrencias`
Cria ocorrência.

### PATCH `/api/ocorrencias/[id]`
Atualiza ocorrência.

---

## Reservas

### GET `/api/reservas`
Lista reservas.

### POST `/api/reservas`
Cria reserva.

### GET `/api/common-areas`
Lista áreas comuns.

---

## Governança

### GET/POST `/api/governanca/assemblies`
Assembleias.

### GET/POST `/api/governanca/polls`
Enquetes.

### GET/POST `/api/governanca/documents`
Documentos.

---

## Manutenção

### GET/POST `/api/manutencao`
Ordens de manutenção.

### GET/POST `/api/manutencao/suppliers`
Fornecedores.

---

## Marketplace

### GET `/api/marketplace/ads`
Lista anúncios.

### POST `/api/marketplace/ads`
Cria anúncio.

### GET/POST `/api/marketplace/recommendations`
Indicações de profissionais.

---

## Integrações

### POST `/api/mercadopago/webhook`
Webhook Mercado Pago.

### POST `/api/whatsapp/send`
Envia WhatsApp.

### GET `/api/whatsapp/status`
Status da conexão.

---

## IA e Assistente

### POST `/api/ai/chat`
Chat com IA.

**Body:**
```json
{
  "message": "Qual o horário da piscina?",
  "conversationId": "uuid"
}
```

### POST `/api/ai/documents`
Upload documentos para IA.

### POST `/api/admin/embeddings/generate`
Gera embeddings.

---

## Câmeras

### GET `/api/cameras`
Lista câmeras.

### POST `/api/cameras`
Adiciona câmera.

### GET `/api/cameras/[id]/snapshot`
Captura frame.

### GET `/api/cameras/[id]/stream-token`
Token para stream.

---

## Cron Jobs

### GET `/api/cron/master`
Cron mestre (executa todos).

### GET `/api/cron/health-check`
Verifica saúde do sistema.

### GET `/api/cron/manutencao-check`
Verifica manutenções pendentes.

### GET `/api/cron/process-notifications`
Processa notificações.

### GET `/api/cron/reconcile-payments`
Concilia pagamentos.

---

## Emergência

### POST `/api/emergency-repair`
Ferramentas de emergência (superadmin only).

**Body:**
```json
{
  "action": "check_user" | "reset_password" | "list_users",
  "email": "usuario@email.com",
  "newPassword": "nova_senha"
}
```

### POST `/api/public-reset`
Reset de senha público (com chave secreta).

**Body:**
```json
{
  "secretKey": "NODEX_EMERGENCY_2024",
  "email": "usuario@email.com",
  "newPassword": "nova_senha"
}
```

---

## Códigos de Resposta

| Código | Significado |
|--------|-------------|
| 200 | Sucesso |
| 201 | Criado com sucesso |
| 400 | Requisição inválida |
| 401 | Não autorizado |
| 403 | Sem permissão |
| 404 | Não encontrado |
| 429 | Rate limit excedido |
| 500 | Erro interno |

---

## Headers Necessários

```
Content-Type: application/json
Authorization: Bearer <token> (quando autenticado)
```

---

**Atualizado em:** 26/12/2024
