'use client';

import { useEffect, useState, useMemo } from 'react';
import { Card, CardContent, Button, Input, Select, Table, Badge, CardSkeleton, TableSkeleton } from '@/components/ui';
import { Modal } from '@/components/ui/modal';
import { createClient } from '@/lib/supabase/client';
import { useUser } from '@/hooks/useUser';
import { Plus, Search, Users, Edit, Trash2 } from 'lucide-react';
import { Unit } from '@/types/database';

// Skeleton for instant feedback
function MoradoresSkeleton() {
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Moradores</h1>
                    <p className="text-gray-500">Carregando...</p>
                </div>
            </div>
            <CardSkeleton count={3} />
            <TableSkeleton rows={5} />
        </div>
    );
}

export default function MoradoresPage() {
    const { condoId, isSindico, isSuperAdmin, loading: userLoading } = useUser();
    const [residents, setResidents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingResident, setEditingResident] = useState<any>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterUnit, setFilterUnit] = useState('');
    const [units, setUnits] = useState<Unit[]>([]);
    const supabase = useMemo(() => createClient(), []);

    useEffect(() => {
        if (!userLoading) {
            if (condoId) {
                fetchResidents();
                fetchUnits();
            } else if (isSuperAdmin) {
                fetchAllResidents();
            } else {
                setLoading(false);
            }
        }
    }, [condoId, userLoading, isSuperAdmin]);

    const fetchAllResidents = async () => {
        setLoading(true);
        const { data } = await supabase
            .from('residents')
            .select('*, user:users(*), unit:units(bloco, numero_unidade), condo:condos(nome)')
            .order('created_at', { ascending: false })
            .limit(100);

        setResidents(data || []);
        setLoading(false);
    };

    const fetchUnits = async () => {
        const { data } = await supabase
            .from('units')
            .select('*')
            .eq('condo_id', condoId)
            .order('bloco')
            .order('numero_unidade');
        setUnits(data || []);
    };

    const fetchResidents = async () => {
        setLoading(true);
        const { data } = await supabase
            .from('residents')
            .select('*, user:users(*), unit:units(bloco, numero_unidade)')
            .eq('condo_id', condoId)
            .order('created_at', { ascending: false });

        setResidents(data || []);
        setLoading(false);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Deseja realmente excluir este morador?')) return;
        await supabase.from('residents').delete().eq('id', id);
        condoId ? fetchResidents() : fetchAllResidents();
    };

    const filteredResidents = residents.filter(r => {
        const matchesSearch =
            r.user?.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            r.user?.email?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesUnit = !filterUnit || r.unidade_id === filterUnit;
        return matchesSearch && matchesUnit;
    });

    const columns = [
        {
            key: 'user.nome',
            header: 'Nome',
            render: (r: any) => (
                <div>
                    <p className="font-medium text-gray-900">{r.user?.nome || 'Sem nome'}</p>
                    <p className="text-sm text-gray-500">{r.user?.email}</p>
                </div>
            )
        },
        ...(isSuperAdmin && !condoId ? [{
            key: 'condo',
            header: 'Condomínio',
            render: (r: any) => (
                <span className="text-sm text-gray-600">{r.condo?.nome || '-'}</span>
            )
        }] : []),
        {
            key: 'unit',
            header: 'Unidade',
            render: (r: any) => r.unit ? `${r.unit.bloco || ''} ${r.unit.numero_unidade}` : '-'
        },
        {
            key: 'tipo',
            header: 'Tipo',
            render: (r: any) => (
                <Badge variant={r.tipo === 'proprietario' ? 'success' : 'info'}>
                    {r.tipo === 'proprietario' ? 'Proprietário' : 'Inquilino'}
                </Badge>
            )
        },
        {
            key: 'user.telefone',
            header: 'Telefone',
            render: (r: any) => r.user?.telefone || '-'
        },
        {
            key: 'ativo',
            header: 'Status',
            render: (r: any) => (
                <Badge variant={r.ativo ? 'success' : 'default'}>
                    {r.ativo ? 'Ativo' : 'Inativo'}
                </Badge>
            )
        },
        {
            key: 'actions',
            header: '',
            className: 'text-right',
            render: (r: any) => (
                <div className="flex gap-2 justify-end">
                    <button
                        onClick={(e) => { e.stopPropagation(); setEditingResident(r); setShowModal(true); }}
                        className="p-1 hover:bg-gray-100 rounded"
                    >
                        <Edit className="h-4 w-4 text-gray-500" />
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); handleDelete(r.id); }}
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
                    <h1 className="text-2xl font-bold text-gray-900">Moradores</h1>
                    <p className="text-gray-500">
                        {isSuperAdmin && !condoId
                            ? 'Visualizando todos os moradores do sistema'
                            : 'Gerencie os moradores do condomínio'}
                    </p>
                </div>
                {(isSindico || (isSuperAdmin && condoId)) && (
                    <Button onClick={() => { setEditingResident(null); setShowModal(true); }}>
                        <Plus className="h-4 w-4 mr-2" />
                        Novo Morador
                    </Button>
                )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white">
                    <CardContent className="py-4 text-center">
                        <Users className="h-8 w-8 mx-auto mb-2 opacity-80" />
                        <p className="text-3xl font-bold">{residents.length}</p>
                        <p className="text-sm text-emerald-100">Total de Moradores</p>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                    <CardContent className="py-4 text-center">
                        <p className="text-3xl font-bold">{residents.filter(r => r.tipo === 'proprietario').length}</p>
                        <p className="text-sm text-blue-100">Proprietários</p>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
                    <CardContent className="py-4 text-center">
                        <p className="text-3xl font-bold">{residents.filter(r => r.tipo === 'inquilino').length}</p>
                        <p className="text-sm text-purple-100">Inquilinos</p>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-4">
                <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Buscar por nome ou email..."
                        className="pl-10"
                    />
                </div>
                {condoId && units.length > 0 && (
                    <Select
                        value={filterUnit}
                        onChange={(e) => setFilterUnit(e.target.value)}
                        options={[
                            { value: '', label: 'Todas as unidades' },
                            ...units.map(u => ({ value: u.id, label: `${u.bloco || ''} ${u.numero_unidade}` }))
                        ]}
                        className="w-48"
                    />
                )}
            </div>

            {/* Table */}
            <Card>
                <CardContent className="p-0">
                    <Table
                        data={filteredResidents}
                        columns={columns}
                        loading={loading}
                        emptyMessage="Nenhum morador cadastrado"
                    />
                </CardContent>
            </Card>

            {/* Modal */}
            {condoId && (
                <ResidentModal
                    isOpen={showModal}
                    onClose={() => { setShowModal(false); setEditingResident(null); }}
                    onSuccess={fetchResidents}
                    condoId={condoId}
                    units={units}
                    resident={editingResident}
                />
            )}
        </div>
    );
}

