import { type NextRequest, NextResponse } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';
import { createServerClient } from '@supabase/ssr';

// Rotas protegidas que requerem aceite legal
const protectedRoutes = [
    '/dashboard',
    '/financeiro',
    '/moradores',
    '/unidades',
    '/avisos',
    '/ocorrencias',
    '/portaria',
    '/relatorios',
    '/alugueis',
    '/assinatura',
    '/suporte',
    '/admin',
];

// Rotas excluídas da verificação de aceite legal (evita loops de redirect)
const EXCLUDED_FROM_LEGAL_CHECK = [
    '/onboarding/aceite',
    '/api/legal',
    '/api/auth',
];

export async function middleware(request: NextRequest) {
    const startTime = Date.now();
    const { pathname } = request.nextUrl;

    // 1. Atualizar sessão do Supabase (auth check)
    const response = await updateSession(request);

    // 2. Verificar se é rota protegida
    const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));
    const isExcluded = EXCLUDED_FROM_LEGAL_CHECK.some(route => pathname.startsWith(route));

    if (isProtectedRoute && !isExcluded) {
        try {
            // Criar supabase client para verificar role
            const supabase = createServerClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
                {
                    cookies: {
                        getAll() {
                            return request.cookies.getAll();
                        },
                        setAll() { }, // No-op no middleware (read-only)
                    },
                }
            );

            const { data: { user } } = await supabase.auth.getUser();

            // Ler cookie de aceite legal (setado no login/onboarding)
            // NON-BLOCKING: sem chamadas HTTP/DB desnecessárias
            const legalAccepted = request.cookies.get('legal_accepted')?.value === 'true';

            // Verificar se é superadmin (não precisa aceitar termos)
            let isSuperadmin = false;
            if (user) {
                const { data: profile, error } = await supabase
                    .from('users')
                    .select('role')
                    .eq('id', user.id)
                    .single();

                if (error) {
                    console.error('[MIDDLEWARE_ERROR] Error fetching user role:', error);
                } else {
                    isSuperadmin = profile?.role === 'superadmin';
                }
            }

            if (!legalAccepted && !isSuperadmin) {
                // Redirecionar para página de aceite
                const aceiteUrl = new URL('/onboarding/aceite', request.url);

                // Log de métrica
                logMiddlewareMetrics({
                    pathname,
                    duration: Date.now() - startTime,
                    redirected: true,
                    reason: 'legal_not_accepted'
                });

                return NextResponse.redirect(aceiteUrl);
            }
        } catch (error) {
            console.error('[MIDDLEWARE_ERROR] Legal check failed:', error);
            // Fallback permissivo: permitir acesso em caso de erro
            logMiddlewareMetrics({
                pathname,
                duration: Date.now() - startTime,
                redirected: false,
                error: String(error)
            });
        }
    }

    // Log de métrica para sucesso
    if (isProtectedRoute) {
        logMiddlewareMetrics({
            pathname,
            duration: Date.now() - startTime,
            redirected: false,
            reason: 'success'
        });
    }

    return response;
}

// Função de logging de métricas (non-blocking)
function logMiddlewareMetrics(data: {
    pathname: string;
    duration: number;
    redirected: boolean;
    reason?: string;
    error?: string;
}) {
    // Log estruturado para Vercel Analytics
    console.log(JSON.stringify({
        type: 'MIDDLEWARE_METRICS',
        ...data,
        timestamp: new Date().toISOString()
    }));
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * Feel free to modify this pattern to include more paths.
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
};
