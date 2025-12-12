import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

        const { data: profile } = await supabase
            .from('users')
            .select('role, condo_id')
            .eq('id', user.id)
            .single();

        if (!profile || !['porteiro', 'superadmin'].includes(profile.role)) {
            return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const payload = {
            condo_id: profile.condo_id,
            porteiro_id: user.id,
            entry_type: body.entry_type,
            name: body.name || null,
            document: body.document || null,
            plate: body.plate || null,
            qr_data: body.qr_data || null,
            ocr_text: body.ocr_text || null,
            photo_url: body.photo_url || null
        };

        const { data, error } = await supabase.from('turbo_entries').insert([payload]).select().single();
        if (error) {
            console.error('Turbo entry error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ status: 'ok', entry: data });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
