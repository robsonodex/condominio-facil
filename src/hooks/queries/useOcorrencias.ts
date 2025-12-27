'use client';

import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { queryKeys, type OcorrenciasFilters } from '@/lib/query/queryKeys';
import { useUser } from '@/hooks/useUser';
import type { Occurrence } from '@/types/database';

/**
 * Estatísticas de ocorrências
 */
export interface OcorrenciasStats {
    total: number;
    abertas: number;
    emAndamento: number;
    resolvidas: number;
    porPrioridade: {
        alta: number;
        media: number;
        baixa: number;
    };
}

/**
 * Interface do retorno do hook useOcorrencias
 */
export interface UseOcorrenciasReturn {
    data: Occurrence[];
    stats: OcorrenciasStats;
    isLoading: boolean;
    isFetching: boolean;
    isError: boolean;
    error: Error | null;
    refetch: () => void;
}

/**
 * useOcorrencias - Hook para buscar ocorrências do condomínio
 * 
 * @param filters - Filtros opcionais (tipo, status, prioridade)
 * @returns { data, stats, isLoading, error, refetch }
 * 
 * @example
 * ```tsx
 * const { data, stats, isLoading } = useOcorrencias({
 *   status: 'aberta',
 *   prioridade: 'alta',
 * });
 * ```
 */
export function useOcorrencias(filters?: OcorrenciasFilters): UseOcorrenciasReturn {
    const { condoId, isMorador, profile, loading: userLoading } = useUser();
    const supabase = createClient();

    const query = useQuery({
        queryKey: queryKeys.ocorrencias.list(condoId, filters),

        queryFn: async (): Promise<Occurrence[]> => {
            if (!condoId) {
                return [];
            }

            let queryBuilder = supabase
                .from('occurrences')
                .select(`
                    *,
                    unit:units(bloco, numero_unidade),
                    criado_por:profiles!criado_por_user_id(nome),
                    responsavel:profiles!responsavel_user_id(nome)
                `)
                .eq('condo_id', condoId)
                .order('data_abertura', { ascending: false });

            // Morador vê apenas suas ocorrências
            if (isMorador && profile?.id) {
                queryBuilder = queryBuilder.eq('criado_por_user_id', profile.id);
            }

            // Aplicar filtros
            if (filters?.tipo) queryBuilder = queryBuilder.eq('tipo', filters.tipo);
            if (filters?.status) queryBuilder = queryBuilder.eq('status', filters.status);
            if (filters?.prioridade) queryBuilder = queryBuilder.eq('prioridade', filters.prioridade);

            const { data, error } = await queryBuilder;
            if (error) throw error;
            return (data as Occurrence[]) || [];
        },

        enabled: !userLoading && !!condoId,
    });

    // Calcula estatísticas
    const stats = calculateOcorrenciasStats(query.data || []);

    return {
        data: query.data || [],
        stats,
        isLoading: query.isLoading,
        isFetching: query.isFetching,
        isError: query.isError,
        error: query.error,
        refetch: query.refetch,
    };
}

/**
 * Calcula estatísticas de ocorrências
 */
function calculateOcorrenciasStats(data: Occurrence[]): OcorrenciasStats {
    return {
        total: data.length,
        abertas: data.filter((o) => o.status === 'aberta').length,
        emAndamento: data.filter((o) => o.status === 'em_andamento').length,
        resolvidas: data.filter((o) => o.status === 'resolvida').length,
        porPrioridade: {
            alta: data.filter((o) => o.prioridade === 'alta').length,
            media: data.filter((o) => o.prioridade === 'media').length,
            baixa: data.filter((o) => o.prioridade === 'baixa').length,
        },
    };
}
