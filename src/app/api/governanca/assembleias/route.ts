import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { GovernanceService } from '@/lib/services/governance';

export async function POST(req: NextRequest) {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    console.log('Assembly POST - User:', user?.id, 'AuthError:', authError?.message);

    if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

    const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('role, condo_id')
        .eq('id', user.id)
        .single();

    console.log('Assembly POST - Profile:', profile, 'ProfileError:', profileError?.message);

    if (!profile || !['sindico', 'superadmin'].includes(profile.role)) {
        return NextResponse.json({
            error: `Não autorizado (role: ${profile?.role || 'não encontrado'})`
        }, { status: 401 });
    }

    const body = await req.json();

    // SUPERADMIN: full access - can use any condo_id or first available
    let condoId = body.condo_id || profile.condo_id;

    if (!condoId && profile.role === 'superadmin') {
        // Get first condo for superadmin
        const { data: firstCondo } = await supabase
            .from('condos')
            .select('id')
            .limit(1)
            .single();
        condoId = firstCondo?.id;
    }

    if (!condoId) {
        return NextResponse.json({ error: 'Nenhum condomínio disponível' }, { status: 400 });
    }

    try {
        const assembly = await GovernanceService.createAssembly({
            condo_id: condoId,
            title: body.title,
            description: body.description,
            date: body.start_at || body.date,
            status: 'scheduled',
            type: body.type || 'simple',
            require_presence: body.require_presence || false,
            block_defaulters: body.block_defaulters || false,
            quorum_install: body.quorum_install || 50,
            created_by: user.id
        });
        return NextResponse.json({ assembleia: assembly });
    } catch (e: any) {
        console.error('Error creating assembly:', e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function GET(req: NextRequest) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: profile } = await supabase
        .from('users')
        .select('role, condo_id')
        .eq('id', user.id)
        .single();

    if (!profile) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        // SUPERADMIN: sees ALL assemblies from ALL condos
        if (profile.role === 'superadmin') {
            const assemblies = await GovernanceService.getAllAssemblies();
            return NextResponse.json({ assembleias: assemblies });
        }

        // Others see only their condo's assemblies
        const assemblies = await GovernanceService.getAssemblies(profile.condo_id);
        return NextResponse.json({ assembleias: assemblies });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
