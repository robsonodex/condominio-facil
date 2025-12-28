# Meu Condomínio Fácil - Documentação Completa

## Parte 5: Manual do Usuário, Vendas e Deploy

**Versão:** 9.0 (Unified AI)  
**Última Atualização:** 01/01/2026  
**CNPJ:** 57.444.727/0001-85

---

## 1. Páginas do Dashboard (55+)

### 1.1 Páginas Gerais (Todos os Perfis)

| Rota | Descrição |
|------|-----------|
| `/dashboard` | Dashboard principal |
| `/perfil` | Meu perfil |
| `/avisos` | Avisos do condomínio |
| `/sugestoes` | Caixa de sugestões |

### 1.2 Páginas do Síndico

| Rota | Descrição |
|------|-----------|
| `/status` | Status geral do sistema |
| `/financeiro` | Gestão financeira |
| `/cobrancas` | Cobranças de moradores |
| `/moradores` | Cadastro de moradores |
| `/moradores/importar` | Importar CSV |
| `/unidades` | Gestão de unidades |
| `/usuarios` | Gestão de usuários |
| `/ocorrencias` | Gestão de ocorrências |
| `/reservas` | Reservas de áreas |
| `/relatorios` | Relatórios PDF/Excel |
| `/notificacoes` | Central de notificações |
| `/chat-moradores` | Chat com moradores |
| `/automacoes` | Regras automáticas |
| `/manutencao` | Manutenção preventiva |
| `/obras` | Obras e reformas |
| `/mensageria` | Entregas/Encomendas |
| `/assinatura` | Plano e pagamento |
| `/auditor-orcamentos` | Auditoria IA |
| `/taxa-incendio` | Taxa incêndio |

### 1.3 Páginas de Governança

| Rota | Descrição |
|------|-----------|
| `/governanca/assembleias` | Assembleias virtuais |
| `/governanca/enquetes` | Enquetes e votações |
| `/governanca/documents` | Documentos oficiais |
| `/governanca/autovistoria` | Autovistoria predial |

### 1.4 Páginas de Configurações

| Rota | Descrição |
|------|-----------|
| `/configuracoes/condominio` | Dados do condomínio |
| `/configuracoes/pix` | Configurar PIX |
| `/configuracoes/email` | SMTP do condomínio |
| `/configuracoes/certificados` | Certificados e Compliance |
| `/configuracoes/integracao-whatsapp` | WhatsApp oficial |
| `/configuracoes/integracao-pagamentos` | Mercado Pago |
| `/configuracoes/assistente` | Assistente IA |
| `/configuracoes/destinos` | Destinos notificação |

### 1.5 Páginas do Morador

| Rota | Descrição |
|------|-----------|
| `/minhas-cobrancas` | Minhas cobranças |
| `/minhas-notificacoes` | Minhas notificações |
| `/minhas-encomendas` | Minhas encomendas |
| `/meus-convites` | Convites QR |
| `/marketplace` | Marketplace interno |
| `/marketplace/novo` | Criar anúncio |
| `/marketplace/indicar` | Indicar profissional |
| `/assistente` | Chat com IA |

### 1.6 Páginas do Porteiro

| Rota | Descrição |
|------|-----------|
| `/portaria` | Registro de visitantes |
| `/portaria/turbo` | Modo tela cheia |
| `/portaria/deliveries/new` | Nova encomenda |
| `/portaria/deliveries/list` | Lista encomendas |
| `/portaria/cameras` | Visualizar câmeras |

### 1.7 Páginas Admin (SuperAdmin)

| Rota | Descrição |
|------|-----------|
| `/admin` | Dashboard admin |
| `/admin/condominios` | Gerenciar condos |
| `/admin/planos` | Gerenciar planos |
| `/admin/usuarios` | Gerenciar usuários |
| `/admin/assinaturas` | Gerenciar assinaturas |
| `/admin/cobrancas` | Cobranças globais |
| `/admin/email` | SMTP global |
| `/admin/suporte` | Central de suporte |
| `/admin/erros` | Logs de erros |

### 1.8 Páginas de Emergência

| Rota | Descrição |
|------|-----------|
| `/reset-emergencia` | Reset senha público |
| `/emergency-repair` | Ferramentas admin |

---

## 2. Fluxos de Usuário

### 2.1 Fluxo de Cobrança

```
Síndico → Preenche formulário de cobrança
    ↓
API /billing (POST) → Envia dados
    ↓
Database → INSERT em billings
    ↓
PIX Service → Gera QR Code (se tipo=pix)
    ↓
SMTP Service → Envia e-mail com fatura
    ↓
Notifications → Cria notificação in-app
    ↓
Frontend → Exibe confirmação
```

### 2.2 Fluxo de Chat Síndico-Morador

```
Morador → Clica "Falar com Síndico"
    ↓
API /chat-sindico (POST) → Cria conversa
    ↓
Database → INSERT em chat_conversations
    ↓
Frontend → Abre janela de chat
    ↓
Morador envia mensagem
    ↓
API → INSERT em chat_messages
    ↓
Notifications → Notifica síndico
    ↓
Síndico responde
    ↓
[Ciclo continua...]
```

