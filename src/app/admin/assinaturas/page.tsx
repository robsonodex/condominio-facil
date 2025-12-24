'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, Button, Select, Table, Badge, Input, Textarea } from '@/components/ui';
import { Modal } from '@/components/ui/modal';
import { createClient } from '@/lib/supabase/client';
import { formatCurrency, formatDate, getStatusColor, getStatusLabel } from '@/lib/utils';
import { CreditCard, Send, Bell, Mail, DollarSign, Edit, Save, PlusCircle } from 'lucide-react';

export default function AdminAssinaturasPage() {
    const [subscriptions, setSubscriptions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState('');
    const supabase = createClient();

    // Modal state
    const [showBillingModal, setShowBillingModal] = useState(false);
    const [selectedSub, setSelectedSub] = useState<any>(null);
    const [billingAction, setBillingAction] = useState<'email' | 'notification' | 'both'>('both');
    const [customMessage, setCustomMessage] = useState('');
    const [sending, setSending] = useState(false);

    // Modal edição de valor
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingSub, setEditingSub] = useState<any>(null);
    const [novoValor, setNovoValor] = useState('');
    const [novoStatus, setNovoStatus] = useState('');
    const [observacoes, setObservacoes] = useState('');
    const [savingValue, setSavingValue] = useState(false);

    // Modal cobrança avulsa
    const [showChargeModal, setShowChargeModal] = useState(false);
    const [chargeValor, setChargeValor] = useState('');
    const [chargeDescricao, setChargeDescricao] = useState('');
    const [charging, setCharging] = useState(false);

    useEffect(() => {
        fetchSubscriptions();
    }, [filterStatus]);

    const fetchSubscriptions = async () => {
        setLoading(true);
        try {
            const params = filterStatus ? `?status=${filterStatus}` : '';
            const response = await fetch(`/api/admin/subscriptions${params}`, {
                credentials: 'include'
            });
            const data = await response.json();

            if (!response.ok) {
                console.error('Error fetching subscriptions:', data.error);
                setSubscriptions([]);
            } else {
                setSubscriptions(data.subscriptions || []);
            }
        } catch (error) {
            console.error('Error:', error);
            setSubscriptions([]);
        } finally {
            setLoading(false);
        }
    };

    const openEditModal = (sub: any) => {
        setEditingSub(sub);
        setNovoValor((sub.valor_mensal_cobrado || sub.plan?.valor_mensal || 0).toFixed(2));
        setNovoStatus(sub.status || '');
        setObservacoes(sub.observacoes || '');
        setShowEditModal(true);
    };

    const handleSaveValue = async () => {
        if (!editingSub) return;

        setSavingValue(true);
        try {
            const response = await fetch('/api/admin/subscriptions', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    id: editingSub.id,
                    valor_mensal_cobrado: parseFloat(novoValor),
                    status: novoStatus,
                    observacoes: observacoes || undefined
                })
            });

            const data = await response.json();

            if (!response.ok) {
                alert(`❌ Erro: ${data.error}`);
            } else {
                alert('✅ Assinatura atualizada com sucesso!' + (novoStatus !== editingSub.status ? ' (Email enviado)' : ''));
                setShowEditModal(false);
                fetchSubscriptions();
            }
        } catch (e: any) {
            alert(`❌ Erro: ${e.message}`);
        } finally {
            setSavingValue(false);
        }
    };

    const openChargeModal = (sub: any) => {
        setSelectedSub(sub);
        setChargeValor('');
        setChargeDescricao('');
        setShowChargeModal(true);
    };

    const handleCreateCharge = async () => {
        if (!selectedSub || !chargeValor || !chargeDescricao) {
            alert('Preencha valor e descrição');
            return;
        }

        setCharging(true);
        try {
            const { error } = await supabase
                .from('admin_charges')
                .insert({
                    condo_id: selectedSub.condo_id,
                    valor: parseFloat(chargeValor),
                    descricao: chargeDescricao,
                    status: 'pendente'
                });

            if (error) throw error;

            alert('✅ Cobrança avulsa registrada com sucesso!');
            setShowChargeModal(false);
            // Aqui poderia disparar notificação/email se desejado
        } catch (e: any) {
            alert(`❌ Erro: ${e.message}`);
        } finally {
            setCharging(false);
        }
    };

    const openBillingModal = (sub: any) => {
        setSelectedSub(sub);
        setCustomMessage(`Olá!\n\nSua mensalidade do Condomínio Fácil para o ${sub.condo?.nome} está disponível para pagamento.\n\nValor: R$ ${(sub.valor_mensal_cobrado || 0).toFixed(2)}\nPlano: ${sub.plan?.nome_plano}\n\nPor favor, efetue o pagamento para manter seus serviços ativos.`);
        setShowBillingModal(true);
    };

    const handleSendBilling = async () => {
        if (!selectedSub) return;

        setSending(true);
        try {
            const results = { email: false, notification: false };
            const errors: string[] = [];

            // Enviar Email
            if (billingAction === 'email' || billingAction === 'both') {
                try {
                    const emailRes = await fetch('/api/billing/send-invoice', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        credentials: 'include',
                        body: JSON.stringify({
                            subscription_id: selectedSub.id,
                            custom_message: customMessage
                        })
                    });
                    const emailData = await emailRes.json();

                    if (emailRes.ok) {
                        results.email = true;
                        console.log('[BILLING] Email enviado:', emailData);
                    } else {
                        errors.push(`Email: ${emailData.error || 'Erro desconhecido'}`);
                        console.error('[BILLING] Erro email:', emailData);
                    }
                } catch (emailError: any) {
                    errors.push(`Email: ${emailError.message}`);
                    console.error('[BILLING] Exceção email:', emailError);
                }
            }

            // Enviar Notificação In-App
            if (billingAction === 'notification' || billingAction === 'both') {
                try {
                    // Buscar síndico do condomínio
                    const { data: sindico, error: sindicoError } = await supabase
                        .from('users')
                        .select('id')
                        .eq('condo_id', selectedSub.condo_id)
                        .eq('role', 'sindico')
                        .single();

                    if (sindicoError || !sindico) {
                        errors.push('Notificação: Síndico não encontrado');
                        console.error('[BILLING] Síndico não encontrado:', sindicoError);
                    } else {
                        const { error: notifError } = await supabase.from('notifications').insert({
                            condo_id: selectedSub.condo_id,
                            user_id: sindico.id,
                            title: '💳 Cobrança de Mensalidade',
                            message: `Sua mensalidade do Condomínio Fácil está disponível. Valor: R$ ${(selectedSub.valor_mensal_cobrado || 0).toFixed(2)}. Acesse a página de Assinatura para efetuar o pagamento.`,
                            type: 'billing',
                            link: '/assinatura'
                        });

                        if (notifError) {
                            errors.push(`Notificação: ${notifError.message}`);
                            console.error('[BILLING] Erro notificação:', notifError);
                        } else {
                            results.notification = true;
                        }
                    }
                } catch (notifError: any) {
                    errors.push(`Notificação: ${notifError.message}`);
                    console.error('[BILLING] Exceção notificação:', notifError);
                }
            }

            // Feedback
            const msgs = [];
            if (results.email) msgs.push('Email enviado');
            if (results.notification) msgs.push('Notificação criada');

            if (msgs.length > 0) {
                alert(`✅ ${msgs.join(' e ')}!`);
            } else {
                const errorDetail = errors.length > 0 ? `\n\nDetalhes:\n${errors.join('\n')}` : '';
                alert(`❌ Nenhuma ação foi executada com sucesso${errorDetail}`);
            }

            setShowBillingModal(false);
        } catch (error: any) {
            alert(`❌ Erro: ${error.message}`);
        } finally {
            setSending(false);
        }
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
        {
            key: 'actions',
            header: 'Ações',
            render: (s: any) => (
                <div className="flex gap-2">
                    <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => openEditModal(s)}
                        title="Editar valor"
                    >
                        <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                        size="sm"
                        onClick={() => openBillingModal(s)}
                    >
                        <DollarSign className="h-4 w-4 mr-1" />
                        Cobrar
                    </Button>
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openChargeModal(s)}
                        title="Cobrança Avulsa (Setup/Extra)"
                    >
                        <PlusCircle className="h-4 w-4" />
                    </Button>
                </div>
            )
        },
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
                <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white border-0">
                    <CardContent className="py-4">
                        <CreditCard className="h-8 w-8 mb-2 opacity-80" />
                        <p className="text-2xl font-bold">{formatCurrency(stats.mrr)}</p>
                        <p className="text-emerald-100 text-sm">MRR (Receita Recorrente)</p>
                    </CardContent>
                </Card>
                <div onClick={() => setFilterStatus('')} className="cursor-pointer transition-transform hover:scale-105">
                    <Card className={`bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0 h-full ${filterStatus === '' ? 'ring-2 ring-white ring-offset-2' : ''}`}>
                        <CardContent className="py-4 text-center">
                            <p className="text-2xl font-bold">{stats.total}</p>
                            <p className="text-sm text-blue-100">Total</p>
                        </CardContent>
                    </Card>
                </div>
                <div onClick={() => setFilterStatus('ativo')} className="cursor-pointer transition-transform hover:scale-105">
                    <Card className={`bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0 h-full ${filterStatus === 'ativo' ? 'ring-2 ring-white ring-offset-2' : ''}`}>
                        <CardContent className="py-4 text-center">
                            <p className="text-2xl font-bold">{stats.ativo}</p>
                            <p className="text-sm text-purple-100">Ativas</p>
                        </CardContent>
                    </Card>
                </div>
                <div onClick={() => setFilterStatus('pendente_pagamento')} className="cursor-pointer transition-transform hover:scale-105">
                    <Card className={`bg-gradient-to-br from-orange-500 to-orange-600 text-white border-0 h-full ${filterStatus === 'pendente_pagamento' ? 'ring-2 ring-white ring-offset-2' : ''}`}>
                        <CardContent className="py-4 text-center">
                            <p className="text-2xl font-bold">{stats.pendente}</p>
                            <p className="text-sm text-orange-100">Pendentes</p>
                        </CardContent>
                    </Card>
                </div>
                <div onClick={() => setFilterStatus('cancelado')} className="cursor-pointer transition-transform hover:scale-105">
                    <Card className={`bg-gradient-to-br from-red-500 to-red-600 text-white border-0 h-full ${filterStatus === 'cancelado' ? 'ring-2 ring-white ring-offset-2' : ''}`}>
                        <CardContent className="py-4 text-center">
                            <p className="text-2xl font-bold">{stats.cancelado}</p>
                            <p className="text-sm text-red-100">Canceladas</p>
                        </CardContent>
                    </Card>
                </div>
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

            {/* Billing Modal */}
            <Modal
                isOpen={showBillingModal}
                onClose={() => setShowBillingModal(false)}
                title={`Cobrar ${selectedSub?.condo?.nome || ''}`}
                size="lg"
            >
                <div className="space-y-6">
                    {/* Info */}
                    <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-semibold text-emerald-800">{selectedSub?.condo?.nome}</p>
                                <p className="text-sm text-emerald-600">Plano: {selectedSub?.plan?.nome_plano}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-2xl font-bold text-emerald-600">
                                    R$ {(selectedSub?.valor_mensal_cobrado || 0).toFixed(2)}
                                </p>
                                <p className="text-xs text-emerald-500">por mês</p>
                            </div>
                        </div>
                    </div>

                    {/* Action Selection */}
                    <div>
                        <p className="font-medium text-gray-700 mb-3">Como deseja cobrar?</p>
                        <div className="grid grid-cols-3 gap-3">
                            <button
                                onClick={() => setBillingAction('email')}
                                className={`p-4 rounded-lg border-2 text-center transition-all ${billingAction === 'email'
                                    ? 'border-emerald-500 bg-emerald-50'
                                    : 'border-gray-200 hover:border-gray-300'
                                    }`}
                            >
                                <Mail className={`h-6 w-6 mx-auto mb-2 ${billingAction === 'email' ? 'text-emerald-500' : 'text-gray-400'}`} />
                                <p className="text-sm font-medium">Apenas Email</p>
                            </button>
                            <button
                                onClick={() => setBillingAction('notification')}
                                className={`p-4 rounded-lg border-2 text-center transition-all ${billingAction === 'notification'
                                    ? 'border-emerald-500 bg-emerald-50'
                                    : 'border-gray-200 hover:border-gray-300'
                                    }`}
                            >
                                <Bell className={`h-6 w-6 mx-auto mb-2 ${billingAction === 'notification' ? 'text-emerald-500' : 'text-gray-400'}`} />
                                <p className="text-sm font-medium">Apenas Notificação</p>
                            </button>
                            <button
                                onClick={() => setBillingAction('both')}
                                className={`p-4 rounded-lg border-2 text-center transition-all ${billingAction === 'both'
                                    ? 'border-emerald-500 bg-emerald-50'
                                    : 'border-gray-200 hover:border-gray-300'
                                    }`}
                            >
                                <Send className={`h-6 w-6 mx-auto mb-2 ${billingAction === 'both' ? 'text-emerald-500' : 'text-gray-400'}`} />
                                <p className="text-sm font-medium">Ambos</p>
                            </button>
                        </div>
                    </div>

                    {/* Custom Message (for email) */}
                    {(billingAction === 'email' || billingAction === 'both') && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Mensagem do Email (personalizável)
                            </label>
                            <Textarea
                                value={customMessage}
                                onChange={(e) => setCustomMessage(e.target.value)}
                                rows={6}
                                className="w-full"
                                placeholder="Escreva uma mensagem personalizada..."
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                O email incluirá um botão "Pagar Agora" com link para o Mercado Pago
                            </p>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-3 justify-end pt-4 border-t">
                        <Button variant="ghost" onClick={() => setShowBillingModal(false)}>
                            Cancelar
                        </Button>
                        <Button onClick={handleSendBilling} loading={sending}>
                            <Send className="h-4 w-4 mr-2" />
                            Enviar Cobrança
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* Edit Value Modal */}
            <Modal
                isOpen={showEditModal}
                onClose={() => setShowEditModal(false)}
                title="Editar Valor Personalizado"
            >
                <div className="space-y-6">
                    {/* Info */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <p className="font-semibold text-blue-800">{editingSub?.condo?.nome}</p>
                        <p className="text-sm text-blue-600">Plano: {editingSub?.plan?.nome_plano}</p>
                        <p className="text-sm text-blue-500">Valor padrão do plano: {formatCurrency(editingSub?.plan?.valor_mensal || 0)}</p>
                    </div>

                    {/* Status Update */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Status da Assinatura
                        </label>
                        <Select
                            value={novoStatus}
                            onChange={(e) => setNovoStatus(e.target.value)}
                            options={[
                                { value: 'ativo', label: 'Ativo' },
                                { value: 'trialing', label: 'Em Teste (Trial)' },
                                { value: 'pendente_pagamento', label: 'Pendente Pagamento' },
                                { value: 'cancelado', label: 'Cancelado' },
                                { value: 'inativo', label: 'Inativo' },
                            ]}
                            className="w-full"
                        />
                        <p className="text-xs text-yellow-600 mt-1">
                            ⚠️ Alterar o status para Ativo, Trial ou Cancelado enviará um email automático para o síndico.
                        </p>
                    </div>

                    {/* Form */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Valor Mensal Personalizado (R$)
                        </label>
                        <Input
                            type="number"
                            step="0.01"
                            min="0"
                            value={novoValor}
                            onChange={(e) => setNovoValor(e.target.value)}
                            placeholder="Ex: 79.90"
                            className="text-lg font-bold"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            Deixe diferente do plano para aplicar desconto ou acréscimo
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Observações (opcional)
                        </label>
                        <Textarea
                            value={observacoes}
                            onChange={(e) => setObservacoes(e.target.value)}
                            rows={3}
                            placeholder="Ex: Desconto promocional 1º ano, Acréscimo por módulo extra..."
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 justify-end pt-4 border-t">
                        <Button variant="ghost" onClick={() => setShowEditModal(false)}>
                            Cancelar
                        </Button>
                        <Button onClick={handleSaveValue} loading={savingValue}>
                            <Save className="h-4 w-4 mr-2" />
                            Salvar Valor
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* Modal Cobrança Avulsa */}
            <Modal
                isOpen={showChargeModal}
                onClose={() => setShowChargeModal(false)}
                title="Nova Cobrança Avulsa"
            >
                <div className="space-y-6">
                    <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                        <p className="font-semibold text-emerald-800">{selectedSub?.condo?.nome}</p>
                        <p className="text-sm text-emerald-600">Síndico: {selectedSub?.condo?.email_contato}</p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Descrição da Cobrança *
                        </label>
                        <Input
                            value={chargeDescricao}
                            onChange={(e) => setChargeDescricao(e.target.value)}
                            placeholder="Ex: Taxa de Implantação, Configuração Inicial..."
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Valor (R$) *
                        </label>
                        <Input
                            type="number"
                            step="0.01"
                            min="0"
                            value={chargeValor}
                            onChange={(e) => setChargeValor(e.target.value)}
                            className="text-lg font-bold"
                            placeholder="0.00"
                        />
                    </div>

                    <div className="flex gap-3 justify-end pt-4 border-t">
                        <Button variant="ghost" onClick={() => setShowChargeModal(false)}>
                            Cancelar
                        </Button>
                        <Button onClick={handleCreateCharge} loading={charging}>
                            <PlusCircle className="h-4 w-4 mr-2" />
                            Criar Cobrança
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
