import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// WhatsApp Templates
const Templates = {
    COBRANCA_GERADA: 'cobranca_gerada',
    BOLETO_DISPONIVEL: 'boleto_disponivel',
    PAGAMENTO_CONFIRMADO: 'pagamento_confirmado',
    LEMBRETE_VENCIMENTO: 'lembrete_vencimento',
};

// Send WhatsApp message via Meta Cloud API
async function sendMetaWhatsApp(to: string, message: string, templateName?: string, variables?: string[]) {
    const accessToken = process.env.WHATSAPP_TOKEN;
    const phoneNumberId = process.env.WHATSAPP_PHONE_ID;

    if (!accessToken || !phoneNumberId) {
        console.log('[WhatsApp] Credentials not configured - would send:', { to, message, templateName });
        return {
            success: true,
            messageId: `mock_${Date.now()}`,
            provider: 'mock',
            note: 'WhatsApp not configured - message logged only'
        };
    }

    try {
        const url = `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`;

        let body: any = {
            messaging_product: 'whatsapp',
            to: to,
        };

        if (templateName && variables) {
            body.type = 'template';
            body.template = {
                name: templateName,
                language: { code: 'pt_BR' },
                components: [{
                    type: 'body',
                    parameters: variables.map(v => ({ type: 'text', text: v })),
                }],
            };
        } else {
            body.type = 'text';
            body.text = { body: message };
        }

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        });

        const data = await response.json();

        if (!response.ok) {
            console.error('[WhatsApp] Error:', data);
            return { success: false, error: data.error?.message || 'Unknown error', provider: 'meta' };
        }

        return { success: true, messageId: data.messages?.[0]?.id, provider: 'meta' };
    } catch (error: any) {
        console.error('[WhatsApp] Exception:', error);
        return { success: false, error: error.message, provider: 'meta' };
    }
}

export async function POST(req: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { data: profile } = await supabase
            .from('users')
            .select('role, condo_id')
            .eq('id', user.id)
            .single();

        if (!profile || !['sindico', 'superadmin'].includes(profile.role)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { phone, type, data: templateData } = body;

        if (!phone) {
            return NextResponse.json({ error: 'Phone number required' }, { status: 400 });
        }

        // Clean phone number
        const cleanPhone = phone.replace(/\D/g, '');
        if (cleanPhone.length < 10) {
            return NextResponse.json({ error: 'Invalid phone number' }, { status: 400 });
        }

        let result;

        switch (type) {
            case 'cobranca_gerada':
                result = await sendMetaWhatsApp(
                    cleanPhone,
                    `Nova cobrança: R$ ${templateData.valor}. Pague em: ${templateData.link}`,
                    Templates.COBRANCA_GERADA,
                    [templateData.valor || '0,00', templateData.link || '#']
                );
                break;

            case 'boleto_disponivel':
                result = await sendMetaWhatsApp(
                    cleanPhone,
                    `Boleto disponível: R$ ${templateData.valor}, vencimento ${templateData.vencimento}. Link: ${templateData.link}`,
                    Templates.BOLETO_DISPONIVEL,
                    [templateData.valor || '0,00', templateData.vencimento || '', templateData.link || '#']
                );
                break;

            case 'pagamento_confirmado':
                result = await sendMetaWhatsApp(
                    cleanPhone,
                    `Pagamento confirmado: R$ ${templateData.valor} em ${templateData.data}`,
                    Templates.PAGAMENTO_CONFIRMADO,
                    [templateData.valor || '0,00', templateData.data || new Date().toLocaleDateString('pt-BR')]
                );
                break;

            case 'mensagem_livre':
                result = await sendMetaWhatsApp(
                    cleanPhone,
                    templateData.message || 'Mensagem do condomínio'
                );
                break;

            default:
                return NextResponse.json({ error: 'Invalid notification type' }, { status: 400 });
        }

        // Log notification
        await supabase.from('system_logs').insert([{
            level: 'info',
            source: 'whatsapp_notification',
            message: `Sent ${type} to ${cleanPhone}`,
            metadata: { result, type },
        }]);
        // Logging errors are ignored

        if (!result.success) {
            return NextResponse.json({
                error: result.error || 'Failed to send message',
                provider: result.provider
            }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            messageId: result.messageId,
            provider: result.provider,
        });

    } catch (error: any) {
        console.error('[WhatsApp Send] Error:', error);
        return NextResponse.json({
            error: 'Internal server error',
            message: error.message
        }, { status: 500 });
    }
}
