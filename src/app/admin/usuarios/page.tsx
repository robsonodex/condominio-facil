'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, Button, Input, Select, Table, Badge } from '@/components/ui';
import { Modal } from '@/components/ui/modal';
import { createClient } from '@/lib/supabase/client';
import { formatDate, getRoleLabel } from '@/lib/utils';
import { Plus, Search, Users, Edit, Trash2 } from 'lucide-react';
import { User, Condo } from '@/types/database';
import { useMultiSelect } from '@/hooks/useMultiSelect';

export default function AdminUsuariosPage() {
    const [users, setUsers] = useState<any[]>([]);
    const [condos, setCondos] = useState<{ id: string; nome: string }[]>([]);
    const [plans, setPlans] = useState<{ id: string; nome_plano: string; valor_mensal: number }[]>([]);
    const [subscriptions, setSubscriptions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingUser, setEditingUser] = useState<any>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterRole, setFilterRole] = useState('');
    const supabase = createClient();

    useEffect(() => {
        fetchUsers();
        fetchCondos();
        fetchPlans();
        fetchSubscriptions();
    }, []);

    const fetchPlans = async () => {
        const { data } = await supabase.from('plans').select('id, nome_plano, valor_mensal').eq('ativo', true);
        setPlans((data as { id: string; nome_plano: string; valor_mensal: number }[]) || []);
    };

    const fetchCondos = async () => {
        const { data } = await supabase.from('condos').select('id, nome');
        setCondos((data as { id: string; nome: string }[]) || []);
    };

    const fetchSubscriptions = async () => {
        const { data } = await supabase
            .from('subscriptions')
            .select('id, status, data_renovacao, valor_mensal_cobrado, condo:condos(id, nome), plan:plans(nome_plano)')
            .order('created_at', { ascending: false });
        setSubscriptions(data || []);
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
        if (!confirm('⚠️ Tem certeza que deseja EXCLUIR PERMANENTEMENTE este usuário?\n\nEsta ação é IRREVERSÍVEL!')) return;

        try {
            const response = await fetch(`/api/user/delete?id=${id}`, {
                method: 'DELETE',
                credentials: 'include',
            });
            const data = await response.json();

            if (data.success) {
                setUsers(prev => prev.filter(u => u.id !== id));
                alert('✅ Usuário excluído com sucesso!');
            } else {
                alert('❌ Erro ao excluir: ' + (data.error || 'Erro desconhecido'));
            }
        } catch (err: any) {
            alert('❌ Erro ao excluir: ' + err.message);
        }
    };

    const filteredUsers = users.filter(u => {
        const matchesSearch = u.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            u.email?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesRole = !filterRole || u.role === filterRole;
        return matchesSearch && matchesRole;
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
    } = useMultiSelect(filteredUsers);

    const handleBulkDelete = async () => {
        if (!confirm(`⚠️ Tem certeza que deseja EXCLUIR PERMANENTEMENTE ${selectedCount} usuário(s)?\n\nEsta ação é IRREVERSÍVEL!`)) return;

        try {
            let successCount = 0;
            let errorCount = 0;
            const errors: string[] = [];

            for (const id of Array.from(selectedIds)) {
                try {
                    // Get current session token
                    const { data: { session } } = await supabase.auth.getSession();
                    const token = session?.access_token;

                    const response = await fetch(`/api/user/delete?id=${id}`, {
                        method: 'DELETE',
                        credentials: 'include',
                        headers: token ? {
                            'Authorization': `Bearer ${token}`
                        } : {}
                    });

                    const data = await response.json();

                    if (response.ok && data.success) {
                        successCount++;
                    } else {
                        errorCount++;
                        errors.push(data.error || 'Erro desconhecido');
                    }
                } catch (err: any) {
                    errorCount++;
                    errors.push(err.message);
                }
            }

            if (successCount > 0) {
                alert(`✅ ${successCount} usuário(s) excluído(s) com sucesso!${errorCount > 0 ? `\n\n❌ ${errorCount} erro(s): ${errors.join(', ')}` : ''}`);
                clearSelection();
                fetchUsers();
            } else {
                alert(`❌ Nenhum usuário foi excluído.\n\nErros: ${errors.join(', ')}`);
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
            render: (u: any) => (
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
            header: 'Ações',
            className: 'text-right',
            render: (u: any) => (
                <div className="flex gap-2 justify-end">
                    <button
                        onClick={(e) => { e.stopPropagation(); setEditingUser(u); setShowModal(true); }}
                        className="p-2 hover:bg-gray-100 rounded"
                        title="Editar"
                    >
                        <Edit className="h-4 w-4 text-gray-500" />
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); handleDelete(u.id); }}
                        className="p-2 hover:bg-red-50 rounded"
                        title="Excluir"
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
                    <h1 className="text-2xl font-bold text-gray-900">Usuários</h1>
                    <p className="text-gray-500">Gerencie todos os usuários da plataforma</p>
                </div>
                <div className="flex gap-2">
                    {hasSelection() && (
                        <Button variant="ghost" onClick={handleBulkDelete} className="bg-red-50 text-red-600 hover:bg-red-100">
                            <Trash2 className="h-4 w-4 mr-2" />
                            Excluir {selectedCount} {selectedCount === 1 ? 'Selecionado' : 'Selecionados'}
                        </Button>
                    )}
                    <Button onClick={() => { setEditingUser(null); setShowModal(true); }}>
                        <Plus className="h-4 w-4 mr-2" />
                        Novo Usuário
                    </Button>
                </div>
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
                plans={plans}
                subscriptions={subscriptions}
            />
        </div>
    );
}

function UserModal({ isOpen, onClose, onSuccess, user, condos, plans, subscriptions }: {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    user: any;
    condos: { id: string; nome: string }[];
    plans: { id: string; nome_plano: string; valor_mensal: number }[];
    subscriptions: any[];
}) {
    const [loading, setLoading] = useState(false);
    const [nome, setNome] = useState('');
    const [email, setEmail] = useState('');
    const [senha, setSenha] = useState('');
    const [telefone, setTelefone] = useState('');
    const [role, setRole] = useState('morador');
    const [condoId, setCondoId] = useState('');
    const [ativo, setAtivo] = useState(true);
    // Campos extras para síndico
    const [condoNome, setCondoNome] = useState('');
    const [planoId, setPlanoId] = useState('');
    const [periodoTeste, setPeriodoTeste] = useState(true);
    const [ativarImediatamente, setAtivarImediatamente] = useState(false);
    const [usarAssinaturaExistente, setUsarAssinaturaExistente] = useState(false);
    const [selectedSubscriptionId, setSelectedSubscriptionId] = useState('');
    const supabase = createClient();

    useEffect(() => {
        if (user) {
            setNome(user.nome || '');
            setEmail(user.email || '');
            setSenha('');
            setTelefone(user.telefone || '');
            setRole(user.role);
            setCondoId(user.condo_id || '');
            setAtivo(user.ativo);
            setCondoNome('');
            setPlanoId('');
            setPeriodoTeste(true);
            setAtivarImediatamente(false);
        } else {
            setNome('');
            setEmail('');
            setSenha('');
            setTelefone('');
            setRole('morador');
            setCondoId('');
            setAtivo(true);
            setCondoNome('');
            setPlanoId('');
            setPeriodoTeste(true);
            setAtivarImediatamente(false);
        }
    }, [user]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (user) {
                // EDIÇÃO - usa Supabase direto
                const { error } = await supabase.from('users').update({
                    nome,
                    telefone: telefone || null,
                    role,
                    condo_id: condoId || null,
                    ativo,
                }).eq('id', user.id);

                if (error) {
                    alert(`❌ Erro ao atualizar: ${error.message}`);
                    setLoading(false);
                    return;
                }

                alert('✅ Usuário atualizado com sucesso!');
            } else {
                // CRIAÇÃO - usa nova API
                if (!senha || senha.length < 6) {
                    alert('❌ A senha deve ter pelo menos 6 caracteres.');
                    setLoading(false);
                    return;
                }

                const response = await fetch('/api/admin/users', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include', // IMPORTANTE: enviar cookies de autenticação
                    body: JSON.stringify({
                        nome,
                        email,
                        senha,
                        telefone: telefone || null,
                        role,
                        // Para síndico com assinatura existente, usa o condo_id da assinatura
                        condo_id: role === 'sindico'
                            ? (usarAssinaturaExistente && condoId ? condoId : null)
                            : condoId || null,
                        ativo,
                        // Campos extras para síndico (criar nova assinatura)
                        condo_nome: (role === 'sindico' && !usarAssinaturaExistente) ? condoNome : null,
                        plano_id: (role === 'sindico' && !usarAssinaturaExistente) ? planoId : null,
                        periodo_teste: (role === 'sindico' && !usarAssinaturaExistente) ? periodoTeste : false,
                        ativar_imediatamente: (role === 'sindico' && !usarAssinaturaExistente) ? ativarImediatamente : false,
                    }),
                });

                const result = await response.json();

                if (!response.ok) {
                    alert(`❌ ${result.error || 'Erro ao criar usuário'}`);
                    setLoading(false);
                    return;
                }

                alert(`✅ ${result.message}\n\nO usuário pode fazer login com:\nEmail: ${email}\nSenha: a senha informada`);

                // Abrir login em nova aba
                if (confirm('Deseja abrir a página de login em uma nova aba?')) {
                    window.open('/login', '_blank');
                }
            }

            onSuccess();
            onClose();
        } catch (err: any) {
            alert(`❌ Erro inesperado: ${err.message}`);
        } finally {
            setLoading(false);
        }
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

                {!user && (
                    <Input
                        label="Senha"
                        type="password"
                        value={senha}
                        onChange={(e) => setSenha(e.target.value)}
                        placeholder="Mínimo 6 caracteres"
                        required
                    />
                )}

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
                    {role !== 'sindico' && (
                        <Select
                            label="Condomínio"
                            value={condoId}
                            onChange={(e) => setCondoId(e.target.value)}
                            options={[{ value: '', label: 'Nenhum (Admin)' }, ...condos.map(c => ({ value: c.id, label: c.nome }))]}
                        />
                    )}
                </div>

                {/* Campos extras para Síndico */}
                {role === 'sindico' && !user && (
                    <div className="space-y-4 p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                        <p className="text-sm font-medium text-emerald-800">Configuração do Condomínio</p>

                        {/* Toggle entre existente e novo */}
                        <div className="flex items-center gap-4 pb-3 border-b border-emerald-200">
                            <div className="flex items-center gap-2">
                                <input
                                    type="radio"
                                    id="criarNovo"
                                    name="tipoVinculo"
                                    checked={!usarAssinaturaExistente}
                                    onChange={() => setUsarAssinaturaExistente(false)}
                                    className="text-emerald-600 focus:ring-emerald-500"
                                />
                                <label htmlFor="criarNovo" className="text-sm text-gray-700">
                                    Criar novo condomínio
                                </label>
                            </div>
                            <div className="flex items-center gap-2">
                                <input
                                    type="radio"
                                    id="usarExistente"
                                    name="tipoVinculo"
                                    checked={usarAssinaturaExistente}
                                    onChange={() => setUsarAssinaturaExistente(true)}
                                    className="text-emerald-600 focus:ring-emerald-500"
                                />
                                <label htmlFor="usarExistente" className="text-sm text-gray-700">
                                    Vincular a assinatura existente
                                </label>
                            </div>
                        </div>

                        {usarAssinaturaExistente ? (
                            /* Dropdown de assinaturas existentes */
                            <Select
                                label="Selecione a Assinatura"
                                value={selectedSubscriptionId}
                                onChange={(e) => {
                                    setSelectedSubscriptionId(e.target.value);
                                    const sub = subscriptions.find(s => s.id === e.target.value);
                                    if (sub?.condo?.id) {
                                        setCondoId(sub.condo.id);
                                    }
                                }}
                                options={[
                                    { value: '', label: 'Selecione uma assinatura' },
                                    ...subscriptions.map(s => ({
                                        value: s.id,
                                        label: `${s.condo?.nome || 'Sem condo'} - ${s.plan?.nome_plano || 'Sem plano'} (${s.status})`
                                    }))
                                ]}
                                required
                            />
                        ) : (
                            /* Campos para criar novo */
                            <>
                                <Input
                                    label="Nome do Condomínio"
                                    value={condoNome}
                                    onChange={(e) => setCondoNome(e.target.value)}
                                    placeholder="Ex: Residencial Flores"
                                    required
                                />

                                <Select
                                    label="Plano"
                                    value={planoId}
                                    onChange={(e) => setPlanoId(e.target.value)}
                                    options={[
                                        { value: '', label: 'Selecione um plano' },
                                        ...plans.map(p => ({
                                            value: p.id,
                                            label: `${p.nome_plano} - R$ ${p.valor_mensal.toFixed(2)}/mês`
                                        }))
                                    ]}
                                    required
                                />

                                <div className="flex flex-col gap-2">
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            id="periodoTeste"
                                            checked={periodoTeste && !ativarImediatamente}
                                            onChange={(e) => {
                                                setPeriodoTeste(e.target.checked);
                                                if (e.target.checked) setAtivarImediatamente(false);
                                            }}
                                            className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                                        />
                                        <label htmlFor="periodoTeste" className="text-sm text-gray-700">
                                            Período de teste (7 dias grátis)
                                        </label>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            id="ativarImediatamente"
                                            checked={ativarImediatamente}
                                            onChange={(e) => {
                                                setAtivarImediatamente(e.target.checked);
                                                if (e.target.checked) setPeriodoTeste(false);
                                            }}
                                            className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                                        />
                                        <label htmlFor="ativarImediatamente" className="text-sm text-gray-700">
                                            Ativar imediatamente (sem teste)
                                        </label>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                )}

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
