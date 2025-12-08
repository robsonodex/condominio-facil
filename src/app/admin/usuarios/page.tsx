'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, Button, Input, Select, Table, Badge } from '@/components/ui';
import { Modal } from '@/components/ui/modal';
import { createClient } from '@/lib/supabase/client';
import { formatDate, getRoleLabel } from '@/lib/utils';
import { Plus, Search, Users, Edit, Trash2 } from 'lucide-react';
import { User, Condo } from '@/types/database';

export default function AdminUsuariosPage() {
    const [users, setUsers] = useState<any[]>([]);
    const [condos, setCondos] = useState<{ id: string; nome: string }[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingUser, setEditingUser] = useState<any>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterRole, setFilterRole] = useState('');
    const supabase = createClient();

    useEffect(() => {
        fetchUsers();
        fetchCondos();
    }, []);

    const fetchCondos = async () => {
        const { data } = await supabase.from('condos').select('id, nome');
        setCondos((data as { id: string; nome: string }[]) || []);
    };

    const fetchUsers = async () => {
        setLoading(true);
        const { data } = await supabase
            .from('users')
            .select('*, condo:condos(nome)')
            .order('created_at', { ascending: false });
        setUsers(data || []);
        setLoading(false);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Deseja realmente excluir este usuário?')) return;
        await supabase.from('users').delete().eq('id', id);
        fetchUsers();
    };

    const filteredUsers = users.filter(u => {
        const matchesSearch = u.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            u.email?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesRole = !filterRole || u.role === filterRole;
        return matchesSearch && matchesRole;
    });

    const columns = [
        {
            key: 'nome',
            header: 'Usuário',
            render: (u: any) => (
                <div>
                    <p className="font-medium text-gray-900">{u.nome}</p>
                    <p className="text-sm text-gray-500">{u.email}</p>
                </div>
            )
        },
        {
            key: 'role',
            header: 'Papel',
            render: (u: any) => (
                <Badge variant={u.role === 'superadmin' ? 'danger' : u.role === 'sindico' ? 'success' : 'default'}>
                    {getRoleLabel(u.role)}
                </Badge>
            )
        },
        { key: 'condo', header: 'Condomínio', render: (u: any) => u.condo?.nome || '-' },
        { key: 'telefone', header: 'Telefone', render: (u: any) => u.telefone || '-' },
        {
            key: 'ativo',
            header: 'Status',
            render: (u: any) => (
                <Badge variant={u.ativo ? 'success' : 'default'}>
                    {u.ativo ? 'Ativo' : 'Inativo'}
                </Badge>
            )
        },
        { key: 'created_at', header: 'Criado em', render: (u: any) => formatDate(u.created_at) },
        {
            key: 'actions',
            header: '',
            className: 'text-right',
            render: (u: any) => (
                <div className="flex gap-2 justify-end">
                    <button
                        onClick={(e) => { e.stopPropagation(); setEditingUser(u); setShowModal(true); }}
                        className="p-1 hover:bg-gray-100 rounded"
                    >
                        <Edit className="h-4 w-4 text-gray-500" />
                    </button>
                    {u.role !== 'superadmin' && (
                        <button
                            onClick={(e) => { e.stopPropagation(); handleDelete(u.id); }}
                            className="p-1 hover:bg-gray-100 rounded"
                        >
                            <Trash2 className="h-4 w-4 text-red-500" />
                        </button>
                    )}
                </div>
            )
        },
    ];

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Usuários</h1>
                    <p className="text-gray-500">Gerencie todos os usuários da plataforma</p>
                </div>
                <Button onClick={() => { setEditingUser(null); setShowModal(true); }}>
                    <Plus className="h-4 w-4 mr-2" />
                    Novo Usuário
                </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white border-0">
                    <CardContent className="py-4 text-center">
                        <Users className="h-8 w-8 mx-auto opacity-80 mb-2" />
                        <p className="text-2xl font-bold">{users.length}</p>
                        <p className="text-sm text-emerald-100">Total</p>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0">
                    <CardContent className="py-4 text-center">
                        <p className="text-2xl font-bold">{users.filter(u => u.role === 'sindico').length}</p>
                        <p className="text-sm text-blue-100">Síndicos</p>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-yellow-500 to-yellow-600 text-white border-0">
                    <CardContent className="py-4 text-center">
                        <p className="text-2xl font-bold">{users.filter(u => u.role === 'porteiro').length}</p>
                        <p className="text-sm text-yellow-100">Porteiros</p>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0">
                    <CardContent className="py-4 text-center">
                        <p className="text-2xl font-bold">{users.filter(u => u.role === 'morador').length}</p>
                        <p className="text-sm text-purple-100">Moradores</p>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-red-500 to-red-600 text-white border-0">
                    <CardContent className="py-4 text-center">
                        <p className="text-2xl font-bold">{users.filter(u => u.role === 'superadmin').length}</p>
                        <p className="text-sm text-red-100">Admins</p>
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
                <Select
                    value={filterRole}
                    onChange={(e) => setFilterRole(e.target.value)}
                    options={[
                        { value: '', label: 'Todos os papéis' },
                        { value: 'superadmin', label: 'Super Admin' },
                        { value: 'sindico', label: 'Síndico' },
                        { value: 'porteiro', label: 'Porteiro' },
                        { value: 'morador', label: 'Morador' },
                    ]}
                    className="w-40"
                />
            </div>

            {/* Table */}
            <Card>
                <CardContent className="p-0">
                    <Table
                        data={filteredUsers}
                        columns={columns}
                        loading={loading}
                        emptyMessage="Nenhum usuário encontrado"
                    />
                </CardContent>
            </Card>

            {/* Modal */}
            <UserModal
                isOpen={showModal}
                onClose={() => { setShowModal(false); setEditingUser(null); }}
                onSuccess={fetchUsers}
                user={editingUser}
                condos={condos}
            />
        </div>
    );
}

