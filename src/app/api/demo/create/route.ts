import { createClient } from '@/lib/supabase/admin';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    const supabase = createClient();
    const { email, nome_condominio } = await request.json();

    if (!email || !nome_condominio) {
        return NextResponse.json({ error: 'Dados incompletos' }, { status: 400 });
    }

    try {
        // 1. Criar condomínio de teste
        const { data: condo, error: condoError } = await supabase
            .from('condos')
            .insert({
                nome: `${nome_condominio} (DEMO)`,
                is_demo: true,
                data_inicio_teste: new Date().toISOString(),
                data_fim_teste: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 dias
                status: 'demo'
            })
            .select()
            .single();

        if (condoError) throw condoError;

        // 2. Popular com dados fakes (MOCK DATA)
        // - Unidades
        await supabase.from('unidades').insert([
            { condo_id: condo.id, bloco: 'A', numero_unidade: '101' },
            { condo_id: condo.id, bloco: 'A', numero_unidade: '102' },
            { condo_id: condo.id, bloco: 'B', numero_unidade: '201' }
        ]);

        // - Avisos
        await supabase.from('notices').insert({
            condo_id: condo.id,
            title: 'Bem-vindo ao Sistema Demo!',
            content: 'Este é um ambiente de testes completo para você explorar.',
            visible_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        });

        // - Ocorrências
        await supabase.from('occurrences').insert({
            condo_id: condo.id,
            title: 'Lâmpada queimada no hall',
            description: 'A lâmpada do hall do bloco A está pescando.',
            status: 'pending',
            category: 'manutencao'
        });

        // 3. Registrar sessão demo
        await supabase.from('demo_sessions').insert({
            condo_id: condo.id,
            email: email,
            expires_at: condo.data_fim_teste
        });

        return NextResponse.json({
            success: true,
            condoId: condo.id,
            message: 'Ambiente demo criado com sucesso! Você tem 7 dias para testar.'
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
