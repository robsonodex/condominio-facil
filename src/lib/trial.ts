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
        const { data: subscription, error } = await supabaseAdmin
            .from('subscriptions')
            .select('status, trial_end')
            .eq('condo_id', condoId)
            .single();

        if (error || !subscription) {
            return {
                isTrial: false,
                isExpired: false,
                daysLeft: 0,
                trialEnd: null,
                status: 'paid'
            };
        }

        // Not a trial - it's a paid account
        if (subscription.status !== 'teste') {
            return {
                isTrial: false,
                isExpired: false,
                daysLeft: 0,
                trialEnd: null,
                status: subscription.status === 'ativo' ? 'paid' : 'expired'
            };
        }

        // Calculate days left
        const trialEnd = new Date(subscription.trial_end);
        const now = new Date();
        const diffTime = trialEnd.getTime() - now.getTime();
        const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        const isExpired = daysLeft <= 0;

        // Determine status for visual feedback
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
            trialEnd: subscription.trial_end,
            status
        };
    } catch (error) {
        console.error('[Trial] Error checking trial status:', error);
        return {
            isTrial: false,
            isExpired: false,
            daysLeft: 0,
            trialEnd: null,
            status: 'paid'
        };
    }
}
