import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { userId, email, nome } = body;

        if (!userId || !email || !nome) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Check if user already exists
        const { data: existing } = await supabaseAdmin
            .from('users')
            .select('id')
            .eq('id', userId)
            .single();

        if (existing) {
            return NextResponse.json({ success: true, message: 'User already exists' });
        }

        // Create condo for new sindico
        const { data: condo, error: condoError } = await supabaseAdmin
            .from('condos')
            .insert({
                nome: `Condomínio de ${nome}`,
                email_contato: email,
                telefone: '',
                endereco: 'A definir',
            })
            .select()
            .single();

        if (condoError) {
            console.error('[Complete Registration] Condo creation error:', condoError);
            return NextResponse.json({ error: 'Failed to create condo' }, { status: 500 });
        }

        // Create user profile
        const { error: userError } = await supabaseAdmin
            .from('users')
            .insert({
                id: userId,
                email,
                nome,
                role: 'sindico',
                ativo: false, // Will be activated via email confirmation
                condo_id: condo.id
            });

        if (userError) {
            console.error('[Complete Registration] User creation error:', userError);
            return NextResponse.json({ error: 'Failed to create user profile' }, { status: 500 });
        }

        // Get the Basic plan ID
        const { data: basicPlan } = await supabaseAdmin
            .from('plans')
            .select('id')
            .ilike('nome_plano', 'Básico')
            .single();

        // Create trial subscription
        const trialEnd = new Date();
        trialEnd.setDate(trialEnd.getDate() + 7);

        await supabaseAdmin
            .from('subscriptions')
            .insert({
                condo_id: condo.id,
                plano_id: basicPlan?.id, // Use the actual plan ID
                status: 'ativo', // Default status
                data_inicio: new Date().toISOString().split('T')[0],
                data_renovacao: trialEnd.toISOString().split('T')[0]
            });

        return NextResponse.json({ success: true, condo_id: condo.id });

    } catch (error: any) {
        console.error('[Complete Registration] Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
