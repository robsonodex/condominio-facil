# Condomínio Fácil - Manual Completo do Sistema

## 📋 Visão Geral

O **Condomínio Fácil** é uma plataforma SaaS (Software como Serviço) **100% WEB + APP MÓVEL** para gestão de condomínios pequenos e médios no Brasil. O sistema permite que síndicos, porteiros e moradores gerenciem todas as operações do condomFunciona no celular (PWA)
ínio de forma simples e organizada.

> ✅ **NOVIDADE 2025**: Agora temos **App Móvel nativo** para Android e iOS! Disponível nas lojas Google Play e App Store.

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
| **Básico** | R$ 149,90 | Até 20 | Financeiro, Moradores, Avisos, App Móvel |
| **Profissional** | R$ 249,90 | Até 50 | Básico + Portaria + Ocorrências + Reservas + Relatórios + Integrações |
| **Premium** | R$ 399,90 | Ilimitado | Profissional + Câmeras + Governança + Assistente IA + Múltiplos Condos |

### Serviços de Implantação (Opcionais) ⚙️

> Os serviços abaixo são **contratados separadamente** e requerem implantação pela equipe técnica.

| Serviço | Taxa de Implantação | Mensalidade Adicional | Disponível para |
|---------|--------------------|-----------------------|-----------------|
| **Integração Bancária** (Mercado Pago, Asaas, bancos) | R$ 999,00 | R$ 199,00/mês | Profissional e Premium |
| **WhatsApp Automático** (Evolution API) | R$ 697,00 | R$ 149,00/mês | Profissional e Premium |
| **Assistente IA** (Chatbot treinado) | R$ 997,00 | R$ 149,00/mês | Apenas Premium |

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
- **Gerencia usuários com ID Cliente único**
- **Gerencia condomínios com ID Condo único**
- **Realiza implantações de integrações**

**Onde acessa:** `/admin`

---

### 2. Síndico (Seu Cliente)

**O que faz:**
- Gerencia o condomínio dele
- Cadastra unidades e moradores
- Lança receitas e despesas
- Publica avisos (com prioridade Urgente/Oficial)
- Gerencia ocorrências e **responde no Chat em tempo real**
- **Governança Digital**: Assembleias e Enquetes online
- **Manutenção**: Ordens de serviço em Kanban + Fornecedores
- Gera relatórios (Prestação de Contas PDF/Excel)

**Módulos disponíveis:**
| Módulo | Descrição |
|--------|-----------|
| Dashboard | KPIs, gráficos, alertas |
| Financeiro | Receitas, despesas, inadimplência |
| Cobranças | Boletos para moradores |
| Moradores | Cadastro e importação CSV |
| Unidades | Blocos e apartamentos |
| Avisos | Comunicados com prioridade |
| Ocorrências | Chamados + **Chat Realtime** ✨ |
| Reservas | Calendário de áreas comuns |
| Portaria | Visitantes e encomendas |
| Governança | Assembleias + Enquetes + Documentos |
| Manutenção | Kanban + Fornecedores |
| Relatórios | PDF/Excel profissional |

**Onde acessa:** `/dashboard`

---

### 3. Porteiro

**O que faz:**
- Registra entrada/saída de visitantes (com foto)
- Registra prestadores de serviço
- Registra veículos
- Recebe e registra encomendas
- Visualiza avisos do condomínio
- Portaria Turbo (modo tela cheia)

**Módulos disponíveis:**
| Módulo | Descrição |
|--------|-----------|
| Portaria | Registro rápido com cores por tipo |
| Encomendas | Recebimento com foto e notificação |
| Visitantes | Histórico e busca por CPF/placa |
| Avisos | Visualização de comunicados |

**Onde acessa:** `/dashboard` ou App Móvel

---

### 4. Morador

**O que faz:**
- Visualiza avisos do condomínio
- Abre ocorrências e **conversa com síndico via Chat** ✨
- Faz reservas de áreas comuns
- Visualiza e paga suas cobranças
- Vota em enquetes
- Participa de assembleias virtuais
- Acompanha suas encomendas

