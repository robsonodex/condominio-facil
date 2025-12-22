'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, Button, Select, Table, Badge, Input, Textarea } from '@/components/ui';
import { Modal } from '@/components/ui/modal';
import { formatCurrency, formatDate, getStatusColor, getStatusLabel } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { createClient } from '@/lib/supabase/client';
import { CreditCard, Send, Users, DollarSign, Plus, Search, Trash2, Mail } from 'lucide-react';

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

interface Subscription {
    id: string;
    status: string;
    valor_mensal_cobrado: number;
    condo: { id: string; nome: string; email_contato: string } | null;
    plan: { nome_plano: string; valor_mensal: number } | null;
}

export default function AdminCobrancasPage() {
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [showNewChargeModal, setShowNewChargeModal] = useState(false);
    const [selectedSubs, setSelectedSubs] = useState<string[]>([]);
    const [chargeDesc, setChargeDesc] = useState('');
    const [sendingCharge, setSendingCharge] = useState(false);
    const { session } = useAuth();
    const supabase = createClient();

    useEffect(() => {
        fetchInvoices();
        fetchActiveSubscriptions();
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

    const fetchActiveSubscriptions = async () => {
        // Buscar assinaturas ativas
        const { data } = await supabase
            .from('subscriptions')
            .select('id, status, valor_mensal_cobrado, condo:condos(id, nome, email_contato), plan:plans(nome_plano, valor_mensal)')
            .eq('status', 'ativo');

        // Buscar síndicos para cada condomínio
        const condoIds = (data || []).map((item: any) => {
            const condo = Array.isArray(item.condo) ? item.condo[0] : item.condo;
            return condo?.id;
        }).filter(Boolean);

        const { data: sindicos } = await supabase
            .from('users')
            .select('email, condo_id')
            .eq('role', 'sindico')
            .in('condo_id', condoIds);

        // Map subscriptions com e-mail do síndico como fallback
        const mapped = (data || []).map((item: any) => {
            const condo = Array.isArray(item.condo) ? item.condo[0] || null : item.condo;
            const sindico = sindicos?.find(s => s.condo_id === condo?.id);
            return {
                id: item.id,
                status: item.status,
                valor_mensal_cobrado: item.valor_mensal_cobrado,
                condo: condo ? {
                    ...condo,
                    // Usa email_contato do condo, ou e-mail do síndico como fallback
                    email_contato: condo.email_contato || sindico?.email || null
                } : null,
                plan: Array.isArray(item.plan) ? item.plan[0] || null : item.plan,
            };
        });
        setSubscriptions(mapped);
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

    const handleSendCharges = async () => {
        if (selectedSubs.length === 0) {
            alert('Selecione pelo menos uma assinatura');
            return;
        }

        setSendingCharge(true);
        let enviados = 0;
        let erros = 0;
        let ultimoErro = '';

        for (const subId of selectedSubs) {
            const sub = subscriptions.find(s => s.id === subId);
            if (!sub?.condo?.email_contato) {
                erros++;
                ultimoErro = `${sub?.condo?.nome || 'Condomínio'}: sem email de contato`;
                continue;
            }

            try {
                const res = await fetch('/api/billing/send-invoice', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    credentials: 'include',
                    body: JSON.stringify({
                        subscription_id: subId,
                        custom_message: chargeDesc || `Cobrança mensal - ${sub.plan?.nome_plano || 'Plano'}`,
                    }),
                });

                if (res.ok) {
                    enviados++;
                } else {
                    const data = await res.json();
                    ultimoErro = `${sub?.condo?.nome}: ${data.error || 'Erro desconhecido'}`;
                    erros++;
                }
            } catch (e: any) {
                ultimoErro = `${sub?.condo?.nome}: ${e.message}`;
                erros++;
            }
        }

        setSendingCharge(false);
        setShowNewChargeModal(false);
        setSelectedSubs([]);
        setChargeDesc('');

        if (erros > 0 && enviados === 0) {
            alert(`❌ Erro ao enviar: ${ultimoErro}`);
        } else {
            alert(`✅ ${enviados} cobrança(s) enviada(s)${erros > 0 ? `\n⚠️ ${erros} erro(s): ${ultimoErro}` : ''}`);
        }
        fetchInvoices();
    };

    const toggleSelectAll = () => {
        if (selectedSubs.length === subscriptions.length) {
            setSelectedSubs([]);
        } else {
            setSelectedSubs(subscriptions.map(s => s.id));
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
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <Users className="h-6 w-6 text-emerald-500" />
                        Cobranças de Usuários
                    </h1>
                    <p className="text-gray-500">Visualize e envie cobranças para os condomínios</p>
                </div>
                <Button onClick={() => setShowNewChargeModal(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Nova Cobrança
                </Button>
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

            {/* New Charge Modal */}
            <Modal
                isOpen={showNewChargeModal}
                onClose={() => setShowNewChargeModal(false)}
                title="Enviar Cobrança para Assinaturas Ativas"
                size="lg"
            >
                <div className="space-y-4">
                    <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                        <label className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                checked={selectedSubs.length === subscriptions.length && subscriptions.length > 0}
                                onChange={toggleSelectAll}
                                className="rounded"
                            />
                            <span className="font-medium">Selecionar Todos ({subscriptions.length} ativos)</span>
                        </label>
                        <span className="text-sm text-gray-500">
                            {selectedSubs.length} selecionado(s)
                        </span>
                    </div>

                    <div className="max-h-60 overflow-y-auto border rounded-lg divide-y">
                        {subscriptions.map(sub => (
                            <label
                                key={sub.id}
                                className="flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer"
                            >
                                <input
                                    type="checkbox"
                                    checked={selectedSubs.includes(sub.id)}
                                    onChange={(e) => {
                                        if (e.target.checked) {
                                            setSelectedSubs([...selectedSubs, sub.id]);
                                        } else {
                                            setSelectedSubs(selectedSubs.filter(id => id !== sub.id));
                                        }
                                    }}
                                    className="rounded"
                                />
                                <div className="flex-1">
                                    <p className="font-medium">{sub.condo?.nome}</p>
                                    <p className="text-sm text-gray-500">
                                        {sub.plan?.nome_plano} - {formatCurrency(sub.valor_mensal_cobrado || sub.plan?.valor_mensal || 0)}
                                    </p>
                                </div>
                                <div className="text-right text-sm">
                                    <p className="text-gray-500">{sub.condo?.email_contato || 'Sem email'}</p>
                                </div>
                            </label>
                        ))}
                    </div>

                    <Textarea
                        label="Mensagem personalizada (opcional)"
                        value={chargeDesc}
                        onChange={(e) => setChargeDesc(e.target.value)}
                        placeholder="Deixe em branco para usar mensagem padrão"
                        rows={3}
                    />

                    <div className="bg-blue-50 p-4 rounded-lg text-sm">
                        <p className="font-medium text-blue-900 mb-2">📧 O email enviado incluirá:</p>
                        <ul className="text-blue-700 space-y-1">
                            <li>• Nome do condomínio</li>
                            <li>• Valor da mensalidade</li>
                            <li>• Link de pagamento via Mercado Pago</li>
                            <li>• Data de vencimento</li>
                        </ul>
                    </div>

                    <div className="flex gap-3 justify-end pt-4">
                        <Button variant="ghost" onClick={() => setShowNewChargeModal(false)}>
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleSendCharges}
                            loading={sendingCharge}
                            disabled={selectedSubs.length === 0}
                        >
                            <Mail className="h-4 w-4 mr-2" />
                            Enviar Cobrança ({selectedSubs.length})
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}

