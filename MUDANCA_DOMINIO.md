# 🌐 Checklist: Mudança de Domínio

Este guia foi atualizado para o domínio **meucondominiofacil.com**.

Para instruções detalhadas de migração, veja: **[MIGRACAO_DOMINIO.md](./MIGRACAO_DOMINIO.md)**

---

## 1. Vercel - Variáveis de Ambiente

Acesse: **Vercel → Settings → Environment Variables**

Atualize:
```
NEXT_PUBLIC_APP_URL=https://meucondominiofacil.com
```

---

## 2. Supabase - URLs de Autenticação

Acesse: **Supabase → Authentication → URL Configuration**

Atualize:
- **Site URL**: `https://meucondominiofacil.com`
- **Redirect URLs**: Adicione:
  ```
  https://meucondominiofacil.com/**
  https://meucondominiofacil.com/auth/callback
  https://meucondominiofacil.com/auth/reset-password
  ```

---

## 3. Mercado Pago - URLs de Retorno

Acesse: **Mercado Pago → Configurações → Webhooks**

Atualize:
- **URL de notificação**: `https://meucondominiofacil.com/api/webhooks/mercadopago`

---

## 4. SMTP / Email

Configure as variáveis na Vercel:
```
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=contato@meucondominiofacil.com
SMTP_PASS=SUA_SENHA
SMTP_FROM=Condomínio Fácil <contato@meucondominiofacil.com>
```

---

## 5. DNS Hostinger

Configure na zona DNS do domínio:

| Tipo | Nome | Valor |
|------|------|-------|
| A | @ | 76.76.21.21 |
| CNAME | www | cname.vercel-dns.com |
| TXT | _vercel | (copie do dashboard Vercel) |

---

## 6. Redeploy

Após atualizar as variáveis:
```bash
git commit --allow-empty -m "Trigger redeploy for domain change"
git push origin master:main
```

---

## 📋 Checklist Resumido

| Item | Status |
|------|--------|
| ☐ Vercel | `NEXT_PUBLIC_APP_URL` atualizado |
| ☐ Supabase | Site URL + Redirect URLs |
| ☐ Mercado Pago | URL de Webhook |
| ☐ SMTP | Variáveis configuradas |
| ☐ DNS | Registros A/CNAME/TXT |
| ☐ Redeploy | Mudanças aplicadas |

---

Para mais detalhes, consulte **[MIGRACAO_DOMINIO.md](./MIGRACAO_DOMINIO.md)**.
