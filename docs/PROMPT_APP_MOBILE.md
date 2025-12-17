# 📱 PROMPT MASTER - Aplicativo Mobile Meu Condomínio Fácil

> **Propósito**: Este prompt destina-se a uma IA especializada em desenvolvimento mobile para criar um aplicativo nativo Android/iOS que seja uma **extensão perfeita** do sistema SaaS web Meu Condomínio Fácil.

---

## 🎯 CONTEXTO E VISÃO

Você é um desenvolvedor mobile expert que criará o aplicativo **Meu Condomínio Fácil** para Android e iOS. Este app é uma **extensão do sistema SaaS web** existente, conectando-se à mesma API e banco de dados Supabase. Qualquer modificação no SaaS web deve refletir instantaneamente no app, e vice-versa.

### Empresa
- **Nome**: Meu Condomínio Fácil
- **CNPJ**: 57.444.727/0001-85
- **Produto**: Sistema de gestão de condomínios para síndicos, porteiros e moradores
- **Público**: Condomínios pequenos e médios no Brasil (20-100 unidades)

### Stack Backend (Já Existente - NÃO MODIFICAR)
- **Banco de Dados**: Supabase (PostgreSQL) com Row Level Security
- **Autenticação**: Supabase Auth (email/senha)
- **Storage**: Supabase Storage (fotos de visitantes, documentos)
- **API Base URL**: `https://[project-id].supabase.co`
- **Real-time**: Supabase Realtime para sincronização

---

## 🏗️ ARQUITETURA DO APP

### Stack Mobile Recomendada
```
Framework: React Native + Expo (SDK 50+)
UI Library: React Native Paper ou NativeWind (Tailwind para RN)
State: Zustand ou React Query + Context
Navigation: React Navigation 6
Auth: Supabase JS Client
Notificações: Expo Notifications + Firebase Cloud Messaging
Armazenamento Local: AsyncStorage + MMKV
Animações: Reanimated 3 + Moti
Biometria: expo-local-authentication
```

### Estrutura de Pastas
```
src/
├── app/                    # Expo Router (file-based routing)
│   ├── (auth)/            # Telas de autenticação
│   ├── (tabs)/            # Navegação por abas
│   │   ├── (sindico)/     # Abas do síndico
│   │   ├── (morador)/     # Abas do morador
│   │   └── (porteiro)/    # Abas do porteiro
│   └── _layout.tsx        # Layout raiz
├── components/
│   ├── ui/                # Componentes base
│   ├── cards/             # Cards de informação
│   └── modals/            # Bottom sheets e modais
├── hooks/                 # Custom hooks
├── lib/
│   ├── supabase.ts       # Cliente Supabase
│   ├── notifications.ts  # Push notifications
│   └── biometrics.ts     # Autenticação biométrica
├── stores/               # Estado global (Zustand)
├── types/                # TypeScript types
└── utils/                # Utilitários
```

---

## 🎨 DESIGN SYSTEM

### Filosofia de Design
- **Minimalismo Funcional**: Cada elemento tem propósito claro
- **Gestos Naturais**: Swipe, pull-to-refresh, long-press
- **Micro-interações**: Feedback tátil e visual em cada ação
- **Dark Mode**: Suporte obrigatório
- **Acessibilidade**: WCAG AA compliance

### Cores por Perfil de Usuário

```typescript
const THEME = {
  // SÍNDICO - Verde Esmeralda (Autoridade, Confiança)
  sindico: {
    primary: '#059669',      // emerald-600
    primaryDark: '#047857',  // emerald-700
    accent: '#10B981',       // emerald-500
    background: '#ECFDF5',   // emerald-50
    gradient: ['#059669', '#047857'],
  },

  // MORADOR - Azul Safira (Tranquilidade, Lar)
  morador: {
    primary: '#2563EB',      // blue-600
    primaryDark: '#1D4ED8',  // blue-700
    accent: '#3B82F6',       // blue-500
    background: '#EFF6FF',   // blue-50
    gradient: ['#2563EB', '#1D4ED8'],
  },

  // PORTEIRO - Âmbar Dourado (Vigilância, Atenção)
  porteiro: {
    primary: '#D97706',      // amber-600
    primaryDark: '#B45309',  // amber-700
    accent: '#F59E0B',       // amber-500
    background: '#FFFBEB',   // amber-50
    gradient: ['#D97706', '#B45309'],
  },

  // Neutros
  neutral: {
    background: '#FFFFFF',
    surface: '#F9FAFB',
    text: '#111827',
    textSecondary: '#6B7280',
    border: '#E5E7EB',
  },

  // Semânticos
  semantic: {
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#3B82F6',
  }
};
```

