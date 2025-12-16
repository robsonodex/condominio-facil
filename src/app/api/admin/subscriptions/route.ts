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
            const syndicEmail = currentSub.condo?.email_contato; // O email do síndico geralmente está no contato do condomínio ou na tabela users (aqui assumindo via condo)

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

            if (targetEmail) { // Só envia se tiver email
                let subject = '';
                let htmlContent = '';

                // 1. ATIVAÇÃO (trialing -> ativo ou qualquer -> ativo)
                if (status === 'ativo') {
                    subject = `🚀 Assinatura Ativada - ${condoName}`;
                    htmlContent = `
                        <h1>Sua conta está ativa!</h1>
                        <p>Olá,</p>
                        <p>Temos o prazer de informar que a assinatura do <strong>${condoName}</strong> foi ativada com sucesso!</p>
                        <p>Agora você tem acesso completo aos recursos do seu plano <strong>${currentSub.plan?.nome_plano}</strong>.</p>
                        <p>Acesse o painel para começar:</p>
                        <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" style="background: #10b981; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Acessar Painel</a></p>
                    `;
                }
                // 2. PERÍODO DE TESTE (any -> trialing)
                else if (status === 'trialing') {
                    subject = `🧪 Período de Teste Iniciado - ${condoName}`;
                    htmlContent = `
                        <h1>Bem-vindo ao Período de Teste!</h1>
                        <p>Olá,</p>
                        <p>O período de teste (trial) para o <strong>${condoName}</strong> foi iniciado.</p>
                        <p>Aproveite para explorar todas as funcionalidades da plataforma.</p>
                        <p>Se precisar de ajuda, nosso suporte está à disposição.</p>
                        <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard">Acessar Painel</a></p>
                    `;
                }
                // 3. SUSPENSÃO / CANCELAMENTO (active/trialing -> cancelado/inativo)
                else if (status === 'cancelado' || status === 'inativo') {
                    subject = `⚠️ Aviso de Suspensão - ${condoName}`;
                    htmlContent = `
                        <h1>Assinatura Suspensa</h1>
                        <p>Olá,</p>
                        <p>Informamos que a assinatura do <strong>${condoName}</strong> foi marcada como <strong>${status === 'cancelado' ? 'Cancelada' : 'Inativa'}</strong>.</p>
                        <p>Se isso for um erro ou se desejar regularizar sua situação, por favor entre em contato com nosso suporte financeiro.</p>
                        <p>Dados para contato: financeiro@meucondominiofacil.com</p>
                    `;
                }

                if (subject && htmlContent) {
                    try {
                        await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/emails/send`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
                            },
                            body: JSON.stringify({
                                to: targetEmail,
                                subject,
                                html: htmlContent
                            })
                        });
                        console.log(`Email de mudança de status enviado para ${targetEmail}`);
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
