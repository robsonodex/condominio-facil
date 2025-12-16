# Condomínio Fácil - Manual Completo do Sistema

## 📋 Visão Geral

O **Condomínio Fácil** é uma plataforma SaaS (Software como Serviço) para gestão de condomínios pequenos e médios no Brasil. O sistema permite que síndicos, porteiros e moradores gerenciem todas as operações do condomínio de forma simples e organizada.

---

## 🏢 Modelo de Negócio

### Como Funciona

1. **Você é o dono da plataforma** (SuperAdmin)
2. **Síndicos/Administradoras** são seus clientes
3. Cada cliente paga uma **mensalidade** para usar o sistema
4. Você recebe pagamentos recorrentes (MRR - Monthly Recurring Revenue)

### Fluxo de Aquisição de Clientes

```
┌─────────────────────────────────────────────────────────────────┐
│  1. Cliente acessa o site e se cadastra                         │
│                          ↓                                      │
│  2. Período de teste grátis (7 dias)                            │
│                          ↓                                      │
│  3. Você recebe notificação no painel Admin                     │
│                          ↓                                      │
│  4. Você aprova o condomínio                                    │
│                          ↓                                      │
│  5. Fim do teste → Cliente escolhe um plano                     │
│                          ↓                                      │
│  6. Cliente paga (PIX/Cartão/Boleto)                            │
│                          ↓                                      │
│  7. Você ativa a assinatura no sistema                          │
│                          ↓                                      │
│  8. Cobrança mensal automática (com gateway integrado)          │
└─────────────────────────────────────────────────────────────────┘
```

---

## 💰 Planos e Preços

### Tabela de Planos

| Plano | Preço Mensal | Unidades | Funcionalidades |
|-------|--------------|----------|-----------------|
| **Básico** | R$ 49,90 | Até 20 | Financeiro, Moradores, Avisos |
| **Profissional** | R$ 99,90 | Até 50 | Básico + Ocorrências + Portaria |
| **Enterprise** | R$ 199,90 | Ilimitado | Tudo + Relatórios + Suporte prioritário |

### Status de Assinatura

| Status | Significado |
|--------|-------------|
| `teste` | Cliente em período de avaliação (7 dias) |
| `ativo` | Cliente pagante, acesso liberado |
| `suspenso` | Pagamento atrasado, acesso bloqueado |
| `cancelado` | Cliente cancelou a assinatura |

---

## 👥 Tipos de Usuário

### 1. SuperAdmin (Você)

**O que faz:**
- Gerencia todos os condomínios cadastrados
- Aprova ou rejeita novos cadastros
- Cria e edita planos de assinatura
- Visualiza métricas financeiras (MRR, churn, etc.)
- Ativa/suspende condomínios
- **Gerencia usuários com ID Cliente único** ✅ NOVO v5.3
- **Gerencia condomínios com ID Condo único** ✅ NOVO v5.3
- **Busca por ID Cliente ou ID Condo** ✅ NOVO v5.3

**Onde acessa:** `/admin`

---

### 2. Síndico (Seu Cliente)

**O que faz:**
- Gerencia o condomínio dele
- Cadastra unidades e moradores
- Lança receitas e despesas
- Publica avisos
- Gerencia ocorrências
- Gera relatórios (Prestação de Contas)

**Onde acessa:** `/dashboard`

---

### 3. Porteiro

**O que faz:**
- Registra entrada/saída de visitantes
- Abre ocorrências
- Visualiza avisos

**Onde acessa:** `/dashboard` (visão limitada)

---

### 4. Morador

**O que faz:**
- Visualiza avisos do condomínio
- Abre ocorrências
- Faz reservas de áreas comuns
- Visualiza suas cobranças

**Onde acessa:** `/dashboard` (visão limitada)

---

## 📱 APLICATIVO MOBILE (NOVO!)

### Visão Geral

O **Condomínio Fácil Mobile** é o aplicativo oficial para Android e iOS que oferece acesso completo ao sistema diretamente do smartphone.

**Repositório**: https://github.com/robsonodex/app-condominio-facil.git

### Plataformas Suportadas
- ✅ **Android** 5.0+ (API 21+)
- ✅ **iOS** 13.0+
- ✅ Desenvolvido com React Native + Expo

### Funcionalidades do App Mobile

#### 1. Autenticação
- Login com email/senha
- Modo DEMO para síndicos
- Recuperação de senha
- Armazenamento seguro de tokens
- Impersonação (SuperAdmin)

#### 2. Dashboard Mobile
- Estatísticas em tempo real
- Resumo financeiro
- Ações rápidas
- Pull-to-refresh

#### 3. Gestão Financeira
- CRUD completo de lançamentos
- Filtros por tipo e período
- Visualização de saldo

