import { PaymentCredentials, BoletoParams, PixParams, PaymentResult } from './multi-tenant';

export class AsaasService {
    private apiUrl = 'https://api.asaas.com/v3';
    private apiKey: string;
    private condoId: string;

    constructor(credentials: PaymentCredentials, condoId: string) {
        this.apiKey = credentials.api_key;
        this.condoId = condoId;
    }

    async testConnection(): Promise<boolean> {
        try {
            const res = await fetch(`${this.apiUrl}/paymentMethods`, {
                headers: {
                    'access_token': this.apiKey
                }
            });
            return res.ok;
        } catch {
            return false;
        }
    }

    async generateInvoice(params: BoletoParams | PixParams): Promise<PaymentResult> {
        const isPix = 'descricao' in params && !('vencimento' in params);

        try {
            const response = await fetch(`${this.apiUrl}/payments`, {
                method: 'POST',
                headers: {
                    'access_token': this.apiKey,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    customer: 'cus_test', // No cenário real, buscaria/criaria o cliente no Asaas
                    billingType: isPix ? 'PIX' : 'BOLETO',
                    value: params.valor,
                    dueDate: params.vencimento || new Date(Date.now() + 86400000).toISOString().split('T')[0],
                    description: params.descricao,
                    externalReference: `CONDO_${this.condoId}_${Date.now()}`
                })
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.errors?.[0]?.description || 'Erro no Asaas');

            return {
                success: true,
                transaction_id: data.id,
                boleto_url: data.bankSlipUrl,
                pix_code: data.pixCopyAndPaste,
                provider: 'asaas'
            };
        } catch (error: any) {
            return {
                success: false,
                error: error.message,
                provider: 'asaas'
            };
        }
    }
}
