'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, Button, Input, Table, Badge } from '@/components/ui';
import { Modal } from '@/components/ui/modal';
import { useUser } from '@/hooks/useUser';
import { Plus, Edit, Trash2, MapPin, Building2 } from 'lucide-react';

interface Destination {
    id: string;
    nome: string;
    descricao: string | null;
    ativo: boolean;
}

export default function DestinosPage() {
    const { isSindico, isSuperAdmin, loading: userLoading } = useUser();
    const [destinations, setDestinations] = useState<Destination[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [nome, setNome] = useState('');
    const [descricao, setDescricao] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (!userLoading) fetchDestinations();
    }, [userLoading]);

    const fetchDestinations = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/destinations', { credentials: 'include' });
            const data = await res.json();
            setDestinations(data.destinations || []);
        } catch (error) {
            console.error('Error fetching destinations:', error);
        }
        setLoading(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!nome.trim()) return;

        setSaving(true);
        try {
            const method = editingId ? 'PATCH' : 'POST';
            const body = editingId
                ? { id: editingId, nome, descricao }
                : { nome, descricao };

            const res = await fetch('/api/destinations', {
                method,
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(body),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error);
            }

            fetchDestinations();
            closeModal();
        } catch (error: any) {
            alert(`Erro: ${error.message}`);
        }
        setSaving(false);
    };

    const handleDelete = async (id: string, nome: string) => {
        if (!confirm(`Excluir destino "${nome}"?`)) return;

        try {
            const res = await fetch(`/api/destinations?id=${id}`, {
                method: 'DELETE',
                credentials: 'include',
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error);
            }

            fetchDestinations();
        } catch (error: any) {
            alert(`Erro: ${error.message}`);
        }
    };

    const openEditModal = (dest: Destination) => {
        setEditingId(dest.id);
        setNome(dest.nome);
        setDescricao(dest.descricao || '');
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingId(null);
        setNome('');
        setDescricao('');
    };

    if (!isSindico && !isSuperAdmin) {
        return (
            <div className="text-center py-12">
                <p className="text-gray-500">Você não tem permissão para acessar esta página.</p>
            </div>
        );
    }

    const columns = [
        {
            key: 'nome',
            header: 'Destino',
            render: (d: Destination) => (
                <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-emerald-500" />
                    <span className="font-medium">{d.nome}</span>
                </div>
            )
        },
        {
            key: 'descricao',
            header: 'Descrição',
            render: (d: Destination) => d.descricao || <span className="text-gray-400">-</span>
        },
        {
            key: 'status',
            header: 'Status',
            render: (d: Destination) => (
                <Badge variant={d.ativo ? 'success' : 'default'}>
                    {d.ativo ? 'Ativo' : 'Inativo'}
                </Badge>
            )
        },
        {
            key: 'actions',
            header: '',
            className: 'text-right',
            render: (d: Destination) => (
                <div className="flex gap-2 justify-end">
                    <Button size="sm" variant="ghost" onClick={() => openEditModal(d)}>
                        <Edit className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => handleDelete(d.id, d.nome)}>
                        <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                </div>
            )
        },
    ];

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <MapPin className="h-6 w-6 text-emerald-500" />
                        Destinos da Portaria
                    </h1>
                    <p className="text-gray-500">Gerencie os destinos personalizados para registro de visitantes</p>
                </div>
                <Button onClick={() => setShowModal(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Novo Destino
                </Button>
            </div>

            <Card>
                <CardContent className="p-0">
                    <Table
                        data={destinations}
                        columns={columns}
                        loading={loading}
                        emptyMessage="Nenhum destino cadastrado. Clique em 'Novo Destino' para criar."
                    />
                </CardContent>
            </Card>

            <Modal isOpen={showModal} onClose={closeModal} title={editingId ? 'Editar Destino' : 'Novo Destino'}>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <Input
                        label="Nome do Destino"
                        value={nome}
                        onChange={(e) => setNome(e.target.value)}
                        placeholder="Ex: Salão de Festas, Piscina, Academia..."
                        required
                    />
                    <Input
                        label="Descrição (opcional)"
                        value={descricao}
                        onChange={(e) => setDescricao(e.target.value)}
                        placeholder="Descrição adicional"
                    />
                    <div className="flex gap-3 justify-end pt-4">
                        <Button type="button" variant="ghost" onClick={closeModal}>
                            Cancelar
                        </Button>
                        <Button type="submit" loading={saving}>
                            {editingId ? 'Salvar' : 'Criar'}
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
