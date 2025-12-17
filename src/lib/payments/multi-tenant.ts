/**
 * Multi-Tenant Payment Provider
 * Busca credenciais de pagamento por condomínio
 * 
 * Suporta múltiplos gateways: Mercado Pago, Asaas, PagSeguro, etc.
 */

import { getCondoIntegration, logIntegrationOperation } from '../integrations';

// Tipos
export interface PaymentCredentials {
    access_token: string;
    public_key?: string;
    client_id?: string;
    client_secret?: string;
    webhook_secret?: string;
    convenio?: string;
    [key: string]: string | undefined;
}

export interface BoletoParams {
    condoId: string;
    valor: number;
    vencimento: string;
    pagador: {
        nome: string;
        email?: string;
        cpf_cnpj: string;
        endereco?: {
            logradouro: string;
            numero: string;
            cidade: string;
            estado: string;
            cep: string;
        };
    };
    descricao: string;
    referencia_externa?: string;
}

export interface PixParams {
    condoId: string;
    valor: number;
    descricao: string;
    vencimento?: string; // Para PIX com vencimento
    pagador?: {
        nome?: string;
        cpf_cnpj?: string;
    };
    referencia_externa?: string;
}

export interface PaymentResult {
    success: boolean;
    transaction_id?: string;
    boleto_url?: string;
    boleto_barcode?: string;
    pix_qrcode?: string;
    pix_code?: string; // Código copia-e-cola
    error?: string;
    provider: string;
}

/**
 * Classe base para providers de pagamento
 */
abstract class BasePaymentProvider {
    protected credentials: PaymentCredentials;
    protected condoId: string;
    protected provider: string;

    constructor(credentials: PaymentCredentials, condoId: string, provider: string) {
        this.credentials = credentials;
        this.condoId = condoId;
        this.provider = provider;
    }

    abstract generateBoleto(params: Omit<BoletoParams, 'condoId'>): Promise<PaymentResult>;
    abstract generatePix(params: Omit<PixParams, 'condoId'>): Promise<PaymentResult>;
    abstract checkPaymentStatus(transactionId: string): Promise<{ status: string; paid: boolean }>;
}

/**
 * Mercado Pago Provider
 */
class MercadoPagoProvider extends BasePaymentProvider {
    private apiUrl = 'https://api.mercadopago.com';

