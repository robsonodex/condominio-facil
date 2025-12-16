import { createBrowserClient } from '@supabase/ssr';

// CLIENTE SUPABASE PARA BROWSER
// Usa createBrowserClient do @supabase/ssr para sincronizar cookies corretamente
// com o servidor (middleware/API routes)
// 
// IMPORTANTE: Não usar storage customizado pois isso quebra a sincronização
// de cookies com o servidor (APIs precisam dos cookies para autenticação)
export function createClient() {
    return createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
}
