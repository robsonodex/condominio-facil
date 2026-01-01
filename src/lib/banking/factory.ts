
import { BankIntegration } from './base';
import { BancoBrasilIntegration } from './banco-brasil';
import { ItauIntegration } from './itau';
import { BradescoIntegration } from './bradesco';
import { SantanderIntegration } from './santander';
import { CaixaIntegration } from './caixa';
import { SicoobIntegration } from './sicoob';
import { InterIntegration } from './inter';

export class BankFactory {
    static create(bankCode: string, credentials: any): BankIntegration {
        switch (bankCode) {
            case '001':
                return new BancoBrasilIntegration(credentials);
            case '341':
                return new ItauIntegration(credentials);
            case '237':
                return new BradescoIntegration(credentials);
            case '033':
                return new SantanderIntegration(credentials);
            case '104':
                return new CaixaIntegration(credentials);
            case '756':
                return new SicoobIntegration(credentials);
            case '077':
                return new InterIntegration(credentials);
            default:
                throw new Error(`Banco ${bankCode} não suportado`);
        }
    }

    static getSupportedBanks(): Array<{ code: string; name: string; logo: string }> {
    static getSupportedBanks(): Array<{ code: string; name: string; logo: string }> {
        return SUPPORTED_BANKS;
    }
}
}