### Tipografia
```typescript
const TYPOGRAPHY = {
  fontFamily: {
    regular: 'Inter_400Regular',
    medium: 'Inter_500Medium',
    semibold: 'Inter_600SemiBold',
    bold: 'Inter_700Bold',
  },
  sizes: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
  }
};
```

### Componentes Base

#### 1. ActionButton (Botão Principal)
```tsx
// Botão com feedback háptico, ripple effect e loading state
<ActionButton
  label="Registrar Visitante"
  icon={<UserPlus size={20} />}
  variant="primary" // primary | secondary | outline | ghost
  size="lg" // sm | md | lg
  loading={false}
  haptic="medium" // light | medium | heavy
  onPress={() => {}}
/>
```

#### 2. QuickAccessCard (Acesso Rápido)
```tsx
// Card com ícone, label e badge opcional
<QuickAccessCard
  icon={<Bell size={24} />}
  label="Avisos"
  badge={3}
  color={THEME.sindico.primary}
  onPress={() => navigation.navigate('Avisos')}
/>
```

#### 3. StatCard (Métricas)
```tsx
// Card de estatística com trend indicator
<StatCard
  title="Inadimplência"
  value="R$ 2.450,00"
  trend="+12%"
  trendType="negative"
  icon={<TrendingUp size={20} />}
/>
```

#### 4. BottomSheet (Modal de Ações)
```tsx
// Bottom sheet com gestos
<BottomSheet
  snapPoints={['25%', '50%', '90%']}
  enablePanDownToClose
>
  <View>...</View>
</BottomSheet>
```

---

## 👤 PERFIS E FUNCIONALIDADES

### 🟢 SÍNDICO (Cor: Emerald #059669)

#### Dashboard Principal
```
┌────────────────────────────────────────┐
│  🏢 Cond. Villa Flora         [foto]   │
│  Olá, João! Síndico                    │
├────────────────────────────────────────┤
│                                        │
│  ┌──────────┐  ┌──────────┐           │
│  │ R$ 45.2k │  │ R$ 2.4k  │           │
│  │ Receitas │  │ Inadimp. │           │
│  │   +8%    │  │   -3%    │           │
│  └──────────┘  └──────────┘           │
│                                        │
│  ─── Acesso Rápido ───                │
│                                        │
│  ┌────┐ ┌────┐ ┌────┐ ┌────┐         │
│  │ 💰 │ │ 👥 │ │ 📢 │ │ 📊 │         │
│  │Fin.│ │Mor.│ │Avis│ │Rel.│         │
│  └────┘ └────┘ └────┘ └────┘         │
│                                        │
│  ─── Atividade Recente ───            │
│                                        │
│  • Pgto confirmado - Apto 101         │
│  • Nova ocorrência - Apto 305         │
│  • Reserva aprovada - Salão           │
│                                        │
└────────────────────────────────────────┘
│   🏠    💰    ➕    📢    👤          │
└────────────────────────────────────────┘
```

#### Módulos do Síndico
1. **Financeiro** (💰)
   - Visão geral de receitas/despesas
   - Gráfico de fluxo de caixa
   - Lançamentos com filtro por período
   - Categorização automática

2. **Cobranças** (📄)
   - Lista de cobranças com status (ativo/pago/vencido)
   - Gerar nova cobrança
   - Enviar lembrete (push notification)
   - Visualizar comprovantes

3. **Moradores** (👥)
   - Lista com busca e filtro
   - Card com foto, nome, unidade
   - Contato rápido (WhatsApp, telefone)
   - Status de inadimplência

