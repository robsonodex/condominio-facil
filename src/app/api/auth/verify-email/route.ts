import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const token = searchParams.get('token');

        if (!token) {
            return NextResponse.redirect(new URL('/login?error=invalid_token', request.url));
        }

        const supabase = await createClient();

        // Decode token (format: base64(user_id))
        const userId = Buffer.from(token, 'base64').toString('utf-8');

        // Update user to active
        const { error } = await supabase
            .from('users')
            .update({ ativo: true })
            .eq('id', userId)
            .eq('ativo', false); // Only update if not already active

        if (error) {
            console.error('[Verify] Error:', error);
            return NextResponse.redirect(new URL('/login?error=verification_failed', request.url));
        }

        // Redirect to login with success message
        return NextResponse.redirect(new URL('/login?verified=true', request.url));

    } catch (error) {
        console.error('[Verify] Exception:', error);
        return NextResponse.redirect(new URL('/login?error=verification_failed', request.url));
    }
}
