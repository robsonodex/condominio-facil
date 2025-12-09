# 🌐 Checklist: Mudança de Domínio

Quando você mudar o domínio da aplicação (ex: de `condominofacil.vercel.app` para `meusistema.com.br`), siga este checklist:

---

## 1. Vercel - Variáveis de Ambiente

Acesse: **Vercel → Settings → Environment Variables**

Atualize:
```
NEXT_PUBLIC_APP_URL=https://seunovodominio.com.br
```

---

## 2. Supabase - URLs de Autenticação

Acesse: **Supabase → Authentication → URL Configuration**

Atualize:
- **Site URL**: `https://seunovodominio.com.br`
- **Redirect URLs**: Adicione:
  ```
  https://seunovodominio.com.br/**
  https://seunovodominio.com.br/auth/callback
  https://seunovodominio.com.br/auth/reset-password
  ```

---

## 3. Mercado Pago - URLs de Retorno

Acesse: **Mercado Pago → Configurações → Webhooks**

Atualize:
- **URL de notificação**: `https://seunovodominio.com.br/api/webhooks/mercadopago`

As URLs de retorno (back_urls) são configuradas no código e usam `NEXT_PUBLIC_APP_URL`, então já atualizam automaticamente.

---

## 4. SMTP / EmailJS (se usar)

Se tiver templates de email com links fixos, atualize para o novo domínio.

---

## 5. Arquivos do Projeto (Opcional)

Verifique se há URLs hardcoded em:
- `VENDAS.md` - Links de demonstração
- `MANUAL_COMPLETO.md` - URLs de exemplo
- `README.md` - Links do projeto

---

## 6. Redeploy

Após atualizar as variáveis:
```bash
git commit --allow-empty -m "Trigger redeploy for domain change"
git push origin master:main
```

Ou faça redeploy manual na Vercel.

---

## 📋 Checklist Resumido

| Item | Local | Atualizar |
|------|-------|-----------|
| ☐ | Vercel | `NEXT_PUBLIC_APP_URL` |
| ☐ | Supabase | Site URL + Redirect URLs |
| ☐ | Mercado Pago | URL de Webhook |
| ☐ | EmailJS/SMTP | Templates com links fixos |
| ☐ | Documentação | URLs de exemplo |
| ☐ | Redeploy | Aplicar mudanças |

---

## ⚠️ Atenção

- Mantenha o domínio antigo configurado por alguns dias (transição)
- Teste login, recuperação de senha e pagamentos no novo domínio
- Emails antigos com links para o domínio antigo continuarão funcionando se mantiver redirecionamento
