# Meu Condomínio Fácil - Documentação Técnica

## Visão Geral

**Meu Condomínio Fácil** é uma plataforma SaaS completa para gestão condominial que oferece ferramentas modernas para síndicos, moradores, porteiros e administradores.

### Tecnologias Principais

- **Frontend**: Next.js 15 (App Router), React 19, TailwindCSS
- **Backend**: Next.js API Routes (serverless)
- **Banco de Dados**: Supabase (PostgreSQL)
- **Autenticação**: Supabase Auth
- **Hospedagem**: Vercel
- **E-mail**: Nodemailer (SMTP configurável)
- **Pagamentos**: Mercado Pago
- **Mobile**: React Native + Expo

### Arquitetura

```
┌─────────────────────────────────────────┐
│         Frontend (Next.js 15)           │
│   - App Router                          │
│   - Server Components                   │
│   - Client Components                   │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│       API Routes (Serverless)           │
│   - 45 módulos de API                   │
│   - Autenticação via Supabase           │
│   - Rate limiting                       │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│      Supabase (PostgreSQL)              │
│   - Row Level Security (RLS)            │
│   - Real-time subscriptions             │
│   - Storage para arquivos               │
└─────────────────────────────────────────┘
```

## Estrutura de Pastas

```
condominio-facil/
├── src/
│   ├── app/
│   │   ├── (dashboard)/        # Páginas autenticadas
│   │   ├── (public)/           # Páginas públicas
│   │   └── api/                # API Routes (45 módulos)
│   ├── components/
│   │   ├── ui/                 # Componentes base (shadcn)
│   │   ├── shared/             # Componentes compartilhados
│   │   ├── admin/              # Componentes de admin
│   │   └── payments/           # Componentes de pagamento
│   ├── lib/
│   │   ├── supabase/           # Cliente Supabase
│   │   └── utils/              # Utilitários
│   └── hooks/                  # React Hooks customizados
├── supabase/
│   └── migrations/             # 36 migrations SQL
├── mobile/                     # App React Native
├── docs/                       # Documentação
└── tests/                      # Testes E2E e unitários
```

## Perfis de Usuário

### 1. **Superadmin**
- Acesso total ao sistema
- Gerencia condomínios, planos e assinaturas
- Impersonificação de usuários
- Dashboard administrativo global

### 2. **Síndico**
- Gestão completa do condomínio
- Financeiro, cobranças, usuários
- Reservas de áreas comuns
- Chat com moradores
- Relatórios

### 3. **Morador/Inquilino**
- Visualização de cobranças
- Reserva de áreas comuns
- Registro de ocorrências
- Chat com síndico
- Sugestões

### 4. **Porteiro**
- Registro de visitantes
- Controle de encomendas
- Registro de ocorrências
- Visualização de câmeras

## Módulos Principais

| Módulo | Descrição | Status |
|--------|-----------|--------|
| Autenticação | Login, registro, recuperação de senha | ✅ Implementado |
| Dashboard | Visão geral por perfil | ✅ Implementado |
| Financeiro | Controle de receitas e despesas | ✅ Implementado |
| Cobranças | Geração e envio de boletos | ✅ Implementado |
| Usuários | Gestão de moradores e perfis | ✅ Implementado |
| Unidades | Cadastro de apartamentos/casas | ✅ Implementado |
| Ocorrências | Registro e acompanhamento | ✅ Implementado |
| Reservas | Agendamento de áreas comuns | ✅ Implementado |
| Portaria | Visitantes, encomendas, câmeras | ✅ Implementado |
| Chat Síndico | Comunicação síndico-morador | ✅ Implementado |
| Notificações | Sistema in-app | ✅ Implementado |
| Sugestões | Caixa de sugestões com votação | ✅ Implementado |
| Governança | Assembleias, enquetes, documentos | ✅ Implementado |
| Assinaturas | Planos e pagamentos recorrentes | ✅ Implementado |
| Integrações | WhatsApp, pagamentos, PIX | ✅ Implementado |
| E-mail | SMTP por condomínio + global (envio direto) | ✅ Implementado |
| Assistente IA | Chat GPT integrado | ✅ Implementado |
| Mobile App | App nativo iOS/Android | ✅ Implementado |
| QR Code Pass | Convites digitais para visitantes | ✅ Implementado |
| Auditor IA | Auditoria de orçamentos via GPT-4o | ✅ Implementado |
| Emergency Tools | Reset de senha e ferramentas admin | ✅ Implementado |

## Links da Documentação

1. [Arquitetura Detalhada](./ARQUITETURA.md)
2. [API Routes](./API.md)
3. [Banco de Dados](./DATABASE.md)
4. [Fluxos de Usuário](./FLUXOS.md)
5. [Integrações](./INTEGRACOES.md)
6. [Deploy e Infraestrutura](./DEPLOY.md)

## Início Rápido

### Desenvolvimento Local

```bash
# Instalar dependências
npm install

# Configurar variáveis de ambiente
cp .env.example .env.local
# Edite .env.local com suas chaves

# Rodar servidor de desenvolvimento
npm run dev
```

### Testes

```bash
# Testes unitários
npm run test:unit

# Testes E2E
npm run test:e2e
```

## Suporte

- **Email**: suporte@meucondominiofacil.com
- **Documentação**: https://docs.meucondominiofacil.com
- **Status**: https://status.meucondominiofacil.com
