import { supabaseAdmin } from './supabase/admin';

export interface PlanFeatures {
    // Plano Profissional+
    hasOccurrences: boolean;      // Ocorrências
    hasCommonAreas: boolean;      // Reservas de áreas comuns
    hasReports: boolean;          // Relatórios PDF/Excel
    hasDeliveries: boolean;       // Encomendas
    // Plano Premium
    hasAssemblies: boolean;       // Assembleias
    hasPolls: boolean;            // Enquetes
    hasDocuments: boolean;        // Documentos
    hasMaintenance: boolean;      // Manutenção preventiva
    hasSuppliers: boolean;        // Fornecedores
    hasMultipleCondos: boolean;   // Múltiplos condomínios
    hasCameras: boolean;          // Câmeras de segurança
    hasAutomations: boolean;      // Automações de inadimplência
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
            // Default to basic features (most restrictive)
            return getBasicFeatures();
        }

        const planData = subscription.plans as any;
        const planName = planData?.nome?.toLowerCase() || '';

        // Premium / Avançado / Demo - ALL features
        if (planName.includes('premium') || planName.includes('avançado') || planName.includes('demo')) {
            return getPremiumFeatures();
        }

        // Profissional / Intermediário - Middle tier
        if (planName.includes('profissional') || planName.includes('intermediário')) {
            return getProfessionalFeatures();
        }

        // Básico plan - Most restrictive
        if (planName.includes('básico') || planName.includes('basico')) {
            return getBasicFeatures();
        }

        // Unknown plan: default to basic for safety
        console.warn(`[Plan Features] Unknown plan: ${planName}, defaulting to basic`);
        return getBasicFeatures();

    } catch (error) {
        console.error('[Plan Features] Error:', error);
        // Return basic features on error for safety
        return getBasicFeatures();
    }
}

// Plano Básico: Dashboard, Financeiro, Moradores, Unidades, Avisos, Cobranças
function getBasicFeatures(): PlanFeatures {
    return {
        hasOccurrences: false,
        hasCommonAreas: false,
        hasReports: false,
        hasDeliveries: false,
        hasAssemblies: false,
        hasPolls: false,
        hasDocuments: false,
        hasMaintenance: false,
        hasSuppliers: false,
        hasMultipleCondos: false,
        hasCameras: false,
        hasAutomations: false,
        maxUnits: 20
    };
}

// Plano Profissional: + Portaria, Ocorrências, Reservas, Relatórios, Encomendas
function getProfessionalFeatures(): PlanFeatures {
    return {
        hasOccurrences: true,
        hasCommonAreas: true,
        hasReports: true,
        hasDeliveries: true,
        hasAssemblies: false,
        hasPolls: false,
        hasDocuments: false,
        hasMaintenance: false,
        hasSuppliers: false,
        hasMultipleCondos: false,
        hasCameras: false,
        hasAutomations: false,
        maxUnits: 50
    };
}

// Plano Premium: TUDO
function getPremiumFeatures(): PlanFeatures {
    return {
        hasOccurrences: true,
        hasCommonAreas: true,
        hasReports: true,
        hasDeliveries: true,
        hasAssemblies: true,
        hasPolls: true,
        hasDocuments: true,
        hasMaintenance: true,
        hasSuppliers: true,
        hasMultipleCondos: true,
        hasCameras: true,
        hasAutomations: true,
        maxUnits: 999999
    };
}