#### 4. Moradores
- CRUD completo
- Proprietários e inquilinos
- Vinculação com unidades

#### 5. Ocorrências
- CRUD com workflow de status
- 4 níveis de prioridade
- Categorização
- Filtros dinâmicos

#### 6. Avisos
- CRUD completo
- Apenas Síndico/SuperAdmin podem criar
- Todos podem visualizar

#### 7. Reservas
- Booking de áreas comuns
- Salão, churrasqueira, quadra, piscina, academia
- Gestão de horários

#### 8. Portaria Professional
- **Visitantes**: Check-in/check-out, registro de documentos
- **Encomendas**: Registro, rastreamento, coleta
- **Dashboard**: Estatísticas em tempo real

#### 9. Governança
- **Enquetes**: Sistema de votação
- **Assembleias**: Gestão e presença
- **Documentos**: Upload e download

#### 10. SuperAdmin Mobile
- Gestão de condomínios
- Gestão de usuários
- Gestão de assinaturas

#### 11. Features Avançadas
- ✅ **Push Notifications** (Expo Notifications)
- ✅ **Câmera** (para visitantes e ocorrências)
- ✅ **Upload de Arquivos** (documentos)

### Tecnologias do App
- React Native + Expo SDK 50
- TypeScript
- Expo Router (navegação)
- Zustand + TanStack Query (estado)
- Supabase (backend)
- Expo SecureStore (segurança)

### Build do App
```bash
# Android APK
npx eas build -p android --profile preview

# iOS IPA
npx eas build -p ios --profile preview
```

### Estatísticas do App Mobile
- **13 módulos** completos
- **12 serviços API**
- **5 componentes UI** reutilizáveis
- **~6.500 linhas** de código
- **100% funcional** e pronto para produção

---

## 📊 Módulos do Sistema (Web + Mobile)

### 1. Dashboard
- Visão geral com KPIs
- Gráficos de receita vs despesa
- Avisos recentes
- Próximos vencimentos

### 2. Financeiro (`/financeiro`)
- Lançar receitas (taxas de condomínio)
- Lançar despesas (água, luz, manutenção)
- **Editar e excluir lançamentos** ✅
- Visualizar inadimplência
- Filtrar por período

### 3. Cobranças (`/cobrancas`)
- Criar cobranças para moradores
- Integração Mercado Pago (PIX, Boleto, Cartão)
- **Exibir morador e inquilino** ✅
- Cancelar cobranças

### 4. Unidades (`/unidades`)
- Cadastrar apartamentos/casas
- Definir bloco, andar, área
- Vincular proprietário

### 5. Moradores (`/moradores`)
- Cadastrar moradores
- Vincular à unidade
- Definir como proprietário ou inquilino
- Status: ativo/inativo

### 6. Avisos (`/avisos`)
- Criar comunicados
- Definir prioridade
- Histórico de avisos

### 7. Ocorrências (`/ocorrencias`)
- Abrir reclamações
- Classificar por tipo (barulho, manutenção, etc.)
- Definir prioridade
- Acompanhar status
- **Excluir ocorrências** ✅

### 8. Reservas de Áreas Comuns (`/reservas`) ✅ NOVO
- **Calendário interativo** mensal
- **Cadastrar áreas** (salão, churrasqueira, piscina)
- Reservar com horário início/fim
- **Verificação automática** de conflitos
- Fluxo de **aprovação** (síndico)
- Taxa opcional por reserva

### 9. Portaria Profissional (`/portaria`) ✅ ATUALIZADO
- **Modo tela cheia** para porteiros
- **Entrada/saída rápida** com um clique
- **Captura de foto** via webcam
- **Impressão de crachá** de visitante
- Busca por **CPF, placa ou nome**
- **Estatísticas** em tempo real
- Histórico diário

### 10. Relatórios (`/relatorios`) ✅ NOVO
- **Exportar PDF** profissional com logo
- **Exportar Excel** (XLSX)
- Tipos disponíveis:
  - Financeiro (receitas/despesas)
  - Cobranças de moradores
  - Ocorrências
  - Moradores/Usuários
  - Unidades
- Filtro por período

### 11. Assinatura (`/assinatura`)
- Visualizar plano atual
- Gerar pagamento (cartão, boleto)
- **PIX estático** com chave fixa ✅
- **Botão WhatsApp** para enviar comprovante ✅

### 12. Meu Perfil (`/perfil`)
- Editar dados pessoais
- Alterar senha
- Ver informações da conta

