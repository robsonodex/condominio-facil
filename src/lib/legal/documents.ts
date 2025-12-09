// Biblioteca para manipulação de documentos legais e cálculo de hash

import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

export interface LegalDocument {
    type: 'termos_uso' | 'politica_privacidade' | 'contrato_plano' | 'politica_cobranca';
    version: string;
    updated_at: string;
    hash: string;
    content: string;
}

// Calcular hash SHA256 de um conteúdo
export async function calculateHash(content: string): Promise<string> {
    const hash = crypto.createHash('sha256');
    hash.update(content, 'utf8');
    return hash.digest('hex');
}

// Carregar documento legal do sistema de arquivos
export async function loadLegalDocument(
    documentType: string,
    version: string = '1.0'
): Promise<LegalDocument | null> {
    try {
        const legalDir = path.join(process.cwd(), 'legal');
        let filename = '';

        switch (documentType) {
            case 'termos_uso':
                filename = `termos_uso_v${version}.md`;
                break;
            case 'politica_privacidade':
                filename = `politica_privacidade_v${version}.md`;
                break;
            case 'contrato_plano':
                // Será especificado pelo plano do usuário
                filename = `contrato_plano_${version}.md`;
                break;
            case 'politica_cobranca':
                filename = `politica_cobranca_v${version}.md`;
                break;
            default:
                return null;
        }

        const filePath = path.join(legalDir, filename);
        const content = await fs.readFile(filePath, 'utf-8');
        const hash = await calculateHash(content);

        // Extrair data de atualização do conteúdo (se disponível)
        const dateMatch = content.match(/\*\*Data de Atualização:\*\* (.+)/);
        const updated_at = dateMatch ? dateMatch[1] : new Date().toISOString();

        return {
            type: documentType as any,
            version,
            updated_at,
            hash,
            content
        };
    } catch (error) {
        console.error(`Error loading legal document: ${documentType}`, error);
        return null;
    }
}

// Carregar contrato específico por plano
export async function loadContractByPlan(
    planName: string,
    version: string = '1.0'
): Promise<LegalDocument | null> {
    try {
        const legalDir = path.join(process.cwd(), 'legal');

        // Normalizar nome do plano
        const normalizedPlan = planName.toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, ''); // Remove acentos

        let filename = '';

        if (normalizedPlan.includes('basico')) {
            filename = `contrato_plano_basico_v${version}.md`;
        } else if (normalizedPlan.includes('profissional') || normalizedPlan.includes('intermediario')) {
            filename = `contrato_plano_profissional_v${version}.md`;
        } else if (normalizedPlan.includes('avancado')) {
            filename = `contrato_plano_avancado_v${version}.md`;
        } else {
            // Padrão: Básico
            filename = `contrato_plano_basico_v${version}.md`;
        }

        const filePath = path.join(legalDir, filename);
        const content = await fs.readFile(filePath, 'utf-8');
        const hash = await calculateHash(content);

        const dateMatch = content.match(/\*\*Data de Atualização:\*\* (.+)/);
        const updated_at = dateMatch ? dateMatch[1] : new Date().toISOString();

        return {
            type: 'contrato_plano',
            version,
            updated_at,
            hash,
            content
        };
    } catch (error) {
        console.error(`Error loading contract for plan: ${planName}`, error);
        return null;
    }
}

// Carregar todos os documentos obrigatórios para um usuário
export async function loadRequiredDocuments(
    planName: string,
    version: string = '1.0'
): Promise<LegalDocument[]> {
    const documents: LegalDocument[] = [];

    // Termos de Uso
    const termos = await loadLegalDocument('termos_uso', version);
    if (termos) documents.push(termos);

    // Política de Privacidade
    const privacidade = await loadLegalDocument('politica_privacidade', version);
    if (privacidade) documents.push(privacidade);

    // Contrato do Plano
    const contrato = await loadContractByPlan(planName, version);
    if (contrato) documents.push(contrato);

    // Política de Cobrança (opcional, mas recomendado)
    const cobranca = await loadLegalDocument('politica_cobranca', version);
    if (cobranca) documents.push(cobranca);

    return documents;
}

// Validar hash de documento
export async function validateDocumentHash(
    content: string,
    expectedHash: string
): Promise<boolean> {
    const actualHash = await calculateHash(content);
    return actualHash === expectedHash;
}

// Obter IP do cliente do request
export function getClientIP(request: Request): string {
    // Tentar obter de headers de proxy
    const forwardedFor = request.headers.get('x-forwarded-for');
    if (forwardedFor) {
        return forwardedFor.split(',')[0].trim();
    }

    const realIP = request.headers.get('x-real-ip');
    if (realIP) {
        return realIP.trim();
    }

    // Cloudflare
    const cfConnectingIP = request.headers.get('cf-connecting-ip');
    if (cfConnectingIP) {
        return cfConnectingIP.trim();
    }

    return 'unknown';
}

// Formatar documento para exibição (remover metadados)
export function formatDocumentForDisplay(content: string): string {
    // Remover linhas de versão e hash gerado automaticamente
    return content
        .replace(/\*\*Hash do Documento:\*\* \[Calculado automaticamente\]/g, '')
        .replace(/\*\*IP do Aceite:\*\* \[Registrado automaticamente\]/g, '')
        .replace(/\*\*Data do Aceite:\*\* \[Gerado automaticamente\]/g, '')
        .trim();
}
