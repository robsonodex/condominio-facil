import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    const supabase = await createClient();

    // 1. Verificar auth
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const { condoId, provider, credentials } = await request.json();

    if (!condoId || !provider || !credentials) {
        return NextResponse.json({ error: 'Dados incompletos' }, { status: 400 });
    }

    // 2. Verificar se é síndico deste condo ou superadmin
    const { data: profile } = await supabase
        .from('users')
        .select('role, condo_id')
        .eq('id', user.id)
        .single();

    if (profile?.role !== 'superadmin' && (profile?.role !== 'sindico' || profile?.condo_id !== condoId)) {
        return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    // 3. Upsert na tabela de integração (usando a tabela existente identificada na pesquisa)
    const { error } = await supabase
        .from('condo_integrations')
        .upsert({
            condo_id: condoId,
            tipo: 'pagamentos',
            provider: provider,
            credentials: credentials, // O Supabase/Postgres pode encriptar via pgcrypto se configurado, ou tratamos no lib
            is_active: true,
            updated_at: new Date().toISOString()
        }, {
            onConflict: 'condo_id,tipo'
        });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ message: 'Configuração de pagamento salva com sucesso' });
}
