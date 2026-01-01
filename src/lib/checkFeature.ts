import { createClient } from '@/lib/supabase/server';

/**
 * Backend helper to check if a feature is enabled for a given condominium.
 * Usage: if (!(await checkFeature(condoId, 'chat_sindico'))) return ...
 */
export async function checkFeature(condoId: string, featureKey: string): Promise<boolean> {
    const supabase = await createClient();

    // 1. Verificar feature via função SQL has_feature
    const { data, error } = await supabase.rpc('has_feature', {
        p_condo_id: condoId,
        p_feature_key: featureKey
    });

    if (error) {
        console.error(`Error checking feature ${featureKey} for condo ${condoId}:`, error);
        return false;
    }

    return !!data;
}