### 13. Status Geral (`/status`) ✅ NOVO v5.2
- **Visão de saúde** de todos os módulos
- Indicadores: OK (verde), Atenção (amarelo), Erro (vermelho)
- Módulos monitorados:
  - Financeiro (entradas/saídas)
  - Cobranças Mercado Pago
  - Portaria (visitantes)
  - Reservas (conflitos)
  - Usuários (pendentes)
  - Unidades (ocupação)
  - PWA
  - RLS/Segurança
  - Assinatura
- **Ações rápidas** para correção

### 14. Notificações (`/notificacoes`) ✅ NOVO v5.2
- **Central de envio** multi-canal
- Canais: Push, WhatsApp, Email, Aviso Interno
- Destinatários:
  - Todos os moradores
  - Bloco específico
  - Unidade específica
  - Porteiros
- **Histórico de envios** com status

### 15. Automações de Inadimplência (`/automacoes`) ✅ NOVO v5.2
- **Configurar regras automáticas**:
  - Lembrete após X dias de atraso
  - Multa automática após Y dias
  - Cobrança MP após Z dias
  - Relatório mensal de inadimplentes
- Parâmetros:
  - Percentual de multa
  - Juros diários
- **Liga/desliga** cada automação

### 16. Câmeras (`/portaria/cameras`) ✅ NOVO v5.2
- **Visualização ao vivo** (sem gravação)
- Stream via WebRTC ou HLS
- **Captura de snapshot** (expira em 24h)
- Requisitos das câmeras:
  - RTSP habilitado
  - ONVIF Perfil S
  - H.264, IP fixo, cabeada
- **Validação de rede** (mesma LAN do gateway)
- Probe de status (online/offline)

### 17. Modo Demo ✅ NOVO v5.2
- **Botão na tela de login**
- Cria automaticamente:
  - Usuário síndico demo
  - Condomínio "Residencial Demo"
  - Unidades de exemplo
  - Avisos e lançamentos
- Ideal para **demonstrações comerciais**

### 18. Painel de Erros (`/admin/erros`) ✅ NOVO v5.2
- **Apenas SuperAdmin**
- Monitoramento de:
  - Erros do sistema
  - Problemas de integridade
  - Unidades sem morador
  - Moradores sem unidade
- **Prioridades**: Alta, Média, Baixa
- **Ações**: Marcar como resolvido

---

### 19. Encomendas e Mensageria (`/portaria/deliveries`) ✅ NOVO v5.1
- **Recebimento na Portaria**:
  - Cadastro rápido com **foto da encomenda**
  - Registro de código de rastreio e remetente
  - Seleção de unidade/morador
- **Notificações Automáticas**:
  - Envio imediato de **WhatsApp e Email** para o morador
  - Link seguro para confirmação
- **Retirada**:
  - Morador confirma retirada pelo app (ou porteiro dá baixa)
  - Histórico completo de quem recebeu e quando
- **Gestão**:
  - Painel de pendentes
  - Registro de devoluções

---

## 📲 PWA - App Instalável ✅ NOVO

O sistema pode ser instalado como aplicativo no celular:

### Como Instalar (Android)
1. Acesse o sistema pelo Chrome
2. Toque nos 3 pontos (menu)
3. Selecione "Instalar app"
4. O ícone aparece na tela inicial

### Como Instalar (iPhone)
1. Acesse o sistema pelo Safari
2. Toque no botão Compartilhar
3. Selecione "Adicionar à Tela de Início"

### Recursos PWA
- ✅ Ícone na tela inicial
- ✅ Funciona offline (páginas visitadas)
- ✅ Notificações push
- ✅ Experiência de app nativo

---

## 📱 WhatsApp Integration ✅ NOVO

### Mensagens Automáticas
O sistema gera links WhatsApp prontos para:
- **Cobranças** - Enviar lembrete de pagamento
- **Reservas** - Confirmar ou notificar pendência
- **Avisos** - Comunicar moradores
- **Visitantes** - Autorização de entrada
- **Boas-vindas** - Novo morador

### PIX via WhatsApp
Botão para enviar código PIX com mensagem formatada.

---

## 💳 Como Receber Pagamentos

### Sistema Integrado (Atual)

O sistema possui duas formas de pagamento integradas:

#### 1. Cobrança por Email (Admin)
1. Acesse `/admin/assinaturas`
2. Clique no botão **📧 Cobrar** na assinatura desejada
3. O sistema envia email automático com link de pagamento
4. Cliente paga via Mercado Pago (PIX, Cartão ou Boleto)

#### 2. Checkout Direto (Síndico)
O síndico pode pagar diretamente pela página `/assinatura`:
- **Cartão/PIX/Boleto** → Abre Mercado Pago em nova aba
- **PIX Direto** → Gera código PIX na hora

---

### Configuração do Mercado Pago

