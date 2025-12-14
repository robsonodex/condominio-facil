'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, Button, Input, Select, Badge, Table } from '@/components/ui';
import { Modal } from '@/components/ui/modal';
import { useUser, useCondo } from '@/hooks/useUser';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { formatDate } from '@/lib/utils';
import {
    Bell, Send, MessageSquare, Mail, Smartphone,
    Users, Building2, Home, Shield, Filter, History
} from 'lucide-react';

interface NotificationSent {
    id: string;
    tipo: string;
    titulo: string;
    mensagem: string;
    destinatario_tipo: string;
    destinatario_valor: string;
    status: string;
    created_at: string;
    sender?: { nome: string };
}

const TIPO_OPTIONS = [
    { value: 'push', label: '📱 Push Notification', icon: <Smartphone className="h-4 w-4" /> },
    { value: 'whatsapp', label: '💬 WhatsApp', icon: <MessageSquare className="h-4 w-4" /> },
    { value: 'email', label: '📧 Email', icon: <Mail className="h-4 w-4" /> },
    { value: 'aviso', label: '📢 Aviso Interno', icon: <Bell className="h-4 w-4" /> },
];

const DESTINATARIO_OPTIONS = [
    { value: 'todos', label: 'Todos os Moradores' },
    { value: 'bloco', label: 'Bloco Específico' },
    { value: 'unidade', label: 'Unidade Específica' },
    { value: 'porteiros', label: 'Porteiros' },
];

