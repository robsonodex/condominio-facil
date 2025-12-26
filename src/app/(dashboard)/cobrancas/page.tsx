'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, Button, Input, Select, Table, Badge } from '@/components/ui';
import { Modal } from '@/components/ui/modal';
import { useUser } from '@/hooks/useUser';
import { useAuth } from '@/hooks/useAuth';
import { useSmtpStatus } from '@/hooks/useSmtpStatus';
import { createClient } from '@/lib/supabase/client';
import { Plus, Send, Trash2, CreditCard, AlertCircle, CheckCircle, Clock, Mail, MessageCircle, Lock, Check, Settings } from 'lucide-react';
import Link from 'next/link';

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
    const { session } = useAuth();
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
    const [enviarWhatsapp, setEnviarWhatsapp] = useState(false);
    const [showWhatsappBanner, setShowWhatsappBanner] = useState(false);
    const [saving, setSaving] = useState(false);

    // SMTP Status - verifica se e-mail está configurado
    const { smtpConfigured, configUrl, loading: smtpLoading } = useSmtpStatus();

    const getAuthHeaders = () => {
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
        };
        if (session?.access_token) {
            headers['Authorization'] = `Bearer ${session.access_token}`;
        }
        return headers;
    };

    useEffect(() => {
        if (!userLoading && condoId && session?.access_token) {
            fetchInvoices();
            fetchMoradores();
        }
    }, [userLoading, condoId, session?.access_token]);

    const fetchInvoices = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/resident-billing', {
                headers: getAuthHeaders(),
                credentials: 'include'
            });
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
            .select('id, nome, email, role, unidade_id, unidade:units(bloco, numero_unidade)')
            .eq('condo_id', condoId)
            .in('role', ['morador', 'inquilino'])
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
                headers: getAuthHeaders(),
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
            alert(`Cobrança criada com sucesso!${enviarEmail ? ' E-mail enviado ao morador.' : ''}`);
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
                headers: getAuthHeaders(),
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

    const handleMarkAsPaid = async (inv: Invoice) => {
        if (!confirm(`Marcar a cobrança de R$ ${inv.valor.toFixed(2)} como PAGA?\n\nUm e-mail de agradecimento será enviado ao morador.`)) return;

        try {
            const res = await fetch(`/api/resident-billing?id=${inv.id}`, {
                method: 'PATCH',
                headers: getAuthHeaders(),
                credentials: 'include',
                body: JSON.stringify({ status: 'pago' }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error);
            }

            alert('✅ Cobrança marcada como paga! E-mail de agradecimento enviado.');
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
                <div className="flex gap-1 justify-end">
                    {inv.status === 'pendente' && (
                        <>
                            <Button
                                size="sm"
                                variant="outline"
                                className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                                onClick={() => handleMarkAsPaid(inv)}
                                title="Marcar como Pago"
                            >
                                <Check className="h-4 w-4" />
                            </Button>
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleCancel(inv.id)}
                                title="Cancelar"
                            >
                                <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                        </>
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
                        label="Morador / Inquilino"
                        value={moradorId}
                        onChange={(e) => setMoradorId(e.target.value)}
                        options={[
                            { value: '', label: '-- Selecione --' },
                            ...moradores.map(m => ({
                                value: m.id,
                                label: `${m.nome} (${m.role === 'inquilino' ? 'Inquilino' : 'Morador'})${m.unidade ? ` - ${m.unidade.bloco || ''} ${m.unidade.numero_unidade}` : ''}`
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

                    {/* Opções de notificação */}
                    <div className="space-y-3 pt-2">
                        <p className="text-sm font-medium text-gray-700">Notificar morador:</p>

                        {/* E-mail */}
                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="enviarEmail"
                                checked={smtpConfigured ? enviarEmail : false}
                                onChange={(e) => setEnviarEmail(e.target.checked)}
                                disabled={!smtpConfigured}
                                className={`rounded border-gray-300 focus:ring-emerald-500 ${smtpConfigured ? 'text-emerald-600' : 'text-gray-300 cursor-not-allowed'}`}
                            />
                            <label htmlFor="enviarEmail" className={`text-sm flex items-center gap-2 ${smtpConfigured ? 'text-gray-600' : 'text-gray-400'}`}>
                                <Mail className={`h-4 w-4 ${smtpConfigured ? 'text-emerald-500' : 'text-gray-400'}`} />
                                Enviar e-mail com detalhes da cobrança
                            </label>
                            {!smtpConfigured && (
                                <Link
                                    href={configUrl}
                                    className="text-xs text-amber-600 hover:text-amber-700 underline flex items-center gap-1"
                                >
                                    <Settings className="h-3 w-3" /> Configurar
                                </Link>
                            )}
                        </div>

                        {/* WhatsApp - Bloqueado */}
                        <div className="relative">
                            <div className="flex items-center gap-2 opacity-50">
                                <input
                                    type="checkbox"
                                    id="enviarWhatsapp"
                                    checked={false}
                                    onChange={() => setShowWhatsappBanner(true)}
                                    className="rounded border-gray-300"
                                    disabled
                                />
                                <label htmlFor="enviarWhatsapp" className="text-sm text-gray-500 flex items-center gap-2">
                                    <MessageCircle className="h-4 w-4 text-gray-400" />
                                    Enviar via WhatsApp
                                    <Lock className="h-3 w-3 text-gray-400" />
                                </label>
                            </div>
                            <button
                                type="button"
                                className="absolute inset-0 w-full h-full cursor-pointer"
                                onClick={() => setShowWhatsappBanner(true)}
                            />
                        </div>

                        {/* Banner WhatsApp Premium */}
                        {showWhatsappBanner && (
                            <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-lg p-4 mt-2">
                                <div className="flex items-start gap-3">
                                    <div className="flex-shrink-0">
                                        <MessageCircle className="h-6 w-6 text-amber-500" />
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-amber-800">WhatsApp Premium</h4>
                                        <p className="text-sm text-amber-700 mt-1">
                                            O envio de cobranças via WhatsApp está disponível apenas para planos <strong>Premium</strong>.
                                        </p>
                                        <a
                                            href="/upgrade"
                                            className="inline-flex items-center text-sm font-medium text-emerald-600 hover:text-emerald-700 mt-2"
                                        >
                                            Ver planos disponíveis →
                                        </a>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setShowWhatsappBanner(false)}
                                        className="text-gray-400 hover:text-gray-500"
                                    >
                                        ×
                                    </button>
                                </div>
                            </div>
                        )}
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
