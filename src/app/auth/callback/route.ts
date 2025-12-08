import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url);
    const code = searchParams.get('code');
    const next = searchParams.get('next') ?? '/dashboard';
    const type = searchParams.get('type'); // email_confirmation, recovery, etc.

    if (code) {
        const supabase = await createClient();
        const { data, error } = await supabase.auth.exchangeCodeForSession(code);

        if (!error && data.session) {
            // Create response with redirect
            let redirectUrl = `${origin}${next}`;

            // If it's password recovery, redirect to reset password page
            if (type === 'recovery') {
                redirectUrl = `${origin}/reset-password`;
            }
            // If it's an email confirmation, redirect to login with success message
            else if (type === 'signup' || type === 'email_change') {
                redirectUrl = `${origin}/login?confirmed=true`;
            }

            const response = NextResponse.redirect(redirectUrl);

            // Set auth cookies in response
            response.cookies.set('sb-access-token', data.session.access_token, {
                httpOnly: true,
                secure: true,
                sameSite: 'lax',
                path: '/',
                maxAge: 60 * 60 * 24 * 7 // 7 days
            });

            response.cookies.set('sb-refresh-token', data.session.refresh_token, {
                httpOnly: true,
                secure: true,
                sameSite: 'lax',
                path: '/',
                maxAge: 60 * 60 * 24 * 30 // 30 days
            });

            return response;
        }
    }

    // Return the user to an error page with instructions
    return NextResponse.redirect(`${origin}/login?error=auth`);
}
