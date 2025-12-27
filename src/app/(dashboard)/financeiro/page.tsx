'use client';

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, Button, Input, Select, Badge, Table } from '@/components/ui';
import { Modal } from '@/components/ui/modal';
import { createClient } from '@/lib/supabase/client';
import { useUser } from '@/hooks/useUser';
import { useAuth } from '@/hooks/useAuth';
import { formatCurrency, formatDate, getStatusColor, getStatusLabel } from '@/lib/utils';
import { Plus, Download, DollarSign, TrendingUp, TrendingDown, AlertCircle, Edit2, Trash2, RefreshCw } from 'lucide-react';
import { FinancialEntry } from '@/types/database';

// TanStack Query Hooks
import { useFinanceiro } from '@/hooks/queries/useFinanceiro';
import { useCreateTransacao, useUpdateTransacao, useDeleteTransacao } from '@/hooks/mutations/useFinanceiroMutations';
import { queryKeys, type FinanceiroFilters } from '@/lib/query/queryKeys';

const CATEGORIAS_RECEITA = [
    { value: '', label: 'Selecione a categoria...' },
    { value: 'taxa_condominio', label: 'Taxa de Condomínio' },
    { value: 'fundo_reserva', label: 'Fundo de Reserva' },
    { value: 'multa', label: 'Multa' },
    { value: 'aluguel_espaco', label: 'Aluguel de Espaço' },
    { value: 'outros', label: 'Outros' },
];

const CATEGORIAS_DESPESA = [
    { value: '', label: 'Selecione a categoria...' },
    { value: 'agua', label: 'Água' },
    { value: 'luz', label: 'Luz' },
    { value: 'gas', label: 'Gás' },
    { value: 'manutencao', label: 'Manutenção' },
    { value: 'funcionarios', label: 'Funcionários' },
    { value: 'limpeza', label: 'Limpeza' },
    { value: 'seguranca', label: 'Segurança' },
    { value: 'administrativo', label: 'Administrativo' },
    { value: 'outros', label: 'Outros' },
];

const STATUS_OPTIONS = [
    { value: '', label: 'Todos' },
    { value: 'previsto', label: 'Previsto' },
    { value: 'em_aberto', label: 'Em Aberto' },
    { value: 'pago', label: 'Pago' },
    { value: 'atrasado', label: 'Atrasado' },
];

