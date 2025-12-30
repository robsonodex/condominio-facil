/**
 * Z-API WhatsApp Provider
 * Busca credenciais por condomínio (multi-tenant)
 * 
 * Docs: https://developer.z-api.io/
 */

import { WhatsAppProvider, SendMessageParams, SendTemplateParams, WhatsAppResponse } from '../types';
import { getCondoIntegration, logIntegrationOperation } from '../../integrations';

interface ZApiCredentials {
    instance_id: string;
    token: string;
    client_token?: string;
}

export class ZApiWhatsAppProvider implements WhatsAppProvider {

    private async getCredentials(condoId: string): Promise<ZApiCredentials> {
        const integration = await getCondoIntegration(condoId, 'whatsapp', 'z-api');

        if (!integration) {
            throw new Error(`WhatsApp Z-API não configurado para o condomínio ${condoId}`);
        }

        const { instance_id, token, client_token } = integration.credentials as ZApiCredentials;

        if (!instance_id || !token) {
            throw new Error('Credenciais incompletas da Z-API (Instance ID ou Token ausentes)');
        }

        return { instance_id, token, client_token };
    }

    async sendMessage(params: SendMessageParams): Promise<WhatsAppResponse> {
        const { to, message, mediaUrl, condoId } = params;
        const startTime = Date.now();

        if (!condoId) {
            return { success: false, error: 'condoId é obrigatório para Z-API', provider: 'z-api' };
        }

        try {
            const { instance_id, token, client_token } = await this.getCredentials(condoId);
            const formattedNumber = this.formatPhoneNumber(to);

            const baseUrl = `https://api.z-api.io/instances/${instance_id}/token/${token}`;
            let endpoint = `${baseUrl}/send-text`;
            let body: any = { phone: formattedNumber };

            if (mediaUrl) {
                endpoint = `${baseUrl}/send-image`; // Simplificando para imagem, Z-API tem outros específicos
                body.image = mediaUrl;
                body.caption = message;
            } else {
                body.message = message;
            }

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(client_token ? { 'Client-Token': client_token } : {})
                },
                body: JSON.stringify(body),
            });

            const responseData = await response.json();

            await logIntegrationOperation({
                condo_id: condoId,
                tipo: 'whatsapp',
                provider: 'z-api',
                operation: mediaUrl ? 'send_media' : 'send_text',
                success: response.ok,
                request_data: { to: formattedNumber, hasMedia: !!mediaUrl },
                response_data: responseData,
                duration_ms: Date.now() - startTime,
            });

            if (!response.ok) {
                return {
                    success: false,
                    error: responseData?.message || 'Erro Z-API',
                    provider: 'z-api',
                };
            }

            return {
                success: true,
                messageId: responseData?.messageId,
                provider: 'z-api',
            };
        } catch (error: any) {
            return {
                success: false,
                error: error.message,
                provider: 'z-api',
            };
        }
    }

    async sendTemplate(params: SendTemplateParams): Promise<WhatsAppResponse> {
        // Z-API não exige aprovação de templates, enviamos como texto formatado
        return this.sendMessage({
            to: params.to,
            message: this.buildTemplateMessage(params.templateName, params.variables),
            condoId: params.condoId
        });
    }

    async checkConnection(condoId: string): Promise<{ connected: boolean; state?: string }> {
        try {
            const { instance_id, token, client_token } = await this.getCredentials(condoId);
            const response = await fetch(`https://api.z-api.io/instances/${instance_id}/token/${token}/status`, {
                method: 'GET',
                headers: {
                    ...(client_token ? { 'Client-Token': client_token } : {})
                }
            });

            const data = await response.json();
            return {
                connected: data?.connected === true,
                state: data?.connected ? 'CONNECTED' : 'DISCONNECTED'
            };
        } catch (error) {
            return { connected: false };
        }
    }

    async generateQRCode(condoId: string): Promise<{ qrcode?: string; error?: string }> {
        try {
            const { instance_id, token, client_token } = await this.getCredentials(condoId);
            const response = await fetch(`https://api.z-api.io/instances/${instance_id}/token/${token}/qr-code`, {
                method: 'GET',
                headers: {
                    ...(client_token ? { 'Client-Token': client_token } : {})
                }
            });

            const data = await response.json();
            if (data?.value) {
                return { qrcode: data.value }; // Z-API retorna base64 do QR
            }
            return { error: 'QR Code não disponível ou já conectado' };
        } catch (error: any) {
            return { error: error.message };
        }
    }

    private formatPhoneNumber(phone: string): string {
        let numbers = phone.replace(/\D/g, '');
        if (numbers.length <= 11) numbers = '55' + numbers;
        return numbers;
    }

    private buildTemplateMessage(templateName: string, variables: string[]): string {
        const templates: Record<string, string> = {
            'cobranca_gerada': `💰 *Nova Cobrança Gerada*\n\nValor: R$ ${variables[0] || '0,00'}\nLink: ${variables[1] || ''}`,
            'encomenda_recebida': `📦 *Encomenda Recebida*\n\nSua encomenda chegou na portaria.\nDescrição: ${variables[0] || 'Não informada'}`,
        };
        return templates[templateName] || variables.join('\n');
    }
}
