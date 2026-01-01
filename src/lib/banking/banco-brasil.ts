
import { BankIntegration, BankCredentials, BoletoData, BoletoResponse, PaymentNotification } from './base';
import axios, { AxiosInstance } from 'axios';
import crypto from 'crypto';

interface BBCredentials extends BankCredentials {
    developerKey: string;
    gwAppKey: string;
    agreementNumber: string;
    walletCode: string;
    walletVariation: string;
}

export class BancoBrasilIntegration extends BankIntegration {
    protected bankCode = '001';
    protected bankName = 'Banco do Brasil';
    private api: AxiosInstance;
    // @ts-ignore
    protected credentials: BBCredentials;

    constructor(credentials: BBCredentials) {
        super(credentials);
        this.credentials = credentials;

        this.baseUrl = credentials.environment === 'production'
            ? 'https://api.bb.com.br'
            : 'https://api.sandbox.bb.com.br';

        this.api = axios.create({
            baseURL: this.baseUrl,
            headers: {
                'Content-Type': 'application/json'
            }
        });
    }

    async authenticate(): Promise<void> {
        try {
            const authUrl = this.credentials.environment === 'production'
                ? 'https://oauth.bb.com.br/oauth/token'
                : 'https://oauth.sandbox.bb.com.br/oauth/token';

            const credentials = Buffer.from(
                `${this.credentials.clientId}:${this.credentials.clientSecret}`
            ).toString('base64');

            const response = await axios.post(
                authUrl,
                'grant_type=client_credentials&scope=cobrancas.boletos-info cobrancas.boletos-requisicao',
                {
                    headers: {
                        'Authorization': `Basic ${credentials}`,
                        'Content-Type': 'application/x-www-form-urlencoded'
                    }
                }
            );

            this.accessToken = response.data.access_token;
            this.tokenExpiry = new Date(Date.now() + (response.data.expires_in * 1000) - 60000);

            this.api.defaults.headers.common['Authorization'] = `Bearer ${this.accessToken}`;
            this.api.defaults.headers.common['gw-dev-app-key'] = this.credentials.gwAppKey;

        } catch (error: any) {
            console.error('Erro autenticação BB:', error.response?.data || error.message);
            throw new Error(`Falha na autenticação com Banco do Brasil: ${error.message}`);
        }
    }

