import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';

// GET - Verify ATA hash (public endpoint)
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ hash: string }> }
) {
    const { hash } = await params;

    try {
        // Use service role to bypass RLS (public verification)
        const adminClient = createServiceClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        const { data: ata, error } = await adminClient
            .from('assembly_atas')
            .select('id, hash_sha256, generated_at, assembly_id')
            .eq('hash_sha256', hash)
            .single();

        if (error || !ata) {
            // Log verification attempt (ignore errors)
            try {
                await adminClient.from('assembly_audit_logs').insert({
                    assembly_id: null,
                    event_type: 'ata.verify_failed',
                    details: { hash, reason: 'not_found' },
                    ip_address: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip'),
                    user_agent: req.headers.get('user-agent')
                });
            } catch { /* ignore */ }

            return NextResponse.json({
                valid: false,
                message: 'Documento não encontrado ou adulterado'
            });
        }

        // Get assembly details separately to avoid nested select issues
        const { data: assembly } = await adminClient
            .from('assembleias')
            .select('id, title, date, condo_id')
            .eq('id', ata.assembly_id)
            .single();

        let condoName = null;
        if (assembly?.condo_id) {
            const { data: condo } = await adminClient
                .from('condos')
                .select('name')
                .eq('id', assembly.condo_id)
                .single();
            condoName = condo?.name;
        }

        // Log successful verification
        try {
            await adminClient.from('assembly_audit_logs').insert({
                assembly_id: ata.assembly_id,
                event_type: 'ata.verified',
                details: { hash },
                ip_address: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip'),
                user_agent: req.headers.get('user-agent')
            });
        } catch { /* ignore */ }

        return NextResponse.json({
            valid: true,
            assembly_id: assembly?.id,
            assembly_title: assembly?.title,
            assembly_date: assembly?.date,
            condo_name: condoName,
            generated_at: ata.generated_at
        });
    } catch (e: unknown) {
        console.error('Exception in verify GET:', e);
        return NextResponse.json({
            valid: false,
            message: 'Erro ao verificar documento'
        }, { status: 500 });
    }
}
