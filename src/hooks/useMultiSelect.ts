import { useState } from 'react';

/**
 * Hook para gerenciar seleção múltipla em listas
 * @param items - Array de itens a serem selecionados
 * @returns Objeto com estados e funções de seleção
 */
export function useMultiSelect<T extends { id: string }>(items: T[]) {
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    // Toggle seleção de um item individual
    const toggleSelect = (id: string) => {
        const newSet = new Set(selectedIds);
        if (newSet.has(id)) {
            newSet.delete(id);
        } else {
            newSet.add(id);
        }
        setSelectedIds(newSet);
    };

    // Toggle selecionar/desselecionar todos
    const toggleSelectAll = () => {
        if (selectedIds.size === items.length && items.length > 0) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(items.map(item => item.id)));
        }
    };

    // Limpar seleção
    const clearSelection = () => {
        setSelectedIds(new Set());
    };

    // Verificar se um item está selecionado
    const isSelected = (id: string) => {
        return selectedIds.has(id);
    };

    // Verificar se todos estão selecionados
    const isAllSelected = () => {
        return items.length > 0 && selectedIds.size === items.length;
    };

    // Verificar se algum está selecionado (para mostrar botões de ação)
    const hasSelection = () => {
        return selectedIds.size > 0;
    };

    return {
        selectedIds,
        selectedCount: selectedIds.size,
        toggleSelect,
        toggleSelectAll,
        clearSelection,
        isSelected,
        isAllSelected,
        hasSelection,
    };
}
