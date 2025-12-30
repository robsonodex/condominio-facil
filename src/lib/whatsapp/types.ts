// WhatsApp Provider Interface
export interface WhatsAppProvider {
    sendMessage(params: SendMessageParams): Promise<WhatsAppResponse>;
    sendTemplate(params: SendTemplateParams): Promise<WhatsAppResponse>;
}

export interface SendMessageParams {
    to: string; // Phone number with country code (e.g., 5511999999999)
    message: string;
    mediaUrl?: string;
    condoId?: string; // Optional for multi-tenant providers
}

export interface SendTemplateParams {
    to: string;
    templateName: string;
    variables: string[];
    mediaUrl?: string;
    condoId?: string; // Optional for multi-tenant providers
}

export interface WhatsAppResponse {
    success: boolean;
    messageId?: string;
    error?: string;
    provider: string;
}
