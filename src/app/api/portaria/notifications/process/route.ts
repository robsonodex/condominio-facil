import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

// Worker para processar e enviar notificações pendentes
// Este endpoint deve ser chamado via cron job ou webhook

export async function POST(request: NextRequest) {
    try {
        // Verificar autorização (API key ou service role)
        const authHeader = request.headers.get('authorization');
        const apiKey = request.headers.get('x-api-key');

        // Em produção, validar API key do cron job
        // if (apiKey !== process.env.CRON_API_KEY) {
        //     return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        // }

        // Buscar notificações pendentes
        const { data: notifications, error } = await supabaseAdmin
            .from('delivery_notifications')
            .select(`
                *,
                delivery:deliveries(
                    id,
                    condo_id,
                    unit_id,
                    delivered_by,
                    tracking_code,
                    type,
                    notes,
                    photo_url,
                    confirmation_token,
                    unit:units(numero, bloco),
                    condo:condos(nome)
                )
            `)
            .eq('status', 'pending')
            .lte('scheduled_at', new Date().toISOString())
            .lt('attempts', 3)
            .order('scheduled_at')
            .limit(50);

        if (error) throw error;

        const results = {
            processed: 0,
            sent: 0,
            failed: 0,
            errors: [] as string[]
        };

        for (const notification of notifications || []) {
            try {
                // Incrementar tentativas
                await supabaseAdmin
                    .from('delivery_notifications')
                    .update({ attempts: notification.attempts + 1 })
                    .eq('id', notification.id);

                let success = false;

                if (notification.channel === 'whatsapp') {
                    success = await sendWhatsApp(notification);
                } else if (notification.channel === 'email') {
                    success = await sendEmail(notification);
                }

                if (success) {
                    await supabaseAdmin
                        .from('delivery_notifications')
                        .update({
                            status: 'sent',
                            sent_at: new Date().toISOString()
                        })
                        .eq('id', notification.id);

                    results.sent++;
                } else {
                    throw new Error('Falha no envio');
                }

                results.processed++;

            } catch (err: any) {
                results.failed++;
                results.errors.push(`${notification.id}: ${err.message}`);

                // Marcar como falha se atingiu max tentativas
                if (notification.attempts + 1 >= 3) {
                    await supabaseAdmin
                        .from('delivery_notifications')
                        .update({
                            status: 'failed',
                            last_error: err.message
                        })
                        .eq('id', notification.id);
                } else {
                    await supabaseAdmin
                        .from('delivery_notifications')
                        .update({
                            last_error: err.message,
                            scheduled_at: new Date(Date.now() + 5 * 60 * 1000).toISOString() // +5 min
                        })
                        .eq('id', notification.id);
                }
            }
        }

        return NextResponse.json({
            success: true,
            results
        });

    } catch (error: any) {
        console.error('Error processing notifications:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// Função para enviar WhatsApp
async function sendWhatsApp(notification: any): Promise<boolean> {
    const delivery = notification.delivery;
    const unitLabel = delivery.unit ?
        `${delivery.unit.bloco || ''} ${delivery.unit.numero}`.trim() :
        'Unidade';

    const message = `
🏢 *Condomínio Fácil*

📦 Você recebeu uma entrega!

📍 *Unidade:* ${unitLabel}
🚚 *Transportadora:* ${delivery.delivered_by || 'Não informada'}
📋 *Código:* ${delivery.tracking_code || 'N/A'}
📝 *Tipo:* ${delivery.type || 'Pacote'}
${delivery.notes ? `💬 *Obs:* ${delivery.notes}` : ''}

✅ Confirme a retirada:
${process.env.NEXT_PUBLIC_APP_URL || 'https://app.condofacil.com'}/deliveries/${delivery.id}/confirm?token=${delivery.confirmation_token}

_Retire na portaria em até 7 dias._
    `.trim();

    // Em produção, integrar com WhatsApp Business API
    // Exemplo com Twilio, MessageBird, Zenvia, etc.

    if (process.env.WHATSAPP_API_URL && process.env.WHATSAPP_API_KEY) {
        const response = await fetch(process.env.WHATSAPP_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.WHATSAPP_API_KEY}`
            },
            body: JSON.stringify({
                to: notification.to_address,
                message
            })
        });

        return response.ok;
    }

    // Simular envio em desenvolvimento
    console.log(`[WhatsApp] Enviando para ${notification.to_address}:`, message);
    return true;
}

// Função para enviar Email
async function sendEmail(notification: any): Promise<boolean> {
    const delivery = notification.delivery;
    const unitLabel = delivery.unit ?
        `${delivery.unit.bloco || ''} ${delivery.unit.numero}`.trim() :
        'Unidade';

    const confirmUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://app.condofacil.com'}/deliveries/${delivery.id}/confirm?token=${delivery.confirmation_token}`;

    const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: Arial, sans-serif; background: #f4f4f4; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; overflow: hidden; }
        .header { background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 30px; text-align: center; }
        .header h1 { margin: 0; font-size: 24px; }
        .content { padding: 30px; }
        .info-box { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 20px; margin: 20px 0; }
        .info-row { display: flex; margin: 10px 0; }
        .info-label { font-weight: bold; width: 120px; color: #059669; }
        .btn { display: inline-block; background: #10b981; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
        .footer { background: #f4f4f4; padding: 20px; text-align: center; font-size: 12px; color: #666; }
        ${delivery.photo_url ? '.photo { max-width: 100%; border-radius: 8px; margin: 15px 0; }' : ''}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📦 Nova Entrega!</h1>
        </div>
        <div class="content">
            <p>Olá!</p>
            <p>Você recebeu uma entrega na portaria do condomínio.</p>
            
            <div class="info-box">
                <div class="info-row"><span class="info-label">📍 Unidade:</span> ${unitLabel}</div>
                <div class="info-row"><span class="info-label">🚚 Transporte:</span> ${delivery.delivered_by || 'Não informada'}</div>
                <div class="info-row"><span class="info-label">📋 Código:</span> ${delivery.tracking_code || 'N/A'}</div>
                <div class="info-row"><span class="info-label">📝 Tipo:</span> ${delivery.type || 'Pacote'}</div>
                ${delivery.notes ? `<div class="info-row"><span class="info-label">💬 Obs:</span> ${delivery.notes}</div>` : ''}
            </div>
            
            ${delivery.photo_url ? `<img src="${delivery.photo_url}" alt="Foto da entrega" class="photo">` : ''}
            
            <p style="text-align: center;">
                <a href="${confirmUrl}" class="btn">✅ Confirmar Retirada</a>
            </p>
            
            <p style="font-size: 14px; color: #666;">
                <strong>Importante:</strong> Retire sua entrega na portaria em até 7 dias.
            </p>
        </div>
        <div class="footer">
            <p>Este é um e-mail automático do Condomínio Fácil.</p>
            <p>Os dados de entrega são utilizados exclusivamente para controle interno.<br>
            Fotos e registros são armazenados por 24 horas (LGPD).</p>
        </div>
    </div>
</body>
</html>
    `.trim();

    // Em produção, integrar com SendGrid, Resend, Nodemailer, etc.

    if (process.env.SMTP_HOST || process.env.SENDGRID_API_KEY) {
        // Implementar envio real aqui
        // await sendEmailViaSMTP({ to: notification.to_address, subject, html });
    }

    // Simular envio em desenvolvimento
    console.log(`[Email] Enviando para ${notification.to_address}`);
    return true;
}
