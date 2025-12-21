'use client';

import { useEffect, useState, useMemo } from 'react';
import { Card, CardContent, Button, Input, Select, Modal, Badge, TableSkeleton } from '@/components/ui';
import { createClient } from '@/lib/supabase/client';
import { useUser } from '@/hooks/useUser';
import { useAuth } from '@/hooks/useAuth';
import { formatDate, getRoleLabel, formatPhone } from '@/lib/utils';
import { UserPlus, Edit2, Key, Trash2 } from 'lucide-react';

interface UserItem {
    id: string;
    nome: string;
    email: string;
    telefone: string | null;
    role: string;
    ativo: boolean;
    created_at: string;
}

function UsuariosSkeleton() {
    return (
        <div className="space-y-6">
            <div><h1 className="text-2xl font-bold text-gray-900">Usuários do Condomínio</h1><p className="text-gray-500">Carregando...</p></div>
            <TableSkeleton rows={5} />
        </div>
    );
}

export default function UsuariosCondoPage() {
    const { profile, condoId, isSindico, isSuperAdmin, loading: userLoading } = useUser();
    const { session } = useAuth();
    const [users, setUsers] = useState<UserItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingUser, setEditingUser] = useState<UserItem | null>(null);
    const [formData, setFormData] = useState({
        nome: '',
        email: '',
        telefone: '',
        role: 'morador',
        senha: '',
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const supabase = useMemo(() => createClient(), []);

    useEffect(() => {
        if (!userLoading && condoId) fetchUsers();
        else if (!userLoading) setLoading(false);
    }, [condoId, userLoading]);

    const fetchUsers = async () => {
        const { data } = await supabase
            .from('users')
            .select('*')
            .eq('condo_id', condoId)
            .order('nome');
        setUsers(data || []);
        setLoading(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        try {
            if (editingUser) {
                // Update existing user
                const { error: updateError } = await supabase
                    .from('users')
                    .update({
                        nome: formData.nome,
                        telefone: formData.telefone || null,
                        role: formData.role,
                    })
                    .eq('id', editingUser.id);

                if (updateError) throw updateError;
                setSuccess('Usuário atualizado com sucesso!');
            } else {
                // CRITICAL FIX: Use API endpoint with service role
                // This prevents auto-login bug (síndico being logged out)

                // Verificar se condoId está disponível
                if (!condoId) {
                    throw new Error('Condomínio não identificado. Recarregue a página e tente novamente.');
                }

                const response = await fetch('/api/usuarios/create', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${session?.access_token}`,
                    },
                    credentials: 'include',
                    body: JSON.stringify({
                        email: formData.email,
                        password: formData.senha,
                        nome: formData.nome,
                        telefone: formData.telefone || null,
                        role: formData.role,
                        condo_id: condoId,
                    }),
                });

                const data = await response.json();

                if (!response.ok) {
                    // Mostrar erro mais detalhado
                    console.error('[USUARIOS] Erro ao criar:', data);
                    throw new Error(data.error || 'Erro ao criar usuário');
                }

                setSuccess(`✅ Usuário criado! Acesso: ${formData.email} / ${formData.senha}`);
            }

            fetchUsers();
            setTimeout(() => {
                setShowModal(false);
                resetForm();
            }, 2000);
        } catch (err: any) {
            setError(err.message || 'Erro ao salvar usuário');
        }
    };

    const toggleUserStatus = async (user: UserItem) => {
        await supabase
            .from('users')
            .update({ ativo: !user.ativo })
            .eq('id', user.id);
        fetchUsers();
    };

    const deleteUser = async (user: UserItem) => {
        if (!confirm(`⚠️ Tem certeza que deseja EXCLUIR PERMANENTEMENTE o usuário "${user.nome}"?\n\nEsta ação é IRREVERSÍVEL!`)) {
            return;
        }

        try {
            const response = await fetch(`/api/user/delete?id=${user.id}`, {
                method: 'DELETE',
                credentials: 'include',
            });
            const data = await response.json();

            if (data.success) {
                setUsers(prev => prev.filter(u => u.id !== user.id));
                alert('✅ Usuário excluído com sucesso!');
            } else {
                alert('❌ Erro ao excluir: ' + (data.error || 'Erro desconhecido'));
            }
        } catch (err: any) {
            alert('❌ Erro ao excluir: ' + err.message);
        }
    };

    const openEditModal = (user: UserItem) => {
        setEditingUser(user);
        setFormData({
            nome: user.nome,
            email: user.email,
            telefone: user.telefone || '',
            role: user.role,
            senha: '',
        });
        setShowModal(true);
    };

    const resetForm = () => {
        setFormData({ nome: '', email: '', telefone: '', role: 'morador', senha: '' });
        setEditingUser(null);
        setError('');
        setSuccess('');
    };

    const resetUserPassword = async (user: UserItem) => {
        if (!confirm(`Resetar senha de ${user.nome}?\n\nUma nova senha será gerada e enviada por email.`)) return;

        try {
            const res = await fetch('/api/usuarios/reset-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session?.access_token}`,
                },
                body: JSON.stringify({ userId: user.id }),
            });

            const data = await res.json();

            if (data.success) {
                alert(`✅ ${data.message}\n\nO usuário foi notificado por email.`);
            } else {
                alert(`❌ Erro: ${data.error}`);
            }
        } catch (err: any) {
            alert(`❌ Erro: ${err.message}`);
        }
    };

    const generatePassword = () => {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
        let password = '';
        for (let i = 0; i < 8; i++) {
            password += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        setFormData({ ...formData, senha: password });
    };

    if (loading || userLoading) {
        return <UsuariosSkeleton />;
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Usuários do Condomínio</h1>
                    <p className="text-gray-500">Gerencie os acessos ao sistema</p>
                </div>
                <Button onClick={() => { resetForm(); setShowModal(true); }}>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Novo Usuário
                </Button>
            </div>

            {/* Users List */}
            <Card>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="min-w-full">
                            <thead className="bg-gray-50">
                                <tr className="text-left text-xs text-gray-500 uppercase">
                                    <th className="px-4 py-3">Nome</th>
                                    <th className="px-4 py-3">Email</th>
                                    <th className="px-4 py-3">Tipo</th>
                                    <th className="px-4 py-3">Status</th>
                                    <th className="px-4 py-3">Desde</th>
                                    <th className="px-4 py-3">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {users.map((user) => (
                                    <tr key={user.id}>
                                        <td className="px-4 py-3">
                                            <p className="font-medium text-gray-900">{user.nome}</p>
                                            {user.telefone && (
                                                <p className="text-xs text-gray-500">{user.telefone}</p>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-500">{user.email}</td>
                                        <td className="px-4 py-3">
                                            <Badge variant={user.role === 'sindico' ? 'primary' : 'secondary'}>
                                                {getRoleLabel(user.role)}
                                            </Badge>
                                        </td>
                                        <td className="px-4 py-3">
                                            <Badge variant={user.ativo ? 'success' : 'danger'}>
                                                {user.ativo ? 'Ativo' : 'Inativo'}
                                            </Badge>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-500">
                                            {formatDate(user.created_at)}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex gap-2">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => openEditModal(user)}
                                                    title="Editar"
                                                >
                                                    <Edit2 className="h-4 w-4" />
                                                </Button>
                                                {user.role !== 'sindico' && (
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                                                        onClick={() => resetUserPassword(user)}
                                                        title="Resetar Senha"
                                                    >
                                                        <Key className="h-4 w-4" />
                                                    </Button>
                                                )}
                                                <Button
                                                    size="sm"
                                                    variant={user.ativo ? 'ghost' : 'primary'}
                                                    onClick={() => toggleUserStatus(user)}
                                                >
                                                    {user.ativo ? 'Desativar' : 'Ativar'}
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                    onClick={() => deleteUser(user)}
                                                    title="Excluir permanentemente"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {users.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                                            Nenhum usuário cadastrado
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            {/* Modal */}
            <Modal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                title={editingUser ? 'Editar Usuário' : 'Novo Usuário'}
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    {error && (
                        <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm">
                            {error}
                        </div>
                    )}
                    {success && (
                        <div className="p-3 bg-green-50 text-green-600 rounded-lg text-sm">
                            {success}
                        </div>
                    )}

                    <Input
                        label="Nome completo"
                        value={formData.nome}
                        onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                        required
                    />

                    <Input
                        label="Email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        disabled={!!editingUser}
                        required
                    />

                    <Input
                        label="Telefone"
                        value={formData.telefone}
                        onChange={(e) => setFormData({ ...formData, telefone: formatPhone(e.target.value) })}
                        placeholder="(00) 00000-0000"
                    />

                    <Select
                        label="Tipo de usuário"
                        value={formData.role}
                        onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                        options={[
                            { value: 'morador', label: 'Morador' },
                            { value: 'porteiro', label: 'Porteiro' },
                            { value: 'sindico', label: 'Síndico' },
                        ]}
                    />

                    {!editingUser && (
                        <div>
                            <div className="flex items-end gap-2">
                                <div className="flex-1">
                                    <Input
                                        label="Senha inicial"
                                        value={formData.senha}
                                        onChange={(e) => setFormData({ ...formData, senha: e.target.value })}
                                        required
                                        minLength={6}
                                    />
                                </div>
                                <Button type="button" variant="outline" onClick={generatePassword}>
                                    <Key className="h-4 w-4" />
                                </Button>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                                Clique no ícone para gerar uma senha automática
                            </p>
                        </div>
                    )}

                    <div className="flex gap-3 pt-4">
                        <Button type="button" variant="outline" onClick={() => setShowModal(false)} className="flex-1">
                            Cancelar
                        </Button>
                        <Button type="submit" className="flex-1">
                            {editingUser ? 'Salvar' : 'Criar Usuário'}
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
