'use client';

import { useEffect, useState, useMemo } from 'react';
import { Card, CardContent, Button, Input, Select, Badge, CardSkeleton } from '@/components/ui';
import { Modal } from '@/components/ui/modal';
import { Textarea } from '@/components/ui/textarea';
import { createClient } from '@/lib/supabase/client';
import { useUser } from '@/hooks/useUser';
import { formatDate, formatDateTime } from '@/lib/utils';
import { Plus, Bell, Eye, Edit, Trash2 } from 'lucide-react';
import { Notice } from '@/types/database';

function AvisosSkeleton() {
    return (
        <div className="space-y-6">
            <div><h1 className="text-2xl font-bold text-gray-900">Avisos</h1><p className="text-gray-500">Carregando...</p></div>
            <div className="space-y-4">
                {[1, 2, 3].map(i => <div key={i} className="bg-gray-200 rounded-xl h-28 animate-pulse"></div>)}
            </div>
        </div>
    );
}

export default function AvisosPage() {
    const { condoId, isSindico, isSuperAdmin, isMorador, profile, loading: userLoading } = useUser();
    const [notices, setNotices] = useState<Notice[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingNotice, setEditingNotice] = useState<Notice | null>(null);
    const [selectedNotice, setSelectedNotice] = useState<Notice | null>(null);
    const supabase = useMemo(() => createClient(), []);

    useEffect(() => {
        if (!userLoading && condoId) fetchNotices();
        else if (!userLoading) setLoading(false);
    }, [condoId, userLoading]);

    const fetchNotices = async () => {
        setLoading(true);
        let query = supabase
            .from('notices')
            .select('*')
            .eq('condo_id', condoId)
            .order('data_publicacao', { ascending: false });

        // Filter for residents
        if (isMorador) {
            query = query.in('publico_alvo', ['todos', 'somente_moradores']);
        }

        const { data } = await query;
        setNotices(data || []);
        setLoading(false);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Deseja realmente excluir este aviso?')) return;
        await supabase.from('notices').delete().eq('id', id);
        fetchNotices();
    };

    const markAsRead = async (noticeId: string) => {
        if (!profile?.id) return;
        await supabase.from('notice_reads').upsert({
            notice_id: noticeId,
            user_id: profile.id,
        });
    };

    const handleViewNotice = async (notice: Notice) => {
        setSelectedNotice(notice);
        if (isMorador) {
            await markAsRead(notice.id);
        }
    };

    const canEdit = isSindico || isSuperAdmin;

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Avisos</h1>
                    <p className="text-gray-500">
                        {canEdit ? 'Gerencie os comunicados do condomínio' : 'Veja os comunicados do condomínio'}
                    </p>
                </div>
                {canEdit && (
                    <Button onClick={() => { setEditingNotice(null); setShowModal(true); }}>
                        <Plus className="h-4 w-4 mr-2" />
                        Novo Aviso
                    </Button>
                )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white border-0">
                    <CardContent className="py-4 text-center">
                        <Bell className="h-8 w-8 mx-auto mb-2 opacity-80" />
                        <p className="text-2xl font-bold">{notices.length}</p>
                        <p className="text-sm text-emerald-100">Total de Avisos</p>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0">
                    <CardContent className="py-4 text-center">
                        <p className="text-2xl font-bold">{notices.filter(n => n.publico_alvo === 'todos').length}</p>
                        <p className="text-sm text-blue-100">Para Todos</p>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0">
                    <CardContent className="py-4 text-center">
                        <p className="text-2xl font-bold">{notices.filter(n => n.publico_alvo === 'somente_moradores').length}</p>
                        <p className="text-sm text-purple-100">Moradores</p>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white border-0">
                    <CardContent className="py-4 text-center">
                        <p className="text-2xl font-bold">{notices.filter(n => n.publico_alvo === 'somente_sindico_porteiro').length}</p>
                        <p className="text-sm text-orange-100">Síndico/Porteiro</p>
                    </CardContent>
                </Card>
            </div>

            {/* Notice List */}
            {loading ? (
                <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-2 border-emerald-600 border-t-transparent"></div>
                </div>
            ) : notices.length === 0 ? (
                <Card>
                    <CardContent className="py-12 text-center">
                        <Bell className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500">Nenhum aviso publicado</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-4">
                    {notices.map((notice) => (
                        <Card key={notice.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => handleViewNotice(notice)}>
                            <CardContent className="py-4">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            <h3 className="font-semibold text-gray-900">{notice.titulo}</h3>
                                            <Badge variant={
                                                notice.publico_alvo === 'todos' ? 'default' :
                                                    notice.publico_alvo === 'somente_moradores' ? 'info' : 'warning'
                                            }>
                                                {notice.publico_alvo === 'todos' ? 'Todos' :
                                                    notice.publico_alvo === 'somente_moradores' ? 'Moradores' : 'Síndico/Porteiro'}
                                            </Badge>
                                        </div>
                                        <p className="text-gray-600 text-sm line-clamp-2">{notice.mensagem}</p>
                                        <div className="flex items-center gap-4 mt-3 text-xs text-gray-400">
                                            <span>Publicado em {formatDate(notice.data_publicacao)}</span>
                                            {notice.data_expiracao && (
                                                <span>Expira em {formatDate(notice.data_expiracao)}</span>
                                            )}
                                        </div>
                                    </div>
                                    {canEdit && (
                                        <div className="flex gap-2">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); setEditingNotice(notice); setShowModal(true); }}
                                                className="p-2 hover:bg-gray-100 rounded-lg"
                                            >
                                                <Edit className="h-4 w-4 text-gray-500" />
                                            </button>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleDelete(notice.id); }}
                                                className="p-2 hover:bg-gray-100 rounded-lg"
                                            >
                                                <Trash2 className="h-4 w-4 text-red-500" />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* View Notice Modal */}
            <Modal
                isOpen={!!selectedNotice}
                onClose={() => setSelectedNotice(null)}
                title={selectedNotice?.titulo || ''}
                size="lg"
            >
                <div className="space-y-4">
                    <p className="text-gray-600 whitespace-pre-wrap">{selectedNotice?.mensagem}</p>
                    <div className="pt-4 border-t border-gray-200 text-sm text-gray-500">
                        <p>Publicado em {selectedNotice && formatDateTime(selectedNotice.data_publicacao)}</p>
                    </div>
                </div>
            </Modal>

            {/* Edit/Create Modal */}
            <NoticeModal
                isOpen={showModal}
                onClose={() => { setShowModal(false); setEditingNotice(null); }}
                onSuccess={fetchNotices}
                condoId={condoId}
                notice={editingNotice}
            />
        </div>
    );
}

function NoticeModal({ isOpen, onClose, onSuccess, condoId, notice }: {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    condoId: string | null | undefined;
    notice: Notice | null;
}) {
    const [loading, setLoading] = useState(false);
    const [titulo, setTitulo] = useState('');
    const [mensagem, setMensagem] = useState('');
    const [publicoAlvo, setPublicoAlvo] = useState('todos');
    const [dataExpiracao, setDataExpiracao] = useState('');
    const supabase = createClient();

    useEffect(() => {
        if (notice) {
            setTitulo(notice.titulo);
            setMensagem(notice.mensagem);
            setPublicoAlvo(notice.publico_alvo);
            setDataExpiracao(notice.data_expiracao?.split('T')[0] || '');
        } else {
            setTitulo('');
            setMensagem('');
            setPublicoAlvo('todos');
            setDataExpiracao('');
        }
    }, [notice]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!condoId) {
            alert('❌ Você precisa estar vinculado a um condomínio para publicar avisos.');
            return;
        }

        setLoading(true);

        try {
            const data = {
                condo_id: condoId,
                titulo,
                mensagem,
                publico_alvo: publicoAlvo,
                data_expiracao: dataExpiracao || null,
            };

            let error;
            if (notice) {
                const result = await supabase.from('notices').update(data).eq('id', notice.id);
                error = result.error;
            } else {
                const result = await supabase.from('notices').insert(data);
                error = result.error;
            }

            if (error) {
                alert(`❌ Erro ao ${notice ? 'atualizar' : 'publicar'} aviso: ${error.message}`);
                setLoading(false);
                return;
            }

            alert(`✅ Aviso ${notice ? 'atualizado' : 'publicado'} com sucesso!`);
            onSuccess();
            onClose();
        } catch (err: any) {
            alert(`❌ Erro inesperado: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={notice ? 'Editar Aviso' : 'Novo Aviso'} size="lg">
            <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                    label="Título"
                    value={titulo}
                    onChange={(e) => setTitulo(e.target.value)}
                    placeholder="Título do aviso"
                    required
                />

                <Textarea
                    label="Mensagem"
                    value={mensagem}
                    onChange={(e) => setMensagem(e.target.value)}
                    placeholder="Escreva a mensagem do aviso..."
                    required
                    className="min-h-[150px]"
                />

                <div className="grid grid-cols-2 gap-4">
                    <Select
                        label="Público Alvo"
                        value={publicoAlvo}
                        onChange={(e) => setPublicoAlvo(e.target.value)}
                        options={[
                            { value: 'todos', label: 'Todos' },
                            { value: 'somente_moradores', label: 'Somente Moradores' },
                            { value: 'somente_sindico_porteiro', label: 'Síndico e Porteiro' },
                        ]}
                        required
                    />
                    <Input
                        label="Data de Expiração (opcional)"
                        type="date"
                        value={dataExpiracao}
                        onChange={(e) => setDataExpiracao(e.target.value)}
                    />
                </div>

                <div className="flex gap-3 justify-end pt-4">
                    <Button type="button" variant="ghost" onClick={onClose}>
                        Cancelar
                    </Button>
                    <Button type="submit" loading={loading}>
                        {notice ? 'Salvar' : 'Publicar'}
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
