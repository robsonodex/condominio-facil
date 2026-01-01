
import { BankIntegration, BankCredentials, BoletoData, BoletoResponse, PaymentNotification } from './base';
import axios, { AxiosInstance } from 'axios';
import https from 'https';
import fs from 'fs';

interface ItauCredentials extends BankCredentials {
    certificatePath: string;
    certificatePassword: string;
    agency: string;
    account: string;
    accountDigit: string;
    walletCode: string;
}

export class ItauIntegration extends BankIntegration {
    protected bankCode = '341';
    protected bankName = 'Itaú';
    private api: AxiosInstance;
    // @ts-ignore
    protected credentials: ItauCredentials;

    constructor(credentials: ItauCredentials) {
        super(credentials);
        this.credentials = credentials;

        this.baseUrl = credentials.environment === 'production'
            ? 'https://api.itau.com.br'
            : 'https://api.sandbox.itau.com.br';

        // Configurar certificado mTLS
        const httpsAgent = new https.Agent({
            pfx: fs.readFileSync(credentials.certificatePath),
            passphrase: credentials.certificatePassword,
            rejectUnauthorized: true
        });

        this.api = axios.create({
            baseURL: this.baseUrl,
            httpsAgent,
            headers: {
                'Content-Type': 'application/json'
            }
        });
    }

    async authenticate(): Promise<void> {
        try {
            const response = await this.api.post('/oauth/token', {
                grant_type: 'client_credentials',
                client_id: this.credentials.clientId,
                client_secret: this.credentials.clientSecret
            });

            this.accessToken = response.data.access_token;
            this.tokenExpiry = new Date(Date.now() + (response.data.expires_in * 1000) - 60000);

            this.api.defaults.headers.common['Authorization'] = `Bearer ${this.accessToken}`;

        } catch (error: any) {
            console.error('Erro autenticação Itaú:', error.response?.data || error.message);
            throw new Error(`Falha na autenticação com Itaú: ${error.message}`);
        }
    }

    async registerBoleto(data: BoletoData): Promise<BoletoResponse> {
        await this.ensureAuthenticated();

        try {
            const payload: any = {
                etapa_processo_boleto: 'efetivacao',
                beneficiario: {
                    id_beneficiario: `${this.credentials.agency}${this.credentials.account}${this.credentials.accountDigit}`
                },
                dado_boleto: {
                    tipo_boleto: 'a vista',
                    codigo_carteira: this.credentials.walletCode,
                    valor_total_titulo: data.amount.toFixed(2),
                    codigo_especie: '01', // Duplicata Mercantil
                    data_emissao: new Date().toISOString().split('T')[0],
                    pagador: {
                        pessoa: {
                            nome_pessoa: data.payer.name,
                            tipo_pessoa: {
                                codigo_tipo_pessoa: data.payer.document.length === 11 ? 'F' : 'J',
                                numero_cadastro_pessoa_fisica: data.payer.document.length === 11 ? data.payer.document : undefined,
                                numero_cadastro_nacional_pessoa_juridica: data.payer.document.length > 11 ? data.payer.document : undefined
                            }
                        },
                        endereco: {
                            nome_logradouro: data.payer.address.street,
                            nome_bairro: data.payer.address.neighborhood,
                            nome_cidade: data.payer.address.city,
                            sigla_UF: data.payer.address.state,
                            numero_CEP: data.payer.address.zipcode.replace(/\D/g, '')
                        }
                    },
                    dados_individuais_boleto: [{
                        numero_nosso_numero: data.ourNumber,
                        data_vencimento: data.dueDate.toISOString().split('T')[0],
                        valor_titulo: data.amount.toFixed(2),
                        texto_seu_numero: data.ourNumber
                    }]
                },
                dados_qrcode: {
                    chave: this.credentials.clientId, // Chave PIX
                    tipo_cobranca: 'cob'
                }
            };

            // Adicionar multa se configurada
            if (data.finePercentage && data.finePercentage > 0) {
                payload.dado_boleto['multa'] = {
                    codigo_tipo_multa: '02', // Percentual
                    percentual_multa: data.finePercentage.toFixed(2),
                    data_multa: data.dueDate.toISOString().split('T')[0]
                };
            }

            // Adicionar juros se configurado
            if (data.interestPercentage && data.interestPercentage > 0) {
                payload.dado_boleto['juros'] = {
                    codigo_tipo_juros: '90', // Percentual ao mês
                    percentual_juros: data.interestPercentage.toFixed(2),
                    data_juros: data.dueDate.toISOString().split('T')[0]
                };
            }

            // Adicionar desconto se configurado
            if (data.discountAmount && data.discountAmount > 0) {
                payload.dado_boleto['desconto'] = {
                    codigo_tipo_desconto: '01', // Valor fixo
                    descontos: [{
                        data_desconto: data.discountDueDate?.toISOString().split('T')[0] || data.dueDate.toISOString().split('T')[0],
                        valor_desconto: data.discountAmount.toFixed(2)
                    }]
                };
            }

            const response = await this.api.post('/cash_management/v2/boletos', payload);

            return {
                success: true,
                barcode: response.data.dado_boleto?.dados_individuais_boleto?.[0]?.codigo_barras,
                digitableLine: response.data.dado_boleto?.dados_individuais_boleto?.[0]?.numero_linha_digitavel,
                boletoUrl: response.data.dado_boleto?.dados_individuais_boleto?.[0]?.url_boleto,
                pixQrCode: response.data.dados_qrcode?.base64_qrcode,
                pixCopyPaste: response.data.dados_qrcode?.emv,
                bankResponse: response.data
            };

        } catch (error: any) {
            console.error('Erro registro boleto Itaú:', error.response?.data || error.message);
            return {
                success: false,
                errorMessage: error.response?.data?.mensagem || error.message,
                bankResponse: error.response?.data
            };
        }
    }

