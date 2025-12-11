import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { getUserFromReq } from '@/lib/auth';

export async function POST(req: NextRequest) {
    try {
        const user = await getUserFromReq(req);
        if (!user || !['porteiro', 'superadmin'].includes(user.role)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
        const body = await req.json();
        const condo_id = user.condo_id;
        const payload = {
            condo_id,
            porteiro_id: user.id,
            entry_type: body.entry_type,
            name: body.name || null,
            document: body.document || null,
            plate: body.plate || null,
            qr_data: body.qr_data || null,
            ocr_text: body.ocr_text || null,
            photo_url: body.photo_url || null
        };
        const { data, error } = await supabaseAdmin.from('turbo_entries').insert([payload]).select().single();
        if (error) {
            await supabaseAdmin.from('system_errors').insert([{ condo_id, level: 'high', source: 'turbo-entry', message: error.message, payload: body }]);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }
        // record metric
        await supabaseAdmin.from('admin_metrics').insert([{ condo_id, key: 'turbo_entry', value: 1 }]);
        return NextResponse.json({ status: 'ok', entry: data });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
