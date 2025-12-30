import { WhatsAppProvider } from './types';
import { MetaWhatsAppProvider } from './providers/meta';
import { TwilioWhatsAppProvider } from './providers/twilio';
import { EvolutionWhatsAppProvider } from './providers/evolution';
import { ZApiWhatsAppProvider } from './providers/zapi';
import { getCondoIntegration } from '../integrations';

// Re-export types for convenience
export type { WhatsAppProvider, SendMessageParams, SendTemplateParams, WhatsAppResponse } from './types';

/**
 * WhatsApp Service Factory
 * Returns the appropriate provider:
 * 1. If condoId is provided, looks for a specific integration (Z-API, Evolution)
 * 2. Fallback to global environment configuration
 */
export async function getWhatsAppProvider(condoId?: string): Promise<WhatsAppProvider> {
    // 1. Try to find a specific integration for the condo
    if (condoId) {
        const integration = await getCondoIntegration(condoId, 'whatsapp');

        if (integration && integration.ativo) {
            switch (integration.provider) {
                case 'evolution':
                    return new EvolutionWhatsAppProvider();
                case 'z-api':
                case 'zapi':
                    return new ZApiWhatsAppProvider();
            }
        }
    }

    // 2. Global Fallback
    const globalProvider = process.env.WHATSAPP_PROVIDER || 'meta';

    switch (globalProvider.toLowerCase()) {
        case 'evolution':
            return new EvolutionWhatsAppProvider();
        case 'z-api':
        case 'zapi':
            return new ZApiWhatsAppProvider();
        case 'meta':
        case 'facebook':
            return new MetaWhatsAppProvider();
        case 'twilio':
            return new TwilioWhatsAppProvider();
        default:
            console.warn(`Unknown WhatsApp provider: ${globalProvider}, defaulting to Meta`);
            return new MetaWhatsAppProvider();
    }
}

/**
 * Common templates for billing notifications
 */
export const Templates = {
    COBRANCA_GERADA: 'cobranca_gerada', // {{1}} = valor, {{2}} = link
    BOLETO_DISPONIVEL: 'boleto_disponivel', // {{1}} = valor, {{2}} = vencimento, {{3}} = link
    PAGAMENTO_CONFIRMADO: 'pagamento_confirmado', // {{1}} = valor, {{2}} = data
    LEMBRETE_VENCIMENTO: 'lembrete_vencimento', // {{1}} = valor, {{2}} = dias
};
