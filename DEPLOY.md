# Deploy na Vercel - Guia Completo

## Pré-requisitos

1. Conta no [Vercel](https://vercel.com)
2. Projeto Supabase configurado
3. Repositório Git (GitHub, GitLab ou Bitbucket)

---

## Passo 1: Preparar o Repositório

```bash
# Inicializar Git (se ainda não fez)
git init
git add .
git commit -m "Initial commit - Condomínio Fácil"

# Conectar ao GitHub
git remote add origin https://github.com/SEU-USUARIO/condominio-facil.git
git push -u origin main
```

---

## Passo 2: Importar no Vercel

1. Acesse [vercel.com/new](https://vercel.com/new)
2. Clique em **Import Git Repository**
3. Selecione o repositório `condominio-facil`
4. Configure as **Environment Variables**:

| Variável | Valor |
|----------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://seu-projeto.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `sua-chave-anon` |

5. Clique em **Deploy**

---

## Passo 3: Configurar Domínio Próprio

1. Após o deploy, vá em **Settings → Domains**
2. Adicione seu domínio: `app.seudominio.com.br`
3. Configure os DNS no seu provedor:

```
Tipo: CNAME
Nome: app
Valor: cname.vercel-dns.com
```

Ou para domínio raiz:
```
Tipo: A
Nome: @
Valor: 76.76.21.21
```

---

## Passo 4: Configurar Supabase para Produção

No Supabase, vá em **Authentication → URL Configuration**:

- **Site URL**: `https://app.seudominio.com.br`
- **Redirect URLs**: 
  - `https://app.seudominio.com.br/auth/callback`
  - `https://seuapp.vercel.app/auth/callback`

---

## Comandos Úteis

```bash
# Build local para teste
npm run build

# Preview do deploy
vercel

# Deploy de produção
vercel --prod

# Ver logs
vercel logs
```

---

## Troubleshooting

### Erro 500 no Login
- Verifique as variáveis de ambiente no Vercel
- Confirme que o Supabase tem as URLs corretas

### Página em Branco
- Verifique se o build passou sem erros
- Confira os logs do Vercel

### RLS Blocking Queries
- Execute o schema.sql novamente no Supabase
- Verifique se as políticas RLS estão corretas

---

## Estrutura de Custos

### Vercel
- **Hobby** (Grátis): Ideal para testes
- **Pro** ($20/mês): Recomendado para produção

### Supabase
- **Free**: 500MB banco, 1GB storage
- **Pro** ($25/mês): 8GB banco, 100GB storage

---

## Checklist de Deploy

- [ ] Variáveis de ambiente configuradas
- [ ] Build passando sem erros
- [ ] Domínio configurado
- [ ] Supabase URLs atualizadas
- [ ] SSL ativo no domínio
- [ ] Testado login/logout
- [ ] Testado CRUD de dados

