# Banco de Dados - Schema Completo

## Visão Geral

- **SGBD**: PostgreSQL 15 (via Supabase)
- **Segurança**: Row Level Security (RLS) ativo em todas as tabelas
- **Migrations**: 31 arquivos SQL em `/supabase/migrations`
- **Backup**: Automático diário (Supabase)

## Tabelas Principais

### Tabelas Core

#### `condos`
Condomínios cadastrados no sistema.

```sql
CREATE TABLE condos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome VARCHAR(255) NOT NULL,
  cnpj VARCHAR(18),
  cep VARCHAR(9),
  endereco TEXT,
  cidade VARCHAR(100),
  estado VARCHAR(2),
  telefone VARCHAR(20),
  email VARCHAR(255),
  logo_url TEXT,
  mensageria_ativo BOOLEAN DEFAULT false,
  chat_sindico_ativo BOOLEAN DEFAULT false,
  ai_ativo BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Policies RLS**:
- Superadmin: acesso total
- Síndico: apenas próprio condomínio
- Morador/Porteiro: leitura do próprio condomínio

#### `users`
Usuários do sistema (moradores, síndicos, porteiros, superadmin).

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email VARCHAR(255) UNIQUE NOT NULL,
  nome VARCHAR(255),
  telefone VARCHAR(20),
  cpf VARCHAR(14),
  role VARCHAR(20) CHECK (role IN ('morad

or', 'sindico', 'porteiro', 'superadmin', 'inquilino')),
  condo_id UUID REFERENCES condos(id) ON DELETE CASCADE,
  unidade_id UUID REFERENCES units(id) ON DELETE SET NULL,
  avatar_url TEXT,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_users_condo ON users(condo_id);
CREATE INDEX idx_users_role ON users(role);
```

**Policies RLS**:
- Superadmin: acesso total
- Síndico: usuários do próprio condo
- Morador: leitura de usuários do condo

#### `units`
Unidades (apartamentos/casas) do condomínio.

```sql
CREATE TABLE units (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  condo_id UUID REFERENCES condos(id) ON DELETE CASCADE,
  numero VARCHAR(20) NOT NULL,
  bloco VARCHAR(20),
  andar VARCHAR(10),
  tipo VARCHAR(50),
  metragem DECIMAL(10,2),
  valor_iptu DECIMAL(10,2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(condo_id, numero, bloco)
);
```

#### `subscriptions`
Assinaturas dos condomínios.

```sql
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  condo_id UUID REFERENCES condos(id) ON DELETE CASCADE,
  plano VARCHAR(50) CHECK (plano IN ('basico', 'standard', 'premium', 'enterprise')),
  status VARCHAR(20) CHECK (status IN ('ativa', 'trial', 'cancelada', 'vencida')),
  valor DECIMAL(10,2),
  inicio DATE,
  fim DATE,
  trial_fim DATE,
  mercadopago_subscription_id VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Módulo Financeiro

#### `transacoes`
Receitas e despesas do condomínio.

```sql
CREATE TABLE transacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  condo_id UUID REFERENCES condos(id) ON DELETE CASCADE,
  tipo VARCHAR(10) CHECK (tipo IN ('receita', 'despesa')),
  descricao TEXT NOT NULL,
  valor DECIMAL(10,2) NOT NULL,
  data DATE NOT NULL,
  categoria VARCHAR(100),
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### `cobrancas`
Cobranças enviadas aos moradores.

```sql
CREATE TABLE cobrancas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  condo_id UUID REFERENCES condos(id) ON DELETE CASCADE,
  unidade_id UUID REFERENCES units(id) ON DELETE SET NULL,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  valor DECIMAL(10,2) NOT NULL,
  descricao TEXT,
  vencimento DATE NOT NULL,
  tipo VARCHAR(20) CHECK (tipo IN ('boleto', 'pix')),
  status VARCHAR(20) CHECK (status IN ('pendente', 'paga', 'vencida', 'cancelada')),
  pix_qrcode TEXT,
  pix_copia_cola TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Módulo Comunicação

#### `chat_sindico_conversas`
Conversas entre síndico e moradores.

```sql
CREATE TABLE chat_sindico_conversas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  condo_id UUID REFERENCES condos(id) ON DELETE CASCADE,
  morador_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  sindico_id UUID REFERENCES users(id) ON DELETE CASCADE,
  assunto VARCHAR(255),
  status VARCHAR(20) DEFAULT 'aberta' CHECK (status IN ('aberta', 'fechada', 'pendente')),
  ultima_mensagem_em TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### `chat_sindico_mensagens`
Mensagens das conversas.

