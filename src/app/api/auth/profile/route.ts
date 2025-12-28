import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

// GET: Fetch current user's profile (bypasses RLS)
// Uses Authorization header token for authentication
export async function GET(request: NextRequest) {
    try {
        // Get token from Authorization header
        const authHeader = request.headers.get('authorization');
        const token = authHeader?.replace('Bearer ', '');

        console.log('[PROFILE API] Token present:', !!token, 'Token length:', token?.length || 0);

        if (!token) {
            console.log('[PROFILE API] No token provided');
            return NextResponse.json({ profile: null });
        }

        // Verify token and get user
        const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

        console.log('[PROFILE API] Auth result:', user?.email || 'NO USER', authError?.message || 'no auth error');

        if (!user || !user.email) {
            console.log('[PROFILE API] Invalid token or no user');
            return NextResponse.json({ profile: null });
        }

        console.log('[PROFILE API] User verified:', user.email, 'ID:', user.id);

        // Fetch profile by ID (Absolute uniqueness)
        const { data: profile, error: profileError } = await supabaseAdmin
            .from('users')
            .select('*')
            .eq('id', user.id)
            .eq('ativo', true)
            .single();

        if (profile) {
            console.log('[PROFILE API] ✅ Profile found by ID - Role:', profile.role);
            return NextResponse.json({ profile });
        }

        console.log('[PROFILE API] ID lookup failed:', profileError?.message);

        // Fallback: Try by Email only if ID lookup fails and we have an email
        const { data: profileByEmail, error: emailError } = await supabaseAdmin
            .from('users')
            .select('*')
            .eq('email', user.email)
            .eq('ativo', true)
            .single();

        if (profileByEmail) {
            console.log('[PROFILE API] ✅ Found by Email - Role:', profileByEmail.role);
            return NextResponse.json({ profile: profileByEmail });
        }

        console.log('[PROFILE API] Email lookup failed:', emailError?.message);

        // Check if user exists but is inactive
        const { data: inactiveUser } = await supabaseAdmin
            .from('users')
            .select('id, email, role, ativo')
            .eq('email', user.email)
            .single();

        if (inactiveUser) {
            console.log('[PROFILE API] ⚠️ User INACTIVE:', inactiveUser.email, 'ativo:', inactiveUser.ativo);
        } else {
            console.log('[PROFILE API] ❌ User NOT FOUND for email:', user.email);
        }

        return NextResponse.json({ profile: null });

    } catch (error: any) {
        console.error('[PROFILE API] Exception:', error.message);
        return NextResponse.json({ profile: null });
    }
}

