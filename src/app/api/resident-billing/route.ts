import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

const MP_ACCESS_TOKEN = process.env.MERCADOPAGO_ACCESS_TOKEN;
const MP_API_URL = 'https://api.mercadopago.com';

// Helper function to get user from Authorization header
async function getUserFromRequest(request: NextRequest) {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
        return null;
    }

    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !user) {
        return null;
    }

    // Get profile
    const { data: profile } = await supabaseAdmin
        .from('users')
        .select('id, role, condo_id')
        .eq('email', user.email)
        .eq('ativo', true)
        .single();

    return profile;
}

// GET: Listar cobranças
export async function GET(request: NextRequest) {
    try {
        const profile = await getUserFromRequest(request);

        if (!profile) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        let query = supabaseAdmin
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
        const profile = await getUserFromRequest(request);

        if (!profile) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        if (profile.role !== 'sindico' && profile.role !== 'superadmin') {
            return NextResponse.json({ error: 'Apenas síndicos podem criar cobranças' }, { status: 403 });
        }

        const body = await request.json();
        const { morador_id, unidade_id, descricao, valor, data_vencimento, enviar_email } = body;

        if (!morador_id || !descricao || !valor || !data_vencimento) {
            return NextResponse.json({
                error: 'Campos obrigatórios: morador_id, descricao, valor, data_vencimento'
            }, { status: 400 });
        }

        // Buscar dados do morador (usando supabaseAdmin)
        const { data: morador } = await supabaseAdmin
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
        const { data: condo } = await supabaseAdmin
            .from('condos')
            .select('nome, pix_chave, pix_tipo, pix_nome_recebedor')
            .eq('id', condoId)
            .single();

        // Inserir cobrança no banco (sem Mercado Pago - o dinheiro vai para o condo, não para o sistema)
        const { data: invoice, error: insertError } = await supabaseAdmin
            .from('resident_invoices')
            .insert({
                condo_id: condoId,
                morador_id,
                unidade_id: unidade_id || null,
                descricao,
                valor: parseFloat(valor),
                data_vencimento,
                created_by: profile.id
            })
            .select()
            .single();

        if (insertError) {
            console.error('Error creating invoice:', insertError);
            return NextResponse.json({ error: insertError.message }, { status: 500 });
        }

        // Enviar email se solicitado
        if (enviar_email && morador.email) {
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
                            condoNome: condo?.nome || 'Condomínio',
                            // Info PIX do condomínio se disponível
                            pixChave: condo?.pix_chave || null,
                            pixTipo: condo?.pix_tipo || null,
                            pixNome: condo?.pix_nome_recebedor || null,
                        },
                        condoId,
                        internalCall: true
                    }),
                });
                console.log(`[BILLING] Email sent to ${morador.email}`);
            } catch (emailError) {
                console.error('Error sending email:', emailError);
            }
        }

        return NextResponse.json({
            success: true,
            invoice
        });

    } catch (error: any) {
        console.error('Create invoice error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// DELETE: Cancelar cobrança
export async function DELETE(request: NextRequest) {
    try {
        const profile = await getUserFromRequest(request);

        if (!profile) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        if (profile.role !== 'sindico' && profile.role !== 'superadmin') {
            return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'ID é obrigatório' }, { status: 400 });
        }

        const { error } = await supabaseAdmin
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

// PATCH: Atualizar status (marcar como pago)
export async function PATCH(request: NextRequest) {
    try {
        const profile = await getUserFromRequest(request);

        if (!profile) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        if (profile.role !== 'sindico' && profile.role !== 'superadmin') {
            return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'ID é obrigatório' }, { status: 400 });
        }

        const body = await request.json();
        const { status } = body;

        if (!status || !['pago', 'pendente', 'cancelado'].includes(status)) {
            return NextResponse.json({ error: 'Status inválido' }, { status: 400 });
        }

        // Buscar dados da cobrança antes de atualizar
        const { data: invoice } = await supabaseAdmin
            .from('resident_invoices')
            .select(`
                *,
                morador:users!morador_id(id, nome, email),
                condo:condos(nome)
            `)
            .eq('id', id)
            .single();

        if (!invoice) {
            return NextResponse.json({ error: 'Cobrança não encontrada' }, { status: 404 });
        }

        // Verificar permissão
        if (profile.role === 'sindico' && invoice.condo_id !== profile.condo_id) {
            return NextResponse.json({ error: 'Cobrança não pertence ao seu condomínio' }, { status: 403 });
        }

        // Atualizar status
        const { error: updateError } = await supabaseAdmin
            .from('resident_invoices')
            .update({
                status,
                data_pagamento: status === 'pago' ? new Date().toISOString() : null
            })
            .eq('id', id);

        if (updateError) {
            return NextResponse.json({ error: updateError.message }, { status: 500 });
        }

        // Enviar e-mail de agradecimento se marcado como pago
        if (status === 'pago' && invoice.morador?.email) {
            try {
                await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/email`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        tipo: 'payment_received',
                        destinatario: invoice.morador.email,
                        dados: {
                            nome: invoice.morador.nome,
                            descricao: invoice.descricao,
                            valor: parseFloat(invoice.valor).toFixed(2),
                            condoNome: invoice.condo?.nome || 'Condomínio',
                        },
                        internalCall: true
                    }),
                });
                console.log(`[BILLING] Thank you email sent to ${invoice.morador.email}`);
            } catch (emailError) {
                console.error('Error sending thank you email:', emailError);
            }
        }

        return NextResponse.json({ success: true });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