export default function NotificacoesPage() {
    const { condoId, isSindico, isSuperAdmin, profile } = useUser();
    const { condo } = useCondo();
    const { session } = useAuth();
    const [notifications, setNotifications] = useState<NotificationSent[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [sending, setSending] = useState(false);
    const supabase = createClient();

    // Form state
    const [tipo, setTipo] = useState('aviso');
    const [titulo, setTitulo] = useState('');
    const [mensagem, setMensagem] = useState('');
    const [destinatarioTipo, setDestinatarioTipo] = useState('todos');
    const [destinatarioValor, setDestinatarioValor] = useState('');
    const [blocos, setBlocos] = useState<string[]>([]);

    useEffect(() => {
        if (condoId) {
            fetchNotifications();
            fetchBlocos();
        }
    }, [condoId]);

    const fetchNotifications = async () => {
        try {
            const { data } = await supabase
                .from('notifications_sent')
                .select('*, sender:users!sender_id(nome)')
                .eq('condo_id', condoId)
                .order('created_at', { ascending: false })
                .limit(50);

            setNotifications(data || []);
        } catch (error) {
            console.error('Error fetching notifications:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchBlocos = async () => {
        const { data } = await supabase
            .from('units')
            .select('bloco')
            .eq('condo_id', condoId);

        const uniqueBlocos = [...new Set(data?.map(u => u.bloco).filter(Boolean))];
        setBlocos(uniqueBlocos as string[]);
    };

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!titulo || !mensagem) return;

        setSending(true);

        try {
            // Salvar notificação no histórico
            const { data: notification, error } = await supabase
                .from('notifications_sent')
                .insert({
                    condo_id: condoId,
                    sender_id: profile?.id,
                    tipo,
                    titulo,
                    mensagem,
                    destinatario_tipo: destinatarioTipo,
                    destinatario_valor: destinatarioValor || null,
                    status: 'enviado'
                })
                .select()
                .single();

            if (error) throw error;

            // Se for aviso interno, criar na tabela de avisos
            if (tipo === 'aviso') {
                await supabase.from('notices').insert({
                    condo_id: condoId,
                    titulo,
                    descricao: mensagem,
                    prioridade: 'media',
                    created_by: profile?.id
                });
            }

            // TODO: Integrar envio real de push, WhatsApp e email

            alert('Notificação enviada com sucesso!');
            setShowModal(false);
            resetForm();
            fetchNotifications();

        } catch (error: any) {
            console.error('Error sending notification:', error);
            alert('Erro ao enviar: ' + error.message);
        } finally {
            setSending(false);
        }
    };

    const resetForm = () => {
        setTipo('aviso');
        setTitulo('');
        setMensagem('');
        setDestinatarioTipo('todos');
        setDestinatarioValor('');
    };

    const getTipoBadge = (t: string) => {
        switch (t) {
            case 'push': return <Badge className="bg-purple-100 text-purple-700">📱 Push</Badge>;
            case 'whatsapp': return <Badge className="bg-green-100 text-green-700">💬 WhatsApp</Badge>;
            case 'email': return <Badge className="bg-blue-100 text-blue-700">📧 Email</Badge>;
            case 'aviso': return <Badge className="bg-amber-100 text-amber-700">📢 Aviso</Badge>;
            default: return <Badge>{t}</Badge>;
        }
    };

    const getDestinatarioLabel = (tipo: string, valor: string) => {
        switch (tipo) {
            case 'todos': return 'Todos os moradores';
            case 'bloco': return `Bloco ${valor}`;
            case 'unidade': return `Unidade ${valor}`;
            case 'porteiros': return 'Porteiros';
            default: return tipo;
        }
    };

    if (!isSindico && !isSuperAdmin) {
        return (
            <div className="text-center py-12">
                <p className="text-gray-500">Acesso restrito a síndicos.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Central de Notificações</h1>
                    <p className="text-gray-500">Envie comunicados por múltiplos canais</p>
                </div>
                <Button onClick={() => setShowModal(true)}>
                    <Send className="h-4 w-4 mr-2" />
                    Nova Notificação
                </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0">
                    <CardContent className="py-4 text-center">
                        <Smartphone className="h-8 w-8 mx-auto mb-2 opacity-80" />
                        <p className="text-2xl font-bold">{notifications.filter(n => n.tipo === 'push').length}</p>
                        <p className="text-sm text-purple-100">Push</p>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-0">
                    <CardContent className="py-4 text-center">
                        <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-80" />
                        <p className="text-2xl font-bold">{notifications.filter(n => n.tipo === 'whatsapp').length}</p>
                        <p className="text-sm text-green-100">WhatsApp</p>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0">
                    <CardContent className="py-4 text-center">
                        <Mail className="h-8 w-8 mx-auto mb-2 opacity-80" />
                        <p className="text-2xl font-bold">{notifications.filter(n => n.tipo === 'email').length}</p>
                        <p className="text-sm text-blue-100">Email</p>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-amber-500 to-amber-600 text-white border-0">
                    <CardContent className="py-4 text-center">
                        <Bell className="h-8 w-8 mx-auto mb-2 opacity-80" />
                        <p className="text-2xl font-bold">{notifications.filter(n => n.tipo === 'aviso').length}</p>
                        <p className="text-sm text-amber-100">Avisos</p>
                    </CardContent>
                </Card>
            </div>

            {/* History */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <History className="h-5 w-5" />
                        Histórico de Envios
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="text-center py-8 text-gray-500">Carregando...</div>
                    ) : notifications.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            <Bell className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                            Nenhuma notificação enviada ainda
                        </div>
                    ) : (
                        <Table
                            data={notifications}
                            columns={[
                                { key: 'tipo', header: 'Tipo', render: (n) => getTipoBadge(n.tipo) },
                                {
                                    key: 'titulo', header: 'Título', render: (n) => (
                                        <div className="max-w-xs">
                                            <p className="font-medium truncate">{n.titulo}</p>
                                            <p className="text-xs text-gray-500 truncate">{n.mensagem}</p>
                                        </div>
                                    )
                                },
                                { key: 'destinatario_tipo', header: 'Destinatário', render: (n) => getDestinatarioLabel(n.destinatario_tipo, n.destinatario_valor) },
                                { key: 'sender', header: 'Enviado por', render: (n) => n.sender?.nome || '-' },
                                { key: 'created_at', header: 'Data', render: (n) => formatDate(n.created_at) },
                                {
                                    key: 'status', header: 'Status', render: (n) => (
                                        <Badge variant={n.status === 'enviado' ? 'success' : 'destructive'}>
                                            {n.status}
                                        </Badge>
                                    )
                                },
                            ]}
                        />
                    )}
                </CardContent>
            </Card>

            {/* Send Modal */}
            <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Nova Notificação">
                <form onSubmit={handleSend} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Canal</label>
                        <div className="grid grid-cols-2 gap-2">
                            {TIPO_OPTIONS.map(opt => (
                                <button
                                    key={opt.value}
                                    type="button"
                                    onClick={() => setTipo(opt.value)}
                                    className={`p-3 rounded-lg border-2 flex items-center gap-2 transition-colors ${tipo === opt.value
                                        ? 'border-emerald-500 bg-emerald-50'
                                        : 'border-gray-200 hover:border-gray-300'
                                        }`}
                                >
                                    {opt.icon}
                                    <span className="text-sm">{opt.label.split(' ')[1]}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <Select
                        label="Destinatário"
                        value={destinatarioTipo}
                        onChange={(e) => setDestinatarioTipo(e.target.value)}
                        options={DESTINATARIO_OPTIONS}
                    />

                    {destinatarioTipo === 'bloco' && (
                        <Select
                            label="Selecione o Bloco"
                            value={destinatarioValor}
                            onChange={(e) => setDestinatarioValor(e.target.value)}
                            options={[{ value: '', label: 'Selecione...' }, ...blocos.map(b => ({ value: b, label: `Bloco ${b}` }))]}
                        />
                    )}

                    {destinatarioTipo === 'unidade' && (
                        <Input
                            label="Número da Unidade"
                            value={destinatarioValor}
                            onChange={(e) => setDestinatarioValor(e.target.value)}
                            placeholder="Ex: 101, A-201"
                        />
                    )}

                    <Input
                        label="Título"
                        value={titulo}
                        onChange={(e) => setTitulo(e.target.value)}
                        placeholder="Assunto da notificação"
                        required
                    />

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Mensagem</label>
                        <textarea
                            value={mensagem}
                            onChange={(e) => setMensagem(e.target.value)}
                            rows={4}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                            placeholder="Digite sua mensagem..."
                            required
                        />
                    </div>

                    <div className="flex gap-3 pt-4">
                        <Button type="button" variant="outline" onClick={() => setShowModal(false)} className="flex-1">
                            Cancelar
                        </Button>
                        <Button type="submit" className="flex-1" loading={sending}>
                            <Send className="h-4 w-4 mr-2" />
                            Enviar
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
