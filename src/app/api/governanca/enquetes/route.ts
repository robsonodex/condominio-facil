import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { getUserFromReq } from '@/lib/auth';

export async function POST(req: NextRequest) {
    const user = await getUserFromReq(req);
    if (!user) return NextResponse.json({ error: 'unauth' }, { status: 401 });
    const body = await req.json();
    const payload = {
        condo_id: user.condo_id,
        title: body.title,
        description: body.description,
        options: body.options, // expect array [{id,label}]
        start_at: body.start_at,
        end_at: body.end_at,
        created_by: user.id
    };
    const { data, error } = await supabaseAdmin.from('governanca_enquetes').insert([payload]).select().single();
    if (error) {
        await supabaseAdmin.from('system_errors').insert([{ condo_id: user.condo_id, level: 'high', source: 'enquete_api', message: error.message, payload: body }]);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ status: 'created', enquete: data });
}

export async function GET(req: NextRequest) {
    const user = await getUserFromReq(req);
    if (!user) return NextResponse.json({ error: 'unauth' }, { status: 401 });

    const { data, error } = await supabaseAdmin.from('governanca_enquetes')
        .select('*')
        .eq('condo_id', user.condo_id)
        .order('created_at', { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ enquetes: data });
}