1. Criar conta em [mercadopago.com.br](https://mercadopago.com.br)
2. Ir em **Credenciais** e copiar o **Access Token**
3. Adicionar na Vercel:
   ```
   MERCADOPAGO_ACCESS_TOKEN=seu_token_aqui
   ```

**Taxas:** ~4.99% por transação + IOF

---

### Documentação Adicional

| Documento | Descrição |
|-----------|-----------|
| `GUIA_VENDAS.md` | Processo completo de venda para admin e síndico |
| `MUDANCA_DOMINIO.md` | O que mudar ao trocar de domínio |
| `DOCUMENTATION.md` | Documentação técnica completa |

---

## 📊 Métricas Importantes

| Métrica | O que é | Como calcular |
|---------|---------|---------------|
| **MRR** | Receita Mensal Recorrente | Soma de todas as mensalidades ativas |
| **Churn** | Taxa de cancelamento | Clientes que cancelaram / Total |
| **LTV** | Valor do tempo de vida | Ticket médio × Meses de permanência |
| **CAC** | Custo de aquisição | Gasto em marketing / Novos clientes |

---

## 🔐 Segurança

### Autenticação e Sessão
- **Autenticação**: Supabase Auth (email/senha)
- **Sessão Segura**: Expira automaticamente ao fechar o navegador ✅ NOVO v5.3
- **Token via Header**: Authorization Bearer para todas as chamadas API ✅ NOVO v5.3
- **Senha Padrão**: Novos usuários cadastrados via admin recebem senha `000000` ✅ NOVO v5.3

### Proteção de Dados
- **RLS**: Row Level Security no banco
- **Multi-tenant**: Dados isolados por condomínio
- **HTTPS**: Certificado SSL automático na Vercel

### Exclusão de Usuários ✅ NOVO v5.3
- **Logout Imediato**: Ao excluir um usuário, todas as sessões são revogadas instantaneamente
- **Aplicável a todos**: Síndico, Porteiro, Morador - todos são deslogados imediatamente ao serem excluídos
- **Segurança**: `signOut global` antes de deletar o usuário do Auth

---

## 🆔 Sistema de Identificação ✅ NOVO v5.3

### ID Cliente (Síndicos)
- Cada síndico cadastrado recebe um **ID sequencial único** (#1, #2, #3...)
- Visível no **Painel Admin → Usuários**
- Busca por ID no campo de pesquisa
- Exibido no **WhatsApp** ao enviar comprovante de pagamento

### ID Condo (Condomínios)
- Cada condomínio cadastrado recebe um **ID sequencial único** (#1, #2, #3...)
- Visível no **Painel Admin → Condomínios**
- Facilita identificação e suporte ao cliente

### WhatsApp Integrado
- Número: **(21) 96553-2247**
- Mensagem inclui dados completos:
  - ID Cliente, Nome, E-mail, Telefone
  - Condomínio, Plano, Valor

---

## 📧 Sistema de E-mails ✅ NOVO v5.3

### E-mails Automáticos
- **Credenciais de Acesso**: Enviado ao cadastrar novo síndico
  - Contém: E-mail, Senha (000000), Link de login
- **Ativação de Plano**: Enviado com nome correto do plano (Básico, Profissional, etc.)
- **Trial 7 Dias**: Notificação de início do período de teste
- **Condomínio Ativo**: Confirmação de ativação

### Templates Disponíveis
- `welcome` - Boas-vindas
- `user_credentials` - Credenciais de acesso
- `condo_trial` - Período de teste
- `condo_active` - Condomínio ativado
- `condo_suspended` - Condomínio suspenso
- `resident_invoice` - Fatura do morador

---

## ✅ Funcionalidades Implementadas (Resumo v5.3)

| Funcionalidade | Status |
|----------------|--------|
| ID Cliente sequencial para síndicos | ✅ Implementado |
| ID Condo sequencial para condomínios | ✅ Implementado |
| Busca por ID no painel admin | ✅ Implementado |
| Sessão expira ao fechar navegador | ✅ Implementado |
| Logout imediato ao excluir usuário | ✅ Implementado |
| Senha padrão 000000 para novos usuários | ✅ Implementado |
| E-mail com plano correto (não fixo) | ✅ Implementado |
| WhatsApp com dados completos do cliente | ✅ Implementado |
| Reset de formulário ao criar novo usuário | ✅ Implementado |
| Token de autenticação via Authorization header | ✅ Implementado |

---

## 📞 Suporte

Para dúvidas técnicas, consulte:
- `DOCUMENTATION.md` - Documentação técnica
- `DEPLOY.md` - Guia de deploy
- `supabase/schema.sql` - Estrutura do banco

---

**Versão do Manual:** 5.3  
**Última atualização:** 16/12/2025

© 2025 Condomínio Fácil - Todos os direitos reservados
