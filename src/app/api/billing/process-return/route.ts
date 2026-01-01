
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { BankFactory } from '@/lib/banking/factory';
import { decrypt } from '@/lib/encryption';

export async function POST(request: NextRequest) {
    const supabase = await createClient();

    try {
        // 1. Verificar autenticação
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

        // 2. Receber arquivo
        const formData = await request.formData();
        const file = formData.get('file') as File;
        const bankAccountId = formData.get('bankAccountId') as string;

        if (!file || !bankAccountId) {
            return NextResponse.json({ error: 'Arquivo e conta bancária são obrigatórios' }, { status: 400 });
        }

        // 3. Buscar conta bancária
        const { data: bankAccount } = await supabase
            .from('bank_accounts')
            .select('*')
            .eq('id', bankAccountId)
            .eq('condo_id', profile.condo_id)
            .single();

        if (!bankAccount) {
            return NextResponse.json({ error: 'Conta bancária não encontrada' }, { status: 404 });
        }

        // 4. Ler conteúdo do arquivo
        const fileContent = await file.text();

        // 5. Detectar layout CNAB
        const cnabLayout = fileContent.length > 0 && fileContent.split('\n')[0].length >= 240 ? '240' : '400';

        // 6. Salvar arquivo no storage
        const fileName = `retorno_${bankAccount.bank_code}_${Date.now()}.ret`;
        const { data: uploadData, error: uploadError } = await supabase.storage
            .from('cnab-files')
            .upload(`${profile.condo_id}/${fileName}`, file);

        if (uploadError) {
            console.error('Erro upload arquivo:', uploadError);
        }

        // 7. Registrar arquivo CNAB
        const { data: cnabFile } = await supabase
            .from('cnab_files')
            .insert({
                condo_id: profile.condo_id,
                bank_account_id: bankAccountId,
                file_type: 'retorno',
                cnab_layout: cnabLayout,
                file_name: fileName,
                file_url: uploadData?.path,
                file_content: fileContent,
                file_size: file.size,
                status: 'processing',
                uploaded_by: user.id
            })
            .select()
            .single();

        // 8. Criar instância do banco para processar
        const credentials = JSON.parse(decrypt(bankAccount.api_credentials));
        const bankIntegration = BankFactory.create(bankAccount.bank_code, {
            ...credentials,
            environment: bankAccount.environment
        });

        // 9. Processar arquivo de retorno
        const payments = await bankIntegration.processReturnFile(fileContent);

        // 10. Processar cada pagamento encontrado
        const results = {
            total: payments.length,
            processed: 0,
            errors: 0,
            details: [] as any[]
        };

        let totalAmount = 0;

        for (const payment of payments) {
            try {
                // Buscar cobrança pelo nosso número
                const { data: billing } = await supabase
                    .from('billings')
                    .select('*')
                    .eq('our_number', payment.ourNumber)
                    .eq('condo_id', profile.condo_id)
                    .single();

                if (!billing) {
                    results.errors++;
                    // results.details.push({
                    //   ourNumber: payment.ourNumber,
                    //   status: 'error',
                    //   message: 'Cobrança não encontrada'
                    // });
                    continue;
                }

                // Verificar se já foi processado
                if (billing.status === 'paid') {
                    results.details.push({
                        ourNumber: payment.ourNumber,
                        status: 'skipped',
                        message: 'Já processado anteriormente'
                    });
                    continue;
                }

                // Registrar pagamento
                await supabase.from('billing_payments').insert({
                    billing_id: billing.id,
                    condo_id: profile.condo_id,
                    amount_paid: payment.amountPaid,
                    payment_date: payment.paymentDate.toISOString().split('T')[0],
                    credit_date: payment.creditDate?.toISOString().split('T')[0],
                    payment_method: 'boleto',
                    source: 'bank_return',
                    bank_return_file: fileName,
                    authentication_code: payment.authenticationCode,
                    bank_channel: payment.paymentChannel
                });

                // Atualizar cobrança
                const newStatus = payment.amountPaid >= billing.final_amount ? 'paid' : 'partially_paid';

                await supabase
                    .from('billings')
                    .update({
                        status: newStatus,
                        paid_amount: payment.amountPaid,
                        payment_date: payment.paymentDate.toISOString()
                    })
                    .eq('id', billing.id);

                // Atualizar lote
                if (billing.batch_id) {
                    await updateBatchStatusAfterReturn(supabase, billing.batch_id);
                }

                // Registrar entrada financeira
                await registerFinancialEntryFromReturn(supabase, billing, payment);

                totalAmount += payment.amountPaid;
                results.processed++;
                results.details.push({
                    ourNumber: payment.ourNumber,
                    billingId: billing.id,
                    amount: payment.amountPaid,
                    status: 'success',
                    newStatus
                });

            } catch (paymentError: any) {
                results.errors++;
                results.details.push({
                    ourNumber: payment.ourNumber,
                    status: 'error',
                    message: paymentError.message
                });
            }
        }

        // 11. Atualizar arquivo CNAB com resultado
        await supabase
            .from('cnab_files')
            .update({
                status: results.errors === 0 ? 'processed' : 'processed_with_errors',
                total_records: payments.length,
                total_amount: totalAmount,
                processed_records: results.processed,
                error_records: results.errors,
                processed_at: new Date().toISOString(),
                processing_log: results.details
            })
            .eq('id', cnabFile.id);

        // 12. Log de auditoria
        await supabase.from('audit_logs').insert({
            condo_id: profile.condo_id,
            actor_id: user.id,
            action: 'cnab_return_processed',
            resource_type: 'cnab_file',
            resource_id: cnabFile.id,
            metadata: {
                file_name: fileName,
                total_payments: payments.length,
                processed: results.processed,
                errors: results.errors,
                total_amount: totalAmount
            }
        });

        return NextResponse.json({
            success: true,
            fileId: cnabFile.id,
            results
        });

    } catch (error: any) {
        console.error('Erro ao processar arquivo retorno:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

async function updateBatchStatusAfterReturn(supabase: any, batchId: string) {
    const { data: billings } = await supabase
        .from('billings')
        .select('status')
        .eq('batch_id', batchId);

    if (!billings) return;

    const allPaid = billings.every((b: any) => b.status === 'paid');
    const somePaid = billings.some((b: any) => ['paid', 'partially_paid'].includes(b.status));

    let newStatus = 'registered';
    if (allPaid) newStatus = 'paid';
    else if (somePaid) newStatus = 'partially_paid';

    await supabase
        .from('billing_batches')
        .update({ status: newStatus })
        .eq('id', batchId);
}

async function registerFinancialEntryFromReturn(supabase: any, billing: any, payment: any) {
    try {
        await supabase.from('financial_entries').insert({
            condo_id: billing.condo_id,
            type: 'receita',
            category: 'taxa_condominial',
            description: `Pagamento via CNAB - ${billing.description}`,
            amount: payment.amountPaid,
            date: payment.paymentDate.toISOString().split('T')[0],
            reference_type: 'billing',
            reference_id: billing.id,
            status: 'confirmed'
        });
    } catch (error) {
        console.error('Erro registrar entrada financeira:', error);
    }
}
