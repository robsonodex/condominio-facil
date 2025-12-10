import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, getSessionFromReq } from '@/lib/supabase/admin';

// GET: Listar assinaturas próximas do vencimento ou vencidas
export async function GET(request: NextRequest) {
    try {
        const session = await getSessionFromReq(request);
        if (!session || !session.isSuperadmin) {
            return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const filter = searchParams.get('filter') || 'expiring'; // expiring | expired | all

        const today = new Date();
        const in7Days = new Date(today);
        in7Days.setDate(in7Days.getDate() + 7);

        let query = supabaseAdmin
            .from('subscriptions')
            .select(`
                id,
                status,
                data_inicio,
                data_renovacao,
                valor_mensal_cobrado,
                condo:condos(id, nome),
                plan:plans(nome_plano)
            `)
            .eq('status', 'ativo');

        if (filter === 'expiring') {
            // Próximos 7 dias
            query = query
                .gte('data_renovacao', today.toISOString().split('T')[0])
                .lte('data_renovacao', in7Days.toISOString().split('T')[0]);
        } else if (filter === 'expired') {
            // Já vencidas
            query = query.lt('data_renovacao', today.toISOString().split('T')[0]);
        }

        const { data: subscriptions, error } = await query.order('data_renovacao', { ascending: true });

        if (error) {
            console.error('[REMINDERS] Error fetching subscriptions:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // Para cada assinatura, buscar o síndico responsável
        const enrichedSubscriptions = await Promise.all(
            (subscriptions || []).map(async (sub: any) => {
                const { data: sindico } = await supabaseAdmin
                    .from('users')
                    .select('id, nome, email')
                    .eq('condo_id', sub.condo?.id)
                    .eq('role', 'sindico')
                    .eq('ativo', true)
                    .single();

                const renovacao = new Date(sub.data_renovacao);
                const diffDays = Math.ceil((renovacao.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

                return {
                    ...sub,
                    sindico,
                    dias_para_vencimento: diffDays,
                    status_lembrete: diffDays < 0 ? 'vencido' : diffDays <= 1 ? 'urgente' : diffDays <= 3 ? 'proximo' : 'normal'
                };
            })
        );

        return NextResponse.json({
            subscriptions: enrichedSubscriptions,
            total: enrichedSubscriptions.length,
            stats: {
                vencidos: enrichedSubscriptions.filter(s => s.dias_para_vencimento < 0).length,
                urgentes: enrichedSubscriptions.filter(s => s.dias_para_vencimento >= 0 && s.dias_para_vencimento <= 1).length,
                proximos: enrichedSubscriptions.filter(s => s.dias_para_vencimento > 1 && s.dias_para_vencimento <= 3).length,
                normais: enrichedSubscriptions.filter(s => s.dias_para_vencimento > 3).length,
            }
        });

    } catch (error: any) {
        console.error('[REMINDERS] Error:', error);
        return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
    }
}

// POST: Enviar lembrete manual
export async function POST(request: NextRequest) {
    try {
        const session = await getSessionFromReq(request);
        if (!session || !session.isSuperadmin) {
            return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
        }

        const body = await request.json();
        const { subscription_id, send_all } = body;

        // Se send_all, buscar todas as assinaturas próximas do vencimento
        let subscriptionsToNotify: any[] = [];

        if (send_all) {
            const today = new Date();
            const in7Days = new Date(today);
            in7Days.setDate(in7Days.getDate() + 7);

            const { data } = await supabaseAdmin
                .from('subscriptions')
                .select('id, data_renovacao, condo:condos(id, nome), plan:plans(nome_plano), valor_mensal_cobrado')
                .eq('status', 'ativo')
                .lte('data_renovacao', in7Days.toISOString().split('T')[0])
                .order('data_renovacao');

            subscriptionsToNotify = data || [];
        } else if (subscription_id) {
            const { data } = await supabaseAdmin
                .from('subscriptions')
                .select('id, data_renovacao, condo:condos(id, nome), plan:plans(nome_plano), valor_mensal_cobrado')
                .eq('id', subscription_id)
                .single();

            if (data) subscriptionsToNotify = [data];
        }

        if (subscriptionsToNotify.length === 0) {
            return NextResponse.json({ error: 'Nenhuma assinatura encontrada' }, { status: 404 });
        }

        let enviados = 0;
        let erros = 0;
        const resultados: any[] = [];

        for (const sub of subscriptionsToNotify) {
            // Buscar síndico
            const { data: sindico } = await supabaseAdmin
                .from('users')
                .select('id, nome, email')
                .eq('condo_id', sub.condo?.id)
                .eq('role', 'sindico')
                .eq('ativo', true)
                .single();

            if (!sindico?.email) {
                erros++;
                resultados.push({ condo: sub.condo?.nome, status: 'erro', motivo: 'Síndico sem email' });
                continue;
            }

            const renovacao = new Date(sub.data_renovacao);
            const today = new Date();
            const diffDays = Math.ceil((renovacao.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

            // Enviar email
            try {
                const emailResponse = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/email`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        tipo: diffDays < 0 ? 'subscription_expired' : 'subscription_reminder',
                        destinatario: sindico.email,
                        dados: {
                            nome: sindico.nome,
                            condoNome: sub.condo?.nome,
                            plano: sub.plan?.nome_plano,
                            valor: sub.valor_mensal_cobrado?.toFixed(2),
                            dataVencimento: renovacao.toLocaleDateString('pt-BR'),
                            diasRestantes: Math.abs(diffDays),
                            assinaturaUrl: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/assinatura`,
                        },
                        internalCall: true,
                    }),
                });

                if (emailResponse.ok) {
                    enviados++;
                    resultados.push({ condo: sub.condo?.nome, sindico: sindico.nome, status: 'enviado' });
                } else {
                    erros++;
                    resultados.push({ condo: sub.condo?.nome, status: 'erro', motivo: 'Falha no envio' });
                }
            } catch (e) {
                erros++;
                resultados.push({ condo: sub.condo?.nome, status: 'erro', motivo: 'Exceção no envio' });
            }
        }

        // Log da ação
        await supabaseAdmin.from('system_logs').insert({
            event: 'SUBSCRIPTION_REMINDERS_SENT',
            level: 'info',
            meta: {
                enviados,
                erros,
                total: subscriptionsToNotify.length,
                admin_id: session.userId,
            }
        });

        return NextResponse.json({
            success: true,
            message: `${enviados} lembrete(s) enviado(s)${erros > 0 ? `, ${erros} erro(s)` : ''}`,
            enviados,
            erros,
            resultados,
        });

    } catch (error: any) {
        console.error('[REMINDERS] POST Error:', error);
        return NextResponse.json({ error: 'Erro ao enviar lembretes' }, { status: 500 });
    }
}
