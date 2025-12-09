# 🌐 Migração para meucondominiofacil.com - Guia Completo

## ✅ CHECKLIST DE MIGRAÇÃO

### 1. Vercel - Domínio Customizado

1. Acesse **Vercel Dashboard** → Seu projeto → **Settings** → **Domains**
2. Adicione: `meucondominiofacil.com`
3. Adicione: `www.meucondominiofacil.com`
4. Copie os registros DNS exibidos

### 2. Hostinger - Configuração DNS

Acesse **Hostinger** → **Domínios** → **meucondominiofacil.com** → **Zona DNS**

Adicione os seguintes registros:

```
# Registro A (domínio raiz)
Tipo: A
Nome: @
Valor: 76.76.21.21  (IP da Vercel)
TTL: 3600

# Registro CNAME (www)
Tipo: CNAME
Nome: www
Valor: cname.vercel-dns.com
TTL: 3600

# Registro TXT (verificação Vercel - copie o valor exato do dashboard)
Tipo: TXT
Nome: _vercel
Valor: vc-domain-verify=...  (copie do Vercel)
TTL: 3600
```

### 3. Vercel - Variáveis de Ambiente

Acesse **Vercel** → **Settings** → **Environment Variables**

Atualize/Adicione:

```env
# URL da Aplicação
NEXT_PUBLIC_APP_URL=https://meucondominiofacil.com

# Supabase (manter)
NEXT_PUBLIC_SUPABASE_URL=sua_url_atual
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_anon_key_atual
SUPABASE_SERVICE_ROLE_KEY=sua_service_role_atual

# SMTP Hostinger
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=contato@meucondominiofacil.com
SMTP_PASS=SUA_SENHA_DO_EMAIL
SMTP_FROM=Condomínio Fácil <contato@meucondominiofacil.com>

# Mercado Pago (manter)
MERCADOPAGO_ACCESS_TOKEN=seu_token_mp
MERCADOPAGO_WEBHOOK_SECRET=seu_webhook_secret
```

### 4. Supabase - URLs de Autenticação

Acesse **Supabase** → **Authentication** → **URL Configuration**

Atualize:

```
Site URL: https://meucondominiofacil.com

Redirect URLs (adicione todas):
- https://meucondominiofacil.com/**
- https://meucondominiofacil.com/auth/callback
- https://meucondominiofacil.com/auth/reset-password
- https://www.meucondominiofacil.com/**
```

### 5. Mercado Pago - Webhook

Acesse **Mercado Pago** → **Suas integrações** → **Webhooks**

Atualize a URL:
```
https://meucondominiofacil.com/api/webhooks/mercadopago
```

### 6. Hostinger - Configuração de Email

#### 6.1 SPF (já existe por padrão na Hostinger)
```
Tipo: TXT
Nome: @
Valor: v=spf1 include:_spf.hostinger.com ~all
```

#### 6.2 DKIM (gerar no painel Hostinger → Email → DKIM)
```
Tipo: TXT
Nome: default._domainkey
Valor: (copie do painel Hostinger)
```

#### 6.3 DMARC (opcional, mas recomendado)
```
Tipo: TXT
Nome: _dmarc
Valor: v=DMARC1; p=none; rua=mailto:contato@meucondominiofacil.com
```

---

## 🔄 Redeploy

Após configurar tudo, faça um redeploy:

```bash
git commit --allow-empty -m "Trigger redeploy for domain migration"
git push origin master:main
```

Ou faça redeploy manual na Vercel.

---

## 🧪 Testes de Validação

### 1. DNS
```bash
# Verificar registros A
nslookup meucondominiofacil.com

# Verificar CNAME
nslookup www.meucondominiofacil.com
```

### 2. SSL
- Após DNS propagar (~15 min), acesse https://meucondominiofacil.com
- Certificado SSL é gerado automaticamente pela Vercel

### 3. Email
- Envie email de teste pelo sistema
- Verifique entrega no spam
- Use [mail-tester.com](https://www.mail-tester.com) para validar

### 4. Funcionalidades
- [ ] Login funciona
- [ ] Registro funciona
- [ ] Reset de senha envia email
- [ ] Checkout Mercado Pago funciona
- [ ] Webhook recebe notificações
- [ ] Boleto é gerado
- [ ] Emails são enviados

---

## ⏱️ Tempo de Propagação

| Item | Tempo |
|------|-------|
| DNS | 15 min a 48h |
| SSL | 5-15 min após DNS |
| Email SPF/DKIM | Imediato a 24h |

---

## ⚠️ Troubleshooting

| Problema | Solução |
|----------|---------|
| Site não abre | Aguarde propagação DNS |
| Erro SSL | Aguarde certificado ser gerado |
| Email no spam | Configure DKIM e DMARC |
| Webhook falha | Verifique URL no Mercado Pago |
| Login falha | Verifique URLs no Supabase |

---

## 📋 Resumo de Alterações

| Local | O que mudar |
|-------|-------------|
| Vercel | `NEXT_PUBLIC_APP_URL` + domínio |
| Hostinger DNS | Registros A, CNAME, TXT |
| Supabase Auth | Site URL + Redirect URLs |
| Mercado Pago | URL do webhook |
| Hostinger Email | SPF, DKIM, DMARC |

---

**Após conclusão:** A aplicação estará acessível em `https://meucondominiofacil.com` 🚀
