'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, Button, Input, Select, Table, Badge } from '@/components/ui';
import { Modal } from '@/components/ui/modal';
import { createClient } from '@/lib/supabase/client';
import { formatCurrency, formatDate, getStatusColor, getStatusLabel } from '@/lib/utils';
import { Plus, Search, Building2, Edit, Trash2, Eye } from 'lucide-react';
import { Condo, Plan } from '@/types/database';

export default function AdminCondominiosPage() {
    const [condos, setCondos] = useState<Condo[]>([]);
    const [plans, setPlans] = useState<Plan[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingCondo, setEditingCondo] = useState<Condo | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const supabase = createClient();

    useEffect(() => {
        fetchCondos();
        fetchPlans();
    }, []);

    const fetchPlans = async () => {
        const { data } = await supabase.from('plans').select('*').eq('ativo', true);
        setPlans(data || []);
    };

    const fetchCondos = async () => {
        setLoading(true);
        const { data } = await supabase
            .from('condos')
            .select('*, plan:plans(*)')
            .order('created_at', { ascending: false });
        setCondos(data || []);
        setLoading(false);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Deseja realmente excluir este condomínio? Esta ação é irreversível.')) return;
        await supabase.from('condos').delete().eq('id', id);
        fetchCondos();
    };

    const filteredCondos = condos.filter(c => {
        const matchesSearch = c.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.cidade?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = !filterStatus || c.status === filterStatus;
        return matchesSearch && matchesStatus;
    });

    const columns = [
        {
            key: 'nome',
            header: 'Condomínio',
            render: (c: Condo) => (
                <div>
                    <p className="font-medium text-gray-900">{c.nome}</p>
                    <p className="text-sm text-gray-500">{c.cidade}, {c.estado}</p>
                </div>
            )
        },
        { key: 'cnpj', header: 'CNPJ', render: (c: Condo) => c.cnpj || '-' },
        {
            key: 'plan',
            header: 'Plano',
            render: (c: Condo) => c.plan?.nome_plano || '-'
        },
        {
            key: 'status',
            header: 'Status',
            render: (c: Condo) => (
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(c.status)}`}>
                    {getStatusLabel(c.status)}
                </span>
            )
        },
        { key: 'data_inicio', header: 'Criado em', render: (c: Condo) => formatDate(c.data_inicio) },
        {
            key: 'data_fim_teste',
            header: 'Fim Trial',
            render: (c: Condo) => c.data_fim_teste ? formatDate(c.data_fim_teste) : '-'
        },
        {
            key: 'actions',
            header: '',
            className: 'text-right',
            render: (c: Condo) => (
                <div className="flex gap-2 justify-end">
                    <button
                        onClick={(e) => { e.stopPropagation(); setEditingCondo(c); setShowModal(true); }}
                        className="p-1 hover:bg-gray-100 rounded"
                    >
                        <Edit className="h-4 w-4 text-gray-500" />
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); handleDelete(c.id); }}
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
                    <h1 className="text-2xl font-bold text-gray-900">Condomínios</h1>
                    <p className="text-gray-500">Gerencie todos os condomínios da plataforma</p>
                </div>
                <Button onClick={() => { setEditingCondo(null); setShowModal(true); }}>
                    <Plus className="h-4 w-4 mr-2" />
                    Novo Condomínio
                </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0">
                    <CardContent className="py-4 text-center">
                        <Building2 className="h-8 w-8 mx-auto opacity-80 mb-2" />
                        <p className="text-2xl font-bold">{condos.length}</p>
                        <p className="text-sm text-blue-100">Total</p>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white border-0">
                    <CardContent className="py-4 text-center">
                        <p className="text-2xl font-bold">{condos.filter(c => c.status === 'ativo').length}</p>
                        <p className="text-sm text-emerald-100">Ativos</p>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0">
                    <CardContent className="py-4 text-center">
                        <p className="text-2xl font-bold">{condos.filter(c => c.status === 'teste').length}</p>
                        <p className="text-sm text-purple-100">Em Trial</p>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-red-500 to-red-600 text-white border-0">
                    <CardContent className="py-4 text-center">
                        <p className="text-2xl font-bold">{condos.filter(c => c.status === 'suspenso').length}</p>
                        <p className="text-sm text-red-100">Suspensos</p>
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
                        placeholder="Buscar por nome ou cidade..."
                        className="pl-10"
                    />
                </div>
                <Select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    options={[
                        { value: '', label: 'Todos os status' },
                        { value: 'ativo', label: 'Ativo' },
                        { value: 'teste', label: 'Em Trial' },
                        { value: 'suspenso', label: 'Suspenso' },
                    ]}
                    className="w-40"
                />
            </div>

            {/* Table */}
            <Card>
                <CardContent className="p-0">
                    <Table
                        data={filteredCondos}
                        columns={columns}
                        loading={loading}
                        emptyMessage="Nenhum condomínio cadastrado"
                    />
                </CardContent>
            </Card>

            {/* Modal */}
            <CondoModal
                isOpen={showModal}
                onClose={() => { setShowModal(false); setEditingCondo(null); }}
                onSuccess={fetchCondos}
                condo={editingCondo}
                plans={plans}
            />
        </div>
    );
}

function CondoModal({ isOpen, onClose, onSuccess, condo, plans }: {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    condo: Condo | null;
    plans: Plan[];
}) {
    const [loading, setLoading] = useState(false);
    const [nome, setNome] = useState('');
    const [cnpj, setCnpj] = useState('');
    const [endereco, setEndereco] = useState('');
    const [cidade, setCidade] = useState('');
    const [estado, setEstado] = useState('');
    const [cep, setCep] = useState('');
    const [telefone, setTelefone] = useState('');
    const [emailContato, setEmailContato] = useState('');
    const [planoId, setPlanoId] = useState('');
    const [status, setStatus] = useState('teste');
    const [dataFimTeste, setDataFimTeste] = useState('');
    const supabase = createClient();

    useEffect(() => {
        if (condo) {
            setNome(condo.nome);
            setCnpj(condo.cnpj || '');
            setEndereco(condo.endereco || '');
            setCidade(condo.cidade || '');
            setEstado(condo.estado || '');
            setCep(condo.cep || '');
            setTelefone(condo.telefone || '');
            setEmailContato(condo.email_contato || '');
            setPlanoId(condo.plano_id || '');
            setStatus(condo.status);
            setDataFimTeste(condo.data_fim_teste?.split('T')[0] || '');
        } else {
            // Default: 14 days trial
            const trialEnd = new Date();
            trialEnd.setDate(trialEnd.getDate() + 14);

            setNome('');
            setCnpj('');
            setEndereco('');
            setCidade('');
            setEstado('');
            setCep('');
            setTelefone('');
            setEmailContato('');
            setPlanoId('');
            setStatus('teste');
            setDataFimTeste(trialEnd.toISOString().split('T')[0]);
        }
    }, [condo]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const data = {
            nome,
            cnpj: cnpj || null,
            endereco: endereco || null,
            cidade: cidade || null,
            estado: estado || null,
            cep: cep || null,
            telefone: telefone || null,
            email_contato: emailContato || null,
            plano_id: planoId || null,
            status,
            data_fim_teste: dataFimTeste || null,
        };

        if (condo) {
            await supabase.from('condos').update(data).eq('id', condo.id);
        } else {
            await supabase.from('condos').insert(data);
        }

        onSuccess();
        onClose();
        setLoading(false);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={condo ? 'Editar Condomínio' : 'Novo Condomínio'} size="lg">
            <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto">
                <Input
                    label="Nome do Condomínio"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    placeholder="Ex: Residencial Vista Verde"
                    required
                />

                <div className="grid grid-cols-2 gap-4">
                    <Input
                        label="CNPJ"
                        value={cnpj}
                        onChange={(e) => setCnpj(e.target.value)}
                        placeholder="00.000.000/0000-00"
                    />
                    <Input
                        label="Telefone"
                        value={telefone}
                        onChange={(e) => setTelefone(e.target.value)}
                        placeholder="(11) 99999-9999"
                    />
                </div>

                <Input
                    label="Email de Contato"
                    type="email"
                    value={emailContato}
                    onChange={(e) => setEmailContato(e.target.value)}
                    placeholder="contato@condominio.com"
                />

                <Input
                    label="Endereço"
                    value={endereco}
                    onChange={(e) => setEndereco(e.target.value)}
                    placeholder="Rua, número, bairro"
                />

                <div className="grid grid-cols-3 gap-4">
                    <Input
                        label="Cidade"
                        value={cidade}
                        onChange={(e) => setCidade(e.target.value)}
                        placeholder="São Paulo"
                    />
                    <Input
                        label="Estado"
                        value={estado}
                        onChange={(e) => setEstado(e.target.value)}
                        placeholder="SP"
                    />
                    <Input
                        label="CEP"
                        value={cep}
                        onChange={(e) => setCep(e.target.value)}
                        placeholder="00000-000"
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <Select
                        label="Plano"
                        value={planoId}
                        onChange={(e) => setPlanoId(e.target.value)}
                        options={plans.map(p => ({ value: p.id, label: `${p.nome_plano} - ${formatCurrency(p.valor_mensal)}/mês` }))}
                        placeholder="Selecione um plano"
                    />
                    <Select
                        label="Status"
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                        options={[
                            { value: 'ativo', label: 'Ativo' },
                            { value: 'teste', label: 'Período de Teste' },
                            { value: 'suspenso', label: 'Suspenso' },
                        ]}
                        required
                    />
                </div>

                {status === 'teste' && (
                    <Input
                        label="Data Fim do Trial"
                        type="date"
                        value={dataFimTeste}
                        onChange={(e) => setDataFimTeste(e.target.value)}
                    />
                )}

                <div className="flex gap-3 justify-end pt-4">
                    <Button type="button" variant="ghost" onClick={onClose}>
                        Cancelar
                    </Button>
                    <Button type="submit" loading={loading}>
                        {condo ? 'Salvar' : 'Criar'}
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
