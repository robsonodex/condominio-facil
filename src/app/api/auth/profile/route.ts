import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

// GET: Fetch current user's profile (bypasses RLS)
export async function GET(request: NextRequest) {
    try {
        console.log('[PROFILE API] Request received');

        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        console.log('[PROFILE API] Auth result:', user?.email || 'NO USER', authError?.message || 'no error');

        if (!user) {
            console.log('[PROFILE API] No authenticated user');
            return NextResponse.json({ profile: null });
        }

        console.log('[PROFILE API] Fetching profile for user ID:', user.id);

        // Use admin client to bypass RLS
        const { data: profile, error } = await supabaseAdmin
            .from('users')
            .select('*')
            .eq('id', user.id)
            .eq('ativo', true)
            .single();

        if (error) {
            console.error('[PROFILE API] Database error:', error.message, error.code);
            // Try fetching by email as fallback
            const { data: profileByEmail, error: emailError } = await supabaseAdmin
                .from('users')
                .select('*')
                .eq('email', user.email)
                .eq('ativo', true)
                .single();

            if (profileByEmail) {
                console.log('[PROFILE API] Found by email, role:', profileByEmail.role);
                return NextResponse.json({ profile: profileByEmail });
            }

            console.error('[PROFILE API] Email fallback also failed:', emailError?.message);
            return NextResponse.json({ profile: null });
        }

        console.log('[PROFILE API] Profile found - Role:', profile?.role, 'CondoId:', profile?.condo_id);
        return NextResponse.json({ profile });

    } catch (error: any) {
        console.error('[PROFILE API] Exception:', error.message);
        return NextResponse.json({ profile: null });
    }
}
