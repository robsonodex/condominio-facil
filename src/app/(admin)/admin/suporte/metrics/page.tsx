'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Ticket, AlertCircle, CheckCircle, Clock, TrendingUp } from 'lucide-react';

interface Metrics {
    tickets_open: number;
    tickets_in_progress: number;
    tickets_pending: number;
    tickets_resolved: number;
    tickets_closed: number;
    tickets_priority: number;
    tickets_sla_breached: number;
    avg_resolution_hours: number;
    total_tickets: number;
    by_category: Record<string, number>;
    recent_tickets_7d: number;
}

export default function SupportMetricsPage() {
    const [metrics, setMetrics] = useState<Metrics | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchMetrics();
    }, []);

    const fetchMetrics = async () => {
        const res = await fetch('/api/support/admin/metrics');
        const data = await res.json();
        setMetrics(data);
        setLoading(false);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-emerald-600 border-t-transparent"></div>
            </div>
        );
    }

    if (!metrics) return null;

    const statusData = [
        { name: 'Aberto', value: metrics.tickets_open, color: '#6b7280' },
        { name: 'Em Andamento', value: metrics.tickets_in_progress, color: '#f59e0b' },
        { name: 'Pendente', value: metrics.tickets_pending, color: '#ef4444' },
        { name: 'Resolvido', value: metrics.tickets_resolved, color: '#10b981' },
        { name: 'Fechado', value: metrics.tickets_closed, color: '#9ca3af' }
    ];

    const categoryData = Object.entries(metrics.by_category).map(([key, value]) => ({
        name: key.charAt(0).toUpperCase() + key.slice(1),
        value
    }));

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Métricas de Suporte</h1>
                <p className="text-gray-500">Análise completa do sistema de tickets</p>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">Total de Tickets</p>
                                <p className="text-2xl font-bold text-gray-900">{metrics.total_tickets}</p>
                            </div>
                            <Ticket className="h-8 w-8 text-gray-400" />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">Tickets Abertos</p>
                                <p className="text-2xl font-bold text-orange-600">{metrics.tickets_open}</p>
                            </div>
                            <AlertCircle className="h-8 w-8 text-orange-400" />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">SLA Estourado</p>
                                <p className="text-2xl font-bold text-red-600">{metrics.tickets_sla_breached}</p>
                            </div>
                            <Clock className="h-8 w-8 text-red-400" />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">Tempo Médio Resolução</p>
                                <p className="text-2xl font-bold text-green-600">
                                    {metrics.avg_resolution_hours?.toFixed(1) || 0}h
                                </p>
                            </div>
                            <TrendingUp className="h-8 w-8 text-green-400" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Tickets por Status</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={statusData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip />
                                <Bar dataKey="value" fill="#10b981" />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Tickets por Categoria</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={categoryData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip />
                                <Bar dataKey="value" fill="#3b82f6" />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>

            {/* Details */}
            <Card>
                <CardHeader>
                    <CardTitle>Detalhamento</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-3 gap-6">
                        <div>
                            <p className="text-sm text-gray-500 mb-2">Prioridade Alta/Prioritário</p>
                            <p className="text-xl font-bold text-red-600">{metrics.tickets_priority}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 mb-2">Novos (últimos 7 dias)</p>
                            <p className="text-xl font-bold text-blue-600">{metrics.recent_tickets_7d}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 mb-2">Taxa de Resolução</p>
                            <p className="text-xl font-bold text-green-600">
                                {metrics.total_tickets > 0
                                    ? ((metrics.tickets_resolved / metrics.total_tickets) * 100).toFixed(1)
                                    : 0}%
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
