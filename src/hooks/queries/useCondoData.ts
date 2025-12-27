'use client';

import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { queryKeys, type GenericFilters } from '@/lib/query/queryKeys';
import { useUser } from '@/hooks/useUser';

/**
 * Opções para o hook useCondoData
 */
export interface UseCondoDataOptions<T> {
    /** Nome da tabela no Supabase */
    table: string;

    /** Campos a selecionar (inclui relações) */
    select?: string;

    /** Filtros a aplicar (ex: { status: 'ativo' }) */
    filters?: GenericFilters;

    /** Ordenação - coluna e direção */
    orderBy?: {
        column: string;
        ascending?: boolean;
    };

    /** Limite de registros */
    limit?: number;

    /** Se deve filtrar por condo_id automaticamente */
    filterByCondoId?: boolean;

    /** Habilitado (default: true quando condoId disponível) */
    enabled?: boolean;

    /** Opções adicionais do useQuery */
    queryOptions?: Omit<UseQueryOptions<T[], Error>, 'queryKey' | 'queryFn'>;
}

/**
 * useCondoData - Hook genérico para buscar dados de qualquer tabela do Supabase
 * 
 * @param options - Configurações da query
 * @returns { data, isLoading, error, refetch }
 * 
 * @example
 * ```tsx
 * // Buscar todos os avisos do condomínio
 * const { data: avisos } = useCondoData<Notice>({
 *   table: 'notices',
 *   select: '*',
 *   orderBy: { column: 'data_publicacao', ascending: false },
 * });
 * 
 * // Buscar unidades com filtro
 * const { data: unidades } = useCondoData<Unit>({
 *   table: 'units',
 *   filters: { bloco: 'A' },
 * });
 * ```
 */
export function useCondoData<T = Record<string, unknown>>({
    table,
    select = '*',
    filters,
    orderBy,
    limit,
    filterByCondoId = true,
    enabled,
    queryOptions,
}: UseCondoDataOptions<T>) {
    const { condoId, loading: userLoading } = useUser();
    const supabase = createClient();

    return useQuery<T[], Error>({
        queryKey: queryKeys.table.list(table, condoId, filters),

        queryFn: async (): Promise<T[]> => {
            let query = supabase.from(table).select(select);

            // Filtrar por condomínio automaticamente
            if (filterByCondoId && condoId) {
                query = query.eq('condo_id', condoId);
            }

            // Aplicar filtros customizados
            if (filters) {
                Object.entries(filters).forEach(([key, value]) => {
                    if (value !== undefined && value !== '') {
                        query = query.eq(key, value);
                    }
                });
            }

            // Ordenação
            if (orderBy) {
                query = query.order(orderBy.column, {
                    ascending: orderBy.ascending ?? true
                });
            }

            // Limite
            if (limit) {
                query = query.limit(limit);
            }

            const { data, error } = await query;
            if (error) throw error;
            return (data as T[]) || [];
        },

        enabled: enabled ?? (!userLoading && (!!condoId || !filterByCondoId)),
        ...queryOptions,
    });
}

/**
 * useCondoDataDetail - Hook para buscar um registro específico
 * 
 * @param table - Nome da tabela
 * @param id - ID do registro
 * @param select - Campos a selecionar
 */
export function useCondoDataDetail<T = Record<string, unknown>>(
    table: string,
    id: string | null | undefined,
    select = '*'
) {
    const supabase = createClient();

    return useQuery<T | null, Error>({
        queryKey: queryKeys.table.detail(table, id || ''),

        queryFn: async (): Promise<T | null> => {
            if (!id) return null;

            const { data, error } = await supabase
                .from(table)
                .select(select)
                .eq('id', id)
                .single();

            if (error) throw error;
            return data as T;
        },

        enabled: !!id,
    });
}