function ResidentModal({ isOpen, onClose, onSuccess, condoId, units, resident }: {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    condoId: string | null | undefined;
    units: Unit[];
    resident: any;
}) {
    const [loading, setLoading] = useState(false);
    const [nome, setNome] = useState('');
    const [email, setEmail] = useState('');
    const [telefone, setTelefone] = useState('');
    const [unidadeId, setUnidadeId] = useState('');
    const [tipo, setTipo] = useState('proprietario');
    const [ativo, setAtivo] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        if (resident) {
            setNome(resident.user?.nome || '');
            setEmail(resident.user?.email || '');
            setTelefone(resident.user?.telefone || '');
            setUnidadeId(resident.unidade_id || '');
            setTipo(resident.tipo);
            setAtivo(resident.ativo);
        } else {
            setNome('');
            setEmail('');
            setTelefone('');
            setUnidadeId('');
            setTipo('proprietario');
            setAtivo(true);
        }
    }, [resident]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!condoId || !unidadeId) return;

        setLoading(true);

        try {
            if (resident) {
                // Update via API
                const response = await fetch('/api/residents', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        id: resident.id,
                        user_id: resident.user_id,
                        nome,
                        telefone: telefone || null,
                        unidade_id: unidadeId,
                        tipo,
                        ativo,
                    }),
                });

                if (!response.ok) {
                    const data = await response.json();
                    throw new Error(data.error || 'Erro ao atualizar morador');
                }
            } else {
                // Create via API
                const response = await fetch('/api/residents', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        nome,
                        email,
                        telefone: telefone || null,
                        condo_id: condoId,
                        unidade_id: unidadeId,
                        tipo,
                    }),
                });

                if (!response.ok) {
                    const data = await response.json();
                    throw new Error(data.error || 'Erro ao criar morador');
                }
            }

            onSuccess();
            onClose();
        } catch (error: any) {
            console.error('Error saving resident:', error);
            alert(error.message || 'Erro ao salvar morador');
        }

        setLoading(false);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={resident ? 'Editar Morador' : 'Novo Morador'} size="md">
            <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                    label="Nome Completo"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    placeholder="Nome do morador"
                    required
                />

                <Input
                    label="Email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="email@exemplo.com"
                    required
                    disabled={!!resident}
                />

                <Input
                    label="Telefone"
                    value={telefone}
                    onChange={(e) => setTelefone(e.target.value)}
                    placeholder="(11) 99999-9999"
                />

                <Select
                    label="Unidade"
                    value={unidadeId}
                    onChange={(e) => setUnidadeId(e.target.value)}
                    options={units.map(u => ({ value: u.id, label: `${u.bloco || ''} ${u.numero_unidade}` }))}
                    placeholder="Selecione a unidade"
                    required
                />

                <div className="grid grid-cols-2 gap-4">
                    <Select
                        label="Tipo"
                        value={tipo}
                        onChange={(e) => setTipo(e.target.value)}
                        options={[
                            { value: 'proprietario', label: 'Proprietário' },
                            { value: 'inquilino', label: 'Inquilino' },
                        ]}
                        required
                    />
                    <Select
                        label="Status"
                        value={ativo ? 'true' : 'false'}
                        onChange={(e) => setAtivo(e.target.value === 'true')}
                        options={[
                            { value: 'true', label: 'Ativo' },
                            { value: 'false', label: 'Inativo' },
                        ]}
                    />
                </div>

                <div className="flex gap-3 justify-end pt-4">
                    <Button type="button" variant="ghost" onClick={onClose}>
                        Cancelar
                    </Button>
                    <Button type="submit" loading={loading}>
                        {resident ? 'Salvar' : 'Criar'}
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
