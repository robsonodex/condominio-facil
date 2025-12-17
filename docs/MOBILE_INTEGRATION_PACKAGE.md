# 🔗 Configuração de Integração - App Mobile

Este arquivo contém todas as informações necessárias para o app mobile se conectar ao backend do Meu Condomínio Fácil.

---

## 🔐 Variáveis de Ambiente (Copiar para `.env`)

```bash
# Supabase - Backend Principal
EXPO_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=sua-anon-key-aqui

# App Info
EXPO_PUBLIC_APP_NAME=Meu Condomínio Fácil
EXPO_PUBLIC_APP_VERSION=1.0.0
EXPO_PUBLIC_APP_BUNDLE_ID=com.meucondominiofacil.app

# Empresa
EXPO_PUBLIC_COMPANY_CNPJ=57.444.727/0001-85
EXPO_PUBLIC_SUPPORT_EMAIL=contato@meucondominiofacil.com
EXPO_PUBLIC_SUPPORT_WHATSAPP=5521965532247

# URLs do SaaS Web (para deep links)
EXPO_PUBLIC_WEB_URL=https://meucondominiofacil.com
```

---

## 📊 Schema do Banco de Dados

### Tabelas Principais

```typescript
// types/database.ts - Copiar para o app mobile

export interface Database {
  public: {
    Tables: {
      // CONDOMÍNIOS
      condos: {
        Row: {
          id: string;
          nome: string;
          endereco: string | null;
          cnpj: string | null;
          telefone: string | null;
          email: string | null;
          sindico_id: string | null;
          whatsapp_active: boolean;
          created_at: string;
        };
      };

      // UNIDADES
      units: {
        Row: {
          id: string;
          condo_id: string;
          numero: string;
          bloco: string | null;
          tipo: 'apartamento' | 'casa' | 'sala' | 'loja';
          owner_resident_id: string | null;
          created_at: string;
        };
      };

      // USUÁRIOS
      users: {
        Row: {
          id: string;
          email: string;
          role: 'superadmin' | 'sindico' | 'morador' | 'inquilino' | 'porteiro';
          nome: string;
          telefone: string | null;
          condo_id: string | null;
          unit_id: string | null;
          profile_image: string | null;
          created_at: string;
        };
      };

      // MORADORES
      residents: {
        Row: {
          id: string;
          condo_id: string;
          unit_id: string | null;
          nome: string;
          email: string | null;
          telefone: string | null;
          cpf: string | null;
          tipo: 'proprietario' | 'inquilino' | 'dependente';
          created_at: string;
        };
      };

      // FINANCEIRO
      financial_entries: {
        Row: {
          id: string;
          condo_id: string;
          tipo: 'receita' | 'despesa';
          categoria: string;
          descricao: string;
          valor: number;
          data_vencimento: string | null;
          data_pagamento: string | null;
          status: 'pendente' | 'pago' | 'cancelado' | 'vencido';
          unit_id: string | null;
          resident_id: string | null;
          created_by: string | null;
          created_at: string;
        };
      };

      // AVISOS
      notices: {
        Row: {
          id: string;
          condo_id: string;
          titulo: string;
          conteudo: string;
          tipo: 'informativo' | 'urgente' | 'manutencao' | 'evento';
          created_by: string | null;
          created_at: string;
        };
      };

      // OCORRÊNCIAS
      occurrences: {
        Row: {
          id: string;
          condo_id: string;
          unit_id: string | null;
          titulo: string;
          descricao: string;
          prioridade: 'baixa' | 'media' | 'alta' | 'critica';
          status: 'aberta' | 'em_andamento' | 'resolvida' | 'cancelada';
          created_by: string | null;
          created_at: string;
          resolved_at: string | null;
        };
      };

      // VISITANTES
      visitors: {
        Row: {
          id: string;
          condo_id: string;
          nome: string;
          documento: string | null;
          placa: string | null;
          tipo: 'visitante' | 'prestador' | 'entrega' | 'outros';
          unit_destino: string | null;
          motivo: string | null;
          foto_url: string | null;
          entrada: string;
          saida: string | null;
          porteiro_id: string | null;
          created_at: string;
        };
      };

      // ENCOMENDAS
      deliveries: {
        Row: {
          id: string;
          condo_id: string;
          unit_id: string;
          remetente: string | null;
          codigo_rastreio: string | null;
          descricao: string | null;
          foto_url: string | null;
          status: 'aguardando' | 'retirada' | 'devolvida';
          recebido_por: string | null;
          retirado_por: string | null;
          retirado_em: string | null;
          created_at: string;
        };
      };

      // RESERVAS
      reservations: {
        Row: {
          id: string;
          condo_id: string;
          unit_id: string;
          area_comum: string;
          data_reserva: string;
          hora_inicio: string | null;
          hora_fim: string | null;
          status: 'pendente' | 'aprovada' | 'rejeitada' | 'cancelada';
          valor: number | null;
          observacao: string | null;
          created_by: string | null;
          created_at: string;
        };
      };

      // ASSINATURAS
      subscriptions: {
        Row: {
          id: string;
          condo_id: string;
          plano_id: string;
          status: 'trial' | 'ativa' | 'suspensa' | 'cancelada' | 'expirada';
          data_inicio: string;
          data_fim: string | null;
          created_at: string;
        };
      };

      // PLANOS
      plans: {
        Row: {
          id: string;
          nome: string;
          descricao: string | null;
          preco: number;
          max_unidades: number;
          features: any; // JSON
          created_at: string;
        };
      };
    };
  };
}
```

---

