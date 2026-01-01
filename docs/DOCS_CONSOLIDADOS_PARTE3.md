# Meu Condomínio Fácil - Documentação Completa

## Parte 3: APIs (110+ Endpoints)

**Versão:** 9.0 (Unified AI)  
**Última Atualização:** 01/01/2026

---

## 1. Autenticação

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

### GET `/api/auth/profile`
Retorna perfil do usuário logado.

**Headers:** `Authorization: Bearer <token>`

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

## 2. Administração (`/api/admin/*`)

### GET `/api/admin/condos`
Lista todos os condomínios (superadmin).

### POST `/api/admin/condos`
Cria novo condomínio.

### DELETE `/api/admin/condos/[id]`
Exclui condomínio (CASCADE completo).

### GET `/api/admin/users`
Lista todos os usuários.

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

### POST `/api/admin/smtp-global/test`
Testa conexão SMTP e envia e-mail real.

### GET `/api/admin/subscriptions`
Lista todas as assinaturas.

### POST `/api/admin/billing`
Processa cobrança de assinatura.

### GET `/api/admin/chats`
Lista chats de suporte.

### GET `/api/admin/pending-chats`
Retorna quantidade de chats pendentes.

---

## 3. Usuários (`/api/users/*`)

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/users` | Lista usuários do condomínio |
| POST | `/api/users` | Cria novo usuário |
| GET | `/api/users/[id]` | Detalhes do usuário |
| PATCH | `/api/users/[id]` | Atualiza usuário |
| DELETE | `/api/users/[id]` | Remove usuário |

---

## 4. Condomínios (`/api/condos/*`)

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/condos` | Lista condomínios |
| GET | `/api/condos/[id]` | Detalhes do condomínio |
| PATCH | `/api/condos/[id]` | Atualiza condomínio |

---

## 5. Financeiro (`/api/financial/*`)

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

## 6. Cobranças e Pagamentos

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

**Body:**
```json
{
  "condoId": "uuid",
  "unitId": "uuid",
  "amount": 350.00,
  "payer": {
    "name": "João da Silva",
    "email": "joao@email.com",
    "cpf_cnpj": "12345678901"
  },
  "due_date": "2024-12-20",
  "description": "Taxa de condomínio"
}
```

**Response:**
```json
{
  "success": true,
  "invoice_id": "uuid",
  "boleto_url": "https://mercadopago.com.br/...",
  "boleto_barcode": "23793.38128...",
  "status": "pending"
}
```

---

## 7. E-mail (`/api/email/*`)

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

## 8. Chat e Comunicação

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

### PATCH `/api/chat-sindico/[id]`
Atualiza/fecha conversa.

---

## 9. Portaria (`/api/portaria/*`)

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/portaria/visitors` | Lista visitantes |
| POST | `/api/portaria/visitors` | Registra visitante |
| GET | `/api/portaria/deliveries` | Lista encomendas |
| POST | `/api/portaria/deliveries` | Registra encomenda |
| POST | `/api/portaria/checkout` | Checkout visitante/encomenda |

---

## 10. Ocorrências (`/api/ocorrencias/*`)

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/ocorrencias` | Lista ocorrências |
| POST | `/api/ocorrencias` | Cria ocorrência |
| GET | `/api/ocorrencias/[id]` | Detalhes |
| PATCH | `/api/ocorrencias/[id]` | Atualiza ocorrência |

---

## 11. Reservas (`/api/reservas/*`)

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/reservas` | Lista reservas |
| POST | `/api/reservas` | Cria reserva |
| PATCH | `/api/reservas/[id]` | Atualiza reserva |
| GET | `/api/common-areas` | Lista áreas comuns |
| POST | `/api/common-areas` | Cria área comum |

---

## 12. Governança (`/api/governanca/*`)

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET/POST | `/api/governanca/assemblies` | Assembleias |
| GET/POST | `/api/governanca/polls` | Enquetes |
| POST | `/api/governanca/polls/[id]/vote` | Votar |
| GET/POST | `/api/governanca/documents` | Documentos |

---

## 13. Manutenção (`/api/manutencao/*`)

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET/POST | `/api/manutencao` | Ordens de manutenção |
| PATCH | `/api/manutencao/[id]` | Atualiza ordem |
| GET/POST | `/api/manutencao/suppliers` | Fornecedores |

---

## 14. Marketplace (`/api/marketplace/*`)

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/marketplace/ads` | Lista anúncios |
| POST | `/api/marketplace/ads` | Cria anúncio |
| GET/POST | `/api/marketplace/recommendations` | Indicações |

---

## 15. Integrações

### POST `/api/mercadopago/webhook`
Webhook Mercado Pago.

**Eventos processados:**
- `payment.approved` → Atualiza invoice para "pago"
- `payment.pending` → Mantém pendente
- `payment.rejected` → Atualiza para "cancelado"
- `payment.refunded` → Reverte pagamento

### POST `/api/whatsapp/send`
Envia WhatsApp.

**Body:**
```json
{
  "to": "5511999999999",
  "message": "Sua cobrança vence amanhã!"
}
```

### GET `/api/whatsapp/status`
Status da conexão.

---

## 16. IA e Assistente (`/api/ai/*`)

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

### POST `/api/ai/ocr-document`
Extrai nome e documento (CPF/RG) de fotos de documentos brasileiros usando **Groq (Llama 3.2 Vision)** com fallback local via **Tesseract.js**.
Prioriza CPF sobre RG e limpa ruídos visuais automaticamente.

**Body:**
```json
{
  "image": "data:image/jpeg;base64,/9j/4AAQ..."
}
```

**Response:**
```json
{
  "name": "JOÃO DA SILVA",
  "doc": "123.456.789-00"
}
```

> **Uso:** Portaria usa para preencher automaticamente dados de visitantes ao fotografar documento.

### POST `/api/admin/embeddings/generate`
Gera embeddings.

---

## 17. Câmeras (`/api/cameras/*`)

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/cameras` | Lista câmeras |
| POST | `/api/cameras` | Adiciona câmera |
| GET | `/api/cameras/[id]/snapshot` | Captura frame |
| GET | `/api/cameras/[id]/stream-token` | Token para stream |
| POST | `/api/cameras/[id]/probe` | Testa conexão |
| GET | `/api/cameras/gateways` | Lista gateways |

---

## 18. QR Pass (`/api/qr-pass/*`)

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/qr-pass` | Lista convites |
| POST | `/api/qr-pass` | Cria convite |
| POST | `/api/qr-pass/validate` | Valida QR Code |

---

## 19. Suporte (`/api/support/*`)

### POST `/api/support/tickets`
Cria ticket de suporte.

**Body:**
```json
{
  "subject": "Problema com login",
  "description": "Não consigo acessar",
  "category": "tecnico",
  "priority": "normal"
}
```

### GET `/api/support/tickets`
Lista tickets com filtros.

### GET `/api/support/tickets/[id]`
Detalhes do ticket.

### POST `/api/support/tickets/[id]/messages`
Envia mensagem no ticket.

### POST `/api/support/tickets/[id]/close`
Fecha ticket.

### GET `/api/support/admin/metrics`
Métricas do sistema (superadmin).

---

## 20. Cron Jobs (`/api/cron/*`)

| Endpoint | Descrição |
|----------|-----------|
| GET `/api/cron/master` | Cron mestre (executa todos) |
| GET `/api/cron/health-check` | Verifica saúde |
| GET `/api/cron/manutencao-check` | Verifica manutenções |
| GET `/api/cron/process-notifications` | Processa notificações |
| GET `/api/cron/reconcile-payments` | Concilia pagamentos |
| GET `/api/cron/learn-prices` | Aprende preços (IA) |

---

## 21. Emergência

### POST `/api/emergency-repair`
Ferramentas de emergência (superadmin only).

**Body:**
```json
{
  "action": "check_user",
  "email": "usuario@email.com"
}
```

**Ações disponíveis:**
- `check_user` - Verifica usuário
- `reset_password` - Reseta senha
- `list_users` - Lista usuários

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

## 22. Demo (`/api/demo/*`)

| Endpoint | Descrição |
|----------|-----------|
| GET `/api/demo` | Dados demo |
| POST `/api/demo/setup` | Cria ambiente demo |
| POST `/api/demo/reset` | Reseta demo |

---

## 23. Outros Endpoints

| Endpoint | Descrição |
|----------|-----------|
| GET `/api/check-trial` | Verifica trial |
| GET `/api/plan-features` | Features do plano |
| POST `/api/onboard` | Onboarding |
| GET/POST `/api/units` | Unidades |
| GET/POST `/api/moradores` | Moradores |
| GET/POST `/api/sugestoes` | Sugestões |
| GET/POST `/api/notifications` | Notificações |
| GET/POST/DELETE `/api/certificates` | Certificados e Compliance |
| GET/POST `/api/taxa-incendio` | Taxa incêndio |
| GET/POST `/api/contracts/rent` | Contratos aluguel |
| GET/POST `/api/destinations` | Destinos notificação |

---

## 24. Códigos de Resposta

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

## 25. Headers Necessários

```
Content-Type: application/json
Authorization: Bearer <token> (quando autenticado)
```

---

**Anterior:** [Parte 2 - Banco de Dados](./DOCS_CONSOLIDADOS_PARTE2.md)  
**Próximo:** [Parte 4 - Integrações](./DOCS_CONSOLIDADOS_PARTE4.md)
