import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

const DEMO_EMAIL = 'sindico.demo@condofacil.com';
const DEMO_CONDO_NAME = 'Residencial Demo';

// GET method for easy browser testing
export async function GET(request: NextRequest) {
    return resetDemo();
}

export async function POST(request: NextRequest) {
    return resetDemo();
}

async function resetDemo() {
    try {
        // 1. Buscar condomínio demo
        const { data: demoCondo } = await supabaseAdmin
            .from('condos')
            .select('id')
            .eq('nome', DEMO_CONDO_NAME)
            .single();

        if (!demoCondo) {
            return NextResponse.json({ error: 'Condomínio demo não encontrado' }, { status: 404 });
        }

        const condoId = demoCondo.id;

        console.log('[DEMO RESET] Iniciando limpeza do condomínio:', condoId);

        // 2. Limpar dados na ordem correta (por causa das foreign keys)

        // Documentos
        await supabaseAdmin.from('documents').delete().eq('condo_id', condoId);
        console.log('[DEMO RESET] Documentos limpos');

        // Assembleias
        await supabaseAdmin.from('assemblies').delete().eq('condo_id', condoId);
        console.log('[DEMO RESET] Assembleias limpas');

        // Enquetes
        await supabaseAdmin.from('polls').delete().eq('condo_id', condoId);
        console.log('[DEMO RESET] Enquetes limpas');

        // Encomendas
        await supabaseAdmin.from('deliveries').delete().eq('condo_id', condoId);
        console.log('[DEMO RESET] Encomendas limpas');

        // Manutenções
        await supabaseAdmin.from('maintenance_orders').delete().eq('condo_id', condoId);
        console.log('[DEMO RESET] Manutenções limpas');

        // Fornecedores
        await supabaseAdmin.from('maintenance_suppliers').delete().eq('condo_id', condoId);
        console.log('[DEMO RESET] Fornecedores limpos');

        // Lançamentos financeiros
        await supabaseAdmin.from('financial_entries').delete().eq('condo_id', condoId);
        console.log('[DEMO RESET] Lançamentos financeiros limpos');

        // Cobranças
        await supabaseAdmin.from('billings').delete().eq('condo_id', condoId);
        console.log('[DEMO RESET] Cobranças limpas');

        // Visitantes
        await supabaseAdmin.from('visitors').delete().eq('condo_id', condoId);
        console.log('[DEMO RESET] Visitantes limpos');

        // Ocorrências
        await supabaseAdmin.from('occurrences').delete().eq('condo_id', condoId);
        console.log('[DEMO RESET] Ocorrências limpas');

        // Avisos
        await supabaseAdmin.from('notices').delete().eq('condo_id', condoId);
        console.log('[DEMO RESET] Avisos limpos');

        // Moradores
        await supabaseAdmin.from('residents').delete().eq('condo_id', condoId);
        console.log('[DEMO RESET] Moradores limpos');

        // Unidades
        await supabaseAdmin.from('units').delete().eq('condo_id', condoId);
        console.log('[DEMO RESET] Unidades limpas');

        // Assinatura (para ser recriada no próximo login)
        await supabaseAdmin.from('subscriptions').delete().eq('condo_id', condoId);
        console.log('[DEMO RESET] Assinatura removida');

        console.log('[DEMO RESET] Limpeza completa!');

        return NextResponse.json({
            success: true,
            message: 'Dados do demo limpos com sucesso! Faça login novamente para recriar os dados.'
        });

    } catch (error: any) {
        console.error('[DEMO RESET] Erro:', error);
        return NextResponse.json({
            error: 'Erro ao resetar demo: ' + error.message
        }, { status: 500 });
    }
}
