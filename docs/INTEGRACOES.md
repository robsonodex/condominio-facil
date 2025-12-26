# Integrações Externas

## 1. Mercado Pago (Pagamentos)

### Configuração

```typescript
// Credenciais em .env.local
NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY=APP_USR-xxx
MERCADOPAGO_ACCESS_TOKEN=APP_USR-xxx
```

### Fluxo de Assinatura

1. Síndico escolhe plano em `/assinatura`
2. Frontend cria preferência via `/api/checkout`
3. Redirect para Mercado Pago
4. Usuário paga
5. Webhook `/api/webhooks/mercadopago` recebe notificação
6. Sistema atualiza `subscriptions.status = 'ativa'`

**Eventos Webhook**:
- `payment.created`
- `payment.approved`
- `payment.rejected`
- `payment.refunded`

### SDK Utilizado
```bash
npm install mercadopago
```

---

## 2. Evolution API (WhatsApp)

### Configuração

```typescript
// Credenciais
EVOLUTION_API_URL=https://evolution.yourserver.com
EVOLUTION_API_KEY=your-api-key
```

### Funcionalidades

- Envio de lembretes de cobrança
- Notificações de encomendas
- Avisos do síndico

### Exemplo de Envio

```typescript
const response = await fetch(`${process.env.EVOLUTION_API_URL}/message/sendText`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'apikey': process.env.EVOLUTION_API_KEY
  },
  body: JSON.stringify({
    number: '5511999999999',
    text: 'Sua cobrança vence amanhã!'
  })
});
```

---

## 3. OpenAI GPT (Assistente IA)

### Configuração

```typescript
OPENAI_API_KEY=sk-xxx
```

### Uso

**Rota**: `/api/ai/chat`

```typescript
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const completion = await openai.chat.completions.create({
  model: 'gpt-4',
  messages: [
    { role: 'system', content: 'Você é um assistente de condomínio.' },
    { role: 'user', content: userMessage }
  ]
});
```

**Contexto fornecido**:
- Informações do condomínio
- Histórico de cobranças
- Regras específicas

---

## 4. SMTP (E-mail)

### Dois Níveis de Configuração

1. **SMTP por Condomínio** (`configuracoes_smtp` com `condominio_id`)
2. **SMTP Global** (`configuracoes_smtp` com `condominio_id = NULL`)

### Prioridade

```
1. SMTP do condomínio (se configurado e ativo)
2. SMTP global do superadmin (fallback)
3. Loga como pendente se nenhum disponível
```

### Providers Suportados

- Gmail (smtp.gmail.com:587)
- Outlook (smtp.office365.com:587)
- Hostinger (smtp.hostinger.com:465)
- Zoho (smtp.zoho.com:587)
- Qualquer SMTP customizado

### Exemplo de Envio

```typescript
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: config.smtp_host,
  port: config.smtp_port,
  secure: config.smtp_secure,
  auth: {
    user: config.smtp_user,
    pass: config.smtp_password
  }
});

await transporter.sendMail({
  from: `"${config.smtp_from_name}" <${config.smtp_from_email}>`,
  to: 'morador@example.com',
  subject: 'Nova Cobrança',
  html: emailHTML
});
```

---

## 5. Supabase Services

### 5.1 Supabase Auth

**Features utilizadas**:
- Login com e-mail/senha
- Recuperação de senha
- JWT automático
- Refresh tokens

**Políticas**:
- Senha mínima: 8 caracteres
- Confirmação de e-mail: desabilitada (registro imediato)

### 5.2 Supabase Storage

**Buckets**:
- `avatars`: Fotos de perfil
- `occurrences`: Fotos de ocorrências
- `documents`: Documentos da governança

**Políticas RLS**:
- Upload: apenas usuário autenticado
- Download: público para avatars, privado para ocorrências

### 5.3 Supabase Realtime (Futuro)

Planejado para:
- Notificações em tempo real
- Chat síndico-morador live
- Dashboard com métricas atualizadas

---

## 6. PIX (Geração de QR Code)

### Biblioteca

```bash
npm install pix-utils # (exemplo, pode ser outra)
```

### Fluxo

1. Síndico configura chave PIX em `/configuracoes/pix`
2. Ao criar cobrança com `tipo = 'pix'`:
   - Gera payload PIX (BR Code)
   - Cria QR Code (base64 ou URL)
   - Gera "Copia e Cola"
3. Salva em `cobrancas` (campos `pix_qrcode` e `pix_copia_cola`)
4. Morador visualiza em `/minhas-cobrancas`

---

## 7. Google Fonts

**Fontes carregadas**:
- Inter (padrão do sistema)
- Roboto (backup)

```typescript
// src/app/layout.tsx
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({ children }) {
  return (
    <html className={inter.className}>
      <body>{children}</body>
    </html>
  );
}
```

---

## 8. Tesseract.js (OCR)

**Uso**: Leitura automática de código de rastreio em fotos de encomendas.

```typescript
import Tesseract from 'tesseract.js';

const { data: { text } } = await Tesseract.recognize(imageFile, 'por');
// Extrai código de rastreio via regex
```

---

## 9. Vercel Analytics

**Métricas coletadas**:
- Page views
- Core Web Vitals (LCP, FID, CLS)
- Bounce rate

**Ativação**:
```typescript
// next.config.ts
module.exports = {
  analytics: {
    enable: true
  }
};
```

---

## 10. Sentry (Futuro - Error Tracking)

Planejado para monitoramento de erros em produção.

```bash
npm install @sentry/nextjs
```

---

## Resumo de Variáveis de Ambiente

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx
SUPABASE_SERVICE_ROLE_KEY=eyJxxx

# Mercado Pago
NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY=APP_USR-xxx
MERCADOPAGO_ACCESS_TOKEN=APP_USR-xxx

# Evolution API (WhatsApp)
EVOLUTION_API_URL=https://evolution.yourserver.com
EVOLUTION_API_KEY=your-api-key

# OpenAI
OPENAI_API_KEY=sk-xxx

# SMTP (fallback global - opcional se configurado no DB)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=noreply@meucondominiofacil.com
SMTP_PASSWORD=xxx
SMTP_FROM_EMAIL=noreply@meucondominiofacil.com
SMTP_FROM_NAME=Meu Condomínio Fácil

# Vercel (auto-populated)
VERCEL_URL=auto-set
NEXT_PUBLIC_VERCEL_URL=auto-set
```

---

## Webhooks Recebidos

| Serviço | Endpoint | Eventos |
|---------|----------|---------|
| Mercado Pago | `/api/webhooks/mercadopago` | `payment.*` |
| Evolution API | `/api/webhooks/whatsapp` (futuro) | Mensagens recebidas |

**Segurança**: Todos os webhooks validam assinatura/token antes de processar.
