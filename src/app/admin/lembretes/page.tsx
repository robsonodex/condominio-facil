'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, Button, Badge, Table } from '@/components/ui';
import { Bell, Send, AlertTriangle, Clock, CheckCircle, RefreshCw } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';

interface SubscriptionReminder {
    id: string;
    status: string;
    data_renovacao: string;
    valor_mensal_cobrado: number;
    dias_para_vencimento: number;
    status_lembrete: 'vencido' | 'urgente' | 'proximo' | 'normal';
    condo: { id: string; nome: string };
    plan: { nome_plano: string };
    sindico: { id: string; nome: string; email: string } | null;
}

export default function AdminLembretesPage() {
    const [subscriptions, setSubscriptions] = useState<SubscriptionReminder[]>([]);
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState<string | null>(null);
    const [sendingAll, setSendingAll] = useState(false);
    const [filter, setFilter] = useState<'expiring' | 'expired' | 'all'>('expiring');
    const [stats, setStats] = useState({ vencidos: 0, urgentes: 0, proximos: 0, normais: 0 });

    const fetchSubscriptions = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/reminders/subscription?filter=${filter}`, {
                credentials: 'include'
            });
            const data = await res.json();
            setSubscriptions(data.subscriptions || []);
            setStats(data.stats || { vencidos: 0, urgentes: 0, proximos: 0, normais: 0 });
        } catch (error) {
            console.error('Error fetching subscriptions:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSubscriptions();
    }, [filter]);

    const handleSendReminder = async (subscriptionId: string) => {
        setSending(subscriptionId);
        try {
            const res = await fetch('/api/reminders/subscription', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ subscription_id: subscriptionId })
            });
            const data = await res.json();
            if (res.ok) {
                alert(`✅ ${data.message}`);
            } else {
                alert(`❌ ${data.error}`);
            }
        } catch (error) {
            alert('❌ Erro ao enviar lembrete');
        } finally {
            setSending(null);
        }
    };

    const handleSendAll = async () => {
        if (!confirm(`Enviar lembretes para ${subscriptions.length} assinatura(s)?`)) return;

        setSendingAll(true);
        try {
            const res = await fetch('/api/reminders/subscription', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ send_all: true })
            });
            const data = await res.json();
            if (res.ok) {
                alert(`✅ ${data.message}\n\nDetalhes:\n${data.resultados?.map((r: any) => `${r.condo}: ${r.status}`).join('\n')}`);
            } else {
                alert(`❌ ${data.error}`);
            }
        } catch (error) {
            alert('❌ Erro ao enviar lembretes');
        } finally {
            setSendingAll(false);
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'vencido':
                return <Badge variant="danger">Vencido</Badge>;
            case 'urgente':
                return <Badge variant="warning">Urgente (1d)</Badge>;
            case 'proximo':
                return <Badge variant="warning">Próximo (3d)</Badge>;
            default:
                return <Badge variant="default">Normal</Badge>;
        }
    };

    const columns = [
        {
            key: 'condo',
            header: 'Condomínio',
            render: (s: SubscriptionReminder) => (
                <div>
                    <p className="font-medium text-gray-900">{s.condo?.nome}</p>
                    <p className="text-sm text-gray-500">{s.plan?.nome_plano}</p>
                </div>
            )
        },
        {
            key: 'sindico',
            header: 'Síndico',
            render: (s: SubscriptionReminder) => s.sindico ? (
                <div>
                    <p className="font-medium text-gray-900">{s.sindico.nome}</p>
                    <p className="text-sm text-gray-500">{s.sindico.email}</p>
                </div>
            ) : <span className="text-red-500">Sem síndico</span>
        },
        {
            key: 'valor',
            header: 'Valor',
            render: (s: SubscriptionReminder) => formatCurrency(s.valor_mensal_cobrado || 0)
        },
        {
            key: 'vencimento',
            header: 'Vencimento',
            render: (s: SubscriptionReminder) => (
                <div>
                    <p className="font-medium">{formatDate(s.data_renovacao)}</p>
                    <p className={`text-sm ${s.dias_para_vencimento < 0 ? 'text-red-500' : s.dias_para_vencimento <= 3 ? 'text-orange-500' : 'text-gray-500'}`}>
                        {s.dias_para_vencimento < 0
                            ? `${Math.abs(s.dias_para_vencimento)} dias atrás`
                            : s.dias_para_vencimento === 0
                                ? 'Hoje!'
                                : `em ${s.dias_para_vencimento} dias`}
                    </p>
                </div>
            )
        },
        {
            key: 'status',
            header: 'Status',
            render: (s: SubscriptionReminder) => getStatusBadge(s.status_lembrete)
        },
        {
            key: 'actions',
            header: 'Ações',
            render: (s: SubscriptionReminder) => (
                <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleSendReminder(s.id)}
                    disabled={sending === s.id || !s.sindico}
                    className="gap-1"
                >
                    {sending === s.id ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    Lembrar
                </Button>
            )
        },
    ];

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <Bell className="h-6 w-6 text-orange-500" />
                        Lembretes de Assinatura
                    </h1>
                    <p className="text-gray-500">Envie lembretes para síndicos com assinaturas próximas do vencimento</p>
                </div>
                <Button
                    onClick={handleSendAll}
                    disabled={sendingAll || subscriptions.length === 0}
                    className="bg-orange-500 hover:bg-orange-600"
                >
                    {sendingAll ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
                    Enviar Todos ({subscriptions.length})
                </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <Card className="bg-gradient-to-br from-red-500 to-red-600 text-white border-0">
                    <CardContent className="py-4 text-center">
                        <AlertTriangle className="h-6 w-6 mx-auto mb-1 opacity-80" />
                        <p className="text-2xl font-bold">{stats.vencidos}</p>
                        <p className="text-sm text-red-100">Vencidos</p>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white border-0">
                    <CardContent className="py-4 text-center">
                        <Clock className="h-6 w-6 mx-auto mb-1 opacity-80" />
                        <p className="text-2xl font-bold">{stats.urgentes}</p>
                        <p className="text-sm text-orange-100">Urgentes (1d)</p>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-yellow-500 to-yellow-600 text-white border-0">
                    <CardContent className="py-4 text-center">
                        <Bell className="h-6 w-6 mx-auto mb-1 opacity-80" />
                        <p className="text-2xl font-bold">{stats.proximos}</p>
                        <p className="text-sm text-yellow-100">Próximos (3d)</p>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-0">
                    <CardContent className="py-4 text-center">
                        <CheckCircle className="h-6 w-6 mx-auto mb-1 opacity-80" />
                        <p className="text-2xl font-bold">{stats.normais}</p>
                        <p className="text-sm text-green-100">Normais (7d)</p>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <div className="flex gap-2">
                <Button
                    variant={filter === 'expiring' ? 'primary' : 'outline'}
                    size="sm"
                    onClick={() => setFilter('expiring')}
                >
                    Próximos 7 dias
                </Button>
                <Button
                    variant={filter === 'expired' ? 'danger' : 'outline'}
                    size="sm"
                    onClick={() => setFilter('expired')}
                >
                    Já vencidos
                </Button>
                <Button
                    variant={filter === 'all' ? 'primary' : 'outline'}
                    size="sm"
                    onClick={() => setFilter('all')}
                >
                    Todos
                </Button>
                <Button variant="ghost" size="sm" onClick={fetchSubscriptions}>
                    <RefreshCw className="h-4 w-4" />
                </Button>
            </div>

            {/* Table */}
            <Card>
                <CardContent className="p-0">
                    <Table
                        data={subscriptions}
                        columns={columns}
                        loading={loading}
                        emptyMessage="Nenhuma assinatura encontrada para este filtro"
                    />
                </CardContent>
            </Card>
        </div>
    );
}