**Módulos disponíveis:**
| Módulo | Descrição |
|--------|-----------|
| Falar com Síndico | Chat realtime em ocorrências |
| Minhas Encomendas | Notificações de pacotes |
| Meus Boletos | Visualização e pagamento |
| Minhas Reservas | Calendário e solicitações |
| Avisos | Comunicados do condomínio |
| Enquetes | Votação online |
| Documentos | Regimento, convenção, atas |

**Onde acessa:** `/dashboard` ou App Móvel

---

## 📱 ACESSO MOBILE (App Nativo)

> ✅ **NOVIDADE**: O Condomínio Fácil possui **aplicativo nativo** para Android e iOS. Disponível nas lojas Google Play e App Store.

### Como Baixar

**Android:**
1. Acesse a Google Play Store
2. Busque por "Meu Condomínio Fácil"
3. Instale e faça login com suas credenciais

**iPhone:**
1. Acesse a App Store
2. Busque por "Meu Condomínio Fácil"
3. Instale e faça login com suas credenciais

### Recursos do App
- ✅ Aplicativo nativo real
- ✅ Disponível nas lojas oficiais
- ✅ Notificações push
- ✅ Sincronização em tempo real com o sistema web
- ✅ Interface otimizada para cada perfil (Síndico, Morador, Porteiro)

---

## 📊 Módulos do Sistema (Web)

### 1. Dashboard
- Visão geral com KPIs
- Gráficos de receita vs despesa
- Avisos recentes
- Próximos vencimentos

### 2. Financeiro (`/financeiro`)
- Lançar receitas (taxas de condomínio)
- Lançar despesas (água, luz, manutenção)
- Editar e excluir lançamentos
- Visualizar inadimplência
- Filtrar por período

### 3. Cobranças (`/cobrancas`)
- Criar cobranças para moradores
- **⚙️ Integração Mercado Pago** *(mediante implantação)*
- Exibir morador e inquilino
- Cancelar cobranças

### 4. Unidades (`/unidades`)
- Cadastrar apartamentos/casas
- Definir bloco, andar, área
- Vincular proprietário

### 5. Moradores (`/moradores`)
- Cadastrar moradores
- **Importar moradores via CSV** (novo!)
- Vincular à unidade
- Definir como proprietário ou inquilino
- Status: ativo/inativo

### 6. Avisos (`/avisos`)
- Criar comunicados
- Definir prioridade
- Histórico de avisos

### 7. Ocorrências + Chat (`/ocorrencias`) ✨ NOVO
- Abrir reclamações
- Classificar por tipo (barulho, manutenção, segurança)
- Definir prioridade (baixa, média, alta)
- **Chat em tempo real** entre morador e síndico
- Histórico de conversas por ocorrência
- Status: aberta, em andamento, resolvida
- Moradores veem cards, síndico vê tabela com botão Chat

### 8. Reservas de Áreas Comuns (`/reservas`)
- Calendário interativo mensal
- Cadastrar áreas (salão, churrasqueira, piscina)
- Reservar com horário início/fim
- Verificação automática de conflitos
- Fluxo de aprovação (síndico)
- Taxa opcional por reserva

### 9. Portaria Profissional (`/portaria`)
- Modo tela cheia para porteiros
- Entrada/saída rápida com um clique
- Captura de foto via webcam
- Impressão de crachá de visitante
- Busca por CPF, placa ou nome
- Estatísticas em tempo real
- Histórico diário

### 10. Relatórios (`/relatorios`)
- Exportar PDF profissional com logo
- Exportar Excel (XLSX)
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
- PIX estático com chave fixa
- Botão WhatsApp para enviar comprovante

### 12. Meu Perfil (`/perfil`)
- Editar dados pessoais
- Alterar senha
- Ver informações da conta

### 13. Status Geral (`/status`)
- Visão de saúde de todos os módulos
- Indicadores: OK (verde), Atenção (amarelo), Erro (vermelho)
- Ações rápidas para correção

