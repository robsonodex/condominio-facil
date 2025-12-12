import { WhatsAppProvider, SendMessageParams, SendTemplateParams, WhatsAppResponse } from '../types';

/**
 * Meta (Facebook) WhatsApp Cloud API Adapter
 * Docs: https://developers.facebook.com/docs/whatsapp/cloud-api
 */
export class MetaWhatsAppProvider implements WhatsAppProvider {
    private accessToken: string;
    private phoneNumberId: string;
    private apiVersion: string = 'v18.0';

    constructor() {
        const token = process.env.WHATSAPP_TOKEN;
        const phoneId = process.env.WHATSAPP_PHONE_ID;

        if (!token || !phoneId) {
            throw new Error('Meta WhatsApp credentials not configured');
        }

        this.accessToken = token;
        this.phoneNumberId = phoneId;
    }

    async sendMessage({ to, message, mediaUrl }: SendMessageParams): Promise<WhatsAppResponse> {
        try {
            const url = `https://graph.facebook.com/${this.apiVersion}/${this.phoneNumberId}/messages`;

            const body: any = {
                messaging_product: 'whatsapp',
                to: to,
                type: mediaUrl ? 'image' : 'text',
            };

            if (mediaUrl) {
                body.image = { link: mediaUrl };
            } else {
                body.text = { body: message };
            }

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(body),
            });

            const data = await response.json();

            if (!response.ok) {
                console.error('[Meta WhatsApp] Error:', data);
                return {
                    success: false,
                    error: data.error?.message || 'Unknown error',
                    provider: 'meta',
                };
            }

            return {
                success: true,
                messageId: data.messages?.[0]?.id,
                provider: 'meta',
            };
        } catch (error: any) {
            console.error('[Meta WhatsApp] Exception:', error);
            return {
                success: false,
                error: error.message,
                provider: 'meta',
            };
        }
    }

    async sendTemplate({ to, templateName, variables, mediaUrl }: SendTemplateParams): Promise<WhatsAppResponse> {
        try {
            const url = `https://graph.facebook.com/${this.apiVersion}/${this.phoneNumberId}/messages`;

            const components: any[] = [];

            // Add header with media if provided
            if (mediaUrl) {
                components.push({
                    type: 'header',
                    parameters: [{ type: 'image', image: { link: mediaUrl } }],
                });
            }

            // Add body with variables
            if (variables.length > 0) {
                components.push({
                    type: 'body',
                    parameters: variables.map(v => ({ type: 'text', text: v })),
                });
            }

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    messaging_product: 'whatsapp',
                    to: to,
                    type: 'template',
                    template: {
                        name: templateName,
                        language: { code: 'pt_BR' },
                        components: components,
                    },
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                console.error('[Meta WhatsApp Template] Error:', data);
                return {
                    success: false,
                    error: data.error?.message || 'Unknown error',
                    provider: 'meta',
                };
            }

            return {
                success: true,
                messageId: data.messages?.[0]?.id,
                provider: 'meta',
            };
        } catch (error: any) {
            console.error('[Meta WhatsApp Template] Exception:', error);
            return {
                success: false,
                error: error.message,
                provider: 'meta',
            };
        }
    }
}
