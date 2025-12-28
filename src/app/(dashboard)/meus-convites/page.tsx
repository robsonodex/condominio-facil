'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, Button, Badge } from '@/components/ui';
import { Modal } from '@/components/ui/modal';
import { useAuth } from '@/hooks/useAuth';
import {
    UserPlus, QrCode, Clock, CheckCircle, XCircle, AlertCircle,
    Trash2, RefreshCw, Calendar, Users, Eye
} from 'lucide-react';
import { CreateInviteForm, InviteShare } from '@/components/invites';

interface Invite {
    id: string;
    guest_name: string;
    valid_from: string;
    valid_until: string;
    visit_date?: string;
    visit_time_start?: string;
    visit_time_end?: string;
    status: string;
    used_at: string | null;
    created_at: string;
    unit: { bloco: string; numero_unidade: string } | null;
    creator: { nome: string } | null;
    validator: { nome: string } | null;
}

interface InviteWithQR extends Invite {
    qrData: string;
}

export default function MeusConvitesPage() {
    const { profile } = useAuth();
    const [invites, setInvites] = useState<Invite[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [createdInvite, setCreatedInvite] = useState<InviteWithQR | null>(null);
    const [selectedInvite, setSelectedInvite] = useState<Invite | null>(null);
    const [deleting, setDeleting] = useState<string | null>(null);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [deletingBulk, setDeletingBulk] = useState(false);

    const fetchInvites = async () => {
        try {
            const response = await fetch('/api/invites', {
                credentials: 'include',
            });
            const data = await response.json();
            if (data.data) {
                setInvites(data.data);
            }
        } catch (error) {
            console.error('Erro ao buscar convites:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchInvites();
    }, []);

    const handleInviteCreated = (invite: InviteWithQR) => {
        setShowCreateModal(false);
        setCreatedInvite(invite);
        fetchInvites();
    };

    const handleCancelInvite = async (id: string) => {
        if (!confirm('Tem certeza que deseja cancelar este convite?')) return;

        setDeleting(id);
        try {
            const response = await fetch(`/api/invites?id=${id}`, {
                method: 'DELETE',
                credentials: 'include',
            });

            if (response.ok) {
                fetchInvites();
                setSelectedIds(prev => {
                    const newSet = new Set(prev);
                    newSet.delete(id);
                    return newSet;
                });
            }
        } catch (error) {
            console.error('Erro ao cancelar convite:', error);
        } finally {
            setDeleting(null);
        }
    };

    const handleToggleSelect = (id: string) => {
        setSelectedIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(id)) {
                newSet.delete(id);
            } else {
                newSet.add(id);
            }
            return newSet;
        });
    };

    const pendingInvites = invites.filter(i => i.status === 'pending');

    const handleSelectAll = () => {
        if (selectedIds.size === invites.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(invites.map(i => i.id)));
        }
    };

    const handleBulkDelete = async () => {
        if (selectedIds.size === 0) return;
        if (!confirm(`Tem certeza que deseja cancelar ${selectedIds.size} convite(s)?`)) return;

        setDeletingBulk(true);
        try {
            const deletePromises = Array.from(selectedIds).map(id =>
                fetch(`/api/invites?id=${id}`, {
                    method: 'DELETE',
                    credentials: 'include',
                })
            );
            await Promise.all(deletePromises);
            setSelectedIds(new Set());
            fetchInvites();
        } catch (error) {
            console.error('Erro ao cancelar convites:', error);
        } finally {
            setDeletingBulk(false);
        }
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'pending':
                return <Badge className="bg-yellow-100 text-yellow-800">Pendente</Badge>;
            case 'used':
                return <Badge className="bg-green-100 text-green-800">Utilizado</Badge>;
            case 'expired':
                return <Badge className="bg-gray-100 text-gray-800">Expirado</Badge>;
            case 'cancelled':
                return <Badge className="bg-red-100 text-red-800">Cancelado</Badge>;
            default:
                return <Badge>{status}</Badge>;
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'pending':
                return <Clock className="h-5 w-5 text-yellow-500" />;
            case 'used':
                return <CheckCircle className="h-5 w-5 text-green-500" />;
            case 'expired':
                return <AlertCircle className="h-5 w-5 text-gray-500" />;
            case 'cancelled':
                return <XCircle className="h-5 w-5 text-red-500" />;
            default:
                return <QrCode className="h-5 w-5" />;
        }
    };

    const pendingCount = invites.filter(i => i.status === 'pending').length;
    const usedCount = invites.filter(i => i.status === 'used').length;

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <QrCode className="h-7 w-7 text-blue-600" />
                        Meus Convites
                    </h1>
                    <p className="text-gray-500">
                        Crie convites digitais com QR Code para seus visitantes
                    </p>
                </div>

                <Button
                    onClick={() => setShowCreateModal(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                    <UserPlus className="h-4 w-4 mr-2" />
                    Novo Convite
                </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <Users className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{invites.length}</p>
                            <p className="text-sm text-gray-500">Total</p>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-yellow-100 flex items-center justify-center">
                            <Clock className="h-5 w-5 text-yellow-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{pendingCount}</p>
                            <p className="text-sm text-gray-500">Pendentes</p>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                            <CheckCircle className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{usedCount}</p>
                            <p className="text-sm text-gray-500">Utilizados</p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="md:col-span-1 col-span-2">
                    <CardContent className="p-4">
                        <Button
                            variant="outline"
                            onClick={fetchInvites}
                            className="w-full"
                            disabled={loading}
                        >
                            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                            Atualizar
                        </Button>
                    </CardContent>
                </Card>
            </div>

            {/* Lista de Convites */}
            <Card>
                <CardContent className="p-0">
                    {loading ? (
                        <div className="p-8 text-center text-gray-500">
                            <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4" />
                            Carregando convites...
                        </div>
                    ) : invites.length === 0 ? (
                        <div className="p-8 text-center">
                            <QrCode className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-600">Nenhum convite ainda</h3>
                            <p className="text-gray-400 mb-4">
                                Crie seu primeiro convite para receber visitantes
                            </p>
                            <Button
                                onClick={() => setShowCreateModal(true)}
                                className="bg-blue-600 hover:bg-blue-700 text-white"
                            >
                                <UserPlus className="h-4 w-4 mr-2" />
                                Criar Convite
                            </Button>
                        </div>
                    ) : (
                        <div className="divide-y">
                            {/* Header com ações em lote */}
                            {pendingInvites.length > 0 && (
                                <div className="p-3 bg-gray-50 flex items-center justify-between border-b">
                                    <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-600">
                                        <input
                                            type="checkbox"
                                            checked={selectedIds.size === invites.length && invites.length > 0}
                                            onChange={handleSelectAll}
                                            className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                        />
                                        Selecionar todos ({invites.length} convites)
                                    </label>
                                    {selectedIds.size > 0 && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={handleBulkDelete}
                                            disabled={deletingBulk}
                                            className="text-red-600 border-red-200 hover:bg-red-50"
                                        >
                                            {deletingBulk ? (
                                                <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
                                            ) : (
                                                <Trash2 className="h-4 w-4 mr-1" />
                                            )}
                                            Excluir {selectedIds.size} selecionado(s)
                                        </Button>
                                    )}
                                </div>
                            )}
                            {invites.map((invite) => (
                                <div
                                    key={invite.id}
                                    className={`p-4 hover:bg-gray-50 flex items-center gap-4 ${selectedIds.has(invite.id) ? 'bg-blue-50' : ''}`}
                                >
                                    {/* Checkbox para todos os convites */}
                                    <input
                                        type="checkbox"
                                        checked={selectedIds.has(invite.id)}
                                        onChange={() => handleToggleSelect(invite.id)}
                                        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    />
                                    <div className="flex-shrink-0">
                                        {getStatusIcon(invite.status)}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-gray-900 truncate">
                                            {invite.guest_name}
                                        </p>
                                        <p className="text-sm text-gray-500 flex items-center gap-1">
                                            <Calendar className="h-3 w-3" />
                                            {formatDate(invite.valid_from)} - {formatDate(invite.valid_until)}
                                        </p>
                                        {invite.used_at && (
                                            <p className="text-xs text-green-600 mt-1">
                                                Usado em: {formatDate(invite.used_at)}
                                                {invite.validator?.nome && ` por ${invite.validator.nome}`}
                                            </p>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-2">
                                        {getStatusBadge(invite.status)}

                                        {invite.status === 'pending' && (
                                            <>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => setSelectedInvite(invite)}
                                                    className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                                    title="Ver QR Code"
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleCancelInvite(invite.id)}
                                                    disabled={deleting === invite.id}
                                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                    title="Cancelar convite"
                                                >
                                                    {deleting === invite.id ? (
                                                        <RefreshCw className="h-4 w-4 animate-spin" />
                                                    ) : (
                                                        <Trash2 className="h-4 w-4" />
                                                    )}
                                                </Button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Modal Criar Convite */}
            <Modal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                title=""
            >
                <CreateInviteForm
                    onSuccess={handleInviteCreated}
                    onCancel={() => setShowCreateModal(false)}
                />
            </Modal>

            {/* Modal QR Code - Convite Recém Criado */}
            {createdInvite && (
                <Modal
                    isOpen={!!createdInvite}
                    onClose={() => setCreatedInvite(null)}
                    title=""
                >
                    <InviteShare
                        invite={createdInvite}
                        qrData={createdInvite.qrData}
                        onClose={() => setCreatedInvite(null)}
                    />
                </Modal>
            )}

            {/* Modal QR Code - Ver Convite Existente */}
            {selectedInvite && (
                <Modal
                    isOpen={!!selectedInvite}
                    onClose={() => setSelectedInvite(null)}
                    title=""
                >
                    <InviteShare
                        invite={selectedInvite}
                        qrData={selectedInvite.id}
                        onClose={() => setSelectedInvite(null)}
                    />
                </Modal>
            )}
        </div>
    );
}