    async cancelBoleto(ourNumber: string): Promise<boolean> {
        await this.ensureAuthenticated();

        try {
            const beneficiaryId = `${this.credentials.agency}${this.credentials.account}${this.credentials.accountDigit}`;

            await this.api.patch(
                `/cash_management/v2/boletos/${beneficiaryId}/${ourNumber}`,
                {
                    tipo_baixa: '10', // Baixa por solicitação
                    motivo_baixa: 'Cancelamento solicitado pelo beneficiário'
                }
            );

            return true;
        } catch (error: any) {
            console.error('Erro cancelamento boleto Itaú:', error.response?.data || error.message);
            return false;
        }
    }

    async getBoletoStatus(ourNumber: string): Promise<string> {
        await this.ensureAuthenticated();

        try {
            const beneficiaryId = `${this.credentials.agency}${this.credentials.account}${this.credentials.accountDigit}`;

            const response = await this.api.get(
                `/cash_management/v2/boletos/${beneficiaryId}/${ourNumber}`
            );

            const situacao = response.data.dado_boleto?.dados_individuais_boleto?.[0]?.situacao_geral_boleto;

            const statusMap: Record<string, string> = {
                'em aberto': 'pending',
                'baixado': 'cancelled',
                'liquidado': 'paid',
                'protestado': 'protested'
            };

            return statusMap[situacao?.toLowerCase()] || 'unknown';
        } catch (error: any) {
            console.error('Erro consulta boleto Itaú:', error.response?.data || error.message);
            throw error;
        }
    }

    async generatePixQrCode(data: BoletoData): Promise<{ qrCode: string; copyPaste: string }> {
        const boleto = await this.registerBoleto(data);

        if (boleto.success && boleto.pixQrCode) {
            return {
                qrCode: boleto.pixQrCode,
                copyPaste: boleto.pixCopyPaste || ''
            };
        }

        throw new Error('Falha ao gerar QR Code PIX');
    }

