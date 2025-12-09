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
    planName: string = 'Básico',
    version: string = '1.0'
): Promise<LegalDocument[]> {
    const timestamp = new Date().toISOString();

    return [
        {
            type: 'termos_uso',
            version,
            updated_at: timestamp,
            hash: await calculateHash(getTermosUsoContent()),
            content: getTermosUsoContent()
        },
        {
            type: 'politica_privacidade',
            version,
            updated_at: timestamp,
            hash: await calculateHash(getPoliticaPrivacidadeContent()),
            content: getPoliticaPrivacidadeContent()
        },
        {
            type: 'contrato_plano',
            version,
            updated_at: timestamp,
            hash: await calculateHash(getContratoPlanoContent(planName)),
            content: getContratoPlanoContent(planName)
        },
        {
            type: 'politica_cobranca',
            version,
            updated_at: timestamp,
            hash: await calculateHash(getPoliticaCobrancaContent()),
            content: getPoliticaCobrancaContent()
        }
    ];
}

// Funções de conteúdo dos documentos
function getTermosUsoContent(): string {
    return `# Termos de Uso - Condomínio Fácil

## 1. Aceitação dos Termos
Ao acessar e usar o sistema Condomínio Fácil, você concorda em cumprir estes Termos de Uso.

## 2. Descrição do Serviço
Plataforma SaaS para gestão condominial oferecendo gestão financeira, comunicação, controle de acesso e relatórios.

## 3. Responsabilidades do Usuário
Você deve fornecer informações precisas, manter a segurança da sua senha e não utilizar o sistema para fins ilícitos.

## 4. Propriedade Intelectual
Todo o conteúdo é propriedade exclusiva da empresa Condomínio Fácil.

## 5. Limitação de Responsabilidade
O serviço é fornecido "como está". Não garantimos disponibilidade ininterrupta.

**Data de vigência**: Janeiro de 2024`;
}

function getPoliticaPrivacidadeContent(): string {
    return `# Política de Privacidade - Condomínio Fácil

## 1. Introdução
Coletamos e protegemos seus dados em conformidade com a LGPD (Lei 13.709/2018).

## 2. Dados Coletados
Dados cadastrais, do condomínio, financeiros e de uso do sistema.

## 3. Finalidade
Prestação do serviço, comunicação, processamento financeiro e melhorias.

## 4. Segurança
Criptografia, controle de acesso (RLS), backups e monitoramento.

## 5. Seus Direitos (LGPD)
Acesso, correção, exclusão e revogação de consentimento. Contato: privacidade@condominiofacil.com.br

**Última atualização**: Janeiro de 2024`;
}

function getContratoPlanoContent(planName: string): string {
    const plans: Record<string, { price: string; features: string }> = {
        'Premium': {
            price: 'R$ 299,90/mês',
            features: 'Unidades e usuários ilimitados, 100GB storage, suporte prioritário, relatórios avançados'
        },
        'Profissional': {
            price: 'R$ 149,90/mês',
            features: 'Até 100 unidades, 20 usuários, 50GB storage, suporte padrão, relatórios completos'
        },
        'Básico': {
            price: 'R$ 79,90/mês',
            features: 'Até 30 unidades, 5 usuários, 20GB storage, suporte email, relatórios básicos'
        }
    };

    const plan = plans[planName] || plans['Básico'];

    return `# Contrato do Plano ${planName}

## 1. Partes
CONTRATANTE: Seu condomínio | CONTRATADA: Condomínio Fácil Tecnologia Ltda.

## 2. Recursos do Plano ${planName}
${plan.features}

## 3. Valor e Vigência
**Valor**: ${plan.price} | **Vigência**: 12 meses (renovação automática)

## 4. SLA
Disponibilidade 99,5%, backup diário, suporte conforme plano.

**Assinado digitalmente ao aceitar.**`;
}

function getPoliticaCobrancaContent(): string {
    return `# Política de Cobrança

## 1. Formas de Pagamento
Cartão de crédito, boleto (dia 10) e PIX.

## 2. Atraso
Tolerância de 5 dias. Após 15 dias: suspensão.

## 3. Multas
Multa 2% + juros 1% ao mês.

## 4. Cancelamento
Aviso 30 dias, sem reembolso de valores pagos.

**Contato**: financeiro@condominiofacil.com.br`;
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
