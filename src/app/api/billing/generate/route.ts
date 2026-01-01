import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { MercadoPagoService } from '@/lib/payments/mercadopago';
import { getPaymentProvider } from '@/lib/payments/multi-tenant';

export async function POST(request: NextRequest) {
    const supabase = await createClient();

    // 1. Verificar auth
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const { condoId, moradorId, valor, descricao, vencimento, tipo } = await request.json();

    if (!condoId || !valor || !moradorId) {
        return NextResponse.json({ error: 'Dados incompletos' }, { status: 400 });
    }

    // 2. Buscar dados do morador para o pagamento
    const { data: morador } = await supabase
        .from('users')
        .select('nome, email, telefone, cpf')
        .eq('id', moradorId)
        .single();

    if (!morador) return NextResponse.json({ error: 'Morador não encontrado' }, { status: 404 });

    // 3. Obter provider de pagamento configurado para o condomínio
    const provider = await getPaymentProvider(condoId);
    if (!provider) {
        return NextResponse.json({ error: 'Integração bancária não configurada para este condomínio' }, { status: 400 });
    }

    // 4. Gerar cobrança no gateway
    let result;
    if (tipo === 'pix') {
        result = await provider.generatePix({
            valor,
            descricao,
            vencimento,
            pagador: {
                nome: morador.nome,
                email: morador.email,
                cpf_cnpj: morador.cpf || '000.000.000-00'
            }
        });
    } else {
        result = await provider.generateBoleto({
            valor,
            descricao,
            vencimento,
            pagador: {
                nome: morador.nome,
                email: morador.email,
                cpf_cnpj: morador.cpf || '000.000.000-00'
            }
        });
    }

    if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 500 });
    }

    // 5. Salvar cobrança no nosso banco (tabela billings ou invoices)
    const { data: billing, error: dbError } = await supabase
        .from('billings')
        .insert({
            condo_id: condoId,
            morador_id: moradorId,
            valor: valor,
            descricao: descricao,
            vencimento: vencimento,
            status: 'pending',
            gateway_id: result.transaction_id,
            payment_url: result.boleto_url,
            pix_code: result.pix_code,
            barcode: result.boleto_barcode,
            provider: result.provider
        })
        .select()
        .single();

    if (dbError) {
        return NextResponse.json({ error: 'Cobrança gerada no gateway mas erro ao salvar no banco: ' + dbError.message }, { status: 500 });
    }

    return NextResponse.json({
        success: true,
        billing,
        message: 'Cobrança gerada com sucesso!'
    });
}
