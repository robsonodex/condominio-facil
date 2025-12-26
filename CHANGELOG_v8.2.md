# 📋 CHANGELOG v8.2 - 26/12/2024

## Visão Geral

Atualização focada em correções críticas de autenticação, sistema de e-mail e ferramentas de emergência.

---

## ✅ Correções Implementadas

### 1. **Loop Infinito no Logout** (CORRIGIDO)
- **Problema:** Ao clicar em "Sair", o sistema entrava em loop infinito
- **Causa:** Race condition entre signOut() e redirecionamento
- **Solução:** 
  - Limpeza agressiva de cookies e storage ANTES do signOut
  - Parâmetro `?logout=true` para evitar redirect automático na página de login
  - Hard reload após logout

### 2. **Sistema de E-mail Completamente Reformulado** (CORRIGIDO)
- **Problema:** E-mails não eram enviados ao cadastrar síndico ou testar conexão
- **Causa:** Chamadas HTTP internas (`fetch('/api/email')`) não incluíam autenticação
- **Solução:**
  - Criado `/lib/email-helper.ts` com envio direto via nodemailer
  - API de criação de usuário agora usa helper em vez de HTTP
  - Detecção automática de SSL baseada na porta (465=SSL, 587=STARTTLS)
  - Criptografia de senha SMTP implementada corretamente
  - Teste de SMTP agora envia e-mail real de confirmação

### 3. **Erros 401 em APIs (Superadmin)** (CORRIGIDO)
- **Problema:** APIs `/api/check-trial` e `/api/chat-sindico` retornavam 401 para superadmin
- **Causa:** Superadmin não tem condoId associado
- **Solução:** APIs agora retornam dados padrão vazios para superadmin sem condoId

### 4. **Criptografia de Senha SMTP** (CORRIGIDO)
- **Problema:** Senha SMTP era salva sem criptografia mas código tentava descriptografar
- **Causa:** Função `encryptPassword()` não era chamada ao salvar
- **Solução:** Criptografia aplicada tanto na atualização quanto na criação de config SMTP

---

## 🆕 Novas Funcionalidades

### 1. **Páginas de Emergência**

#### `/reset-emergencia` (PÚBLICO)
- Reset de senha sem precisar estar logado
- Protegido por chave secreta
- Não envia e-mail, reseta diretamente no Supabase Auth
- **Uso:** Quando administrador está travado fora do sistema

#### `/emergency-repair` (SUPERADMIN ONLY)
- Verificar status de usuários (Auth + Profile)
- Resetar senhas de qualquer usuário
- Listar todos os usuários do sistema
- **Uso:** Ferramentas administrativas de emergência

### 2. **Email Helper Server-Side**
- Nova lib `/lib/email-helper.ts`
- Função `sendCredentialsEmail()` para envio direto
- Função `sendEmailDirect()` para envio genérico
- Busca SMTP global automaticamente
- Logs detalhados no console

---

## 📁 Arquivos Modificados/Criados

### Novos Arquivos
| Arquivo | Descrição |
|---------|-----------|
| `src/lib/email-helper.ts` | Helper para envio de e-mail server-side |
| `src/app/(public)/reset-emergencia/page.tsx` | Página pública de reset de senha |
| `src/app/api/public-reset/route.ts` | API pública de reset de senha |
| `src/app/emergency-repair/page.tsx` | Página de ferramentas de emergência |
| `src/app/api/emergency-repair/route.ts` | API de ferramentas de emergência |

### Arquivos Modificados
| Arquivo | Alteração |
|---------|-----------|
| `src/components/shared/header.tsx` | Limpeza agressiva no logout |
| `src/app/login/page.tsx` | Verificação do parâmetro logout |
| `src/app/api/admin/smtp-global/route.ts` | Criptografia de senha SMTP |
| `src/app/api/admin/smtp-global/test/route.ts` | Envio de email real + SSL automático |
| `src/app/api/email/route.ts` | SSL automático baseado na porta |
| `src/app/api/check-trial/route.ts` | Suporte a superadmin sem condoId |
| `src/app/api/chat-sindico/route.ts` | Suporte a superadmin sem condoId |
| `src/app/api/admin/users/route.ts` | Uso do email-helper direto |
| `src/app/(dashboard)/admin/email/page.tsx` | Não limpar senha após salvar |

---

## 🔧 Configuração Necessária

### SMTP Global
1. Acessar **Admin > Configurações de E-mail**
2. Configurar:
   - Host: `smtp.hostinger.com` (ou seu provedor)
   - Porta: `465` (SSL) ou `587` (STARTTLS)
   - Usuário e Senha
   - E-mail de envio
3. Salvar e testar conexão

### Variáveis de Ambiente (Opcional)
```env
SMTP_ENCRYPTION_KEY=sua-chave-secreta  # Para criptografia de senha
```

Se não definida, usa chave padrão (menos seguro em produção).

---

## ⚠️ Ações Pendentes

### RLS (Row Level Security)
Executar no Supabase SQL Editor:
```
supabase/migrations/20251226_fix_rls.sql
```

### Segurança das Páginas de Emergência
Após uso, considerar:
- Alterar chave secreta em `/api/public-reset/route.ts`
- Ou remover `/reset-emergencia` se não for mais necessária

---

## 📊 Estatísticas

- **Commits:** 10+
- **Arquivos criados:** 5
- **Arquivos modificados:** 10+
- **Linhas de código:** ~800 novas

---

**Versão:** 8.2  
**Data:** 26/12/2024  
**Autor:** Sistema Automatizado + Correções Manuais