function UserModal({ isOpen, onClose, onSuccess, user, condos }: {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    user: any;
    condos: { id: string; nome: string }[];
}) {
    const [loading, setLoading] = useState(false);
    const [nome, setNome] = useState('');
    const [email, setEmail] = useState('');
    const [telefone, setTelefone] = useState('');
    const [role, setRole] = useState('morador');
    const [condoId, setCondoId] = useState('');
    const [ativo, setAtivo] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        if (user) {
            setNome(user.nome || '');
            setEmail(user.email || '');
            setTelefone(user.telefone || '');
            setRole(user.role);
            setCondoId(user.condo_id || '');
            setAtivo(user.ativo);
        } else {
            setNome('');
            setEmail('');
            setTelefone('');
            setRole('morador');
            setCondoId('');
            setAtivo(true);
        }
    }, [user]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const data = {
            nome,
            email,
            telefone: telefone || null,
            role,
            condo_id: condoId || null,
            ativo,
        };

        if (user) {
            await supabase.from('users').update(data).eq('id', user.id);
        } else {
            await supabase.from('users').insert(data);
        }

        onSuccess();
        onClose();
        setLoading(false);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={user ? 'Editar Usuário' : 'Novo Usuário'} size="md">
            <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                    label="Nome"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    required
                />

                <Input
                    label="Email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={!!user}
                />

                <Input
                    label="Telefone"
                    value={telefone}
                    onChange={(e) => setTelefone(e.target.value)}
                />

                <div className="grid grid-cols-2 gap-4">
                    <Select
                        label="Papel"
                        value={role}
                        onChange={(e) => setRole(e.target.value)}
                        options={[
                            { value: 'morador', label: 'Morador' },
                            { value: 'porteiro', label: 'Porteiro' },
                            { value: 'sindico', label: 'Síndico' },
                            { value: 'superadmin', label: 'Super Admin' },
                        ]}
                        required
                    />
                    <Select
                        label="Condomínio"
                        value={condoId}
                        onChange={(e) => setCondoId(e.target.value)}
                        options={[{ value: '', label: 'Nenhum (Admin)' }, ...condos.map(c => ({ value: c.id, label: c.nome }))]}
                    />
                </div>

                <div className="flex items-center gap-2">
                    <input
                        type="checkbox"
                        id="ativo"
                        checked={ativo}
                        onChange={(e) => setAtivo(e.target.checked)}
                        className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <label htmlFor="ativo" className="text-sm text-gray-700">Usuário ativo</label>
                </div>

                <div className="flex gap-3 justify-end pt-4">
                    <Button type="button" variant="ghost" onClick={onClose}>
                        Cancelar
                    </Button>
                    <Button type="submit" loading={loading}>
                        {user ? 'Salvar' : 'Criar'}
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
