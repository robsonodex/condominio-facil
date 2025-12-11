import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { getUserFromReq } from '@/lib/auth';

export async function POST(req: NextRequest) {
    const user = await getUserFromReq(req);
    if (!user) return NextResponse.json({ error: 'unauth' }, { status: 401 });
    const body = await req.json();
    const { data, error } = await supabaseAdmin.from('manutencao_equipments').insert([{
        condo_id: user.condo_id,
        name: body.name,
        type: body.type,
        location: body.location
    }]).select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ equipment: data });
}

export async function GET(req: NextRequest) {
    const user = await getUserFromReq(req);
    if (!user) return NextResponse.json({ error: 'unauth' }, { status: 401 });
    const { data } = await supabaseAdmin.from('manutencao_equipments')
        .select('*, manutencao_schedule(*)')
        .eq('condo_id', user.condo_id);
    return NextResponse.json({ equipments: data });
}
