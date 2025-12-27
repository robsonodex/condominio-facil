/**
 * Cron Job: Aprendizado de Preços (Crowdsourcing)
 * 
 * Este job roda diariamente às 03:00 e processa despesas
 * não processadas para atualizar os benchmarks de preços.
 * 
 * Algoritmo:
 * 1. Busca despesas não processadas
 * 2. Gera embedding da descrição
 * 3. Encontra benchmark similar (> 85% similaridade)
 * 4. Detecta outliers (valores fora de 50%-300% da média)
 * 5. Atualiza média ponderada
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

// Cliente Admin para ignorar RLS (precisamos ler dados de todos os condomínios)
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Configurações
const BATCH_SIZE = 50; // Processar 50 por vez para não estourar timeout
const SIMILARITY_THRESHOLD = 0.85; // 85% de similaridade mínima
const OUTLIER_MIN_RATIO = 0.5; // Valor mínimo aceito: 50% da média
const OUTLIER_MAX_RATIO = 3.0; // Valor máximo aceito: 300% da média

interface FinancialEntry {
    id: string;
    descricao: string;
    valor: number;
    categoria: string;
    condo_id: string;
}

interface BenchmarkMatch {
    id: string;
    service_name: string;
    avg_price_rj: number;
    similarity: number;
}

interface PriceBenchmark {
    id: string;
    service_name: string;
    avg_price_rj: number;
    sample_size: number;
    price_min: number | null;
    price_max: number | null;
    contribution_count: number;
}

export async function GET(request: NextRequest) {
    const startTime = Date.now();

    try {
        // Verificar autenticação do cron (Vercel)
        const authHeader = request.headers.get('authorization');
        if (authHeader !== `Bearer ${process.env.CRON_SECRET}` &&
            process.env.NODE_ENV === 'production') {
            // Em produção, exigir token do cron
            // Vercel envia automaticamente o CRON_SECRET
            console.log('[LearnPrices] Acesso não autorizado');
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        console.log('[LearnPrices] Iniciando processamento...');

        // 1. Buscar despesas pendentes de processamento (Lote limitado)
        const { data: entries, error: fetchError } = await supabaseAdmin
            .from('financial_entries')
            .select('id, descricao, valor, categoria, condo_id')
            .eq('tipo', 'despesa')
            .eq('benchmark_processed', false)
            .not('descricao', 'is', null)
            .gt('valor', 0)
            .limit(BATCH_SIZE);

        if (fetchError) {
            console.error('[LearnPrices] Erro ao buscar entries:', fetchError);
            throw fetchError;
        }

        if (!entries || entries.length === 0) {
            console.log('[LearnPrices] Nenhum dado novo para aprender.');
            return NextResponse.json({
                success: true,
                message: 'Nenhum dado novo para aprender.',
                processed: 0,
                benchmarks_updated: 0,
                duration_ms: Date.now() - startTime
            });
        }

        console.log(`[LearnPrices] Processando ${entries.length} despesas...`);

        let processedCount = 0;
        let updatedCount = 0;
        let outlierCount = 0;
        let noMatchCount = 0;

        for (const entry of entries as FinancialEntry[]) {
            try {
                // 2. Gerar Embedding da descrição real
                const embeddingResponse = await openai.embeddings.create({
                    model: "text-embedding-3-small",
                    input: `${entry.categoria}: ${entry.descricao}`,
                });
                const vector = embeddingResponse.data[0].embedding;

                // 3. Buscar Benchmark Similar usando função RPC
                const { data: matches, error: matchError } = await supabaseAdmin.rpc('match_services', {
                    query_embedding: vector,
                    match_threshold: SIMILARITY_THRESHOLD,
                    match_count: 1
                });

                if (matchError) {
                    console.error(`[LearnPrices] Erro no match para entry ${entry.id}:`, matchError);
                    // Marcar como processado mesmo com erro para não ficar em loop
                    await markAsProcessed(entry.id);
                    processedCount++;
                    continue;
                }

                if (!matches || matches.length === 0) {
                    // Sem match encontrado
                    noMatchCount++;
                    await logLearning(entry.id, null, entry.valor, null, null, 0, false, false);
                    await markAsProcessed(entry.id);
                    processedCount++;
                    continue;
                }

                const match = matches[0] as BenchmarkMatch;

                // Buscar dados completos do benchmark
                const { data: currentBench, error: benchError } = await supabaseAdmin
                    .from('price_benchmarks')
                    .select('*')
                    .eq('id', match.id)
                    .single();

                if (benchError || !currentBench) {
                    console.error(`[LearnPrices] Benchmark não encontrado: ${match.id}`);
                    await markAsProcessed(entry.id);
                    processedCount++;
                    continue;
                }

                const benchmark = currentBench as PriceBenchmark;
                const oldAvg = benchmark.avg_price_rj;

                // 4. Detecção de Outlier (Faixa de segurança de 50% a 300%)
                const isOutlier = entry.valor < (oldAvg * OUTLIER_MIN_RATIO) ||
                    entry.valor > (oldAvg * OUTLIER_MAX_RATIO);

                if (isOutlier) {
                    console.log(`[LearnPrices] Outlier detectado: ${entry.descricao} = R$${entry.valor} (média: R$${oldAvg})`);
                    outlierCount++;
                    await logLearning(entry.id, benchmark.id, entry.valor, oldAvg, oldAvg, match.similarity, true, false);
                    await markAsProcessed(entry.id);
                    processedCount++;
                    continue;
                }

                // 5. Cálculo da Média Ponderada
                const newSample = (benchmark.sample_size || 1) + 1;
                const oldTotal = oldAvg * (benchmark.sample_size || 1);
                const newAvg = (oldTotal + entry.valor) / newSample;

                // Atualizar min/max
                const newMin = Math.min(benchmark.price_min || entry.valor, entry.valor);
                const newMax = Math.max(benchmark.price_max || entry.valor, entry.valor);

                // 6. Atualizar Benchmark
                const { error: updateError } = await supabaseAdmin
                    .from('price_benchmarks')
                    .update({
                        avg_price_rj: Math.round(newAvg * 100) / 100, // Arredondar para 2 casas
                        sample_size: newSample,
                        last_updated_at: new Date().toISOString(),
                        price_min: newMin,
                        price_max: newMax,
                        contribution_count: (benchmark.contribution_count || 0) + 1
                    })
                    .eq('id', benchmark.id);

                if (updateError) {
                    console.error(`[LearnPrices] Erro ao atualizar benchmark:`, updateError);
                } else {
                    console.log(`[LearnPrices] Atualizado: ${benchmark.service_name} | R$${oldAvg.toFixed(2)} → R$${newAvg.toFixed(2)} (n=${newSample})`);
                    updatedCount++;
                }

                // Log de aprendizado
                await logLearning(entry.id, benchmark.id, entry.valor, oldAvg, newAvg, match.similarity, false, !updateError);

                // Marcar como processado
                await markAsProcessed(entry.id);
                processedCount++;

            } catch (entryError) {
                console.error(`[LearnPrices] Erro processando entry ${entry.id}:`, entryError);
                // Marcar como processado mesmo com erro
                await markAsProcessed(entry.id);
                processedCount++;
            }
        }

        const duration = Date.now() - startTime;

        console.log(`[LearnPrices] Concluído em ${duration}ms`);
        console.log(`  - Processados: ${processedCount}`);
        console.log(`  - Benchmarks atualizados: ${updatedCount}`);
        console.log(`  - Outliers ignorados: ${outlierCount}`);
        console.log(`  - Sem match: ${noMatchCount}`);

        return NextResponse.json({
            success: true,
            processed: processedCount,
            benchmarks_updated: updatedCount,
            outliers_skipped: outlierCount,
            no_match: noMatchCount,
            duration_ms: duration
        });

    } catch (error: any) {
        console.error('[LearnPrices] Erro fatal:', error);
        return NextResponse.json({
            error: 'Falha no aprendizado de preços',
            message: error.message
        }, { status: 500 });
    }
}

// Função auxiliar para marcar como processado
async function markAsProcessed(entryId: string) {
    await supabaseAdmin
        .from('financial_entries')
        .update({ benchmark_processed: true })
        .eq('id', entryId);
}

// Função auxiliar para logar aprendizado
async function logLearning(
    entryId: string,
    benchmarkId: string | null,
    entryValue: number,
    oldAvg: number | null,
    newAvg: number | null,
    similarity: number,
    wasOutlier: boolean,
    wasUpdated: boolean
) {
    try {
        await supabaseAdmin
            .from('price_learning_logs')
            .insert({
                financial_entry_id: entryId,
                benchmark_id: benchmarkId,
                entry_value: entryValue,
                old_avg_price: oldAvg,
                new_avg_price: newAvg,
                similarity_score: similarity,
                was_outlier: wasOutlier,
                was_updated: wasUpdated
            });
    } catch (err) {
        console.error('[LearnPrices] Erro ao logar:', err);
    }
}
