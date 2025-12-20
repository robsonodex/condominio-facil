import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

/**
 * Página raiz do modo app (/app)
 * Redireciona para dashboard se logado, login se não
 */
export default async function AppRootPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
        redirect('/app/dashboard');
    } else {
        redirect('/app/login');
    }
}
