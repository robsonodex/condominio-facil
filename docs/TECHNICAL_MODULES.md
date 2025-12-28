# Materiais Técnicos - Condomínio Fácil

## 1. MÓDULO DE RESERVAS DE ÁREAS COMUNS

### 1.1 Schema PostgreSQL

```sql
-- Áreas Comuns
CREATE TABLE common_areas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    condo_id UUID NOT NULL REFERENCES condos(id) ON DELETE CASCADE,
    nome VARCHAR(100) NOT NULL,
    descricao TEXT,
    capacidade INTEGER DEFAULT 10,
    horario_abertura TIME DEFAULT '08:00',
    horario_fechamento TIME DEFAULT '22:00',
    intervalo_minutos INTEGER DEFAULT 60,
    antecedencia_maxima_dias INTEGER DEFAULT 30,
    antecedencia_minima_horas INTEGER DEFAULT 2,
    requer_aprovacao BOOLEAN DEFAULT false,
    valor_hora DECIMAL(10,2) DEFAULT 0,
    ativo BOOLEAN DEFAULT true,
    foto_url TEXT,
    regras TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reservas com EXCLUDE para evitar sobreposição
CREATE TABLE common_area_reservations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    area_id UUID NOT NULL REFERENCES common_areas(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id),
    unidade_id UUID REFERENCES units(id),
    data DATE NOT NULL,
    horario_inicio TIME NOT NULL,
    horario_fim TIME NOT NULL,
    status VARCHAR(20) DEFAULT 'pendente' 
        CHECK (status IN ('pendente','aprovado','recusado','cancelado')),
    motivo_recusa TEXT,
    observacoes TEXT,
    valor_total DECIMAL(10,2) DEFAULT 0,
    aprovado_por UUID REFERENCES users(id),
    aprovado_em TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Extensão para GIST (rodar primeiro)
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- Constraint para evitar sobreposições
ALTER TABLE common_area_reservations ADD CONSTRAINT no_overlap 
    EXCLUDE USING GIST (
        area_id WITH =,
        tsrange(data + horario_inicio, data + horario_fim) WITH &&
    ) WHERE (status IN ('pendente','aprovado'));

CREATE INDEX idx_reservations_area ON common_area_reservations(area_id);
CREATE INDEX idx_reservations_date ON common_area_reservations(data);
```

### 1.2 RLS Policies

```sql
ALTER TABLE common_areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE common_area_reservations ENABLE ROW LEVEL SECURITY;

-- Áreas: todos do condomínio podem ver
CREATE POLICY "areas_view" ON common_areas FOR SELECT USING (
    condo_id IN (SELECT condo_id FROM users WHERE id = auth.uid())
);

-- Áreas: síndico gerencia
CREATE POLICY "areas_manage" ON common_areas FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() 
            AND role IN ('sindico','superadmin') 
            AND condo_id = common_areas.condo_id)
);

-- Reservas: usuário vê as próprias + síndico vê todas
CREATE POLICY "reservations_view" ON common_area_reservations FOR SELECT USING (
    user_id = auth.uid() OR
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('sindico','superadmin'))
);

-- Reservas: morador pode criar
CREATE POLICY "reservations_create" ON common_area_reservations 
FOR INSERT WITH CHECK (user_id = auth.uid());

-- Reservas: dono pode cancelar, síndico pode aprovar/recusar
CREATE POLICY "reservations_update" ON common_area_reservations FOR UPDATE USING (
    user_id = auth.uid() OR
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('sindico','superadmin'))
);
```

### 1.3 API Next.js - Reservations

```typescript
// src/app/api/reservations/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, getSessionFromReq } from '@/lib/supabase/admin';

export async function GET(req: NextRequest) {
    const session = await getSessionFromReq(req);
    if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const areaId = searchParams.get('area_id');
    const startDate = searchParams.get('start');
    const endDate = searchParams.get('end');

    let query = supabaseAdmin
        .from('common_area_reservations')
        .select('*, area:common_areas(nome), user:users(nome)')
        .gte('data', startDate || new Date().toISOString().split('T')[0])
        .lte('data', endDate || new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0]);

    if (areaId) query = query.eq('area_id', areaId);

    const { data, error } = await query.order('data').order('horario_inicio');
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
    const session = await getSessionFromReq(req);
    if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const body = await req.json();
    const { area_id, data, horario_inicio, horario_fim, observacoes } = body;

    // Buscar área
    const { data: area } = await supabaseAdmin
        .from('common_areas')
        .select('requer_aprovacao, valor_hora')
        .eq('id', area_id)
        .single();

    const { data: reservation, error } = await supabaseAdmin
        .from('common_area_reservations')
        .insert({
            area_id, user_id: session.userId, data,
            horario_inicio, horario_fim, observacoes,
            status: area?.requer_aprovacao ? 'pendente' : 'aprovado'
        })
        .select().single();

    if (error) {
        if (error.code === '23P01') {
            return NextResponse.json({ error: 'Horário já reservado' }, { status: 400 });
        }
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json(reservation);
}
```

### 1.4 Repositórios GitHub

