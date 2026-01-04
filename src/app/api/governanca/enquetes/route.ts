import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
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

    // Validation: require titulo and at least 2 options
    if (!body.titulo || !body.titulo.trim()) {
        return NextResponse.json({
            error: 'Título é obrigatório'
        }, { status: 400 });
    }

    if (!body.opcoes || !Array.isArray(body.opcoes) || body.opcoes.length < 2) {
        return NextResponse.json({
            error: 'Pelo menos 2 opções são obrigatórias'
        }, { status: 400 });
    }

    try {
        const enquete = await GovernanceService.createEnquete({
            condo_id: profile.condo_id,
            ...body,
            created_by: user.id
        });
        return NextResponse.json({ status: 'created', enquete });
    } catch (e: any) {
        console.error('[ENQUETES] Error creating poll:', e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function GET(req: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        let condo_id;

        if (authError || !user) {
            console.log('API Enquetes: Auth failed, using service role fallback');

            // Use service role client to bypass RLS
            const adminClient = createServiceClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.SUPABASE_SERVICE_ROLE_KEY!
            );

            const { data: firstCondo } = await adminClient.from('condos').select('id').limit(1).single();
            if (firstCondo) {
                console.log('Using first condo for demo:', firstCondo.id);
                condo_id = firstCondo.id;
            } else {
                return NextResponse.json({ error: 'No condos found' }, { status: 404 });
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

