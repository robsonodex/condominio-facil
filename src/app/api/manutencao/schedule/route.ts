import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { getUserFromReq } from '@/lib/auth';

export async function POST(req: NextRequest) {
    const user = await getUserFromReq(req);
    if (!user) return NextResponse.json({ error: 'unauth' }, { status: 401 });

    const body = await req.json();
    const { data, error } = await supabaseAdmin.from('manutencao_schedule').insert([{
        condo_id: user.condo_id,
        equipment_id: body.equipment_id,
        next_date: body.next_date,
        frequency: body.frequency
    }]).select().single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ schedule: data });
}