```sql
CREATE TABLE chat_sindico_mensagens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversa_id UUID REFERENCES chat_sindico_conversas(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES users(id) ON DELETE CASCADE,
  condo_id UUID REFERENCES condos(id) ON DELETE CASCADE,
  conteudo TEXT NOT NULL,
  lida BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### `notifications`
Notificações in-app.

```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  condo_id UUID REFERENCES condos(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(50) CHECK (type IN ('info', 'warning', 'error', 'success')),
  read BOOLEAN DEFAULT false,
  link TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Módulo Portaria

#### `visitors`
Registro de visitantes.

```sql
CREATE TABLE visitors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  condo_id UUID REFERENCES condos(id) ON DELETE CASCADE,
  nome VARCHAR(255) NOT NULL,
  documento VARCHAR(50),
  unidade_id UUID REFERENCES units(id) ON DELETE SET NULL,
  tipo VARCHAR(50) CHECK (tipo IN ('visitante', 'prestador', 'veiculo')),
  data_entrada TIMESTAMPTZ DEFAULT NOW(),
  data_saida TIMESTAMPTZ,
  observacoes TEXT,
  registrado_por UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### `mensageria`
Sistema de encomendas (pacotes).

```sql
CREATE TABLE mensageria (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  condo_id UUID REFERENCES condos(id) ON DELETE CASCADE,
  unidade_id UUID REFERENCES units(id) ON DELETE SET NULL,
  destinatario VARCHAR(255),
  remetente VARCHAR(255),
  tipo VARCHAR(50) CHECK (tipo IN ('encomenda', 'correspondencia', 'carga')),
  descricao TEXT,
  data_chegada TIMESTAMPTZ DEFAULT NOW(),
  data_retirada TIMESTAMPTZ,
  retirado_por VARCHAR(255),
  status VARCHAR(20) DEFAULT 'aguardando' CHECK (status IN ('aguardando', 'retirado', 'devolvido')),
  foto_url TEXT,
  codigo_rastreio VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Módulo Ocorrências

#### `occurrences`
Ocorrências registradas.

```sql
CREATE TABLE occurrences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  condo_id UUID REFERENCES condos(id) ON DELETE CASCADE,
  titulo VARCHAR(255) NOT NULL,
  descricao TEXT,
  tipo VARCHAR(100),
  gravidade VARCHAR(20) CHECK (gravidade IN ('baixa', 'media', 'alta', 'urgente')),
  status VARCHAR(20) DEFAULT 'aberta' CHECK (status IN ('aberta', 'em_andamento', 'resolvida', 'fechada')),
  local VARCHAR(255),
  data_ocorrencia TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  assigned_to UUID REFERENCES users(id),
  foto_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### `occurrence_comments`
Comentários em ocorrências.

```sql
CREATE TABLE occurrence_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  occurrence_id UUID REFERENCES occurrences(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  comment TEXT NOT NULL,
  is_internal BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Módulo Reservas

#### `common_areas`
Áreas comuns reserváveis.

```sql
CREATE TABLE common_areas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  condo_id UUID REFERENCES condos(id) ON DELETE CASCADE,
  nome VARCHAR(255) NOT NULL,
  descricao TEXT,
  capacidade INT,
  disponivel BOOLEAN DEFAULT true,
  valor_hora DECIMAL(10,2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### `reservations`
Reservas de áreas comuns.

```sql
CREATE TABLE reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  condo_id UUID REFERENCES condos(id) ON DELETE CASCADE,
  area_id UUID REFERENCES common_areas(id) ON DELETE SET NULL,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  data DATE NOT NULL,
  hora_inicio TIME NOT NULL,
  hora_fim TIME NOT NULL,
  status VARCHAR(20) DEFAULT 'confirmada' CHECK (status IN ('confirmada', 'cancelada', 'finalizada')),
  observacoes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(area_id, data, hora_inicio)
);
```

### Módulo Sugestões

#### `suggestions`
Sugestões dos moradores.

```sql
CREATE TABLE suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  condo_id UUID REFERENCES condos(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100),
  status VARCHAR(20) DEFAULT 'aberta' CHECK (status IN ('aberta', 'em_analise', 'aprovada', 'rejeitada', 'implementada')),
  votes_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### `suggestion_votes`
Votos em sugestões.

```sql
CREATE TABLE suggestion_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  suggestion_id UUID REFERENCES suggestions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  vote_type VARCHAR(10) CHECK (vote_type IN ('up', 'down')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(suggestion_id, user_id)
);
```

### Módulo Governança

#### `assembleias`
Assembleias condominiais.

```sql
CREATE TABLE assembleias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  condo_id UUID REFERENCES condos(id) ON DELETE CASCADE,
  titulo VARCHAR(255) NOT NULL,
  descricao TEXT,
  data TIMESTAMPTZ NOT NULL,
  local VARCHAR(255),
  tipo VARCHAR(50) CHECK (tipo IN ('ordinaria', 'extraordinaria')),
  status VARCHAR(20) DEFAULT 'agendada' CHECK (status IN ('agendada', 'em_andamento', 'concluida', 'cancelada')),
  pauta TEXT,
  ata TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### `enquetes` (Polls)
Enquetes/votações.

```sql
CREATE TABLE enquetes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  condo_id UUID REFERENCES condos(id) ON DELETE CASCADE,
  titulo VARCHAR(255) NOT NULL,
  descricao TEXT,
  data_inicio TIMESTAMPTZ DEFAULT NOW(),
  data_fim TIMESTAMPTZ,
  status VARCHAR(20) DEFAULT 'ativa' CHECK (status IN ('ativa', 'encerrada', 'rascunho')),
  votos_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Módulo Configurações

#### `configuracoes_smtp`
Configurações de servidor SMTP.

```sql
CREATE TABLE configuracoes_smtp (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  condominio_id UUID REFERENCES condos(id) ON DELETE CASCADE, -- NULL = config global
  smtp_host VARCHAR(255) NOT NULL,
  smtp_port INTEGER NOT NULL DEFAULT 587,
  smtp_user VARCHAR(255) NOT NULL,
  smtp_password TEXT NOT NULL,
  smtp_from_email VARCHAR(255) NOT NULL,
  smtp_from_name VARCHAR(255),
  smtp_secure BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

CREATE UNIQUE INDEX configuracoes_smtp_global_unique 
  ON configuracoes_smtp (condominio_id) 
  WHERE condominio_id IS NOT NULL;
```

**Nota**: `condominio_id = NULL` indica configuração SMTP global do superadmin.

#### `pix_config`
Configurações de PIX do condomínio.

```sql
CREATE TABLE pix_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  condo_id UUID REFERENCES condos(id) ON DELETE CASCADE UNIQUE,
  chave_pix VARCHAR(255) NOT NULL,
  tipo_chave VARCHAR(20) CHECK (tipo_chave IN ('cpf', 'cnpj', 'email', 'telefone', 'evp')),
  nome_beneficiario VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### `condo_integrations`
Integrações externas (WhatsApp, etc).

```sql
CREATE TABLE condo_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  condo_id UUID REFERENCES condos(id) ON DELETE CASCADE,
  tipo VARCHAR(50) CHECK (tipo IN ('whatsapp', 'sms', 'outros')),
  active BOOLEAN DEFAULT false,
  config JSONB,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Módulo Auditoria e Segurança

#### `impersonations`
Log de impersonificações (superadmin visualizando como outro usuário).

```sql
CREATE TABLE impersonations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  impersonator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  target_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reason TEXT,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### `audit_logs`
Log de ações críticas no sistema.

```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  condo_id UUID REFERENCES condos(id) ON DELETE CASCADE,
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(100),
  entity_id UUID,
  old_value JSONB,
  new_value JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### `legal_acceptances`
Aceite de termos legais (LGPD, Termos de Uso).

```sql
CREATE TABLE legal_acceptances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  acceptance_type VARCHAR(50) CHECK (acceptance_type IN ('terms', 'privacy', 'lgpd')),
  version VARCHAR(20),
  accepted_at TIMESTAMPTZ DEFAULT NOW(),
  ip_address VARCHAR(45)
);
```

## Diagrama ER (Simplificado)

```
condos (1) ─────< (N) users
  │                     │
  │                     └─< cobrancas
  ├─< units             │
  ├─< subscriptions     └─< chat_sindico_conversas ─< chat_sindico_mensagens
  ├─< transacoes
  ├─< occurrences ─< occurrence_comments
  ├─< reservations ─< common_areas
  ├─< suggestions ─< suggestion_votes
  ├─< notifications
  ├─< visitors
  ├─< mensageria
  └─< configuracoes_smtp (1 ou 0)
```

## Migrations Aplicadas

Total: 31 migrations (ver `/supabase/migrations/`)

**Principais**:
- Sistema de boletos
- Notificações
- Chat síndico-morador
- Sistema de sugestões
- Mensageria (encomendas)
- Governança (assembleias, enquetes)
- Impersonificação e auditoria
- Comentários em ocorrências
- SMTP configurável (por condo + global)
- Correção de CASCADE para exclusão de condos

## Índices Performance

Todos os `foreign_key` possuem índices automáticos. Índices adicionais:

```sql
CREATE INDEX idx_users_condo ON users(condo_id);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_cobrancas_status ON cobrancas(status);
CREATE INDEX idx_cobrancas_vencimento ON cobrancas(vencimento);
CREATE INDEX idx_notifications_read ON notifications(read);
CREATE INDEX idx_occurrences_status ON occurrences(status);
CREATE INDEX idx_reservations_data ON reservations(data);
```

## Backup e Restore

**Backup automático**: Supabase faz backup diário automático (retenção de 7 dias no plano free, 30 dias nos pagos).

**Backup manual**:
```bash
# Via Supabase CLI
supabase db dump > backup.sql

# Restore
supabase db push backup.sql
```
