import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getWhatsAppProvider, Templates } from '@/lib/whatsapp';

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

        if (!profile || !['sindico', 'superadmin', 'porteiro'].includes(profile.role)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { phone, type, data: templateData } = body;
        const condoId = profile.condo_id;

        if (!phone) {
            return NextResponse.json({ error: 'Phone number required' }, { status: 400 });
        }

        if (!condoId) {
            return NextResponse.json({ error: 'Condo ID required for WhatsApp integration' }, { status: 400 });
        }

        // Clean phone number
        const cleanPhone = phone.replace(/\D/g, '');
        if (cleanPhone.length < 10) {
            return NextResponse.json({ error: 'Invalid phone number' }, { status: 400 });
        }

        // Get the appropriate provider for this condo
        const provider = await getWhatsAppProvider(condoId);
        let result;

        switch (type) {
            case 'cobranca_gerada':
                result = await provider.sendTemplate({
                    to: cleanPhone,
                    templateName: Templates.COBRANCA_GERADA,
                    variables: [templateData.valor || '0,00', templateData.link || '#'],
                    condoId
                });
                break;

            case 'boleto_disponivel':
                result = await provider.sendTemplate({
                    to: cleanPhone,
                    templateName: Templates.BOLETO_DISPONIVEL,
                    variables: [templateData.valor || '0,00', templateData.vencimento || '', templateData.link || '#'],
                    condoId
                });
                break;

            case 'pagamento_confirmado':
                result = await provider.sendTemplate({
                    to: cleanPhone,
                    templateName: Templates.PAGAMENTO_CONFIRMADO,
                    variables: [templateData.valor || '0,00', templateData.data || new Date().toLocaleDateString('pt-BR')],
                    condoId
                });
                break;

            case 'mensagem_livre':
                result = await provider.sendMessage({
                    to: cleanPhone,
                    message: templateData.message || 'Mensagem do condomínio',
                    condoId
                });
                break;

            default:
                return NextResponse.json({ error: 'Invalid notification type' }, { status: 400 });
        }

        // Log notification
        await supabase.from('system_logs').insert([{
            level: 'info',
            source: 'whatsapp_notification',
            message: `Sent ${type} to ${cleanPhone} via ${result.provider}`,
            metadata: { result, type, condoId },
        }]);

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
