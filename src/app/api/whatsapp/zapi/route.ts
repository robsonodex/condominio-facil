import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getEvolutionProvider } from '@/lib/whatsapp/providers/evolution';
import { ZApiWhatsAppProvider } from '@/lib/whatsapp/providers/zapi';
import { upsertCondoIntegration } from '@/lib/integrations';

/**
 * API para gerenciar conexão real-time com Z-API
 */
export async function GET(req: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

        const { searchParams } = new URL(req.url);
        const action = searchParams.get('action');
        const condoId = searchParams.get('condoId');

        if (!condoId || !action) {
            return NextResponse.json({ error: 'Parâmetros ausentes' }, { status: 400 });
        }

        const zapi = new ZApiWhatsAppProvider();

        if (action === 'status') {
            const status = await zapi.checkConnection(condoId);
            return NextResponse.json(status);
        }

        if (action === 'qrcode') {
            const qr = await zapi.generateQRCode(condoId);
            return NextResponse.json(qr);
        }

        return NextResponse.json({ error: 'Ação inválida' }, { status: 400 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

        const body = await req.json();
        const { condoId, instance_id, token, client_token } = body;

        if (!condoId || !instance_id || !token) {
            return NextResponse.json({ error: 'Dados incompletos' }, { status: 400 });
        }

        // Salvar integração no banco
        const integration = await upsertCondoIntegration(
            condoId,
            'whatsapp',
            'z-api',
            { instance_id, token, client_token },
            { provider_displayName: 'Z-API' },
            user.id
        );

        if (!integration) throw new Error('Falha ao salvar integração');

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
