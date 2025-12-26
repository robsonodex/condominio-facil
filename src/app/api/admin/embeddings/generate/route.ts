import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import OpenAI from 'openai';

/**
 * API ENDPOINT: /api/admin/embeddings/generate
 * Gera embeddings para itens na tabela price_benchmarks que ainda não possuem.
 * Restrito a superadmin.
 */

export async function POST(req: NextRequest) {
    try {
        const supabase = await createClient();

        // 1. Verificar autenticação e permissão
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        const { data: profile } = await supabase
            .from('users')
            .select('role')
            .eq('id', user.id)
            .single();

        if (profile?.role !== 'superadmin') {
            return NextResponse.json({ error: 'Acesso restrito a administradores' }, { status: 403 });
        }

        // 2. Inicializar OpenAI
        const openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
        });

        // 3. Buscar benchmarks sem embedding
        const { data: benchmarks, error: fetchError } = await supabaseAdmin
            .from('price_benchmarks')
            .select('id, service_description')
            .is('embedding', null);

        if (fetchError) {
            throw fetchError;
        }

        if (!benchmarks || benchmarks.length === 0) {
            return NextResponse.json({ message: 'Todos os itens já possuem embeddings.', count: 0 });
        }

        const results = {
            total: benchmarks.length,
            success: 0,
            errors: 0
        };

        // 4. Gerar em lotes ou sequencialmente (sequencial é mais seguro para rate limit)
        for (const item of benchmarks) {
            try {
                const response = await openai.embeddings.create({
                    model: "text-embedding-3-small",
                    input: item.service_description,
                    dimensions: 1536
                });

                const embedding = response.data[0].embedding;

                const { error: updateError } = await supabaseAdmin
                    .from('price_benchmarks')
                    .update({ embedding })
                    .eq('id', item.id);

                if (updateError) throw updateError;

                results.success++;
            } catch (err) {
                console.error(`Erro ao gerar embedding para item ${item.id}:`, err);
                results.errors++;
            }
        }

        return NextResponse.json({
            message: `Processamento concluído. ${results.success} atualizados, ${results.errors} erros.`,
            results
        });

    } catch (error: any) {
        console.error('[GENERATE_EMBEDDINGS_ERROR]:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
