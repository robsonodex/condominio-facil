# 📱 Manual de Integração WhatsApp - Condomínio Fácil

> **Documento Técnico e Operacional**  
> Versão 1.0 | Atualizado em: Dezembro 2025

---

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Tipos de Integração Disponíveis](#tipos-de-integração)
3. [Requisitos do Desenvolvedor (Superadmin)](#requisitos-do-desenvolvedor)
4. [Requisitos do Cliente](#requisitos-do-cliente)
5. [Responsabilidades e Obrigações do Cliente](#responsabilidades-do-cliente)
6. [Passo a Passo da Implantação](#passo-a-passo)
7. [Checklist de Entrega](#checklist-de-entrega)
8. [Manutenção e Suporte](#manutenção)
9. [FAQ - Perguntas Frequentes](#faq)

---

## Visão Geral

A integração WhatsApp permite que o condomínio envie mensagens automáticas para moradores, incluindo:

- ✅ Notificação de cobranças geradas
- ✅ Lembretes de vencimento
- ✅ Confirmação de pagamentos
- ✅ Avisos e comunicados
- ✅ Notificação de encomendas
- ✅ Alertas de segurança

### Fluxo de Mensagens

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Sistema       │───▶│  Servidor        │───▶│  WhatsApp do    │
│   Condomínio    │    │  WhatsApp (VPS)  │    │  Morador        │
│   Fácil         │    │  (Evolution API) │    │                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                              │
                              ▼
                       ┌─────────────────┐
                       │  Chip do        │
                       │  Condomínio     │
                       └─────────────────┘
```

> ⚠️ **IMPORTANTE**: As mensagens são enviadas do número do próprio condomínio. O cliente deve fornecer um chip EXCLUSIVO para este fim.

---

## Tipos de Integração

### Opção 1: Servidor Dedicado (Recomendado)

| Característica | Descrição |
|----------------|-----------|
| **Tecnologia** | Evolution API v2 em VPS dedicada |
| **Custo** | R$ 697 (implantação) + R$ 149/mês (infra) |
| **Número** | Chip exclusivo do condomínio |
| **Estabilidade** | Alta (servidor próprio) |
| **Volume** | Ilimitado (respeitando limites do WhatsApp) |
| **Suporte** | Incluído |

### Opção 2: Meta Business API (Oficial)

| Característica | Descrição |
|----------------|-----------|
| **Tecnologia** | WhatsApp Business API oficial Meta |
| **Custo** | R$ 1.200 (implantação) + custo por mensagem |
| **Número** | Número verificado pelo Facebook |
| **Estabilidade** | Máxima (API oficial) |
| **Volume** | Ilimitado |
| **Requisitos** | Conta Meta Business verificada |

### Comparativo

| Aspecto | Servidor Dedicado | Meta Business API |
|---------|-------------------|-------------------|
| Tempo de setup | 3-5 dias | 7-15 dias |
| Risco de banimento | Médio | Baixo |
| Mensagens templates | Livre | Precisa aprovar |
| Mídia (imagens, PDFs) | ✅ | ✅ |
| Custo mensal fixo | R$ 149 | Variável |
| Ideal para | Condomínios médios | Grandes volumes |

---

## Requisitos do Desenvolvedor

### O que EU (Superadmin/Desenvolvedor) preciso ter:

#### 1. Infraestrutura

| Recurso | Especificação |
|---------|--------------|
| **VPS** | Mínimo 2GB RAM, 2 vCPU, 40GB SSD |
| **Sistema** | Ubuntu 22.04 LTS |
| **Docker** | Instalado e configurado |
| **Domínio** | Subdomínio configurado (ex: whatsapp.meucondominiofacil.com) |
| **SSL** | Certificado HTTPS válido |

#### 2. Acessos Técnicos

- [x] SSH para o servidor VPS
- [x] Acesso ao painel Supabase
- [x] Acesso ao painel Vercel
- [x] Painel do Evolution API

#### 3. Conhecimentos Necessários

- [x] Docker e docker-compose
- [x] Configuração de proxy reverso (Nginx)
- [x] API do Evolution ou Meta WhatsApp
- [x] Fluxo de autenticação QR Code

#### 4. Informações que Preciso Receber do Cliente

| Dado | Obrigatório | Para quê? |
|------|-------------|-----------|
| Número do chip dedicado | ✅ | Conectar ao servidor |
| Nome que aparecerá | ✅ | Configurar perfil do WhatsApp |
| Foto de perfil | Opcional | Personalizar conta |
| Horário de operação | Opcional | Evitar envios de madrugada |
| Contato de emergência | ✅ | Reconectar se desconectar |

#### 5. O que Preciso Configurar

**No Servidor (VPS):**
```bash
# 1. Criar instância para o cliente
curl -X POST "https://whatsapp.meucondominiofacil.com/instance/create" \
  -H "apikey: ADMIN_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "instanceName": "condo_[ID]",
    "qrcode": true,
    "integration": "WHATSAPP-BAILEYS"
  }'

# 2. Gerar QR Code para conexão
curl "https://whatsapp.meucondominiofacil.com/instance/connect/condo_[ID]" \
  -H "apikey: ADMIN_KEY"
```

**No Banco de Dados (Supabase):**
```sql
-- Registrar credenciais do cliente
INSERT INTO condo_integrations (condo_id, tipo, credentials, ativo)
VALUES (
    '[UUID do Condomínio]',
    'whatsapp',
    '{
        "provider": "evolution",
        "evolution_url": "https://whatsapp.meucondominiofacil.com",
        "instance_name": "condo_[ID]",
        "api_key": "[API_KEY_ESPECIFICA]"
    }'::jsonb,
    true
);

-- Ativar flag de WhatsApp
UPDATE condos SET whatsapp_active = true WHERE id = '[UUID]';
```

**No Código (já implementado):**
- Provider Evolution configurado em `src/lib/whatsapp/providers/`
- Busca credenciais por `condo_id` para isolamento multi-tenant

---

## Requisitos do Cliente

### O que o CLIENTE precisa fornecer:

#### Hardware/Telecom

| Item | Especificação | Responsável |
|------|--------------|-------------|
| **Chip de celular** | Número exclusivo para o condomínio | Cliente compra |
| **Plano de dados** | Ativo com créditos/dados | Cliente mantém |
| **Celular (temporário)** | Para escanear QR Code inicial | Cliente fornece |

#### Informações do Perfil

| Dado | Exemplo | Responsável |
|------|---------|-------------|
| Nome do perfil | "Condomínio Villa Flora" | Cliente define |
| Descrição | "Canal oficial de comunicação" | Cliente define |
| Foto de perfil | Logo do condomínio | Cliente fornece |

#### Documentação

| Documento | Descrição | Prazo |
|-----------|-----------|-------|
| Termo de aceite | Assinado no sistema | Antes de iniciar |
| Autorização | Mostra que é síndico | Antes de iniciar |

### Especificações do Chip

> ⚠️ **ATENÇÃO**: O número usado NÃO pode ser:

- ❌ O número pessoal do síndico
- ❌ Um número já usado em outro WhatsApp Business
- ❌ Um número vinculado a outra conta
- ❌ Um número de fixo convertido

> ✅ **O número DEVE ser**:

- ✅ Um chip novo, nunca usado no WhatsApp OU
- ✅ Um chip que teve o WhatsApp desvinculado há mais de 7 dias
- ✅ Operadora confiável (Vivo, Claro, Tim, Oi)
- ✅ Com recarga/plano ativo para receber SMS de verificação

---

## Responsabilidades do Cliente

### ✅ O Cliente é TOTALMENTE RESPONSÁVEL por:

#### 1. Número e Chip

| Responsabilidade | Detalhe |
|-----------------|---------|
| **Aquisição do chip** | Comprar chip novo ou usar existente |
| **Manter linha ativa** | Recarregar ou manter plano ativo |
| **Verificação SMS** | Estar disponível para receber SMS do WhatsApp |
| **Reconexão** | Escanear QR Code se a sessão expirar |

#### 2. Conteúdo das Mensagens

| Responsabilidade | Consequência se violar |
|-----------------|----------------------|
| **Não enviar spam** | Banimento do número pelo WhatsApp |
| **Conteúdo legal** | Responsabilidade civil/criminal |
| **Frequência adequada** | Bloqueio pelos destinatários |
| **Opt-out respeitado** | Multas LGPD |

#### 3. Conformidade Legal

- **LGPD**: Ter consentimento dos moradores para envio de mensagens
- **Horários**: Respeitar horário comercial (evitar madrugada)
- **Conteúdo**: Apenas comunicados oficiais do condomínio
- **Privacidade**: Não compartilhar dados de moradores

#### 4. Manutenção da Conexão

| Situação | Ação do Cliente |
|----------|-----------------|
| WhatsApp desconectar | Notificar suporte imediatamente |
| Chip expirar | Manter recarga em dia |
| Mudança de síndico | Transferir posse do chip |
| Solicitação de novo QR | Disponibilizar celular para escanear |

### ❌ O Condomínio Fácil NÃO é responsável por:

| Situação | Motivo |
|----------|--------|
| **Banimento do número pelo WhatsApp** | Política do WhatsApp, não do sistema |
| **Chip desativado pela operadora** | Responsabilidade do cliente manter ativo |
| **Mensagens não entregues** | Número incorreto ou bloqueio do destinatário |
| **Reclamações de moradores** | Conteúdo definido pelo cliente |
| **Mudanças na API do WhatsApp** | Decisão do WhatsApp/Meta |

### ⚠️ Política de Banimento

O WhatsApp pode banir números por:

1. **Envio em massa** sem consentimento
2. **Muitos bloqueios** pelos destinatários
3. **Uso de API não oficial** (risco assumido)
4. **Conteúdo inadequado**
5. **Número recém-criado** com alto volume

**Se o número for banido:**
- O cliente deve adquirir novo chip
- Nova taxa de reconexão pode ser cobrada
- O Condomínio Fácil auxiliará na reconexão, mas não garante sucesso

---

## Passo a Passo

### Fase 1: Solicitação (Cliente)

1. Cliente acessa `Configurações > WhatsApp Oficial`
2. Lê e aceita os termos de responsabilidade
3. Preenche formulário com dados de contato
4. Realiza pagamento da implantação (R$ 697)

### Fase 2: Preparação (Cliente)

1. **Adquirir chip dedicado**
   - Comprar chip pré-pago ou pós-pago
   - Ativar em um celular qualquer
   - Fazer pelo menos uma ligação/SMS para ativar

2. **Aguardar período de maturação**
   - Se o chip é novo: usar 3-5 dias normalmente antes de integrar
   - Se já tinha WhatsApp: desinstalar e aguardar 7 dias

3. **Preparar celular para escaneamento**
   - Ter WhatsApp instalado com o chip
   - Estar disponível no dia agendado

### Fase 3: Implantação (Desenvolvedor)

1. Criar instância no Evolution API
2. Gerar QR Code
3. Agendar horário com cliente para escaneamento
4. Cliente escaneia QR Code via videochamada
5. Configurar perfil (nome, foto)
6. Registrar credenciais no banco de dados
7. Testar envio de mensagem

### Fase 4: Homologação (Cliente + Desenvolvedor)

1. Enviar mensagem de teste para o celular do síndico
2. Cliente confirma recebimento
3. Testar diferentes tipos de mensagem:
   - Texto simples ✅
   - Com link ✅
   - Com imagem ✅
4. Cliente valida que está funcionando

### Fase 5: Go-Live

1. Ativar envios automáticos no sistema
2. Importar/verificar telefones dos moradores
3. Notificar moradores sobre o novo canal
4. Monitorar primeiros 7 dias

---

## Checklist de Entrega

### Antes de Iniciar

- [ ] Termo de aceite assinado no sistema
- [ ] Pagamento da implantação confirmado
- [ ] Cliente possui chip dedicado
- [ ] Chip está ativo e funcional
- [ ] Cliente disponível para escanear QR Code

### Durante a Implantação

- [ ] Instância criada no Evolution API
- [ ] QR Code gerado
- [ ] Cliente escaneou QR Code
- [ ] Conexão estabelecida (status: open)
- [ ] Perfil configurado (nome, foto)
- [ ] Registro em `condo_integrations` criado
- [ ] Flag `whatsapp_active = true` ativada
- [ ] Mensagem de teste enviada e recebida

### Após Go-Live

- [ ] Cliente notificado que está ativo
- [ ] Suporte prioritário ativado (30 dias)
- [ ] Monitoramento configurado
- [ ] Revisão agendada para D+7
- [ ] Documentação de uso entregue

---

## Manutenção

### Monitoramento Diário

O sistema verifica automaticamente:
- Status da conexão (conectado/desconectado)
- Número de mensagens enviadas
- Taxa de erros

### Ações Automaticas

| Evento | Ação |
|--------|------|
| Desconexão detectada | Alerta por email ao superadmin |
| Muitos erros | Pausa temporária de envios |
| Reconexão necessária | Notificação ao cliente |

### Reconexão Manual

Se o WhatsApp desconectar:

1. Cliente notifica via chat de suporte
2. Desenvolvedor gera novo QR Code
3. Cliente escaneia (videochamada ou presencial)
4. Conexão restabelecida

---

## FAQ

### Qual chip devo comprar?
Qualquer operadora (Vivo, Claro, Tim, Oi). Preferência por pós-pago para não correr risco de expirar.

### Posso usar o número da portaria?
**Não recomendado**. Deve ser um número exclusivo para automação, sem uso manual.

### O que acontece se eu não recarregar o chip?
O chip pode ser desativado pela operadora. Se isso acontecer, será necessário novo chip e nova configuração.

### Quantas mensagens posso enviar por dia?
O WhatsApp não divulga limites exatos, mas recomendamos:
- **Números novos**: Máximo 50 mensagens/dia na primeira semana
- **Números maduros**: Até 500 mensagens/dia
- **Business API oficial**: Sem limite definido

### E se o número for banido?
O cliente deve adquirir novo chip. O Condomínio Fácil auxiliará na nova configuração, podendo cobrar taxa adicional.

### Posso continuar usando o WhatsApp normalmente no celular?
**Não**. Uma vez conectado ao servidor, o WhatsApp fica vinculado à API. Não use o WhatsApp Web ou app simultâneo.

### O que é "maturação" do chip?
Números muito novos ou com baixo uso são mais propensos a banimento. Usar o chip por alguns dias antes de automatizar reduz esse risco.

### Preciso deixar o celular ligado 24h?
**Não**. Após o escaneamento inicial do QR Code, a conexão fica no servidor. O celular pode ser desligado.

---

## Contato Técnico

Para dúvidas sobre integração WhatsApp:
- **Chat de Suporte**: Dentro do sistema
- **Email**: suporte@meucondominiofacil.com
- **WhatsApp**: (XX) XXXXX-XXXX

---

*Documento atualizado em Dezembro/2025 - v1.0*