4. **Avisos** (📢)
   - Feed de avisos
   - Criar novo aviso (texto, foto, documento)
   - Push para todos os moradores
   - Confirmação de leitura

5. **Ocorrências** (⚠️)
   - Lista com prioridade (alta/média/baixa)
   - Atualizar status (aberto/em andamento/resolvido)
   - Adicionar comentário
   - Anexar fotos

6. **Reservas** (📅)
   - Calendário visual
   - Aprovar/rejeitar reservas
   - Histórico de reservas

7. **Relatórios** (📊)
   - Gerar PDF de prestação de contas
   - Compartilhar via WhatsApp/email
   - Relatório de inadimplência

---

### 🔵 MORADOR (Cor: Blue #2563EB)

#### Dashboard Principal
```
┌────────────────────────────────────────┐
│  🏠 Apto 101 - Torre A        [foto]   │
│  Olá, Maria!                           │
├────────────────────────────────────────┤
│                                        │
│  ┌────────────────────────────────┐   │
│  │ ⚠️ Você tem 1 cobrança pendente│   │
│  │    Condomínio - Dez/2025       │   │
│  │    R$ 450,00 - Vence 10/12     │   │
│  │            [PAGAR AGORA]       │   │
│  └────────────────────────────────┘   │
│                                        │
│  ─── Acesso Rápido ───                │
│                                        │
│  ┌────┐ ┌────┐ ┌────┐ ┌────┐         │
│  │ 📄 │ │ 📢 │ │ 📅 │ │ 📦 │         │
│  │Cobr│ │Avis│ │Res.│ │Enc.│         │
│  └────┘ └────┘ └────┘ └────┘         │
│                                        │
│  ─── Últimos Avisos ───               │
│                                        │
│  📌 Manutenção elevador - 15/12       │
│  📌 Assembleia Ordinária - 20/12      │
│                                        │
└────────────────────────────────────────┘
│   🏠    📄    ⚠️    📢    👤          │
└────────────────────────────────────────┘
```

#### Módulos do Morador
1. **Minhas Cobranças** (📄)
   - Lista de cobranças
   - Status visual (verde=pago, vermelho=vencido)
   - Botão "Pagar" (abre link Mercado Pago)
   - Histórico de pagamentos

2. **Avisos** (📢)
   - Feed de avisos do condomínio
   - Marcar como lido
   - Salvar importante

3. **Reservas** (📅)
   - Calendário de disponibilidade
   - Solicitar reserva
   - Minhas reservas pendentes/aprovadas

4. **Encomendas** (📦)
   - Notificação: "Sua encomenda chegou!"
   - Histórico de encomendas
   - Foto da encomenda

5. **Ocorrências** (⚠️)
   - Abrir nova ocorrência
   - Adicionar fotos
   - Acompanhar status
   - Receber notificação quando resolvida

6. **Documentos** (📁)
   - Atas de assembleia
   - Regulamento interno
   - Convenção

---

### 🟠 PORTEIRO (Cor: Amber #D97706)

#### Dashboard Principal (Modo Turbo)
```
┌────────────────────────────────────────┐
│  🛡️ PORTARIA - Villa Flora            │
│  João Silva | 17/12/2025 08:30        │
├────────────────────────────────────────┤
│                                        │
│  ┌────────────────────────────────┐   │
│  │                                │   │
│  │     [REGISTRAR VISITANTE]      │   │
│  │           ➕ grande             │   │
│  │                                │   │
│  └────────────────────────────────┘   │
│                                        │
│  ┌──────────┐  ┌──────────┐           │
│  │ 📦       │  │ 📷       │           │
│  │ Encomen- │  │ Câmeras  │           │
│  │ das      │  │          │           │
│  └──────────┘  └──────────┘           │
│                                        │
│  ─── Visitantes Ativos (3) ───        │
│                                        │
│  [foto] Carlos Silva - Apto 101       │
│         Entrada: 08:15 | Manutenção   │
│                        [DAR SAÍDA]    │
│                                        │
│  [foto] Ana Costa - Apto 305          │
│         Entrada: 08:22 | Visita       │
│                        [DAR SAÍDA]    │
│                                        │
└────────────────────────────────────────┘
│   🏠    📋    ➕    📦    👤          │
└────────────────────────────────────────┘
```