export default function FinanceiroPage() {
    const { condoId, isMorador, isSuperAdmin, isSindico } = useUser();
    const [showModal, setShowModal] = useState(false);
    const [editingEntry, setEditingEntry] = useState<FinancialEntry | null>(null);
    const [filterType, setFilterType] = useState<'' | 'receita' | 'despesa'>('');
    const [filterStatus, setFilterStatus] = useState<'' | 'previsto' | 'em_aberto' | 'pago' | 'atrasado'>('');

    // Filtros para o hook
    const filters: FinanceiroFilters = {
        tipo: filterType || undefined,
        status: filterStatus || undefined,
    };

    // ✅ TanStack Query - Substituindo useEffect + useState
    const { data: entries, stats, isLoading, isFetching, refetch } = useFinanceiro(filters);

    // ✅ Mutation para deletar
    const { mutate: deleteEntry, isPending: isDeleting } = useDeleteTransacao();

    const handleEdit = (entry: FinancialEntry) => {
        setEditingEntry(entry);
        setShowModal(true);
    };

    const handleDelete = async (entry: FinancialEntry) => {
        if (!confirm(`Tem certeza que deseja excluir este lançamento?\n\n${entry.categoria} - ${formatCurrency(entry.valor)}`)) {
            return;
        }

        deleteEntry(entry.id, {
            onSuccess: () => {
                alert('✅ Lançamento excluído com sucesso!');
            },
            onError: (err) => {
                alert('❌ Erro ao excluir: ' + err.message);
            },
        });
    };

    const canEdit = !isMorador && (isSindico || isSuperAdmin);

    const columns = [
        {
            key: 'tipo', header: 'Tipo', render: (e: FinancialEntry) => (
                <Badge variant={e.tipo === 'receita' ? 'success' : 'warning'}>
                    {e.tipo === 'receita' ? 'Receita' : 'Despesa'}
                </Badge>
            )
        },
        ...(isSuperAdmin && !condoId ? [{
            key: 'condo',
            header: 'Condomínio',
            render: (e: any) => <span className="text-sm text-gray-600">{e.condo?.nome || '-'}</span>
        }] : []),
        {
            key: 'categoria', header: 'Categoria', render: (e: FinancialEntry) => (
                <span className="capitalize">{e.categoria.replace('_', ' ')}</span>
            )
        },
        { key: 'descricao', header: 'Descrição' },
        {
            key: 'unit', header: 'Unidade', render: (e: FinancialEntry) => (
                e.unit ? `${e.unit.bloco || ''} ${e.unit.numero_unidade}` : '-'
            )
        },
        { key: 'data_vencimento', header: 'Vencimento', render: (e: FinancialEntry) => formatDate(e.data_vencimento) },
        {
            key: 'valor', header: 'Valor', className: 'text-right', render: (e: FinancialEntry) => (
                <span className={e.tipo === 'receita' ? 'text-emerald-600 font-medium' : 'text-orange-600 font-medium'}>
                    {formatCurrency(e.valor)}
                </span>
            )
        },
        {
            key: 'status', header: 'Status', render: (e: FinancialEntry) => (
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(e.status)}`}>
                    {getStatusLabel(e.status)}
                </span>
            )
        },
        ...(canEdit ? [{
            key: 'actions',
            header: 'Ações',
            render: (e: FinancialEntry) => (
                <div className="flex gap-1">
                    <Button size="sm" variant="ghost" onClick={() => handleEdit(e)} title="Editar">
                        <Edit2 className="h-4 w-4 text-blue-600" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => handleDelete(e)} title="Excluir" disabled={isDeleting}>
                        <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                </div>
            )
        }] : []),
    ];

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                        {isMorador ? 'Meus Lançamentos' : 'Financeiro'}
                    </h1>
                    <p className="text-gray-500">
                        {isSuperAdmin && !condoId
                            ? 'Visualizando todos os lançamentos do sistema'
                            : isMorador
                                ? 'Visualize suas cobranças e pagamentos'
                                : 'Gerencie receitas e despesas do condomínio'}
                    </p>
                </div>
                {!isMorador && condoId && (
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            onClick={() => refetch()}
                            disabled={isFetching}
                            title="Atualizar dados"
                        >
                            <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
                            {isFetching ? 'Atualizando...' : 'Atualizar'}
                        </Button>
                        <Button variant="outline" onClick={() => { }}>
                            <Download className="h-4 w-4 mr-2" />
                            Gerar PDF
                        </Button>
                        <Button onClick={() => setShowModal(true)}>
                            <Plus className="h-4 w-4 mr-2" />
                            Novo Lançamento
                        </Button>
                    </div>
                )}
            </div>

            {/* Stats - Agora vem do hook useFinanceiro */}
            {!isMorador && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white">
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-white/20 rounded-lg">
                                    <TrendingUp className="h-6 w-6" />
                                </div>
                                <div>
                                    <p className="text-sm text-emerald-100">Receitas (Pagas)</p>
                                    <p className="text-2xl font-bold">{formatCurrency(stats.receitas)}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white">
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-white/20 rounded-lg">
                                    <TrendingDown className="h-6 w-6" />
                                </div>
                                <div>
                                    <p className="text-sm text-orange-100">Despesas (Pagas)</p>
                                    <p className="text-2xl font-bold">{formatCurrency(stats.despesas)}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="bg-gradient-to-br from-red-500 to-red-600 text-white">
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-white/20 rounded-lg">
                                    <AlertCircle className="h-6 w-6" />
                                </div>
                                <div>
                                    <p className="text-sm text-red-100">Inadimplência</p>
                                    <p className="text-2xl font-bold">{formatCurrency(stats.inadimplencia)}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Filters */}
            <div className="flex flex-wrap gap-4">
                <Select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value as '' | 'receita' | 'despesa')}
                    options={[
                        { value: '', label: 'Todos os tipos' },
                        { value: 'receita', label: 'Receitas' },
                        { value: 'despesa', label: 'Despesas' },
                    ]}
                    className="w-40"
                />
                <Select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value as '' | 'previsto' | 'em_aberto' | 'pago' | 'atrasado')}
                    options={STATUS_OPTIONS}
                    className="w-40"
                />
            </div>

            {/* Table */}
            <Card>
                <CardContent className="p-0">
                    <Table
                        data={entries}
                        columns={columns}
                        loading={isLoading}
                        emptyMessage="Nenhum lançamento encontrado"
                    />
                </CardContent>
            </Card>

            {/* New/Edit Entry Modal */}
            {condoId && (
                <NewEntryModal
                    isOpen={showModal}
                    onClose={() => { setShowModal(false); setEditingEntry(null); }}
                    onSuccess={() => { setEditingEntry(null); }}
                    condoId={condoId}
                    editingEntry={editingEntry}
                />
            )}
        </div>
    );
}

function NewEntryModal({ isOpen, onClose, onSuccess, condoId, editingEntry }: {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    condoId: string | null | undefined;
    editingEntry?: FinancialEntry | null;
}) {
    const [tipo, setTipo] = useState('receita');
    const [categoria, setCategoria] = useState('');
    const [descricao, setDescricao] = useState('');
    const [valor, setValor] = useState('');
    const [dataVencimento, setDataVencimento] = useState('');
    const [status, setStatus] = useState('em_aberto');
    const [unidadeId, setUnidadeId] = useState('');
    const [units, setUnits] = useState<{ id: string; bloco: string; numero_unidade: string }[]>([]);
    const supabase = createClient();
    const queryClient = useQueryClient();

    // ✅ Mutations do TanStack Query
    const { mutate: createEntry, isPending: isCreating } = useCreateTransacao();
    const { mutate: updateEntry, isPending: isUpdating } = useUpdateTransacao();

    const isLoading = isCreating || isUpdating;

    // Populate form when editing
    useState(() => {
        if (editingEntry) {
            setTipo(editingEntry.tipo);
            setCategoria(editingEntry.categoria);
            setDescricao(editingEntry.descricao || '');
            setValor(String(editingEntry.valor));
            setDataVencimento(editingEntry.data_vencimento);
            setStatus(editingEntry.status);
            setUnidadeId(editingEntry.unidade_id || '');
        } else {
            // Reset form for new entry
            setTipo('receita');
            setCategoria('');
            setDescricao('');
            setValor('');
            setDataVencimento('');
            setStatus('em_aberto');
            setUnidadeId('');
        }
    });

    // Fetch units - usando useEffect tradicional (simples, não precisa de cache)
    useState(() => {
        if (condoId) {
            supabase.from('units').select('id, bloco, numero_unidade').eq('condo_id', condoId).then(({ data }) => {
                setUnits(data || []);
            });
        }
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!condoId) {
            alert('Erro: Condomínio não identificado. Faça login novamente.');
            return;
        }

        if (!categoria) {
            alert('Por favor, selecione uma categoria.');
            return;
        }

        if (!valor || parseFloat(valor) <= 0) {
            alert('Por favor, informe um valor válido.');
            return;
        }

        if (!dataVencimento) {
            alert('Por favor, informe a data de vencimento.');
            return;
        }

        const entryData = {
            tipo: tipo as 'receita' | 'despesa',
            categoria,
            descricao,
            valor: parseFloat(valor),
            data_vencimento: dataVencimento,
            status: status as 'previsto' | 'em_aberto' | 'pago',
            unidade_id: unidadeId || null,
        };

        if (editingEntry) {
            // ✅ Update usando mutation
            updateEntry(
                { id: editingEntry.id, ...entryData },
                {
                    onSuccess: () => {
                        onSuccess();
                        onClose();
                    },
                    onError: (error) => {
                        alert(error.message || 'Erro ao atualizar lançamento');
                    },
                }
            );
        } else {
            // ✅ Create usando mutation - cache invalidado automaticamente!
            createEntry(entryData, {
                onSuccess: () => {
                    onSuccess();
                    onClose();
                },
                onError: (error) => {
                    alert(error.message || 'Erro ao criar lançamento');
                },
            });
        }
    };

    const categorias = tipo === 'receita' ? CATEGORIAS_RECEITA : CATEGORIAS_DESPESA;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={editingEntry ? 'Editar Lançamento' : 'Novo Lançamento'} size="lg">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <Select
                        label="Tipo"
                        value={tipo}
                        onChange={(e) => { setTipo(e.target.value); setCategoria(''); }}
                        options={[
                            { value: 'receita', label: 'Receita' },
                            { value: 'despesa', label: 'Despesa' },
                        ]}
                        required
                    />
                    <Select
                        label="Categoria"
                        value={categoria}
                        onChange={(e) => setCategoria(e.target.value)}
                        options={categorias}
                        placeholder="Selecione"
                        required
                    />
                </div>

                <Input
                    label="Descrição"
                    value={descricao}
                    onChange={(e) => setDescricao(e.target.value)}
                    placeholder="Ex: Taxa de condomínio - Janeiro"
                />

                <div className="grid grid-cols-2 gap-4">
                    <Input
                        label="Valor (R$)"
                        type="number"
                        step="0.01"
                        value={valor}
                        onChange={(e) => setValor(e.target.value)}
                        placeholder="0,00"
                        required
                    />
                    <Input
                        label="Data de Vencimento"
                        type="date"
                        value={dataVencimento}
                        onChange={(e) => setDataVencimento(e.target.value)}
                        required
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <Select
                        label="Status"
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                        options={[
                            { value: 'previsto', label: 'Previsto' },
                            { value: 'em_aberto', label: 'Em Aberto' },
                            { value: 'pago', label: 'Pago' },
                        ]}
                        required
                    />
                    {tipo === 'receita' && (
                        <Select
                            label="Unidade (opcional)"
                            value={unidadeId}
                            onChange={(e) => setUnidadeId(e.target.value)}
                            options={units.map(u => ({ value: u.id, label: `${u.bloco || ''} ${u.numero_unidade}` }))}
                            placeholder="Geral"
                        />
                    )}
                </div>

                <div className="flex gap-3 justify-end pt-4">
                    <Button type="button" variant="ghost" onClick={onClose}>
                        Cancelar
                    </Button>
                    <Button type="submit" loading={isLoading}>
                        {isLoading ? 'Salvando...' : 'Salvar'}
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