### 2.3 Fluxo de Exclusão de Condomínio

```
Superadmin → Confirma exclusão
    ↓
API /admin/condos (DELETE)
    ↓
Database → BEGIN TRANSACTION
    ↓
Deletes CASCADE:
  - chat_messages
  - chat_conversations
  - billings
  - financial_entries
  - reservations
  - occurrences
  - notifications
  - visitors
  - deliveries
  ... (15+ tabelas)
    ↓
Para cada usuário (exceto superadmin):
  - legal_acceptances (DELETE)
  - users (DELETE)
  - auth.users (DELETE via Supabase Admin)
    ↓
DELETE FROM condos WHERE id = ?
    ↓
COMMIT
```

---

## 3. Guia de Vendas

### 3.1 O que o Sistema É

- ✅ Sistema **100% WEB** acessível via navegador
- ✅ **App Móvel nativo** para Android e iOS
- ✅ Gestão completa: financeiro, moradores, portaria, reservas, ocorrências

### 3.2 O que o Sistema NÃO É

- ❌ **NÃO tem PIX dinâmico/boleto automático incluso** nos planos padrão
- ❌ **NÃO tem WhatsApp automático incluso** nos planos padrão

### 3.3 Script de Vendas (30 segundos)

> "Meu Condomínio Fácil é um sistema web que simplifica 100% a gestão do seu condomínio. Controle financeiro, comunicação com moradores, portaria, ocorrências e relatórios - tudo em um só lugar. Acesse de qualquer navegador. Teste grátis por 7 dias!"

### 3.4 FAQ de Vendas

**"Tem aplicativo?"**
> Sim! Temos app nativo para Android e iOS disponível nas lojas.

**"Tem WhatsApp automático?"**
> O sistema está pronto! Para envio automático, oferecemos implantação à parte. Taxa de R$ 697 + R$ 149/mês.

**"Gera boleto e PIX automático?"**
> O sistema permite cadastrar cobranças. Para geração automática, temos Integração Bancária. Taxa R$ 999 + R$ 199/mês.

**"Quanto custa no total?"**
> Plano Básico: R$ 149,90/mês. Plano Profissional (mais vendido): R$ 249,90/mês. Integrações são opcionais.

### 3.5 Diferenciais

| Vs. | Problema | Nossa Solução |
|-----|----------|---------------|
| Excel | Bagunçado, sem backup | Organizado, 100% Cloud |
| Concorrentes | Caros (R$ 500-1000) | Justo e Moderno (R$ 149-399) |
| WhatsApp | Informal, sem registro | Profissional e Centralizado |

### 3.6 Metas de Vendas

| Clientes | Básico (30%) | Prof (50%) | Premium (20%) | MRR Estimado |
|----------|--------------|------------|---------------|-----|
| 10 | 3 × R$149 | 5 × R$249 | 2 × R$399 | R$ 2.490 |
| 50 | 15 × R$149| 25 × R$249 | 10 × R$399 | R$ 12.450 |
| 100 | 30 × R$149| 50 × R$249 | 20 × R$399 | R$ 24.900 |

---

## 4. Deploy

### 4.1 Pré-requisitos

**Contas Necessárias:**
- Vercel (Hospedagem)
- Supabase (Banco de Dados)
- Mercado Pago (Pagamentos)
- SMTP (E-mails)

### 4.2 Variáveis de Ambiente (Vercel)

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Mercado Pago
NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY=APP_USR-xxx
MERCADOPAGO_ACCESS_TOKEN=APP_USR-xxx

# Email
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=465
SMTP_USER=noreply@meucondominiofacil.com
SMTP_PASS=xxx

# App
NEXT_PUBLIC_APP_URL=https://meucondominiofacil.com
TRIAL_DAYS=7
```

### 4.3 Processo de Deploy

```bash
# 1. Build Local (Teste)
npm run build

# 2. Commit e Push
git add .
git commit -m "feat: Production deployment"
git push origin main

