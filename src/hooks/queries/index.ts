/**
 * Custom Hooks - Query Layer
 * 
 * Hooks para data fetching com TanStack Query v5
 * 
 * @example
 * ```tsx
 * import { useFinanceiro, useOcorrencias, useCondoData } from '@/hooks/queries';
 * 
 * // Uso específico
 * const { data, stats, isLoading } = useFinanceiro({ tipo: 'receita' });
 * 
 * // Uso genérico
 * const { data } = useCondoData<Unit>({ table: 'units' });
 * ```
 */

export * from './useFinanceiro';
export * from './useOcorrencias';
export * from './useCondoData';
