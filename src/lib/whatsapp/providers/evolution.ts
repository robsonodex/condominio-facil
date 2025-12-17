/**
 * Evolution API WhatsApp Provider
 * Busca credenciais por condomínio (multi-tenant)
 * 
 * Docs: https://doc.evolution-api.com/
 */

import { WhatsAppProvider, SendMessageParams, SendTemplateParams, WhatsAppResponse } from '../types';
import { getCondoIntegration, logIntegrationOperation } from '../../integrations';

interface EvolutionCredentials {
    evolution_url: string;
    instance_name: string;
    api_key: string;
}

export class EvolutionWhatsAppProvider implements WhatsAppProvider {

    /**
     * Busca credenciais do Evolution API para um condomínio específico
     */
    private async getCredentials(condoId: string): Promise<EvolutionCredentials> {
        const integration = await getCondoIntegration(condoId, 'whatsapp', 'evolution');

        if (!integration) {
            throw new Error(`WhatsApp Evolution não configurado para o condomínio ${condoId}`);
        }

        const { evolution_url, instance_name, api_key } = integration.credentials as EvolutionCredentials;

        if (!evolution_url || !instance_name || !api_key) {
            throw new Error('Credenciais incompletas do Evolution API');
        }

        return { evolution_url, instance_name, api_key };
    }

    /**
     * Envia mensagem de texto
     */
    async sendMessage(params: SendMessageParams & { condoId: string }): Promise<WhatsAppResponse> {
        const { to, message, mediaUrl, condoId } = params;
        const startTime = Date.now();

        try {
            const { evolution_url, instance_name, api_key } = await this.getCredentials(condoId);

            // Formatar número (remover caracteres especiais, adicionar código país)
            const formattedNumber = this.formatPhoneNumber(to);

            let response;
            let responseData;

            if (mediaUrl) {
                // Enviar mídia
                response = await fetch(`${evolution_url}/message/sendMedia/${instance_name}`, {
                    method: 'POST',
                    headers: {
                        'apikey': api_key,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        number: formattedNumber,
                        mediatype: this.getMediaType(mediaUrl),
                        media: mediaUrl,
                        caption: message,
                    }),
                });
            } else {
                // Enviar texto
                response = await fetch(`${evolution_url}/message/sendText/${instance_name}`, {
                    method: 'POST',
                    headers: {
                        'apikey': api_key,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        number: formattedNumber,
                        text: message,
                    }),
                });
            }

            responseData = await response.json();

            // Log da operação
            await logIntegrationOperation({
                condo_id: condoId,
                tipo: 'whatsapp',
                provider: 'evolution',
                operation: mediaUrl ? 'send_media' : 'send_text',
                success: response.ok,
                request_data: { to: formattedNumber, hasMedia: !!mediaUrl },
                response_data: responseData,
                error_message: !response.ok ? responseData?.message : undefined,
                duration_ms: Date.now() - startTime,
            });

            if (!response.ok) {
                console.error('[Evolution WhatsApp] Error:', responseData);
                return {
                    success: false,
                    error: responseData?.message || 'Erro ao enviar mensagem',
                    provider: 'evolution',
                };
            }

