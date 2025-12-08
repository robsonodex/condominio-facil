import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url);
    const code = searchParams.get('code');
    const next = searchParams.get('next') ?? '/dashboard';
    const type = searchParams.get('type'); // email_confirmation, recovery, etc.

    if (code) {
        const supabase = await createClient();
        const { error } = await supabase.auth.exchangeCodeForSession(code);

        if (!error) {
            // If it's password recovery, redirect to reset password page
            if (type === 'recovery') {
                return NextResponse.redirect(`${origin}/reset-password`);
            }
            // If it's an email confirmation, redirect to login with success message
            if (type === 'signup' || type === 'email_change') {
                return NextResponse.redirect(`${origin}/login?confirmed=true`);
            }
            // For other types, go to dashboard
            return NextResponse.redirect(`${origin}${next}`);
        }
    }

    // Return the user to an error page with instructions
    return NextResponse.redirect(`${origin}/login?error=auth`);
}

