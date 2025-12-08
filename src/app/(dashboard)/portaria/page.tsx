'use client';

import { useEffect, useState, useMemo } from 'react';
import { Card, CardContent, Button, Input, Select, Table, Badge, CardSkeleton, TableSkeleton } from '@/components/ui';
import { Modal } from '@/components/ui/modal';
import { createClient } from '@/lib/supabase/client';
import { useUser } from '@/hooks/useUser';
import { formatDateTime, getVisitorTypeLabel } from '@/lib/utils';
import { Plus, Search, UserCheck, LogIn, LogOut, Clock } from 'lucide-react';
import { Unit } from '@/types/database';

function PortariaSkeleton() {
    return (
        <div className="space-y-6">
            <div><h1 className="text-2xl font-bold text-gray-900">Portaria</h1><p className="text-gray-500">Carregando...</p></div>
            <CardSkeleton count={4} />
            <TableSkeleton rows={5} />
        </div>
    );
}

export default function PortariaPage() {
    const { condoId, profile, isSindico, isSuperAdmin, loading: userLoading } = useUser();
    const [visitors, setVisitors] = useState<any[]>([]);
    const [presentVisitors, setPresentVisitors] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [viewMode, setViewMode] = useState<'present' | 'history'>('present');
    const supabase = useMemo(() => createClient(), []);

    useEffect(() => {
        if (!userLoading && condoId) fetchVisitors();
        else if (!userLoading) setLoading(false);
    }, [condoId, userLoading]);

    const fetchVisitors = async () => {
        setLoading(true);

        // Present visitors (no exit time)
        const { data: present } = await supabase
            .from('visitors')
            .select('*, unit:units(bloco, numero_unidade), registrado_por:users!registrado_por_user_id(nome)')
            .eq('condo_id', condoId)
            .is('data_hora_saida', null)
            .order('data_hora_entrada', { ascending: false });

        setPresentVisitors(present || []);

        // History (with exit time)
        const { data: history } = await supabase
            .from('visitors')
            .select('*, unit:units(bloco, numero_unidade), registrado_por:users!registrado_por_user_id(nome)')
            .eq('condo_id', condoId)
            .not('data_hora_saida', 'is', null)
            .order('data_hora_entrada', { ascending: false })
            .limit(100);

        setVisitors(history || []);
        setLoading(false);
    };

    const handleExit = async (visitorId: string) => {
        await supabase
            .from('visitors')
            .update({ data_hora_saida: new Date().toISOString() })
            .eq('id', visitorId);
        fetchVisitors();
    };

    const filteredPresent = presentVisitors.filter(v =>
        v.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.documento?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const filteredHistory = visitors.filter(v =>
        v.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.documento?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const presentColumns = [
        {
            key: 'nome',
            header: 'Visitante',
            render: (v: any) => (
                <div>
                    <p className="font-medium text-gray-900">{v.nome}</p>
                    <p className="text-sm text-gray-500">{v.documento || 'Sem documento'}</p>
                </div>
            )
        },
        {
            key: 'tipo',
            header: 'Tipo',
            render: (v: any) => (
                <Badge variant={v.tipo === 'visitante' ? 'default' : v.tipo === 'entrega' ? 'info' : 'warning'}>
                    {getVisitorTypeLabel(v.tipo)}
                </Badge>
            )
        },
        { key: 'unit', header: 'Destino', render: (v: any) => v.unit ? `${v.unit.bloco || ''} ${v.unit.numero_unidade}` : 'Área comum' },
        { key: 'placa_veiculo', header: 'Placa', render: (v: any) => v.placa_veiculo || '-' },
        { key: 'data_hora_entrada', header: 'Entrada', render: (v: any) => formatDateTime(v.data_hora_entrada) },
        {
            key: 'actions',
            header: '',
            className: 'text-right',
            render: (v: any) => (
                <Button size="sm" variant="outline" onClick={() => handleExit(v.id)}>
                    <LogOut className="h-4 w-4 mr-1" />
                    Saída
                </Button>
            )
        },
    ];

    const historyColumns = [
        {
            key: 'nome',
            header: 'Visitante',
            render: (v: any) => (
                <div>
                    <p className="font-medium text-gray-900">{v.nome}</p>
                    <p className="text-sm text-gray-500">{v.documento || '-'}</p>
                </div>
            )
        },
        {
            key: 'tipo',
            header: 'Tipo',
            render: (v: any) => (
                <Badge variant={v.tipo === 'visitante' ? 'default' : v.tipo === 'entrega' ? 'info' : 'warning'}>
                    {getVisitorTypeLabel(v.tipo)}
                </Badge>
            )
        },
        { key: 'unit', header: 'Destino', render: (v: any) => v.unit ? `${v.unit.bloco || ''} ${v.unit.numero_unidade}` : 'Área comum' },
        { key: 'data_hora_entrada', header: 'Entrada', render: (v: any) => formatDateTime(v.data_hora_entrada) },
        { key: 'data_hora_saida', header: 'Saída', render: (v: any) => formatDateTime(v.data_hora_saida) },
    ];

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Portaria</h1>
                    <p className="text-gray-500">Controle de entrada e saída de visitantes</p>
                </div>
                <Button onClick={() => setShowModal(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Registrar Entrada
                </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white border-0">
                    <CardContent className="py-4">
                        <UserCheck className="h-8 w-8 mb-2 opacity-80" />
                        <p className="text-3xl font-bold">{presentVisitors.length}</p>
                        <p className="text-emerald-100 text-sm">No condomínio agora</p>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0">
                    <CardContent className="py-4 text-center">
                        <p className="text-2xl font-bold">{presentVisitors.filter(v => v.tipo === 'visitante').length}</p>
                        <p className="text-sm text-blue-100">Visitantes</p>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-yellow-500 to-yellow-600 text-white border-0">
                    <CardContent className="py-4 text-center">
                        <p className="text-2xl font-bold">{presentVisitors.filter(v => v.tipo === 'prestador_servico').length}</p>
                        <p className="text-sm text-yellow-100">Prestadores</p>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0">
                    <CardContent className="py-4 text-center">
                        <p className="text-2xl font-bold">{presentVisitors.filter(v => v.tipo === 'entrega').length}</p>
                        <p className="text-sm text-purple-100">Entregas</p>
                    </CardContent>
                </Card>
            </div>

            {/* Tabs */}
            <div className="flex gap-2">
                <Button
                    variant={viewMode === 'present' ? 'primary' : 'ghost'}
                    onClick={() => setViewMode('present')}
                >
                    <Clock className="h-4 w-4 mr-2" />
                    No Condomínio ({presentVisitors.length})
                </Button>
                <Button
                    variant={viewMode === 'history' ? 'primary' : 'ghost'}
                    onClick={() => setViewMode('history')}
                >
                    <LogIn className="h-4 w-4 mr-2" />
                    Histórico
                </Button>
            </div>

            {/* Search */}
            <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Buscar por nome ou documento..."
                    className="pl-10"
                />
            </div>

            {/* Table */}
            <Card>
                <CardContent className="p-0">
                    <Table
                        data={viewMode === 'present' ? filteredPresent : filteredHistory}
                        columns={viewMode === 'present' ? presentColumns : historyColumns}
                        loading={loading}
                        emptyMessage={viewMode === 'present' ? 'Nenhum visitante no condomínio' : 'Nenhum registro encontrado'}
                    />
                </CardContent>
            </Card>

            {/* Modal */}
            <VisitorModal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                onSuccess={fetchVisitors}
                condoId={condoId}
                userId={profile?.id}
            />
        </div>
    );
}

function VisitorModal({ isOpen, onClose, onSuccess, condoId, userId }: {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    condoId: string | null | undefined;
    userId: string | undefined;
}) {
    const [loading, setLoading] = useState(false);
    const [nome, setNome] = useState('');
    const [documento, setDocumento] = useState('');
    const [tipo, setTipo] = useState('visitante');
    const [placaVeiculo, setPlacaVeiculo] = useState('');
    const [unidadeId, setUnidadeId] = useState('');
    const [observacoes, setObservacoes] = useState('');
    const [units, setUnits] = useState<Unit[]>([]);
    const supabase = createClient();

    useEffect(() => {
        if (condoId) {
            supabase.from('units').select('*').eq('condo_id', condoId).order('bloco').order('numero_unidade').then(({ data }) => setUnits(data || []));
        }
    }, [condoId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!condoId || !userId) return;

        setLoading(true);
        await supabase.from('visitors').insert({
            condo_id: condoId,
            nome,
            documento: documento || null,
            tipo,
            placa_veiculo: placaVeiculo || null,
            unidade_id: unidadeId || null,
            observacoes: observacoes || null,
            registrado_por_user_id: userId,
        });

        onSuccess();
        onClose();
        // Reset
        setNome('');
        setDocumento('');
        setTipo('visitante');
        setPlacaVeiculo('');
        setUnidadeId('');
        setObservacoes('');
        setLoading(false);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Registrar Entrada" size="md">
            <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                    label="Nome do Visitante"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    placeholder="Nome completo"
                    required
                />

                <div className="grid grid-cols-2 gap-4">
                    <Input
                        label="Documento (RG/CPF)"
                        value={documento}
                        onChange={(e) => setDocumento(e.target.value)}
                        placeholder="000.000.000-00"
                    />
                    <Select
                        label="Tipo"
                        value={tipo}
                        onChange={(e) => setTipo(e.target.value)}
                        options={[
                            { value: 'visitante', label: 'Visitante' },
                            { value: 'prestador_servico', label: 'Prestador de Serviço' },
                            { value: 'entrega', label: 'Entrega' },
                        ]}
                        required
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <Select
                        label="Unidade Destino"
                        value={unidadeId}
                        onChange={(e) => setUnidadeId(e.target.value)}
                        options={units.map(u => ({ value: u.id, label: `${u.bloco || ''} ${u.numero_unidade}` }))}
                        placeholder="Área comum"
                    />
                    <Input
                        label="Placa do Veículo"
                        value={placaVeiculo}
                        onChange={(e) => setPlacaVeiculo(e.target.value)}
                        placeholder="ABC-1234"
                    />
                </div>

                <Input
                    label="Observações"
                    value={observacoes}
                    onChange={(e) => setObservacoes(e.target.value)}
                    placeholder="Observações adicionais"
                />

                <div className="flex gap-3 justify-end pt-4">
                    <Button type="button" variant="ghost" onClick={onClose}>
                        Cancelar
                    </Button>
                    <Button type="submit" loading={loading}>
                        <LogIn className="h-4 w-4 mr-2" />
                        Registrar Entrada
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