#### Módulos do Porteiro
1. **Registrar Visitante** (➕)
   - Formulário rápido:
     - Nome (obrigatório)
     - Documento (CPF/RG)
     - Placa do veículo (opcional)
     - Destino (unidade)
     - Tipo (visitante/prestador/entrega)
   - Captura de foto via câmera
   - Botão grande e acessível

2. **Visitantes Ativos** (📋)
   - Lista de quem está no condomínio
   - Swipe para dar saída
   - Busca por nome/documento/placa

3. **Histórico** (📜)
   - Registros anteriores
   - Filtro por data/tipo
   - Exportar relatório

4. **Encomendas** (📦)
   - Registrar chegada
   - Foto da encomenda
   - Selecionar unidade
   - Notificar morador
   - Confirmar retirada

5. **Câmeras** (📷)
   - Stream ao vivo (HLS/RTSP)
   - Capturar snapshot
   - Expandir em tela cheia

6. **Ocorrências Rápidas** (⚠️)
   - Registrar ocorrência de portaria
   - Templates pré-definidos:
     - "Barulho excessivo"
     - "Veículo mal estacionado"
     - "Problema na portaria"

---

## 🔔 NOTIFICAÇÕES PUSH

### Tipos de Notificação

```typescript
enum NotificationType {
  // Financeiro
  COBRANCA_GERADA = 'cobranca_gerada',
  COBRANCA_VENCENDO = 'cobranca_vencendo',
  PAGAMENTO_CONFIRMADO = 'pagamento_confirmado',
  
  // Comunicação
  NOVO_AVISO = 'novo_aviso',
  AVISO_URGENTE = 'aviso_urgente',
  
  // Ocorrências
  OCORRENCIA_ATUALIZADA = 'ocorrencia_atualizada',
  OCORRENCIA_RESOLVIDA = 'ocorrencia_resolvida',
  
  // Reservas
  RESERVA_APROVADA = 'reserva_aprovada',
  RESERVA_REJEITADA = 'reserva_rejeitada',
  LEMBRETE_RESERVA = 'lembrete_reserva',
  
  // Portaria
  ENCOMENDA_CHEGOU = 'encomenda_chegou',
  VISITANTE_CHEGOU = 'visitante_chegou',
}
```

### Configuração de Notificações
```typescript
// Supabase Edge Function para enviar push
// Usar Firebase Cloud Messaging (FCM) para Android
// Usar Apple Push Notification Service (APNS) para iOS

interface PushPayload {
  to: string; // FCM token ou APNS token
  notification: {
    title: string;
    body: string;
    icon?: string;
  };
  data: {
    type: NotificationType;
    entityId: string;
    condoId: string;
  };
}
```

---

## 🔗 INTEGRAÇÕES

### 1. Supabase (Backend Principal)
```typescript
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
    },
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    },
  }
);
```

### 2. Mercado Pago (Pagamentos)
```typescript
// Abrir link de pagamento no browser
import * as WebBrowser from 'expo-web-browser';

const handlePayment = async (paymentUrl: string) => {
  await WebBrowser.openBrowserAsync(paymentUrl);
};
```

### 3. WhatsApp (Comunicação)
```typescript
import { Linking } from 'react-native';

const sendWhatsApp = (phone: string, message: string) => {
  const url = `whatsapp://send?phone=55${phone}&text=${encodeURIComponent(message)}`;
  Linking.openURL(url);
};
```

### 4. Biometria (Segurança)
```typescript
import * as LocalAuthentication from 'expo-local-authentication';

const authenticateWithBiometrics = async () => {
  const hasHardware = await LocalAuthentication.hasHardwareAsync();
  const isEnrolled = await LocalAuthentication.isEnrolledAsync();
  
  if (hasHardware && isEnrolled) {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Acesse com sua digital',
      fallbackLabel: 'Usar senha',
    });
    return result.success;
  }
  return false;
};
```

### 5. Câmera (Fotos)
```typescript
import * as ImagePicker from 'expo-image-picker';

