import { createBrowserClient } from '@supabase/ssr';

// CLIENTE SUPABASE PARA BROWSER
// Usa createBrowserClient do @supabase/ssr para sincronizar cookies corretamente
// com o servidor (middleware/API routes)
// 
// IMPORTANTE: Não usar storage customizado pois isso quebra a sincronização
// de cookies com o servidor (APIs precisam dos cookies para autenticação)
export function createClient() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!url || !key) {
        throw new Error('Supabase URL and Key are required in environment variables');
    }

    return createBrowserClient(url, key);
}
