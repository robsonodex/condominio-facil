'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { queryKeys } from '@/lib/query/queryKeys';
import { useUser } from '@/hooks/useUser';
import { useAuth } from '@/hooks/useAuth';
import type { FinancialEntry } from '@/types/database';

/**
 * Dados para criar uma nova transação
 */
export interface CreateTransacaoData {
    tipo: 'receita' | 'despesa';
    categoria: string;
    descricao?: string;
    valor: number;
    data_vencimento: string;
    status: 'previsto' | 'em_aberto' | 'pago';
    unidade_id?: string | null;
}

/**
 * Dados para atualizar uma transação
 */
export interface UpdateTransacaoData extends Partial<CreateTransacaoData> {
    id: string;
}

/**
 * useCreateTransacao - Mutation para criar nova transação financeira
 * 
 * Após criar, invalida automaticamente o cache do financeiro para atualizar a lista
 * 
 * @example
 * ```tsx
 * const { mutate: criar, isPending } = useCreateTransacao();
 * 
 * criar({
 *   tipo: 'receita',
 *   categoria: 'taxa_condominio',
 *   valor: 500,
 *   data_vencimento: '2025-01-15',
 *   status: 'em_aberto',
 * });
 * ```
 */
export function useCreateTransacao() {
    const queryClient = useQueryClient();
    const { condoId } = useUser();
    const { session } = useAuth();

    return useMutation({
        mutationFn: async (data: CreateTransacaoData): Promise<FinancialEntry> => {
            if (!condoId) {
                throw new Error('Condomínio não identificado. Faça login novamente.');
            }

            // Usa a API para criar (mantém consistência com regras de negócio)
            const response = await fetch('/api/financial/entries', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session?.access_token}`,
                },
                credentials: 'include',
                body: JSON.stringify({
                    ...data,
                    condo_id: condoId,
                }),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Erro ao criar lançamento');
            }

            return result.data;
        },

        onSuccess: () => {
            // Invalida TODO o cache de financeiro para atualizar
            queryClient.invalidateQueries({
                queryKey: queryKeys.financeiro.all,
            });
        },

        onError: (error) => {
            console.error('Erro ao criar transação:', error);
        },
    });
}

/**
 * useUpdateTransacao - Mutation para atualizar transação existente
 * 
 * @example
 * ```tsx
 * const { mutate: atualizar } = useUpdateTransacao();
 * 
 * atualizar({
 *   id: 'uuid-da-transacao',
 *   status: 'pago',
 * });
 * ```
 */
export function useUpdateTransacao() {
    const queryClient = useQueryClient();
    const supabase = createClient();

    return useMutation({
        mutationFn: async ({ id, ...data }: UpdateTransacaoData): Promise<FinancialEntry> => {
            const { data: updated, error } = await supabase
                .from('financial_entries')
                .update(data)
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            return updated;
        },

        onSuccess: (_, variables) => {
            // Invalida lista e detalhe específico
            queryClient.invalidateQueries({
                queryKey: queryKeys.financeiro.all,
            });
            queryClient.invalidateQueries({
                queryKey: queryKeys.financeiro.detail(variables.id),
            });
        },

        onError: (error) => {
            console.error('Erro ao atualizar transação:', error);
        },
    });
}

/**
 * useDeleteTransacao - Mutation para deletar transação
 * 
 * @example
 * ```tsx
 * const { mutate: deletar } = useDeleteTransacao();
 * 
 * deletar('uuid-da-transacao');
 * ```
 */
export function useDeleteTransacao() {
    const queryClient = useQueryClient();
    const supabase = createClient();

    return useMutation({
        mutationFn: async (id: string): Promise<void> => {
            const { error } = await supabase
                .from('financial_entries')
                .delete()
                .eq('id', id);

            if (error) throw error;
        },

        onSuccess: () => {
            // Invalida TODO o cache de financeiro
            queryClient.invalidateQueries({
                queryKey: queryKeys.financeiro.all,
            });
        },

        onError: (error) => {
            console.error('Erro ao deletar transação:', error);
        },
    });
}

/**
 * useMarcarPago - Mutation helper para marcar transação como paga
 * 
 * @example
 * ```tsx
 * const { mutate: marcarPago } = useMarcarPago();
 * 
 * marcarPago({ id: 'uuid', data_pagamento: '2025-01-10' });
 * ```
 */
export function useMarcarPago() {
    const { mutate, ...rest } = useUpdateTransacao();

    return {
        ...rest,
        mutate: (data: { id: string; data_pagamento?: string }) => {
            mutate({
                id: data.id,
                status: 'pago',
                data_pagamento: data.data_pagamento || new Date().toISOString().split('T')[0],
            } as UpdateTransacaoData);
        },
    };
}