const takePhoto = async () => {
  const result = await ImagePicker.launchCameraAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    quality: 0.8,
    base64: true,
  });
  
  if (!result.canceled) {
    return result.assets[0];
  }
};
```

---

## 📊 BANCO DE DADOS (TABELAS EXISTENTES)

### Principais Tabelas
```sql
-- Condomínios
condos (id, nome, endereco, cnpj, sindico_id, whatsapp_active, created_at)

-- Unidades
units (id, condo_id, numero, bloco, tipo, owner_resident_id)

-- Usuários
users (id, email, role, nome, telefone, condo_id, unit_id, profile_image)

-- Moradores
residents (id, condo_id, unit_id, nome, email, telefone, cpf, tipo)

-- Financeiro
financial_entries (id, condo_id, tipo, categoria, valor, descricao, data_vencimento, status)

-- Cobranças
-- (usar financial_entries com tipo='receita' e categoria='condominio')

-- Avisos
notices (id, condo_id, titulo, conteudo, tipo, created_by, created_at)

-- Ocorrências
occurrences (id, condo_id, unit_id, titulo, descricao, prioridade, status, created_by)

-- Visitantes
visitors (id, condo_id, nome, documento, tipo, unit_destino, entrada, saida, foto_url, porteiro_id)

-- Encomendas
deliveries (id, condo_id, unit_id, remetente, codigo_rastreio, foto_url, status, created_by)

-- Reservas
reservations (id, condo_id, unit_id, area_comum, data_reserva, status, valor)

-- Assinaturas
subscriptions (id, condo_id, plano_id, status, data_inicio, data_fim)

-- Planos
plans (id, nome, preco, max_unidades, features)
```

---

## 🔒 SEGURANÇA

### Requisitos
1. **Autenticação Biométrica**: Opcional no login
2. **Session Timeout**: 30 min de inatividade
3. **Token Refresh**: Automático via Supabase
4. **RLS**: Row Level Security ativo (backend)
5. **Sensitive Data**: Usar SecureStore para tokens
6. **Certificate Pinning**: Para produção

### Armazenamento Seguro
```typescript
import * as SecureStore from 'expo-secure-store';

// Salvar token
await SecureStore.setItemAsync('auth_token', token);

// Recuperar token
const token = await SecureStore.getItemAsync('auth_token');
```

---

## 🎬 ANIMAÇÕES E MICRO-INTERAÇÕES

### Princípios
1. **Duração**: 200-300ms (snappy, não slow)
2. **Easing**: `Easing.bezier(0.25, 0.1, 0.25, 1)` (ease-out)
3. **Feedback Háptico**: Em ações importantes
4. **Loading States**: Skeletons, não spinners

### Exemplos
```typescript
// Skeleton loading
<Skeleton width="100%" height={80} borderRadius={12} />

// Pull to refresh
<FlatList
  refreshControl={
    <RefreshControl
      refreshing={refreshing}
      onRefresh={onRefresh}
      colors={[THEME.primary]}
    />
  }
/>

// Swipe actions
<Swipeable
  renderRightActions={() => (
    <DeleteAction onPress={handleDelete} />
  )}
>
  <ListItem />
</Swipeable>
```

---

## 📱 TELAS OBRIGATÓRIAS

### Autenticação
1. ✅ Splash Screen (logo animado)
2. ✅ Login (email/senha + biometria)
3. ✅ Esqueci Senha
4. ✅ Primeiro Acesso (troca de senha obrigatória)

### Comum (Todos os Perfis)
5. ✅ Dashboard (customizado por perfil)
6. ✅ Perfil (foto, dados, configurações)
7. ✅ Notificações (lista de push recebidos)
8. ✅ Suporte (chat ou formulário)

### Síndico
9. ✅ Financeiro (resumo + lançamentos)
10. ✅ Cobranças (gerar, listar, lembrete)
11. ✅ Moradores (lista + detalhes)
12. ✅ Avisos (criar + listar)
13. ✅ Ocorrências (gerenciar)
14. ✅ Reservas (aprovar/rejeitar)
15. ✅ Relatórios (gerar PDF)

### Morador
16. ✅ Minhas Cobranças (pagar)
17. ✅ Avisos (visualizar)
18. ✅ Reservas (solicitar)
19. ✅ Encomendas (visualizar)
20. ✅ Ocorrências (abrir)

### Porteiro
21. ✅ Registrar Visitante (formulário + câmera)
22. ✅ Visitantes Ativos (dar saída)
23. ✅ Histórico
24. ✅ Encomendas (registrar + entregar)
25. ✅ Câmeras (visualizar)

---

## 🚀 TÉCNICAS INOVADORAS

### 1. Skeleton-First Loading
Nunca mostrar tela vazia ou spinner. Sempre skeletons que mimetizam o conteúdo.

### 2. Optimistic Updates
Atualizar UI imediatamente, reverter se API falhar.

```typescript
// Antes de chamar API
setVisitantes(prev => [...prev, novoVisitante]);

