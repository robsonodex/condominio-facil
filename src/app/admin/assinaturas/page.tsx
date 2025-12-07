'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, Button, Select, Table, Badge } from '@/components/ui';
import { createClient } from '@/lib/supabase/client';
import { formatCurrency, formatDate, getStatusColor, getStatusLabel } from '@/lib/utils';
import { CreditCard } from 'lucide-react';
import { Subscription, Condo, Plan } from '@/types/database';

export default function AdminAssinaturasPage() {
    const [subscriptions, setSubscriptions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState('');
    const supabase = createClient();

    useEffect(() => {
        fetchSubscriptions();
    }, [filterStatus]);

    const fetchSubscriptions = async () => {
        setLoading(true);
        let query = supabase
            .from('subscriptions')
            .select('*, condo:condos(nome, cidade, estado), plan:plans(nome_plano)')
            .order('created_at', { ascending: false });

        if (filterStatus) query = query.eq('status', filterStatus);

        const { data } = await query;
        setSubscriptions(data || []);
        setLoading(false);
    };

    const columns = [
        {
            key: 'condo',
            header: 'Condomínio',
            render: (s: any) => (
                <div>
                    <p className="font-medium text-gray-900">{s.condo?.nome}</p>
                    <p className="text-sm text-gray-500">{s.condo?.cidade}, {s.condo?.estado}</p>
                </div>
            )
        },
        { key: 'plan', header: 'Plano', render: (s: any) => s.plan?.nome_plano || '-' },
        { key: 'valor_mensal_cobrado', header: 'Valor', render: (s: any) => formatCurrency(s.valor_mensal_cobrado || 0) },
        {
            key: 'status',
            header: 'Status',
            render: (s: any) => (
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(s.status)}`}>
                    {getStatusLabel(s.status)}
                </span>
            )
        },
        { key: 'data_inicio', header: 'Início', render: (s: any) => formatDate(s.data_inicio) },
        { key: 'data_renovacao', header: 'Renovação', render: (s: any) => s.data_renovacao ? formatDate(s.data_renovacao) : '-' },
    ];

    const stats = {
        total: subscriptions.length,
        ativo: subscriptions.filter(s => s.status === 'ativo').length,
        pendente: subscriptions.filter(s => s.status === 'pendente_pagamento').length,
        cancelado: subscriptions.filter(s => s.status === 'cancelado').length,
        mrr: subscriptions.filter(s => s.status === 'ativo').reduce((sum, s) => sum + (s.valor_mensal_cobrado || 0), 0),
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Assinaturas</h1>
                <p className="text-gray-500">Acompanhe as assinaturas da plataforma</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white">
                    <CardContent className="py-4">
                        <CreditCard className="h-8 w-8 mb-2 opacity-80" />
                        <p className="text-2xl font-bold">{formatCurrency(stats.mrr)}</p>
                        <p className="text-emerald-100 text-sm">MRR (Receita Recorrente)</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="py-4 text-center">
                        <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                        <p className="text-sm text-gray-500">Total</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="py-4 text-center">
                        <p className="text-2xl font-bold text-emerald-600">{stats.ativo}</p>
                        <p className="text-sm text-gray-500">Ativas</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="py-4 text-center">
                        <p className="text-2xl font-bold text-orange-600">{stats.pendente}</p>
                        <p className="text-sm text-gray-500">Pendentes</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="py-4 text-center">
                        <p className="text-2xl font-bold text-red-600">{stats.cancelado}</p>
                        <p className="text-sm text-gray-500">Canceladas</p>
                    </CardContent>
                </Card>
            </div>

            {/* Filter */}
            <div className="flex gap-4">
                <Select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    options={[
                        { value: '', label: 'Todas as assinaturas' },
                        { value: 'ativo', label: 'Ativas' },
                        { value: 'pendente_pagamento', label: 'Pendentes' },
                        { value: 'cancelado', label: 'Canceladas' },
                    ]}
                    className="w-48"
                />
            </div>

            {/* Table */}
            <Card>
                <CardContent className="p-0">
                    <Table
                        data={subscriptions}
                        columns={columns}
                        loading={loading}
                        emptyMessage="Nenhuma assinatura encontrada"
                    />
                </CardContent>
            </Card>
        </div>
    );
}
