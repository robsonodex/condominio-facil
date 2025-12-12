import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { GovernanceService } from '@/lib/services/governance';

export async function POST(req: NextRequest) {
    const supabase = await createClient(); // Fixed: Added await
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: profile } = await supabase
        .from('users')
        .select('role, condo_id')
        .eq('id', user.id)
        .single();

    if (!profile || !['sindico', 'superadmin'].includes(profile.role)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();

    try {
        const assembly = await GovernanceService.createAssembly({
            condo_id: profile.condo_id,
            title: body.title,
            description: body.description,
            start_at: body.start_at,
            is_virtual: body.is_virtual,
            virtual_link: body.virtual_link,
            created_by: user.id
        });
        return NextResponse.json({ assembleia: assembly });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function GET(req: NextRequest) {
    const supabase = await createClient(); // Fixed: Added await
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: profile } = await supabase
        .from('users')
        .select('condo_id')
        .eq('id', user.id)
        .single();

    if (!profile) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const assemblies = await GovernanceService.getAssemblies(profile.condo_id);
        return NextResponse.json({ assembleias: assemblies });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
