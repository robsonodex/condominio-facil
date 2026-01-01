
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { BankFactory } from '@/lib/banking/factory';
import { decrypt } from '@/lib/encryption';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest) {
    const supabase = await createClient();

    try {
        // 1. Verificar autenticação e permissão
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        const { data: profile } = await supabase
            .from('users')
            .select('condo_id, role')
            .eq('id', user.id)
            .single();

        if (!profile || !['admin', 'sindico'].includes(profile.role)) {
            return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
        }

        // 2. Verificar se feature está habilitada
        const { data: hasFeature } = await supabase.rpc('has_feature', {
            p_condo_id: profile.condo_id,
            p_feature_key: 'module_banking'
        });

        if (!hasFeature) {
            return NextResponse.json({
                error: 'Módulo de cobrança bancária não está ativado. Entre em contato com o suporte.'
            }, { status: 403 });
        }

        // 3. Receber dados
        const body = await request.json();
        const {
            bankAccountId,
            referenceMonth, // Ex: '2025-01'
            dueDate,
            units, // Array de { unitId, amount, lineItems, discountAmount? }
            description,
            sendNotifications = true
        } = body;

        // 4. Buscar conta bancária
        const { data: bankAccount, error: bankError } = await supabase
            .from('bank_accounts')
            .select('*')
            .eq('id', bankAccountId)
            .eq('condo_id', profile.condo_id)
            .eq('is_active', true)
            .single();

        if (bankError || !bankAccount) {
            return NextResponse.json({ error: 'Conta bancária não encontrada ou inativa' }, { status: 404 });
        }

        // 5. Descriptografar credenciais
        const credentials = JSON.parse(decrypt(bankAccount.api_credentials));

        // 6. Criar instância do banco
        const bankIntegration = BankFactory.create(bankAccount.bank_code, {
            ...credentials,
            environment: bankAccount.environment,
            agreementNumber: bankAccount.agreement_number,
            walletCode: bankAccount.wallet_code,
            walletVariation: bankAccount.wallet_variation,
            agency: bankAccount.agency,
            account: bankAccount.account_number,
            accountDigit: bankAccount.account_digit
        });

        // 7. Criar lote de cobrança
        const { data: batch, error: batchError } = await supabase
            .from('billing_batches')
            .insert({
                condo_id: profile.condo_id,
                bank_account_id: bankAccountId,
                reference_month: `${referenceMonth}-01`,
                description: description || `Cobrança ${referenceMonth}`,
                due_date: dueDate,
                status: 'generating',
                created_by: user.id
            })
            .select()
            .single();

        if (batchError) {
            throw new Error(`Erro ao criar lote: ${batchError.message}`);
        }

        // 8. Processar cada unidade
        const results = {
            success: [] as any[],
            errors: [] as any[]
        };

        let totalAmount = 0;

        for (const unitData of units) {
            try {
                // Buscar dados da unidade e morador
                const { data: unit } = await supabase
                    .from('units')
                    .select(`
            *,
            residents:users(id, nome, email, telefone, cpf)
          `)
                    .eq('id', unitData.unitId)
                    .eq('condo_id', profile.condo_id)
                    .single();

                if (!unit) {
                    results.errors.push({
                        unitId: unitData.unitId,
                        error: 'Unidade não encontrada'
                    });
                    continue;
                }

                // Pegar morador principal (proprietário ou responsável)
                const resident = unit.residents?.find((r: any) => r.id === unit.responsavel_id) || unit.residents?.[0];

                if (!resident) {
                    results.errors.push({
                        unitId: unitData.unitId,
                        unit: unit.identificador,
                        error: 'Nenhum morador vinculado à unidade'
                    });
                    continue;
                }

                // Buscar endereço do condomínio para o pagador
                const { data: condo } = await supabase
                    .from('condos')
                    .select('*')
                    .eq('id', profile.condo_id)
                    .single();

                // Gerar nosso número único
                const ourNumber = await generateOurNumber(supabase, profile.condo_id, bankAccount.bank_code);

                // Calcular valor final
                const originalAmount = unitData.amount;
                const discountAmount = unitData.discountAmount || 0;
                const finalAmount = originalAmount - discountAmount;

                // Preparar dados do boleto
                const boletoData = {
                    ourNumber,
                    amount: finalAmount,
                    dueDate: new Date(dueDate),
                    payer: {
                        name: resident.nome,
                        document: resident.cpf || '',
                        email: resident.email,
                        phone: resident.telefone,
                        address: {
                            street: condo?.endereco || 'Endereço não informado',
                            number: unit.identificador,
                            complement: unit.bloco ? `Bloco ${unit.bloco}` : '',
                            neighborhood: condo?.bairro || '',
                            city: condo?.cidade || '',
                            state: condo?.estado || '',
                            zipcode: condo?.cep || ''
                        }
                    },
                    instructions: bankAccount.default_instructions || [
                        'Não receber após vencimento',
                        'Multa de 2% após vencimento',
                        'Juros de 1% ao mês'
                    ],
                    finePercentage: bankAccount.default_fine_percentage || 2,
                    interestPercentage: bankAccount.default_interest_percentage || 1,
                    discountAmount: discountAmount,
                    discountDueDate: discountAmount > 0 ? new Date(dueDate) : undefined
                };

                // Registrar boleto no banco
                const boletoResponse = await bankIntegration.registerBoleto(boletoData);

                if (!boletoResponse.success) {
                    results.errors.push({
                        unitId: unitData.unitId,
                        unit: unit.identificador,
                        error: boletoResponse.errorMessage
                    });
                    continue;
                }

                // Salvar cobrança no banco de dados
                const { data: billing, error: billingError } = await supabase
                    .from('billings')
                    .insert({
                        condo_id: profile.condo_id,
                        batch_id: batch.id,
                        unit_id: unitData.unitId,
                        resident_id: resident.id,
                        bank_account_id: bankAccountId,
                        our_number: ourNumber,
                        your_number: `${referenceMonth}-${unit.identificador}`,
                        original_amount: originalAmount,
                        discount_amount: discountAmount,
                        final_amount: finalAmount,
                        reference_date: `${referenceMonth}-01`,
                        due_date: dueDate,
                        description: description || `Taxa Condominial - ${referenceMonth}`,
                        line_items: unitData.lineItems || [
                            { description: 'Taxa Condominial', amount: originalAmount }
                        ],
                        payer_name: resident.nome,
                        payer_document: resident.cpf,
                        payer_email: resident.email,
                        payer_phone: resident.telefone,
                        payer_address: boletoData.payer.address,
                        barcode: boletoResponse.barcode,
                        digitable_line: boletoResponse.digitableLine,
                        boleto_url: boletoResponse.boletoUrl,
                        pix_qrcode: boletoResponse.pixQrCode,
                        pix_copy_paste: boletoResponse.pixCopyPaste,
                        status: 'registered',
                        bank_registration_date: new Date().toISOString(),
                        bank_registration_response: boletoResponse.bankResponse,
                        created_by: user.id
                    })
                    .select()
                    .single();

                if (billingError) {
                    results.errors.push({
                        unitId: unitData.unitId,
                        unit: unit.identificador,
                        error: billingError.message
                    });
                    continue;
                }

                totalAmount += finalAmount;

                results.success.push({
                    billingId: billing.id,
                    unitId: unitData.unitId,
                    unit: unit.identificador,
                    resident: resident.nome,
                    amount: finalAmount,
                    barcode: boletoResponse.barcode,
                    digitableLine: boletoResponse.digitableLine,
                    boletoUrl: boletoResponse.boletoUrl,
                    pixQrCode: boletoResponse.pixQrCode
                });

                // Enviar notificações se habilitado
                if (sendNotifications && resident.email) {
                    await sendBillingNotification(supabase, billing, resident, condo);
                }

            } catch (unitError: any) {
                results.errors.push({
                    unitId: unitData.unitId,
                    error: unitError.message
                });
            }
        }

        // 9. Atualizar lote com totais
        await supabase
            .from('billing_batches')
            .update({
                status: results.errors.length === 0 ? 'registered' : 'partially_registered',
                total_amount: totalAmount,
                total_billings: results.success.length,
                generation_date: new Date().toISOString()
            })
            .eq('id', batch.id);

        // 10. Log de auditoria
        await supabase.from('audit_logs').insert({
            condo_id: profile.condo_id,
            actor_id: user.id,
            action: 'billing_batch_generated',
            resource_type: 'billing_batch',
            resource_id: batch.id,
            metadata: {
                reference_month: referenceMonth,
                total_billings: results.success.length,
                total_errors: results.errors.length,
                total_amount: totalAmount
            }
        });

        return NextResponse.json({
            success: true,
            batchId: batch.id,
            summary: {
                total: units.length,
                success: results.success.length,
                errors: results.errors.length,
                totalAmount
            },
            results
        });

    } catch (error: any) {
        console.error('Erro ao gerar cobranças:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// Função auxiliar para gerar nosso número único
async function generateOurNumber(supabase: any, condoId: string, bankCode: string): Promise<string> {
    const { data, error } = await supabase.rpc('generate_our_number', {
        p_condo_id: condoId,
        p_bank_code: bankCode
    });

    if (error) {
        // Fallback: gerar baseado em timestamp
        return Date.now().toString().substring(-10);
    }

    return data;
}

// Função auxiliar para enviar notificação
async function sendBillingNotification(
    supabase: any,
    billing: any,
    resident: any,
    condo: any
) {
    try {
        // Verificar se WhatsApp está habilitado
        const { data: hasWhatsApp } = await supabase.rpc('has_feature', {
            p_condo_id: billing.condo_id,
            p_feature_key: 'module_whatsapp'
        });

        // Enviar e-mail
        // Assuming internal API for notifications since full implementation is not provided in prompt
        // but the prompt included this code block. 
        await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/notifications/email`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                to: resident.email,
                template: 'billing_generated',
                data: {
                    residentName: resident.nome,
                    condoName: condo.nome,
                    amount: billing.final_amount,
                    dueDate: billing.due_date,
                    boletoUrl: billing.boleto_url,
                    digitableLine: billing.digitable_line,
                    pixCopyPaste: billing.pix_copy_paste
                }
            })
        });

        // Atualizar flag de envio
        await supabase
            .from('billings')
            .update({ email_sent_at: new Date().toISOString() })
            .eq('id', billing.id);

        // Enviar WhatsApp se habilitado
        if (hasWhatsApp && resident.telefone) {
            await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/whatsapp/send`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    phone: resident.telefone,
                    template: 'billing_notification',
                    data: {
                        name: resident.nome,
                        amount: billing.final_amount,
                        dueDate: billing.due_date,
                        pixCode: billing.pix_copy_paste
                    }
                })
            });

            await supabase
                .from('billings')
                .update({ whatsapp_sent_at: new Date().toISOString() })
                .eq('id', billing.id);
        }

    } catch (error) {
        console.error('Erro ao enviar notificação:', error);
    }
}