    async registerBoleto(data: BoletoData): Promise<BoletoResponse> {
        await this.ensureAuthenticated();

        try {
            const payload = {
                numeroConvenio: parseInt(this.credentials.agreementNumber),
                numeroCarteira: parseInt(this.credentials.walletCode),
                numeroVariacaoCarteira: parseInt(this.credentials.walletVariation),
                codigoModalidade: 1, // Simples com registro
                dataEmissao: new Date().toISOString().split('T')[0].replace(/-/g, '.'),
                dataVencimento: data.dueDate.toISOString().split('T')[0].replace(/-/g, '.'),
                valorOriginal: data.amount,
                valorAbatimento: 0,
                quantidadeDiasProtesto: 0,
                quantidadeDiasNegativacao: 0,
                orgaoNegativador: 0,
                indicadorAceiteTituloVencido: 'S',
                numeroDiasLimiteRecebimento: 30,
                codigoAceite: 'A',
                codigoTipoTitulo: 2, // DM - Duplicata Mercantil
                descricaoTipoTitulo: 'DUPLICATA MERCANTIL',
                indicadorPermissaoRecebimentoParcial: 'N',
                numeroTituloBeneficiario: data.ourNumber,
                campoUtilizacaoBeneficiario: '',
                numeroTituloCliente: this.generateNossoNumero(data.ourNumber),
                mensagemBloquetoOcorrencia: data.instructions?.join(' ') || '',

                // Desconto
                desconto: data.discountAmount ? {
                    tipo: 1, // Valor fixo
                    dataExpiracao: data.discountDueDate?.toISOString().split('T')[0].replace(/-/g, '.'),
                    valor: data.discountAmount
                } : undefined,

                // Juros
                jurosMora: data.interestPercentage ? {
                    tipo: 2, // Percentual ao mês
                    porcentagem: data.interestPercentage
                } : undefined,

                // Multa
                multa: data.finePercentage ? {
                    tipo: 2, // Percentual
                    data: data.dueDate.toISOString().split('T')[0].replace(/-/g, '.'),
                    porcentagem: data.finePercentage
                } : undefined,

                // Pagador
                pagador: {
                    tipoInscricao: data.payer.document.length === 11 ? 1 : 2, // 1=CPF, 2=CNPJ
                    numeroInscricao: parseInt(this.formatDocument(data.payer.document)),
                    nome: data.payer.name.substring(0, 60),
                    endereco: data.payer.address.street.substring(0, 60),
                    cep: parseInt(data.payer.address.zipcode.replace(/\D/g, '')),
                    cidade: data.payer.address.city.substring(0, 60),
                    bairro: data.payer.address.neighborhood.substring(0, 60),
                    uf: data.payer.address.state.substring(0, 2),
                    telefone: data.payer.phone?.replace(/\D/g, '') || ''
                },

                // QR Code PIX
                indicadorPix: 'S'
            };

            const response = await this.api.post(
                '/cobrancas/v2/boletos',
                payload,
                {
                    params: {
                        'gw-dev-app-key': this.credentials.gwAppKey
                    }
                }
            );

            return {
                success: true,
                barcode: response.data.codigoBarraNumerico,
                digitableLine: response.data.linhaDigitavel,
                boletoUrl: response.data.urlBoletoGeracao,
                pixQrCode: response.data.qrCode?.emv,
                pixCopyPaste: response.data.qrCode?.url,
                bankResponse: response.data
            };

        } catch (error: any) {
            console.error('Erro registro boleto BB:', error.response?.data || error.message);
            return {
                success: false,
                errorMessage: error.response?.data?.erros?.[0]?.mensagem || error.message,
                bankResponse: error.response?.data
            };
        }
    }

    async cancelBoleto(ourNumber: string): Promise<boolean> {
        await this.ensureAuthenticated();

        try {
            const nossoNumero = this.generateNossoNumero(ourNumber);

            await this.api.post(
                `/cobrancas/v2/boletos/${nossoNumero}/baixar`,
                {},
                {
                    params: {
                        'gw-dev-app-key': this.credentials.gwAppKey,
                        numeroConvenio: this.credentials.agreementNumber
                    }
                }
            );

            return true;
        } catch (error: any) {
            console.error('Erro cancelamento boleto BB:', error.response?.data || error.message);
            return false;
        }
    }

    async getBoletoStatus(ourNumber: string): Promise<string> {
        await this.ensureAuthenticated();

        try {
            const nossoNumero = this.generateNossoNumero(ourNumber);

            const response = await this.api.get(
                `/cobrancas/v2/boletos/${nossoNumero}`,
                {
                    params: {
                        'gw-dev-app-key': this.credentials.gwAppKey,
                        numeroConvenio: this.credentials.agreementNumber
                    }
                }
            );

            const situacao = response.data.codigoEstadoTituloCobranca;

            const statusMap: Record<string, string> = {
                '1': 'normal',
                '2': 'movimento_cartorio',
                '3': 'em_cartorio',
                '4': 'titulo_com_ocorrencia',
                '5': 'protestado_eletronico',
                '6': 'liquidado',
                '7': 'baixado',
                '8': 'titulo_com_pendencia_cartorio',
                '9': 'titulo_protestado_manual',
                '10': 'titulo_baixado_pago_cartorio',
                '11': 'titulo_liquidado_protestado',
                '12': 'titulo_liquidado_pgcrto',
                '13': 'titulo_protestado_aguardando_baixa',
                '14': 'titulo_em_liquidacao',
                '15': 'titulo_agendado',
                '16': 'titulo_creditado',
                '17': 'pago_em_cheque_aguardando_liquidacao',
                '18': 'pago_parcialmente',
                '21': 'titulo_em_aberto_vencido'
            };

            return statusMap[situacao] || 'desconhecido';
        } catch (error: any) {
            console.error('Erro consulta boleto BB:', error.response?.data || error.message);
            throw error;
        }
    }

