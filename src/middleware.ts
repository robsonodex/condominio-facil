import { type NextRequest, NextResponse } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

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

export async function middleware(request: NextRequest) {
    // Primeiro, atualizar sessão do Supabase
    const response = await updateSession(request);

    const { pathname } = request.nextUrl;

    // Verificar se é rota protegida que requer aceite legal
    const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));

    if (isProtectedRoute) {
        try {
            // Verificar aceite legal
            const checkResponse = await fetch(`${request.nextUrl.origin}/api/legal/check`, {
                headers: {
                    cookie: request.headers.get('cookie') || '',
                },
            });

            if (checkResponse.ok) {
                const data = await checkResponse.json();

                // Se não aceitou, redirecionar para página de aceite
                if (!data.accepted) {
                    const aceiteUrl = new URL('/onboarding/aceite', request.url);
                    return NextResponse.redirect(aceiteUrl);
                }
            }
        } catch (error) {
            console.error('Middleware error checking legal acceptance:', error);
            // Em caso de erro, permitir acesso mas logar o erro
        }
    }

    return response;
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
