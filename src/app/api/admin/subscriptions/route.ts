import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createServiceRoleClient } from '@supabase/supabase-js';

/**
 * GET /api/admin/subscriptions
 * Busca todas as assinaturas (apenas para superadmin)
 * Usa service role para contornar RLS
 */
export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();

        // Verificar autenticação
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        // Verificar se é superadmin
        const { data: profile } = await supabase
            .from('users')
            .select('role')
            .eq('email', user.email)
            .single();

        if (!profile || profile.role !== 'superadmin') {
            return NextResponse.json({ error: 'Apenas superadmin' }, { status: 403 });
        }

        // Usar service role para contornar RLS
        const supabaseAdmin = createServiceRoleClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        // Buscar parâmetros de filtro
        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status');

        // Buscar assinaturas
        let query = supabaseAdmin
            .from('subscriptions')
            .select('*, condo:condos(id, nome, cidade, estado, email_contato), plan:plans(id, nome_plano, valor_mensal)')
            .order('created_at', { ascending: false });

        if (status) {
            query = query.eq('status', status);
        }

        const { data, error } = await query;

        if (error) {
            console.error('Error fetching subscriptions:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // Ensure valor_mensal_cobrado has a value (fallback to plan value)
        const subscriptions = (data || []).map(sub => ({
            ...sub,
            valor_mensal_cobrado: sub.valor_mensal_cobrado || sub.plan?.valor_mensal || 0
        }));

        return NextResponse.json({ subscriptions });

    } catch (error: any) {
        console.error('Subscriptions API error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
