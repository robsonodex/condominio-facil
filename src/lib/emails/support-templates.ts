// Email template para novo ticket criado

export function supportNewTicketEmail(data: {
    ticket_number: string;
    subject: string;
    priority: string;
    sla_deadline: string;
    user_name: string;
}) {
    const priorityLabels: Record<string, string> = {
        low: '🔵 Baixa',
        normal: '🟢 Normal',
        high: '🟡 Alta',
        priority: '🔴 Prioritário'
    };

    return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Novo Ticket Criado</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 20px 0;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                    <!-- Header -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center;">
                            <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600;">
                                ✅ Ticket Criado com Sucesso
                            </h1>
                        </td>
                    </tr>

                    <!-- Content -->
                    <tr>
                        <td style="padding: 40px 30px;">
                            <p style="margin: 0 0 20px; color: #374151; font-size: 16px; line-height: 1.5;">
                                Olá <strong>${data.user_name}</strong>,
                            </p>
                            <p style="margin: 0 0 30px; color: #374151; font-size: 16px; line-height: 1.5;">
                                Seu ticket de suporte foi criado com sucesso e nossa equipe já foi notificada.
                            </p>

                            <!-- Ticket Info Box -->
                            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; border-radius: 8px; border-left: 4px solid #10b981; margin-bottom: 30px;">
                                <tr>
                                    <td style="padding: 20px;">
                                        <table width="100%" cellpadding="0" cellspacing="0">
                                            <tr>
                                                <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">
                                                    <strong>Número do Ticket:</strong>
                                                </td>
                                                <td style="padding: 8px 0; color: #111827; font-size: 14px; text-align: right;">
                                                    #${data.ticket_number}
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">
                                                    <strong>Assunto:</strong>
                                                </td>
                                                <td style="padding: 8px 0; color: #111827; font-size: 14px; text-align: right;">
                                                    ${data.subject}
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">
                                                    <strong>Prioridade:</strong>
                                                </td>
                                                <td style="padding: 8px 0; color: #111827; font-size: 14px; text-align: right;">
                                                    ${priorityLabels[data.priority] || data.priority}
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">
                                                    <strong>Prazo de Atendimento:</strong>
                                                </td>
                                                <td style="padding: 8px 0; color: #111827; font-size: 14px; text-align: right;">
                                                    ${data.sla_deadline}
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>

                            <p style="margin: 0 0 20px; color: #374151; font-size: 16px; line-height: 1.5;">
                                Você receberá um e-mail sempre que houver uma atualização no seu ticket.
                            </p>

                            <!-- CTA Button -->
                            <table width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td align="center" style="padding: 20px 0;">
                                        <a href="${process.env.NEXT_PUBLIC_APP_URL}/suporte" style="display: inline-block; background-color: #10b981; color: #ffffff; text-decoration: none; padding: 14px 30px; border-radius: 6px; font-weight: 600; font-size: 16px;">
                                            Ver Meus Tickets
                                        </a>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #f9fafb; padding: 20px 30px; text-align: center; border-top: 1px solid #e5e7eb;">
                            <p style="margin: 0; color: #6b7280; font-size: 14px;">
                                © ${new Date().getFullYear()} Condomínio Fácil. Todos os direitos reservados.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
    `.trim();
}

// Email template para nova mensagem
export function supportNewMessageEmail(data: {
    ticket_number: string;
    subject: string;
    message: string;
    sender_name: string;
    user_name: string;
}) {
    return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Nova Mensagem no Ticket</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 20px 0;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                    <tr>
                        <td style="background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); padding: 30px; text-align: center;">
                            <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600;">
                                💬 Nova Mensagem no Ticket
                            </h1>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 40px 30px;">
                            <p style="margin: 0 0 20px; color: #374151; font-size: 16px;">
                                Olá <strong>${data.user_name}</strong>,
                            </p>
                            <p style="margin: 0 0 20px; color: #374151; font-size: 16px;">
                                <strong>${data.sender_name}</strong> respondeu ao ticket <strong>#${data.ticket_number}</strong>:
                            </p>
                            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; border-radius: 8px; margin-bottom: 20px;">
                                <tr>
                                    <td style="padding: 20px;">
                                        <p style="margin: 0 0 10px; color: #6b7280; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">
                                            ${data.subject}
                                        </p>
                                        <p style="margin: 0; color: #111827; font-size: 15px; line-height: 1.6;">
                                            ${data.message}
                                        </p>
                                    </td>
                                </tr>
                            </table>
                            <table width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td align="center" style="padding: 20px 0;">
                                        <a href="${process.env.NEXT_PUBLIC_APP_URL}/suporte" style="display: inline-block; background-color: #3b82f6; color: #ffffff; text-decoration: none; padding: 14px 30px; border-radius: 6px; font-weight: 600; font-size: 16px;">
                                            Responder
                                        </a>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    <tr>
                        <td style="background-color: #f9fafb; padding: 20px 30px; text-align: center; border-top: 1px solid #e5e7eb;">
                            <p style="margin: 0; color: #6b7280; font-size: 14px;">
                                © ${new Date().getFullYear()} Condomínio Fácil
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
    `.trim();
}

