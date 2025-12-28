import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

/**
 * SUPABASE SERVER CLIENT
 * 
 * Cria uma NOVA instância para cada request do servidor.
 * Isso é NECESSÁRIO porque:
 * - Cada request tem seu próprio contexto de cookies
 * - Server Components são stateless por design
 * - O cliente precisa acessar cookies específicos do request
 * 
 * ⚠️  NÃO USE SINGLETON aqui - causaria vazamento de sessão entre usuários!
 * 
 * @returns {Promise<SupabaseClient>} Nova instância do cliente Supabase para este request
 */
export async function createClient() {
    const cookieStore = await cookies();
    const allCookies = cookieStore.getAll();

    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return allCookies;
                },
                setAll(cookiesToSet: Array<{ name: string; value: string; options?: any }>) {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) =>
                            cookieStore.set(name, value, options)
                        );
                    } catch {
                        // The `setAll` method was called from a Server Component.
                        // This can be ignored if you have middleware refreshing
                        // user sessions.
                    }
                },
            },
        }
    );
}

