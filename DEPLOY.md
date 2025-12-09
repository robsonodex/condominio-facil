# 🚀 Guia de Deploy - Condomínio Fácil

**Versão 2.0 | Atualizado: 09/12/2025**

Este guia cobre o processo completo de deploy do sistema Condomínio Fácil para produção.

---

## 📋 Pré-requisitos

### Contas Necessárias

1. **Vercel** (Já configurado ✅)
   - Conta configurada e conectada ao GitHub
   - Projeto já linkado

2. **Supabase** (Já configurado ✅)
   - Projeto criado
   - Database configurado
   - API Keys disponíveis

3. **Mercado Pago** (Configurar ⚠️)
   - Conta vendedor criada
   - Access Token e Public Key
   - Webhook Secret

4. **SMTP Email** (Configurar ⚠️)
   - Servidor SMTP configurado
   - Credenciais disponíveis

5. **Google Analytics** (Opcional)
   - Measurement ID

---

## ⚙️ Variáveis de Ambiente

### Arquivo `.env.local` (Desenvolvimento)

Já configurado localmente. Para produção, configure no Vercel:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://seu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-anon-key
SUPABASE_SERVICE_ROLE_KEY=sua-service-role-key

# Mercado Pago
NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY=APP_USR-xxxxxxxxxxxxxxxx
MERCADOPAGO_ACCESS_TOKEN=APP_USR-xxxxxxxxxxxxxxxx
MERCADOPAGO_WEBHOOK_SECRET=seu-webhook-secret

# Email (Nodemailer)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=seu@email.com
SMTP_PASS=sua-senha-app
SMTP_FROM=noreply@meucondominiofacil.com

# App
NEXT_PUBLIC_APP_URL=https://meucondominiofacil.com

# Analytics (Opcional)
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX

