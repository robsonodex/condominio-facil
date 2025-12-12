import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { getUserFromReq } from '@/lib/auth';

export async function POST(req: NextRequest) {
    const user = await getUserFromReq(req);
    if (!user || user.role !== 'sindico') return NextResponse.json({ error: 'unauth' }, { status: 401 });

    const body = await req.json();
    const { data, error } = await supabaseAdmin.from('assembleias').insert([{
        condo_id: user.condo_id,
        title: body.title,
        agenda: body.agenda,
        start_at: body.start_at,
        created_by: user.id
    }]).select().single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ assembleia: data });
}

export async function GET(req: NextRequest) {
    const user = await getUserFromReq(req);
    if (!user) return NextResponse.json({ error: 'unauth' }, { status: 401 });

    const { data, error } = await supabaseAdmin.from('assembleias')
        .select('*')
        .eq('condo_id', user.condo_id)
        .order('start_at', { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ assembleias: data });
}