    async generateBoleto(params: Omit<BoletoParams, 'condoId'>): Promise<PaymentResult> {
        const startTime = Date.now();

        try {
            const response = await fetch(`${this.apiUrl}/v1/payments`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.credentials.access_token}`,
                    'Content-Type': 'application/json',
                    'X-Idempotency-Key': params.referencia_externa || `${Date.now()}`,
                },
                body: JSON.stringify({
                    transaction_amount: params.valor,
                    description: params.descricao,
                    payment_method_id: 'bolbradesco',
                    date_of_expiration: params.vencimento,
                    payer: {
                        first_name: params.pagador.nome.split(' ')[0],
                        last_name: params.pagador.nome.split(' ').slice(1).join(' ') || 'N/A',
                        email: params.pagador.email || 'sem-email@example.com',
                        identification: {
                            type: params.pagador.cpf_cnpj.length > 11 ? 'CNPJ' : 'CPF',
                            number: params.pagador.cpf_cnpj.replace(/\D/g, ''),
                        },
                    },
                    external_reference: params.referencia_externa,
                }),
            });

            const data = await response.json();

            await logIntegrationOperation({
                condo_id: this.condoId,
                tipo: 'pagamentos',
                provider: 'mercadopago',
                operation: 'generate_boleto',
                success: response.ok,
                request_data: { valor: params.valor, pagador: params.pagador.nome },
                response_data: { id: data.id, status: data.status },
                error_message: data.message,
                duration_ms: Date.now() - startTime,
            });

            if (!response.ok) {
                return {
                    success: false,
                    error: data.message || 'Erro ao gerar boleto',
                    provider: 'mercadopago',
                };
            }

            return {
                success: true,
                transaction_id: data.id?.toString(),
                boleto_url: data.transaction_details?.external_resource_url,
                boleto_barcode: data.barcode?.content,
                provider: 'mercadopago',
            };
        } catch (error: any) {
            await logIntegrationOperation({
                condo_id: this.condoId,
                tipo: 'pagamentos',
                provider: 'mercadopago',
                operation: 'generate_boleto',
                success: false,
                error_message: error.message,
                duration_ms: Date.now() - startTime,
            });

            return {
                success: false,
                error: error.message,
                provider: 'mercadopago',
            };
        }
    }

    async generatePix(params: Omit<PixParams, 'condoId'>): Promise<PaymentResult> {
        const startTime = Date.now();

        try {
            const response = await fetch(`${this.apiUrl}/v1/payments`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.credentials.access_token}`,
                    'Content-Type': 'application/json',
                    'X-Idempotency-Key': params.referencia_externa || `${Date.now()}`,
                },
                body: JSON.stringify({
                    transaction_amount: params.valor,
                    description: params.descricao,
                    payment_method_id: 'pix',
                    payer: {
                        email: 'pagador@example.com',
                        first_name: params.pagador?.nome?.split(' ')[0] || 'Pagador',
                        last_name: params.pagador?.nome?.split(' ').slice(1).join(' ') || 'N/A',
                        identification: params.pagador?.cpf_cnpj ? {
                            type: params.pagador.cpf_cnpj.length > 11 ? 'CNPJ' : 'CPF',
                            number: params.pagador.cpf_cnpj.replace(/\D/g, ''),
                        } : undefined,
                    },
                    external_reference: params.referencia_externa,
                }),
            });

            const data = await response.json();

            await logIntegrationOperation({
                condo_id: this.condoId,
                tipo: 'pagamentos',
                provider: 'mercadopago',
                operation: 'generate_pix',
                success: response.ok,
                request_data: { valor: params.valor },
                response_data: { id: data.id, status: data.status },
                error_message: data.message,
                duration_ms: Date.now() - startTime,
            });

            if (!response.ok) {
                return {
                    success: false,
                    error: data.message || 'Erro ao gerar PIX',
                    provider: 'mercadopago',
                };
            }

            return {
                success: true,
                transaction_id: data.id?.toString(),
                pix_qrcode: data.point_of_interaction?.transaction_data?.qr_code_base64,
                pix_code: data.point_of_interaction?.transaction_data?.qr_code,
                provider: 'mercadopago',
            };
        } catch (error: any) {
            return {
                success: false,
                error: error.message,
                provider: 'mercadopago',
            };
        }
    }

    async checkPaymentStatus(transactionId: string): Promise<{ status: string; paid: boolean }> {
        try {
            const response = await fetch(`${this.apiUrl}/v1/payments/${transactionId}`, {
                headers: {
                    'Authorization': `Bearer ${this.credentials.access_token}`,
                },
            });

            const data = await response.json();

            return {
                status: data.status || 'unknown',
                paid: data.status === 'approved',
            };
        } catch {
            return { status: 'error', paid: false };
        }
    }
}

/**
 * Asaas Provider
 */
class AsaasProvider extends BasePaymentProvider {
    private apiUrl = 'https://www.asaas.com/api/v3';

