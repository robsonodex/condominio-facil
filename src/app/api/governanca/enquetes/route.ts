import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { GovernanceService } from '@/lib/services/governance';

export async function POST(req: NextRequest) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: profile } = await supabase
        .from('users')
        .select('condo_id')
        .eq('id', user.id)
        .single();

    if (!profile) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();

    try {
        const enquete = await GovernanceService.createEnquete({
            condo_id: profile.condo_id,
            ...body,
            created_by: user.id
        });
        return NextResponse.json({ status: 'created', enquete });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function GET(req: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        let condo_id;

        if (authError || !user) {
            console.error('API Enquetes: User not found or auth error', authError);

            // DEV MODE: Fallback to first condo for testing
            const { data: firstCondo } = await supabase.from('condos').select('id').limit(1).single();
            if (firstCondo) {
                console.log('⚠️ DEV MODE: Using first condo for demo');
                condo_id = firstCondo.id;
            } else {
                return NextResponse.json({ error: 'Unauthorized: No user' }, { status: 401 });
            }
        } else {
            const { data: profile, error: profileError } = await supabase
                .from('users')
                .select('condo_id')
                .eq('id', user.id)
                .single();

            if (profileError || !profile) {
                console.error('API Enquetes: Profile not found', profileError);
                return NextResponse.json({ error: 'Unauthorized: No profile' }, { status: 401 });
            }
            condo_id = profile.condo_id;
        }

        const enquetes = await GovernanceService.getEnquetes(condo_id);
        return NextResponse.json({ enquetes });
    } catch (e: any) {
        console.error('API Enquetes: Exception', e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
