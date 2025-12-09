import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Se usuário logado, vai para dashboard
  if (user) {
    redirect('/dashboard');
  }

  // Se não logado, redireciona para landing page pública
  redirect('/landing');
}
