'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, Button, Input, Select, Badge, Table } from '@/components/ui';
import { Modal } from '@/components/ui/modal';
import { createClient } from '@/lib/supabase/client';
import { useUser } from '@/hooks/useUser';
import { formatCurrency, formatDate, getStatusColor, getStatusLabel } from '@/lib/utils';
import { Plus, Download, DollarSign, TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';
import { FinancialEntry } from '@/types/database';

const CATEGORIAS_RECEITA = [
    { value: 'taxa_condominio', label: 'Taxa de Condomínio' },
    { value: 'fundo_reserva', label: 'Fundo de Reserva' },
    { value: 'multa', label: 'Multa' },
    { value: 'aluguel_espaco', label: 'Aluguel de Espaço' },
    { value: 'outros', label: 'Outros' },
];

const CATEGORIAS_DESPESA = [
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
    const { condoId, isMorador, isSuperAdmin, profile, loading: userLoading } = useUser();
    const [entries, setEntries] = useState<FinancialEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [filterType, setFilterType] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [stats, setStats] = useState({ receitas: 0, despesas: 0, inadimplencia: 0 });
    const supabase = createClient();

    useEffect(() => {
        if (!userLoading) {
            if (condoId) {
                fetchEntries();
            } else if (isSuperAdmin) {
                fetchAllEntries();
            } else {
                setLoading(false);
            }
        }
    }, [condoId, filterType, filterStatus, userLoading, isSuperAdmin]);

    const fetchAllEntries = async () => {
        setLoading(true);
        let query = supabase.from('financial_entries')
            .select('*, unit:units(bloco, numero_unidade), condo:condos(nome)')
            .order('data_vencimento', { ascending: false })
            .limit(100);

        if (filterType) query = query.eq('tipo', filterType);
        if (filterStatus) query = query.eq('status', filterStatus);

        const { data } = await query;
        setEntries(data || []);
        calculateStats(data || []);
        setLoading(false);
    };

    const calculateStats = (data: any[]) => {
        const receitas = data.filter(e => e.tipo === 'receita' && e.status === 'pago').reduce((s, e) => s + Number(e.valor), 0);
        const despesas = data.filter(e => e.tipo === 'despesa' && e.status === 'pago').reduce((s, e) => s + Number(e.valor), 0);
        const inadimplencia = data.filter(e => e.tipo === 'receita' && (e.status === 'em_aberto' || e.status === 'atrasado')).reduce((s, e) => s + Number(e.valor), 0);
        setStats({ receitas, despesas, inadimplencia });
    };

    const fetchEntries = async () => {
        setLoading(true);
        let query = supabase.from('financial_entries')
            .select('*, unit:units(bloco, numero_unidade)')
            .eq('condo_id', condoId)
            .order('data_vencimento', { ascending: false });

        if (isMorador && profile?.unidade_id) {
            query = query.eq('unidade_id', profile.unidade_id);
        }
        if (filterType) query = query.eq('tipo', filterType);
        if (filterStatus) query = query.eq('status', filterStatus);

        const { data } = await query;
        setEntries(data || []);
        calculateStats(data || []);
        setLoading(false);
    };

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

            {/* Stats */}
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
                    onChange={(e) => setFilterType(e.target.value)}
                    options={[
                        { value: '', label: 'Todos os tipos' },
                        { value: 'receita', label: 'Receitas' },
                        { value: 'despesa', label: 'Despesas' },
                    ]}
                    className="w-40"
                />
                <Select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
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
                        loading={loading}
                        emptyMessage="Nenhum lançamento encontrado"
                    />
                </CardContent>
            </Card>

            {/* New Entry Modal */}
            {condoId && (
                <NewEntryModal
                    isOpen={showModal}
                    onClose={() => setShowModal(false)}
                    onSuccess={fetchEntries}
                    condoId={condoId}
                />
            )}
        </div>
    );
}

function NewEntryModal({ isOpen, onClose, onSuccess, condoId }: {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    condoId: string | null | undefined;
}) {
    const [loading, setLoading] = useState(false);
    const [tipo, setTipo] = useState('receita');
    const [categoria, setCategoria] = useState('');
    const [descricao, setDescricao] = useState('');
    const [valor, setValor] = useState('');
    const [dataVencimento, setDataVencimento] = useState('');
    const [status, setStatus] = useState('em_aberto');
    const [unidadeId, setUnidadeId] = useState('');
    const [units, setUnits] = useState<{ id: string; bloco: string; numero_unidade: string }[]>([]);
    const supabase = createClient();

    useEffect(() => {
        if (condoId) {
            supabase.from('units').select('id, bloco, numero_unidade').eq('condo_id', condoId).then(({ data }) => {
                setUnits(data || []);
            });
        }
    }, [condoId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!condoId) return;

        setLoading(true);
        try {
            const response = await fetch('/api/financial/entries', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    condo_id: condoId,
                    tipo,
                    categoria,
                    descricao,
                    valor: parseFloat(valor),
                    data_vencimento: dataVencimento,
                    status,
                    unidade_id: unidadeId || null,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Erro ao criar lançamento');
            }

            onSuccess();
            onClose();
            setTipo('receita');
            setCategoria('');
            setDescricao('');
            setValor('');
            setDataVencimento('');
            setStatus('em_aberto');
            setUnidadeId('');
        } catch (error: any) {
            console.error('Error creating entry:', error);
            alert(error.message || 'Erro ao criar lançamento');
        }
        setLoading(false);
    };

    const categorias = tipo === 'receita' ? CATEGORIAS_RECEITA : CATEGORIAS_DESPESA;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Novo Lançamento" size="lg">
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
                    <Button type="submit" loading={loading}>
                        Salvar
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
