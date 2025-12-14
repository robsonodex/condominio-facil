import { supabaseAdmin } from './supabase/admin';

export interface PlanFeatures {
    hasAssemblies: boolean;
    hasPolls: boolean;
    hasDocuments: boolean;
    hasCommonAreas: boolean;
    hasOccurrences: boolean;
    hasMaintenance: boolean;
    hasSuppliers: boolean;
    hasMultipleCondos: boolean;
    maxUnits: number;
}

export async function getPlanFeatures(condoId: string): Promise<PlanFeatures> {
    try {
        const { data: subscription } = await supabaseAdmin
            .from('subscriptions')
            .select('plano_id, plans(nome)')
            .eq('condo_id', condoId)
            .single();

        if (!subscription || !subscription.plano_id) {
            // Default to basic features
            return {
                hasAssemblies: false,
                hasPolls: false,
                hasDocuments: false,
                hasCommonAreas: false,
                hasOccurrences: false,
                hasMaintenance: false,
                hasSuppliers: false,
                hasMultipleCondos: false,
                maxUnits: 20
            };
        }

        const planData = subscription.plans as any;
        const planName = planData?.nome?.toLowerCase() || '';

        // Básico plan
        if (planName.includes('básico')) {
            return {
                hasAssemblies: false,
                hasPolls: false,
                hasDocuments: false,
                hasCommonAreas: false,
                hasOccurrences: false,
                hasMaintenance: false,
                hasSuppliers: false,
                hasMultipleCondos: false,
                maxUnits: 20
            };
        }

        // Avançado plan
        if (planName.includes('avançado') || planName.includes('intermediário')) {
            return {
                hasAssemblies: true,
                hasPolls: true,
                hasDocuments: true,
                hasCommonAreas: true,
                hasOccurrences: true,
                hasMaintenance: false,
                hasSuppliers: false,
                hasMultipleCondos: false,
                maxUnits: 60
            };
        }

        // Premium plan (all features)
        return {
            hasAssemblies: true,
            hasPolls: true,
            hasDocuments: true,
            hasCommonAreas: true,
            hasOccurrences: true,
            hasMaintenance: true,
            hasSuppliers: true,
            hasMultipleCondos: true,
            maxUnits: 999999
        };
    } catch (error) {
        console.error('[Plan Features] Error:', error);
        // Return basic features on error
        return {
            hasAssemblies: false,
            hasPolls: false,
            hasDocuments: false,
            hasCommonAreas: false,
            hasOccurrences: false,
            hasMaintenance: false,
            hasSuppliers: false,
            hasMultipleCondos: false,
            maxUnits: 20
        };
    }
}
