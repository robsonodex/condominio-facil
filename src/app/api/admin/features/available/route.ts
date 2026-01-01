import { supabaseAdmin as supabase } from '@/lib/supabase/admin';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const condoId = searchParams.get('condoId');

    if (!condoId) {
        return NextResponse.json({ error: 'Condo ID é obrigatório' }, { status: 400 });
    }

    const supabase = createClient();

    // 1. Verifica se é superadmin (opcional, dependendo de quem acessa este painel)
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const { data: profile } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();

    if (profile?.role !== 'superadmin' && profile?.role !== 'sindico') {
        return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    // 2. Busca plano do condomínio
    const { data: condo, error: condoError } = await supabase
        .from('condos')
        .select('plano_id, plans(nome_plano)')
        .eq('id', condoId)
        .single();

    if (condoError || !condo) {
        return NextResponse.json({ error: 'Condomínio não encontrado' }, { status: 404 });
    }

    // 3. Busca features do plano (ou todas as flags se superadmin)
    const { data: planFeatures } = await supabase
        .from('plan_features')
        .select(`
      feature_key,
      enabled_by_default,
      can_be_toggled,
      feature_flags(*)
    `)
        .eq('plan_id', condo.plano_id);

    // 4. Busca status atual no condomínio
    const { data: condoFeatures } = await supabase
        .from('condo_features')
        .select('feature_key, is_active, monthly_fee, implementation_paid')
        .eq('condo_id', condoId);

    // 5. Mescla dados
    const features = planFeatures?.map((pf: any) => {
        const currentStatus = condoFeatures?.find((cf: any) => cf.feature_key === pf.feature_key);
        return {
            ...(pf.feature_flags as any),
            enabledByDefault: pf.enabled_by_default,
            canBeToggled: pf.can_be_toggled,
            isActive: currentStatus?.is_active ?? pf.enabled_by_default,
            monthlyFee: currentStatus?.monthly_fee || 0,
            implementationPaid: currentStatus?.implementation_paid || false
        };
    }) || [];

    return NextResponse.json({
        plano: (condo.plans as any)?.nome_plano,
        features
    });
}
