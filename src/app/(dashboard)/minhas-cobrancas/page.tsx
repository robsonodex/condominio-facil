'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, Button, Table, Badge } from '@/components/ui';
import { useUser } from '@/hooks/useUser';
import { CreditCard, ExternalLink, CheckCircle, Clock, AlertCircle } from 'lucide-react';

interface Invoice {
    id: string;
    descricao: string;
    valor: number;
    data_vencimento: string;
    status: string;
    link_pagamento: string | null;
    data_pagamento: string | null;
    created_at: string;
}

export default function MinhasCobrancasPage() {
    const { profile, loading: userLoading } = useUser();
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!userLoading) fetchInvoices();
    }, [userLoading]);

    const fetchInvoices = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/resident-billing', { credentials: 'include' });
            const data = await res.json();
            setInvoices(data.invoices || []);
        } catch (error) {
            console.error('Error fetching invoices:', error);
        }
        setLoading(false);
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'pago':
                return <Badge variant="success"><CheckCircle className="h-3 w-3 mr-1" />Pago</Badge>;
            case 'pendente':
                return <Badge variant="warning"><Clock className="h-3 w-3 mr-1" />Pendente</Badge>;
            case 'vencido':
                return <Badge variant="danger"><AlertCircle className="h-3 w-3 mr-1" />Vencido</Badge>;
            case 'cancelado':
                return <Badge variant="default">Cancelado</Badge>;
            default:
                return <Badge>{status}</Badge>;
        }
    };

    const pendentes = invoices.filter(i => i.status === 'pendente');
    const pagas = invoices.filter(i => i.status === 'pago');

    const columns = [
        {
            key: 'descricao',
            header: 'Descrição',
            render: (inv: Invoice) => <span className="font-medium">{inv.descricao}</span>
        },
        {
            key: 'valor',
            header: 'Valor',
            render: (inv: Invoice) => (
                <span className="font-semibold text-emerald-600">
                    R$ {inv.valor.toFixed(2)}
                </span>
            )
        },
        {
            key: 'vencimento',
            header: 'Vencimento',
            render: (inv: Invoice) => new Date(inv.data_vencimento).toLocaleDateString('pt-BR')
        },
        {
            key: 'status',
            header: 'Status',
            render: (inv: Invoice) => getStatusBadge(inv.status)
        },
        {
            key: 'actions',
            header: '',
            className: 'text-right',
            render: (inv: Invoice) => (
                inv.link_pagamento && inv.status === 'pendente' ? (
                    <Button
                        size="sm"
                        onClick={() => window.open(inv.link_pagamento!, '_blank')}
                    >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Pagar
                    </Button>
                ) : inv.status === 'pago' && inv.data_pagamento ? (
                    <span className="text-sm text-gray-500">
                        Pago em {new Date(inv.data_pagamento).toLocaleDateString('pt-BR')}
                    </span>
                ) : null
            )
        },
    ];

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <CreditCard className="h-6 w-6 text-emerald-500" />
                    Minhas Cobranças
                </h1>
                <p className="text-gray-500">Visualize e pague suas cobranças do condomínio</p>
            </div>

            {/* Cobranças Pendentes */}
            {pendentes.length > 0 && (
                <Card className="border-amber-200 bg-amber-50">
                    <CardContent className="py-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="font-semibold text-amber-800 flex items-center gap-2">
                                    <AlertCircle className="h-5 w-5" />
                                    Você tem {pendentes.length} cobrança{pendentes.length > 1 ? 's' : ''} pendente{pendentes.length > 1 ? 's' : ''}
                                </h3>
                                <p className="text-amber-700 text-sm">
                                    Total: R$ {pendentes.reduce((acc, i) => acc + i.valor, 0).toFixed(2)}
                                </p>
                            </div>
                            {pendentes[0].link_pagamento && (
                                <Button
                                    onClick={() => window.open(pendentes[0].link_pagamento!, '_blank')}
                                >
                                    Pagar Agora
                                </Button>
                            )}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Lista de Cobranças */}
            <Card>
                <CardContent className="p-0">
                    <Table
                        data={invoices}
                        columns={columns}
                        loading={loading}
                        emptyMessage="Você não tem cobranças."
                    />
                </CardContent>
            </Card>

            {/* Resumo */}
            {invoices.length > 0 && (
                <div className="grid grid-cols-2 gap-4">
                    <Card className="bg-gradient-to-br from-amber-500 to-amber-600 text-white border-0">
                        <CardContent className="py-4 text-center">
                            <p className="text-amber-100 text-sm">Pendente</p>
                            <p className="text-2xl font-bold">
                                R$ {pendentes.reduce((acc, i) => acc + i.valor, 0).toFixed(2)}
                            </p>
                        </CardContent>
                    </Card>
                    <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white border-0">
                        <CardContent className="py-4 text-center">
                            <p className="text-emerald-100 text-sm">Pago</p>
                            <p className="text-2xl font-bold">
                                R$ {pagas.reduce((acc, i) => acc + i.valor, 0).toFixed(2)}
                            </p>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}
