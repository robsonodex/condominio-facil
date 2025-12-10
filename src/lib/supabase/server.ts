import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function createClient() {
    const cookieStore = await cookies();
    const allCookies = cookieStore.getAll();

    // Debug: Log cookie names (not values for security)
    console.log('[SERVER] Creating Supabase client, cookies found:', allCookies.map(c => c.name).join(', ') || 'NONE');

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
