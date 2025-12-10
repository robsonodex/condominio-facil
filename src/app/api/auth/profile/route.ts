import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

// GET: Fetch current user's profile (bypasses RLS)
export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ profile: null });
        }

        // Use admin client to bypass RLS
        const { data: profile, error } = await supabaseAdmin
            .from('users')
            .select('*')
            .eq('id', user.id)
            .eq('ativo', true)
            .single();

        if (error) {
            console.error('[PROFILE API] Error:', error.message);
            return NextResponse.json({ profile: null });
        }

        return NextResponse.json({ profile });

    } catch (error: any) {
        console.error('[PROFILE API] Exception:', error.message);
        return NextResponse.json({ profile: null });
    }
}
