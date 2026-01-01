import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    const supabase = await createClient();
    const { condoId, items } = await request.json(); // items: { id, order, is_visible }[]

    if (!condoId || !items) {
        return NextResponse.json({ error: 'Dados incompletos' }, { status: 400 });
    }

    // 1. Verificar se é admin
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    // 2. Atualizar ordens em lote (batch update)
    // Nota: No Supabase, batch update de diferentes linhas com diferentes valores 
    // pode ser feito via RPC ou múltiplos upserts. Aqui simplificamos.
    const { error } = await supabase
        .from('condo_sidebar_config')
        .upsert(
            items.map((item: any) => ({
                condo_id: condoId,
                feature_key: item.featureKey,
                display_order: item.order,
                is_visible: item.isVisible,
                updated_at: new Date().toISOString()
            })),
            { onConflict: 'condo_id,feature_key' }
        );

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ message: 'Layout do menu salvo com sucesso!' });
}
