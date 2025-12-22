import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Routes that SuperAdmin should NOT access (operational condo pages)
const BLOCKED_FOR_SUPERADMIN = [
    '/ocorrencias',
    '/avisos',
    '/moradores',
    '/unidades',
    '/financeiro',
    '/reservas',
    '/cobrancas',
    '/minhas-cobrancas',
    '/portaria',
    '/manutencao',
    '/alugueis',
    '/boletos',
    '/notificacoes',
    '/automacoes',
    '/usuarios',
    '/governanca',
    '/relatorios',
    '/assinatura',
    '/status',
    '/configuracoes',
];

// Routes that SuperAdmin CAN access
const ALLOWED_FOR_SUPERADMIN = [
    '/admin',
    '/dashboard',
    '/perfil',
    '/suporte',
    '/api',
    '/login',
    '/register',
    '/landing',
    '/termos',
    '/privacidade',
    '/contrato',
];

export async function updateSession(request: NextRequest) {
    let supabaseResponse = NextResponse.next({
        request,
    })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet: any) {
                    cookiesToSet.forEach(({ name, value, options }: any) =>
                        request.cookies.set(name, value)
                    )
                    supabaseResponse = NextResponse.next({
                        request,
                    })
                    cookiesToSet.forEach(({ name, value, options }: any) =>
                        supabaseResponse.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    const {
        data: { user },
    } = await supabase.auth.getUser()

    // If user is logged in, check role-based redirects
    if (user) {
        const pathname = request.nextUrl.pathname;

        // Check if route is blocked for SuperAdmin
        const isBlockedRoute = BLOCKED_FOR_SUPERADMIN.some(route =>
            pathname === route || pathname.startsWith(route + '/')
        );

        if (isBlockedRoute || pathname === '/dashboard') {
            // Get user profile to check role
            const { data: profile } = await supabase
                .from('users')
                .select('role')
                .eq('id', user.id)
                .single();

            // If SuperAdmin accessing blocked route, redirect to admin dashboard
            if (profile?.role === 'superadmin' && isBlockedRoute) {
                return NextResponse.redirect(new URL('/admin', request.url));
            }

            // If Porteiro accessing /dashboard, redirect to /portaria
            if (profile?.role === 'porteiro' && pathname === '/dashboard') {
                return NextResponse.redirect(new URL('/portaria', request.url));
            }
        }
    }

    return supabaseResponse
}

