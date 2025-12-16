import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createServiceRoleClient } from '@supabase/supabase-js';

/**
 * GET /api/admin/subscriptions
 * Busca todas as assinaturas (apenas para superadmin)
 * Usa service role para contornar RLS
 */
export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();

        // Verificar autenticação
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        // Verificar se é superadmin
        const { data: profile } = await supabase
            .from('users')
            .select('role')
            .eq('email', user.email)
            .single();

        if (!profile || profile.role !== 'superadmin') {
            return NextResponse.json({ error: 'Apenas superadmin' }, { status: 403 });
        }

        // Usar service role para contornar RLS
        const supabaseAdmin = createServiceRoleClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        // Buscar parâmetros de filtro
        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status');

        // Buscar assinaturas
        let query = supabaseAdmin
            .from('subscriptions')
            .select('*, condo:condos(id, nome, cidade, estado, email_contato), plan:plans(id, nome_plano, valor_mensal)')
            .order('created_at', { ascending: false });

        if (status) {
            query = query.eq('status', status);
        }

        const { data, error } = await query;

        if (error) {
            console.error('Error fetching subscriptions:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // Ensure valor_mensal_cobrado has a value (fallback to plan value)
        const subscriptions = (data || []).map(sub => ({
            ...sub,
            valor_mensal_cobrado: sub.valor_mensal_cobrado || sub.plan?.valor_mensal || 0
        }));

        return NextResponse.json({ subscriptions });

    } catch (error: any) {
        console.error('Subscriptions API error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
// PATCH /api/admin/subscriptions
export async function PATCH(request: NextRequest) {
    try {
        const supabase = await createClient();

        // Verificar autenticação
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        // Verificar se é superadmin
        const { data: profile } = await supabase
            .from('users')
            .select('role')
            .eq('email', user.email)
            .single();

        if (!profile || profile.role !== 'superadmin') {
            return NextResponse.json({ error: 'Apenas superadmin' }, { status: 403 });
        }

        const body = await request.json();
        const { id, status, valor_mensal_cobrado, observacoes } = body;

        if (!id) {
            return NextResponse.json({ error: 'ID da assinatura obrigatório' }, { status: 400 });
        }

        // Usar service role para contornar RLS
        const supabaseAdmin = createServiceRoleClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        // Buscar dados atuais da assinatura e síndico para email
        const { data: currentSub } = await supabaseAdmin
            .from('subscriptions')
            .select('*, condo:condos(id, nome, email_contato), plan:plans(nome_plano)')
            .eq('id', id)
            .single();

        if (!currentSub) {
            return NextResponse.json({ error: 'Assinatura não encontrada' }, { status: 404 });
        }

        const updateData: any = {
            updated_at: new Date().toISOString()
        };

        if (status) updateData.status = status;
        if (valor_mensal_cobrado !== undefined) updateData.valor_mensal_cobrado = valor_mensal_cobrado;
        if (observacoes !== undefined) updateData.observacoes = observacoes;

        // Atualizar assinatura
        const { error: updateError } = await supabaseAdmin
            .from('subscriptions')
            .update(updateData)
            .eq('id', id);

        if (updateError) {
            return NextResponse.json({ error: updateError.message }, { status: 500 });
        }

        // Enviar Email se houve mudança de status
        if (status && status !== currentSub.status) {
            const condoName = currentSub.condo?.nome || 'seu condomínio';
            const syndicEmail = currentSub.condo?.email_contato;

            // Buscar email do user síndico se não tiver no condo
            let targetEmail = syndicEmail;
            if (!targetEmail) {
                const { data: syndicUser } = await supabaseAdmin
                    .from('users')
                    .select('email')
                    .eq('condo_id', currentSub.condo_id)
                    .eq('role', 'sindico')
                    .single();
                targetEmail = syndicUser?.email;
            }

            if (targetEmail) {
                let emailTemplate = '';
                let emailData: any = {
                    nome: condoName,
                    condoNome: condoName,
                    planNome: currentSub.plan?.nome_plano || 'Padrão',
                    appUrl: process.env.NEXT_PUBLIC_APP_URL || 'https://www.meucondominiofacil.com'
                };

                // Determinar template baseado no novo status
                if (status === 'ativo') {
                    emailTemplate = 'condo_active';
                } else if (status === 'trialing') {
                    emailTemplate = 'condo_trial';
                    emailData.trialDays = 7;
                } else if (status === 'cancelado' || status === 'inativo') {
                    emailTemplate = 'condo_suspended';
                    emailData.reason = 'Pagamento não identificado ou solicitação de cancelamento.';
                }

                if (emailTemplate) {
                    try {
                        const emailRes = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/email`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({
                                tipo: emailTemplate,
                                destinatario: targetEmail,
                                dados: emailData,
                                internalCall: true
                            })
                        });

                        if (emailRes.ok) {
                            console.log(`Email de status '${status}' enviado para ${targetEmail}`);
                        } else {
                            const errData = await emailRes.json();
                            console.error('Erro ao enviar email:', errData);
                        }
                    } catch (emailErr) {
                        console.error('Erro ao enviar email de status:', emailErr);
                    }
                }
            }
        }

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error('Update subscription error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
