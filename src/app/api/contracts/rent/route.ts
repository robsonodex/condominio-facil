import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createServiceRoleClient } from '@supabase/supabase-js';

/**
 * GET /api/contracts/rent - Lista contratos de aluguel
 * POST /api/contracts/rent - Cria novo contrato
 */

export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        // Verificar role e condo
        const { data: profile } = await supabase
            .from('users')
            .select('role, condo_id')
            .eq('id', user.id)
            .single();

        if (!profile) {
            return NextResponse.json({ error: 'Perfil não encontrado' }, { status: 404 });
        }

        // Service role para contornar RLS
        const supabaseAdmin = createServiceRoleClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        let query = supabaseAdmin
            .from('rental_contracts')
            .select(`
                *,
                unit:units(numero, bloco),
                landlord:users!rental_contracts_landlord_id_fkey(nome, email),
                tenant:users!rental_contracts_tenant_id_fkey(nome, email)
            `)
            .order('created_at', { ascending: false });

        // Filtrar por condomínio (síndico vê só do seu condo)
        if (profile.role === 'sindico' && profile.condo_id) {
            query = query.eq('condo_id', profile.condo_id);
        } else if (profile.role !== 'superadmin') {
            // Morador vê apenas seus contratos
            query = query.eq('tenant_id', user.id);
        }

        const { data, error } = await query;

        if (error) {
            console.error('Error fetching contracts:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ contracts: data || [] });

    } catch (error: any) {
        console.error('Contracts API error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        // Verificar se é síndico ou admin
        const { data: profile } = await supabase
            .from('users')
            .select('role, condo_id')
            .eq('id', user.id)
            .single();

        if (!profile || !['sindico', 'superadmin'].includes(profile.role)) {
            return NextResponse.json({ error: 'Apenas síndicos podem criar contratos' }, { status: 403 });
        }

        const body = await request.json();

        // Validar campos obrigatórios
        const required = ['unit_id', 'tenant_id', 'monthly_rent', 'start_date', 'billing_day'];
        for (const field of required) {
            if (!body[field]) {
                return NextResponse.json({ error: `Campo obrigatório: ${field}` }, { status: 400 });
            }
        }

        // Service role
        const supabaseAdmin = createServiceRoleClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        // Usar condo_id do síndico ou o fornecido (admin)
        const condoId = profile.role === 'superadmin' && body.condo_id
            ? body.condo_id
            : profile.condo_id;

        if (!condoId) {
            return NextResponse.json({ error: 'Condomínio não identificado' }, { status: 400 });
        }

        // Verificar se já existe contrato ativo para essa unidade
        const { data: existingContract } = await supabaseAdmin
            .from('rental_contracts')
            .select('id')
            .eq('unit_id', body.unit_id)
            .eq('status', 'active')
            .single();

        if (existingContract) {
            return NextResponse.json({
                error: 'Já existe um contrato ativo para esta unidade'
            }, { status: 400 });
        }

        // Criar contrato
        const { data: contract, error: contractError } = await supabaseAdmin
            .from('rental_contracts')
            .insert({
                condo_id: condoId,
                unit_id: body.unit_id,
                landlord_id: body.landlord_id || user.id,
                tenant_id: body.tenant_id,
                monthly_rent: body.monthly_rent,
                include_condo_fee: body.include_condo_fee || false,
                additional_charges: body.additional_charges || {},
                start_date: body.start_date,
                end_date: body.end_date || null,
                billing_day: body.billing_day,
                late_fee_percent: body.late_fee_percent || 2.0,
                daily_interest_percent: body.daily_interest_percent || 0.033,
                notes: body.notes || null,
                status: 'active'
            })
            .select()
            .single();

        if (contractError) {
            console.error('Error creating contract:', contractError);
            return NextResponse.json({ error: contractError.message }, { status: 500 });
        }

        // Criar notificação para o inquilino
        await supabaseAdmin.from('notifications').insert({
            user_id: body.tenant_id,
            condo_id: condoId,
            title: '🏠 Novo Contrato de Aluguel',
            message: `Um contrato de aluguel foi criado para você. Valor mensal: R$ ${body.monthly_rent.toFixed(2)}`,
            type: 'info',
            link: '/pagamentos'
        });

        return NextResponse.json({
            success: true,
            contract,
            message: 'Contrato criado com sucesso'
        });

    } catch (error: any) {
        console.error('Create contract error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