// Email template para ticket fechado
export function supportTicketClosedEmail(data: {
    ticket_number: string;
    subject: string;
    user_name: string;
}) {
    return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Ticket Fechado</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 20px 0;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                    <tr>
                        <td style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center;">
                            <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600;">
                                ✅ Ticket Resolvido e Fechado
                            </h1>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 40px 30px;">
                            <p style="margin: 0 0 20px; color: #374151; font-size: 16px;">
                                Olá <strong>${data.user_name}</strong>,
                            </p>
                            <p style="margin: 0 0 20px; color: #374151; font-size: 16px;">
                                Seu ticket <strong>#${data.ticket_number}</strong> foi resolvido e fechado com sucesso.
                            </p>
                            <p style="margin: 0 0 30px; color: #6b7280; font-size: 14px;">
                                <em>"${data.subject}"</em>
                            </p>
                            <p style="margin: 0 0 20px; color: #374151; font-size: 16px;">
                                Se você ainda tiver dúvidas ou precisar de mais ajuda, fique à vontade para abrir um novo ticket.
                            </p>
                            <table width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td align="center" style="padding: 20px 0;">
                                        <a href="${process.env.NEXT_PUBLIC_APP_URL}/suporte/novo" style="display: inline-block; background-color: #10b981; color: #ffffff; text-decoration: none; padding: 14px 30px; border-radius: 6px; font-weight: 600; font-size: 16px;">
                                            Abrir Novo Ticket
                                        </a>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    <tr>
                        <td style="background-color: #f9fafb; padding: 20px 30px; text-align: center; border-top: 1px solid #e5e7eb;">
                            <p style="margin: 0; color: #6b7280; font-size: 14px;">
                                © ${new Date().getFullYear()} Condomínio Fácil
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
    `.trim();
}

// Email template para SLA estourado (notificação interna para admins)
export function supportSLABreachedEmail(data: {
    ticket_number: string;
    subject: string;
    priority: string;
    sla_deadline: string;
}) {
    return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>⚠️ SLA Estourado</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 20px 0;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                    <tr>
                        <td style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); padding: 30px; text-align: center;">
                            <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600;">
                                ⚠️ ALERTA: SLA Estourado
                            </h1>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 40px 30px;">
                            <p style="margin: 0 0 20px; color: #374151; font-size: 16px; font-weight: 600;">
                                ATENÇÃO: Ticket ultrapassou o prazo de SLA!
                            </p>
                            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fee2e2; border-radius: 8px; border-left: 4px solid #ef4444; margin-bottom: 20px;">
                                <tr>
                                    <td style="padding: 20px;">
                                        <p style="margin: 0 0 10px; color: #991b1b; font-size: 14px; font-weight: 600;">
                                            Ticket #${data.ticket_number}
                                        </p>
                                        <p style="margin: 0 0 10px; color: #7f1d1d; font-size: 14px;">
                                            <strong>Assunto:</strong> ${data.subject}
                                        </p>
                                        <p style="margin: 0 0 10px; color: #7f1d1d; font-size: 14px;">
                                            <strong>Prioridade:</strong> ${data.priority}
                                        </p>
                                        <p style="margin: 0; color: #7f1d1d; font-size: 14px;">
                                            <strong>Prazo Original:</strong> ${data.sla_deadline}
                                        </p>
                                    </td>
                                </tr>
                            </table>
                            <p style="margin: 0 0 20px; color: #374151; font-size: 16px;">
                                Ação imediata necessária para atender este ticket.
                            </p>
                            <table width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td align="center" style="padding: 20px 0;">
                                        <a href="${process.env.NEXT_PUBLIC_APP_URL}/admin/suporte" style="display: inline-block; background-color: #ef4444; color: #ffffff; text-decoration: none; padding: 14px 30px; border-radius: 6px; font-weight: 600; font-size: 16px;">
                                            Atender Agora
                                        </a>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    <tr>
                        <td style="background-color: #f9fafb; padding: 20px 30px; text-align: center; border-top: 1px solid #e5e7eb;">
                            <p style="margin: 0; color: #6b7280; font-size: 14px;">
                                © ${new Date().getFullYear()} Condomínio Fácil
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
    `.trim();
}
