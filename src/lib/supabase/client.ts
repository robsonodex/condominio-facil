import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';

// Singleton instance for browser client
let browserClient: SupabaseClient | null = null;

/**
 * SUPABASE BROWSER CLIENT (SINGLETON)
 * 
 * Retorna sempre a MESMA instância do cliente Supabase no browser.
 * Isso evita criar múltiplas instâncias a cada renderização,
 * o que causaria overhead desnecessário e potencial exaustão de conexões.
 * 
 * IMPORTANTE:
 * - No browser, UMA instância é compartilhada por toda a aplicação
 * - A instância gerencia automaticamente o refresh de tokens
 * - Os cookies são sincronizados automaticamente com o servidor
 * 
 * @returns {SupabaseClient} A mesma instância do cliente Supabase
 */
export function createClient(): SupabaseClient {
    if (browserClient) {
        return browserClient;
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!url || !key) {
        throw new Error('Missing required Supabase environment variables: NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY');
    }

    browserClient = createBrowserClient(url, key);

    return browserClient;
}

/**
 * Reset the singleton (useful for testing or complete logout scenarios)
 * Chamado quando o usuário faz logout para garantir um estado limpo
 */
export function resetClient(): void {
    browserClient = null;
}
