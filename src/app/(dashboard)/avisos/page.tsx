'use client';

import { useEffect, useState, useMemo } from 'react';
import { Card, CardContent, Button, Input, Select, Badge, CardSkeleton } from '@/components/ui';
import { Modal } from '@/components/ui/modal';
import { Textarea } from '@/components/ui/textarea';
import { createClient } from '@/lib/supabase/client';
import { useUser } from '@/hooks/useUser';
import { formatDate, formatDateTime } from '@/lib/utils';
import { Plus, Bell, Eye, Edit, Trash2, Pin, Info, AlertTriangle, Megaphone, CheckCircle2, Clock } from 'lucide-react';
import { Notice } from '@/types/database';

interface NoticeWithRead extends Notice {
    notice_reads?: { user_id: string }[];
    is_read?: boolean;
    tipo_aviso?: 'informativo' | 'comunicado' | 'urgente' | 'convocacao';
    prioridade?: 'baixa' | 'media' | 'alta';
    fixado?: boolean;
}

export default function AvisosPage() {
    const { condoId, isSindico, isSuperAdmin, isMorador, profile, loading: userLoading } = useUser();
    const [notices, setNotices] = useState<NoticeWithRead[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingNotice, setEditingNotice] = useState<NoticeWithRead | null>(null);
    const [selectedNotice, setSelectedNotice] = useState<NoticeWithRead | null>(null);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const supabase = useMemo(() => createClient(), []);

    useEffect(() => {
        if (!userLoading && condoId) fetchNotices();
        else if (!userLoading) setLoading(false);
    }, [condoId, userLoading, profile?.id]);

    const fetchNotices = async () => {
        setLoading(true);
        try {
            // Se for morador, queremos saber se ele leu
            let query = supabase
                .from('notices')
                .select(`
                    *,
                    notice_reads(user_id)
                `)
                .eq('condo_id', condoId)
                .order('fixado', { ascending: false })
                .order('data_publicacao', { ascending: false });

            // Filter for residents
            if (isMorador) {
                query = query.in('publico_alvo', ['todos', 'somente_moradores']);
            }

            const { data, error } = await query;
            if (error) throw error;

            const noticesProcessed = (data || []).map((n: any) => ({
                ...n,
                is_read: n.notice_reads?.some((r: any) => r.user_id === profile?.id)
            }));

            setNotices(noticesProcessed);
            setSelectedIds(new Set());
        } catch (err) {
            console.error('Error fetching notices:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Deseja realmente excluir este aviso?')) return;
        await supabase.from('notices').delete().eq('id', id);
        fetchNotices();
    };

    const markAsRead = async (noticeId: string) => {
        if (!profile?.id) return;

        // Verifica se já leu localmente para evitar requests desnecessários
        const notice = notices.find(n => n.id === noticeId);
        if (notice?.is_read) return;

        await supabase.from('notice_reads').upsert({
            notice_id: noticeId,
            user_id: profile.id,
        });

        // Atualiza estado local
        setNotices(prev => prev.map(n => n.id === noticeId ? { ...n, is_read: true } : n));
    };

    const handleViewNotice = async (notice: NoticeWithRead) => {
        setSelectedNotice(notice);
        if (isMorador) {
            await markAsRead(notice.id);
        }
    };

    const getTypeBadge = (tipo?: string) => {
        switch (tipo) {
            case 'urgente':
                return <Badge variant="danger" className="bg-red-100 text-red-700"><AlertTriangle className="h-3 w-3 mr-1" /> Urgente</Badge>;
            case 'comunicado':
                return <Badge className="bg-blue-100 text-blue-700"><Megaphone className="h-3 w-3 mr-1" /> Comunicado</Badge>;
            case 'convocacao':
                return <Badge className="bg-purple-100 text-purple-700"><Bell className="h-3 w-3 mr-1" /> Convocação</Badge>;
            default:
                return <Badge variant="secondary" className="bg-gray-100 text-gray-700"><Info className="h-3 w-3 mr-1" /> Informativo</Badge>;
        }
    };

    const canEdit = isSindico || isSuperAdmin;

    if (loading && !notices.length) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-emerald-600 border-t-transparent"></div>
                <p className="text-gray-500 font-medium">Buscando comunicados...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-5xl mx-auto px-1 sm:px-0">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Mural de Avisos</h1>
                    <p className="text-gray-500 font-medium">
                        {canEdit ? 'Gerencie os comunicados e informativos do condomínio' : 'Fique por dentro do que acontece no seu condomínio'}
                    </p>
                </div>
                {canEdit && (
                    <Button onClick={() => { setEditingNotice(null); setShowModal(true); }} className="shadow-md h-12 px-6">
                        <Plus className="h-5 w-5 mr-2" />
                        Publicar Aviso
                    </Button>
                )}
            </div>

            {/* List */}
            {notices.length === 0 ? (
                <Card className="border-2 border-dashed border-gray-200 shadow-none py-20">
                    <CardContent className="text-center">
                        <Bell className="h-16 w-16 text-gray-200 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-gray-700">Nenhum aviso no momento</h3>
                        <p className="text-gray-500 max-w-xs mx-auto mt-2">Tudo tranquilo! Quando houver novidades, elas aparecerão aqui.</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4">
                    {notices.map((notice) => (
                        <Card
                            key={notice.id}
                            className={`group relative overflow-hidden transition-all hover:shadow-lg border-l-4 cursor-pointer
                                ${notice.fixado ? 'bg-amber-50/30 border-l-amber-500' : 'border-l-transparent'}
                                ${notice.tipo_aviso === 'urgente' ? 'border-l-red-500 bg-red-50/20' : ''}
                                ${!notice.is_read && isMorador ? 'ring-2 ring-emerald-500/20' : ''}
                            `}
                            onClick={() => handleViewNotice(notice)}
                        >
                            <CardContent className="p-5 sm:p-6">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1 space-y-3">
                                        <div className="flex flex-wrap items-center gap-2">
                                            {notice.fixado && (
                                                <Badge className="bg-amber-100 text-amber-700 border-amber-200"><Pin className="h-3 w-3 mr-1 rotate-45" /> Fixado</Badge>
                                            )}
                                            {getTypeBadge(notice.tipo_aviso)}
                                            {!notice.is_read && isMorador && (
                                                <Badge className="bg-emerald-500 text-white animate-pulse">NOVO</Badge>
                                            )}
                                            {notice.is_read && isMorador && (
                                                <span className="text-emerald-600 flex items-center text-[10px] font-bold uppercase tracking-widest"><CheckCircle2 className="h-3 w-3 mr-1" /> Lido</span>
                                            )}
                                        </div>

                                        <div>
                                            <h3 className={`text-xl font-bold text-gray-900 mb-1 ${!notice.is_read && isMorador ? 'text-emerald-900' : ''}`}>
                                                {notice.titulo}
                                            </h3>
                                            <p className="text-gray-600 leading-relaxed line-clamp-2 sm:line-clamp-none overflow-hidden max-h-24">
                                                {notice.mensagem}
                                            </p>
                                        </div>

                                        <div className="flex items-center gap-4 text-xs font-bold text-gray-400 uppercase tracking-tight pt-2">
                                            <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" /> {formatDate(notice.data_publicacao)}</span>
                                            {notice.data_expiracao && (
                                                <span className="text-amber-600">Expira em {formatDate(notice.data_expiracao)}</span>
                                            )}
                                        </div>
                                    </div>

                                    {canEdit && (
                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                className="h-9 w-9 p-0"
                                                onClick={(e) => { e.stopPropagation(); setEditingNotice(notice); setShowModal(true); }}
                                            >
                                                <Edit className="h-4 w-4 text-blue-500" />
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                className="h-9 w-9 p-0 hover:bg-red-50"
                                                onClick={(e) => { e.stopPropagation(); handleDelete(notice.id); }}
                                            >
                                                <Trash2 className="h-4 w-4 text-red-500" />
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* View Modal */}
            <Modal
                isOpen={!!selectedNotice}
                onClose={() => setSelectedNotice(null)}
                title={selectedNotice?.titulo || ''}
                size="lg"
            >
                <div className="space-y-6">
                    <div className="flex items-center gap-2">
                        {getTypeBadge(selectedNotice?.tipo_aviso)}
                        {selectedNotice?.fixado && <Badge variant="warning">Fixado</Badge>}
                    </div>

                    <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
                        <p className="text-gray-800 whitespace-pre-wrap leading-loose text-lg font-medium">
                            {selectedNotice?.mensagem}
                        </p>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-gray-100 text-xs text-gray-400 font-bold uppercase tracking-widest">
                        <p>Publicado em {selectedNotice && formatDateTime(selectedNotice.data_publicacao)}</p>
                        <p className="text-emerald-600 flex items-center gap-1">
                            <CheckCircle2 className="h-4 w-4" /> Visto pelo sistema
                        </p>
                    </div>
                </div>
            </Modal>

            {/* Form Modal */}
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
    notice: NoticeWithRead | null;
}) {
    const [loading, setLoading] = useState(false);
    const [titulo, setTitulo] = useState('');
    const [mensagem, setMensagem] = useState('');
    const [publicoAlvo, setPublicoAlvo] = useState('todos');
    const [tipoAviso, setTipoAviso] = useState<string>('informativo');
    const [prioridade, setPrioridade] = useState<string>('baixa');
    const [fixado, setFixado] = useState(false);
    const [dataExpiracao, setDataExpiracao] = useState('');
    const [enviarEmail, setEnviarEmail] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        if (notice) {
            setTitulo(notice.titulo);
            setMensagem(notice.mensagem);
            setPublicoAlvo(notice.publico_alvo);
            setTipoAviso(notice.tipo_aviso || 'informativo');
            setPrioridade(notice.prioridade || 'baixa');
            setFixado(!!notice.fixado);
            setDataExpiracao(notice.data_expiracao?.split('T')[0] || '');
        } else {
            setTitulo('');
            setMensagem('');
            setPublicoAlvo('todos');
            setTipoAviso('informativo');
            setPrioridade('baixa');
            setFixado(false);
            setDataExpiracao('');
            setEnviarEmail(true);
        }
    }, [notice]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!condoId) return;

        setLoading(true);
        try {
            const data = {
                condo_id: condoId,
                titulo,
                mensagem,
                publico_alvo: publicoAlvo,
                tipo_aviso: tipoAviso,
                prioridade,
                fixado,
                data_expiracao: dataExpiracao || null,
            };

            let error;
            if (notice) {
                const result = await supabase.from('notices').update(data).eq('id', notice.id);
                error = result.error;
            } else {
                const result = await supabase.from('notices').insert(data);
                error = result.error;

                // Enviar notificações e emails para moradores
                if (!error) {
                    // Buscar moradores do condomínio
                    let usersQuery = supabase
                        .from('users')
                        .select('id, email, nome, role')
                        .eq('condo_id', condoId)
                        .eq('ativo', true);

                    // Filtrar por público alvo
                    if (publicoAlvo === 'somente_moradores') {
                        usersQuery = usersQuery.in('role', ['morador', 'inquilino']);
                    } else if (publicoAlvo === 'somente_sindico_porteiro') {
                        usersQuery = usersQuery.in('role', ['sindico', 'porteiro']);
                    }
                    // 'todos' = todos os roles

                    const { data: users } = await usersQuery;

                    if (users && users.length > 0) {
                        // Criar notificação na tabela notifications para cada usuário
                        const notifications = users.map(user => ({
                            condo_id: condoId,
                            user_id: user.id,
                            titulo: `📢 ${titulo}`,
                            mensagem: mensagem.substring(0, 200) + (mensagem.length > 200 ? '...' : ''),
                            tipo: tipoAviso === 'urgente' ? 'aviso' : 'sistema',
                            link: '/avisos'
                        }));

                        await supabase.from('notifications').insert(notifications);

                        // Enviar emails se marcado
                        if (enviarEmail) {
                            const appUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;

                            // Buscar nome do condomínio
                            const { data: condoData } = await supabase
                                .from('condos')
                                .select('nome')
                                .eq('id', condoId)
                                .single();

                            for (const user of users) {
                                if (user.email) {
                                    try {
                                        await fetch(`/api/email`, {
                                            method: 'POST',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({
                                                tipo: 'notice_created',
                                                destinatario: user.email,
                                                dados: {
                                                    nome: user.nome || 'Morador',
                                                    titulo,
                                                    mensagem: mensagem.substring(0, 300) + (mensagem.length > 300 ? '...' : ''),
                                                    condoNome: condoData?.nome || 'Condomínio',
                                                    loginUrl: `${appUrl}/login`,
                                                },
                                                condoId,
                                                internalCall: true
                                            }),
                                        });
                                    } catch (emailErr) {
                                        console.error('Erro ao enviar email:', emailErr);
                                    }
                                }
                            }
                        }
                    }
                }
            }

            if (error) throw error;
            onSuccess();
            onClose();
        } catch (err: any) {
            alert(`Erro: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={notice ? 'Editar Aviso' : 'Novo Aviso'} size="lg">
            <form onSubmit={handleSubmit} className="space-y-4">
                <Input label="Título" value={titulo} onChange={(e) => setTitulo(e.target.value)} required />
                <Textarea label="Mensagem" value={mensagem} onChange={(e) => setMensagem(e.target.value)} required className="min-h-[150px]" />

                <div className="grid grid-cols-2 gap-4">
                    <Select
                        label="Tipo de Aviso"
                        value={tipoAviso}
                        onChange={(e) => setTipoAviso(e.target.value)}
                        options={[
                            { value: 'informativo', label: 'Informativo' },
                            { value: 'comunicado', label: 'Comunicado Oficial' },
                            { value: 'urgente', label: 'Urgente' },
                            { value: 'convocacao', label: 'Convocação' },
                        ]}
                    />
                    <Select
                        label="Público Alvo"
                        value={publicoAlvo}
                        onChange={(e) => setPublicoAlvo(e.target.value)}
                        options={[
                            { value: 'todos', label: 'Todos' },
                            { value: 'somente_moradores', label: 'Somente Moradores' },
                            { value: 'somente_sindico_porteiro', label: 'Síndico e Porteiro' },
                        ]}
                    />
                </div>

                <div className="flex items-center gap-6 p-4 bg-gray-50 rounded-xl border border-gray-100">
                    <div className="flex items-center gap-2">
                        <input type="checkbox" id="fixado" checked={fixado} onChange={(e) => setFixado(e.target.checked)} className="rounded text-emerald-600 h-5 w-5" />
                        <label htmlFor="fixado" className="text-sm font-bold text-gray-700">Fixar no Topo</label>
                    </div>
                    {!notice && (
                        <div className="flex items-center gap-2">
                            <input type="checkbox" id="email" checked={enviarEmail} onChange={(e) => setEnviarEmail(e.target.checked)} className="rounded text-emerald-600 h-5 w-5" />
                            <label htmlFor="email" className="text-sm font-bold text-gray-700">Enviar E-mail</label>
                        </div>
                    )}
                </div>

                <div className="flex gap-3 justify-end pt-4">
                    <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
                    <Button type="submit" loading={loading}>{notice ? 'Salvar' : 'Publicar'}</Button>
                </div>
            </form>
        </Modal>
    );
}
