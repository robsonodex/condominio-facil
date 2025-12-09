# 🎯 Guia Completo: Como Vender e Ativar um Plano

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
- Selecione o **Plano** (Básico, Profissional, Empresarial)
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
