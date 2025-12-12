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
            date: body.start_at || body.date, // Support both field names
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
