import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url);
    const code = searchParams.get('code');
    const next = searchParams.get('next') ?? '/dashboard';
    const type = searchParams.get('type');

    // For password recovery, redirect to reset-password with code
    // Let the client-side handle the code exchange
    if (code && type === 'recovery') {
        return NextResponse.redirect(`${origin}/reset-password?code=${code}`);
    }

    if (code) {
        const supabase = await createClient();
        const { error } = await supabase.auth.exchangeCodeForSession(code);

        if (!error) {
            // Se é confirmação de email (signup ou email_change), redirecionar para aceite legal
            if (type === 'signup' || type === 'email_change') {
                console.log('[AUTH_CALLBACK] Email confirmed, redirecting to legal acceptance');
                return NextResponse.redirect(`${origin}/onboarding/aceite`);
            }
            // Outros tipos: usar parâmetro next ou dashboard como fallback
            console.log('[AUTH_CALLBACK] Auth successful, redirecting to:', next);
            return NextResponse.redirect(`${origin}${next}`);
        }
    }

    return NextResponse.redirect(`${origin}/login?error=auth`);
}
