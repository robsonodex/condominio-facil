# 09 - Documentação Técnica FULL (Master)

Este documento contém a especificação técnica absoluta do sistema **Meu Condomínio Fácil**, cobrindo desde a infraestrutura de banco de dados até a lógica de cada rota de API e estrutura de diretórios.

---

## 1. Stack Tecnológica e Ferramentas

### Core
- **Framework**: Next.js 15 (App Router) - Renderização híbrida (SSR/Client).
- **Linguagem**: TypeScript (Strict Mode).
- **Estilização**: Tailwind CSS + Shadcn UI + Radix UI.
- **Gerenciamento de Estado**: Zustand (Client) + Server Actions.
- **Banco de Dados**: PostgreSQL (Supabase).
- **Autenticação**: Supabase Auth (GoTrue).

### Serviços Externos
- **Pagamentos**: Mercado Pago SDK e Asaas API.
- **Inteligência Artificial**: AWS Rekognition (FaceId).
- **Infraestrutura**: Vercel (Hospedagem) + Supabase (Backend as a Service).
- **OCR**: Tesseract.js e APIs customizadas.

---

## 2. Estrutura do Projeto (File Tree)

```text
/
├── .next/                  # Build do Next.js
├── docs/                   # Documentação do sistema (Esta pasta)
├── public/                 # Assets estáticos (imagens, ícones, pwa)
├── src/
│   ├── app/                # Rotas do App Router
│   │   ├── (auth)/         # Telas de Login, Signup, Recuperação
│   │   ├── (dashboard)/    # Layout principal e telas logadas
│   │   ├── admin/          # Painel SuperAdmin
│   │   └── api/            # Endpoints REST do sistema
│   ├── components/         # Componentes React (ui, shared, specific)
│   ├── hooks/              # Custom Hooks (useUser, useAuth, useFeature)
│   ├── lib/                # Bibliotecas e Logica de Negócio
│   │   ├── integrations/   # Serviços de terceiros (MP, Asaas, AWS)
│   │   ├── supabase/       # Clientes Supabase (client, server, admin)
│   │   └── utils/          # Helpers e formatadores
│   └── types/              # Definições de tipos TypeScript globais
├── supabase/
│   ├── migrations/         # Scripts SQL de evolução do banco
│   └── schema.sql          # Schema inicial (Snapshot)
├── tailwind.config.ts      # Configuração de estilos
└── package.json            # Dependências e scripts
```

---

## 3. Detalhamento do Banco de Dados (SQL Completo)

O sistema utiliza o PostgreSQL com extensões de segurança do Supabase. Abaixo, a definição técnica das tabelas e sua semântica.

### 3.1. Tabelas de Estrutura (Core)
- **`condos`**: 
    - `id`: UUID (PK).
    - `nome_condominio`: String (Nome fantasia).
    - `cnpj`: CNPJ validado.
    - `plano_id`: FK para `plans.id`. Define o limite de recursos.
    - `mensageria_ativo`: Boolean. Toggle de UI para entregas.
- **`units`**:
    - `condo_id`: FK para `condos`. Agrupador multi-tenant.
    - `bloco`, `numero_unidade`: Identificadores físicos.
    - `vagas`: Inteiro. Limite de veículos.
- **`users`**:
    - `role`: Enum ('superadmin', 'sindico', 'morador', 'porteiro').
    - `ativo`: Boolean. Controle de suspensão de acesso.

### 3.2. Tabelas de Permissões (v10.0)
- **`feature_flags`**:
    - `feature_key`: Slug único (ex: `module_ai`).
    - `is_available`: Controle global de venda do recurso.
- **`condo_features`**:
    - `is_enabled`: Se o recurso está ativo para aquele cliente específico.
    - `config`: JSONB. Configurações customizadas do módulo (Ex: Chaves API).

### 3.3. Tabelas Financeiras
- **`billings`**:
    - `original_amount` vs `final_amount`: Trata multas e juros.
    - `status`: Máquina de estados (`pending` -> `paid` ou `overdue`).
- **`bank_webhooks`**:
    - `raw_payload`: JSONB. Armazena o dump bruto recebido do Asaas/MP para auditoria e re-processamento em caso de erro.

---

## 4. Deep Dive: Análise de Código (Linha a Linha)

Nesta seção, analisamos a lógica interna dos componentes e APIs mais críticos.

### 4.1. API: Toggle de Features (`/api/admin/features/toggle/route.ts`)
Esta API é a chave do modelo de negócio SaaS.
- **Linhas 8-22**: Validação de Identidade. O sistema busca o perfil do usuário logado e exige o role `superadmin`. Sem isso, retorna 403 Forbidden.
- **Linhas 25-40**: Integridade de Dados. Verifica se a feature solicitada existe no catálogo global (`feature_flags`).
- **Linhas 42-59**: Persistência Atomica. Utiliza `upsert` para habilitar ou desabilitar o recurso no condomínio, registrando quem fez a alteração (`enabled_by`).
- **Linhas 74-84**: Auditoria. Toda alteração de permissão gera um log na tabela `audit_logs` para conformidade de segurança.

