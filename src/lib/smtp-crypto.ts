import crypto from 'crypto';

// Chave de criptografia - deve ser definida nas variáveis de ambiente
const ENCRYPTION_KEY = process.env.SMTP_ENCRYPTION_KEY || 'default-key-change-in-production!';

// Garantir que a chave tem 32 bytes para AES-256
function getKey(): Buffer {
    const key = ENCRYPTION_KEY;
    // SHA-256 para garantir 32 bytes
    return crypto.createHash('sha256').update(key).digest();
}

/**
 * Criptografa a senha SMTP usando AES-256-GCM
 */
export function encryptPassword(password: string): string {
    const key = getKey();
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

    let encrypted = cipher.update(password, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();

    // Formato: iv:authTag:encrypted
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

/**
 * Decripta a senha SMTP
 */
export function decryptPassword(encryptedData: string): string {
    try {
        const key = getKey();
        const parts = encryptedData.split(':');

        if (parts.length !== 3) {
            throw new Error('Formato de dados criptografados inválido');
        }

        const iv = Buffer.from(parts[0], 'hex');
        const authTag = Buffer.from(parts[1], 'hex');
        const encrypted = parts[2];

        const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
        decipher.setAuthTag(authTag);

        let decrypted = decipher.update(encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');

        return decrypted;
    } catch (error) {
        console.error('Erro ao decriptar senha:', error);
        throw new Error('Falha ao decriptar senha SMTP');
    }
}

/**
 * Verifica se uma string está criptografada no formato esperado
 */
export function isEncrypted(value: string): boolean {
    const parts = value.split(':');
    return parts.length === 3 && parts[0].length === 32 && parts[1].length === 32;
}
