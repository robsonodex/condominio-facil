/**
 * Cron Job: Hard Delete (LGPD Compliance)
 * 
 * Este job roda diariamente e remove permanentemente
 * registros marcados como deletados há mais de 30 dias.
 * 
 * Compliance com LGPD: Dados devem ser removidos em tempo razoável.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Cliente Admin para executar função SECURITY DEFINER
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
    const startTime = Date.now();

    try {
        // Verificar autenticação do cron (Vercel)
        const authHeader = request.headers.get('authorization');
        if (authHeader !== `Bearer ${process.env.CRON_SECRET}` &&
            process.env.NODE_ENV === 'production') {
            console.log('[HardDelete] Acesso não autorizado');
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        console.log('[HardDelete] Iniciando limpeza de registros expirados...');

        // Executar função de hard delete
        const { data, error } = await supabaseAdmin.rpc('hard_delete_expired_records');

        if (error) {
            console.error('[HardDelete] Erro na função:', error);
            throw error;
        }

        const duration = Date.now() - startTime;

        console.log('[HardDelete] Concluído:', data);
        console.log(`[HardDelete] Duração: ${duration}ms`);

        return NextResponse.json({
            success: true,
            result: data,
            duration_ms: duration
        });

    } catch (error: any) {
        console.error('[HardDelete] Erro fatal:', error);
        return NextResponse.json({
            error: 'Falha no hard delete',
            message: error.message
        }, { status: 500 });
    }
}
