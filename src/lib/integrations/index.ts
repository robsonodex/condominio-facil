/**
 * Service para gerenciar integrações de condomínios
 * Arquitetura multi-tenant: cada condomínio tem suas próprias credenciais
 */

import { createClient } from '@supabase/supabase-js';

// Tipos
export interface CondoIntegration {
    id: string;
    condo_id: string;
    tipo: 'pagamentos' | 'whatsapp' | 'email' | 'sms' | 'outro';
    provider: string;
    credentials: Record<string, any>;
    config: Record<string, any>;
    ativo: boolean;
    data_implantacao?: string;
    created_at: string;
    updated_at: string;
}

export interface IntegrationLog {
    id?: string;
    condo_id: string;
    integration_id?: string;
    tipo: string;
    provider?: string;
    operation: string;
    success: boolean;
    request_data?: Record<string, any>;
    response_data?: Record<string, any>;
    error_message?: string;
    duration_ms?: number;
}

// Cache em memória para evitar lookups repetidos (TTL: 5 minutos)
const integrationCache = new Map<string, { data: CondoIntegration | null; expires: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutos

/**
 * Busca a integração de um condomínio
 * Usa cache em memória para performance
 */
export async function getCondoIntegration(
    condoId: string,
    tipo: 'pagamentos' | 'whatsapp' | 'email' | 'sms',
    provider?: string
): Promise<CondoIntegration | null> {
    const cacheKey = `${condoId}:${tipo}:${provider || 'any'}`;

    // Verificar cache
    const cached = integrationCache.get(cacheKey);
    if (cached && cached.expires > Date.now()) {
        return cached.data;
    }

    // Buscar no banco
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    let query = supabase
        .from('condo_integrations')
        .select('*')
        .eq('condo_id', condoId)
        .eq('tipo', tipo)
        .eq('ativo', true);

    if (provider) {
        query = query.eq('provider', provider);
    }

    const { data, error } = await query.single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('[Integrations] Error fetching integration:', error);
        return null;
    }

    // Atualizar cache
    integrationCache.set(cacheKey, {
        data: data as CondoIntegration | null,
        expires: Date.now() + CACHE_TTL_MS
    });

    return data as CondoIntegration | null;
}

/**
 * Invalida o cache de uma integração
 * Chamar após criar/atualizar/deletar integração
 */
export function invalidateIntegrationCache(condoId: string, tipo?: string) {
    for (const key of integrationCache.keys()) {
        if (key.startsWith(condoId) && (!tipo || key.includes(tipo))) {
            integrationCache.delete(key);
        }
    }
}

/**
 * Cria ou atualiza uma integração de condomínio
 * Apenas superadmin pode chamar
 */
export async function upsertCondoIntegration(
    condoId: string,
    tipo: 'pagamentos' | 'whatsapp' | 'email' | 'sms',
    provider: string,
    credentials: Record<string, any>,
    config: Record<string, any> = {},
    createdBy?: string
): Promise<CondoIntegration | null> {
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data, error } = await supabase
        .from('condo_integrations')
        .upsert({
            condo_id: condoId,
            tipo,
            provider,
            credentials,
            config,
            ativo: true,
            data_implantacao: new Date().toISOString(),
            created_by: createdBy,
        }, {
            onConflict: 'condo_id,tipo,provider'
        })
        .select()
        .single();

    if (error) {
        console.error('[Integrations] Error upserting integration:', error);
        return null;
    }

    // Invalidar cache
    invalidateIntegrationCache(condoId, tipo);

    return data as CondoIntegration;
}

/**
 * Desativa uma integração
 */
export async function deactivateCondoIntegration(
    condoId: string,
    tipo: string,
    provider?: string
): Promise<boolean> {
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    let query = supabase
        .from('condo_integrations')
        .update({ ativo: false })
        .eq('condo_id', condoId)
        .eq('tipo', tipo);

    if (provider) {
        query = query.eq('provider', provider);
    }

    const { error } = await query;

    if (error) {
        console.error('[Integrations] Error deactivating integration:', error);
        return false;
    }

    // Invalidar cache
    invalidateIntegrationCache(condoId, tipo);

    return true;
}

/**
 * Lista todas as integrações de um condomínio
 * Remove credenciais sensíveis antes de retornar (para síndico)
 */
export async function listCondoIntegrations(
    condoId: string,
    includeSensitive: boolean = false
): Promise<Partial<CondoIntegration>[]> {
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data, error } = await supabase
        .from('condo_integrations')
        .select('*')
        .eq('condo_id', condoId)
        .order('tipo');

    if (error) {
        console.error('[Integrations] Error listing integrations:', error);
        return [];
    }

    // Remover credenciais sensíveis se não autorizado
    if (!includeSensitive) {
        return (data || []).map(integration => ({
            id: integration.id,
            condo_id: integration.condo_id,
            tipo: integration.tipo,
            provider: integration.provider,
            config: integration.config,
            ativo: integration.ativo,
            data_implantacao: integration.data_implantacao,
            created_at: integration.created_at,
            // Não inclui 'credentials'
        }));
    }

    return data as CondoIntegration[];
}

/**
 * Registra log de operação de integração
 */
export async function logIntegrationOperation(log: IntegrationLog): Promise<void> {
    try {
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        await supabase.from('integration_logs').insert({
            condo_id: log.condo_id,
            integration_id: log.integration_id,
            tipo: log.tipo,
            provider: log.provider,
            operation: log.operation,
            success: log.success,
            request_data: log.request_data,
            response_data: log.response_data,
            error_message: log.error_message,
            duration_ms: log.duration_ms,
        });
    } catch (error) {
        // Não falhar a operação principal por erro de log
        console.error('[Integrations] Error logging operation:', error);
    }
}

/**
 * Verifica se um condomínio tem integração ativa
 */
export async function hasActiveIntegration(
    condoId: string,
    tipo: 'pagamentos' | 'whatsapp' | 'email' | 'sms'
): Promise<boolean> {
    const integration = await getCondoIntegration(condoId, tipo);
    return integration !== null && integration.ativo;
}
