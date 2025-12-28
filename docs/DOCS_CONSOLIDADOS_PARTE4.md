# Meu Condomínio Fácil - Documentação Completa

## Parte 4: Integrações

**Versão:** 9.0 (Unified AI)  
**Última Atualização:** 28/12/2025

---

## 1. Mercado Pago (Pagamentos)

### 1.1 Configuração

```env
# .env.local / Vercel
NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY=APP_USR-xxx
MERCADOPAGO_ACCESS_TOKEN=APP_USR-xxx
MERCADOPAGO_WEBHOOK_SECRET=seu-webhook-secret
```

### 1.2 Fluxo de Pagamento

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Síndico       │───▶│  Condomínio Fácil │───▶│  Mercado Pago   │
│   gera cobrança │    │  (interface)      │    │  (gateway)      │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                                       │
                                                       ▼
                                              ┌─────────────────┐
                                              │  Conta do       │
                                              │  Condomínio     │
                                              └─────────────────┘
```

### 1.3 Eventos Webhook

| Evento | Ação |
|--------|------|
| `payment.approved` | Atualiza invoice para "pago", libera assinatura |
| `payment.pending` | Mantém como pendente |
| `payment.rejected` | Atualiza para "cancelado" |
| `payment.refunded` | Reverte pagamento, suspende assinatura |
| `payment.charged_back` | Bloqueio imediato (chargeback) |

### 1.4 Bancos/Gateways Suportados

| Gateway | Boleto | PIX | Cartão |
|---------|--------|-----|--------|
| **Mercado Pago** | ✅ | ✅ | ✅ |
| **PagSeguro** | ✅ | ✅ | ✅ |
| **Asaas** | ✅ | ✅ | ✅ |
| **Iugu** | ✅ | ✅ | ✅ |
| **Banco do Brasil** | ✅ | ✅ | - |
| **Itaú** | ✅ | ✅ | - |
| **Bradesco** | ✅ | ✅ | - |
| **Santander** | ✅ | ✅ | - |
| **Inter** | ✅ | ✅ | - |

### 1.5 Taxas de Implantação

| Item | Valor |
|------|-------|
| Taxa de Implantação | R$ 999,00 (único) |
| Mensalidade do Módulo | R$ 199,00/mês |

### 1.6 Requisitos do Cliente

- CNPJ ativo do condomínio
- Conta no banco/gateway desejado
- Credenciais de API fornecidas pelo cliente
- Documento comprovando síndico autorizado

---

## 2. WhatsApp (Evolution API)

### 2.1 Configuração

```env
# .env.local / Vercel
EVOLUTION_API_URL=https://evolution.yourserver.com
EVOLUTION_API_KEY=your-api-key
```

### 2.2 Funcionalidades

- ✅ Notificação de cobranças geradas
- ✅ Lembretes de vencimento
- ✅ Confirmação de pagamentos
- ✅ Avisos e comunicados
- ✅ Notificação de encomendas
- ✅ Alertas de segurança

### 2.3 Fluxo de Mensagens

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Sistema       │───▶│  Servidor        │───▶│  WhatsApp do    │
│   Condo Fácil   │    │  WhatsApp (VPS)  │    │  Morador        │
└─────────────────┘    │  (Evolution API) │    └─────────────────┘
                       └────────┬─────────┘
                                │
                                ▼
                        ┌─────────────────┐
                        │  Chip do        │
                        │  Condomínio     │
                        └─────────────────┘
```

### 2.4 Opções de Integração

| Opção | Descrição | Custo |
|-------|-----------|-------|
| **Servidor Dedicado** | Evolution API em VPS | R$ 697 (impl) + R$ 149/mês |
| **Meta Business API** | API oficial Meta | R$ 1.200 (impl) + custo/msg |

### 2.5 Requisitos do Chip

**✅ O número DEVE ser:**
- Chip novo, nunca usado no WhatsApp OU
- Chip desvinculado há mais de 7 dias
- Operadora confiável (Vivo, Claro, Tim, Oi)
- Com recarga/plano ativo

**❌ O número NÃO pode ser:**
- Número pessoal do síndico
- Número já usado em outro WhatsApp Business
- Número de fixo convertido

### 2.6 Limites de Envio

