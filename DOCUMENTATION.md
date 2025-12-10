# Condomínio Fácil - Documentação Oficial Unificada

**Versão:** 3.0  
**Data:** 10 de Dezembro de 2024  
**Status:** ✅ Estável / Em Produção (Beta)

---

## 📚 Índice

1. [Visão Geral e Escopo](#1-visão-geral-e-escopo)
2. [Funcionalidades e Módulos](#2-funcionalidades-e-módulos)
3. [Arquitetura do Sistema](#3-arquitetura-do-sistema)
4. [Autenticação e Permissões (RBAC)](#4-autenticação-e-permissões-rbac)
5. [Banco de Dados e Estrutura](#5-banco-de-dados-e-estrutura)
6. [Novos Recursos Implantados](#6-novos-recursos-implantados)
7. [Correções e Melhorias Recentes](#7-correções-e-melhorias-recentes)
8. [Logs, Monitoramento e Auditoria](#8-logs-monitoramento-e-auditoria)
9. [Interface (UI/UX)](#9-interface-uiux)
10. [Testes e Validação](#10-testes-e-validação)
11. [Roadmap Futuro](#11-roadmap-futuro)
12. [Anexos Técnicos](#12-anexos-técnicos)

---

## 1. Visão Geral e Escopo

**Condomínio Fácil** é uma plataforma SaaS multi-tenant para gestão completa de condomínios. O sistema permite a administração financeira, operacional e social de múltiplos condomínios simultaneamente, com perfis de acesso distintos e isolamento de dados.

### Diferenciais Técnicos
- **Multi-tenant Seguro:** Dados isolados por `condo_id` via RLS (Row Level Security) no banco de dados.
- **Serverless First:** Hospedagem Vercel + Banco Supabase (PostgreSQL).
- **Acesso Hierárquico:** De Superadmin (global) a Porteiros e Moradores.
- **Auditoria Total:** Logs de ações críticas, especialmente em acessos privilegiados.

---

## 2. Funcionalidades e Módulos

### 2.1 Administrativo (Superadmin)
- **Gestão Global:** Visualização de todos os condomínios, usuários e planos.
- **Impersonação (Troca de Conta):** Capacidade de acessar o sistema "como" qualquer outro usuário para suporte.
- **Métricas:** MRR, número de ativos, inadimplência global.
- **Logs de Sistema:** Auditoria de e-mails, acessos via impersonação.

### 2.2 Gestão Condominial (Síndico)
- **Financeiro:** Contas a pagar/receber, fluxo de caixa, inadimplência.
- **Moradores e Unidades:** Cadastro completo, histórico de moradores.
- **Aluguéis:** Gestão de contratos de locação, geração automática de cobranças.
- **Comunicação:** Mural de avisos (segmentado), Ocorrências.

### 2.3 Operacional (Portaria)
- **Controle de Acesso:** Registro de visiteurs, prestadores de serviço.
- **Encomendas:** Recebimento e notificação (planejado).
- **Ocorrências:** Registro de incidentes no dia-a-dia.

### 2.4 Autoatendimento (Morador)
- **Meu Condomínio:** Visualização de avisos, abertura de ocorrências.
- **Financeiro:** Segunda via de boletos (integrado Mercado Pago).
- **Aluguéis:** Visualização de faturas de aluguel (se inquilino).

---

## 3. Arquitetura do Sistema

O sistema opera em uma arquitetura **Next.js App Router** moderna, integrando SSR (Server Side Rendering) e Client Components.

### Fluxo de Dados
1. **Frontend (Next.js):** Consome dados via Supabase Client (`@supabase/ssr`).
2. **Autenticação:** Gerenciada pelo Supabase Auth (GoTrue). Sessaão persistida via Cookies.
3. **Middleware:** *(Atualmente desabilitado para evitar loops - ver Seção 7)*. Segurança feita via HOCs e Layouts.
4. **Backend (API Routes):**
   - `/api/*`: Endpoints para ações sensíveis (Checkout, Admin Ops, Proxy).
   - Usa `SIMPLE_SERVICE_ROLE` (`supabaseAdmin`) para bypass de RLS quando necessário (ex: criar usuário, deletar conta, impersonação).
5. **Banco de Dados (PostgreSQL):** PostgreSQL 15+ com RLS ativado em todas as tabelas sensíveis.

---

## 4. Autenticação e Permissões (RBAC)

O sistema utiliza um modelo RBAC (Role-Based Access Control) estrito, reforçado tanto no Frontend quanto no Banco de Dados (RLS).

### Tabela de Permissões Oficial

| Recurso | SUPERADMIN | Síndico | Porteiro | Morador |
| :--- | :---: | :---: | :---: | :---: |
| **Acesso Global** | ✅ (Total) | ❌ | ❌ | ❌ |
| **Acesso Condomínio** | ✅ (Qualquer) | ✅ (O Seu) | ✅ (O Seu) | ✅ (O Seu) |
| **Impersonação** | ✅ | ❌ | ❌ | ❌ |
| **Financeiro (Ver)** | ✅ | ✅ | ❌ | ✅ (Apenas própr.) |
| **Financeiro (Editar)**| ✅ | ✅ | ❌ | ❌ |
| **Usuários (Criar)** | ✅ | ✅ | ❌ | ❌ |
| **Aluguéis** | ✅ | ✅ | ❌ | ✅ (Ver faturas) |
| **Portaria** | ✅ | ✅ | ✅ | ❌ |
| **Avisos (Criar)** | ✅ | ✅ | ❌ | ❌ |
| **Ocorrências** | ✅ | ✅ | ✅ | ✅ (Criar/Ver Própr.)|

### Mecanismo de Segurança
1. **Frontend:** Hook `useUser` determina a visibilidade de menus e rotas.
   - **Superadmin:** Flag `canAccessAll` e `isSuperAdmin` garantem acesso irrestrito.
2. **Backend (RLS):**
   - Policies garantem que `sindico` só vê dados onde `condo_id` bate com seu perfil.
   - **Novo:** Policies especiais permitem que `superadmin` veja TUDO.

---

## 5. Banco de Dados e Estrutura

### Novas Tabelas e Estruturas

#### `impersonations` (Sessões de Troca de Conta)
Responsável por rastrear quem está impersonando quem.
```sql
create table impersonations (
  id uuid primary key,
  impersonator_id uuid references auth.users, -- Superadmin
  target_user_id uuid references auth.users,  -- Alvo
  expires_at timestamptz,
  ended_at timestamptz
);
```

#### `impersonation_action_logs` (Auditoria)
Registra ações tomadas durante a impersonação.
```sql
create table impersonation_action_logs (
  impersonator_id uuid,
  target_user_id uuid,
  method text,       -- POST, DELETE, etc
  path text,         -- /api/financeiro, etc
  payload jsonb      -- Detalhes da ação
);
```

### Tabelas Core (Resumo)
- `users`: Extensão da `auth.users`, contém perfil e role.
- `condos`: Condomínios.
- `financial_entries`: Lançamentos (RLS por condomínio).
- `rental_contracts`: Contratos de aluguel.
- `notices`: Mural de avisos.

---

## 6. Novos Recursos Implantados

### 6.1 Superadmin "God Mode"
- **Descrição:** Superadmins agora têm permissão de visualizar e editar dados de **qualquer** condomínio sem restrições.
- **Implementação:** Ajuste nas RLS policies (`FOR ALL USING (is_superadmin())`) e no Frontend (`useUser` retorna `canAccessAll: true`).

### 6.2 Impersonation (Trocar de Conta)
- **Descrição:** Permite ao Superadmin "entrar" na conta de um síndico para ver exatamente o que ele vê.
- **Acesso:** Menu Lateral -> Botão "Trocar de Conta".
- **Visual:** Banner Laranja persistente indica o modo ativo.
- **Segurança:** Cookie `HttpOnly` seguro, com expiração automática e log de auditoria.

### 6.3 Sistema de Aluguéis
- **Descrição:** Módulo completo para administrar unidades alugadas pelo condomínio (ex: salão, loja, apto do zelador).
- **Recursos:** Contratos, boletos automáticos, renovação.

---

## 7. Correções e Melhorias Recentes

### 🩹 Críticas
1. **Loop Infinito de Login:**
   - **Causa:** `useAuth` entrava em conflito com `middleware` ao tentar renovar sessão inexistente.
   - **Correção:** Implementado timeout de segurança (5s) e lógica de `useRef` para impedir múltiplos redirects. Middleware desativado temporariamente em favor de proteção via Layout/Components.
2. **Layout Quebrado para Superadmin:**
   - **Problema:** Superadmin era identificado incorretamente como "Morador" pelo sistema, escondendo menus.
   - **Correção:** Refatoração do `useUser` para distinguir `actualRole` (papel real) de `permissions` (o que pode fazer). Superadmin agora carrega a UI completa de Síndico por padrão.

### 🛠️ Melhorias
- **Utilitários Restaurados:** Funções `formatCurrency` e `formatDate` refeitas após atualização de bibliotecas.
- **Type Safety:** Correção de tipos no `route.ts` de impersonação.
- **Feedback Visual:** Skeleton screens adicionados ao dashboard para melhor UX.

---

## 8. Logs, Monitoramento e Auditoria

O sistema possui camadas de rastreabilidade:

1. **Logs de Acesso:** Geridos pelo Supabase Auth.
2. **Logs de E-mail:** Tabela `email_logs` registra cada envio (sucesso/falha).
3. **Logs de Impersonação:** Tabela `impersonation_action_logs` (Novo).
   - Registra: QUEM (Admin), POR QUEM (Alvo), O QUE (Ação), QUANDO.
   - Essencial para compliance e segurança.

---

## 9. Interface (UI/UX)

A interface utiliza **Tailwind CSS** e componentes **shadcn/ui**.

### Componentes Chave
- **Sidebar Dinâmica:** Filtra itens com base no Role. Exibe botão de Impersonação apenas para Admins.
- **Banner de Impersonação:** Componente global (`layout.tsx`) que alerta sobre o modo de acesso.
- **Modais:** Padronizados para criação de registros (Usuários, Avisos, Contratos).

---

## 10. Testes e Validação

### Rotina de Testes
1. **Validação Estática:** `npm run lint` e `tsc` (TypeScript Compiler) rodam antes do deploy.
2. **Testes Manuais (QA):**
   - Login (todos os perfis).
   - Fluxo de Checkout.
   - Impersonação (Start/Stop).
   - CRUD de Avisos/Financeiro.

### Comandos Úteis
```bash
# Validar Tipagem
npx tsc --noEmit

# Rodar Lint
npm run lint

# Build de Produção
npm run build
```

---

## 11. Roadmap Futuro

Lista prioritária de desenvolvimentos pendentes:

- [ ] **Mobile App:** Versão React Native para Moradores (notificações push).
- [ ] **Reservas:** Módulo de reserva de áreas comuns.
- [ ] **Portaria Hardware:** Integração com câmeras/tags (futuro).
- [ ] **Relatórios Avançados:** Exportação PDF/Excel nativa.

---

## 12. Anexos Técnicos

### Endpoint de Impersonação (`src/app/api/impersonate/route.ts`)
```typescript
export async function POST(request: NextRequest) {
    // 1. Valida Superadmin
    const session = await getSessionFromReq(request);
    if (!session?.isSuperadmin) return forbidden();
    
    // 2. Cria registro no DB
    const { data: imp } = await supabaseAdmin.from('impersonations').insert(...);
    
    // 3. Define Cookie HttpOnly
    cookies().set('impersonation_session', imp.id, { httpOnly: true });
}
```

### Hook de Usuário (`src/hooks/useUser.ts`)
```typescript
export function useUser() {
    const { user, profile } = useAuth();
    // Lógica para detectar impersonação e substituir perfil
    const effectiveProfile = isImpersonating ? impersonatedProfile : profile;
    return { 
        profile: effectiveProfile, 
        isSuperAdmin: profile.role === 'superadmin' 
    };
}
```

---

**© 2024 Nodex Soluções - Todos os direitos reservados.**