    async processReturnFile(content: string): Promise<PaymentNotification[]> {
        const lines = content.split('\n');
        const payments: PaymentNotification[] = [];

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            if (line.length < 240) continue;

            const recordType = line.substring(7, 8);
            const segmentType = line.substring(13, 14);

            // Segmento T - Título
            if (recordType === '3' && segmentType === 'T') {
                const movementCode = line.substring(15, 17);

                // 06 = Liquidação Normal, 17 = Liquidação após baixa
                if (['06', '17'].includes(movementCode)) {
                    const ourNumber = line.substring(37, 45).trim();

                    // Próxima linha deve ser Segmento U
                    if (i + 1 < lines.length) {
                        const segmentU = lines[i + 1];
                        if (segmentU.substring(13, 14) === 'U') {
                            const amountPaid = parseInt(segmentU.substring(77, 92)) / 100;
                            const paymentDate = this.parseDate(segmentU.substring(137, 145));
                            const creditDate = this.parseDate(segmentU.substring(145, 153));

                            payments.push({
                                ourNumber,
                                amountPaid,
                                paymentDate,
                                creditDate,
                                authenticationCode: segmentU.substring(92, 112).trim(),
                                paymentChannel: 'cnab_retorno'
                            });
                        }
                    }
                }
            }
        }