    async generateBoleto(params: Omit<BoletoParams, 'condoId'>): Promise<PaymentResult> {
        const startTime = Date.now();

        try {
            // Primeiro criar/buscar cliente
            const customerId = await this.getOrCreateCustomer(params.pagador);

            const response = await fetch(`${this.apiUrl}/payments`, {
                method: 'POST',
                headers: {
                    'access_token': this.credentials.access_token,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    customer: customerId,
                    billingType: 'BOLETO',
                    value: params.valor,
                    dueDate: params.vencimento,
                    description: params.descricao,
                    externalReference: params.referencia_externa,
                }),
            });

            const data = await response.json();

            await logIntegrationOperation({
                condo_id: this.condoId,
                tipo: 'pagamentos',
                provider: 'asaas',
                operation: 'generate_boleto',
                success: !data.errors,
                request_data: { valor: params.valor, pagador: params.pagador.nome },
                response_data: { id: data.id, status: data.status },
                error_message: data.errors?.[0]?.description,
                duration_ms: Date.now() - startTime,
            });

            if (data.errors) {
                return {
                    success: false,
                    error: data.errors[0]?.description || 'Erro ao gerar boleto',
                    provider: 'asaas',
                };
            }

            return {
                success: true,
                transaction_id: data.id,
                boleto_url: data.bankSlipUrl,
                boleto_barcode: data.identificationField,
                provider: 'asaas',
            };
        } catch (error: any) {
            return {
                success: false,
                error: error.message,
                provider: 'asaas',
            };
        }
    }

    async generatePix(params: Omit<PixParams, 'condoId'>): Promise<PaymentResult> {
        const startTime = Date.now();

        try {
            const customerId = await this.getOrCreateCustomer({
                nome: params.pagador?.nome || 'Pagador',
                cpf_cnpj: params.pagador?.cpf_cnpj || '00000000000',
            });

            const response = await fetch(`${this.apiUrl}/payments`, {
                method: 'POST',
                headers: {
                    'access_token': this.credentials.access_token,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    customer: customerId,
                    billingType: 'PIX',
                    value: params.valor,
                    dueDate: params.vencimento || new Date().toISOString().split('T')[0],
                    description: params.descricao,
                    externalReference: params.referencia_externa,
                }),
            });

            const data = await response.json();

            // Buscar QR Code
            let pixData;
            if (data.id) {
                const pixResponse = await fetch(`${this.apiUrl}/payments/${data.id}/pixQrCode`, {
                    headers: { 'access_token': this.credentials.access_token },
                });
                pixData = await pixResponse.json();
            }

            await logIntegrationOperation({
                condo_id: this.condoId,
                tipo: 'pagamentos',
                provider: 'asaas',
                operation: 'generate_pix',
                success: !data.errors,
                request_data: { valor: params.valor },
                response_data: { id: data.id },
                duration_ms: Date.now() - startTime,
            });

            if (data.errors) {
                return {
                    success: false,
                    error: data.errors[0]?.description || 'Erro ao gerar PIX',
                    provider: 'asaas',
                };
            }

            return {
                success: true,
                transaction_id: data.id,
                pix_qrcode: pixData?.encodedImage,
                pix_code: pixData?.payload,
                provider: 'asaas',
            };
        } catch (error: any) {
            return {
                success: false,
                error: error.message,
                provider: 'asaas',
            };
        }
    }

    async checkPaymentStatus(transactionId: string): Promise<{ status: string; paid: boolean }> {
        try {
            const response = await fetch(`${this.apiUrl}/payments/${transactionId}`, {
                headers: { 'access_token': this.credentials.access_token },
            });
            const data = await response.json();

            return {
                status: data.status || 'unknown',
                paid: data.status === 'RECEIVED' || data.status === 'CONFIRMED',
            };
        } catch {
            return { status: 'error', paid: false };
        }
    }

    private async getOrCreateCustomer(pagador: { nome: string; cpf_cnpj: string; email?: string }): Promise<string> {
        // Buscar cliente existente
        const searchResponse = await fetch(
            `${this.apiUrl}/customers?cpfCnpj=${pagador.cpf_cnpj.replace(/\D/g, '')}`,
            { headers: { 'access_token': this.credentials.access_token } }
        );
        const searchData = await searchResponse.json();

        if (searchData.data?.[0]?.id) {
            return searchData.data[0].id;
        }

        // Criar novo cliente
        const createResponse = await fetch(`${this.apiUrl}/customers`, {
            method: 'POST',
            headers: {
                'access_token': this.credentials.access_token,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                name: pagador.nome,
                cpfCnpj: pagador.cpf_cnpj.replace(/\D/g, ''),
                email: pagador.email,
            }),
        });
        const createData = await createResponse.json();

        return createData.id;
    }
}

/**
 * Factory: Retorna o provider correto baseado nas credenciais do condomínio
 */
export async function getPaymentProvider(condoId: string): Promise<BasePaymentProvider | null> {
    const integration = await getCondoIntegration(condoId, 'pagamentos');

    if (!integration) {
        console.warn(`[Payments] Nenhuma integração de pagamentos para condomínio ${condoId}`);
        return null;
    }

    const credentials = integration.credentials as PaymentCredentials;

    switch (integration.provider) {
        case 'mercadopago':
            return new MercadoPagoProvider(credentials, condoId, 'mercadopago');
        case 'asaas':
            return new AsaasProvider(credentials, condoId, 'asaas');
        // Adicionar mais providers conforme necessário
        default:
            console.warn(`[Payments] Provider não suportado: ${integration.provider}`);
            return null;
    }
}

/**
 * Helper: Gera boleto para um condomínio
 */
export async function generateBoleto(params: BoletoParams): Promise<PaymentResult> {
    const provider = await getPaymentProvider(params.condoId);

    if (!provider) {
        return {
            success: false,
            error: 'Integração de pagamentos não configurada para este condomínio',
            provider: 'none',
        };
    }

    const { condoId, ...boletoParams } = params;
    return provider.generateBoleto(boletoParams);
}

/**
 * Helper: Gera PIX para um condomínio
 */
export async function generatePix(params: PixParams): Promise<PaymentResult> {
    const provider = await getPaymentProvider(params.condoId);

    if (!provider) {
        return {
            success: false,
            error: 'Integração de pagamentos não configurada para este condomínio',
            provider: 'none',
        };
    }

    const { condoId, ...pixParams } = params;
    return provider.generatePix(pixParams);
}
