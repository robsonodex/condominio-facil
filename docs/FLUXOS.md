# Fluxos de Usuário

## 1. Fluxo Superadmin

### 1.1 Login e Dashboard
1. Acesso via `/login`
2. Autenticação via Supabase Auth
3. Redirect para `/admin` (Dashboard administrativo)
4. V isualização de métricas globais:
   - Total de condomínios ativos
   - Total de assinaturas (por pl

ano)
   - Receita mensal recorrente (MRR)
   - Chats de suporte pendentes

### 1.2 Gestão de Condomínios
**Rota**: `/admin/condominios`

1. Lista todos os condomínios com busca e filtros
2. Criar novo condomínio: preenche dados básicos + cria assinatura trial
3. Editar condomínio: atualiza informações
4. **Excluir condomínio**: 
   - Confirma ação
   - Backend faz limpeza completa (CASCADE SQL + limpeza manual de 15+ tabelas)
   - Deleta usuários associados (exceto superadmins)
   - Remove assinatura e dados financeiros

### 1.3 Impersonificação
**Componente**: `<ImpersonateModal />`

1. Clica em "Impersonificar"
2. Busca usuário por e-mail
3. Seleciona usuário alvo
4. Sistema cria registro em `impersonations`
5. Sidebar mostra "Visualizando como [Nome]"
6. Pode voltar para visão de superadmin via botão

### 1.4 Configuração SMTP Global
**Rota**: `/admin/email`

1. Acessa configurações de e-mail
2. Preenche dados SMTP (host, porta, usuário, senha)
3. Testa conexão via `/api/admin/smtp-global/test`
4. Salva configuração via `/api/admin/smtp-global` POST
5. SMTP global é usado como fallback quando condomínio não tem SMTP próprio

### 1.5 Central de Suporte
**Rota**: `/admin/suporte`

1. Lista todos os chats de suporte de todos os condomínios
2. Badge mostra número de chats pendentes
3. Clica e acompanha conversas
4. Responde diretamente

---

## 2. Fluxo Síndico

### 2.1 Login e Dashboard
1. Login via `/login`
2. Redirect para `/dashboard`
3. Visualiza:
   - Resumo financeiro do mês
   - Ocorrências abertas
   - Cobranças pendentes
   - Próximas reservas

### 2.2 Gestão Financeira
**Rota**: `/financeiro`

1. Visualiza receitas e despesas
2. Adiciona nova transação:
   - Tipo (receita/despesa)
   - Valor, data, categoria, descrição
3. Exporta relatório em PDF/Excel
4. Gráficos de evolução mensal

### 2.3 Cobranças
**Rota**: `/cobrancas`

1. Lista todas as cobranças do condomínio
2. Criar nova cobrança:
   - Seleciona unidade(s) ou "Todas"
   - Define valor, vencimento, descrição
   - Escolhe tipo: Boleto ou PIX
3. Clica em "Cobrar":
   - Sistema cria registro em `cobrancas`
   - Gera PIX (QR Code + Copia e Cola) se configurado
   - Envia e-mail com fatura via SMTP
   - Cria notificação in-app para o morador

### 2.4 Chat com Moradores
**Rota**: `/chat-moradores`

**Requisito**: `chat_sindico_ativo = true` no condomínio

1. Lista conversas abertas
2. Morador inicia conversa via botão "Falar com Síndico"
3. Síndico visualiza mensagem
4. Responde em tempo real
5. Pode fechar conversa quando resolvido

### 2.5 Configuração de E-mail (SMTP)
**Rota**: `/configuracoes/email`

1. Acessa configurações
2. Seleciona preset (Gmail, Hostinger, Outlook, Zoho) ou manual
3. Preenche credenciais SMTP
4. Testa conexão
5. Salva
6. Todos os e-mails do condomínio passam a usar esse SMTP

### 2.6 Reservas de Áreas Comuns
**Rota**: `/reservas`

1. Cadastra áreas comuns (churrasqueira, salão de festas, etc)
2. Moradores fazem reservas
3. Síndico visualiza calendário de reservas
4. Pode cancelar reserva se necessário

### 2.7 Gestão de Usuários
**Rota**: `/usuarios`

1. Lista moradores, porteiros e inquilinos
2. Adiciona novo usuário (gera convite por e-mail)
3. Edita perfil/unidade
4. Desativa usuário (ao invés de excluir)

---

## 3. Fluxo Morador/Inquilino

### 3.1 Login e Dashboard
1. Login via `/login`
2. Redirect para `/dashboard`
3. Visualiza:
   - Cobranças pendentes
   - Próximas reservas
   - Notificações recentes

### 3.2 Minhas Cobranças
**Rota**: `/minhas-cobrancas`

1. Visualiza histórico de cobranças
2. Status: Pendente, Paga, Vencida
3. Clica em cobrança:
   - Vê detalhes
   - Baixa boleto OU copia PIX
   - Paga via PIX (scaneia QR Code)

### 3.3 Reserva de Áreas Comuns
**Rota**: `/reservas`

1. Visualiza áreas disponíveis
2. Seleciona área, data e horário
3. Sistema valida disponibilidade
4. Cria reserva
5. Recebe confirmação por e-mail e notificação

### 3.4 Registro de Ocorrências
**Rota**: `/ocorrencias`

1. Clica em "Nova Ocorrência"
2. Preenche:
   - Título, descrição
   - Tipo, gravidade, local
   - Upload de foto (opcional)
3. Submete
4. Síndico recebe notificação
5. Morador acompanha status na lista

### 3.5 Chat com Síndico
**Botão flutuante** (ícone de chat)

1. Clica em "Falar com o Síndico"
2. Abre modal de chat
3. Digita mensagem e envia
4. Síndico responde
5. Conversa fica salva em `chat_sindico_conversas`

