import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';

// GET - List pautas for an assembly
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;

    try {
        const { data: pautas, error } = await supabase
            .from('assembly_pautas')
            .select(`
                *,
                votes:assembly_votes(count)
            `)
            .eq('assembly_id', id)
            .order('order_index', { ascending: true });

        if (error) {
            console.error('Error fetching pautas:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ pautas });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

// POST - Create a new pauta
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Validate role
    const { data: profile } = await supabase.from('users').select('role, condo_id').eq('id', user.id).single();
    if (!profile || !['sindico', 'superadmin'].includes(profile.role)) {
        return NextResponse.json({ error: 'Apenas síndicos podem criar pautas' }, { status: 403 });
    }

    const { id: assemblyId } = await params;
    const body = await req.json();

    try {
        // Get current max order_index
        const { data: maxOrder } = await supabase
            .from('assembly_pautas')
            .select('order_index')
            .eq('assembly_id', assemblyId)
            .order('order_index', { ascending: false })
            .limit(1)
            .single();

        const newOrderIndex = body.order_index ?? ((maxOrder?.order_index ?? -1) + 1);

        const { data: pauta, error } = await supabase
            .from('assembly_pautas')
            .insert({
                assembly_id: assemblyId,
                title: body.title,
                description: body.description,
                quorum_type: body.quorum_type || 'simple',
                quorum_custom: body.quorum_custom,
                order_index: newOrderIndex,
                status: 'pending'
            })
            .select()
            .single();

        if (error) {
            console.error('Error creating pauta:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // Audit log
        const adminClient = createServiceClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        await adminClient.from('assembly_audit_logs').insert({
            assembly_id: assemblyId,
            event_type: 'pauta.created',
            actor_id: user.id,
            actor_role: profile.role,
            target_type: 'pauta',
            target_id: pauta.id,
            details: { title: body.title },
            ip_address: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip'),
            user_agent: req.headers.get('user-agent')
        });

        return NextResponse.json({ status: 'created', pauta });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