    async generatePixQrCode(data: BoletoData): Promise<{ qrCode: string; copyPaste: string }> {
        // O PIX já é gerado junto com o boleto no BB
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

        for (const line of lines) {
            if (line.length < 240) continue;

            const recordType = line.substring(7, 8);
            const segmentType = line.substring(13, 14);

            // Segmento T - Título
            if (recordType === '3' && segmentType === 'T') {
                const movementCode = line.substring(15, 17);

                // 06 = Liquidação
                if (movementCode === '06') {
                    const ourNumber = line.substring(37, 57).trim();
                    const paymentDate = this.parseDate(line.substring(145, 153));

                    // Próxima linha deve ser Segmento U com valores
                    const nextLineIndex = lines.indexOf(line) + 1;
                    if (nextLineIndex < lines.length) {
                        const segmentU = lines[nextLineIndex];
                        if (segmentU.substring(13, 14) === 'U') {
                            const amountPaid = parseInt(segmentU.substring(77, 92)) / 100;
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
        const lines: string[] = [];
        const now = new Date();
        const sequentialFile = Date.now().toString().substring(0, 6); // FIX: -6 to 0,6 for safety

        // Header de Arquivo
        lines.push(this.generateHeaderArquivo(now, sequentialFile));

        // Header de Lote
        lines.push(this.generateHeaderLote(now, 1));

        let sequentialRecord = 0;

        for (const boleto of boletos) {
            sequentialRecord++;

            // Segmento P
            lines.push(this.generateSegmentoP(boleto, 1, sequentialRecord));

            sequentialRecord++;

            // Segmento Q
            lines.push(this.generateSegmentoQ(boleto, 1, sequentialRecord));

            sequentialRecord++;

            // Segmento R (opcional - desconto/multa/juros)
            if (boleto.discountAmount || boleto.finePercentage || boleto.interestPercentage) {
                lines.push(this.generateSegmentoR(boleto, 1, sequentialRecord));
                sequentialRecord++;
            }
        }

        // Trailer de Lote
        lines.push(this.generateTrailerLote(1, sequentialRecord + 2));

        // Trailer de Arquivo
        lines.push(this.generateTrailerArquivo(1, lines.length + 1));

        return lines.join('\r\n');
    }

    // Métodos auxiliares privados
    private generateNossoNumero(ourNumber: string): string {
        const convenio = this.credentials.agreementNumber.padStart(7, '0');
        const numero = ourNumber.padStart(10, '0');
        return `${convenio}${numero}`;
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

    private generateHeaderArquivo(date: Date, sequential: string): string {
        let line = '';
        line += '001'; // Código do banco
        line += '0000'; // Lote
        line += '0'; // Tipo registro
        line += '         '; // Brancos
        line += '2'; // Tipo inscrição (CNPJ)
        line += this.padLeft('', 14, '0'); // CNPJ beneficiário
        line += this.padRight(this.credentials.agreementNumber, 20); // Convênio
        line += this.padLeft('', 5, '0'); // Agência
        line += ' '; // DV agência
        line += this.padLeft('', 12, '0'); // Conta
        line += ' '; // DV conta
        line += ' '; // DV agência/conta
        line += this.padRight('', 30); // Nome empresa
        line += this.padRight('BANCO DO BRASIL', 30); // Nome banco
        line += '          '; // Brancos
        line += '1'; // Código remessa
        line += this.formatDateCNAB(date); // Data geração
        line += this.formatTimeCNAB(date); // Hora geração
        line += this.padLeft(sequential, 6, '0'); // Sequencial arquivo
        line += '089'; // Layout
        line += this.padLeft('', 5, '0'); // Densidade
        line += this.padRight('', 20); // Reservado banco
        line += this.padRight('', 20); // Reservado empresa
        line += this.padRight('', 29); // Brancos

        return line.padEnd(240);
    }

    private generateHeaderLote(date: Date, loteNumber: number): string {
        let line = '';
        line += '001'; // Código banco
        line += this.padLeft(loteNumber.toString(), 4, '0'); // Lote
        line += '1'; // Tipo registro
        line += 'R'; // Operação
        line += '01'; // Serviço
        line += '  '; // Brancos
        line += '045'; // Layout lote
        line += ' '; // Branco
        line += '2'; // Tipo inscrição
        line += this.padLeft('', 15, '0'); // CNPJ
        line += this.padRight(this.credentials.agreementNumber, 20); // Convênio
        line += this.padLeft('', 5, '0'); // Agência
        line += ' '; // DV
        line += this.padLeft('', 12, '0'); // Conta
        line += ' '; // DV
        line += ' '; // DV ag/conta
        line += this.padRight('', 30); // Nome empresa
        line += this.padRight('', 40); // Mensagem 1
        line += this.padRight('', 40); // Mensagem 2
        line += this.padLeft('', 8, '0'); // Número remessa
        line += this.formatDateCNAB(date); // Data gravação
        line += this.padLeft('', 8, '0'); // Data crédito
        line += this.padRight('', 33); // Brancos

        return line.padEnd(240);
    }

    private generateSegmentoP(boleto: BoletoData, lote: number, seq: number): string {
        let line = '';
        line += '001'; // Banco
        line += this.padLeft(lote.toString(), 4, '0'); // Lote
        line += '3'; // Tipo registro
        line += this.padLeft(seq.toString(), 5, '0'); // Sequencial
        line += 'P'; // Segmento
        line += ' '; // Branco
        line += '01'; // Movimento (entrada)
        line += this.padLeft('', 5, '0'); // Agência
        line += ' '; // DV
        line += this.padLeft('', 12, '0'); // Conta
        line += ' '; // DV
        line += ' '; // DV ag/conta
        line += this.padRight(this.generateNossoNumero(boleto.ourNumber), 20); // Nosso número
        line += this.padLeft(this.credentials.walletCode, 1, '0'); // Carteira
        line += '1'; // Cadastramento
        line += '1'; // Documento
        line += '2'; // Emissão boleto
        line += '2'; // Distribuição
        line += this.padRight(boleto.ourNumber, 15); // Seu número
        line += this.formatDateCNAB(boleto.dueDate); // Vencimento
        line += this.padLeft(this.formatCurrency(boleto.amount), 15, '0'); // Valor
        line += this.padLeft('', 5, '0'); // Agência cobradora
        line += ' '; // DV
        line += '02'; // Espécie
        line += 'A'; // Aceite
        line += this.formatDateCNAB(new Date()); // Data emissão
        line += '0'; // Juros
        line += '00000000'; // Data juros
        line += this.padLeft('', 15, '0'); // Valor juros
        line += '0'; // Desconto
        line += '00000000'; // Data desconto
        line += this.padLeft('', 15, '0'); // Valor desconto
        line += this.padLeft('', 15, '0'); // Valor IOF
        line += this.padLeft('', 15, '0'); // Valor abatimento
        line += this.padRight(boleto.ourNumber, 25); // Identificação
        line += '0'; // Protesto
        line += '00'; // Prazo protesto
        line += '0'; // Baixa
        line += '   '; // Prazo baixa
        line += '09'; // Moeda
        line += this.padLeft('', 10, '0'); // Contrato
        line += ' '; // Branco

        return line.padEnd(240);
    }

    private generateSegmentoQ(boleto: BoletoData, lote: number, seq: number): string {
        let line = '';
        line += '001'; // Banco
        line += this.padLeft(lote.toString(), 4, '0'); // Lote
        line += '3'; // Tipo registro
        line += this.padLeft(seq.toString(), 5, '0'); // Sequencial
        line += 'Q'; // Segmento
        line += ' '; // Branco
        line += '01'; // Movimento
        line += boleto.payer.document.length === 11 ? '1' : '2'; // Tipo inscrição
        line += this.padLeft(this.formatDocument(boleto.payer.document), 15, '0'); // CPF/CNPJ
        line += this.padRight(boleto.payer.name, 40); // Nome
        line += this.padRight(boleto.payer.address.street + ', ' + boleto.payer.address.number, 40); // Endereço
        line += this.padRight(boleto.payer.address.neighborhood, 15); // Bairro
        line += this.padLeft(boleto.payer.address.zipcode.replace(/\D/g, ''), 8, '0'); // CEP
        line += this.padRight(boleto.payer.address.city, 15); // Cidade
        line += boleto.payer.address.state.substring(0, 2).toUpperCase(); // UF
        line += '0'; // Tipo inscrição sacador
        line += this.padLeft('', 15, '0'); // CPF/CNPJ sacador
        line += this.padRight('', 40); // Nome sacador
        line += this.padLeft('', 3, '0'); // Banco correspondente
        line += this.padRight('', 20); // Nosso número correspondente
        line += this.padRight('', 8); // Brancos

        return line.padEnd(240);
    }

    private generateSegmentoR(boleto: BoletoData, lote: number, seq: number): string {
        let line = '';
        line += '001'; // Banco
        line += this.padLeft(lote.toString(), 4, '0'); // Lote
        line += '3'; // Tipo registro
        line += this.padLeft(seq.toString(), 5, '0'); // Sequencial
        line += 'R'; // Segmento
        line += ' '; // Branco
        line += '01'; // Movimento

        // Desconto 2
        line += '0'; // Código desconto 2
        line += '00000000'; // Data desconto 2
        line += this.padLeft('', 15, '0'); // Valor desconto 2

        // Desconto 3
        line += '0'; // Código desconto 3
        line += '00000000'; // Data desconto 3
        line += this.padLeft('', 15, '0'); // Valor desconto 3

        // Multa
        if (boleto.finePercentage && boleto.finePercentage > 0) {
            line += '2'; // Tipo multa (percentual)
            line += this.formatDateCNAB(boleto.dueDate); // Data multa
            line += this.padLeft(this.formatCurrency(boleto.finePercentage), 15, '0'); // Percentual
        } else {
            line += '0';
            line += '00000000';
            line += this.padLeft('', 15, '0');
        }

        line += this.padRight('', 10); // Informação pagador
        line += this.padRight('', 40); // Mensagem 3
        line += this.padRight('', 40); // Mensagem 4
        line += this.padRight(boleto.payer.email || '', 50); // E-mail pagador
        line += this.padRight('', 11); // Brancos

        return line.padEnd(240);
    }

    private generateTrailerLote(lote: number, totalRecords: number): string {
        let line = '';
        line += '001'; // Banco
        line += this.padLeft(lote.toString(), 4, '0'); // Lote
        line += '5'; // Tipo registro
        line += this.padRight('', 9); // Brancos
        line += this.padLeft(totalRecords.toString(), 6, '0'); // Quantidade registros
        line += this.padLeft('', 6, '0'); // Quantidade títulos
        line += this.padLeft('', 17, '0'); // Valor total
        line += this.padLeft('', 6, '0'); // Quantidade títulos
        line += this.padLeft('', 17, '0'); // Valor total
        line += this.padLeft('', 6, '0'); // Quantidade títulos
        line += this.padLeft('', 17, '0'); // Valor total
        line += this.padLeft('', 6, '0'); // Quantidade títulos
        line += this.padLeft('', 17, '0'); // Valor total
        line += this.padRight('', 8); // Número aviso
        line += this.padRight('', 117); // Brancos

        return line.padEnd(240);
    }

    private generateTrailerArquivo(totalLotes: number, totalRecords: number): string {
        let line = '';
        line += '001'; // Banco
        line += '9999'; // Lote
        line += '9'; // Tipo registro
        line += this.padRight('', 9); // Brancos
        line += this.padLeft(totalLotes.toString(), 6, '0'); // Quantidade lotes
        line += this.padLeft(totalRecords.toString(), 6, '0'); // Quantidade registros
        line += this.padLeft('', 6, '0'); // Quantidade contas
        line += this.padRight('', 205); // Brancos

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