### 3.6 Sugestões
**Rota**: `/sugestoes`

1. Envia sugestão de melhoria
2. Outros moradores votam (up/down)
3. Síndico vê ranking de sugestões
4. Pode mudar status para "Em Análise", "Aprovada", "Implementada"

### 3.7 Minhas Encomendas
**Rota**: `/minhas-encomendas`

1. Visualiza encomendas recebidas pelo porteiro
2. Status: "Aguardando retirada" ou "Retirado"
3. Recebe notificação quando chega encomenda

---

## 4. Fluxo Porteiro

### 4.1 Login e Dashboard
1. Login via `/login`
2. Redirect para `/dashboard`
3. Visualiza resumo do turno:
   - Visitantes registrados hoje
   - Encomendas aguardando retirada
   - Ocorrências abertas

### 4.2 Portaria/Registro de Visitantes
**Rota**: `/portaria`

1. Clica em tipo de registro:
   - Visitante
   - Prestador de Serviço
   - Veículo
2. Preenche dados (nome, documento, unidade destino)
3. Registra entrada
4. Quando sai, clica em "Registrar Saída"

### 4.3 Mensageria (Encomendas)
**Rota**: `/mensageria`

1. Clica em "Registrar Encomenda"
2. Preenche:
   - Unidade destinatária
   - Remetente, tipo, descrição
   - Código de rastreio (opcional)
   - Foto (opcional - OCR automático)
3. Salva
4. M orador recebe notificação
5. Quando retirado, marca como "Retirado"

### 4.4 Câmeras (se habilitado)
**Rota**: `/portaria/cameras`

1. Visualiza feeds de câmeras configuradas
2. Pode gravar clipes
3. Acesso apenas se `plano.hasCameras = true`

### 4.5 Avisos
**Rota**: `/avisos`

1. Visualiza avisos do síndico
2. Pode marcar como lido

---

## 5. Fluxos Comuns (Todos os Perfis)

### 5.1 Notificações In-App
**Componente**: Bell icon na topbar

1. Clica no sino
2. Dropdown mostra últimas notificações
3. Badge mostra contador de não lidas
4. Clica em notificação:
   - Marca como lida
   - Redirect para link associado (se houver)

### 5.2 Perfil
**Rota**: `/perfil`

1. Edita dados pessoais (nome, telefone, avatar)
2. Troca senha
3. Configurações de notificação

### 5.3 Suporte
**Botão flutuante** (canto inferior direito)

1. Clica em "Suporte"
2. Abre chat com superadmin
3. Envia mensagem
4. Histórico fica salvo

### 5.4 Aceite de Termos (LGPD)
**Modal ao primeiro login**

1. Exibe termos de uso e política de privacidade
2. Usuário deve aceitar para continuar
3. Registra aceite em `legal_acceptances`

---

## 6. Fluxos de Integração

### 6.1 Pagamento de Assinatura (Mercado Pago)
1. Síndico assina plano no `/assinatura`
2. Redirect para Mercado Pago
3. Pagamento aprovado → Webhook `/api/webhooks/mercadopago`
4. Sistema atualiza `subscriptions.status = 'ativa'`

### 6.2 WhatsApp (Evolution API)
1. Síndico configura em `/configuracoes/integracao-whatsapp`
2. Conecta via QR Code
3. Mensagens são enviadas via Evolution API
4. Usado para lembretes de cobrança

### 6.3 Assistente IA (GPT)
**Rota**: `/assistente` (morador) ou `/configuracoes/assistente` (síndico)

1. Usuário faz pergunta
2. Sistema envia para `/api/ai/chat`
3. GPT responde com base no contexto do condomínio
4. Histórico salvo

---

## Diagramas de Sequência

### Criação de Cobrança

```
Síndico → Frontend: Preenche formulário de cobrança
Frontend → API /billing (POST): Envia dados
API → Database: INSERT em cobrancas
API → PIX Service: Gera QR Code (se tipo=pix)
API → SMTP Service: Envia e-mail com fatura
API → Notifications: Cria notificação in-app
API → Frontend: Retorna sucesso
Frontend → Síndico: Exibe confirmação
```

### Chat Síndico-Morador

```
Morador → Frontend: Clica "Falar com Síndico"
Frontend → API /chat-sindico (POST): Cria conversa
API → Database: INSERT em chat_sindico_conversas
Frontend → Morador: Abre janela de chat
Morador → Frontend: Envia mensagem
Frontend → API /chat-sindico/messages (POST): Salva mensagem
API → Database: INSERT em chat_sindico_mensagens
API → Notifications: Notifica síndico
Síndico → Frontend: Abre chat e responde
[... ciclo continua ...]
```

### Exclusão de Condomínio (CASCADE)

```
Superadmin → Frontend: Confirma exclusão
Frontend → API /admin/condos (DELETE)
API → Database: BEGIN TRANSACTION
API → Deletes: 
  - chat_sindico_mensagens (ON DELETE CASCADE)
  - chat_sindico_conversas (ON DELETE CASCADE)
  - cobrancas (ON DELETE CASCADE)
  - transacoes (ON DELETE CASCADE)
  - reservations (ON DELETE CASCADE)
  - occurrences + occurrence_comments (CASCADE)
  - notifications (CASCADE)
  - suggestions + votes (CASCADE)
  - visitors, mensageria, audit_logs, etc.
API → Users: Para cada usuário (exceto superadmin):
  - legal_acceptances (DELETE)
  - users (DELETE)
  - auth.users (DELETE via Supabase Admin)
API → Database: DELETE FROM condos WHERE id = ?
API → Database: COMMIT
API → Frontend: Retorna sucesso
Frontend → Superadmin: Atualiza lista
```
