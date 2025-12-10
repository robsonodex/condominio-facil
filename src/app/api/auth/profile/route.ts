import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

// GET: Fetch current user's profile (bypasses RLS)
export async function GET(request: NextRequest) {
    try {
        // Verify supabaseAdmin is configured
        const hasServiceKey = !!process.env.SUPABASE_SERVICE_ROLE_KEY;
        console.log('[PROFILE API] Service key configured:', hasServiceKey, 'Key length:', process.env.SUPABASE_SERVICE_ROLE_KEY?.length || 0);

        console.log('[PROFILE API] Request received');

        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        console.log('[PROFILE API] Auth result:', user?.email || 'NO USER', authError?.message || 'no auth error');

        if (!user || !user.email) {
            console.log('[PROFILE API] No authenticated user or no email');
            return NextResponse.json({ profile: null });
        }

        console.log('[PROFILE API] Fetching profile for:', user.email, 'AuthID:', user.id);

        // PRIORITY 1: Fetch by EMAIL (most reliable)
        const { data: profileByEmail, error: emailError } = await supabaseAdmin
            .from('users')
            .select('*')
            .eq('email', user.email)
            .eq('ativo', true)
            .single();

        if (profileByEmail) {
            console.log('[PROFILE API] ✅ Found by EMAIL - Role:', profileByEmail.role, 'ID:', profileByEmail.id);
            return NextResponse.json({ profile: profileByEmail });
        }

        console.log('[PROFILE API] Email lookup failed:', emailError?.message, emailError?.code);

        // PRIORITY 2: Try by auth ID
        const { data: profileById, error: idError } = await supabaseAdmin
            .from('users')
            .select('*')
            .eq('id', user.id)
            .eq('ativo', true)
            .single();

        if (profileById) {
            console.log('[PROFILE API] ✅ Found by ID - Role:', profileById.role);
            return NextResponse.json({ profile: profileById });
        }

        console.log('[PROFILE API] ID lookup failed:', idError?.message, idError?.code);

        // PRIORITY 3: Check if user exists but is inactive
        const { data: inactiveUser } = await supabaseAdmin
            .from('users')
            .select('id, email, role, ativo')
            .eq('email', user.email)
            .single();

        if (inactiveUser) {
            console.log('[PROFILE API] ⚠️ User found but INACTIVE:', inactiveUser.email, 'ativo:', inactiveUser.ativo);
        } else {
            console.log('[PROFILE API] ❌ User NOT FOUND in users table for email:', user.email);
        }

        return NextResponse.json({ profile: null });

    } catch (error: any) {
        console.error('[PROFILE API] Exception:', error.message);
        return NextResponse.json({ profile: null });
    }
}