// Se falhar
try {
  await api.registrarVisitante(novoVisitante);
} catch {
  setVisitantes(prev => prev.filter(v => v.id !== novoVisitante.id));
  Toast.show({ type: 'error', text1: 'Falha ao registrar' });
}
```

### 3. Offline-First Architecture
```typescript
// Usar react-query com persistência
import { QueryClient } from '@tanstack/react-query';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: 1000 * 60 * 60 * 24, // 24 horas
      staleTime: 1000 * 60 * 5, // 5 minutos
    },
  },
});

const persister = createAsyncStoragePersister({
  storage: AsyncStorage,
});
```

### 4. Gesture-Based Navigation
- Swipe left: Excluir/Arquivar
- Swipe right: Ação primária (marcar pago, dar saída)
- Long press: Opções contextuais
- Pull down: Refresh

### 5. Contextual Actions
Botões diferentes baseados no contexto atual.

### 6. Smart Prefetching
Pré-carregar telas prováveis.

```typescript
// Ao entrar no Dashboard, pré-carregar módulos comuns
useEffect(() => {
  queryClient.prefetchQuery(['financeiro', condoId]);
  queryClient.prefetchQuery(['avisos', condoId]);
}, []);
```

### 7. Real-time Sync
```typescript
// Supabase Realtime para sincronização
useEffect(() => {
  const channel = supabase
    .channel('visitors')
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'visitors',
      filter: `condo_id=eq.${condoId}`,
    }, (payload) => {
      // Atualizar lista em tempo real
      queryClient.invalidateQueries(['visitors', condoId]);
    })
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, [condoId]);
```

### 8. Haptic Feedback
```typescript
import * as Haptics from 'expo-haptics';

// Em ações importantes
Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

// Em erros
Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);

// Em sucesso
Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
```

---

## 📋 CHECKLIST DE ENTREGA

### MVP (Versão 1.0)
- [ ] Autenticação completa (login, logout, biometria)
- [ ] Dashboard por perfil
- [ ] Push notifications configuradas
- [ ] Todas as telas listadas funcionando
- [ ] Tema claro e escuro
- [ ] Loading states em todas as telas
- [ ] Error handling global
- [ ] Pull to refresh
- [ ] Offline detection

### Pós-MVP
- [ ] Widget para iOS/Android
- [ ] Apple Watch companion
- [ ] Siri/Google Assistant shortcuts
- [ ] Deep linking
- [ ] App Clips (iOS) / Instant Apps (Android)

---

## 🔧 VARIÁVEIS DE AMBIENTE

```
EXPO_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1...
EXPO_PUBLIC_APP_NAME=Meu Condomínio Fácil
EXPO_PUBLIC_APP_VERSION=1.0.0
```

---

## 📞 CONTATO

**Empresa**: Meu Condomínio Fácil  
**CNPJ**: 57.444.727/0001-85  
**Email**: contato@meucondominiofacil.com  
**WhatsApp**: (21) 96553-2247  

---

> **IMPORTANTE**: Este app é uma EXTENSÃO do sistema web. Qualquer alteração no banco de dados via web ou app deve refletir imediatamente em ambos. Use Supabase Realtime para sincronização.

---

**Versão do Prompt**: 1.0  
**Data**: 17/12/2025
