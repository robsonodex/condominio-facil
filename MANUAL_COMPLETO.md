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
- Abre ocorrências (reclamações, sugestões)
- Consulta seus boletos
- Acompanha status das ocorrências

**Onde acessa:** `/dashboard` (visão de morador)

---

## 📱 Módulos do Sistema

### 1. Dashboard
- Visão geral com KPIs
- Gráficos de receitas vs despesas
- Avisos recentes
- Próximos vencimentos

### 2. Financeiro (`/financeiro`)
- Lançar receitas (taxas de condomínio)
- Lançar despesas (água, luz, manutenção)
- Visualizar inadimplência
- Filtrar por período

### 3. Unidades (`/unidades`)
- Cadastrar apartamentos/casas
- Definir bloco, andar, área
- Vincular proprietário

### 4. Moradores (`/moradores`)
- Cadastrar moradores
- Vincular à unidade
- Definir como proprietário ou inquilino
- Status: ativo/inativo

### 5. Avisos (`/avisos`)
- Criar comunicados
- Definir público-alvo (todos, síndicos, moradores)
- Agendar publicação
- Histórico de avisos

### 6. Ocorrências (`/ocorrencias`)
- Abrir reclamações
- Classificar por tipo (barulho, manutenção, etc.)
- Definir prioridade
- Acompanhar status

### 7. Portaria (`/portaria`)
- Registrar entrada de visitantes
- Registrar saída
- Histórico de visitas
- Buscar por nome/documento

### 8. Relatórios (`/relatorios`)
- Gerar Prestação de Contas
- Exportar em PDF
- Filtrar por período

---

## 💳 Como Receber Pagamentos

### Opção 1: Stripe (Recomendado)

**Vantagens:**
- Aceita cartão, débito, PIX
- Cobrança automática mensal
- Dashboard completo
- Webhooks para automação

**Taxas:** ~2.9% + R$ 0,39 por transação

**Implementação:**
1. Criar conta em [stripe.com](https://stripe.com)
2. Configurar produtos (planos)
3. Integrar checkout no sistema
4. Configurar webhooks para atualizar status

---

### Opção 2: Mercado Pago

**Vantagens:**
- Muito usado no Brasil
- PIX, boleto, cartão
- Bom para público brasileiro

**Taxas:** ~4.99% por transação

---

### Opção 3: Cobrança Manual (Simples)

Para começar sem integração:
1. Envie PIX/boleto manualmente por WhatsApp
2. Quando receber, acesse Admin → Assinaturas
3. Mude o status para "ativo"
4. Repita mensalmente

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

- **Autenticação**: Supabase Auth (email/senha)
- **RLS**: Row Level Security no banco
- **Multi-tenant**: Dados isolados por condomínio
- **HTTPS**: Certificado SSL automático na Vercel

---

## 🚀 Próximos Passos Recomendados

1. **Criar landing page** para vender o sistema
2. **Integrar gateway de pagamento** (Stripe/MP)
3. **Criar checkout** com seleção de planos
4. **Adicionar onboarding** para novos clientes
5. **Implementar emails automáticos** (boas-vindas, cobrança)
6. **Adicionar analytics** (Google Analytics, Mixpanel)

---

## 📞 Suporte

Para dúvidas técnicas, consulte:
- `DOCUMENTATION.md` - Documentação técnica
- `DEPLOY.md` - Guia de deploy
- `supabase/schema.sql` - Estrutura do banco

---

© 2024 Condomínio Fácil - Todos os direitos reservados
