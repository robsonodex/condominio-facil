'use client';

import { useEffect, useState, useMemo } from 'react';
import { Card, CardContent, Button, Input, Select, Table, CardSkeleton, TableSkeleton } from '@/components/ui';
import { Modal } from '@/components/ui/modal';
import { createClient } from '@/lib/supabase/client';
import { useUser } from '@/hooks/useUser';
import { Plus, Search, Home, Edit, Trash2 } from 'lucide-react';
import { Unit } from '@/types/database';
import { useMultiSelect } from '@/hooks/useMultiSelect';

function UnidadesSkeleton() {
    return (
        <div className="space-y-6">
            <div><h1 className="text-2xl font-bold text-gray-900">Unidades</h1><p className="text-gray-500">Carregando...</p></div>
            <CardSkeleton count={4} />
            <TableSkeleton rows={5} />
        </div>
    );
}

export default function UnidadesPage() {
    const { condoId, loading: userLoading, isSuperAdmin } = useUser();
    const [units, setUnits] = useState<Unit[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingUnit, setEditingUnit] = useState<Unit | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterBloco, setFilterBloco] = useState('');
    const [blocos, setBlocos] = useState<string[]>([]);
    const supabase = useMemo(() => createClient(), []);

    useEffect(() => {
        if (!userLoading && condoId) fetchUnits();
        else if (!userLoading && isSuperAdmin) fetchAllUnits();
        else if (!userLoading) setLoading(false);
    }, [condoId, userLoading, isSuperAdmin]);

    const fetchAllUnits = async () => {
        setLoading(true);
        const { data } = await supabase.from('units').select('*').order('bloco').order('numero_unidade').limit(100);
        setUnits(data || []);
        setBlocos([...new Set(data?.map(u => u.bloco).filter(Boolean) as string[])]);
        setLoading(false);
    };

    const fetchUnits = async () => {
        setLoading(true);
        const { data } = await supabase
            .from('units')
            .select('*')
            .eq('condo_id', condoId)
            .order('bloco')
            .order('numero_unidade');

        setUnits(data || []);
        const uniqueBlocos = [...new Set(data?.map(u => u.bloco).filter(Boolean) as string[])];
        setBlocos(uniqueBlocos);
        setLoading(false);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Deseja realmente excluir esta unidade?')) return;
        try {
            const response = await fetch(`/api/units?id=${id}`, { method: 'DELETE', credentials: 'include' });
            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Erro ao excluir unidade');
            }
            fetchUnits();
        } catch (error: any) {
            console.error('Error deleting unit:', error);
            alert(error.message || 'Erro ao excluir unidade');
        }
    };

    const filteredUnits = units.filter(u => {
        const matchesSearch = u.numero_unidade.toLowerCase().includes(searchTerm.toLowerCase()) ||
            u.bloco?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesBloco = !filterBloco || u.bloco === filterBloco;
        return matchesSearch && matchesBloco;
    });

    // Multi-select hook
    const {
        selectedIds,
        selectedCount,
        toggleSelect,
        toggleSelectAll,
        clearSelection,
        isSelected,
        isAllSelected,
        hasSelection
    } = useMultiSelect(filteredUnits);

    const handleBulkDelete = async () => {
        if (!confirm(`⚠️ Tem certeza que deseja EXCLUIR PERMANENTEMENTE ${selectedCount} unidade(s)?\n\nEsta ação é IRREVERSÍVEL!`)) return;

        try {
            let successCount = 0;
            let errorCount = 0;

            for (const id of Array.from(selectedIds)) {
                try {
                    const response = await fetch(`/api/units?id=${id}`, { method: 'DELETE', credentials: 'include' });
                    if (response.ok) {
                        successCount++;
                    } else {
                        errorCount++;
                    }
                } catch {
                    errorCount++;
                }
            }

            if (successCount > 0) {
                alert(`✅ ${successCount} unidade(s) excluída(s) com sucesso!${errorCount > 0 ? `\n\n❌ ${errorCount} erro(s)` : ''}`);
                clearSelection();
                fetchUnits();
            } else {
                alert(`❌ Nenhuma unidade foi excluída.`);
            }
        } catch (error: any) {
            alert(`❌ Erro ao excluir: ${error.message}`);
        }
    };

    const columns = [
        {
            key: 'checkbox',
            header: () => (
                <input
                    type="checkbox"
                    checked={isAllSelected()}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 text-emerald-600 rounded border-gray-300 focus:ring-emerald-500"
                />
            ),
            render: (u: Unit) => (
                <input
                    type="checkbox"
                    checked={isSelected(u.id)}
                    onChange={() => toggleSelect(u.id)}
                    onClick={(e) => e.stopPropagation()}
                    className="w-4 h-4 text-emerald-600 rounded border-gray-300 focus:ring-emerald-500"
                />
            ),
            className: 'w-12'
        },
        { key: 'bloco', header: 'Bloco', render: (u: Unit) => u.bloco || '-' },
        { key: 'numero_unidade', header: 'Número' },
        { key: 'metragem', header: 'Metragem', render: (u: Unit) => u.metragem ? `${u.metragem}m²` : '-' },
        { key: 'vaga', header: 'Vaga', render: (u: Unit) => u.vaga || '-' },
        { key: 'observacoes', header: 'Observações', render: (u: Unit) => u.observacoes || '-' },
        {
            key: 'actions',
            header: '',
            className: 'text-right',
            render: (u: Unit) => (
                <div className="flex gap-2 justify-end">
                    <button
                        onClick={(e) => { e.stopPropagation(); setEditingUnit(u); setShowModal(true); }}
                        className="p-1 hover:bg-gray-100 rounded"
                    >
                        <Edit className="h-4 w-4 text-gray-500" />
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); handleDelete(u.id); }}
                        className="p-1 hover:bg-gray-100 rounded"
                    >
                        <Trash2 className="h-4 w-4 text-red-500" />
                    </button>
                </div>
            )
        },
    ];

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Unidades</h1>
                    <p className="text-gray-500">Gerencie os apartamentos/casas do condomínio</p>
                </div>
                <div className="flex gap-2">
                    {hasSelection() && (
                        <Button variant="ghost" onClick={handleBulkDelete} className="bg-red-50 text-red-600 hover:bg-red-100">
                            <Trash2 className="h-4 w-4 mr-2" />
                            Excluir {selectedCount} {selectedCount === 1 ? 'Selecionada' : 'Selecionadas'}
                        </Button>
                    )}
                    <Button onClick={() => { setEditingUnit(null); setShowModal(true); }}>
                        <Plus className="h-4 w-4 mr-2" />
                        Nova Unidade
                    </Button>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-4">
                <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Buscar por número ou bloco..."
                        className="pl-10"
                    />
                </div>
                {blocos.length > 0 && (
                    <Select
                        value={filterBloco}
                        onChange={(e) => setFilterBloco(e.target.value)}
                        options={[
                            { value: '', label: 'Todos os blocos' },
                            ...blocos.map(b => ({ value: b, label: b }))
                        ]}
                        className="w-40"
                    />
                )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0">
                    <CardContent className="py-4 text-center">
                        <Home className="h-8 w-8 mx-auto opacity-80 mb-2" />
                        <p className="text-2xl font-bold">{units.length}</p>
                        <p className="text-sm text-blue-100">Total de Unidades</p>
                    </CardContent>
                </Card>
                {blocos.slice(0, 3).map((bloco, index) => {
                    const colors = [
                        'bg-gradient-to-br from-emerald-500 to-emerald-600 text-white border-0',
                        'bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0',
                        'bg-gradient-to-br from-orange-500 to-orange-600 text-white border-0'
                    ];
                    const textColors = ['text-emerald-100', 'text-purple-100', 'text-orange-100'];
                    return (
                        <Card key={bloco} className={colors[index % 3]}>
                            <CardContent className="py-4 text-center">
                                <p className="text-lg font-bold">{units.filter(u => u.bloco === bloco).length}</p>
                                <p className={`text-sm ${textColors[index % 3]}`}>{bloco}</p>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            {/* Table */}
            <Card>
                <CardContent className="p-0">
                    <Table
                        data={filteredUnits}
                        columns={columns}
                        loading={loading}
                        emptyMessage="Nenhuma unidade cadastrada"
                    />
                </CardContent>
            </Card>

            {/* Modal */}
            <UnitModal
                isOpen={showModal}
                onClose={() => { setShowModal(false); setEditingUnit(null); }}
                onSuccess={fetchUnits}
                condoId={condoId}
                unit={editingUnit}
            />
        </div>
    );
}

function UnitModal({ isOpen, onClose, onSuccess, condoId, unit }: {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    condoId: string | null | undefined;
    unit: Unit | null;
}) {
    const [loading, setLoading] = useState(false);
    const [bloco, setBloco] = useState('');
    const [numeroUnidade, setNumeroUnidade] = useState('');
    const [metragem, setMetragem] = useState('');
    const [vaga, setVaga] = useState('');
    const [observacoes, setObservacoes] = useState('');
    const supabase = createClient();

    useEffect(() => {
        if (unit) {
            setBloco(unit.bloco || '');
            setNumeroUnidade(unit.numero_unidade);
            setMetragem(unit.metragem?.toString() || '');
            setVaga(unit.vaga || '');
            setObservacoes(unit.observacoes || '');
        } else {
            setBloco('');
            setNumeroUnidade('');
            setMetragem('');
            setVaga('');
            setObservacoes('');
        }
    }, [unit]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!condoId) return;

        setLoading(true);
        try {
            const data = {
                condo_id: condoId,
                bloco: bloco || null,
                numero_unidade: numeroUnidade,
                metragem: metragem ? parseFloat(metragem) : null,
                vaga: vaga || null,
                observacoes: observacoes || null,
            };

            const response = await fetch('/api/units', {
                method: unit ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(unit ? { id: unit.id, ...data } : data),
            });

            if (!response.ok) {
                const result = await response.json();
                throw new Error(result.error || 'Erro ao salvar unidade');
            }

            onSuccess();
            onClose();
        } catch (error: any) {
            console.error('Error saving unit:', error);
            alert(error.message || 'Erro ao salvar unidade');
        }
        setLoading(false);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={unit ? 'Editar Unidade' : 'Nova Unidade'} size="md">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <Input
                        label="Bloco"
                        value={bloco}
                        onChange={(e) => setBloco(e.target.value)}
                        placeholder="Ex: Bloco A"
                    />
                    <Input
                        label="Número da Unidade"
                        value={numeroUnidade}
                        onChange={(e) => setNumeroUnidade(e.target.value)}
                        placeholder="Ex: 101"
                        required
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <Input
                        label="Metragem (m²)"
                        type="number"
                        step="0.01"
                        value={metragem}
                        onChange={(e) => setMetragem(e.target.value)}
                        placeholder="Ex: 65.5"
                    />
                    <Input
                        label="Vaga"
                        value={vaga}
                        onChange={(e) => setVaga(e.target.value)}
                        placeholder="Ex: G1-05"
                    />
                </div>

                <Input
                    label="Observações"
                    value={observacoes}
                    onChange={(e) => setObservacoes(e.target.value)}
                    placeholder="Observações sobre a unidade"
                />

                <div className="flex gap-3 justify-end pt-4">
                    <Button type="button" variant="ghost" onClick={onClose}>
                        Cancelar
                    </Button>
                    <Button type="submit" loading={loading}>
                        {unit ? 'Salvar' : 'Criar'}
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
