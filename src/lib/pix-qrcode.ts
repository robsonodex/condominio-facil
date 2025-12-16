/**
 * Gerador de QR Code PIX - Padrão EMV/BR Code
 * Gera payload para PIX estático (sem valor ou com valor fixo)
 */

// Calcula CRC16 CCITT-FALSE (usado no PIX)
function crc16(str: string): string {
    let crc = 0xFFFF;
    const polynomial = 0x1021;

    for (let i = 0; i < str.length; i++) {
        crc ^= str.charCodeAt(i) << 8;
        for (let j = 0; j < 8; j++) {
            if (crc & 0x8000) {
                crc = (crc << 1) ^ polynomial;
            } else {
                crc <<= 1;
            }
        }
        crc &= 0xFFFF;
    }

    return crc.toString(16).toUpperCase().padStart(4, '0');
}

// Formata campo TLV (Type-Length-Value)
function formatTLV(id: string, value: string): string {
    const length = value.length.toString().padStart(2, '0');
    return `${id}${length}${value}`;
}

// Remove acentos e caracteres especiais
function removeAccents(str: string): string {
    return str
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-zA-Z0-9 ]/g, '')
        .toUpperCase()
        .substring(0, 25); // Limite de caracteres do PIX
}

interface PixParams {
    chave: string;
    nome: string;
    cidade: string;
    valor?: number;
    descricao?: string;
    txid?: string;
}

/**
 * Gera o payload do PIX para QR Code
 */
export function gerarPixPayload(params: PixParams): string {
    const { chave, nome, cidade, valor, descricao, txid } = params;

    // ID 00 - Payload Format Indicator (fixo)
    let payload = formatTLV('00', '01');

    // ID 26 - Merchant Account Information (chave PIX)
    const gui = formatTLV('00', 'br.gov.bcb.pix');
    const key = formatTLV('01', chave);
    let merchantInfo = gui + key;

    if (descricao) {
        merchantInfo += formatTLV('02', removeAccents(descricao).substring(0, 25));
    }

    payload += formatTLV('26', merchantInfo);

    // ID 52 - Merchant Category Code (0000 = não especificado)
    payload += formatTLV('52', '0000');

    // ID 53 - Transaction Currency (986 = BRL)
    payload += formatTLV('53', '986');

    // ID 54 - Transaction Amount (opcional)
    if (valor && valor > 0) {
        payload += formatTLV('54', valor.toFixed(2));
    }

    // ID 58 - Country Code
    payload += formatTLV('58', 'BR');

    // ID 59 - Merchant Name
    payload += formatTLV('59', removeAccents(nome));

    // ID 60 - Merchant City
    // Cidade deve ter no máximo 15 caracteres segundo a spec do BR Code
    payload += formatTLV('60', removeAccents(cidade).substring(0, 15));

    // ID 62 - Additional Data Field Template
    if (txid) {
        const additionalData = formatTLV('05', txid.substring(0, 25));
        payload += formatTLV('62', additionalData);
    } else {
        payload += formatTLV('62', formatTLV('05', '***'));
    }

    // ID 63 - CRC16 (checksum)
    // Adiciona o prefixo do campo CRC (6304) antes de calcular
    payload += '6304';
    const crc = crc16(payload);
    payload += crc;

    return payload;
}

/**
 * Gera URL para QR Code usando API pública
 */
export function gerarPixQRCodeUrl(payload: string, size: number = 256): string {
    const encoded = encodeURIComponent(payload);
    return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encoded}`;
}

/**
 * Valida chave PIX
 */
export function validarChavePix(tipo: string, chave: string): { valido: boolean; erro?: string } {
    switch (tipo) {
        case 'cpf':
            if (!/^\d{11}$/.test(chave.replace(/\D/g, ''))) {
                return { valido: false, erro: 'CPF deve ter 11 dígitos' };
            }
            break;
        case 'cnpj':
            if (!/^\d{14}$/.test(chave.replace(/\D/g, ''))) {
                return { valido: false, erro: 'CNPJ deve ter 14 dígitos' };
            }
            break;
        case 'email':
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(chave)) {
                return { valido: false, erro: 'Email inválido' };
            }
            break;
        case 'telefone':
            if (!/^\+55\d{10,11}$/.test(chave.replace(/\D/g, '').replace(/^55/, '+55'))) {
                return { valido: false, erro: 'Telefone deve estar no formato +5511999999999' };
            }
            break;
        case 'aleatoria':
            if (chave.length < 20 || chave.length > 36) {
                return { valido: false, erro: 'Chave aleatória deve ter entre 20 e 36 caracteres' };
            }
            break;
        default:
            return { valido: false, erro: 'Tipo de chave inválido' };
    }
    return { valido: true };
}

/**
 * Formata chave PIX para exibição
 */
export function formatarChavePix(tipo: string, chave: string): string {
    switch (tipo) {
        case 'cpf':
            const cpf = chave.replace(/\D/g, '');
            return `${cpf.slice(0, 3)}.${cpf.slice(3, 6)}.${cpf.slice(6, 9)}-${cpf.slice(9)}`;
        case 'cnpj':
            const cnpj = chave.replace(/\D/g, '');
            return `${cnpj.slice(0, 2)}.${cnpj.slice(2, 5)}.${cnpj.slice(5, 8)}/${cnpj.slice(8, 12)}-${cnpj.slice(12)}`;
        case 'telefone':
            const tel = chave.replace(/\D/g, '');
            return `+${tel.slice(0, 2)} (${tel.slice(2, 4)}) ${tel.slice(4, 9)}-${tel.slice(9)}`;
        default:
            return chave;
    }
}
