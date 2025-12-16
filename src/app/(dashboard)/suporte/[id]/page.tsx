'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, Button, Badge, Textarea } from '@/components/ui';
import { useUser } from '@/hooks/useUser';
import { useAuth } from '@/hooks/useAuth';
import { formatDate } from '@/lib/utils';
import { ArrowLeft, Send, Clock, User, Tag, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

interface Ticket {
    id: string;
    subject: string;
    description: string;
    category: string;
    priority: string;
    status: string;
    sla_deadline: string;
    sla_breached: boolean;
    created_at: string;
    updated_at: string;
    closed_at: string | null;
    requester: { id: string; nome: string; email: string };
    assignee: { nome: string } | null;
    unit: { numero_unidade: string; bloco: string } | null;
    condo: { nome: string };
    messages: Array<{
        id: string;
        message: string;
        created_at: string;
        user: { id: string; nome: string; role: string };
    }>;
}

export default function TicketDetailsPage() {
    const params = useParams();
    const ticketId = params?.id as string;
    const { profile, isSuperAdmin } = useUser();
    const { session } = useAuth();

    const [ticket, setTicket] = useState<Ticket | null>(null);
    const [loading, setLoading] = useState(true);
    const [newMessage, setNewMessage] = useState('');
    const [sending, setSending] = useState(false);

    useEffect(() => {
        if (ticketId) {
            fetchTicket();
        }
    }, [ticketId]);

    const fetchTicket = async () => {
        const res = await fetch(`/api/support/tickets/${ticketId}`, {
            headers: { 'Authorization': `Bearer ${session?.access_token}` },
            credentials: 'include'
        });
        const data = await res.json();

        if (res.ok) {
            setTicket(data.ticket);
        }
        setLoading(false);
    };

    const sendMessage = async () => {
        if (!newMessage.trim()) return;

        setSending(true);
        try {
            const res = await fetch(`/api/support/tickets/${ticketId}/messages`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session?.access_token}`,
                },
                credentials: 'include',
                body: JSON.stringify({ message: newMessage })
            });

            if (res.ok) {
                setNewMessage('');
                fetchTicket(); // Recarregar ticket com nova mensagem
            } else {
                const data = await res.json();
                alert(`Erro: ${data.error}`);
            }
        } finally {
            setSending(false);
        }
    };

    const updateStatus = async (newStatus: string) => {
        const res = await fetch(`/api/support/tickets/${ticketId}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session?.access_token}`,
            },
            credentials: 'include',
            body: JSON.stringify({ status: newStatus })
        });

        if (res.ok) {
            fetchTicket();
        }
    };

    const closeTicket = async () => {
        if (!confirm('Tem certeza que deseja fechar este ticket?')) return;

        const res = await fetch(`/api/support/tickets/${ticketId}/close`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session?.access_token}`,
            },
            credentials: 'include',
            body: JSON.stringify({})
        });

        if (res.ok) {
            fetchTicket();
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-emerald-600 border-t-transparent"></div>
            </div>
        );
    }

    if (!ticket) {
        return <div className="text-center py-8 text-gray-500">Ticket não encontrado</div>;
    }

    const getStatusBadge = (status: string) => {
        const variants: Record<string, string> = {
            open: 'bg-gray-100 text-gray-800',
            in_progress: 'bg-yellow-100 text-yellow-800',
            pending: 'bg-orange-100 text-orange-800',
            resolved: 'bg-green-100 text-green-800',
            closed: 'bg-gray-200 text-gray-600'
        };
        const labels: Record<string, string> = {
            open: 'Aberto',
            in_progress: 'Em Andamento',
            pending: 'Pendente',
            resolved: 'Resolvido',
            closed: 'Fechado'
        };
        return <span className={`px-2 py-1 rounded-full text-xs font-medium ${variants[status]}`}>{labels[status]}</span>;
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/suporte">
                        <Button variant="ghost" size="sm">
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Voltar
                        </Button>
                    </Link>
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <h1 className="text-2xl font-bold text-gray-900">{ticket.subject}</h1>
                            {getStatusBadge(ticket.status)}
                        </div>
                        <p className="text-gray-500 text-sm">
                            Ticket #{ticket.id.substring(0, 8).toUpperCase()} • Criado em {formatDate(ticket.created_at)}
                        </p>
                    </div>
                </div>

                {(isSuperAdmin || profile?.role === 'sindico') && ticket.status !== 'closed' && (
                    <Button variant="danger" onClick={closeTicket}>
                        <XCircle className="h-4 w-4 mr-2" />
                        Fechar Ticket
                    </Button>
                )}
            </div>

            <div className="grid grid-cols-3 gap-6">
                {/* Main Content */}
                <div className="col-span-2 space-y-6">
                    {/* Descrição */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Descrição</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-gray-700 whitespace-pre-wrap">{ticket.description}</p>
                        </CardContent>
                    </Card>

                    {/* Mensagens */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Mensagens</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {ticket.messages.map((msg) => (
                                <div key={msg.id} className="p-4 bg-gray-50 rounded-lg">
                                    <div className="flex items-center gap-2 mb-2">
                                        <User className="h-4 w-4 text-gray-500" />
                                        <span className="font-medium text-gray-900">{msg.user.nome}</span>
                                        <span className="text-xs text-gray-500">
                                            {msg.user.role === 'superadmin' ? '(Admin)' : ''}
                                        </span>
                                        <span className="text-xs text-gray-400">
                                            • {formatDate(msg.created_at)}
                                        </span>
                                    </div>
                                    <p className="text-gray-700 whitespace-pre-wrap">{msg.message}</p>
                                </div>
                            ))}

                            {ticket.status !== 'closed' && (
                                <div className="space-y-3">
                                    <Textarea
                                        placeholder="Digite sua mensagem..."
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                        rows={3}
                                    />
                                    <div className="flex justify-end">
                                        <Button onClick={sendMessage} loading={sending}>
                                            <Send className="h-4 w-4 mr-2" />
                                            Enviar Mensagem
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Sidebar */}
                <div className="space-y-4">
                    {/* SLA Status */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm">SLA</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {ticket.sla_breached ? (
                                <div className="flex items-center gap-2 text-red-600">
                                    <AlertCircle className="h-5 w-5" />
                                    <span className="font-medium">SLA Estourado</span>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2 text-green-600">
                                    <Clock className="h-5 w-5" />
                                    <span className="font-medium">No prazo</span>
                                </div>
                            )}
                            <p className="text-xs text-gray-500 mt-2">
                                Prazo: {new Date(ticket.sla_deadline).toLocaleString('pt-BR')}
                            </p>
                        </CardContent>
                    </Card>

                    {/* Detalhes */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm">Detalhes</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3 text-sm">
                            <div>
                                <span className="text-gray-500">Solicitante:</span>
                                <p className="font-medium">{ticket.requester.nome}</p>
                            </div>
                            <div>
                                <span className="text-gray-500">Categoria:</span>
                                <p className="font-medium capitalize">{ticket.category}</p>
                            </div>
                            <div>
                                <span className="text-gray-500">Prioridade:</span>
                                <p className="font-medium capitalize">{ticket.priority}</p>
                            </div>
                            {ticket.unit && (
                                <div>
                                    <span className="text-gray-500">Unidade:</span>
                                    <p className="font-medium">
                                        {ticket.unit.bloco} {ticket.unit.numero_unidade}
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Ações Admin */}
                    {(isSuperAdmin || profile?.role === 'sindico') && ticket.status !== 'closed' && (
                        <Card>
                            <CardHeader>
                                <CardTitle className=" text-sm">Ações</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                {ticket.status === 'open' && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="w-full"
                                        onClick={() => updateStatus('in_progress')}
                                    >
                                        Iniciar Atendimento
                                    </Button>
                                )}
                                {ticket.status === 'in_progress' && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="w-full"
                                        onClick={() => updateStatus('resolved')}
                                    >
                                        Marcar como Resolvido
                                    </Button>
                                )}
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
}
