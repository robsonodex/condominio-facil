import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Função para converter File para base64
async function fileToBase64(file: File): Promise<string> {
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    return buffer.toString('base64');
}

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get('file') as File;
        const condoId = formData.get('condo_id') as string;
        const userId = formData.get('user_id') as string;

        if (!file) {
            return NextResponse.json({ error: 'Arquivo não enviado' }, { status: 400 });
        }

        // 1. Converter arquivo para base64
        const base64File = await fileToBase64(file);
        const mimeType = file.type || 'image/jpeg';

        // 2. OCR Inteligente com GPT-4o (Extrai dados do PDF/Imagem)
        const completion = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                {
                    role: "system",
                    content: `Você é um Auditor de Condomínios sênior especializado no mercado do Rio de Janeiro.
                    
Analise esta imagem de orçamento e extraia os dados em JSON com o seguinte formato:
{
  "fornecedor": "Nome da empresa/prestador",
  "data_orcamento": "DD/MM/YYYY ou null",
  "items": [
    {
      "descricao": "Descrição completa do serviço",
      "quantidade": 1,
      "unidade": "global/m2/hora/unidade/mensal",
      "valor_unitario": 0.00,
      "valor_total": 0.00
    }
  ],
  "valor_total_orcamento": 0.00,
  "observacoes": "Qualquer informação relevante"
}

IMPORTANTE:
- Extraia TODOS os itens do orçamento
- Mantenha as descrições originais mas normalizadas
- Se não conseguir ler algum valor, coloque 0
- Se não for um orçamento válido, retorne { "erro": "descrição do problema" }`
                },
                {
                    role: "user",
                    content: [
                        {
                            type: "image_url",
                            image_url: {
                                url: `data:${mimeType};base64,${base64File}`,
                                detail: "high"
                            }
                        }
                    ]
                }
            ],
            response_format: { type: "json_object" },
            max_tokens: 2000,
        });

        const extractedData = JSON.parse(completion.choices[0].message.content || '{}');

        if (extractedData.erro) {
            return NextResponse.json({
                status: 'error',
                message: extractedData.erro,
            }, { status: 400 });
        }

        // 3. Para cada item, buscar benchmark correspondente
        const auditResults = [];
        let totalOriginal = 0;
        let totalBenchmark = 0;
        let totalSavings = 0;
        let hasAlert = false;

        for (const item of extractedData.items || []) {
            totalOriginal += item.valor_total || 0;

            // Gerar embedding para o item
            const embeddingResponse = await openai.embeddings.create({
                model: "text-embedding-3-small",
                input: item.descricao,
            });
            const embeddingVector = embeddingResponse.data[0].embedding;

            // Buscar serviço similar no banco
            const { data: benchmarks, error } = await supabase.rpc('match_services', {
                query_embedding: embeddingVector,
                match_threshold: 0.70,
                match_count: 1
            });

            let itemResult: any = {
                descricao: item.descricao,
                valor_orcamento: item.valor_total,
                quantidade: item.quantidade || 1,
                unidade: item.unidade,
                status: 'sem_referencia',
                mensagem: 'Não encontramos referência de preço para este serviço.',
                benchmark: null,
                variacao: null,
                economia: 0,
            };

            if (benchmarks && benchmarks.length > 0) {
                const ref = benchmarks[0];
                const valorRef = ref.avg_price_rj * (item.quantidade || 1);
                totalBenchmark += valorRef;

                const variacao = ((item.valor_total - valorRef) / valorRef) * 100;

                if (variacao > 25) {
                    // Mais de 25% acima da média = ALERTA
                    hasAlert = true;
                    const economia = item.valor_total - valorRef;
                    totalSavings += economia;

                    itemResult = {
                        ...itemResult,
                        status: 'alerta',
                        mensagem: `Valor ${variacao.toFixed(0)}% acima da média do RJ. Referência: "${ref.service_description}" custa aproximadamente R$ ${ref.avg_price_rj.toFixed(2)}/${ref.unit}.`,
                        benchmark: {
                            descricao: ref.service_description,
                            preco_medio: ref.avg_price_rj,
                            preco_min: ref.min_price_rj,
                            preco_max: ref.max_price_rj,
                            unidade: ref.unit,
                            similaridade: (ref.similarity * 100).toFixed(0) + '%',
                        },
                        variacao: variacao.toFixed(1),
                        economia: economia,
                    };
                } else if (variacao > 10) {
                    // Entre 10-25% = ATENÇÃO
                    itemResult = {
                        ...itemResult,
                        status: 'atencao',
                        mensagem: `Valor ${variacao.toFixed(0)}% acima da média, mas ainda aceitável.`,
                        benchmark: {
                            descricao: ref.service_description,
                            preco_medio: ref.avg_price_rj,
                            unidade: ref.unit,
                            similaridade: (ref.similarity * 100).toFixed(0) + '%',
                        },
                        variacao: variacao.toFixed(1),
                    };
                } else {
                    // Dentro ou abaixo da média = OK
                    itemResult = {
                        ...itemResult,
                        status: 'aprovado',
                        mensagem: variacao < 0
                            ? `Excelente! Valor ${Math.abs(variacao).toFixed(0)}% abaixo da média do RJ.`
                            : 'Preço dentro da média de mercado.',
                        benchmark: {
                            descricao: ref.service_description,
                            preco_medio: ref.avg_price_rj,
                            unidade: ref.unit,
                            similaridade: (ref.similarity * 100).toFixed(0) + '%',
                        },
                        variacao: variacao.toFixed(1),
                    };
                }
            }

            auditResults.push(itemResult);
        }

        // 4. Determinar status geral
        const overallStatus = hasAlert ? 'alert' : 'approved';
        const overallMessage = hasAlert
            ? `Atenção: Identificamos ${auditResults.filter(r => r.status === 'alerta').length} item(ns) com preços acima da média do mercado carioca.`
            : 'Orçamento aprovado! Os valores estão dentro da média de mercado do Rio de Janeiro.';

        // 5. Salvar auditoria no histórico (se tiver condo_id)
        if (condoId) {
            await supabase.from('quote_audits').insert({
                condo_id: condoId,
                user_id: userId || null,
                original_file_name: file.name,
                extracted_items: extractedData.items,
                supplier_name: extractedData.fornecedor,
                status: overallStatus,
                total_original: totalOriginal,
                total_benchmark: totalBenchmark > 0 ? totalBenchmark : null,
                savings_potential: totalSavings,
                variance_percentage: totalBenchmark > 0 ? ((totalOriginal - totalBenchmark) / totalBenchmark) * 100 : null,
                audit_details: auditResults,
                message: overallMessage,
            });
        }

        // 6. Retornar resultado
        return NextResponse.json({
            status: overallStatus,
            message: overallMessage,
            fornecedor: extractedData.fornecedor,
            data_orcamento: extractedData.data_orcamento,
            items: auditResults,
            resumo: {
                total_orcamento: totalOriginal,
                total_referencia: totalBenchmark > 0 ? totalBenchmark : null,
                economia_potencial: totalSavings,
                variacao_geral: totalBenchmark > 0
                    ? ((totalOriginal - totalBenchmark) / totalBenchmark * 100).toFixed(1) + '%'
                    : null,
                itens_em_alerta: auditResults.filter(r => r.status === 'alerta').length,
                itens_aprovados: auditResults.filter(r => r.status === 'aprovado').length,
                itens_sem_referencia: auditResults.filter(r => r.status === 'sem_referencia').length,
            }
        });

    } catch (error: any) {
        console.error('Erro na auditoria:', error);
        return NextResponse.json({
            status: 'error',
            message: 'Erro ao processar o orçamento: ' + error.message,
        }, { status: 500 });
    }
}
