/**
 * Custom Hooks - Mutation Layer
 * 
 * Hooks para mutations com TanStack Query v5
 * Todas as mutations invalidam automaticamente o cache relevante
 * 
 * @example
 * ```tsx
 * import { useCreateTransacao, useUpdateTransacao } from '@/hooks/mutations';
 * 
 * const { mutate: criar, isPending } = useCreateTransacao();
 * 
 * criar({ tipo: 'receita', valor: 500, ... });
 * ```
 */

export * from './useFinanceiroMutations';
