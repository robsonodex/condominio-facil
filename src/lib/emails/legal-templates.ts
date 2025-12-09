// Email template para confirmação de aceite legal

export function legalAcceptanceConfirmedEmail(data: {
    nome: string;
    documents: string;
    ip_address: string;
    plan: string;
    accepted_at: string;
}) {
    return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Aceite Registrado</title>
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
                                ✅ Aceite Registrado com Sucesso
                            </h1>
                        </td>
                    </tr>

                    <!-- Content -->
                    <tr>
                        <td style="padding: 40px 30px;">
                            <p style="margin: 0 0 20px; color: #374151; font-size: 16px; line-height: 1.5;">
                                Olá <strong>${data.nome}</strong>,
                            </p>
                            <p style="margin: 0 0 30px; color: #374151; font-size: 16px; line-height: 1.5;">
                                Confirmamos o registro do seu aceite aos nossos termos e políticas.
                            </p>

                            <!-- Documents Box -->
                            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; border-radius: 8px; border-left: 4px solid #10b981; margin-bottom: 30px;">
                                <tr>
                                    <td style="padding: 20px;">
                                        <table width="100%" cellpadding="0" cellspacing="0">
                                            <tr>
                                                <td colspan="2" style="padding-bottom: 15px;">
                                                    <p style="margin: 0; color: #6b7280; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600;">
                                                        📄 Documentos Aceitos
                                                    </p>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">
                                                    <strong>Documentos:</strong>
                                                </td>
                                                <td style="padding: 8px 0; color: #111827; font-size: 14px; text-align: right;">
                                                    ${data.documents}
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">
                                                    <strong>Plano:</strong>
                                                </td>
                                                <td style="padding: 8px 0; color: #111827; font-size: 14px; text-align: right;">
                                                    ${data.plan}
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">
                                                    <strong>Data/Hora:</strong>
                                                </td>
                                                <td style="padding: 8px 0; color: #111827; font-size: 14px; text-align: right;">
                                                    ${data.accepted_at}
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">
                                                    <strong>Endereço IP:</strong>
                                                </td>
                                                <td style="padding: 8px 0; color: #111827; font-size: 14px; text-align: right;">
                                                    ${data.ip_address}
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>

                            <!-- Security Info -->
                            <div style="background-color: #eff6ff; border-radius: 8px; padding: 20px; margin-bottom: 30px;">
                                <div style="flex items-start gap-3;">
                                    <p style="margin: 0 0 10px; color: #1e40af; font-weight: 600; font-size: 14px;">
                                        🔒 Segurança e Conformidade
                                    </p>
                                    <p style="margin: 0; color: #1e3a8a; font-size: 13px; line-height: 1.6;">
                                        Este aceite está registrado de forma segura em nosso sistema com hash SHA-256 dos documentos, 
                                        garantindo integridade e conformidade com a LGPD (Lei Geral de Proteção de Dados).
                                    </p>
                                </div>
                            </div>

                            <p style="margin: 0 0 20px; color: #374151; font-size: 16px; line-height: 1.5;">
                                Agora você pode acessar todos os recursos do seu plano. Bem-vindo ao Condomínio Fácil!
                            </p>

                            <!-- CTA Button -->
                            <table width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td align="center" style="padding: 20px 0;">
                                        <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" style="display: inline-block; background-color: #10b981; color: #ffffff; text-decoration: none; padding: 14px 30px; border-radius: 6px; font-weight: 600; font-size: 16px;">
                                            Acessar Dashboard
                                        </a>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #f9fafb; padding: 20px 30px; text-align: center; border-top: 1px solid #e5e7eb;">
                            <p style="margin: 0 0 10px; color: #6b7280; font-size: 12px;">
                                Se você tiver dúvidas, entre em contato conosco:
                            </p>
                            <p style="margin: 0; color: #6b7280; font-size: 12px;">
                                <a href="mailto:contato@meucondominiofacil.com" style="color: #10b981; text-decoration: none;">contato@meucondominiofacil.com</a>
                            </p>
                            <p style="margin: 15px 0 0; color: #9ca3af; font-size: 11px;">
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
