# 🚀 Guia de Deploy - Meu Condomínio Fácil

**Versão 3.0 | Atualizado: 17/12/2025**  
**CNPJ: 57.444.727/0001-85**

Este guia cobre o processo completo de deploy do sistema Meu Condomínio Fácil para produção.

---

## ⚠️ IMPORTANTE

O sistema é **100% WEB** - não existe aplicativo nativo. O deploy é feito apenas na Vercel.

---

## 📋 Pré-requisitos

### Contas Necessárias

1. **Vercel** (Hospedagem)
   - Conta configurada e conectada ao GitHub
   - Projeto já linkado

2. **Supabase** (Banco de Dados)
   - Projeto criado
   - Database configurado
   - API Keys disponíveis

3. **Mercado Pago** (Pagamentos - Suas cobranças)
   - Conta vendedor criada
   - Access Token e Public Key

4. **SMTP Email** (Envio de e-mails)
   - Servidor SMTP configurado
   - Credenciais disponíveis

---

## ⚙️ Variáveis de Ambiente

### Arquivo `.env.local` (Desenvolvimento)

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://seu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-anon-key
SUPABASE_SERVICE_ROLE_KEY=sua-service-role-key

# Mercado Pago (SUAS cobranças de assinatura)
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

```bash
npm run build
```

Se houver erros, corrija antes de prosseguir.

### 2. Commit e Push

```bash
git add .
git commit -m "feat: Production deployment"
git push origin main
```

**Vercel detecta automaticamente** e inicia o deploy!

### 3. Monitoramento

1. Acesse https://vercel.com/seu-projeto/deployments
2. Veja logs em tempo real
3. Aguarde conclusão (2-5 minutos)

---

## 🗄️ Migrations do Banco

### Migrations Obrigatórias

Execute no Supabase Dashboard → SQL Editor:

1. `supabase/schema.sql` - Schema inicial
2. `supabase/migrations/*.sql` - Todas as migrations em ordem

### Migration de Integrações Multi-Tenant

Para suportar integrações bancárias e WhatsApp por cliente:

```sql
-- Execute: supabase/migrations/20241217_condo_integrations.sql
```

Esta migration cria:
- Tabela `condo_integrations` (credenciais por cliente)
- Tabela `integration_logs` (auditoria)
- Políticas RLS
- Função `get_condo_integration`

---

## 🔌 Integrações (Por Cliente)

### Arquitetura Multi-Tenant

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

### Cadastrar Integração de Cliente

```sql
-- Integração Bancária (exemplo Mercado Pago)
INSERT INTO condo_integrations (condo_id, tipo, provider, credentials, config)
VALUES (
    'uuid-do-condominio',
    'pagamentos',
    'mercadopago',
    '{"access_token": "APP_USR-xxx", "public_key": "APP_USR-xxx"}'::jsonb,
    '{"nome_exibicao": "Cond. Villa Flora"}'::jsonb
);

-- Integração WhatsApp (exemplo Evolution)
INSERT INTO condo_integrations (condo_id, tipo, provider, credentials, config)
VALUES (
    'uuid-do-condominio',
    'whatsapp',
    'evolution',
    '{"evolution_url": "https://...", "instance_name": "condo_123", "api_key": "xxx"}'::jsonb,
    '{"nome_perfil": "Cond. Villa Flora"}'::jsonb
);

-- Ativar WhatsApp no condomínio
UPDATE condos SET whatsapp_active = true WHERE id = 'uuid-do-condominio';
```

---

## 🧪 Checklist Pós-Deploy

### Funcionalidades Críticas

- [ ] Landing page carrega corretamente
- [ ] Login funciona
- [ ] Dashboard carrega
- [ ] Cadastro de novo cliente funciona
- [ ] Mercado Pago redirect funciona
- [ ] Email de boas-vindas é enviado
- [ ] Portaria registra visitantes
- [ ] Relatórios são gerados

### Páginas Legais

- [ ] /termos - Termos de uso
- [ ] /privacidade - Política de privacidade
- [ ] /lgpd - Política LGPD
- [ ] /contrato - Contrato de prestação

---

## 🔐 Segurança

### Checklist de Segurança

- [x] HTTPS habilitado (automático no Vercel)
- [x] Variáveis de ambiente protegidas
- [x] Service Role Key nunca exposta no client
- [x] RLS (Row Level Security) ativo
- [x] Conformidade LGPD (documento publicado)
- [ ] Configure rate limiting no Vercel (Opcional)

---

## 🆘 Troubleshooting

### Build Falha no Vercel

1. Veja logs de build no Vercel
2. Teste `npm run build` localmente
3. Verifique dependências no `package.json`
4. Limpe cache do Vercel (Redeploy)

### Erro 500 em Produção

1. Veja Runtime Logs no Vercel
2. Verifique variáveis de ambiente
3. Teste endpoints da API localmente

---

## 📚 Documentação Relacionada

| Documento | Descrição |
|-----------|-----------|
| `MANUAL_COMPLETO.md` | Manual completo do sistema |
| `VENDAS.md` | Guia de vendas |
| `docs/INTEGRACAO_BANCARIA.md` | Manual integração bancária |
| `docs/INTEGRACAO_WHATSAPP.md` | Manual integração WhatsApp |
| `legal/termos_uso_v1.0.md` | Termos de uso |
| `legal/lgpd_v1.0.md` | Política LGPD |

---

**Última Atualização**: 17/12/2025  
**Versão**: 3.0  
**CNPJ**: 57.444.727/0001-85

**Boa sorte com o deploy! 🚀**