            return {
                success: true,
                messageId: responseData?.key?.id,
                provider: 'evolution',
            };
        } catch (error: any) {
            console.error('[Evolution WhatsApp] Exception:', error);

            // Log do erro
            await logIntegrationOperation({
                condo_id: condoId,
                tipo: 'whatsapp',
                provider: 'evolution',
                operation: 'send_message',
                success: false,
                error_message: error.message,
                duration_ms: Date.now() - startTime,
            });

            return {
                success: false,
                error: error.message,
                provider: 'evolution',
            };
        }
    }

    /**
     * Envia template (Evolution não usa templates como Meta, então envia texto formatado)
     */
    async sendTemplate(params: SendTemplateParams & { condoId: string }): Promise<WhatsAppResponse> {
        const { to, templateName, variables, condoId } = params;

        // Montar mensagem baseada no template
        const message = this.buildTemplateMessage(templateName, variables);

        return this.sendMessage({ to, message, condoId });
    }

    /**
     * Verifica status da conexão
     */
    async checkConnection(condoId: string): Promise<{ connected: boolean; state?: string }> {
        try {
            const { evolution_url, instance_name, api_key } = await this.getCredentials(condoId);

            const response = await fetch(`${evolution_url}/instance/connectionState/${instance_name}`, {
                method: 'GET',
                headers: {
                    'apikey': api_key,
                },
            });

            const data = await response.json();

            return {
                connected: data?.state === 'open',
                state: data?.state,
            };
        } catch (error) {
            console.error('[Evolution WhatsApp] Connection check failed:', error);
            return { connected: false };
        }
    }

    /**
     * Gera QR Code para conexão (apenas para setup inicial)
     */
    async generateQRCode(condoId: string): Promise<{ qrcode?: string; error?: string }> {
        try {
            const { evolution_url, instance_name, api_key } = await this.getCredentials(condoId);

            const response = await fetch(`${evolution_url}/instance/connect/${instance_name}`, {
                method: 'GET',
                headers: {
                    'apikey': api_key,
                },
            });

            const data = await response.json();

            if (data?.base64) {
                return { qrcode: data.base64 };
            }

            return { error: 'Não foi possível gerar QR Code' };
        } catch (error: any) {
            return { error: error.message };
        }
    }

    /**
     * Formata número de telefone para formato internacional
     */
    private formatPhoneNumber(phone: string): string {
        // Remove tudo que não é número
        let numbers = phone.replace(/\D/g, '');

        // Se começa com 0, remove
        if (numbers.startsWith('0')) {
            numbers = numbers.slice(1);
        }

        // Se não tem código do país, adiciona 55 (Brasil)
        if (numbers.length <= 11) {
            numbers = '55' + numbers;
        }

        return numbers;
    }

    /**
     * Detecta tipo de mídia pela URL
     */
    private getMediaType(url: string): 'image' | 'video' | 'audio' | 'document' {
        const lower = url.toLowerCase();
        if (lower.match(/\.(jpg|jpeg|png|gif|webp)$/)) return 'image';
        if (lower.match(/\.(mp4|avi|mov|mkv)$/)) return 'video';
        if (lower.match(/\.(mp3|ogg|wav)$/)) return 'audio';
        return 'document';
    }

    /**
     * Monta mensagem baseada em template
     */
    private buildTemplateMessage(templateName: string, variables: string[]): string {
        const templates: Record<string, string> = {
            'cobranca_gerada': `💰 *Nova Cobrança Gerada*\n\nValor: R$ ${variables[0] || '0,00'}\nLink: ${variables[1] || ''}`,
            'boleto_disponivel': `📄 *Boleto Disponível*\n\nValor: R$ ${variables[0] || '0,00'}\nVencimento: ${variables[1] || ''}\nLink: ${variables[2] || ''}`,
            'pagamento_confirmado': `✅ *Pagamento Confirmado*\n\nValor: R$ ${variables[0] || '0,00'}\nData: ${variables[1] || ''}`,
            'lembrete_vencimento': `⏰ *Lembrete de Vencimento*\n\nValor: R$ ${variables[0] || '0,00'}\nVence em: ${variables[1] || ''} dias`,
            'encomenda_recebida': `📦 *Encomenda Recebida*\n\nSua encomenda chegou na portaria.\nDescrição: ${variables[0] || 'Não informada'}\nRetirar: ${variables[1] || 'Portaria'}`,
        };

        return templates[templateName] || variables.join('\n');
    }
}

// Singleton para uso global
let evolutionProvider: EvolutionWhatsAppProvider | null = null;

export function getEvolutionProvider(): EvolutionWhatsAppProvider {
    if (!evolutionProvider) {
        evolutionProvider = new EvolutionWhatsAppProvider();
    }
    return evolutionProvider;
}
