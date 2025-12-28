# 🎯 Guia Completo: Como Vender e Ativar um Plano

---

## ❓ DÚVIDAS RÁPIDAS (Respostas Diretas)

### "Fechei a venda. O que faço agora?"

| **Passo** | **Ação** | **Onde** |
|-----------|----------|----------|
| **1** | Acesse o painel admin | `/admin/usuarios` |
| **2** | Clique **"+ Novo Usuário"** | Botão no topo |
| **3** | Preencha: Nome, Email, Senha, Role = **Síndico** | Formulário |
| **4** | Marque **"Criar novo condomínio"** | Opção que aparece |
| **5** | Escolha o **Plano** vendido | Básico/Profissional/Avançado |
| **6** | Marque **"Ativar imediatamente"** (se já pagou) | Checkbox |
| **7** | Clique **Salvar** | Botão verde |
| **8** | Envie ao cliente os dados de acesso | WhatsApp/Email |

### ⚡ Resumo em 1 linha:
> **Admin → Usuários → Novo → Síndico → Criar Condomínio → Plano → Ativar → Enviar dados**

---

### 📱 Template para enviar ao cliente:

```
✅ Acesso liberado!

Site: https://meucondominiofacil.com/login
Email: [email cadastrado]
Senha: [senha criada]

Acesse e comece a usar!
Dúvidas? Me chama no WhatsApp.
```

---

### "Cliente está em teste e quer pagar?"
1. Vá em `/admin/assinaturas`
2. Clique **📧 Cobrar** na assinatura dele
3. Sistema envia email com link de pagamento automático

### "Como dar mais dias de teste?"
1. Vá em `/admin/assinaturas`
2. Edite a assinatura
3. Altere a data de expiração

### "Cliente esqueceu a senha?"
1. Peça para clicar em **"Esqueci minha senha"** no login
2. Ou vá em `/admin/usuarios` e reset manualmente

### "Como o síndico pode me pagar direto do sistema?"
O síndico paga pela própria conta dele:
1. Ele acessa **"Minha Assinatura"** no menu lateral
2. Clica em **"Pagar"** ou **"Renovar"**
3. Escolhe: **Cartão**, **PIX** ou **Boleto** (Mercado Pago)
4. Paga e pronto! Sistema ativa automaticamente

**Ou você envia a cobrança:**
1. Vá em `/admin/assinaturas`
2. Clique **📧 Cobrar**
3. Cliente recebe email com link de pagamento

---

## 📋 PARA O ADMINISTRADOR (Você)

### Processo Completo de Venda

#### Passo 1: Cadastrar o Síndico
1. Acesse `/admin/usuarios`
2. Clique em **"+ Novo Usuário"**
3. Preencha os dados:
   - **Nome**: Nome completo do síndico
   - **Email**: Email do síndico (será o login)
   - **Senha**: Crie uma senha segura
   - **Telefone**: Opcional
   - **Role**: Selecione **"Síndico"**

#### Passo 2: Configurar o Condomínio
Quando selecionar "Síndico", aparecerão opções extras:

**Opção A - Criar Novo Condomínio:**
- Escolha **"Criar novo condomínio"**
- Preencha o **Nome do Condomínio**
- Selecione o **Plano** (Básico, Profissional, Premium)
- Marque:
  - ☑️ **Período de teste (7 dias)** - cliente testa grátis
  - ☐ **Ativar imediatamente** - cliente já pagou

**Opção B - Vincular a Assinatura Existente:**
- Escolha **"Vincular a assinatura existente"**
- Selecione a assinatura no dropdown

#### Passo 3: Enviar Credenciais ao Cliente
Após criar, envie ao síndico:
```
📧 SEUS DADOS DE ACESSO - CONDOMÍNIO FÁCIL

Site: https://seudominio.com.br
Email: [email que você cadastrou]
Senha: [senha que você criou]

Faça login e comece a usar!
```

#### Passo 4: Cobrar o Pagamento
1. Acesse `/admin/assinaturas`
2. Encontre a assinatura do cliente
3. Clique no botão **📧 Cobrar**
4. O sistema envia email automático com link de pagamento

---

## 👤 PARA O SÍNDICO (Seu Cliente)

### O que o síndico deve fazer:

#### 1. Primeiro Acesso
- Acessar o site com email e senha
- Fazer login

#### 2. Configurar o Condomínio
- Ir em **Configurações** e preencher dados do condomínio
- Adicionar moradores
- Configurar áreas comuns (se tiver)

#### 3. Pagar a Assinatura
- Acessar **"Minha Assinatura"** no menu
- Escolher forma de pagamento:
  - **Cartão/PIX/Boleto** → Abre Mercado Pago em nova aba
  - **PIX Direto** → Gera código PIX na hora

#### 4. Usar o Sistema
- Cadastrar moradores
- Publicar avisos
- Registrar ocorrências
- Gerenciar financeiro

---

## 📊 Status das Assinaturas

| Status | Significado |
|--------|-------------|
| **Ativo** | Cliente pagou, sistema funcionando |
| **Pendente** | Aguardando pagamento |
| **Cancelado** | Cliente cancelou ou não pagou |

---

## 💡 Dicas de Venda

1. **Sempre ofereça o período de teste** - cliente experimenta sem compromisso
2. **Envie a cobrança 3 dias antes** do fim do teste
3. **Acompanhe os pagamentos** em `/admin/assinaturas`
4. **Use o botão "Cobrar"** para enviar lembretes

---

## ⚠️ Problemas Comuns

| Problema | Solução |
|----------|---------|
| Cliente não recebeu email | Verificar spam / reenviar manualmente |
| Botão de pagamento não funciona | Verificar se MP está configurado |
| Assinatura não aparece | Verificar na tabela de assinaturas |
