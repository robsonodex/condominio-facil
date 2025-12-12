import { WhatsAppProvider } from './types';
import { MetaWhatsAppProvider } from './providers/meta';
import { TwilioWhatsAppProvider } from './providers/twilio';

// Re-export types for convenience
export type { WhatsAppProvider, SendMessageParams, SendTemplateParams, WhatsAppResponse } from './types';

/**
 * WhatsApp Service Factory
 * Returns the appropriate provider based on environment configuration
 */
export function getWhatsAppProvider(): WhatsAppProvider {
    const provider = process.env.WHATSAPP_PROVIDER || 'meta';

    switch (provider.toLowerCase()) {
        case 'meta':
        case 'facebook':
            return new MetaWhatsAppProvider();

        case 'twilio':
            return new TwilioWhatsAppProvider();

        default:
            console.warn(`Unknown WhatsApp provider: ${provider}, defaulting to Meta`);
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
