import { createBrowserClient } from '@supabase/ssr';

// CLIENTE SUPABASE PARA BROWSER
// Usa createBrowserClient do @supabase/ssr para sincronizar cookies corretamente
// com o servidor (middleware/API routes)
// 
// Configuração: Sessão expira quando o navegador fecha
// - storageKey: define onde armazenar a sessão
// - storage: usa sessionStorage para que a sessão expire ao fechar o navegador
export function createClient() {
    return createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            auth: {
                // Usar sessionStorage: sessão expira quando navegador fecha
                storage: typeof window !== 'undefined' ? window.sessionStorage : undefined,
                // Desabilitar refresh automático de token quando inativo
                autoRefreshToken: true,
                // Detectar sessão de outras abas (desabilitar para isolamento)
                detectSessionInUrl: true,
            }
        }
    );
}
