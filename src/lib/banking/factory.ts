
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
        return [
            { code: '001', name: 'Banco do Brasil', logo: '/banks/bb.svg' },
            { code: '341', name: 'Itaú Unibanco', logo: '/banks/itau.svg' },
            { code: '237', name: 'Bradesco', logo: '/banks/bradesco.svg' },
            { code: '033', name: 'Santander', logo: '/banks/santander.svg' },
            { code: '104', name: 'Caixa Econômica', logo: '/banks/caixa.svg' },
            { code: '756', name: 'Sicoob', logo: '/banks/sicoob.svg' },
            { code: '748', name: 'Sicredi', logo: '/banks/sicredi.svg' },
            { code: '077', name: 'Banco Inter', logo: '/banks/inter.svg' },
            { code: '212', name: 'Banco Original', logo: '/banks/original.svg' },
            { code: '260', name: 'Nubank', logo: '/banks/nubank.svg' },
            { code: '336', name: 'C6 Bank', logo: '/banks/c6.svg' },
        ];
    }
}
