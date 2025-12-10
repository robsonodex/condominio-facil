import { createClient as createSupabaseClient } from '@supabase/supabase-js';

export function createClient() {
    // TESTE: Cliente simples sem SSR para debugar timeout
    return createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
}
