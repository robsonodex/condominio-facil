# 🏦 Manual de Integração Bancária - Condomínio Fácil

> **Documento Técnico e Operacional**  
> Versão 1.0 | Atualizado em: Dezembro 2025

---

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Bancos e Formas de Pagamento Suportados](#bancos-suportados)
3. [Requisitos do Desenvolvedor (Superadmin)](#requisitos-do-desenvolvedor)
4. [Requisitos do Cliente](#requisitos-do-cliente)
5. [Responsabilidades e Obrigações do Cliente](#responsabilidades-do-cliente)
6. [Passo a Passo da Implantação](#passo-a-passo)
7. [Checklist de Entrega](#checklist-de-entrega)
8. [FAQ - Perguntas Frequentes](#faq)

---

## Visão Geral

A integração bancária permite que os condomínios gerenciem cobranças (boletos, PIX, cartões) diretamente pelo sistema Condomínio Fácil. O dinheiro recebido vai **diretamente para a conta do condomínio** - a plataforma atua apenas como interface tecnológica.

### Fluxo Simplificado

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Síndico       │───▶│  Condomínio Fácil │───▶│  Banco/Gateway  │
│   gera cobrança │    │  (interface)      │    │  do Cliente     │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                                       │
                                                       ▼
                                              ┌─────────────────┐
                                              │  Conta do       │
                                              │  Condomínio     │
                                              └─────────────────┘
```

> ⚠️ **IMPORTANTE**: O Condomínio Fácil **NÃO** recebe, processa ou transfere valores. O dinheiro vai diretamente do pagador para a conta do condomínio.

---

## Bancos Suportados

A plataforma suporta integração com os seguintes bancos e gateways de pagamento:

### Gateways de Pagamento (Recomendados)

| Gateway | Boleto | PIX | Cartão | Documentação |
|---------|--------|-----|--------|--------------|
| **Mercado Pago** | ✅ | ✅ | ✅ | [Docs](https://www.mercadopago.com.br/developers) |
| **PagSeguro** | ✅ | ✅ | ✅ | [Docs](https://dev.pagseguro.uol.com.br/) |
| **Asaas** | ✅ | ✅ | ✅ | [Docs](https://docs.asaas.com/) |
| **Iugu** | ✅ | ✅ | ✅ | [Docs](https://dev.iugu.com/) |
| **Pagar.me** | ✅ | ✅ | ✅ | [Docs](https://docs.pagar.me/) |

### Bancos Tradicionais (Via API Pix/CNAB)

| Banco | Boleto | PIX | Observação |
|-------|--------|-----|------------|
| **Banco do Brasil** | ✅ | ✅ | Requer contrato e certificados digitais |
| **Itaú** | ✅ | ✅ | Requer contrato e certificado A1 |
| **Bradesco** | ✅ | ✅ | Requer contrato específico |
| **Santander** | ✅ | ✅ | Requer contrato e API Key |
| **Caixa** | ✅ | ✅ | Requer contrato com a Caixa |
| **Sicredi** | ✅ | ✅ | Requer convênio |
| **Sicoob** | ✅ | ✅ | Requer convênio |
| **Inter** | ✅ | ✅ | API moderna, fácil integração |

### Diferenças Importantes

| Aspecto | Gateway (MP, PagSeguro) | Banco Tradicional |
|---------|------------------------|-------------------|
| Tempo de integração | 1-3 dias | 7-30 dias |
| Burocracia | Baixa | Alta (contratos, certificados) |
| Custos | Taxa por transação | Tarifas bancárias |
| Suporte técnico | Online, rápido | Gerente de conta |
| Complexidade técnica | Baixa | Alta |

---

## Requisitos do Desenvolvedor

### O que EU (Superadmin/Desenvolvedor) preciso ter:

#### 1. Acesso ao Painel Administrativo
- [x] Acesso ao Supabase (banco de dados)
- [x] Acesso ao Vercel (deploy)
- [x] Acesso SSH ao servidor (se necessário)

#### 2. Conhecimento Técnico
- [x] Entender a API do banco/gateway escolhido pelo cliente
- [x] Saber configurar webhooks para conciliação automática
- [x] Conhecer fluxo de geração de boletos e PIX

#### 3. Informações que Preciso Receber do Cliente

| Dado | Obrigatório | Para quê? |
|------|-------------|-----------|
| CNPJ do Condomínio | ✅ | Vincular à conta bancária |
| Nome do Banco/Gateway | ✅ | Saber qual integração desenvolver |
| Credenciais de API | ✅ | Autenticar chamadas |
| Certificado Digital (A1) | Depende | Bancos tradicionais exigem |
| Número do Convênio/Conta | ✅ | Identificar conta beneficiária |
| Contato Técnico | ✅ | Suporte durante implantação |

#### 4. O que Preciso Configurar

**No Banco de Dados (Supabase):**
```sql
-- Registro das credenciais do cliente (criptografado)
INSERT INTO condo_integrations (condo_id, tipo, credentials, ativo)
VALUES (
    '[UUID do Condomínio]',
    'pagamentos',
    '{
        "provider": "mercadopago",  -- ou "itau", "bb", "asaas", etc.
        "access_token": "APP_USR-xxx",
        "public_key": "APP_USR-xxx",
        "webhook_secret": "xxx",
        "conveniado_code": "1234567"
    }'::jsonb,
    true
);
```

**No Código (adaptar provider):**
- Criar/modificar adapter para o banco específico
- Configurar URL de webhook para conciliação
- Testar fluxo completo em sandbox

**Na Vercel:**
- Configurar URL de webhook público para receber notificações do banco

---

## Requisitos do Cliente

### O que o CLIENTE precisa fornecer:

#### Documentação Obrigatória

| Documento | Descrição | Prazo |
|-----------|-----------|-------|
| **CNPJ Ativo** | Comprovante de situação cadastral na Receita | Antes de iniciar |
| **Ata de Eleição** | Documento que comprova que é síndico autorizado | Antes de iniciar |
| **Contrato Bancário** | Contrato de cobrança firmado com o banco | Antes de iniciar |

#### Credenciais Técnicas

**Para Gateways (Mercado Pago, PagSeguro, etc.):**

| Credencial | Onde Obter | Responsável |
|------------|-----------|-------------|
| Access Token (Produção) | Painel do desenvolvedor do gateway | Cliente |
| Public Key | Painel do desenvolvedor do gateway | Cliente |
| Client ID | Painel do desenvolvedor do gateway | Cliente |
| Client Secret | Painel do desenvolvedor do gateway | Cliente |

**Para Bancos Tradicionais:**

| Credencial | Onde Obter | Responsável |
|------------|-----------|-------------|
| Número do Convênio | Gerente do banco | Cliente |
| Código de Beneficiário | Gerente do banco | Cliente |
| Certificado Digital A1 (.pfx) | Autoridade Certificadora | Cliente |
| Senha do Certificado | Cliente define | Cliente |
| Carteira de Cobrança | Gerente do banco | Cliente |
| API Key / OAuth Credentials | Portal do banco ou gerente | Cliente |
| Ambiente de Homologação | Gerente do banco | Cliente |

#### Configurações no Banco

O cliente deve solicitar ao gerente do banco:

1. **Ativar serviço de cobrança via API**
2. **Habilitar PIX para cobranças** (se desejado)
3. **Fornecer acesso ao portal de desenvolvedor** (se disponível)
4. **Liberar IP do servidor** (alguns bancos exigem whitelist)
5. **Configurar Split de Pagamentos** (se necessário)

---

## Responsabilidades do Cliente

### ✅ O Cliente é TOTALMENTE RESPONSÁVEL por:

#### 1. Gestão Financeira
- **Todos os valores recebidos** através da integração
- **Estornos, contestações e chargebacks** de pagamentos
- **Conciliação bancária** e prestação de contas
- **Taxas cobradas pelo banco/gateway** (serão descontadas automaticamente dos recebimentos)
- **Inadimplência de moradores** - o sistema apenas gera cobranças, não garante pagamento

#### 2. Segurança das Credenciais
- **Sigilo das credenciais de API** fornecidas
- **Renovação de tokens** quando vencerem
- **Certificados digitais** - renovar antes do vencimento
- **Comunicar imediatamente** qualquer suspeita de vazamento

#### 3. Conformidade Legal
- **Emissão de recibos** e notas fiscais quando aplicável
- **Prestação de contas em assembleia** conforme convenção
- **Cumprimento da Lei do Condomínio** (Lei 4.591/64)
- **Conformidade com LGPD** no tratamento de dados dos moradores
- **Registro de movimentações** para fins de auditoria

#### 4. Manutenção da Conta
- **Manter conta bancária ativa** e com saldo suficiente (alguns bancos cobram tarifas)
- **Atualizar cadastro** junto ao banco quando necessário
- **Comunicar mudança de síndico** imediatamente
- **Renovar contrato** com o banco antes do vencimento

#### 5. Comunicação com Moradores
- **Informar moradores** sobre a nova forma de pagamento
- **Disponibilizar canais de dúvida** sobre cobranças
- **Resolver disputas** de valores com moradores

### ❌ O Condomínio Fácil NÃO é responsável por:

| Situação | Responsabilidade |
|----------|-----------------|
| Pagamento em duplicidade | Cliente resolve com banco |
| Estorno solicitado pelo pagador | Cliente resolve com banco |
| Boleto vencido não pago | Cliente cobra o morador |
| PIX não identificado | Cliente concilia manualmente |
| Falha no sistema do banco | Cliente contata suporte do banco |
| Taxas e tarifas bancárias | Descontadas automaticamente |
| Fraude ou uso indevido de credenciais | Cliente se vazou as credenciais |

---

## Passo a Passo

### Fase 1: Solicitação (Cliente)

1. Cliente acessa `Configurações > Integração de Pagamentos`
2. Lê e aceita os termos de responsabilidade
3. Preenche formulário com dados do condomínio
4. Aguarda contato da equipe técnica

### Fase 2: Levantamento (Desenvolvedor)

1. Verificar banco/gateway desejado pelo cliente
2. Solicitar documentação e credenciais necessárias
3. Confirmar que cliente possui contrato ativo com o banco
4. Agendar data de início da implantação

### Fase 3: Implantação (Desenvolvedor)

1. Criar registro na tabela `condo_integrations`
2. Configurar adapter do banco no código (se novo)
3. Configurar webhook para conciliação automática
4. Testar em ambiente sandbox (se disponível)
5. Gerar cobrança de teste em produção

### Fase 4: Homologação (Cliente + Desenvolvedor)

1. Cliente gera uma cobrança de teste (valor baixo)
2. Cliente efetua pagamento dessa cobrança
3. Verificar se pagamento foi conciliado automaticamente
4. Cliente valida relatórios financeiros

### Fase 5: Go-Live

1. Cliente autoriza uso em produção
2. Desenvolvedor ativa integração completa
3. Notificar cliente via chat de suporte
4. Agendar revisão após 7 dias

---

## Checklist de Entrega

### Antes de Iniciar

- [ ] CNPJ do condomínio verificado (situação ativa)
- [ ] Documentação de síndico recebida
- [ ] Banco/gateway definido
- [ ] Cliente confirmou ter contrato com o banco
- [ ] Credenciais de API/certificado recebidos
- [ ] Taxa de implantação paga

### Durante a Implantação

- [ ] Registro criado em `condo_integrations`
- [ ] Adapter do banco configurado
- [ ] Webhook configurado e testado
- [ ] Cobrança de teste gerada
- [ ] Pagamento de teste efetuado
- [ ] Conciliação automática funcionando

### Após Go-Live

- [ ] Cliente notificado
- [ ] Documentação entregue ao cliente
- [ ] Treino básico realizado
- [ ] Suporte prioritário ativado (30 dias)
- [ ] Revisão agendada para D+7

---

## FAQ

### Posso integrar com qualquer banco?
**Sim**, desde que o banco possua API de cobrança configurada na conta do condomínio. Bancos menores podem não ter API disponível.

### Quanto tempo demora a integração?
- **Gateways (Mercado Pago, Asaas)**: 1-3 dias úteis
- **Bancos tradicionais**: 7-30 dias úteis (depende do banco liberar acessos)

### Quem paga as taxas do banco?
**O condomínio**. As taxas são descontadas automaticamente de cada recebimento. Exemplo: se a taxa PIX é 0,99%, um pagamento de R$ 100 resultará em R$ 99,01 líquido.

### E se o banco mudar a API?
Comunicamos imediatamente e fazemos a atualização. Durante esse período, pode haver interrupção temporária.

### Posso usar mais de um banco?
**Sim**, mas cada banco requer configuração separada e pagamento de implantação adicional.

### O que acontece se eu trocar de síndico?
O novo síndico deve nos comunicar imediatamente. Será necessário atualizar as credenciais se a conta bancária estiver vinculada ao CPF do síndico anterior.

---

## Contato Técnico

Para dúvidas sobre integração bancária:
- **Chat de Suporte**: Dentro do sistema
- **Email**: suporte@meucondominiofacil.com
- **WhatsApp**: (XX) XXXXX-XXXX

---

*Documento atualizado em Dezembro/2025 - v1.0*