### 14. Notificações (`/notificacoes`)
- Central de envio multi-canal
- Canais: Push, Email, Aviso Interno
- **⚙️ WhatsApp** *(mediante implantação)*
- Histórico de envios com status

### 15. Automações de Inadimplência (`/automacoes`)
- Configurar regras automáticas
- Parâmetros de multa e juros
- Liga/desliga cada automação

### 16. Encomendas e Mensageria (`/portaria/deliveries`)
- Recebimento na Portaria com foto
- Registro de código de rastreio e transportadora
- Retirada com histórico
- Morador acompanha em `/portaria/minhas-encomendas`
- **⚙️ Notificações WhatsApp** *(mediante implantação)*

### 17. Governança Digital (`/governanca`) ✨ NOVO
- **Assembleias** (`/governanca/assembleias`)
  - Agendar assembleias ordinárias/extraordinárias
  - Status: agendada, ao vivo, concluída
  - Link para reunião virtual (Google Meet, Zoom)
  - Pauta e ata digital
- **Enquetes** (`/governanca/enquetes`)
  - Criar votações online
  - Múltiplas opções de resposta
  - Prazo de votação
  - Resultados em tempo real
- **Documentos** (`/governanca/documents`)
  - Repositório centralizado
  - Regimento, convenção, atas
  - Upload e categorização

### 18. Manutenção (`/manutencao`) ✨ NOVO
- **Kanban de Ordens de Serviço**
  - Colunas: Agendado, Em Execução, Concluído
  - Tipos: Preventiva, Corretiva
  - Prioridade: Baixa, Média, Alta
- **Cadastro de Fornecedores**
  - Nome, especialidade, telefone
  - Rating por estrelas
  - Histórico de serviços
- Valor estimado vs realizado
- Data agendada e conclusão

### 19. Marketplace & Indicações (`/marketplace`) ✨ NOVO v8.2
- **Anúncios entre Vizinhos**
  - Vendo, Doo, Alugo, Ofereço Serviço
  - Upload de até 5 fotos
  - Filtros por tipo
  - Expiração automática em 30 dias
  - Botão "Tenho Interesse" abre WhatsApp
- **Indicação de Profissionais**
  - Avaliação por estrelas (1-5)
  - Categorias: Pintor, Eletricista, Encanador, etc
  - Depoimento do morador que indica
  - Contato direto via WhatsApp
- Visível para: Síndico, Morador, Inquilino

### 20. Modo Demo
- Botão "Demonstração" na tela de login
- Cria ambiente completo automaticamente
- Dados fictícios para demonstração comercial
- Login: `sindico.demo@condofacil.com` / `demo123456`

### 21. Assistente IA (`/configuracoes/assistente`)
- Chatbot treinado com documentos do condomínio
- Responde perguntas dos moradores 24h
- Configuração de persona e tom de resposta
- Upload de documentos (regimento, convenção, atas)
- **Implantação: R$ 997,00 + R$ 149/mês**
- Disponível apenas para plano Premium

---

## 🔌 Integrações (Mediante Implantação)

> ⚠️ **IMPORTANTE**: As integrações abaixo **NÃO estão inclusas** nos planos padrão. São serviços de implantação contratados separadamente, com taxas específicas.

### Integração Bancária

Permite gerar boletos e PIX dinâmicos diretamente do sistema, com conciliação automática.

**Bancos/Gateways suportados:**
- Mercado Pago ✅
- Asaas ✅
- PagSeguro ✅
- Banco do Brasil, Itaú, Bradesco, Santander (via API/CNAB)
- Outros sob consulta

**Requisitos para implantação:**
1. CNPJ ativo do condomínio
2. Conta no banco/gateway desejado
3. Credenciais de API fornecidas pelo cliente
4. Documento comprovando síndico autorizado

**Valores:**
- Taxa de implantação: R$ 999,00 (único)
- Mensalidade do módulo: R$ 199,00/mês

📄 **Documentação completa:** `docs/INTEGRACAO_BANCARIA.md`

