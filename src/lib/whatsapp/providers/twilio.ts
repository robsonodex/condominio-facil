import { WhatsAppProvider, SendMessageParams, SendTemplateParams, WhatsAppResponse } from '../types';

/**
 * Twilio WhatsApp API Adapter
 * Docs: https://www.twilio.com/docs/whatsapp/api
 */
export class TwilioWhatsAppProvider implements WhatsAppProvider {
    private accountSid: string;
    private authToken: string;
    private fromNumber: string;

    constructor() {
        const sid = process.env.TWILIO_ACCOUNT_SID;
        const token = process.env.TWILIO_AUTH_TOKEN;
        const from = process.env.WHATSAPP_FROM; // Format: whatsapp:+14155238886

        if (!sid || !token || !from) {
            throw new Error('Twilio WhatsApp credentials not configured');
        }

        this.accountSid = sid;
        this.authToken = token;
        this.fromNumber = from;
    }

    async sendMessage({ to, message, mediaUrl }: SendMessageParams): Promise<WhatsAppResponse> {
        try {
            const url = `https://api.twilio.com/2010-04-01/Accounts/${this.accountSid}/Messages.json`;

            const formData = new URLSearchParams();
            formData.append('From', this.fromNumber);
            formData.append('To', `whatsapp:+${to}`);
            formData.append('Body', message);

            if (mediaUrl) {
                formData.append('MediaUrl', mediaUrl);
            }

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Authorization': `Basic ${Buffer.from(`${this.accountSid}:${this.authToken}`).toString('base64')}`,
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: formData,
            });

            const data = await response.json();

            if (!response.ok) {
                console.error('[Twilio WhatsApp] Error:', data);
                return {
                    success: false,
                    error: data.message || 'Unknown error',
                    provider: 'twilio',
                };
            }

            return {
                success: true,
                messageId: data.sid,
                provider: 'twilio',
            };
        } catch (error: any) {
            console.error('[Twilio WhatsApp] Exception:', error);
            return {
                success: false,
                error: error.message,
                provider: 'twilio',
            };
        }
    }

    async sendTemplate({ to, templateName, variables }: SendTemplateParams): Promise<WhatsAppResponse> {
        // Twilio uses ContentSID for approved templates
        // This is a simplified version - actual implementation needs ContentSID mapping
        const message = `Template: ${templateName}\nVariables: ${variables.join(', ')}`;
        return this.sendMessage({ to, message });
    }
}
