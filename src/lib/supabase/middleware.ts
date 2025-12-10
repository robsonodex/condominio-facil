import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
    let supabaseResponse = NextResponse.next({
        request,
    });

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll();
                },
                setAll(cookiesToSet: Array<{ name: string; value: string; options?: any }>) {
                    cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
                    supabaseResponse = NextResponse.next({
                        request,
                    });
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    );
                },
            },
        }
    );

    // IMPORTANT: Avoid writing any logic between createServerClient and
    // supabase.auth.getUser(). A simple mistake could make it very hard to debug
    // issues with users being randomly logged out.

    const {
        data: { user },
    } = await supabase.auth.getUser();

    // Proteção de rotas - lógica simplificada sem loops
    const protectedPaths = ['/dashboard', '/admin', '/financeiro', '/moradores', '/unidades', '/avisos', '/ocorrencias', '/portaria', '/relatorios', '/usuarios', '/alugueis', '/assinatura', '/suporte', '/perfil', '/boletos'];
    const isProtectedRoute = protectedPaths.some(path => request.nextUrl.pathname.startsWith(path));

    // Se não tem usuário E está tentando acessar rota protegida → login
    if (!user && isProtectedRoute) {
        const url = request.nextUrl.clone();
        url.pathname = '/login';
        return NextResponse.redirect(url);
    }

    // Se tem usuário E está na página de login → dashboard
    // IMPORTANTE: só redireciona se vier DIRETAMENTE do /login, não de outras páginas
    if (user && request.nextUrl.pathname === '/login') {
        const url = request.nextUrl.clone();
        url.pathname = '/dashboard';
        return NextResponse.redirect(url);
    }

    return supabaseResponse;
}
