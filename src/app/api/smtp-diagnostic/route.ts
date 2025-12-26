import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import nodemailer from 'nodemailer';

/**
 * API de Diagnóstico SMTP Completo
 * Mostra EXATAMENTE onde está o problema
 */
export async function GET(request: NextRequest) {
    const logs: string[] = [];
    const log = (msg: string) => {
        console.log(msg);
        logs.push(msg);
    };

    try {
        log('=== DIAGNÓSTICO SMTP INICIADO ===');

        // 1. Verificar variáveis de ambiente
        log('\n--- STEP 1: Variáveis de Ambiente ---');
        const encryptionKey = process.env.SMTP_ENCRYPTION_KEY;
        log(`SMTP_ENCRYPTION_KEY: ${encryptionKey ? 'DEFINIDA (' + encryptionKey.length + ' chars)' : 'NÃO DEFINIDA!'}`);

        // 2. Buscar configuração SMTP do banco
        log('\n--- STEP 2: Configuração no Banco ---');
        const { data: smtpConfig, error: configError } = await supabaseAdmin
            .from('configuracoes_smtp')
            .select('*')
            .is('condominio_id', null)
            .single();

        if (configError) {
            log(`Erro ao buscar config: ${configError.message}`);
            return NextResponse.json({ logs, error: 'Config não encontrada', details: configError.message });
        }

        if (!smtpConfig) {
            log('SMTP GLOBAL NÃO CONFIGURADO!');
            return NextResponse.json({ logs, error: 'Nenhuma configuração SMTP global encontrada' });
        }

        log(`Host: ${smtpConfig.smtp_host}`);
        log(`Porta: ${smtpConfig.smtp_port}`);
        log(`Usuário: ${smtpConfig.smtp_user}`);
        log(`From Email: ${smtpConfig.smtp_from_email}`);
        log(`From Name: ${smtpConfig.smtp_from_name}`);
        log(`Secure: ${smtpConfig.smtp_secure}`);
        log(`Ativo: ${smtpConfig.is_active}`);
        log(`Senha (criptografada?): ${smtpConfig.smtp_password?.substring(0, 30)}...`);

        // 3. Tentar descriptografar a senha
        log('\n--- STEP 3: Descriptografia da Senha ---');
        let decryptedPassword: string;
        try {
            const { decryptPassword, isEncrypted } = await import('@/lib/smtp-crypto');

            if (isEncrypted(smtpConfig.smtp_password)) {
                log('Senha está no formato criptografado');
                decryptedPassword = decryptPassword(smtpConfig.smtp_password);
                log(`Senha descriptografada com sucesso (${decryptedPassword.length} chars)`);
            } else {
                log('Senha NÃO está criptografada - usando como está');
                decryptedPassword = smtpConfig.smtp_password;
            }
        } catch (decryptError: any) {
            log(`ERRO ao descriptografar: ${decryptError.message}`);
            return NextResponse.json({
                logs,
                error: 'Falha na descriptografia',
                details: decryptError.message,
                suggestion: 'A senha pode ter sido salva sem criptografia ou a chave mudou. Re-salve a configuração.'
            });
        }

        // 4. Configurar transporter
        log('\n--- STEP 4: Configurando Transporter ---');
        const port = smtpConfig.smtp_port;
        const useSecure = port === 465;
        log(`Porta ${port} -> secure=${useSecure}`);

        const transporter = nodemailer.createTransport({
            host: smtpConfig.smtp_host,
            port: port,
            secure: useSecure,
            auth: {
                user: smtpConfig.smtp_user,
                pass: decryptedPassword
            },
            tls: {
                rejectUnauthorized: false
            },
            connectionTimeout: 30000,
            greetingTimeout: 15000,
            socketTimeout: 30000,
            debug: true,
            logger: true
        });

        // 5. Verificar conexão
        log('\n--- STEP 5: Verificando Conexão ---');
        try {
            await transporter.verify();
            log('✅ CONEXÃO SMTP VERIFICADA COM SUCESSO!');
        } catch (verifyError: any) {
            log(`❌ ERRO na verificação: ${verifyError.message}`);
            log(`Código: ${verifyError.code}`);
            return NextResponse.json({
                logs,
                error: 'Falha na conexão SMTP',
                details: verifyError.message,
                code: verifyError.code
            });
        }

        // 6. Tentar enviar email de teste
        log('\n--- STEP 6: Enviando Email de Teste ---');
        const testEmail = smtpConfig.smtp_from_email;
        try {
            const info = await transporter.sendMail({
                from: smtpConfig.smtp_from_email,
                to: testEmail,
                subject: '✅ TESTE SMTP - Condomínio Fácil',
                html: `
                    <div style="font-family: Arial; padding: 20px; background: #10b981; color: white; text-align: center;">
                        <h1>✅ SMTP Funcionando!</h1>
                        <p>Se você está vendo isso, o email está funcionando!</p>
                        <p>Data: ${new Date().toLocaleString('pt-BR')}</p>
                    </div>
                `
            });

            log(`✅ EMAIL ENVIADO COM SUCESSO!`);
            log(`Message ID: ${info.messageId}`);
            log(`Enviado para: ${testEmail}`);

            return NextResponse.json({
                logs,
                success: true,
                message: `Email de teste enviado para ${testEmail}`,
                messageId: info.messageId
            });

        } catch (sendError: any) {
            log(`❌ ERRO ao enviar: ${sendError.message}`);
            return NextResponse.json({
                logs,
                error: 'Falha ao enviar email',
                details: sendError.message
            });
        }

    } catch (error: any) {
        log(`\n❌ ERRO GERAL: ${error.message}`);
        return NextResponse.json({ logs, error: error.message });
    }
}
