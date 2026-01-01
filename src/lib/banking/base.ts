export interface BankCredentials {
    clientId?: string;
    clientSecret?: string;
    certificatePath?: string;
    certificatePassword?: string;
    apiKey?: string;
    merchantId?: string;
    environment: 'sandbox' | 'production';
}

export interface BoletoData {
    ourNumber: string;
    amount: number;
    dueDate: Date;
    payer: {
        name: string;
        document: string;
        email?: string;
        phone?: string;
        address: {
            street: string;
            number: string;
            complement?: string;
            neighborhood: string;
            city: string;
            state: string;
            zipcode: string;
        };
    };
    instructions?: string[];
    finePercentage?: number;
    interestPercentage?: number;
    discountAmount?: number;
    discountDueDate?: Date;
}

export interface BoletoResponse {
    success: boolean;
    barcode?: string;
    digitableLine?: string;
    boletoUrl?: string;
    boletoHtml?: string;
    pixQrCode?: string;
    pixCopyPaste?: string;
    bankResponse?: any;
    errorMessage?: string;
}

export interface PaymentNotification {
    ourNumber: string;
    amountPaid: number;
    paymentDate: Date;
    creditDate?: Date;
    authenticationCode?: string;
    paymentChannel?: string;
}

export abstract class BankIntegration {
    protected credentials: BankCredentials;
    protected bankCode: string = '';
    protected bankName: string = '';
    protected baseUrl: string = '';
    protected accessToken?: string;
    protected tokenExpiry?: Date;

    constructor(credentials: BankCredentials) {
        this.credentials = credentials;
    }

    // Métodos abstratos que cada banco deve implementar
    abstract authenticate(): Promise<void>;
    abstract registerBoleto(data: BoletoData): Promise<BoletoResponse>;
    abstract cancelBoleto(ourNumber: string): Promise<boolean>;
    abstract getBoletoStatus(ourNumber: string): Promise<string>;
    abstract generatePixQrCode(data: BoletoData): Promise<{ qrCode: string; copyPaste: string }>;
    abstract processReturnFile(content: string): Promise<PaymentNotification[]>;
    abstract generateRemittanceFile(boletos: BoletoData[]): Promise<string>;

    // Métodos comuns
    protected async ensureAuthenticated(): Promise<void> {
        if (!this.accessToken || !this.tokenExpiry || new Date() >= this.tokenExpiry) {
            await this.authenticate();
        }
    }

    protected formatDocument(document: string): string {
        return document.replace(/\D/g, '');
    }

    protected formatCurrency(value: number): string {
        return value.toFixed(2).replace('.', '');
    }

    protected padLeft(value: string, length: number, char: string = '0'): string {
        return value.padStart(length, char);
    }

    protected padRight(value: string, length: number, char: string = ' '): string {
        return value.padEnd(length, char).substring(0, length);
    }
}
