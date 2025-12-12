import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import crypto from 'crypto';

// POST - Close assembly and generate ATA
export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id: assemblyId } = await params;

    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Check if user is sindico
        const { data: profile } = await supabase
            .from('users')
            .select('role, condo_id')
            .eq('id', user.id)
            .single();

        if (!profile || !['sindico', 'superadmin'].includes(profile.role)) {
            return NextResponse.json({
                error: 'Apenas síndicos podem encerrar assembleias'
            }, { status: 403 });
        }

        const adminClient = createServiceClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        // Get assembly with details
        const { data: assembly } = await adminClient
            .from('assembleias')
            .select(`
                *,
                condo:condos(id, name, address)
            `)
            .eq('id', assemblyId)
            .single();

        if (!assembly) {
            return NextResponse.json({ error: 'Assembleia não encontrada' }, { status: 404 });
        }

        if (assembly.status !== 'open') {
            return NextResponse.json({
                error: 'Assembleia não está aberta'
            }, { status: 400 });
        }

        // Get all pautas with votes
        const { data: pautas } = await adminClient
            .from('assembly_pautas')
            .select('*')
            .eq('assembly_id', assemblyId)
            .order('order_index', { ascending: true });

        // Get all presences
        const { data: presences } = await adminClient
            .from('assembly_presences')
            .select(`
                *,
                unit:units(number, block),
                user:users(name)
            `)
            .eq('assembly_id', assemblyId)
            .order('checked_at', { ascending: true });

        // Get total units for quorum
        const { count: totalUnits } = await adminClient
            .from('units')
            .select('id', { count: 'exact', head: true })
            .eq('condo_id', assembly.condo_id);

        const presentUnits = new Set(presences?.map(p => p.unit_id)).size;
        const quorumPercentage = totalUnits ? (presentUnits / totalUnits) * 100 : 0;

        // Calculate results for each pauta
        const pautasWithResults = [];

        for (const pauta of (pautas || [])) {
            // Get votes for this pauta
            const { data: votes } = await adminClient
                .from('assembly_votes')
                .select('choice')
                .eq('pauta_id', pauta.id);

            const votesYes = votes?.filter(v => v.choice === 'yes').length || 0;
            const votesNo = votes?.filter(v => v.choice === 'no').length || 0;
            const votesAbstain = votes?.filter(v => v.choice === 'abstain').length || 0;
            const totalVotes = votesYes + votesNo + votesAbstain;

            // Calculate result based on quorum type
            let result = 'no_quorum';
            const validVotes = votesYes + votesNo; // Excluding abstentions

            if (validVotes > 0) {
                const yesPercentage = (votesYes / validVotes) * 100;

                let requiredPercentage = 50;
                switch (pauta.quorum_type) {
                    case 'simple':
                        requiredPercentage = 50;
                        break;
                    case 'absolute':
                        // Absolute = more than 50% of ALL units
                        requiredPercentage = totalUnits ? ((totalUnits / 2 + 1) / votesYes) * 100 : 50;
                        break;
                    case 'two_thirds':
                        requiredPercentage = 66.67;
                        break;
                    case 'unanimous':
                        requiredPercentage = 100;
                        break;
                    case 'custom':
                        requiredPercentage = pauta.quorum_custom || 50;
                        break;
                }

                if (yesPercentage > requiredPercentage) {
                    result = 'approved';
                } else if (yesPercentage === requiredPercentage && votesYes === votesNo) {
                    result = 'tie';
                } else {
                    result = 'rejected';
                }
            }

            // Update pauta with results
            await adminClient
                .from('assembly_pautas')
                .update({
                    status: 'closed',
                    result,
                    votes_yes: votesYes,
                    votes_no: votesNo,
                    votes_abstain: votesAbstain,
                    updated_at: new Date().toISOString()
                })
                .eq('id', pauta.id);

            pautasWithResults.push({
                order: pauta.order_index + 1,
                title: pauta.title,
                description: pauta.description,
                quorum_type: pauta.quorum_type,
                votes: {
                    yes: votesYes,
                    no: votesNo,
                    abstain: votesAbstain,
                    total: totalVotes
                },
                result
            });
        }

        const now = new Date();

        // Build ATA content
        const ataContent = {
            assembly: {
                id: assemblyId,
                title: assembly.title,
                description: assembly.description,
                condo: {
                    id: assembly.condo?.id,
                    name: assembly.condo?.name,
                    address: assembly.condo?.address
                },
                scheduled_at: assembly.date,
                opened_at: assembly.opened_at,
                closed_at: now.toISOString(),
                quorum_install: assembly.quorum_install,
                quorum_achieved: Math.round(quorumPercentage * 10) / 10
            },
            presences: presences?.map(p => ({
                unit: p.unit?.block ? `${p.unit.block}-${p.unit.number}` : p.unit?.number,
                user: p.user?.name,
                checked_at: p.checked_at
            })) || [],
            pautas: pautasWithResults,
            generated_at: now.toISOString(),
            generated_by: user.id
        };

        // Generate SHA256 hash
        const sortedContent = JSON.stringify(ataContent, Object.keys(ataContent).sort());
        const hash = crypto.createHash('sha256').update(sortedContent).digest('hex');

        // Save ATA
        const { data: ata, error: ataError } = await adminClient
            .from('assembly_atas')
            .insert({
                assembly_id: assemblyId,
                content: ataContent,
                hash_sha256: hash,
                qr_code_url: `/api/governanca/ata/verify/${hash}`,
                generated_by: user.id
            })
            .select()
            .single();

        if (ataError) {
            console.error('Error creating ATA:', ataError);
            return NextResponse.json({ error: ataError.message }, { status: 500 });
        }

        // Update assembly status
        await adminClient
            .from('assembleias')
            .update({
                status: 'finalized',
                closed_at: now.toISOString()
            })
            .eq('id', assemblyId);

        // Audit logs
        await adminClient.from('assembly_audit_logs').insert([
            {
                assembly_id: assemblyId,
                event_type: 'assembly.closed',
                actor_id: user.id,
                actor_role: profile.role,
                details: {
                    total_pautas: pautasWithResults.length,
                    total_presences: presences?.length || 0,
                    quorum_achieved: quorumPercentage
                },
                ip_address: req.headers.get('x-forwarded-for'),
                user_agent: req.headers.get('user-agent')
            },
            {
                assembly_id: assemblyId,
                event_type: 'ata.generated',
                actor_id: user.id,
                actor_role: profile.role,
                target_type: 'ata',
                target_id: ata.id,
                details: { hash },
                ip_address: req.headers.get('x-forwarded-for'),
                user_agent: req.headers.get('user-agent')
            }
        ]);

        return NextResponse.json({
            status: 'closed',
            message: 'Assembleia encerrada com sucesso!',
            ata: {
                id: ata.id,
                hash: hash,
                verify_url: `/governanca/ata/verify/${hash}`,
                results: pautasWithResults
            }
        });
    } catch (e: any) {
        console.error('Exception in close POST:', e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
