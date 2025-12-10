'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, Button, Input, Select, Table, Badge } from '@/components/ui';
import { Modal } from '@/components/ui/modal';
import { useUser } from '@/hooks/useUser';
import { createClient } from '@/lib/supabase/client';
import { Plus, Send, Trash2, CreditCard, AlertCircle, CheckCircle, Clock } from 'lucide-react';

interface Invoice {
    id: string;
    descricao: string;
    valor: number;
    data_vencimento: string;
    status: string;
    link_pagamento: string | null;
    data_pagamento: string | null;
    morador: { id: string; nome: string; email: string } | null;
    unidade: { id: string; bloco: string; numero_unidade: string } | null;
    created_at: string;
}

export default function CobrancasPage() {
    const { isSindico, isSuperAdmin, condoId, loading: userLoading } = useUser();
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [moradores, setMoradores] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const supabase = createClient();

    // Form state
    const [moradorId, setMoradorId] = useState('');
    const [descricao, setDescricao] = useState('');
    const [valor, setValor] = useState('');
    const [dataVencimento, setDataVencimento] = useState('');
    const [enviarEmail, setEnviarEmail] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (!userLoading && condoId) {
            fetchInvoices();
            fetchMoradores();
        }
    }, [userLoading, condoId]);

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

    const fetchMoradores = async () => {
        const { data } = await supabase
            .from('users')
            .select('id, nome, email, unidade_id, unidade:units(bloco, numero_unidade)')
            .eq('condo_id', condoId)
            .eq('role', 'morador')
            .eq('ativo', true)
            .order('nome');
        setMoradores(data || []);
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!moradorId || !descricao || !valor || !dataVencimento) return;

        setSaving(true);
        try {
            const res = await fetch('/api/resident-billing', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    morador_id: moradorId,
                    descricao,
                    valor: parseFloat(valor),
                    data_vencimento: dataVencimento,
                    enviar_email: enviarEmail
                }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error);
            }

            const result = await res.json();
            alert(`Cobrança criada com sucesso!${enviarEmail ? ' Email enviado ao morador.' : ''}`);
            fetchInvoices();
            closeModal();
        } catch (error: any) {
            alert(`Erro: ${error.message}`);
        }
        setSaving(false);
    };

    const handleCancel = async (id: string) => {
        if (!confirm('Cancelar esta cobrança?')) return;

        try {
            const res = await fetch(`/api/resident-billing?id=${id}`, {
                method: 'DELETE',
                credentials: 'include',
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error);
            }

            fetchInvoices();
        } catch (error: any) {
            alert(`Erro: ${error.message}`);
        }
    };

    const closeModal = () => {
        setShowModal(false);
        setMoradorId('');
        setDescricao('');
        setValor('');
        setDataVencimento('');
        setEnviarEmail(true);
    };

    if (!isSindico && !isSuperAdmin) {
        return (
            <div className="text-center py-12">
                <p className="text-gray-500">Você não tem permissão para acessar esta página.</p>
            </div>
        );
    }

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

    const columns = [
        {
            key: 'morador',
            header: 'Morador',
            render: (inv: Invoice) => (
                <div>
                    <p className="font-medium">{inv.morador?.nome || 'N/A'}</p>
                    <p className="text-sm text-gray-500">{inv.morador?.email}</p>
                </div>
            )
        },
        {
            key: 'descricao',
            header: 'Descrição',
            render: (inv: Invoice) => <span className="text-sm">{inv.descricao}</span>
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
                <div className="flex gap-2 justify-end">
                    {inv.link_pagamento && inv.status === 'pendente' && (
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={() => window.open(inv.link_pagamento!, '_blank')}
                        >
                            <Send className="h-4 w-4" />
                        </Button>
                    )}
                    {inv.status === 'pendente' && (
                        <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleCancel(inv.id)}
                        >
                            <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                    )}
                </div>
            )
        },
    ];

    // Stats
    const totalPendente = invoices.filter(i => i.status === 'pendente').reduce((acc, i) => acc + i.valor, 0);
    const totalPago = invoices.filter(i => i.status === 'pago').reduce((acc, i) => acc + i.valor, 0);
    const countPendente = invoices.filter(i => i.status === 'pendente').length;

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <CreditCard className="h-6 w-6 text-emerald-500" />
                        Cobranças de Moradores
                    </h1>
                    <p className="text-gray-500">Gere e gerencie cobranças para os moradores</p>
                </div>
                <Button onClick={() => setShowModal(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Nova Cobrança
                </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card className="bg-gradient-to-br from-amber-500 to-amber-600 text-white border-0">
                    <CardContent className="py-4">
                        <p className="text-amber-100 text-sm">Pendente</p>
                        <p className="text-2xl font-bold">R$ {totalPendente.toFixed(2)}</p>
                        <p className="text-amber-200 text-xs">{countPendente} cobranças</p>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white border-0">
                    <CardContent className="py-4">
                        <p className="text-emerald-100 text-sm">Recebido</p>
                        <p className="text-2xl font-bold">R$ {totalPago.toFixed(2)}</p>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0">
                    <CardContent className="py-4">
                        <p className="text-blue-100 text-sm">Total</p>
                        <p className="text-2xl font-bold">{invoices.length}</p>
                        <p className="text-blue-200 text-xs">cobranças geradas</p>
                    </CardContent>
                </Card>
            </div>

            {/* Table */}
            <Card>
                <CardContent className="p-0">
                    <Table
                        data={invoices}
                        columns={columns}
                        loading={loading}
                        emptyMessage="Nenhuma cobrança encontrada. Clique em 'Nova Cobrança' para criar."
                    />
                </CardContent>
            </Card>

            {/* Modal */}
            <Modal isOpen={showModal} onClose={closeModal} title="Nova Cobrança" size="md">
                <form onSubmit={handleCreate} className="space-y-4">
                    <Select
                        label="Morador"
                        value={moradorId}
                        onChange={(e) => setMoradorId(e.target.value)}
                        options={[
                            { value: '', label: '-- Selecione o morador --' },
                            ...moradores.map(m => ({
                                value: m.id,
                                label: `${m.nome}${m.unidade ? ` - ${m.unidade.bloco || ''} ${m.unidade.numero_unidade}` : ''}`
                            }))
                        ]}
                        required
                    />

                    <Input
                        label="Descrição"
                        value={descricao}
                        onChange={(e) => setDescricao(e.target.value)}
                        placeholder="Ex: Taxa condominial Janeiro/2024"
                        required
                    />

                    <div className="grid grid-cols-2 gap-4">
                        <Input
                            label="Valor (R$)"
                            type="number"
                            step="0.01"
                            min="0.01"
                            value={valor}
                            onChange={(e) => setValor(e.target.value)}
                            placeholder="150.00"
                            required
                        />
                        <Input
                            label="Data de Vencimento"
                            type="date"
                            value={dataVencimento}
                            onChange={(e) => setDataVencimento(e.target.value)}
                            required
                        />
                    </div>

                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="enviarEmail"
                            checked={enviarEmail}
                            onChange={(e) => setEnviarEmail(e.target.checked)}
                            className="rounded border-gray-300"
                        />
                        <label htmlFor="enviarEmail" className="text-sm text-gray-600">
                            Enviar email com link de pagamento ao morador
                        </label>
                    </div>

                    <div className="flex gap-3 justify-end pt-4">
                        <Button type="button" variant="ghost" onClick={closeModal}>
                            Cancelar
                        </Button>
                        <Button type="submit" loading={saving}>
                            <CreditCard className="h-4 w-4 mr-2" />
                            Criar Cobrança
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
