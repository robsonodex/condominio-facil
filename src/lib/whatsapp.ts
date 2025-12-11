/**
 * Utilitário para geração de links e mensagens WhatsApp
 */

const WHATSAPP_BASE_URL = 'https://wa.me';

interface WhatsAppConfig {
    phone: string; // Formato: 5511999999999
    message: string;
}

// Formatar número de telefone para WhatsApp
export function formatPhoneForWhatsApp(phone: string): string {
    // Remove tudo que não é número
    const cleaned = phone.replace(/\D/g, '');

    // Se começa com 0, remove
    const withoutZero = cleaned.startsWith('0') ? cleaned.slice(1) : cleaned;

    // Se não tem código do país, adiciona 55 (Brasil)
    if (withoutZero.length <= 11) {
        return `55${withoutZero}`;
    }

    return withoutZero;
}

// Gerar link WhatsApp
export function generateWhatsAppLink(config: WhatsAppConfig): string {
    const phone = formatPhoneForWhatsApp(config.phone);
    const encodedMessage = encodeURIComponent(config.message);
    return `${WHATSAPP_BASE_URL}/${phone}?text=${encodedMessage}`;
}

// Templates de mensagens
export const WhatsAppTemplates = {
    // Cobrança
    cobranca: (params: { nome: string; valor: string; vencimento: string; linkPagamento: string }) =>
        `Olá ${params.nome}! 👋

💰 *Cobrança Condomínio*

Valor: *${params.valor}*
Vencimento: *${params.vencimento}*

Clique para pagar:
${params.linkPagamento}

Dúvidas? Responda esta mensagem.

_Condomínio Fácil_`,

    // Confirmação de reserva
    reservaConfirmada: (params: { nome: string; area: string; data: string; horario: string }) =>
        `Olá ${params.nome}! ✅

Sua reserva foi *confirmada*!

📍 *${params.area}*
📅 ${params.data}
🕐 ${params.horario}

Lembre-se das regras de uso do espaço.

_Condomínio Fácil_`,

    // Reserva pendente de aprovação
    reservaPendente: (params: { nome: string; area: string; data: string }) =>
        `Olá ${params.nome}! ⏳

Sua solicitação de reserva foi recebida:

📍 *${params.area}*
📅 ${params.data}

Aguarde a aprovação do síndico.

_Condomínio Fácil_`,

    // Aviso do síndico
    avisoSindico: (params: { titulo: string; mensagem: string }) =>
        `📢 *AVISO DO SÍNDICO*

*${params.titulo}*

${params.mensagem}

_Condomínio Fácil_`,

    // Visitante autorizado
    visitanteAutorizado: (params: { nome: string; visitante: string; data: string }) =>
        `Olá ${params.nome}! 👋

Um visitante foi autorizado em sua unidade:

👤 *${params.visitante}*
📅 ${params.data}

_Portaria - Condomínio Fácil_`,

    // Lembrete de pagamento
    lembretePagamento: (params: { nome: string; valor: string; diasAtraso: number; linkPagamento: string }) =>
        `Olá ${params.nome}! ⚠️

Identificamos um pagamento pendente há *${params.diasAtraso} dias*.

Valor: *${params.valor}*

Evite juros e multas, regularize agora:
${params.linkPagamento}

_Condomínio Fácil_`,

    // Boas-vindas morador
    boasVindas: (params: { nome: string; condoNome: string; linkAcesso: string }) =>
        `Olá ${params.nome}! 🎉

Bem-vindo ao *${params.condoNome}*!

Seu acesso ao Condomínio Fácil está liberado:
${params.linkAcesso}

Qualquer dúvida, fale com a administração.

_Condomínio Fácil_`,
};

// Abrir WhatsApp com mensagem
export function openWhatsApp(phone: string, message: string): void {
    const link = generateWhatsAppLink({ phone, message });
    window.open(link, '_blank');
}

// Criar link de cobrança PIX
export function createPixPaymentMessage(params: {
    nome: string;
    valor: number;
    descricao: string;
    pixCode?: string;
}): string {
    const valorFormatado = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(params.valor);

    let message = `💳 *Pagamento via PIX*

${params.descricao}
Valor: *${valorFormatado}*

`;

    if (params.pixCode) {
        message += `Código PIX (Copia e Cola):
\`\`\`
${params.pixCode}
\`\`\`

`;
    }

    message += `_Condomínio Fácil_`;

    return message;
}