---

### Integração WhatsApp

Permite enviar mensagens automáticas para moradores (cobranças, avisos, encomendas).

**Tecnologia:** Evolution API em servidor dedicado

**Requisitos para implantação:**
1. Chip de celular exclusivo para o condomínio
2. Disponibilidade para escanear QR Code
3. Compreensão dos riscos de banimento pelo WhatsApp

**Valores:**
- Taxa de implantação: R$ 697,00 (único)
- Mensalidade de infraestrutura: R$ 149,00/mês

📄 **Documentação completa:** `docs/INTEGRACAO_WHATSAPP.md`

---

## 💳 Como Receber Pagamentos (Suas Assinaturas)

### Sistema Integrado

O sistema possui duas formas de pagamento para cobrar **seus clientes** (síndicos):

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

### Configuração do Mercado Pago (Sua Conta)

1. Criar conta em [mercadopago.com.br](https://mercadopago.com.br)
2. Ir em **Credenciais** e copiar o **Access Token**
3. Adicionar na Vercel:
   ```
   MERCADOPAGO_ACCESS_TOKEN=seu_token_aqui
   ```

**Taxas:** ~4.99% por transação + IOF

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
- **Sessão Segura**: Expira automaticamente ao fechar o navegador
- **Token via Header**: Authorization Bearer para todas as chamadas API
- **Senha Padrão**: Novos usuários recebem senha `000000`

### Proteção de Dados
- **RLS**: Row Level Security no banco
- **Multi-tenant**: Dados isolados por condomínio
- **HTTPS**: Certificado SSL automático na Vercel

### Exclusão de Usuários
- **Logout Imediato**: Ao excluir um usuário, todas as sessões são revogadas
- **Aplicável a todos**: Síndico, Porteiro, Morador

---

## 🆔 Sistema de Identificação

### ID Cliente (Síndicos)
- Cada síndico recebe um **ID sequencial único** (#1, #2, #3...)
- Visível no **Painel Admin → Usuários**
- Busca por ID no campo de pesquisa

### ID Condo (Condomínios)
- Cada condomínio recebe um **ID sequencial único** (#1, #2, #3...)
- Visível no **Painel Admin → Condomínios**

---

## 📧 Sistema de E-mails

### Arquitetura de E-mails (v8.2)

O sistema utiliza **envio direto via nodemailer** para garantir entrega confiável:

```
┌─────────────────────────────────────────┐
│      API de Criação de Usuário          │
│   (ex: cadastro de síndico)             │
└─────────────────┬───────────────────────┘
                  │ usa diretamente
                  ▼
┌─────────────────────────────────────────┐
│      /lib/email-helper.ts               │
│   - sendCredentialsEmail()              │
│   - sendEmailDirect()                   │
└─────────────────┬───────────────────────┘
                  │ busca config
                  ▼
┌─────────────────────────────────────────┐
│      configuracoes_smtp (banco)         │
│   - SMTP Global ou por Condomínio       │
│   - Senha criptografada (AES-256-GCM)   │
└─────────────────┬───────────────────────┘
                  │ conecta via
                  ▼
┌─────────────────────────────────────────┐
│      Nodemailer → Servidor SMTP         │
│   - Porta 465: SSL implícito            │
│   - Porta 587: STARTTLS automático      │
└─────────────────────────────────────────┘
```

### Configuração SMTP Global

1. Acessar **Admin > Configurações de E-mail**
2. Preencher dados do servidor SMTP
3. Salvar e **Testar Conexão** (envia e-mail real)

### E-mails Automáticos
- **Credenciais de Acesso**: Enviado ao cadastrar novo síndico/morador
- **Ativação de Plano**: Confirmação com nome do plano
- **Trial 7 Dias**: Notificação de início do período de teste
- **Condomínio Ativo**: Confirmação de ativação
- **Cobranças**: Notificação de boletos/PIX

### Configuração por Condomínio

Cada condomínio pode ter seu próprio SMTP em **Configurações > E-mail**. Se não configurado, usa o SMTP Global.

---

## ❓ Perguntas Frequentes

### "Tem aplicativo para celular?"
> **Sim.** O Condomínio Fácil possui aplicativo nativo para Android e iOS. Você pode baixar diretamente na Google Play Store ou App Store buscando por "Meu Condomínio Fácil".

### "O WhatsApp automático já vem incluso?"
> **Não.** O envio automático de WhatsApp é um serviço de implantação contratado separadamente. O sistema WEB está pronto; a integração requer VPS dedicada e chip exclusivo do condomínio.

### "Posso gerar boletos pelo sistema?"
> **Depende.** O sistema permite cadastrar cobranças manualmente. A geração automática de boletos/PIX via banco requer contratação do serviço de Integração Bancária (implantação à parte).

### "Os dados ficam seguros?"
> **Sim.** Usamos a mesma tecnologia de criptografia que bancos usam. Dados armazenados em servidores seguros com backup automático.

---

## 📞 Suporte

Para dúvidas técnicas, consulte:
- `DOCUMENTATION.md` - Documentação técnica
- `DEPLOY.md` - Guia de deploy
- `docs/INTEGRACAO_BANCARIA.md` - Integração com bancos
- `docs/INTEGRACAO_WHATSAPP.md` - Integração WhatsApp

---

## 📚 Documentação Adicional

| Documento | Descrição |
|-----------|-----------|
| `GUIA_VENDAS.md` | Processo completo de venda |
| `VENDAS.md` | Scripts e argumentos de venda |
| `DEPLOY.md` | Como fazer deploy do sistema |
| `docs/INTEGRACAO_BANCARIA.md` | Manual de integração bancária |
| `docs/INTEGRACAO_WHATSAPP.md` | Manual de integração WhatsApp |

---

**Versão do Manual:** 8.2  
**Última atualização:** 26/12/2024  
**CNPJ:** 57.444.727/0001-85

### Novidades da Versão 8.2
- ✅ **Sistema de E-mail Reformulado**
  - Envio direto via nodemailer (sem HTTP interno)
  - Detecção automática SSL/TLS por porta
  - Criptografia de senha SMTP (AES-256-GCM)
  - Teste de conexão envia e-mail real
- ✅ **Páginas de Emergência**
  - `/reset-emergencia` - Reset de senha sem login
  - `/emergency-repair` - Ferramentas admin (superadmin only)
- ✅ **Correções Críticas**
  - Loop infinito no logout corrigido
  - APIs de superadmin sem condoId corrigidas
  - Criptografia SMTP funcionando corretamente

### Novidades da Versão 8.1
- ✅ **Chat Morador ↔ Síndico** (Add-on R$29,90/mês)
  - Morador fala diretamente com síndico via barra de chat
  - Categorias: Financeiro, Manutenção, Sugestão, Reclamação
  - Sistema de avaliação do atendimento
  - Toggle de ativação por condomínio (Admin)
- ✅ **Dashboard do Morador redesenhado** com cores vibrantes
- ✅ **Chat de Suporte estilo LinkedIn** (Admin ↔ Síndico)
- ✅ **Módulo de Mensageria/Entregas** para portaria
- ✅ **Painel Admin `/admin/chats`** para visualizar todos os chats
- ✅ Chat em tempo real "Falar com o Síndico" nas ocorrências
- ✅ Governança Digital (Assembleias + Enquetes + Documentos)
- ✅ Manutenção com Kanban e Fornecedores
- ✅ App Móvel nativo Android/iOS
- ✅ Avisos com prioridade Urgente/Oficial
- ✅ Impersonação de usuários para suporte

### Add-ons Disponíveis (Ativação via Admin)

| Add-on | Preço Mensal | Descrição |
|--------|-------------|-----------|
| **Mensageria/Entregas** | Incluso | Registro e notificação de entregas |
| **Chat Morador ↔ Síndico** | R$ 29,90 | Canal direto de comunicação |

© 2025 Condomínio Fácil - Todos os direitos reservados