| Tipo de Número | Limite Recomendado |
|----------------|-------------------|
| Números novos | Máx 50 msgs/dia (1ª semana) |
| Números maduros | Até 500 msgs/dia |
| Business API | Sem limite definido |

### 2.7 Exemplo de Envio

```typescript
const response = await fetch(`${EVOLUTION_API_URL}/message/sendText`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'apikey': EVOLUTION_API_KEY
  },
  body: JSON.stringify({
    number: '5511999999999',
    text: 'Sua cobrança vence amanhã!'
  })
});
```

---

## 3. E-mail (SMTP)

### 3.1 Arquitetura

```
API/Função → email-helper.ts → Nodemailer → SMTP
                    ↓
              configuracoes_smtp (banco)
                    ↓
              Senha criptografada (AES-256-GCM)
```

### 3.2 Dois Níveis de Configuração

1. **SMTP por Condomínio** (`condominio_id` preenchido)
2. **SMTP Global** (`condominio_id = NULL`)

### 3.3 Prioridade de Envio

```
1. SMTP do condomínio (se configurado e ativo)
2. SMTP global do superadmin (fallback)
3. Loga como pendente se nenhum disponível
```

### 3.4 Providers Suportados

| Provider | Host | Porta |
|----------|------|-------|
| Gmail | smtp.gmail.com | 587 |
| Outlook | smtp.office365.com | 587 |
| Hostinger | smtp.hostinger.com | 465 |
| Zoho | smtp.zoho.com | 587 |
| Customizado | Qualquer SMTP | 465/587 |

### 3.5 Templates Disponíveis

| Template | Descrição |
|----------|-----------|
| `welcome` | Boas-vindas |
| `user_credentials` | Credenciais de acesso |
| `billing_notification` | Notificação de cobrança |
| `payment_confirmed` | Pagamento confirmado |
| `condo_trial` | Período de teste |
| `condo_active` | Condomínio ativado |
| `occurrence_update` | Atualização ocorrência |
| `reservation_confirmed` | Reserva confirmada |

### 3.6 Configuração no Vercel

```env
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=465
SMTP_USER=noreply@meucondominiofacil.com
SMTP_PASS=your_email_password
SMTP_FROM="Condomínio Fácil <noreply@meucondominiofacil.com>"
SMTP_ENCRYPTION_KEY=chave-para-criptografia
```

---

## 4. Groq / Llama 3 (Assistente e OCR)

### 4.1 Configuração

```env
GROQ_API_KEY=gsk-xxx
```

### 4.2 Funcionalidades

- ✅ **Assistente IA**: Llama 3.1 70B para respostas rápidas e contextuais.
- ✅ **Auditor de Orçamentos**: Llama 3.2 Vision para análise de PDF/Imagens.
- ✅ **OCR de Documentos**: Llama 3.2 Vision para leitura de RG/CNH/CPF.
- ✅ **Fallback Tesseract**: Processamento local se a API falhar.

### 4.3 Diferenciais Groq

- **Latência Ultra-baixa**: Respostas em milissegundos.
- **Custo-Benefício**: Plano gratuito generoso.
- **Open-Source Power**: Baseado nos modelos Llama da Meta.

### 4.4 Embeddings (OpenAI)

O sistema continua usando OpenAI `text-embedding-3-small` para busca semântica em documentos (RAG), garantindo a melhor recuperação de contexto.

---

## 5. PIX (QR Code)

### 5.1 Fluxo

1. Síndico configura chave PIX em `/configuracoes/pix`
2. Ao criar cobrança com `tipo = 'pix'`:
   - Gera payload PIX (BR Code)
   - Cria QR Code (base64)
   - Gera "Copia e Cola"
3. Salva em `billings` (`pix_qrcode` e `pix_copia_cola`)
4. Morador visualiza em `/minhas-cobrancas`

### 5.2 Campos na Tabela `billings`

| Campo | Descrição |
|-------|-----------|
| `pix_qrcode` | QR Code base64 |
| `pix_copia_cola` | Código para copiar |
| `payment_id` | ID do pagamento externo |

---

## 6. Câmeras (CFTV)

### 6.1 Requisitos das Câmeras

| Requisito | Especificação |
|-----------|---------------|
| RTSP | Habilitado |
| ONVIF | Perfil S |
| Codec | H.264 |
| IP | Fixo (estático) |
| Conexão | Cabeada (Ethernet) |
| Resolução | Mínimo 720p |

