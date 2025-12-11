import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

const DEMO_CONDO_ID = '00000000-0000-0000-0000-000000000001';

// GET: Verificar se é ambiente demo
export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const condoId = searchParams.get('condo_id');

    return NextResponse.json({
        isDemo: condoId === DEMO_CONDO_ID,
        demoCondoId: DEMO_CONDO_ID,
    });
}

// POST: Resetar dados do demo
export async function POST(request: NextRequest) {
    try {
        // Verificar se é superadmin
        const authHeader = request.headers.get('authorization');
        if (!authHeader) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        const token = authHeader.replace('Bearer ', '');
        const { data: { user } } = await supabaseAdmin.auth.getUser(token);

        if (!user) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        // Verificar role
        const { data: profile } = await supabaseAdmin
            .from('users')
            .select('role')
            .eq('id', user.id)
            .single();

        if (profile?.role !== 'superadmin') {
            return NextResponse.json({ error: 'Apenas superadmin pode resetar demo' }, { status: 403 });
        }

        // Limpar dados demo antigos
        await supabaseAdmin
            .from('visitors')
            .delete()
            .eq('condo_id', DEMO_CONDO_ID)
            .lt('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

        await supabaseAdmin
            .from('occurrences')
            .delete()
            .eq('condo_id', DEMO_CONDO_ID)
            .lt('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

        await supabaseAdmin
            .from('reservations')
            .delete()
            .eq('condo_id', DEMO_CONDO_ID)
            .lt('data_reserva', new Date().toISOString().split('T')[0]);

        return NextResponse.json({
            success: true,
            message: 'Dados demo resetados com sucesso',
            timestamp: new Date().toISOString()
        });

    } catch (error: any) {
        console.error('Reset demo error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
