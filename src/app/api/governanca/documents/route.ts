import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { GovernanceService } from '@/lib/services/governance';

// NOTE: POST (Upload) logic is complex and often requires handling FormData. 
// For now, I'll leave the POST inline or assume it matches what we have, 
// but I will update GET to use the service for consistency.
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
    const { data, error } = await supabase.from('governance_documents').insert([{
        condo_id: profile.condo_id,
        name: body.name,
        folder: body.folder,
        storage_path: body.storage_path,
        uploaded_by: user.id
    }]).select().single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ document: data });
}

export async function GET(req: NextRequest) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: profile } = await supabase
        .from('users')
        .select('condo_id')
        .eq('id', user.id)
        .single();

    if (!profile) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const documents = await GovernanceService.getDocuments(profile.condo_id);
        return NextResponse.json({ documents });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