## 🔌 Configuração do Supabase Client

```typescript
// lib/supabase.ts

import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Database } from '@/types/database';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});
```

---

## 🎨 Cores do Design System

```typescript
// constants/theme.ts

export const THEME = {
  // SÍNDICO - Verde Esmeralda
  sindico: {
    primary: '#059669',
    primaryDark: '#047857',
    accent: '#10B981',
    background: '#ECFDF5',
    gradient: ['#059669', '#047857'],
  },

  // MORADOR - Azul Safira
  morador: {
    primary: '#2563EB',
    primaryDark: '#1D4ED8',
    accent: '#3B82F6',
    background: '#EFF6FF',
    gradient: ['#2563EB', '#1D4ED8'],
  },

  // PORTEIRO - Âmbar Dourado
  porteiro: {
    primary: '#D97706',
    primaryDark: '#B45309',
    accent: '#F59E0B',
    background: '#FFFBEB',
    gradient: ['#D97706', '#B45309'],
  },

  neutral: {
    white: '#FFFFFF',
    background: '#F9FAFB',
    surface: '#F3F4F6',
    border: '#E5E7EB',
    text: '#111827',
    textSecondary: '#6B7280',
    textTertiary: '#9CA3AF',
  },

  semantic: {
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#3B82F6',
  },
};

export const getThemeByRole = (role: string) => {
  switch (role) {
    case 'sindico':
      return THEME.sindico;
    case 'morador':
    case 'inquilino':
      return THEME.morador;
    case 'porteiro':
      return THEME.porteiro;
    default:
      return THEME.sindico;
  }
};
```

---

## 📱 Funcionalidades por Perfil

### Síndico
| Módulo | Rota | Descrição |
|--------|------|-----------|
| Dashboard | `/dashboard` | Visão geral com métricas |
| Financeiro | `/financeiro` | Receitas e despesas |
| Cobranças | `/cobrancas` | Gerar e gerenciar cobranças |
| Moradores | `/moradores` | Lista de moradores |
| Avisos | `/avisos` | Criar e gerenciar avisos |
| Ocorrências | `/ocorrencias` | Gerenciar ocorrências |
| Reservas | `/reservas` | Aprovar/rejeitar reservas |
| Relatórios | `/relatorios` | Gerar PDF |

### Morador
| Módulo | Rota | Descrição |
|--------|------|-----------|
| Dashboard | `/dashboard` | Resumo pessoal |
| Cobranças | `/minhas-cobrancas` | Ver e pagar cobranças |
| Avisos | `/avisos` | Ver avisos |
| Reservas | `/reservas` | Solicitar reserva |
| Encomendas | `/encomendas` | Ver encomendas |
| Ocorrências | `/ocorrencias` | Abrir ocorrência |

### Porteiro
| Módulo | Rota | Descrição |
|--------|------|-----------|
| Dashboard | `/portaria` | Modo portaria |
| Visitantes | `/visitantes` | Registrar e gerenciar |
| Encomendas | `/encomendas` | Receber e entregar |
| Câmeras | `/cameras` | Visualizar câmeras |
| Ocorrências | `/ocorrencias` | Registrar ocorrência |

---

## 🔗 APIs Disponíveis

O app deve consumir diretamente o Supabase. Estas são as operações principais:

```typescript
// Autenticação
supabase.auth.signInWithPassword({ email, password })
supabase.auth.signOut()
supabase.auth.getSession()

// Buscar dados
supabase.from('tabela').select('*').eq('condo_id', condoId)

// Inserir
supabase.from('tabela').insert({ ... })

// Atualizar
supabase.from('tabela').update({ ... }).eq('id', id)

// Deletar
supabase.from('tabela').delete().eq('id', id)

// Real-time
supabase.channel('nome').on('postgres_changes', { ... }).subscribe()
```

---

## 📂 Arquivos de Referência no SaaS

Estes arquivos do projeto web podem servir como referência:

| Arquivo | O que contém |
|---------|-------------|
| `src/types/database.ts` | Types do banco de dados |
| `src/lib/supabase/client.ts` | Config do Supabase |
| `src/hooks/useUser.ts` | Hook de autenticação |
| `src/lib/plan-features.ts` | Lógica de restrição por plano |
| `docs/PROMPT_APP_MOBILE.md` | Prompt completo do app |
| `docs/INTEGRACAO_BANCARIA.md` | Documentação de pagamentos |
| `docs/INTEGRACAO_WHATSAPP.md` | Documentação de WhatsApp |

---

## ⚠️ Regras de Negócio Importantes

1. **RLS Ativo**: O Supabase tem Row Level Security. O app só verá dados do `condo_id` do usuário logado.

2. **Planos**: Verificar `subscriptions` e `plans` para saber quais features liberar.

3. **Roles**: O campo `role` em `users` define as permissões:
   - `superadmin` - Administrador geral (não usar no app)
   - `sindico` - Acesso total ao condomínio
   - `morador` / `inquilino` - Acesso limitado à própria unidade
   - `porteiro` - Acesso à portaria

4. **Senha Padrão**: Novos usuários têm senha `000000`. Forçar troca no primeiro acesso.

5. **Sessão**: Expira ao fechar app. Usar biometria para reautenticação rápida.

---

## 🚀 Como Começar

1. **Copiar** este arquivo e os tipos para o projeto mobile
2. **Configurar** as variáveis de ambiente
3. **Instalar** dependências do Supabase
4. **Testar** conexão com login
5. **Desenvolver** seguindo o `PROMPT_APP_MOBILE.md`

---

**Última atualização**: 17/12/2025
