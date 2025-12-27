/**
 * Hard Delete Task (LGPD Compliance)
 * 
 * Executa remoção permanente de registros marcados
 * como deletados há mais de 30 dias.
 */

import { createClient } from '@supabase/supabase-js';

export async function runHardDelete(): Promise<{ success: boolean; result?: any; error?: string }> {
    const startTime = Date.now();

    try {
        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        console.log('[HardDelete] Iniciando limpeza de registros expirados...');

        const { data, error } = await supabaseAdmin.rpc('hard_delete_expired_records');

        if (error) {
            console.error('[HardDelete] Erro na função:', error);
            return { success: false, error: error.message };
        }

        console.log('[HardDelete] Concluído:', data, 'em', Date.now() - startTime, 'ms');
        return { success: true, result: data };

    } catch (error: any) {
        console.error('[HardDelete] Erro fatal:', error);
        return { success: false, error: error.message };
    }
}
