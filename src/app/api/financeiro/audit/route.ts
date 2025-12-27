import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// 🚀 UNIFICAÇÃO AI: Groq (Llama 3.2 Vision)
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const AUDIT_MODEL = 'llama-3.2-11b-vision-preview'; // Modelo de visão para analisar orçamentos

async function fileToBase64(file: File): Promise<string> {
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    return buffer.toString('base64');
}

// Limpa JSON do Llama
function cleanJsonResponse(text: string) {
    const match = text.match(/```json\n([\s\S]*?)\n```/);
    if (match) return match[1];
    return text.replace(/```json/g, '').replace(/```/g, '');
}

export async function POST(req: NextRequest) {
    try {
        if (!GROQ_API_KEY) {
            return NextResponse.json({ error: 'GROQ_API_KEY não configurada' }, { status: 500 });
        }

        const formData = await req.formData();
        const file = formData.get('file') as File;
        const condoId = formData.get('condo_id') as string;
        const userId = formData.get('user_id') as string;

        if (!file) {
            return NextResponse.json({ error: 'Arquivo não enviado' }, { status: 400 });
        }

        const base64File = await fileToBase64(file);
        const imageUrl = `data:${file.type || 'image/jpeg'};base64,${base64File}`;

        console.log('[Audit Groq] Iniciando análise...');

        // Chamada Groq (Llama Vision)
        const response = await fetch(GROQ_API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${GROQ_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: AUDIT_MODEL,
                messages: [
                    {
                        role: "user",
                        content: [
                            {
                                type: "text",
                                text: `Você é um Auditor de Condomínios sênior.
Analise esta imagem de orçamento e extraia os dados em JSON puro.

FORMATO ESPERADO:
{
  "fornecedor": "Nome da empresa/prestador",
  "data_orcamento": "DD/MM/YYYY ou null",
  "items": [
    {
      "descricao": "Descrição completa do serviço",
      "quantidade": 1,
      "unidade": "un/m2/hora/global",
      "valor_unitario": 0.00,
      "valor_total": 0.00
    }
  ],
  "valor_total_orcamento": 0.00,
  "observacoes": "Texto relevante"
}

REGRAS:
- Extraia TODOS os itens.
- Retorne APENAS o JSON válido.
- Se houver erro, retorne { "erro": "motivo" }.`
                            },
                            {
                                type: "image_url",
                                image_url: { url: imageUrl }
                            }
                        ]
                    }
                ],
                temperature: 0.1, // Baixa temperatura para extração exata
                max_tokens: 2000,
                response_format: { type: "json_object" }
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('[Audit Groq] Erro API:', errorText);
            throw new Error(`Erro na API Groq: ${response.status}`);
        }

        const data = await response.json();
        const content = data.choices[0]?.message?.content;

        if (!content) throw new Error('Sem resposta da IA');

        let extractedData;
        try {
            extractedData = JSON.parse(cleanJsonResponse(content));
        } catch (e) {
            console.error('[Audit] Erro JSON:', content);
            throw new Error('Erro ao interpretar resposta da IA');
        }

        if (extractedData.erro) {
            return NextResponse.json({ status: 'error', message: extractedData.erro }, { status: 400 });
        }

        // Lógica de Benchmark (Mantida igual, pois é interna)
        const auditResults = [];
        let totalOriginal = 0;
        let totalBenchmark = 0;
        let totalSavings = 0;
        let hasAlert = false;

        for (const item of extractedData.items || []) {
            totalOriginal += item.valor_total || 0;

            const searchTerm = item.descricao.split(' ').slice(0, 3).join(' ');
            const { data: benchmarks } = await supabase
                .from('service_benchmarks')
                .select('*')
                .ilike('service_description', `%${searchTerm}%`)
                .limit(1);

            let itemResult: any = {
                descricao: item.descricao,
                valor_orcamento: item.valor_total,
                quantidade: item.quantidade || 1,
                unidade: item.unidade,
                status: 'sem_referencia',
                mensagem: 'Não encontramos referência de preço.',
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
                    hasAlert = true;
                    totalSavings += (item.valor_total - valorRef);
                    itemResult = { ...itemResult, status: 'alerta', mensagem: `Valor ${variacao.toFixed(0)}% acima da média.`, benchmark: ref, variacao: variacao.toFixed(1) };
                } else if (variacao > 10) {
                    itemResult = { ...itemResult, status: 'atencao', mensagem: `Valor ${variacao.toFixed(0)}% acima da média.`, benchmark: ref, variacao: variacao.toFixed(1) };
                } else {
                    itemResult = { ...itemResult, status: 'aprovado', mensagem: 'Valor dentro da média.', benchmark: ref, variacao: variacao.toFixed(1) };
                }
            }
            auditResults.push(itemResult);
        }

        const overallStatus = hasAlert ? 'alert' : 'approved';
        const overallMessage = hasAlert
            ? `Atenção: ${auditResults.filter(r => r.status === 'alerta').length} itens acima do preço.`
            : 'Orçamento aprovado e dentro da média.';

        // Salvar auditoria
        if (condoId) {
            await supabase.from('quote_audits').insert({
                condo_id: condoId,
                user_id: userId || null,
                original_file_name: file.name,
                extracted_items: extractedData.items,
                supplier_name: extractedData.fornecedor,
                status: overallStatus,
                total_original: totalOriginal,
                total_benchmark: totalBenchmark || 0,
                savings_potential: totalSavings,
                audit_details: auditResults,
                message: overallMessage,
            });
        }

        return NextResponse.json({
            status: overallStatus,
            message: overallMessage,
            fornecedor: extractedData.fornecedor,
            data_orcamento: extractedData.data_orcamento,
            items: auditResults,
            resumo: {
                total_orcamento: totalOriginal,
                total_referencia: totalBenchmark || null,
                economia_potencial: totalSavings,
                itens_em_alerta: auditResults.filter(r => r.status === 'alerta').length,
            }
        });

    } catch (error: any) {
        console.error('Erro na auditoria:', error);
        return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
    }
}