### 6.2 Câmeras NÃO Compatíveis

- Tuya, IMOU, Positivo, iCSee
- Câmeras Wi-Fi domésticas
- Câmeras que funcionam apenas via app
- Câmeras sem RTSP

### 6.3 Arquitetura

```
[Câmeras IP] --RTSP--> [Gateway Local] --WebRTC/HLS--> [Navegador]
```

### 6.4 Docker Gateway

```yaml
version: '3.8'
services:
  camera-gateway:
    image: ghcr.io/condofacil/camera-gateway:latest
    network_mode: host
    environment:
      - PORT=8554
      - CONDO_ID=seu-condo-id
    restart: unless-stopped
```

---

## 7. Supabase Services

### 7.1 Supabase Auth

- Login com e-mail/senha
- Recuperação de senha
- JWT automático
- Refresh tokens

### 7.2 Supabase Storage

**Buckets:**
- `avatars`: Fotos de perfil
- `occurrences`: Fotos de ocorrências
- `documents`: Documentos da governança
- `marketplace`: Fotos de anúncios

### 7.3 Supabase Realtime (Futuro)

- Notificações em tempo real
- Chat síndico-morador live
- Dashboard com métricas atualizadas

---

## 8. Variáveis de Ambiente Completas

```env
# ============================================
# SUPABASE
# ============================================
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# ============================================
# MERCADO PAGO
# ============================================
NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY=APP_USR-xxx
MERCADOPAGO_ACCESS_TOKEN=APP_USR-xxx
MERCADOPAGO_WEBHOOK_SECRET=xxx

# ============================================
# EVOLUTION API (WHATSAPP)
# ============================================
EVOLUTION_API_URL=https://evolution.yourserver.com
EVOLUTION_API_KEY=your-api-key

# ============================================
# OPENAI / GROQ
# ============================================
GROQ_API_KEY=gsk-xxx
OPENAI_API_KEY=sk-xxx

# ============================================
# SMTP
# ============================================
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=465
SMTP_USER=noreply@meucondominiofacil.com
SMTP_PASS=xxx
SMTP_FROM=noreply@meucondominiofacil.com
SMTP_FROM_NAME=Meu Condomínio Fácil
SMTP_ENCRYPTION_KEY=chave-aes-256

# ============================================
# APP
# ============================================
NEXT_PUBLIC_APP_URL=https://meucondominiofacil.com
TRIAL_DAYS=7
```

---

## 9. Webhooks Recebidos

| Serviço | Endpoint | Eventos |
|---------|----------|---------|
| Mercado Pago | `/api/mercadopago/webhook` | `payment.*` |
| Evolution API | `/api/webhooks/whatsapp` | Mensagens recebidas |

**Segurança:** Todos os webhooks validam assinatura/token antes de processar.

---

## 10. Multi-Tenant (Integrações por Condomínio)

### 10.1 Tabela `condo_integrations`

```sql
INSERT INTO condo_integrations (condo_id, tipo, provider, credentials, config)
VALUES (
    'uuid-do-condominio',
    'pagamentos',
    'mercadopago',
    '{"access_token": "APP_USR-xxx", "public_key": "APP_USR-xxx"}'::jsonb,
    '{"nome_exibicao": "Cond. Villa Flora"}'::jsonb
);
```

### 10.2 Fluxo

```
┌─ PLATAFORMA (Você) ─────────────────────────────┐
│  ENV VARS globais:                              │
│  ├── SUPABASE_* (seu banco)                     │
│  ├── MERCADOPAGO_* (suas cobranças)             │
│  └── SMTP_* (seus emails)                       │
├─────────────────────────────────────────────────┤
│  BANCO DE DADOS (por condo_id):                 │
│  ├── condo_integrations                         │
│  │     ├── Cliente A: MP Token, Evolution       │
│  │     ├── Cliente B: Asaas Token               │
│  │     └── Cliente C: BB Certificado            │
└─────────────────────────────────────────────────┘
```

---

**Anterior:** [Parte 3 - APIs](./DOCS_CONSOLIDADOS_PARTE3.md)  
**Próximo:** [Parte 5 - Manual e Deploy](./DOCS_CONSOLIDADOS_PARTE5.md)
