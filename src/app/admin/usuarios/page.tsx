'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, Button, Input, Select, Table, Badge } from '@/components/ui';
import { Modal } from '@/components/ui/modal';
import { createClient } from '@/lib/supabase/client';
import { formatDate, getRoleLabel } from '@/lib/utils';
import { Plus, Search, Users, Edit, Trash2, Key, Mail, RefreshCw, ToggleLeft, Eye, EyeOff, Copy } from 'lucide-react';
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
        // SuperAdmin só vê Síndicos e Admins
        if (!['sindico', 'superadmin'].includes(u.role)) return false;

        const matchesSearch = u.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (u.cliente_id && u.cliente_id.toString().includes(searchTerm));
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

    // Gerar senha aleatória
    const generatePassword = () => {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
        let pass = '';
        for (let i = 0; i < 8; i++) {
            pass += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return pass;
    };

    // Enviar credenciais por e-mail
    const handleSendAccess = async (user: any) => {
        if (!user.email) {
            alert('❌ Usuário não tem email cadastrado');
            return;
        }

        const newPassword = generatePassword();

        if (!confirm(`📧 Enviar credenciais para ${user.email}?\n\nUma nova senha será gerada: ${newPassword}`)) return;

        try {
            const { data: { session } } = await supabase.auth.getSession();

            const response = await fetch('/api/usuarios/send-access', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session?.access_token}`
                },
                body: JSON.stringify({
                    userId: user.id,
                    email: user.email,
                    nome: user.nome,
                    password: newPassword
                }),
            });

            const result = await response.json();

            if (response.ok && result.success) {
                alert(`✅ Credenciais enviadas para ${user.email}\n\nSenha gerada: ${result.password || newPassword}`);
            } else {
                alert(`❌ ${result.error || 'Erro ao enviar credenciais'}`);
            }
        } catch (err: any) {
            alert(`❌ Erro: ${err.message}`);
        }
    };

    // Resetar senha
    const handleResetPassword = async (user: any) => {
        const newPassword = generatePassword();

        if (!confirm(`🔑 Resetar senha de ${user.nome}?\n\nNova senha: ${newPassword}\n\nO usuário receberá um e-mail com as novas credenciais.`)) return;

        try {
            const { data: { session } } = await supabase.auth.getSession();

            const response = await fetch('/api/usuarios/send-access', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session?.access_token}`
                },
                body: JSON.stringify({
                    userId: user.id,
                    email: user.email,
                    nome: user.nome,
                    password: newPassword
                }),
            });

            const result = await response.json();

            if (response.ok && result.success) {
                alert(`✅ Senha resetada!\n\nNova senha: ${result.password || newPassword}\nE-mail enviado para: ${user.email}`);
            } else {
                alert(`❌ ${result.error || 'Erro ao resetar senha'}`);
            }
        } catch (err: any) {
            alert(`❌ Erro: ${err.message}`);
        }
    };

    // Ativar/Desativar usuário
    const handleToggleActive = async (user: any) => {
        const novoStatus = !user.ativo;

        if (!confirm(`${novoStatus ? '✅ Ativar' : '🚫 Desativar'} o usuário ${user.nome}?`)) return;

        try {
            const { error } = await supabase
                .from('users')
                .update({ ativo: novoStatus })
                .eq('id', user.id);

            if (error) throw error;

            // Atualizar lista local
            setUsers(prev => prev.map(u =>
                u.id === user.id ? { ...u, ativo: novoStatus } : u
            ));

            alert(`✅ Usuário ${novoStatus ? 'ativado' : 'desativado'} com sucesso!`);
        } catch (err: any) {
            alert(`❌ Erro: ${err.message}`);
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
            key: 'cliente_id',
            header: 'ID Cliente',
            render: (u: any) => u.role === 'sindico' && u.cliente_id ? (
                <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-bold">
                    #{u.cliente_id}
                </span>
            ) : '-'
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
                <div className="flex gap-1 justify-end">
                    <button
                        onClick={(e) => { e.stopPropagation(); handleSendAccess(u); }}
                        className="p-2 hover:bg-blue-50 rounded"
                        title="Enviar credenciais por e-mail"
                    >
                        <Mail className="h-4 w-4 text-blue-500" />
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); handleResetPassword(u); }}
                        className="p-2 hover:bg-amber-50 rounded"
                        title="Resetar senha"
                    >
                        <Key className="h-4 w-4 text-amber-500" />
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); handleToggleActive(u); }}
                        className="p-2 hover:bg-gray-100 rounded"
                        title={u.ativo ? 'Desativar' : 'Ativar'}
                    >
                        <ToggleLeft className={`h-4 w-4 ${u.ativo ? 'text-green-500' : 'text-gray-400'}`} />
                    </button>
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

            {/* Stats - Apenas Síndicos e Admins */}
            <div className="grid grid-cols-3 gap-4">
                <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white border-0">
                    <CardContent className="py-4 text-center">
                        <Users className="h-8 w-8 mx-auto opacity-80 mb-2" />
                        <p className="text-2xl font-bold">{users.filter(u => ['sindico', 'superadmin'].includes(u.role)).length}</p>
                        <p className="text-sm text-emerald-100">Total</p>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0">
                    <CardContent className="py-4 text-center">
                        <p className="text-2xl font-bold">{users.filter(u => u.role === 'sindico').length}</p>
                        <p className="text-sm text-blue-100">Síndicos</p>
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
                        placeholder="Buscar por nome, email ou ID cliente..."
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
    const [showPassword, setShowPassword] = useState(false);
    const [enviarEmailBoasVindas, setEnviarEmailBoasVindas] = useState(true);
    const [telefone, setTelefone] = useState('');
    const [role, setRole] = useState('sindico');
    const [condoId, setCondoId] = useState('');
    const [ativo, setAtivo] = useState(true);
    // Campos extras para síndico
    const [condoNome, setCondoNome] = useState('');
    const [planoId, setPlanoId] = useState('');
    const [periodoTeste, setPeriodoTeste] = useState(true);
    const [ativarImediatamente, setAtivarImediatamente] = useState(false);
    const [usarAssinaturaExistente, setUsarAssinaturaExistente] = useState(false);
    const [selectedSubscriptionId, setSelectedSubscriptionId] = useState('');

    // Gerar senha aleatória
    const generatePassword = () => {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
        let pass = '';
        for (let i = 0; i < 8; i++) {
            pass += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        setSenha(pass);
    };
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
            setUsarAssinaturaExistente(false);
            setSelectedSubscriptionId('');
        } else {
            // Reset completo para novo usuário
            setNome('');
            setEmail('');
            setSenha('');
            setTelefone('');
            setRole('sindico');
            setCondoId('');
            setAtivo(true);
            setCondoNome('');
            setPlanoId('');
            setPeriodoTeste(true);
            setAtivarImediatamente(false);
            setUsarAssinaturaExistente(false);
            setSelectedSubscriptionId('');
        }
    }, [user, isOpen]);

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
                // CRIAÇÃO - usa senha do campo ou gera uma nova
                const senhaFinal = senha || (() => {
                    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
                    let pass = '';
                    for (let i = 0; i < 8; i++) pass += chars.charAt(Math.floor(Math.random() * chars.length));
                    return pass;
                })();

                // Obter token de sessão para enviar via Authorization header
                const { data: { session: currentSession } } = await supabase.auth.getSession();
                if (!currentSession?.access_token) {
                    alert('❌ Sessão expirada. Por favor, faça login novamente.');
                    setLoading(false);
                    return;
                }

                const response = await fetch('/api/admin/users', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${currentSession.access_token}`
                    },
                    credentials: 'include',
                    body: JSON.stringify({
                        nome,
                        email,
                        senha: senhaFinal,
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
                        enviar_email: enviarEmailBoasVindas,
                    }),
                });

                const result = await response.json();

                if (!response.ok) {
                    alert(`❌ ${result.error || 'Erro ao criar usuário'}`);
                    setLoading(false);
                    return;
                }

                // Exibir senha claramente
                const mensagem = `✅ ${result.message}\n\n📧 Email: ${email}\n🔑 Senha: ${senhaFinal}${enviarEmailBoasVindas ? '\n\n✉️ E-mail de boas-vindas enviado!' : '\n\n⚠️ Anote a senha! Não foi enviado e-mail.'}`;
                alert(mensagem);

                // Copiar para área de transferência
                try {
                    await navigator.clipboard.writeText(`Email: ${email}\nSenha: ${senhaFinal}`);
                } catch { }
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

                {/* Campo de senha apenas para novos usuários */}
                {!user && (
                    <>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Senha</label>
                            <div className="flex gap-2">
                                <div className="relative flex-1">
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={senha}
                                        onChange={(e) => setSenha(e.target.value)}
                                        placeholder="Deixe vazio para gerar automática"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 pr-10"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                    >
                                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                                <Button type="button" variant="outline" onClick={generatePassword} className="shrink-0">
                                    <RefreshCw className="h-4 w-4 mr-1" />
                                    Gerar
                                </Button>
                            </div>
                            <p className="text-xs text-gray-400 mt-1">Se deixar vazio, será gerada uma senha aleatória</p>
                        </div>

                        <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                            <input
                                type="checkbox"
                                id="enviarEmailBoasVindas"
                                checked={enviarEmailBoasVindas}
                                onChange={(e) => setEnviarEmailBoasVindas(e.target.checked)}
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <label htmlFor="enviarEmailBoasVindas" className="text-sm text-blue-800">
                                ✉️ Enviar e-mail de boas-vindas com credenciais
                            </label>
                        </div>
                    </>
                )}

                <Input
                    label="Telefone"
                    value={telefone}
                    onChange={(e) => {
                        // Formatar telefone com (DDD)
                        let value = e.target.value.replace(/\D/g, '');
                        if (value.length > 0) {
                            if (value.length <= 2) {
                                value = `(${value}`;
                            } else if (value.length <= 6) {
                                value = `(${value.slice(0, 2)}) ${value.slice(2)}`;
                            } else if (value.length <= 10) {
                                value = `(${value.slice(0, 2)}) ${value.slice(2, 6)}-${value.slice(6)}`;
                            } else {
                                value = `(${value.slice(0, 2)}) ${value.slice(2, 7)}-${value.slice(7, 11)}`;
                            }
                        }
                        setTelefone(value);
                    }}
                    placeholder="(11) 99999-9999"
                />

                <div className="grid grid-cols-2 gap-4">
                    <Select
                        label="Papel"
                        value={role}
                        onChange={(e) => setRole(e.target.value)}
                        options={[
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
