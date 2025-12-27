/**
 * Query Key Factory - Gerenciamento centralizado de query keys
 * 
 * Padrão recomendado pelo TanStack Query para:
 * - Type safety nas keys
 * - Invalidação granular de cache
 * - Organização e consistência
 * 
 * @see https://tanstack.com/query/latest/docs/framework/react/guides/query-keys
 */

// Tipos para filtros
export interface FinanceiroFilters {
    tipo?: 'receita' | 'despesa' | '';
    status?: 'previsto' | 'em_aberto' | 'pago' | 'atrasado' | '';
    mes?: number;
    ano?: number;
    unidadeId?: string;
}

export interface OcorrenciasFilters {
    tipo?: 'reclamacao' | 'incidente' | 'manutencao' | 'outro' | '';
    status?: 'aberta' | 'em_andamento' | 'resolvida' | 'cancelada' | '';
    prioridade?: 'baixa' | 'media' | 'alta' | '';
}

export interface GenericFilters {
    [key: string]: string | number | boolean | undefined;
}

/**
 * Factory de Query Keys
 * 
 * Hierarquia de keys permite invalidação em diferentes níveis:
 * - queryKeys.financeiro.all -> invalida TUDO de financeiro
 * - queryKeys.financeiro.lists() -> invalida todas as listas
 * - queryKeys.financeiro.list(condoId, filters) -> invalida lista específica
 */
export const queryKeys = {
    // ============================================
    // FINANCEIRO
    // ============================================
    financeiro: {
        // Key base para todo o domínio financeiro
        all: ['financeiro'] as const,

        // Todas as listas de financeiro
        lists: () => [...queryKeys.financeiro.all, 'list'] as const,

        // Lista específica por condomínio e filtros
        list: (condoId: string | null | undefined, filters?: FinanceiroFilters) =>
            [...queryKeys.financeiro.lists(), condoId, filters] as const,

        // Lista por mês/ano específico
        byMonth: (condoId: string | null | undefined, mes: number, ano: number) =>
            [...queryKeys.financeiro.all, 'byMonth', condoId, mes, ano] as const,

        // Estatísticas (receitas, despesas, inadimplência)
        stats: (condoId: string | null | undefined) =>
            [...queryKeys.financeiro.all, 'stats', condoId] as const,

        // Detalhes de um lançamento específico
        detail: (id: string) =>
            [...queryKeys.financeiro.all, 'detail', id] as const,
    },

    // ============================================
    // OCORRÊNCIAS
    // ============================================
    ocorrencias: {
        all: ['ocorrencias'] as const,

        lists: () => [...queryKeys.ocorrencias.all, 'list'] as const,

        list: (condoId: string | null | undefined, filters?: OcorrenciasFilters) =>
            [...queryKeys.ocorrencias.lists(), condoId, filters] as const,

        detail: (id: string) =>
            [...queryKeys.ocorrencias.all, 'detail', id] as const,
    },

    // ============================================
    // AVISOS (Notices)
    // ============================================
    avisos: {
        all: ['avisos'] as const,

        lists: () => [...queryKeys.avisos.all, 'list'] as const,

        list: (condoId: string | null | undefined) =>
            [...queryKeys.avisos.lists(), condoId] as const,

        detail: (id: string) =>
            [...queryKeys.avisos.all, 'detail', id] as const,
    },

    // ============================================
    // UNIDADES
    // ============================================
    unidades: {
        all: ['unidades'] as const,

        list: (condoId: string | null | undefined) =>
            [...queryKeys.unidades.all, 'list', condoId] as const,

        detail: (id: string) =>
            [...queryKeys.unidades.all, 'detail', id] as const,
    },

    // ============================================
    // MORADORES
    // ============================================
    moradores: {
        all: ['moradores'] as const,

        list: (condoId: string | null | undefined) =>
            [...queryKeys.moradores.all, 'list', condoId] as const,

        byUnit: (unidadeId: string) =>
            [...queryKeys.moradores.all, 'byUnit', unidadeId] as const,
    },

    // ============================================
    // VISITANTES / PORTARIA
    // ============================================
    visitantes: {
        all: ['visitantes'] as const,

        list: (condoId: string | null | undefined, date?: string) =>
            [...queryKeys.visitantes.all, 'list', condoId, date] as const,

        today: (condoId: string | null | undefined) =>
            [...queryKeys.visitantes.all, 'today', condoId] as const,
    },

    // ============================================
    // RESERVAS
    // ============================================
    reservas: {
        all: ['reservas'] as const,

        list: (condoId: string | null | undefined) =>
            [...queryKeys.reservas.all, 'list', condoId] as const,

        bySpace: (espacoId: string) =>
            [...queryKeys.reservas.all, 'bySpace', espacoId] as const,
    },

    // ============================================
    // MARKETPLACE
    // ============================================
    marketplace: {
        all: ['marketplace'] as const,

        ads: (condoId: string | null | undefined, tipo?: string) =>
            [...queryKeys.marketplace.all, 'ads', condoId, tipo] as const,

        recommendations: (condoId: string | null | undefined) =>
            [...queryKeys.marketplace.all, 'recommendations', condoId] as const,
    },

    // ============================================
    // GENÉRICO - Para tabelas arbitrárias
    // ============================================
    table: {
        all: (tableName: string) => [tableName] as const,

        list: (tableName: string, condoId: string | null | undefined, filters?: GenericFilters) =>
            [tableName, 'list', condoId, filters] as const,

        detail: (tableName: string, id: string) =>
            [tableName, 'detail', id] as const,
    },
} as const;

// Type helper para extrair o tipo de uma query key
export type QueryKeyType<T extends (...args: unknown[]) => readonly unknown[]> = ReturnType<T>;
