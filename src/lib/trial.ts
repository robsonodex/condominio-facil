import { supabaseAdmin } from './supabase/admin';

export interface TrialStatus {
    isTrial: boolean;
    isExpired: boolean;
    daysLeft: number;
    trialEnd: string | null;
    status: 'active' | 'warning' | 'expired' | 'paid';
}

export async function getTrialStatus(condoId: string): Promise<TrialStatus> {
    try {
        // Buscar status do condomínio (não de subscriptions)
        const { data: condo, error } = await supabaseAdmin
            .from('condos')
            .select('status, data_fim_teste')
            .eq('id', condoId)
            .single();

        if (error || !condo) {
            return {
                isTrial: false,
                isExpired: false,
                daysLeft: 0,
                trialEnd: null,
                status: 'paid'
            };
        }

        // Não é conta de teste - é conta paga ou suspensa
        if (condo.status !== 'teste') {
            return {
                isTrial: false,
                isExpired: false,
                daysLeft: 0,
                trialEnd: null,
                status: condo.status === 'ativo' ? 'paid' : 'expired'
            };
        }

        // Calcular dias restantes do trial
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (!condo.data_fim_teste) {
            // Sem data de fim definida - assume 7 dias
            return {
                isTrial: true,
                isExpired: false,
                daysLeft: 7,
                trialEnd: null,
                status: 'active'
            };
        }

        const trialEnd = new Date(condo.data_fim_teste);
        trialEnd.setHours(0, 0, 0, 0);
        const diffTime = trialEnd.getTime() - today.getTime();
        const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        const isExpired = daysLeft < 0;

        // Determinar status visual
        let status: 'active' | 'warning' | 'expired' = 'active';
        if (isExpired) {
            status = 'expired';
        } else if (daysLeft <= 3) {
            status = 'warning';
        }

        return {
            isTrial: true,
            isExpired,
            daysLeft: Math.max(0, daysLeft),
            trialEnd: condo.data_fim_teste,
            status
        };
    } catch (error) {
        console.error('[Trial] Erro ao verificar status:', error);
        return {
            isTrial: false,
            isExpired: false,
            daysLeft: 0,
            trialEnd: null,
            status: 'paid'
        };
    }
}

