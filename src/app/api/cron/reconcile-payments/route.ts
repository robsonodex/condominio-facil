import { createClient } from '@/lib/supabase/admin';
import { NextRequest, NextResponse } from 'next/server';
import { getPaymentProvider } from '@/lib/payments/multi-tenant';

export async function GET(request: NextRequest) {
    // Proteção básica via header secreto (configurado no Vercel/Cron)
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const supabase = createClient();

    // 1. Buscar todas as cobranças pendentes
    const { data: pendingBillings } = await supabase
        .from('billings')
        .select('*')
        .eq('status', 'pending')
        .not('gateway_id', 'is', null);

    if (!pendingBillings || pendingBillings.length === 0) {
        return NextResponse.json({ message: 'Nenhuma cobrança pendente para conciliar' });
    }

    const results = [];

    for (const billing of pendingBillings) {
        try {
            // 2. Obter provider para o condomínio
            const provider = await getPaymentProvider(billing.condo_id);
            if (!provider) continue;

            // 3. Verificar status no gateway
            const { status, paid } = await provider.checkPaymentStatus(billing.gateway_id);

            if (paid) {
                // 4. Atualizar banco se pago
                await supabase
                    .from('billings')
                    .update({
                        status: 'paid',
                        paid_at: new Date().toISOString(),
                        payment_method: 'cron_reconciliation'
                    })
                    .eq('id', billing.id);

                await supabase.from('billing_payments').insert({
                    billing_id: billing.id,
                    amount: billing.valor,
                    payment_date: new Date().toISOString(),
                    payment_method: 'cron_reconciliation',
                    transaction_id: billing.gateway_id
                });

                results.push({ id: billing.id, status: 'reconciled_as_paid' });
            } else if (status === 'cancelled' || status === 'expired') {
                await supabase
                    .from('billings')
                    .update({ status: 'cancelled' })
                    .eq('id', billing.id);
                results.push({ id: billing.id, status: 'cancelled' });
            }
        } catch (error: any) {
            console.error(`Erro ao conciliar billing ${billing.id}:`, error.message);
        }
    }

    return NextResponse.json({
        message: 'Conciliação finalizada',
        processed: pendingBillings.length,
        reconciled: results.length,
        results
    });
}
