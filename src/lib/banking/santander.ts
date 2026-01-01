
import { BankIntegration, BoletoData, BoletoResponse, PaymentNotification } from './base';

export class SantanderIntegration extends BankIntegration {
    authenticate(): Promise<void> { throw new Error("Method not implemented."); }
    registerBoleto(data: BoletoData): Promise<BoletoResponse> { throw new Error("Method not implemented."); }
    cancelBoleto(ourNumber: string): Promise<boolean> { throw new Error("Method not implemented."); }
    getBoletoStatus(ourNumber: string): Promise<string> { throw new Error("Method not implemented."); }
    generatePixQrCode(data: BoletoData): Promise<{ qrCode: string; copyPaste: string; }> { throw new Error("Method not implemented."); }
    processReturnFile(content: string): Promise<PaymentNotification[]> { throw new Error("Method not implemented."); }
    generateRemittanceFile(boletos: BoletoData[]): Promise<string> { throw new Error("Method not implemented."); }
}