# Vercel detecta automaticamente e inicia o deploy!
```

### 4.4 Migrations

Execute no Supabase Dashboard → SQL Editor:

1. `supabase/schema.sql` - Schema inicial
2. `supabase/migrations/*.sql` - Todas em ordem

### 4.5 Checklist Pós-Deploy

- [ ] Landing page carrega
- [ ] Login funciona
- [ ] Dashboard carrega
- [ ] Cadastro de novo cliente funciona
- [ ] Mercado Pago redirect funciona
- [ ] Email de boas-vindas é enviado
- [ ] Portaria registra visitantes
- [ ] Relatórios são gerados

---

## 5. App Mobile

### 5.1 Plataformas

| Plataforma | Versão Mínima | Status |
|------------|---------------|--------|
| Android | 5.0+ (API 21+) | ✅ Pronto |
| iOS | 13.0+ | ✅ Pronto |

### 5.2 Stack Mobile

| Tecnologia | Uso |
|------------|-----|
| React Native | Framework |
| Expo SDK 50 | Ambiente |
| Expo Router | Navegação |
| Zustand | Estado global |
| TanStack Query | Data fetching |
| Supabase | Backend |

### 5.3 Build Commands

```bash
# Desenvolvimento
npm start

# Build Android APK
npx eas build -p android --profile preview

# Build iOS IPA
npx eas build -p ios --profile preview

# Produção
npx eas build -p android --profile production
npx eas build -p ios --profile production
```

### 5.4 Módulos Mobile (13)

1. 🔐 Autenticação
2. 📊 Dashboard
3. 💰 Gestão Financeira
4. 👥 Moradores
5. 🔧 Ocorrências
6. 📢 Avisos
7. 🏊 Reservas
8. 🚪 Portaria (Visitantes)
9. 📦 Encomendas
10. ⚖️ Governança
11. 🏢 SuperAdmin - Condos
12. 👤 SuperAdmin - Usuários
13. 💳 SuperAdmin - Assinaturas

---

## 6. Suporte

### 6.1 SLA por Plano

| Plano | SLA | Prioritário |
|-------|-----|-------------|
| Básico | 48 horas | ❌ |
| Profissional | 12 horas | ❌ |
| Premium | 4 horas | ✅ |

### 6.2 Categorias de Ticket

- 🔵 Baixa: Dúvidas, sugestões
- 🟢 Normal: Problemas não urgentes
- 🟡 Alta: Afeta operação
- 🔴 Prioritário: Apenas Premium (4h)

### 6.3 Contato

- **Site**: https://meucondominiofacil.com
- **Email**: contato@meucondominiofacil.com
- **WhatsApp**: (21) 96553-2247

---

## 7. Changelog v9.0 (Unified AI Update)

### Novidades e Melhorias

- ✅ **Unificação AI via Groq (Llama 3)**
  - OCR de Documentos: Muito mais rápido e preciso com Llama 3.2 Vision.
  - Chat Assistente: Migrado para Llama 3.1 70B (Respostas inteligentes).
  - Auditor de Orçamentos: Análise visual 100% via Groq.
  - Redução de dependência de APIs pagas (OpenAI/Gemini).

- ✅ **Performance de Dados (v9.0)**
  - **TanStack Query v5**: Migração completa de `useEffect` para queries/mutations com cache global.
  - UI muito mais fluida e sem "flashing" de carregamento.

- ✅ **Segurança e Conformidade (v9.0)**
  - **Soft Delete**: Sistema de lixeira para evitar perda acidental de dados e acelerar exclusões.
  - **Compliance Predial**: Novo módulo de semáforo para certificados (Venceu/A vencer).

- ✅ **Novos Módulos (v8.5)**
  - **Marketplace e Indicações**: Anúncios internos entre moradores e profissionais recomendados.
  - **Convites QR**: Moradores geram acesso rápido para visitantes.
  - **Multitenant SMTP**: Cada condomínio pode disparar e-mails pelo seu próprio domínio.

### Correções Recentes

- ✅ Correção no fluxo de logout (loop infinito resolvido).
- ✅ Padronização de autenticação via `id` (fim dos erros 400 no login).
- ✅ Criptografia AES de alta segurança para senhas SMTP.
- ✅ Melhoria radical no OCR: Priorização inteligente de CPF.

---

## 8. Segurança e LGPD

### 8.1 Proteção de Dados

- RLS em todas as tabelas
- Multi-tenant por condomínio
- HTTPS automático (Vercel)
- Criptografia AES-256-GCM para SMTP

### 8.2 Autenticação

- Supabase Auth (email/senha)
- JWT automático
- Sessão via cookies HTTP-only

### 8.3 Conformidade LGPD

- Aceite de termos obrigatório
- Registro em `legal_acceptances`
- Política de privacidade publicada
- Direito ao esquecimento implementado

---

## 9. Troubleshooting

### 9.1 Build Falha no Vercel

1. Veja logs de build no Vercel
2. Teste `npm run build` localmente
3. Verifique dependências no `package.json`
4. Limpe cache do Vercel (Redeploy)

### 9.2 Erro 500 em Produção

1. Veja Runtime Logs no Vercel
2. Verifique variáveis de ambiente
3. Teste endpoints da API localmente

### 9.3 Email não envia

1. Verifique `configuracoes_smtp` no banco
2. Confirme credenciais SMTP
3. Teste com `/api/configuracoes-smtp/test`

### 9.4 WhatsApp desconecta

1. Verifique se chip está ativo
2. Gere novo QR Code
3. Escaneie via videochamada

---

**Documentação Consolidada Completa**

| Parte | Arquivo | Páginas |
|-------|---------|---------|
| 1 | DOCS_CONSOLIDADOS_PARTE1.md | Visão Geral, Arquitetura |
| 2 | DOCS_CONSOLIDADOS_PARTE2.md | Banco de Dados |
| 3 | DOCS_CONSOLIDADOS_PARTE3.md | APIs (110+) |
| 4 | DOCS_CONSOLIDADOS_PARTE4.md | Integrações |
| 5 | DOCS_CONSOLIDADOS_PARTE5.md | Manual, Vendas, Deploy |

---

**© 2025 Meu Condomínio Fácil - Todos os direitos reservados**  
**CNPJ:** 57.444.727/0001-85
