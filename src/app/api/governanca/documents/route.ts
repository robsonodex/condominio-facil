import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { getUserFromReq } from '@/lib/auth';

export async function POST(req: NextRequest) {
    const user = await getUserFromReq(req);
    if (!user) return NextResponse.json({ error: 'unauth' }, { status: 401 });

    const body = await req.json();
    const { data, error } = await supabaseAdmin.from('governanca_documents').insert([{
        condo_id: user.condo_id,
        name: body.name,
        folder: body.folder,
        storage_path: body.storage_path,
        uploaded_by: user.id
    }]).select().single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ document: data });
}

export async function GET(req: NextRequest) {
    const user = await getUserFromReq(req);
    if (!user) return NextResponse.json({ error: 'unauth' }, { status: 401 });

    const { data, error } = await supabaseAdmin.from('governanca_documents')
        .select('*')
        .eq('condo_id', user.condo_id)
        .order('uploaded_at', { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ documents: data });
}