        return payments;
    }

    async generateRemittanceFile(boletos: BoletoData[]): Promise<string> {
        // Implementação similar ao BB, adaptada para layout Itaú
        const lines: string[] = [];
        const now = new Date();
        const sequentialFile = Date.now().toString().substring(-6);

        // Header de Arquivo
        lines.push(this.generateHeaderArquivoItau(now, sequentialFile));

        // Header de Lote
        lines.push(this.generateHeaderLoteItau(now, 1));

        let sequentialRecord = 0;

        for (const boleto of boletos) {
            sequentialRecord++;
            lines.push(this.generateSegmentoPItau(boleto, 1, sequentialRecord));

            sequentialRecord++;
            lines.push(this.generateSegmentoQItau(boleto, 1, sequentialRecord));
        }

        // Trailer de Lote
        lines.push(this.generateTrailerLoteItau(1, sequentialRecord + 2));

        // Trailer de Arquivo
        lines.push(this.generateTrailerArquivoItau(1, lines.length + 1));

        return lines.join('\r\n');
    }

    private parseDate(dateStr: string): Date {
        if (!dateStr || dateStr.trim() === '' || dateStr === '00000000') {
            return new Date();
        }
        const day = parseInt(dateStr.substring(0, 2));
        const month = parseInt(dateStr.substring(2, 4)) - 1;
        const year = parseInt(dateStr.substring(4, 8));
        return new Date(year, month, day);
    }

    private generateHeaderArquivoItau(date: Date, sequential: string): string {
        let line = '';
        line += '341'; // Código Itaú
        line += '0000'; // Lote
        line += '0'; // Tipo registro
        line += '         '; // Brancos
        line += '2'; // Tipo inscrição
        line += this.padLeft('', 14, '0'); // CNPJ
        line += this.padRight('', 20); // Brancos
        line += this.padLeft(this.credentials.agency, 5, '0'); // Agência
        line += ' '; // Branco
        line += this.padLeft(this.credentials.account, 12, '0'); // Conta
        line += ' '; // Branco
        line += this.credentials.accountDigit; // DV
        line += this.padRight('', 30); // Nome empresa
        line += this.padRight('BANCO ITAU SA', 30); // Nome banco
        line += '          '; // Brancos
        line += '1'; // Remessa
        line += this.formatDateCNAB(date);
        line += this.formatTimeCNAB(date);
        line += this.padLeft(sequential, 6, '0');
        line += '040'; // Layout
        line += this.padLeft('', 5, '0');
        line += this.padRight('', 54);
        line += '000';
        line += this.padRight('', 12);

        return line.padEnd(240);
    }

    private generateHeaderLoteItau(date: Date, loteNumber: number): string {
        let line = '';
        line += '341';
        line += this.padLeft(loteNumber.toString(), 4, '0');
        line += '1';
        line += 'R';
        line += '01';
        line += '  ';
        line += '040';
        line += ' ';
        line += '2';
        line += this.padLeft('', 15, '0');
        line += this.padRight('', 20);
        line += this.padLeft(this.credentials.agency, 5, '0');
        line += ' ';
        line += this.padLeft(this.credentials.account, 12, '0');
        line += ' ';
        line += this.credentials.accountDigit;
        line += this.padRight('', 30);
        line += this.padRight('', 80);
        line += this.padLeft('', 8, '0');
        line += this.formatDateCNAB(date);
        line += this.padLeft('', 8, '0');
        line += this.padRight('', 33);

        return line.padEnd(240);
    }

    private generateSegmentoPItau(boleto: BoletoData, lote: number, seq: number): string {
        let line = '';
        line += '341';
        line += this.padLeft(lote.toString(), 4, '0');
        line += '3';
        line += this.padLeft(seq.toString(), 5, '0');
        line += 'P';
        line += ' ';
        line += '01';
        line += this.padLeft(this.credentials.agency, 5, '0');
        line += ' ';
        line += this.padLeft(this.credentials.account, 12, '0');
        line += ' ';
        line += this.credentials.accountDigit;
        line += this.padLeft(this.credentials.walletCode, 3, '0');
        line += this.padRight(boleto.ourNumber, 15);
        line += ' ';
        line += '1';
        line += '1';
        line += '2';
        line += '2';
        line += this.padRight(boleto.ourNumber, 15);
        line += this.formatDateCNAB(boleto.dueDate);
        line += this.padLeft(this.formatCurrency(boleto.amount), 15, '0');
        line += this.padLeft('', 5, '0');
        line += ' ';
        line += '99';
        line += 'A';
        line += this.formatDateCNAB(new Date());
        line += '0';
        line += '00000000';
        line += this.padLeft('', 15, '0');
        line += '0';
        line += '00000000';
        line += this.padLeft('', 15, '0');
        line += this.padLeft('', 15, '0');
        line += this.padLeft('', 15, '0');
        line += this.padRight(boleto.ourNumber, 25);
        line += '3';
        line += '00';
        line += '1';
        line += '060';
        line += '09';
        line += this.padLeft('', 10, '0');
        line += ' ';

        return line.padEnd(240);
    }

    private generateSegmentoQItau(boleto: BoletoData, lote: number, seq: number): string {
        let line = '';
        line += '341';
        line += this.padLeft(lote.toString(), 4, '0');
        line += '3';
        line += this.padLeft(seq.toString(), 5, '0');
        line += 'Q';
        line += ' ';
        line += '01';
        line += boleto.payer.document.length === 11 ? '1' : '2';
        line += this.padLeft(this.formatDocument(boleto.payer.document), 15, '0');
        line += this.padRight(boleto.payer.name, 40);
        line += this.padRight(boleto.payer.address.street + ', ' + boleto.payer.address.number, 40);
        line += this.padRight(boleto.payer.address.neighborhood, 15);
        line += this.padLeft(boleto.payer.address.zipcode.replace(/\D/g, ''), 8, '0');
        line += this.padRight(boleto.payer.address.city, 15);
        line += boleto.payer.address.state.substring(0, 2).toUpperCase();
        line += '0';
        line += this.padLeft('', 15, '0');
        line += this.padRight('', 40);
        line += this.padLeft('', 3, '0');
        line += this.padRight('', 20);
        line += this.padRight('', 8);

        return line.padEnd(240);
    }

    private generateTrailerLoteItau(lote: number, totalRecords: number): string {
        let line = '';
        line += '341';
        line += this.padLeft(lote.toString(), 4, '0');
        line += '5';
        line += this.padRight('', 9);
        line += this.padLeft(totalRecords.toString(), 6, '0');
        line += this.padLeft('', 92, '0');
        line += this.padRight('', 125);

        return line.padEnd(240);
    }

    private generateTrailerArquivoItau(totalLotes: number, totalRecords: number): string {
        let line = '';
        line += '341';
        line += '9999';
        line += '9';
        line += this.padRight('', 9);
        line += this.padLeft(totalLotes.toString(), 6, '0');
        line += this.padLeft(totalRecords.toString(), 6, '0');
        line += this.padLeft('', 6, '0');
        line += this.padRight('', 205);

        return line.padEnd(240);
    }

    private formatDateCNAB(date: Date): string {
        const day = this.padLeft(date.getDate().toString(), 2, '0');
        const month = this.padLeft((date.getMonth() + 1).toString(), 2, '0');
        const year = date.getFullYear().toString();
        return `${day}${month}${year}`;
    }

    private formatTimeCNAB(date: Date): string {
        const hours = this.padLeft(date.getHours().toString(), 2, '0');
        const minutes = this.padLeft(date.getMinutes().toString(), 2, '0');
        const seconds = this.padLeft(date.getSeconds().toString(), 2, '0');
        return `${hours}${minutes}${seconds}`;
    }
}