- **cal.com** - https://github.com/calcom/cal.com
- **FullCalendar** - https://github.com/fullcalendar/fullcalendar
- **react-big-calendar** - https://github.com/jquense/react-big-calendar

---

## 2. APP MOBILE (EXPO + REACT NATIVE)

### 2.1 Setup

```bash
npx create-expo-app@latest condominio-app --template expo-template-blank-typescript
cd condominio-app
npx expo install @supabase/supabase-js @react-native-async-storage/async-storage
npx expo install expo-router expo-notifications expo-image-picker
npx expo install react-native-paper react-native-safe-area-context
```

### 2.2 Supabase Client

```typescript
// lib/supabase.ts
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const supabase = createClient(
    process.env.EXPO_PUBLIC_SUPABASE_URL!,
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
    {
        auth: {
            storage: AsyncStorage,
            autoRefreshToken: true,
            persistSession: true,
            detectSessionInUrl: false,
        }
    }
);
```

### 2.3 Push Notifications

```typescript
// lib/notifications.ts
import * as Notifications from 'expo-notifications';
import { supabase } from './supabase';

export async function registerPushToken(userId: string) {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') return;

    const token = await Notifications.getExpoPushTokenAsync();
    await supabase.from('push_tokens').upsert({ user_id: userId, token: token.data });
}
```

### 2.4 Repositórios Similares

- **Supabase React Native** - https://github.com/supabase/supabase/tree/master/examples/auth/react-native-user-management
- **Expo Examples** - https://github.com/expo/examples

---

## 3. INTEGRAÇÃO CFTV (RTSP → HLS)

### 3.1 Docker Compose

```yaml
version: '3.8'
services:
  rtsp-hls:
    image: bluenviron/mediamtx:latest
    ports:
      - "8554:8554"  # RTSP
      - "8888:8888"  # HLS
    environment:
      - MTX_PROTOCOLS=tcp
    volumes:
      - ./mediamtx.yml:/mediamtx.yml
```

### 3.2 mediamtx.yml

```yaml
paths:
  camera1:
    source: rtsp://admin:pass@192.168.1.100:554/h264/ch1/main/av_stream
  camera2:
    source: rtsp://admin:pass@192.168.1.101:554/Streaming/Channels/101
```

### 3.3 Player HLS (Next.js)

```tsx
'use client';
import { useEffect, useRef } from 'react';
import Hls from 'hls.js';

export function CameraPlayer({ src }: { src: string }) {
    const videoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        if (Hls.isSupported()) {
            const hls = new Hls();
            hls.loadSource(src);
            hls.attachMedia(video);
            return () => hls.destroy();
        }
    }, [src]);

    return <video ref={videoRef} autoPlay muted playsInline className="w-full rounded-lg" />;
}
```

### 3.4 Repositórios

- **MediaMTX** - https://github.com/bluenviron/mediamtx
- **HLS.js** - https://github.com/video-dev/hls.js
- **SRS** - https://github.com/ossrs/srs

---

## 4. QR CODE PASS (CONVITES DIGITAIS)

### 4.1 Schema PostgreSQL

```sql
CREATE TABLE guest_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  condo_id UUID NOT NULL REFERENCES condos(id) ON DELETE CASCADE,
  unit_id UUID NOT NULL REFERENCES units(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  guest_name TEXT NOT NULL,
  valid_from TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  valid_until TIMESTAMPTZ NOT NULL,
  token_hash TEXT NOT NULL UNIQUE,
  status VARCHAR(20) DEFAULT 'pendente',
  used_at TIMESTAMPTZ,
  validated_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 4.2 Segurança (JWT + SHA-256)

1. **Geração**: O sistema gera um JWT contendo `inviteId` e `condoId`, assinado com `JWT_INVITE_SECRET`.
2. **Armazenamento**: O hash SHA-256 do token é armazenado no banco (`token_hash`).
3. **Validação**: 
   - Decodifica o JWT.
   - Gera o hash do token recebido e compara com o banco.
   - Verifica data de expiração e se o convite já foi utilizado.

---

## 5. AUDITOR DE ORÇAMENTOS IA (OCR + BENCHMARK)

### 5.1 Fluxo de Funcionamento

1. **Extração**: O documento (PDF/Imagem) é enviado ao GPT-4o para extração estruturada de itens e valores.
2. **Embeddings**: As descrições dos serviços são convertidas em vetores via `text-embedding-3-small`.
3. **Busca Semântica**: Realiza uma busca no banco `price_benchmarks` usando distância de cosseno.
4. **Benchmark**: Compara o valor do orçamento com a média (`avg_price_rj`) e limites (min/max) do Rio de Janeiro.

### 5.2 Schema PostgreSQL (pgvector)

```sql
CREATE TABLE price_benchmarks (
  id uuid primary key default gen_random_uuid(),
  category varchar(50) not null,
  service_description text not null,
  embedding vector(1536),
  avg_price_rj decimal(10,2) not null,
  unit varchar(20) not null,
  source varchar(100),
  updated_at timestamptz default now()
);
```
