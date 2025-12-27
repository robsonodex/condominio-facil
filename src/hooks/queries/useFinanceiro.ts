'use client';

import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { queryKeys, type FinanceiroFilters } from '@/lib/query/queryKeys';
import { useUser } from '@/hooks/useUser';
import type { FinancialEntry } from '@/types/database';

/**
 * Estatísticas calculadas a partir dos dados financeiros
 */
export interface FinanceiroStats {
    receitas: number;
    despesas: number;
    inadimplencia: number;
    saldo: number;
}

/**
 * Interface do retorno do hook useFinanceiro
 */
export interface UseFinanceiroReturn {
    data: FinancialEntry[];
    stats: FinanceiroStats;
    isLoading: boolean;
    isFetching: boolean;
    isError: boolean;
    error: Error | null;
    refetch: () => void;
}

/**
 * useFinanceiro - Hook para buscar dados financeiros do condomínio
 * 
 * @param filters - Filtros opcionais (tipo, status, mes, ano)
 * @returns { data, stats, isLoading, error, refetch }
 * 
 * @example
 * ```tsx
 * const { data, stats, isLoading } = useFinanceiro({
 *   tipo: 'receita',
 *   status: 'em_aberto',
 * });
 * ```
 */
export function useFinanceiro(filters?: FinanceiroFilters): UseFinanceiroReturn {
    const { condoId, isMorador, isSuperAdmin, profile, loading: userLoading } = useUser();
    const supabase = createClient();

    const query = useQuery({
        queryKey: queryKeys.financeiro.list(condoId, filters),

        queryFn: async (): Promise<FinancialEntry[]> => {
            // SuperAdmin sem condoId selecionado - busca tudo
            if (isSuperAdmin && !condoId) {
                let query = supabase
                    .from('financial_entries')
                    .select('*, unit:units(bloco, numero_unidade), condo:condos(nome)')
                    .order('data_vencimento', { ascending: false })
                    .limit(100);

                if (filters?.tipo) query = query.eq('tipo', filters.tipo);
                if (filters?.status) query = query.eq('status', filters.status);

                const { data, error } = await query;
                if (error) throw error;
                return data || [];
            }

            // Usuário comum com condoId
            if (!condoId) {
                return [];
            }

            let query = supabase
                .from('financial_entries')
                .select('*, unit:units(bloco, numero_unidade)')
                .eq('condo_id', condoId)
                .order('data_vencimento', { ascending: false });

            // Morador vê apenas sua unidade
            if (isMorador && profile?.unidade_id) {
                query = query.eq('unidade_id', profile.unidade_id);
            }

            // Aplicar filtros
            if (filters?.tipo) query = query.eq('tipo', filters.tipo);
            if (filters?.status) query = query.eq('status', filters.status);
            if (filters?.unidadeId) query = query.eq('unidade_id', filters.unidadeId);

            // Filtro por mês/ano
            if (filters?.mes !== undefined && filters?.ano !== undefined) {
                const startDate = new Date(filters.ano, filters.mes - 1, 1).toISOString().split('T')[0];
                const endDate = new Date(filters.ano, filters.mes, 0).toISOString().split('T')[0];
                query = query.gte('data_vencimento', startDate).lte('data_vencimento', endDate);
            }

            const { data, error } = await query;
            if (error) throw error;
            return data || [];
        },

        // Só busca quando tiver condoId ou for superadmin
        enabled: !userLoading && (!!condoId || isSuperAdmin),
    });

    // Calcula estatísticas a partir dos dados
    const stats = calculateStats(query.data || []);

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
 * useFinanceiroByMonth - Hook para buscar dados financeiros de um mês específico
 * 
 * @param mes - Mês (1-12)
 * @param ano - Ano (ex: 2025)
 */
export function useFinanceiroByMonth(mes: number, ano: number): UseFinanceiroReturn {
    return useFinanceiro({ mes, ano });
}

/**
 * Calcula estatísticas a partir dos dados financeiros
 */
function calculateStats(data: FinancialEntry[]): FinanceiroStats {
    const receitas = data
        .filter((e) => e.tipo === 'receita' && e.status === 'pago')
        .reduce((sum, e) => sum + Number(e.valor), 0);

    const despesas = data
        .filter((e) => e.tipo === 'despesa' && e.status === 'pago')
        .reduce((sum, e) => sum + Number(e.valor), 0);

    const inadimplencia = data
        .filter((e) => e.tipo === 'receita' && (e.status === 'em_aberto' || e.status === 'atrasado'))
        .reduce((sum, e) => sum + Number(e.valor), 0);

    return {
        receitas,
        despesas,
        inadimplencia,
        saldo: receitas - despesas,
    };
}
