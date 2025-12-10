'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, Button, Select, Table, Badge, Input, Textarea } from '@/components/ui';
import { Modal } from '@/components/ui/modal';
import { formatCurrency, formatDate, getStatusColor, getStatusLabel } from '@/lib/utils';
import { CreditCard, Send, Users, DollarSign, Plus, Search, Trash2 } from 'lucide-react';

interface Invoice {
    id: string;
    condo_id: string;
    morador_id: string;
    descricao: string;
    valor: number;
    data_vencimento: string;
    status: string;
    link_pagamento: string | null;
    morador: { nome: string; email: string } | null;
    condo: { nome: string } | null;
    unidade: { bloco: string; numero_unidade: string } | null;
    created_at: string;
}

export default function AdminCobrancasPage() {
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchInvoices();
    }, [filterStatus]);

    const fetchInvoices = async () => {
        setLoading(true);
        try {
            const params = filterStatus ? `?status=${filterStatus}` : '';
            const response = await fetch(`/api/admin/billing${params}`, {
                credentials: 'include'
            });
            const data = await response.json();

            if (!response.ok) {
                console.error('Error fetching invoices:', data.error);
                setInvoices([]);
            } else {
                setInvoices(data.invoices || []);
            }
        } catch (error) {
            console.error('Error:', error);
            setInvoices([]);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Tem certeza que deseja cancelar esta cobrança?')) return;

        try {
            const res = await fetch(`/api/admin/billing?id=${id}`, {
                method: 'DELETE',
                credentials: 'include',
            });

            if (res.ok) {
                setInvoices(prev => prev.filter(i => i.id !== id));
                alert('✅ Cobrança cancelada!');
            } else {
                const data = await res.json();
                throw new Error(data.error);
            }
        } catch (err: any) {
            alert('❌ Erro: ' + err.message);
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'pago':
                return <Badge variant="success">Pago</Badge>;
            case 'pendente':
                return <Badge variant="warning">Pendente</Badge>;
            case 'vencido':
                return <Badge variant="danger">Vencido</Badge>;
            case 'cancelado':
                return <Badge variant="default">Cancelado</Badge>;
            default:
                return <Badge>{status}</Badge>;
        }
    };

    const filteredInvoices = invoices.filter(i =>
        i.morador?.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        i.condo?.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        i.descricao.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const stats = {
        total: invoices.length,
        pendente: invoices.filter(i => i.status === 'pendente').length,
        pago: invoices.filter(i => i.status === 'pago').length,
        valorPendente: invoices.filter(i => i.status === 'pendente').reduce((s, i) => s + i.valor, 0),
        valorRecebido: invoices.filter(i => i.status === 'pago').reduce((s, i) => s + i.valor, 0),
    };

    const columns = [
        {
            key: 'condo',
            header: 'Condomínio',
            render: (i: Invoice) => (
                <div>
                    <p className="font-medium">{i.condo?.nome || 'N/A'}</p>
                </div>
            )
        },
        {
            key: 'morador',
            header: 'Morador',
            render: (i: Invoice) => (
                <div>
                    <p className="font-medium">{i.morador?.nome || 'N/A'}</p>
                    <p className="text-sm text-gray-500">{i.morador?.email}</p>
                </div>
            )
        },
        {
            key: 'unidade',
            header: 'Unidade',
            render: (i: Invoice) => i.unidade ? `${i.unidade.bloco || ''} ${i.unidade.numero_unidade}` : '-'
        },
        {
            key: 'descricao',
            header: 'Descrição',
            render: (i: Invoice) => <span className="text-sm">{i.descricao}</span>
        },
        {
            key: 'valor',
            header: 'Valor',
            render: (i: Invoice) => (
                <span className="font-semibold text-emerald-600">
                    {formatCurrency(i.valor)}
                </span>
            )
        },
        {
            key: 'vencimento',
            header: 'Vencimento',
            render: (i: Invoice) => formatDate(i.data_vencimento)
        },
        {
            key: 'status',
            header: 'Status',
            render: (i: Invoice) => getStatusBadge(i.status)
        },
        {
            key: 'actions',
            header: '',
            className: 'text-right',
            render: (i: Invoice) => (
                <div className="flex gap-2 justify-end">
                    {i.link_pagamento && i.status === 'pendente' && (
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={() => window.open(i.link_pagamento!, '_blank')}
                        >
                            <Send className="h-4 w-4" />
                        </Button>
                    )}
                    {i.status === 'pendente' && (
                        <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDelete(i.id)}
                        >
                            <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                    )}
                </div>
            )
        },
    ];

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <Users className="h-6 w-6 text-emerald-500" />
                    Cobranças de Usuários
                </h1>
                <p className="text-gray-500">Visualize todas as cobranças de moradores do sistema</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0">
                    <CardContent className="py-4 text-center">
                        <p className="text-2xl font-bold">{stats.total}</p>
                        <p className="text-sm text-blue-100">Total</p>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-amber-500 to-amber-600 text-white border-0">
                    <CardContent className="py-4 text-center">
                        <p className="text-2xl font-bold">{stats.pendente}</p>
                        <p className="text-sm text-amber-100">Pendentes</p>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white border-0">
                    <CardContent className="py-4 text-center">
                        <p className="text-2xl font-bold">{formatCurrency(stats.valorRecebido)}</p>
                        <p className="text-sm text-emerald-100">Recebido</p>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-red-500 to-red-600 text-white border-0">
                    <CardContent className="py-4 text-center">
                        <p className="text-2xl font-bold">{formatCurrency(stats.valorPendente)}</p>
                        <p className="text-sm text-red-100">A Receber</p>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-4">
                <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Buscar por nome, condomínio..."
                        className="pl-10"
                    />
                </div>
                <Select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    options={[
                        { value: '', label: 'Todos os status' },
                        { value: 'pendente', label: 'Pendentes' },
                        { value: 'pago', label: 'Pagos' },
                        { value: 'vencido', label: 'Vencidos' },
                        { value: 'cancelado', label: 'Cancelados' },
                    ]}
                    className="w-40"
                />
            </div>

            {/* Table */}
            <Card>
                <CardContent className="p-0">
                    <Table
                        data={filteredInvoices}
                        columns={columns}
                        loading={loading}
                        emptyMessage="Nenhuma cobrança encontrada"
                    />
                </CardContent>
            </Card>
        </div>
    );
}
