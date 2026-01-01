import { createClient } from '@/lib/supabase/admin';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const supabase = createClient();

    try {
        // 1. Buscar condomínios demo expirados
        const { data: expiredCondos } = await supabase
            .from('condos')
            .select('id')
            .eq('is_demo', true)
            .lt('data_fim_teste', new Date().toISOString());

        if (!expiredCondos || expiredCondos.length === 0) {
            return NextResponse.json({ message: 'Nenhum ambiente demo para limpar' });
        }

        const condoIds = expiredCondos.map(c => c.id);

        // 2. Limpeza em cascata (as tabelas secundárias têm ON DELETE CASCADE)
        const { error } = await supabase
            .from('condos')
            .delete()
            .in('id', condoIds);

        if (error) throw error;

        return NextResponse.json({
            success: true,
            message: `${condoIds.length} ambientes demo removidos com sucesso.`
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
