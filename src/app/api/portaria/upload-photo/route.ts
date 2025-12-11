import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { getUserFromReq } from '@/lib/auth';

export async function POST(req: NextRequest) {
    try {
        const user = await getUserFromReq(req);
        if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

        const formData = await req.formData();
        const file = formData.get('photo') as File;
        if (!file) return NextResponse.json({ error: 'no file' }, { status: 400 });

        const buffer = Buffer.from(await file.arrayBuffer());
        const fileName = `turbo/${user.condo_id}/${Date.now()}_${file.name}`;

        // Upload to Supabase Storage
        const { data, error } = await supabaseAdmin.storage
            .from('condo_uploads') // Assumes bucket exists
            .upload(fileName, buffer, {
                contentType: file.type,
                upsert: true
            });

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // Get public URL
        const { data: { publicUrl } } = supabaseAdmin.storage
            .from('condo_uploads')
            .getPublicUrl(fileName);

        return NextResponse.json({ photo_url: publicUrl });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
