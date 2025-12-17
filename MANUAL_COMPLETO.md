# Condomínio Fácil - Manual Completo do Sistema

## 📋 Visão Geral

O **Condomínio Fácil** é uma plataforma SaaS (Software como Serviço) **100% WEB** para gestão de condomínios pequenos e médios no Brasil. O sistema permite que síndicos, porteiros e moradores gerenciem todas as operações do condomínio de forma simples e organizada através do navegador.

> ⚠️ **IMPORTANTE**: O Condomínio Fácil é um **sistema WEB** acessível via navegador. **NÃO existe aplicativo nativo para Android ou iOS**. O sistema pode ser instalado como PWA (Progressive Web App) na tela inicial do celular, funcionando como um app.

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

### Serviços de Implantação (Opcionais) ⚙️

> Os serviços abaixo são **contratados separadamente** e requerem implantação pela equipe técnica.

| Serviço | Taxa de Implantação | Mensalidade Adicional | Disponível para |
|---------|--------------------|-----------------------|-----------------|
| **Integração Bancária** (Mercado Pago, Asaas, bancos) | R$ 999,00 | R$ 199,00/mês | Profissional e Enterprise |
| **WhatsApp Automático** (Evolution API) | R$ 697,00 | R$ 149,00/mês | Profissional e Enterprise |

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

## 📱 ACESSO MOBILE (PWA)

> ⚠️ **ATENÇÃO**: O Condomínio Fácil **NÃO possui aplicativo nativo** para Android ou iOS. O acesso móvel é feito através do **navegador** ou **PWA** (Progressive Web App).

### O que é PWA?

PWA (Progressive Web App) é uma tecnologia que permite **instalar o site como se fosse um aplicativo** na tela inicial do celular. Funciona 100% online via navegador.

### Como Instalar (Android)
1. Acesse o sistema pelo Chrome
2. Toque nos 3 pontos (menu)
3. Selecione "Instalar app" ou "Adicionar à tela inicial"
4. O ícone aparece na tela inicial

### Como Instalar (iPhone)
1. Acesse o sistema pelo Safari
2. Toque no botão Compartilhar
3. Selecione "Adicionar à Tela de Início"

### Recursos do PWA
- ✅ Ícone na tela inicial
- ✅ Abre em tela cheia (sem barra do navegador)
- ✅ Funciona offline (páginas visitadas em cache)
- ❌ NÃO é um app nativo
- ❌ NÃO está nas lojas (Play Store / App Store)

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
- Excluir ocorrências

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
- Registro de código de rastreio
- Retirada com histórico
- **⚙️ Notificações WhatsApp** *(mediante implantação)*

### 17. Modo Demo
- Botão na tela de login
- Cria ambiente de demonstração automaticamente
- Ideal para demonstrações comerciais

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

### E-mails Automáticos
- **Credenciais de Acesso**: Enviado ao cadastrar novo síndico
- **Ativação de Plano**: Confirmação com nome do plano
- **Trial 7 Dias**: Notificação de início do período de teste
- **Condomínio Ativo**: Confirmação de ativação

---

## ❓ Perguntas Frequentes

### "Tem aplicativo para celular?"
> **Não.** O Condomínio Fácil é um sistema 100% WEB. Você acessa pelo navegador do celular ou pode instalar como PWA (que parece um app, mas não está nas lojas).

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

**Versão do Manual:** 6.0  
**Última atualização:** 17/12/2025  
**CNPJ:** 57.444.727/0001-85

© 2025 Condomínio Fácil - Todos os direitos reservados
