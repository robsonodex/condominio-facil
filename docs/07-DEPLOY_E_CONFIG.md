# 07 - Guia de Deploy e Configuração Inicial

Este guia explica como colocar o **Meu Condomínio Fácil** no ar e configurar as variáveis essenciais.

## 🚀 Processo de Deploy (Vercel)

1. **Conexão**: Vincule o repositório GitHub ao projeto na Vercel.
2. **Build Settings**: 
   - Framework Preset: `Next.js`
   - Build Command: `npm run build`
   - Output Directory: `.next`
3. **Environment Variables**: Adicione todas as variáveis listadas na seção abaixo.
4. **Deploy**: O deploy é disparado automaticamente a cada `git push main`.

## ⚙️ Variáveis de Ambiente Essenciais

### Supabase
- `NEXT_PUBLIC_SUPABASE_URL`: URL do seu projeto Supabase.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Chave anônima para chamadas client-side.
- `SUPABASE_SERVICE_ROLE_KEY`: **CRITICAL** - Usada apenas em Server Components e API Routes.

### Integrações
- `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS`: Configuração para envio de e-mails transacionais (boas-vindas, notificações).
- `CRON_SECRET`: Chave secreta para autenticar chamadas de agendamento (Ex: limpeza de demo).

## 🛠️ Configuração de um Novo Condomínio

1. Acesse o painel `/admin`.
2. Clique em "Novo Condomínio".
3. Preencha os dados básicos.
4. **V10.0**: Acesse o Dashboard do Condomínio criado e ative os módulos básicos desejados.
5. Configure as chaves de API do Mercado Pago/Asaas na aba de Integrações se o financeiro for utilizado.
