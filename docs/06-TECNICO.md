# 06 - Especificação Técnica do Sistema

Este documento é destinado a desenvolvedores e auditores técnicos.

## 🗄️ Estrutura de Dados (Supabase/PostgreSQL)

### Tabelas Principais
- `condos`: Dados mestre de cada condomínio.
- `users`: Todos os perfis (auth viculado).
- `units`: Unidades habitacionais vinculadas a um `condo_id`.
- `feature_flags`: Definição global de módulos disponíveis.
- `condo_features`: Módulos ativos por condomínio (V10.0).
- `billings`: Faturas e registros financeiros.
- `intercom_calls`: Registros de chamadas de interfone (V10.0).

### Segurança: Row Level Security (RLS)
Todas as tabelas possuem RLS habilitado.
- `USING (condo_id = auth.jwt() ->> 'condo_id')`
- Isso garante que consultas `SELECT * FROM units` retornem apenas as unidades do condomínio do usuário logado.

## 🔌 API Routes (Next.js)

### Admin & Permissões
- `POST /api/admin/features/toggle`: Ativação de módulos.
- `GET /api/admin/features/available`: Consulta de recursos ativos.

### Financeiro
- `POST /api/admin/payment-config`: Salva credenciais criptografadas.
- `POST /api/webhooks/payments`: Ponto de entrada para notificações bancárias.

### Portaria
- `POST /api/portaria/recognize-face`: Integração com AWS.
- `POST /api/portaria/intercom-call`: Sinalização de chamadas.

## 🏗️ Padrões de Desenvolvimento
- **Server Components**: Para carregamento rápido de dados.
- **Client Components**: Usados apenas onde há interatividade (Formulários, Drag & Drop).
- **Zustand/Context**: Para estado global de sessão e perfil.
