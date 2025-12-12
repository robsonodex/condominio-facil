import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

        const { data: profile } = await supabase
            .from('users')
            .select('condo_id')
            .eq('id', user.id)
            .single();

        if (!profile) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

        const formData = await req.formData();
        const file = formData.get('photo') as File;
        if (!file) return NextResponse.json({ error: 'no file' }, { status: 400 });

        const buffer = Buffer.from(await file.arrayBuffer());
        const fileName = `turbo/${profile.condo_id}/${Date.now()}_${file.name}`;

        // Upload to Supabase Storage
        const { data, error } = await supabase.storage
            .from('condo_uploads')
            .upload(fileName, buffer, {
                contentType: file.type,
                upsert: true
            });

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
            .from('condo_uploads')
            .getPublicUrl(fileName);

        return NextResponse.json({ photo_url: publicUrl });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
