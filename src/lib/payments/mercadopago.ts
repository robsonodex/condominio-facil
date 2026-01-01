import { PaymentCredentials, BoletoParams, PixParams, PaymentResult } from './multi-tenant';

export class MercadoPagoService {
    private apiUrl = 'https://api.mercadopago.com';
    private credentials: PaymentCredentials;
    private condoId: string;

    constructor(credentials: PaymentCredentials, condoId: string) {
        this.credentials = credentials;
        this.condoId = condoId;
    }

    async testConnection(): Promise<boolean> {
        try {
            const res = await fetch(`${this.apiUrl}/v1/payment_methods`, {
                headers: {
                    'Authorization': `Bearer ${this.credentials.access_token}`
                }
            });
            return res.ok;
        } catch {
            return false;
        }
    }

    async generateInvoice(params: BoletoParams | PixParams): Promise<PaymentResult> {
        const isPix = 'descricao' in params && !('vencimento' in params); // Simplificação para o exemplo

        try {
            const response = await fetch(`${this.apiUrl}/v1/payments`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.credentials.access_token}`,
                    'Content-Type': 'application/json',
                    'X-Idempotency-Key': Date.now().toString()
                },
                body: JSON.stringify({
                    transaction_amount: params.valor,
                    description: params.descricao,
                    payment_method_id: isPix ? 'pix' : 'bolbradesco',
                    payer: {
                        email: 'pagador@test.com', // No cenário real viria do morador
                        identification: {
                            type: 'CPF',
                            number: '19119119100'
                        }
                    }
                })
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Erro no Mercado Pago');

            return {
                success: true,
                transaction_id: data.id.toString(),
                boleto_url: data.transaction_details?.external_resource_url,
                pix_code: data.point_of_interaction?.transaction_data?.qr_code,
                provider: 'mercadopago'
            };
        } catch (error: any) {
            return {
                success: false,
                error: error.message,
                provider: 'mercadopago'
            };
        }
    }
}
