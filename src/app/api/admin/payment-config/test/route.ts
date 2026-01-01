import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { MercadoPagoService } from '@/lib/payments/mercadopago';

export async function POST(request: NextRequest) {
    const supabase = await createClient();
    const { condoId, provider, credentials } = await request.json();

    if (provider === 'mercadopago') {
        const service = new MercadoPagoService(credentials, condoId);
        const ok = await service.testConnection();

        if (ok) {
            return NextResponse.json({ success: true, message: 'Conexão com Mercado Pago validada!' });
        } else {
            return NextResponse.json({ success: false, error: 'Credenciais inválidas ou erro de conexão' }, { status: 400 });
        }
    }

    return NextResponse.json({ error: 'Provider não suportado para teste automático' }, { status: 400 });
}
