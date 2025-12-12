import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';

// POST - Cast a vote on a pauta
export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string; pautaId: string }> }
) {
    const { id: assemblyId, pautaId } = await params;

    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get user profile with unit
        const { data: profile } = await supabase
            .from('users')
            .select('role, condo_id, unit_id')
            .eq('id', user.id)
            .single();

        if (!profile || !profile.unit_id) {
            return NextResponse.json({
                error: 'Usuário não vinculado a uma unidade'
            }, { status: 403 });
        }

        const body = await req.json();
        const choice = body.choice; // 'yes', 'no', 'abstain'

        if (!['yes', 'no', 'abstain'].includes(choice)) {
            return NextResponse.json({ error: 'Escolha inválida' }, { status: 400 });
        }

        // Service client for admin operations
        const adminClient = createServiceClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        // Verify assembly is open
        const { data: assembly } = await adminClient
            .from('assembleias')
            .select('status, require_presence, block_defaulters, condo_id')
            .eq('id', assemblyId)
            .single();

        if (!assembly || assembly.status !== 'open') {
            return NextResponse.json({
                error: 'Assembleia não está aberta para votação'
            }, { status: 400 });
        }

        // Verify pauta is open for voting
        const { data: pauta } = await adminClient
            .from('assembly_pautas')
            .select('status')
            .eq('id', pautaId)
            .single();

        if (!pauta || pauta.status !== 'voting') {
            return NextResponse.json({
                error: 'Pauta não está aberta para votação'
            }, { status: 400 });
        }

        // Check presence requirement
        if (assembly.require_presence) {
            const { data: presence } = await adminClient
                .from('assembly_presences')
                .select('id')
                .eq('assembly_id', assemblyId)
                .eq('unit_id', profile.unit_id)
                .single();

            if (!presence) {
                return NextResponse.json({
                    error: 'Confirme sua presença antes de votar'
                }, { status: 403 });
            }
        }

        // Check if unit already voted (upsert logic)
        const { data: existingVote } = await adminClient
            .from('assembly_votes')
            .select('id, choice')
            .eq('pauta_id', pautaId)
            .eq('unit_id', profile.unit_id)
            .single();

        if (existingVote) {
            return NextResponse.json({
                error: 'Sua unidade já votou nesta pauta',
                existing_choice: existingVote.choice
            }, { status: 409 });
        }

        // Insert vote
        const { data: vote, error } = await adminClient
            .from('assembly_votes')
            .insert({
                pauta_id: pautaId,
                unit_id: profile.unit_id,
                user_id: user.id,
                choice,
                origin: body.origin || 'web',
                ip_address: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip'),
                user_agent: req.headers.get('user-agent')
            })
            .select()
            .single();

        if (error) {
            console.error('Error casting vote:', error);

            if (error.code === '23505') { // Unique constraint violation
                return NextResponse.json({
                    error: 'Sua unidade já votou nesta pauta'
                }, { status: 409 });
            }

            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // Audit log
        await adminClient.from('assembly_audit_logs').insert({
            assembly_id: assemblyId,
            event_type: 'vote.cast',
            actor_id: user.id,
            actor_role: profile.role,
            target_type: 'pauta',
            target_id: pautaId,
            details: {
                choice,
                unit_id: profile.unit_id,
                origin: body.origin || 'web'
            },
            ip_address: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip'),
            user_agent: req.headers.get('user-agent')
        });

        return NextResponse.json({
            status: 'voted',
            vote: {
                id: vote.id,
                choice: vote.choice,
                created_at: vote.created_at
            }
        });
    } catch (e: any) {
        console.error('Exception in vote POST:', e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
