import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';

// GET - List presences for an assembly
export async function GET(
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

        const { data: presences, error } = await supabase
            .from('assembly_presences')
            .select(`
                *,
                unit:units(number, block),
                user:users(name, email)
            `)
            .eq('assembly_id', assemblyId)
            .order('checked_at', { ascending: true });

        if (error) {
            console.error('Error fetching presences:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // Get total units for quorum calculation
        const adminClient = createServiceClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        const { data: assembly } = await adminClient
            .from('assembleias')
            .select('condo_id, quorum_install')
            .eq('id', assemblyId)
            .single();

        let totalUnits = 0;
        if (assembly) {
            const { count } = await adminClient
                .from('units')
                .select('id', { count: 'exact', head: true })
                .eq('condo_id', assembly.condo_id);
            totalUnits = count || 0;
        }

        const presentUnits = new Set(presences?.map(p => p.unit_id)).size;
        const quorumPercentage = totalUnits > 0 ? (presentUnits / totalUnits) * 100 : 0;

        return NextResponse.json({
            presences,
            stats: {
                present_units: presentUnits,
                total_units: totalUnits,
                quorum_percentage: Math.round(quorumPercentage * 10) / 10,
                quorum_required: assembly?.quorum_install || 50,
                quorum_achieved: quorumPercentage >= (assembly?.quorum_install || 50)
            }
        });
    } catch (e: any) {
        console.error('Exception in presences GET:', e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

// POST - Check-in presence
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

        // Get user profile with unit
        const { data: profile } = await supabase
            .from('users')
            .select('role, condo_id, unit_id, name')
            .eq('id', user.id)
            .single();

        if (!profile || !profile.unit_id) {
            return NextResponse.json({
                error: 'Usuário não vinculado a uma unidade'
            }, { status: 403 });
        }

        // Service client for admin operations
        const adminClient = createServiceClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        // Verify assembly is open
        const { data: assembly } = await adminClient
            .from('assembleias')
            .select('status, block_defaulters, defaulter_days, condo_id')
            .eq('id', assemblyId)
            .single();

        if (!assembly || assembly.status !== 'open') {
            return NextResponse.json({
                error: 'Assembleia não está aberta'
            }, { status: 400 });
        }

        // Check if blocking defaulters
        if (assembly.block_defaulters) {
            // Check for overdue invoices
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - (assembly.defaulter_days || 30));

            const { data: overdueInvoices } = await adminClient
                .from('resident_invoices')
                .select('id')
                .eq('unit_id', profile.unit_id)
                .eq('status', 'pending')
                .lt('due_date', cutoffDate.toISOString())
                .limit(1);

            if (overdueInvoices && overdueInvoices.length > 0) {
                // Log the blocked attempt
                await adminClient.from('assembly_audit_logs').insert({
                    assembly_id: assemblyId,
                    event_type: 'presence.blocked_defaulter',
                    actor_id: user.id,
                    actor_role: profile.role,
                    target_type: 'unit',
                    target_id: profile.unit_id,
                    details: { reason: 'inadimplente' },
                    ip_address: req.headers.get('x-forwarded-for'),
                    user_agent: req.headers.get('user-agent')
                });

                return NextResponse.json({
                    error: 'Sua unidade possui débitos pendentes. Regularize para participar.',
                    blocked: true,
                    reason: 'inadimplente'
                }, { status: 403 });
            }
        }

        // Check if already checked in
        const { data: existingPresence } = await adminClient
            .from('assembly_presences')
            .select('id, checked_at')
            .eq('assembly_id', assemblyId)
            .eq('unit_id', profile.unit_id)
            .single();

        if (existingPresence) {
            return NextResponse.json({
                status: 'already_present',
                message: 'Sua unidade já confirmou presença',
                checked_at: existingPresence.checked_at
            });
        }

        const body = await req.json().catch(() => ({}));

        // Insert presence
        const { data: presence, error } = await adminClient
            .from('assembly_presences')
            .insert({
                assembly_id: assemblyId,
                unit_id: profile.unit_id,
                user_id: user.id,
                ip_address: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip'),
                user_agent: req.headers.get('user-agent'),
                geolocation: body.geolocation,
                selfie_url: body.selfie_url,
                method: body.method || 'button'
            })
            .select()
            .single();

        if (error) {
            console.error('Error creating presence:', error);

            if (error.code === '23505') {
                return NextResponse.json({
                    status: 'already_present',
                    message: 'Sua unidade já confirmou presença'
                });
            }

            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // Audit log
        await adminClient.from('assembly_audit_logs').insert({
            assembly_id: assemblyId,
            event_type: 'presence.checkin',
            actor_id: user.id,
            actor_role: profile.role,
            target_type: 'unit',
            target_id: profile.unit_id,
            details: {
                user_name: profile.name,
                method: body.method || 'button'
            },
            ip_address: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip'),
            user_agent: req.headers.get('user-agent')
        });

        return NextResponse.json({
            status: 'checked_in',
            message: 'Presença confirmada!',
            presence: {
                id: presence.id,
                checked_at: presence.checked_at
            }
        });
    } catch (e: any) {
        console.error('Exception in presence POST:', e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
