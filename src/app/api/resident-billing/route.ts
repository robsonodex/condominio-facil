import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createServiceRoleClient } from '@supabase/supabase-js';

const MP_ACCESS_TOKEN = process.env.MERCADOPAGO_ACCESS_TOKEN;
const MP_API_URL = 'https://api.mercadopago.com';

// GET: Listar cobranças
export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        const { data: profile } = await supabase
            .from('users')
            .select('id, role, condo_id')
            .eq('id', user.id)
            .single();

        if (!profile) {
            return NextResponse.json({ error: 'Perfil não encontrado' }, { status: 404 });
        }

        let query = supabase
            .from('resident_invoices')
            .select(`
                *,
                morador:users!morador_id(id, nome, email),
                unidade:units(id, bloco, numero_unidade),
                criador:users!created_by(nome)
            `)
            .order('created_at', { ascending: false });

        // Síndico vê do seu condomínio, morador vê as suas
        if (profile.role === 'sindico') {
            query = query.eq('condo_id', profile.condo_id);
        } else if (profile.role === 'morador') {
            query = query.eq('morador_id', profile.id);
        } else if (profile.role !== 'superadmin') {
            return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
        }

        const { data, error } = await query;

        if (error) {
            console.error('Error fetching invoices:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ invoices: data || [] });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// POST: Criar cobrança
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        const { data: profile } = await supabase
            .from('users')
            .select('id, role, condo_id')
            .eq('id', user.id)
            .single();

        if (!profile || (profile.role !== 'sindico' && profile.role !== 'superadmin')) {
            return NextResponse.json({ error: 'Apenas síndicos podem criar cobranças' }, { status: 403 });
        }

        const body = await request.json();
        const { morador_id, unidade_id, descricao, valor, data_vencimento, enviar_email } = body;

        if (!morador_id || !descricao || !valor || !data_vencimento) {
            return NextResponse.json({
                error: 'Campos obrigatórios: morador_id, descricao, valor, data_vencimento'
            }, { status: 400 });
        }

        // Buscar dados do morador
        const { data: morador } = await supabase
            .from('users')
            .select('id, nome, email, condo_id')
            .eq('id', morador_id)
            .single();

        if (!morador) {
            return NextResponse.json({ error: 'Morador não encontrado' }, { status: 404 });
        }

        // Verificar se morador pertence ao mesmo condomínio
        if (profile.role === 'sindico' && morador.condo_id !== profile.condo_id) {
            return NextResponse.json({ error: 'Morador não pertence ao seu condomínio' }, { status: 403 });
        }

        const condoId = profile.role === 'sindico' ? profile.condo_id : morador.condo_id;

        // Buscar nome do condomínio
        const { data: condo } = await supabase
            .from('condos')
            .select('nome')
            .eq('id', condoId)
            .single();

        // Criar preferência de pagamento no Mercado Pago
        let linkPagamento = null;
        let gatewayId = null;

        if (MP_ACCESS_TOKEN) {
            const preferenceBody = {
                items: [{
                    id: `resident_invoice_${Date.now()}`,
                    title: `Cobrança - ${condo?.nome || 'Condomínio'}`,
                    description: descricao,
                    unit_price: parseFloat(valor),
                    quantity: 1,
                    currency_id: 'BRL'
                }],
                payer: {
                    email: morador.email,
                    name: morador.nome
                },
                external_reference: `resident_${morador_id}_${Date.now()}`,
                back_urls: {
                    success: `${process.env.NEXT_PUBLIC_APP_URL}/minhas-cobrancas?status=sucesso`,
                    failure: `${process.env.NEXT_PUBLIC_APP_URL}/minhas-cobrancas?status=falha`,
                    pending: `${process.env.NEXT_PUBLIC_APP_URL}/minhas-cobrancas?status=pendente`
                },
                auto_return: 'approved',
                notification_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/mercadopago`,
                payment_methods: {
                    excluded_payment_types: [],
                    installments: 1
                }
            };

            try {
                const mpResponse = await fetch(`${MP_API_URL}/checkout/preferences`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${MP_ACCESS_TOKEN}`,
                    },
                    body: JSON.stringify(preferenceBody),
                });

                if (mpResponse.ok) {
                    const preference = await mpResponse.json();
                    linkPagamento = preference.init_point;
                    gatewayId = preference.id;
                } else {
                    console.error('Mercado Pago error:', await mpResponse.text());
                }
            } catch (mpError) {
                console.error('Error creating MP preference:', mpError);
            }
        }

        // Inserir cobrança no banco
        const supabaseAdmin = createServiceRoleClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        const { data: invoice, error: insertError } = await supabaseAdmin
            .from('resident_invoices')
            .insert({
                condo_id: condoId,
                morador_id,
                unidade_id: unidade_id || null,
                descricao,
                valor: parseFloat(valor),
                data_vencimento,
                gateway_id: gatewayId,
                link_pagamento: linkPagamento,
                created_by: profile.id
            })
            .select()
            .single();

        if (insertError) {
            console.error('Error creating invoice:', insertError);
            return NextResponse.json({ error: insertError.message }, { status: 500 });
        }

        // Enviar email se solicitado
        if (enviar_email && morador.email && linkPagamento) {
            try {
                await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/email`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        tipo: 'resident_invoice',
                        destinatario: morador.email,
                        dados: {
                            nome: morador.nome,
                            descricao,
                            valor: parseFloat(valor).toFixed(2),
                            dataVencimento: new Date(data_vencimento).toLocaleDateString('pt-BR'),
                            linkPagamento,
                            condoNome: condo?.nome || 'Condomínio'
                        },
                        condoId,
                        internalCall: true
                    }),
                });
            } catch (emailError) {
                console.error('Error sending email:', emailError);
            }
        }

        return NextResponse.json({
            success: true,
            invoice,
            link_pagamento: linkPagamento
        });

    } catch (error: any) {
        console.error('Create invoice error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// DELETE: Cancelar cobrança
export async function DELETE(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        const { data: profile } = await supabase
            .from('users')
            .select('id, role, condo_id')
            .eq('id', user.id)
            .single();

        if (!profile || (profile.role !== 'sindico' && profile.role !== 'superadmin')) {
            return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'ID é obrigatório' }, { status: 400 });
        }

        const { error } = await supabase
            .from('resident_invoices')
            .update({ status: 'cancelado' })
            .eq('id', id);

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
