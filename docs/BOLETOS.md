# 📄 Sistema de Boletos - Guia Completo

## Visão Geral

O sistema de boletos do Condomínio Fácil utiliza o **Mercado Pago** como gateway de pagamento para emissão e processamento de boletos bancários.

---

## 🔧 Configuração

### 1. Variáveis de Ambiente

Adicione no arquivo `.env.local` e na Vercel:

```env
# Mercado Pago
MERCADOPAGO_ACCESS_TOKEN=seu_access_token_aqui
MERCADOPAGO_WEBHOOK_SECRET=seu_webhook_secret_aqui

# URL da aplicação
NEXT_PUBLIC_APP_URL=https://seudominio.com.br

# Supabase Service Role (já configurado)
SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key
```

### 2. Obter Credenciais do Mercado Pago

1. Acesse [mercadopago.com.br/developers](https://www.mercadopago.com.br/developers)
2. Vá em **Suas integrações** → **Criar aplicação**
3. Em **Credenciais de produção**, copie o **Access Token**
4. Em **Webhooks**, configure:
   - **URL**: `https://seudominio.com.br/api/webhooks/mercadopago`
   - **Eventos**: `payment`

### 3. Executar Migration SQL

Execute no Supabase SQL Editor:

```sql
-- Arquivo: supabase/migrations/boleto_system.sql
```

---

## 📡 APIs

### POST /api/checkout/boleto

Emite um boleto bancário.

**Request:**
```json
{
    "condoId": "uuid-do-condominio",
    "unitId": "uuid-da-unidade",
    "amount": 350.00,
    "payer": {
        "name": "João da Silva",
        "email": "joao@email.com",
        "cpf_cnpj": "12345678901"
    },
    "due_date": "2024-12-20",
    "description": "Taxa de condomínio - Dezembro/2024"
}
```

**Response (sucesso):**
```json
{
    "success": true,
    "invoice_id": "uuid-da-fatura",
    "boleto_url": "https://www.mercadopago.com.br/...",
    "boleto_barcode": "23793.38128 60000.000003 00000.000400 1 85010000035000",
    "boleto_expiration": "2024-12-20",
    "provider_id": "12345678",
    "status": "pending"
}
```

**Exemplo cURL:**
```bash
curl -X POST https://seudominio.com.br/api/checkout/boleto \
  -H "Content-Type: application/json" \
  -H "Cookie: [seu-cookie-de-sessao]" \
  -d '{
    "condoId": "xxx",
    "amount": 350.00,
    "payer": {
        "name": "João Silva",
        "email": "joao@email.com",
        "cpf_cnpj": "12345678901"
    },
    "due_date": "2024-12-20"
  }'
```

---

### POST /api/webhooks/mercadopago

Recebe notificações do Mercado Pago sobre pagamentos.

**Headers esperados:**
- `x-signature`: Assinatura HMAC para validação
- `x-request-id`: ID único da requisição

**Body (exemplo):**
```json
{
    "action": "payment.updated",
    "type": "payment",
    "data": {
        "id": "12345678"
    }
}
```

**Status processados:**
- `approved` → Atualiza invoice para "pago", libera assinatura
- `pending` → Mantém como pendente
- `rejected` → Atualiza invoice para "cancelado"
- `refunded` → Reverte pagamento, suspende assinatura
- `charged_back` → Bloqueio imediato (chargeback)

---

## 🗄️ Estrutura do Banco

### Tabela invoices (campos de boleto)

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `provider_id` | VARCHAR(100) | ID do pagamento no MP |
| `provider_method` | VARCHAR(20) | Gateway usado |
| `boleto_url` | TEXT | URL do boleto |
| `boleto_barcode` | VARCHAR(50) | Linha digitável |
| `boleto_codigo` | VARCHAR(50) | Código do boleto |
| `boleto_expiration` | DATE | Data de expiração |

### Tabela payment_logs

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | UUID | ID único |
| `invoice_id` | UUID | Referência à invoice |
| `condo_id` | UUID | Referência ao condomínio |
| `event_type` | VARCHAR(50) | Tipo de evento (payment.approved, etc) |
| `status` | VARCHAR(30) | Status do pagamento |
| `provider` | VARCHAR(20) | 'mercadopago' |
| `provider_payment_id` | VARCHAR(100) | ID do pagamento no MP |
| `raw_payload` | JSONB | Payload completo recebido |
| `created_at` | TIMESTAMPTZ | Data de criação |

---

## 🖥️ Frontend

### Página do Morador (/boletos)

- Lista de boletos/faturas
- Status visual (Pago, Pendente, Vencido)
- Linha digitável copiável
- Botão "Abrir Boleto" (abre PDF em nova aba)

### Página do Síndico (/financeiro)

- Botão "Emitir Boleto" para cada morador
- Visualização de todas as faturas do condomínio

---

## 🧪 Testes

### Ambiente Sandbox

1. Use as credenciais de **teste** do Mercado Pago
2. CPF de teste: `12345678909`
3. Email de teste: `test_user_123456@testuser.com`

### Simulando Pagamento

No sandbox, você pode simular pagamentos acessando:
```
https://www.mercadopago.com.br/developers/panel/sandbox/webhooks
```

### Script de Teste E2E

```bash
#!/bin/bash
# test-boleto.sh

# 1. Gerar boleto
RESPONSE=$(curl -s -X POST http://localhost:3000/api/checkout/boleto \
  -H "Content-Type: application/json" \
  -d '{
    "condoId": "seu-condo-id",
    "amount": 100.00,
    "payer": {
        "name": "Teste",
        "email": "teste@email.com",
        "cpf_cnpj": "12345678909"
    },
    "due_date": "2024-12-31"
  }')

echo "Response: $RESPONSE"

# 2. Verificar invoice criada
INVOICE_ID=$(echo $RESPONSE | jq -r '.invoice_id')
echo "Invoice ID: $INVOICE_ID"

# 3. Verificar no banco (via Supabase)
# SELECT * FROM invoices WHERE id = '$INVOICE_ID';
```

---

## 🔒 Segurança

1. **Validação de Assinatura**: Todo webhook é validado via HMAC
2. **Idempotência**: Pagamentos são processados apenas uma vez
3. **Service Role**: APIs admin usam service role para contornar RLS
4. **Logs**: Todos os eventos são registrados em `payment_logs`

---

## ⚠️ Troubleshooting

| Problema | Solução |
|----------|---------|
| "Webhook não configurado" | Verifique `MERCADOPAGO_WEBHOOK_SECRET` |
| "Assinatura inválida" | Verifique se o secret está correto |
| Boleto não gerado | Verifique `MERCADOPAGO_ACCESS_TOKEN` |
| Status não atualiza | Verifique logs em `payment_logs` |
| RLS bloqueando | Verifique `SUPABASE_SERVICE_ROLE_KEY` |

---

## 📊 Fluxo Completo

```
┌──────────────────────────────────────────────────────────────┐
│ 1. Síndico clica "Emitir Boleto"                             │
│                     ↓                                        │
│ 2. API /api/checkout/boleto                                  │
│    - Cria invoice no banco                                   │
│    - Chama Mercado Pago API                                  │
│    - Salva URL e linha digitável                             │
│                     ↓                                        │
│ 3. Morador acessa /boletos                                   │
│    - Visualiza linha digitável                               │
│    - Abre PDF do boleto                                      │
│                     ↓                                        │
│ 4. Morador paga no banco                                     │
│                     ↓                                        │
│ 5. Mercado Pago envia webhook                                │
│    - API /api/webhooks/mercadopago                           │
│    - Valida assinatura                                       │
│    - Atualiza invoice.status = 'pago'                        │
│    - Registra em payment_logs                                │
│    - Libera assinatura                                       │
│                     ↓                                        │
│ 6. Sistema atualizado automaticamente                        │
└──────────────────────────────────────────────────────────────┘
```

---

© 2024 Condomínio Fácil - Sistema de Boletos
