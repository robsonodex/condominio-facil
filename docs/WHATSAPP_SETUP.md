# Guia de Configuração WhatsApp

## Opção 1: Meta Cloud API (Recomendado)

### Passo 1: Criar Conta Meta Business
1. Acesse https://business.facebook.com
2. Crie uma conta Business
3. Verifique sua empresa

### Passo 2: Configurar WhatsApp Business
1. Acesse https://developers.facebook.com
2. Crie um App tipo "Business"
3. Adicione o produto "WhatsApp"
4. Obtenha um número de teste ou adicione seu número

### Passo 3: Obter Credenciais
1. Em WhatsApp > API Setup:
   - **Phone Number ID**: Copie o ID do telefone
   - **Access Token**: Gere um token permanente

### Passo 4: Aprovar Templates
No WhatsApp Manager, crie templates para:
- `cobranca_gerada`: "Olá! Nova cobrança: R$ {{1}}. Link: {{2}}"
- `boleto_disponivel`: "Boleto disponível: R$ {{1}}, vence {{2}}. Link: {{3}}"
- `pagamento_confirmado`: "Pagamento de R$ {{1}} confirmado em {{2}}."

### Passo 5: Configurar no Vercel
```bash
WHATSAPP_TOKEN=seu_access_token_permanente
WHATSAPP_PHONE_ID=seu_phone_number_id
```

---

## Opção 2: Twilio

### Passo 1: Criar Conta Twilio
1. Acesse https://www.twilio.com
2. Crie conta e verifique

### Passo 2: Ativar WhatsApp
1. Console > Messaging > WhatsApp
2. Ative sandbox para testes
3. Obtenha número de produção se necessário

### Passo 3: Credenciais
```bash
TWILIO_ACCOUNT_SID=seu_account_sid
TWILIO_AUTH_TOKEN=seu_auth_token
WHATSAPP_FROM=whatsapp:+14155238886
```

---

## Testar Integração

```bash
# Chamar endpoint de teste
curl -X POST https://seusite.vercel.app/api/notifications/whatsapp/send \
  -H "Content-Type: application/json" \
  -H "Cookie: seu_cookie_auth" \
  -d '{
    "phone": "5511999999999",
    "type": "mensagem_livre",
    "data": { "message": "Teste de integração" }
  }'
```

---

## Modo Mock (sem credenciais)

Se as variáveis não estiverem configuradas, o sistema funciona em modo mock:
- Mensagens são logadas no console
- Retorna sucesso com messageId fake
- Útil para desenvolvimento

---

## Custos Estimados

| Provider | Custo por mensagem |
|----------|-------------------|
| Meta Cloud API | ~R$ 0,40 (template) |
| Twilio | ~R$ 0,25 (sandbox) |
