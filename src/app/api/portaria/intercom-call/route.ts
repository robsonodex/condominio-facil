import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Intercom Call API
 * Gerencia chamadas entre dispositivos ou entre visitante e unidade
 */
export async function POST(request: NextRequest) {
    const supabase = await createClient();
    const { condoId, fromDeviceId, toUnitId, type } = await request.json();

    if (!condoId || !fromDeviceId || !toUnitId) {
        return NextResponse.json({ error: 'Dados incompletos' }, { status: 400 });
    }

    try {
        // 1. Criar registro da chamada
        const { data: call, error } = await supabase
            .from('intercom_calls')
            .insert({
                condo_id: condoId,
                unit_id: toUnitId,
                device_id: fromDeviceId,
                direction: 'inbound',
                status: 'pending'
            })
            .select()
            .single();

        if (error) throw error;

        // 2. Em um cenário real, dispararíamos um WebRTC signaling ou Notificação Push
        // para o morador da unidade 'toUnitId'

        return NextResponse.json({
            success: true,
            callId: call.id,
            message: 'Chamada iniciada...'
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PATCH(request: NextRequest) {
    const supabase = await createClient();
    const { callId, status, duration } = await request.json();

    const { error } = await supabase
        .from('intercom_calls')
        .update({
            status,
            duration_seconds: duration,
            updated_at: new Date().toISOString()
        })
        .eq('id', callId);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
}