# Signup Config
SIGNUP_DEFAULT_ROLE=morador
TRIAL_DAYS=7
```

### Configurando no Vercel

1. Acesse https://vercel.com/seu-projeto
2. Settings → Environment Variables
3. Adicione cada variável acima
4. **IMPORTANTE**: Marque quais são "Production", "Preview" ou "Development"

---

## 📦 Processo de Deploy

### 1. Build Local (Teste)

Antes de fazer deploy, teste o build localmente:

```bash
npm run build
```

Se houver erros, corrija antes de prosseguir.

### 2. Commit e Push

```bash
git add .
git commit -m "feat: Ready for production deployment"
git push origin feature/landingpage
```

### 3. Merge para Main (Produção)

```bash
git checkout main
git merge feature/landingpage
git push origin main
```

**Vercel detecta automaticamente** e inicia o deploy!

### 4. Monitoramento do Deploy

1. Acesse https://vercel.com/seu-projeto/deployments
2. Veja logs em tempo real
3. Aguarde conclusão (2-5 minutos)

---

## 🗄️ Banco de Dados

### Migrations Pendentes

Se houver migrations novas (ex: `rental_system.sql`):

1. Acesse Supabase Dashboard
2. SQL Editor
3. Cole o conteúdo do arquivo `supabase/migrations/*.sql`
4. Execute

**Migrations já aplicadas** ✅:
- Schema inicial (`schema.sql`)
- Rental system (`rental_system.sql`)

### Verificando Tabelas

Execute no SQL Editor:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;
```

Tabelas esperadas:
- plans
- condos
- units
- users
- residents
- financial_entries
- notices
- occurrences
- visitors
- subscriptions
- rental_contracts (novo)
- rent_invoices (novo)

---

## 💳 Mercado Pago

### Configuração do Webhook

1. Acesse https://mercadopago.com.br/developers
2. "Suas integrações" → Selecione sua aplicação
3. "Webhooks"
4. Adicione novo webhook:
   - **URL**: `https://meucondominiofacil.com/api/webhooks/mercadopago`
   - **Eventos**:
     - ✅ `payment`
     - ✅ `merchant_order`
5. Copie o **Webhook Secret** e adicione no Vercel

### Testando Webhook

Use ferramentas como RequestBin ou Webhook.site para testar:

```bash
curl -X POST https://meucondominiofacil.com/api/webhooks/mercadopago \
  -H "Content-Type: application/json" \
  -H "x-signature: test" \
  -d '{"action":"payment.created","data":{"id":"123"}}'
```

---

## 📧 Email (SMTP)

### Opção 1: Gmail

1. Ative "Verificação em 2 etapas"
2. Gere "Senha de app": https://myaccount.google.com/apppasswords
3. Use essa senha no `SMTP_PASS`

Limitações:
- 500 emails/dia (grátis)
- Pode cair em spam

### Opção 2: SendGrid (Recomendado)

1. Crie conta: https://sendgrid.com
2. Verify sender identity
3. Crie API Key
4. Configure:
   ```
   SMTP_HOST=smtp.sendgrid.net
   SMTP_PORT=587
   SMTP_USER=apikey
   SMTP_PASS=SG.xxxxxxxxxxxxxxxx
   ```

Vantagens:
- 100 emails/dia (grátis)
- Melhor deliverability

### Testando Email

No sistema, crie um novo usuário e verifique se o email de boas-vindas chegou.

---

## 🌐 Domínio Personalizado

### Configurando no Vercel

1. Vercel Dashboard → Settings → Domains
2. Adicione `meucondominiofacil.com`
3. Configure DNS:

**Registrador do domínio** (ex: Registro.br, GoDaddy):

```
Tipo: A
Nome: @
Valor: 76.76.21.21

Tipo: CNAME
Nome: www
Valor: cname.vercel-dns.com
```

4. Aguarde propagação (até 48h, geralmente 30min)
5. Vercel configura SSL automaticamente

---

## 🔒 Segurança

### Checklist de Segurança

- [x] HTTPS habilitado (automático no Vercel)
- [x] Variáveis de ambiente protegidas
- [x] Service Role Key do Supabase nunca exposta no client
- [x] Webhook signature validation
- [x] RLS (Row Level Security) ativo no Supabase
- [ ] Configure rate limiting no Vercel (Opcional)
- [ ] Configure WAF rules no Vercel (Plano Pro)

### Backup do Banco

Supabase faz backup automático, mas você pode fazer manualmente:

1. Supabase Dashboard → Database → Backups
2. "Create Backup"
3. Download do SQL dump

---

## 📊 Monitoramento

### Vercel Analytics

Já habilitado automaticamente:
- Page Views
- Unique Visitors
- Top Pages

### Error Monitoring

Logs disponíveis em:
- Vercel → Deployment → Logs (runtime)
- Vercel → Deployment → Build Logs (build time)

### Uptime Monitoring (Recomendado)

Use algum serviço gratuito:
- **UptimeRobot**: https://uptimerobot.com (50 monitores grátis)
- **Pingdom**: https://pingdom.com

Configure para monitorar:
- `https://meucondominiofacil.com` (homepage)
- `https://meucondominiofacil.com/api/health` (se criar endpoint)

---

## 🧪 Checklist Pós-Deploy

### Funcionalidades Críticas

- [ ] Landing page carrega corretamente
- [ ] Login funciona
- [ ] Dashboard carrega sem loading infinito
- [ ] Cadastro de novo cliente via checkout funciona
- [ ] Mercado Pago redirect funciona
- [ ] Webhook Mercado Pago recebe notificações
- [ ] Email de boas-vindas é enviado
- [ ] Criação automática de condo/user/subscription funciona
- [ ] Portaria registra visitantes
- [ ] Ocorrências são criadas
- [ ] Avisos são publicados
- [ ] Relatórios são gerados

### Performance

- [ ] Lighthouse Score > 90
- [ ] First Contentful Paint < 1.5s
- [ ] Time to Interactive < 3s
- [ ] Build size < 500KB (gzipped)

### SEO

- [ ] Meta tags corretas
- [ ] Schema.org markup present
- [ ] Open Graph tags
- [ ] Sitemap.xml gerado
- [ ] robots.txt configurado

---

## 🐛 Troubleshooting

### Build Falha no Vercel

1. Veja logs de build no Vercel
2. Teste `npm run build` localmente
3. Verifique dependências no `package.json`
4. Limpe cache do Vercel (Redeploy)

### Erro 500 em Produção

1. Veja Runtime Logs no Vercel
2. Verifique variáveis de ambiente
3. Teste endpoints da API localmente
4. Verifique conexão com Supabase

### Webhook Mercado Pago Não Funciona

1. Verifique URL do webhook no MP Dashboard
2. Teste signature validation
3. Veja logs do endpoint `/api/webhooks/mercadopago`
4. Verifique se `MERCADOPAGO_WEBHOOK_SECRET` está configurado

### Email Não Envia

1. Teste credenciais SMTP
2. Verifique porta (587 ou 465)
3. Veja logs do Nodemailer
4. Teste com ferramenta externa (Mailtrap)

---

## 📈 Métricas de Sucesso

Monitore:

1. **Conversão**
   - Landing → Checkout: 2-5%
   - Checkout → Pagamento: 30-50%
   - Teste → Pago: 20-40%

2. **Performance**
   - Uptime > 99.9%
   - Response Time < 200ms (API)
   - Page Load < 2s

3. **Negócio**
   - MRR (Monthly Recurring Revenue)
   - Churn Rate
   - CAC (Customer Acquisition Cost)
   - LTV (Lifetime Value)

---

## 🔄 Rollback (Em Caso de Problema)

1. Vercel Dashboard → Deployments
2. Encontre deployment anterior (estável)
3. Clique em "..." → "Promote to Production"
4. Confirme

**O sistema volta instantly para versão anterior!**

---

## 📅 Manutenção Contínua

### Semanal

- [ ] Verificar uptime
- [ ] Analisar erros nos logs
- [ ] Monitorar métricas de conversão

### Mensal

- [ ] Atualizar dependências (`npm outdated`)
- [ ] Revisar segurança
- [ ] Fazer backup manual do banco
- [ ] Analisar performance (Lighthouse)

---

## ✅ Deploy Checklist Final

- [ ] Variáveis de ambiente configuradas no Vercel
- [ ] Build local passou sem erros
- [ ] Migrations do banco executadas
- [ ] Webhook Mercado Pago configurado
- [ ] SMTP testado e funcionando
- [ ] Landing page funcionando
- [ ] Checkout + MP redirect OK
- [ ] Webhook recebendo notificações
- [ ] Emails sendo enviados
- [ ] Domínio apontando corretamente  
- [ ] SSL ativo
- [ ] Uptime monitoring configurado
- [ ] Google Analytics ativo (opcional)
- [ ] Teste E2E completo executado

---

## 🆘 Suporte

Em caso de problemas:

1. **Vercel**: https://vercel.com/support
2. **Supabase**: https://supabase.com/support
3. **Mercado Pago**: https://developers.mercadopago.com/support

---

**Última Atualização**: 09/12/2025  
**Versão**: 2.0

**Boa sorte com o deploy! 🚀**