### 4.2. Componente: Proteção de UI (`FeatureGuard.tsx`)
O "porteiro" das funcionalidades no front-end.
- **Linha 14**: Hook `useFeature`. Dispara uma consulta reativa ao estado de permissões do condomínio.
- **Linhas 17-23**: Estado de Carregamento. Exibe um spinner enquanto as permissões são validadas, evitando "flicker" de conteúdo proibido.
- **Linhas 25-46**: Barreira de Acesso. Se a feature estiver desativada, renderiza um "Paywall" amigável (`Funcionalidade Bloqueada`), sugerindo o upgrade e bloqueando a renderização do `children`.

### 4.3. Serviço: Integrações Integradas (`lib/integrations/index.ts`)
- **Memory Cache**: Implementa um objeto `Map` global que guarda as chaves de API carregadas do banco. Isso evita que cada clique no dashboard dispare uma query de banco para buscar o token do Mercado Pago.
- **TTL (Time to Live)**: O cache expira em 5 minutos, garantindo que alterações no painel administrativo sejam propagadas em tempo razoável sem sacrificar a performance.

---

## 5. Fluxos de Dados Críticos

### 5.1. Fluxo de Pagamento (Mercado Pago/Asaas)
1. **Geração**: O backend recebe a ordem, busca o `condo_id`, recupera a credencial via `getCondoIntegration` e chama a API do provedor.
2. **Notificação**: O banco envia um POST para `/api/webhooks/payments`.
3. **Validação**: O sistema verifica a assinatura do webhook, identifica a `fatura_id` e dispara o trigger de baixa.

### 5.2. Fluxo de Portaria Inteligente
1. **Evento**: Câmera detecta rosto/placa.
2. **Reconhecimento**: API envia para AWS Rekognition.
3. **Match**: Sistema busca na tabela `visitor_faces` ou `access_logs`.
4. **Resolução**: Se houver match ativo, envia sinal para abertura e registra entrada.

---

## 6. Segurança RLS (Row Level Security)

Nossa "Muralha da China". Cada tabela possui uma política baseada no JWT do usuário.

```sql
-- Exemplo Real de Segurança de Unidade
ALTER TABLE units ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Units_Isolation" ON units
AS PERMISSIVE FOR ALL
TO authenticated
USING (condo_id = (auth.jwt() ->> 'condo_id')::uuid);
```
**Por que isso é seguro?** Mesmo que um desenvolvedor esqueça de colocar um `.eq('condo_id', id)` na query, o Postgres vai filtrar automaticamente no nível do motor do banco, impedindo vazamento de dados entre clientes.

---

## 7. Escalabilidade e Deploy
- **Database Pooling**: Uso do Supabase Transaction Pooler (PgBouncer) para aguentar milhares de conexões simultâneas.
- **Vercel Edge Functions**: APIs de webhook e notificações rodam na borda para latência mínima.
- **Storage**: Fotos de documentos e rostos são armazenadas em buckets protegidos com políticas de expiração.

---

## 8. Mapa de Rotas de API (Endpoints)

O sistema utiliza Route Handlers em `/src/app/api`. Todas as rotas (exceto publicas) validam a sessão via Supabase.

### 8.1. Admin & Controle
- `POST /api/admin/features/toggle`: Alterna status de um módulo para um cliente.
- `GET /api/admin/features/available`: Retorna o que o cliente pagou.
- `POST /api/admin/payment-config`: Salva chaves de MP/Asaas de forma segura.

### 8.2. Fluxo Financeiro
- `POST /api/billing/generate`: Processa a fila para criar boletos/PIX.
- `POST /api/webhooks/payments`: Recebe notificações "Push" dos bancos.
- `GET /api/cron/reconcile-payments`: Tarefa agendada de limpeza e verificação.

### 8.3. Portaria Inteligente
- `POST /api/portaria/recognize-face`: Envia imagem para a AWS e busca morador.
- `POST /api/portaria/recognize-plate`: OCR de placas para abertura de portão.
- `POST /api/portaria/intercom-call`: Notifica a unidade sobre um visitante.

---

## 9. Lógica de Negócio (Camada Lib)

### `src/lib/integrations/index.ts`
Gerencia o cache em memória (5 min) das configurações de cada condomínio para reduzir o overhead do banco de dados em rotas de alta frequência.

### `src/lib/payments/mercadopago.ts` & `asaas.ts`
Encapsulam a complexidade dos SDKs externos. Implementam tratamento de erros específico para cada gateway e normalizam o retorno para o padrão do sistema.

### `src/lib/checkFeature.ts`
Helper server-side que verifica se o condomínio atual tem acesso ao recurso solicitado, consultando a tabela `condo_features` e o plano base.

---

## 10. Sistema de Trial e Demo (V10.0)

### Trial Strict
Controlado via Middleware. Se `data_fim_teste < NOW()`, o sistema redireciona o usuário para `/trial-expired`.

### Demo Creation (`/api/demo/create`)
1. Cria um condomínio temporário.
2. Popula com 10 unidades, 15 moradores e 5 faturas fake.
3. Define um token de acesso rápido para o lead.
4. O Job `/api/cron/cleanup-demos` apaga tudo após 24h.

---

## 11. Considerações de Performance
- Uso intensivo de **React Server Components (RSC)** para reduzir o bundle de JS no cliente.
- **SWR/React Query** para cache de dados no front-end.
- Índices de banco de dados otimizados em colunas de busca frequente (`condo_id`, `status`, `created_at`).

---
**Este documento é a Referência de Engenharia definitiva para o sistema Condomínio Fácil.**

**Fim do Documento Técnico v10.0**
