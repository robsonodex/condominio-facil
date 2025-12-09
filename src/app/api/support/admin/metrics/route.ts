import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/support/admin/metrics - Métricas do sistema de suporte
export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        const { data: profile } = await supabase
            .from('users')
            .select('role')
            .eq('id', user.id)
            .single();

        // Apenas superadmin pode acessar métricas gerais
        if (profile?.role !== 'superadmin') {
            return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
        }

        //View de métricas
        const { data: metrics } = await supabase
            .from('support_metrics')
            .select('*')
            .single();

        // Tickets por categoria
        const { data: byCategory } = await supabase
            .from('support_tickets')
            .select('category')
            .then(({ data }) => {
                const counts: any = {};
                data?.forEach((t: any) => {
                    counts[t.category] = (counts[t.category] || 0) + 1;
                });
                return { data: counts };
            });

        // Tickets criados nos últimos 7 dias
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const { count: recentTickets } = await supabase
            .from('support_tickets')
            .select('*', { count: 'exact', head: true })
            .gte('created_at', sevenDaysAgo.toISOString());

        return NextResponse.json({
            ...metrics,
            by_category: byCategory,
            recent_tickets_7d: recentTickets
        });

    } catch (error: any) {
        console.error('Get metrics error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
