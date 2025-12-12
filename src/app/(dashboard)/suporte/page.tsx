'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, Button, Badge, Input } from '@/components/ui';
import { useUser } from '@/hooks/useUser';
import { createClient } from '@/lib/supabase/client';
import { formatDate } from '@/lib/utils';
import { Plus, Search, Filter, Clock, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import Link from 'next/link';

interface Ticket {
    id: string;
    subject: string;
    category: string;
    priority: string;
    status: string;
    sla_deadline: string;
    sla_breached: boolean;
    created_at: string;
    requester: { nome: string };
    messages: any[];
}

export default function SuportePage() {
    const { profile, isSuperAdmin, condoId } = useUser();
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        status: '',
        priority: '',
        category: '',
        search: ''
    });

    const supabase = createClient();

    useEffect(() => {
        if (profile) {
            fetchTickets();
        }
    }, [profile, filters]);

    const fetchTickets = async () => {
        setLoading(true);

        const params = new URLSearchParams();
        if (filters.status) params.append('status', filters.status);
        if (filters.priority) params.append('priority', filters.priority);
        if (filters.category) params.append('category', filters.category);
        if (filters.search) params.append('search', filters.search);

        const res = await fetch(`/api/support/tickets?${params.toString()}`);
        const data = await res.json();

        setTickets(data.tickets || []);
        setLoading(false);
    };

    const getStatusBadge = (status: string) => {
        const variants: Record<string, 'success' | 'warning' | 'danger' | 'secondary'> = {
            open: 'secondary',
            in_progress: 'warning',
            pending: 'warning',
            resolved: 'success',
            closed: 'secondary'
        };
        const labels: Record<string, string> = {
            open: 'Aberto',
            in_progress: 'Em Andamento',
            pending: 'Pendente',
            resolved: 'Resolvido',
            closed: 'Fechado'
        };
        return <Badge variant={variants[status] || 'secondary'}>{labels[status] || status}</Badge>;
    };

    const getPriorityBadge = (priority: string) => {
        const variants: Record<string, 'success' | 'warning' | 'danger' | 'secondary'> = {
            low: 'secondary',
            normal: 'success',
            high: 'warning',
            priority: 'danger'
        };
        const labels: Record<string, string> = {
            low: '🔵 Baixa',
            normal: '🟢 Normal',
            high: '🟡 Alta',
            priority: '🔴 Prioritário'
        };
        return <Badge variant={variants[priority] || 'secondary'}>{labels[priority] || priority}</Badge>;
    };

    const getSLAStatus = (deadline: string, breached: boolean) => {
        if (breached) {
            return <span className="text-red-600 font-medium flex items-center gap-1"><AlertCircle className="h-4 w-4" /> SLA Estourado</span>;
        }

        const now = new Date();
        const sla = new Date(deadline);
        const hoursLeft = Math.floor((sla.getTime() - now.getTime()) / (1000 * 60 * 60));

        if (hoursLeft < 0) {
            return <span className="text-red-600 font-medium flex items-center gap-1"><AlertCircle className="h-4 w-4" /> Vencido</span>;
        } else if (hoursLeft < 4) {
            return <span className="text-orange-600 font-medium flex items-center gap-1"><Clock className="h-4 w-4" /> {hoursLeft}h restantes</span>;
        } else {
            return <span className="text-green-600 font-medium flex items-center gap-1"><CheckCircle className="h-4 w-4" /> {hoursLeft}h restantes</span>;
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Suporte</h1>
                    <p className="text-gray-500">Gerencie seus tickets de suporte</p>
                </div>
                <Link href="/suporte/novo">
                    <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Novo Ticket
                    </Button>
                </Link>
            </div>

            {/* Filters */}
            <Card>
                <CardContent className="pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <Input
                            placeholder="Buscar..."
                            value={filters.search}
                            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                        />
                        <select
                            value={filters.status}
                            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                        >
                            <option value="">Todos os status</option>
                            <option value="open">Aberto</option>
                            <option value="in_progress">Em Andamento</option>
                            <option value="pending">Pendente</option>
                            <option value="resolved">Resolvido</option>
                            <option value="closed">Fechado</option>
                        </select>
                        <select
                            value={filters.priority}
                            onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                        >
                            <option value="">Todas as prioridades</option>
                            <option value="low">Baixa</option>
                            <option value="normal">Normal</option>
                            <option value="high">Alta</option>
                            <option value="priority">Prioritário</option>
                        </select>
                        <select
                            value={filters.category}
                            onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                        >
                            <option value="">Todas as categorias</option>
                            <option value="tecnico">Técnico</option>
                            <option value="financeiro">Financeiro</option>
                            <option value="geral">Geral</option>
                            <option value="outro">Outro</option>
                        </select>
                    </div>
                </CardContent>
            </Card>

            {/* Tickets List */}
            <Card>
                <CardHeader>
                    <CardTitle>Meus Tickets</CardTitle>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="text-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-2 border-emerald-600 border-t-transparent mx-auto"></div>
                        </div>
                    ) : tickets.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            <p>Nenhum ticket encontrado</p>
                            <Link href="/suporte/novo">
                                <Button className="mt-4">Criar Primeiro Ticket</Button>
                            </Link>
                        </div>
                    ) : (
                        <div className="divide-y">
                            {tickets.map((ticket) => (
                                <Link
                                    key={ticket.id}
                                    href={`/suporte/${ticket.id}`}
                                    className="block py-4 hover:bg-gray-50 transition-colors rounded-lg px-3"
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <h3 className="font-semibold text-gray-900">{ticket.subject}</h3>
                                                {getStatusBadge(ticket.status)}
                                                {getPriorityBadge(ticket.priority)}
                                            </div>
                                            <p className="text-sm text-gray-500 mb-2">
                                                Criado em {formatDate(ticket.created_at)} • {ticket.requester.nome}
                                            </p>
                                            <div className="flex items-center gap-4 text-sm">
                                                <span className="text-gray-500">Categoria: {ticket.category}</span>
                                                <span className="text-gray-500">• {ticket.messages[0]?.count || 0} mensagens</span>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            {getSLAStatus(ticket.sla_deadline, ticket.sla_breached)}
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
