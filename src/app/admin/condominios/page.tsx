'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, Button, Input, Select, Table, Badge } from '@/components/ui';
import { Modal } from '@/components/ui/modal';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useMultiSelect } from '@/hooks/useMultiSelect';
import { formatCurrency, formatDate, getStatusColor, getStatusLabel } from '@/lib/utils';
import { Plus, Search, Building2, Edit, Trash2, Eye, Bot, LogIn, Package } from 'lucide-react';
import { Condo, Plan } from '@/types/database';

export default function AdminCondominiosPage() {
    const [condos, setCondos] = useState<Condo[]>([]);
    const [plans, setPlans] = useState<Plan[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingCondo, setEditingCondo] = useState<Condo | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const supabase = createClient();
    const { session } = useAuth();

    useEffect(() => {
        fetchCondos();
        fetchPlans();
    }, []);

    const fetchPlans = async () => {
        const { data } = await supabase.from('plans').select('*').eq('ativo', true);
        setPlans(data || []);
    };

    const fetchCondos = async () => {
        setLoading(true);
        const { data } = await supabase
            .from('condos')
            .select('*, plan:plans(*)')
            .neq('nome', 'Residencial Demo')
            .order('created_at', { ascending: false });
        setCondos(data || []);
        setLoading(false);
    };

    const filteredCondos = condos.filter(c => {
        const matchesSearch = c.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.cidade?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = !filterStatus || c.status === filterStatus;
        return matchesSearch && matchesStatus;
    });

    // Multi-select hook
    const {
        selectedIds,
        selectedCount,
        toggleSelect,
        toggleSelectAll,
        clearSelection,
        isSelected,
        isAllSelected,
        hasSelection
    } = useMultiSelect(filteredCondos);

    const handleDelete = async (id: string) => {
        if (!confirm('Deseja realmente excluir este condomínio?\n\nATENÇÃO: Todos os dados relacionados (unidades, moradores, financeiro, etc) serão excluídos permanentemente!')) return;

        try {
            const res = await fetch(`/api/admin/condos?id=${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${session?.access_token}`,
                },
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Erro ao excluir');
            }

            alert('Condomínio excluído com sucesso!');
            fetchCondos();
        } catch (error: any) {
            alert(`Erro ao excluir: ${error.message}`);
        }
    };

    const handleBulkDelete = async () => {
        if (!confirm(`Deseja realmente excluir ${selectedCount} condomínio(s)?\n\nATENÇÃO: Todos os dados relacionados serão excluídos permanentemente!`)) return;

        try {
            const deletePromises = Array.from(selectedIds).map(id =>
                fetch(`/api/admin/condos?id=${id}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${session?.access_token}` },
                })
            );

            await Promise.all(deletePromises);
            alert(`${selectedCount} condomínio(s) excluído(s) com sucesso!`);
            clearSelection();
            fetchCondos();
        } catch (error: any) {
            alert(`Erro ao excluir: ${error.message}`);
        }
    };

    const handleToggleAI = async (id: string, ativo: boolean) => {
        try {
            await supabase.from('condos').update({ ai_ativo: ativo }).eq('id', id);
            setCondos(prev => prev.map(c => c.id === id ? { ...c, ai_ativo: ativo } : c));
        } catch (error: any) {
            alert(`Erro ao atualizar IA: ${error.message}`);
        }
    };

    const handleToggleMensageria = async (id: string, ativo: boolean) => {
        try {
            await supabase.from('condos').update({ mensageria_ativo: ativo }).eq('id', id);
            setCondos(prev => prev.map(c => c.id === id ? { ...c, mensageria_ativo: ativo } : c));
        } catch (error: any) {
            alert(`Erro ao atualizar Mensageria: ${error.message}`);
        }
    };

    const handleToggleChatSindico = async (id: string, ativo: boolean) => {
        try {
            await supabase.from('condos').update({ chat_sindico_ativo: ativo }).eq('id', id);
            setCondos(prev => prev.map(c => c.id === id ? { ...c, chat_sindico_ativo: ativo } : c));
        } catch (error: any) {
            alert(`Erro ao atualizar Chat Síndico: ${error.message}`);
        }
    };

    // Impersonar síndico do condomínio
    const handleImpersonate = async (condoId: string, condoName: string) => {
        try {
            // 1. Buscar síndico vinculado ao condomínio
            const { data: sindico, error } = await supabase
                .from('users')
                .select('id, nome, email')
                .eq('condo_id', condoId)
                .eq('role', 'sindico')
                .eq('ativo', true)
                .single();

            if (error || !sindico) {
                alert(`❌ Nenhum síndico ativo encontrado para o condomínio "${condoName}".\n\nCadastre um síndico primeiro.`);
                return;
            }

            if (!confirm(`🔐 Acessar como:\n\nSíndico: ${sindico.nome}\nEmail: ${sindico.email}\nCondomínio: ${condoName}\n\nTodas as ações serão registradas para auditoria.`)) {
                return;
            }

            // 2. Iniciar impersonificação
            const res = await fetch('/api/impersonate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session?.access_token}`
                },
                credentials: 'include',
                body: JSON.stringify({ target_user_id: sindico.id })
            });

            const result = await res.json();

            if (!res.ok) {
                alert(`❌ ${result.error || 'Erro ao iniciar impersonificação'}`);
                return;
            }

            // 3. Redirecionar para o dashboard do síndico
            window.location.href = '/dashboard';
        } catch (err: any) {
            alert(`❌ Erro: ${err.message}`);
        }
    };

    const columns = [
        {
            key: 'checkbox',
            header: () => (
                <input
                    type="checkbox"
                    checked={isAllSelected()}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 text-emerald-600 rounded border-gray-300 focus:ring-emerald-500"
                />
            ),
            render: (c: Condo) => (
                <input
                    type="checkbox"
                    checked={isSelected(c.id)}
                    onChange={() => toggleSelect(c.id)}
                    onClick={(e) => e.stopPropagation()}
                    className="w-4 h-4 text-emerald-600 rounded border-gray-300 focus:ring-emerald-500"
                />
            ),
            className: 'w-12'
        },
        {
            key: 'condo_numero',
            header: 'ID Condo',
            render: (c: Condo) => c.condo_numero ? (
                <span className="px-2 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-bold">
                    #{c.condo_numero}
                </span>
            ) : '-'
        },
        {
            key: 'nome',
            header: 'Condomínio',
            render: (c: Condo) => (
                <div>
                    <div className="flex items-center gap-2">
                        <p className="font-medium text-gray-900">{c.nome}</p>
                        {c.status === 'teste' && (
                            <span className="px-2 py-0.5 bg-yellow-100 text-yellow-800 rounded-full text-xs font-bold animate-pulse">
                                🧪 TRIAL
                            </span>
                        )}
                    </div>
                    <p className="text-sm text-gray-500">
                        {[c.cidade, c.estado].filter(Boolean).join(', ') || '-'}
                    </p>
                </div>
            )
        },
        { key: 'cnpj', header: 'CNPJ', render: (c: Condo) => c.cnpj || '-' },
        {
            key: 'plan',
            header: 'Plano',
            render: (c: Condo) => c.plan?.nome_plano || '-'
        },
        {
            key: 'status',
            header: 'Status',
            render: (c: Condo) => (
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(c.status)}`}>
                    {getStatusLabel(c.status)}
                </span>
            )
        },
        { key: 'data_inicio', header: 'Criado em', render: (c: Condo) => formatDate(c.data_inicio) },
        {
            key: 'data_fim_teste',
            header: 'Fim Trial',
            render: (c: Condo) => c.data_fim_teste ? formatDate(c.data_fim_teste) : '-'
        },
        {
            key: 'ai_ativo',
            header: 'IA',
            className: 'text-center',
            render: (c: Condo) => (
                <button
                    onClick={(e) => { e.stopPropagation(); handleToggleAI(c.id, !c.ai_ativo); }}
                    className={`relative w-11 h-6 rounded-full transition-colors ${c.ai_ativo ? 'bg-purple-600' : 'bg-gray-300'}`}
                    title={c.ai_ativo ? 'IA Ativa - Clique para desativar' : 'IA Inativa - Clique para ativar'}
                >
                    <span
                        className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${c.ai_ativo ? 'right-0.5' : 'left-0.5'}`}
                    />
                </button>
            )
        },
        {
            key: 'mensageria_ativo',
            header: '📦',
            className: 'text-center',
            render: (c: Condo) => (
                <button
                    onClick={(e) => { e.stopPropagation(); handleToggleMensageria(c.id, !(c as any).mensageria_ativo); }}
                    className={`relative w-11 h-6 rounded-full transition-colors ${(c as any).mensageria_ativo ? 'bg-orange-500' : 'bg-gray-300'}`}
                    title={(c as any).mensageria_ativo ? 'Mensageria Ativa - Clique para desativar' : 'Mensageria Inativa - Clique para ativar'}
                >
                    <span
                        className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${(c as any).mensageria_ativo ? 'right-0.5' : 'left-0.5'}`}
                    />
                </button>
            )
        },
        {
            key: 'chat_sindico_ativo',
            header: '💬',
            className: 'text-center',
            render: (c: Condo) => (
                <button
                    onClick={(e) => { e.stopPropagation(); handleToggleChatSindico(c.id, !(c as any).chat_sindico_ativo); }}
                    className={`relative w-11 h-6 rounded-full transition-colors ${(c as any).chat_sindico_ativo ? 'bg-blue-500' : 'bg-gray-300'}`}
                    title={(c as any).chat_sindico_ativo ? 'Chat Síndico Ativo (R$29,90) - Clique para desativar' : 'Chat Síndico Inativo - Clique para ativar (R$29,90)'}
                >
                    <span
                        className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${(c as any).chat_sindico_ativo ? 'right-0.5' : 'left-0.5'}`}
                    />
                </button>
            )
        },
        {
            key: 'actions',
            header: '',
            className: 'text-right',
            render: (c: Condo) => (
                <div className="flex gap-1 justify-end">
                    <button
                        onClick={(e) => { e.stopPropagation(); handleImpersonate(c.id, c.nome); }}
                        className="p-1.5 hover:bg-orange-50 rounded"
                        title="Acessar como Síndico"
                    >
                        <LogIn className="h-4 w-4 text-orange-500" />
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); setEditingCondo(c); setShowModal(true); }}
                        className="p-1.5 hover:bg-gray-100 rounded"
                        title="Editar"
                    >
                        <Edit className="h-4 w-4 text-gray-500" />
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); handleDelete(c.id); }}
                        className="p-1.5 hover:bg-red-50 rounded"
                        title="Excluir"
                    >
                        <Trash2 className="h-4 w-4 text-red-500" />
                    </button>
                </div>
            )
        },
    ];

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Condomínios</h1>
                    <p className="text-gray-500">Gerencie todos os condomínios da plataforma</p>
                </div>
                <div className="flex gap-2">
                    {hasSelection() && (
                        <Button variant="ghost" onClick={handleBulkDelete} className="bg-red-50 text-red-600 hover:bg-red-100">
                            <Trash2 className="h-4 w-4 mr-2" />
                            Excluir {selectedCount} {selectedCount === 1 ? 'Selecionado' : 'Selecionados'}
                        </Button>
                    )}
                    <Button onClick={() => { setEditingCondo(null); setShowModal(true); }}>
                        <Plus className="h-4 w-4 mr-2" />
                        Novo Condomínio
                    </Button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0">
                    <CardContent className="py-4 text-center">
                        <Building2 className="h-8 w-8 mx-auto opacity-80 mb-2" />
                        <p className="text-2xl font-bold">{condos.length}</p>
                        <p className="text-sm text-blue-100">Total</p>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white border-0">
                    <CardContent className="py-4 text-center">
                        <p className="text-2xl font-bold">{condos.filter(c => c.status === 'ativo').length}</p>
                        <p className="text-sm text-emerald-100">Ativos</p>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0">
                    <CardContent className="py-4 text-center">
                        <p className="text-2xl font-bold">{condos.filter(c => c.status === 'teste').length}</p>
                        <p className="text-sm text-purple-100">Em Trial</p>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-red-500 to-red-600 text-white border-0">
                    <CardContent className="py-4 text-center">
                        <p className="text-2xl font-bold">{condos.filter(c => c.status === 'suspenso').length}</p>
                        <p className="text-sm text-red-100">Suspensos</p>
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
                        placeholder="Buscar por nome ou cidade..."
                        className="pl-10"
                    />
                </div>
                <Select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    options={[
                        { value: '', label: 'Todos os status' },
                        { value: 'ativo', label: 'Ativo' },
                        { value: 'teste', label: 'Em Trial' },
                        { value: 'suspenso', label: 'Suspenso' },
                    ]}
                    className="w-40"
                />
            </div>

            {/* Table */}
            <Card>
                <CardContent className="p-0">
                    <Table
                        data={filteredCondos}
                        columns={columns}
                        loading={loading}
                        emptyMessage="Nenhum condomínio cadastrado"
                    />
                </CardContent>
            </Card>

            {/* Modal */}
            <CondoModal
                isOpen={showModal}
                onClose={() => { setShowModal(false); setEditingCondo(null); }}
                onSuccess={fetchCondos}
                condo={editingCondo}
                plans={plans}
            />
        </div>
    );
}

function CondoModal({ isOpen, onClose, onSuccess, condo, plans }: {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    condo: Condo | null;
    plans: Plan[];
}) {
    const [loading, setLoading] = useState(false);
    const [nome, setNome] = useState('');
    const [cnpj, setCnpj] = useState('');
    const [endereco, setEndereco] = useState('');
    const [cidade, setCidade] = useState('');
    const [estado, setEstado] = useState('');
    const [cep, setCep] = useState('');
    const [telefone, setTelefone] = useState('');
    const [emailContato, setEmailContato] = useState('');
    const [planoId, setPlanoId] = useState('');
    const [status, setStatus] = useState('teste');
    const [dataFimTeste, setDataFimTeste] = useState('');

    // Campos do Síndico (só para novo condo)
    const [criarSindico, setCriarSindico] = useState(true);
    const [sindicoNome, setSindicoNome] = useState('');
    const [sindicoEmail, setSindicoEmail] = useState('');
    const [sindicoTelefone, setSindicoTelefone] = useState('');
    const [sindicoSenha, setSindicoSenha] = useState('');

    const supabase = createClient();
    const { session } = useAuth();

    useEffect(() => {
        if (condo) {
            setNome(condo.nome);
            setCnpj(condo.cnpj || '');
            setEndereco(condo.endereco || '');
            setCidade(condo.cidade || '');
            setEstado(condo.estado || '');
            setCep(condo.cep || '');
            setTelefone(condo.telefone || '');
            setEmailContato(condo.email_contato || '');
            setPlanoId(condo.plano_id || '');
            setStatus(condo.status);
            setDataFimTeste(condo.data_fim_teste?.split('T')[0] || '');
        } else {
            // Default: 14 days trial
            const trialEnd = new Date();
            trialEnd.setDate(trialEnd.getDate() + 14);

            setNome('');
            setCnpj('');
            setEndereco('');
            setCidade('');
            setEstado('');
            setCep('');
            setTelefone('');
            setEmailContato('');
            setPlanoId('');
            setStatus('teste');
            setDataFimTeste(trialEnd.toISOString().split('T')[0]);
            // Reset síndico
            setCriarSindico(true);
            setSindicoNome('');
            setSindicoEmail('');
            setSindicoTelefone('');
            // Gerar senha aleatória
            const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
            let senha = '';
            for (let i = 0; i < 8; i++) { senha += chars.charAt(Math.floor(Math.random() * chars.length)); }
            setSindicoSenha(senha);
        }
    }, [condo]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const data = {
                nome,
                cnpj: cnpj || null,
                endereco: endereco || null,
                cidade: cidade || null,
                estado: estado || null,
                cep: cep || null,
                telefone: telefone || null,
                email_contato: emailContato || null,
                plano_id: planoId || null,
                status,
                data_fim_teste: dataFimTeste || null,
            };

            const previousStatus = condo?.status;
            let insertedCondoId = condo?.id;

            if (condo) {
                const { error } = await supabase.from('condos').update(data).eq('id', condo.id);
                if (error) throw error;
            } else {
                const { data: insertedData, error } = await supabase.from('condos').insert(data).select('id').single();
                if (error) throw error;
                insertedCondoId = insertedData?.id;
            }

            // Enviar e-mail quando status muda ou novo condomínio é criado
            const statusChanged = previousStatus !== status || !condo;
            const hasEmail = emailContato && emailContato.trim() !== '';

            if (statusChanged && hasEmail && insertedCondoId) {
                try {
                    // Buscar plano selecionado
                    const selectedPlan = plans.find(p => p.id === planoId);

                    // Definir template baseado no status
                    let emailType = '';
                    let emailData: any = {
                        nome: nome,
                        condoNome: nome,
                        loginUrl: 'https://meucondominiofacil.com/login'
                    };

                    if (status === 'teste') {
                        emailType = 'condo_trial';
                        emailData.dataFim = dataFimTeste ? new Date(dataFimTeste).toLocaleDateString('pt-BR') : '';
                    } else if (status === 'ativo') {
                        emailType = 'condo_active';
                        emailData.plano = selectedPlan?.nome_plano || 'Profissional';
                        // Próximo vencimento: 30 dias a partir de hoje
                        const nextDate = new Date();
                        nextDate.setDate(nextDate.getDate() + 30);
                        emailData.proximoVencimento = nextDate.toLocaleDateString('pt-BR');
                    } else if (status === 'suspenso') {
                        emailType = 'condo_suspended';
                    }

                    if (emailType) {
                        const response = await fetch('/api/email', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                tipo: emailType,
                                destinatario: emailContato,
                                dados: emailData,
                                condoId: insertedCondoId,
                                internalCall: true
                            })
                        });

                        if (response.ok) {
                            console.log(`[CONDO] Email ${emailType} enviado para ${emailContato}`);
                        } else {
                            console.error(`[CONDO] Falha ao enviar email ${emailType}`);
                        }
                    }
                } catch (emailError) {
                    console.error('[CONDO] Erro ao enviar email:', emailError);
                    // Não bloquear a operação por falha de email
                }
            }

            // Criar síndico se solicitado (só para novo condo)
            if (!condo && criarSindico && sindicoEmail && sindicoNome && insertedCondoId) {
                try {
                    const response = await fetch('/api/usuarios/create', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${session?.access_token}`,
                        },
                        body: JSON.stringify({
                            email: sindicoEmail,
                            password: sindicoSenha,
                            nome: sindicoNome,
                            telefone: sindicoTelefone || null,
                            role: 'sindico',
                            condo_id: insertedCondoId,
                        }),
                    });

                    const result = await response.json();
                    if (result.success) {
                        console.log('[CONDO] Síndico criado com sucesso:', sindicoEmail);
                    } else {
                        console.error('[CONDO] Erro ao criar síndico:', result.error);
                        alert('Condomínio criado, mas houve erro ao criar síndico: ' + result.error);
                    }
                } catch (err: any) {
                    console.error('[CONDO] Erro ao criar síndico:', err);
                }
            }

            onSuccess();
            onClose();
        } catch (error: any) {
            console.error('Erro ao salvar condomínio:', error);
            alert(`Erro ao salvar condomínio: ${error.message || 'Erro desconhecido'}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={condo ? 'Editar Condomínio' : 'Novo Condomínio'} size="lg">
            <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto">
                <Input
                    label="Nome do Condomínio"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    placeholder="Ex: Residencial Vista Verde"
                    required
                />

                <div className="grid grid-cols-2 gap-4">
                    <Input
                        label="CNPJ"
                        value={cnpj}
                        onChange={(e) => setCnpj(e.target.value)}
                        placeholder="00.000.000/0000-00"
                    />
                    <Input
                        label="Telefone"
                        value={telefone}
                        onChange={(e) => {
                            // Formatar telefone com (DDD)
                            let value = e.target.value.replace(/\D/g, '');
                            if (value.length > 0) {
                                if (value.length <= 2) {
                                    value = `(${value}`;
                                } else if (value.length <= 6) {
                                    value = `(${value.slice(0, 2)}) ${value.slice(2)}`;
                                } else if (value.length <= 10) {
                                    value = `(${value.slice(0, 2)}) ${value.slice(2, 6)}-${value.slice(6)}`;
                                } else {
                                    value = `(${value.slice(0, 2)}) ${value.slice(2, 7)}-${value.slice(7, 11)}`;
                                }
                            }
                            setTelefone(value);
                        }}
                        placeholder="(11) 99999-9999"
                    />
                </div>

                <Input
                    label="Email de Contato"
                    type="email"
                    value={emailContato}
                    onChange={(e) => setEmailContato(e.target.value)}
                    placeholder="contato@condominio.com"
                />

                <Input
                    label="Endereço"
                    value={endereco}
                    onChange={(e) => setEndereco(e.target.value)}
                    placeholder="Rua, número, bairro"
                />

                <div className="grid grid-cols-3 gap-4">
                    <Input
                        label="Cidade"
                        value={cidade}
                        onChange={(e) => setCidade(e.target.value)}
                        placeholder="São Paulo"
                    />
                    <Input
                        label="Estado"
                        value={estado}
                        onChange={(e) => setEstado(e.target.value)}
                        placeholder="SP"
                    />
                    <Input
                        label="CEP"
                        value={cep}
                        onChange={(e) => setCep(e.target.value)}
                        placeholder="00000-000"
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <Select
                        label="Plano"
                        value={planoId}
                        onChange={(e) => setPlanoId(e.target.value)}
                        options={plans.map(p => ({ value: p.id, label: `${p.nome_plano} - ${formatCurrency(p.valor_mensal)}/mês` }))}
                        placeholder="Selecione um plano"
                    />
                    <Select
                        label="Status"
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                        options={[
                            { value: 'ativo', label: 'Ativo' },
                            { value: 'teste', label: 'Período de Teste' },
                            { value: 'suspenso', label: 'Suspenso' },
                        ]}
                        required
                    />
                </div>

                {status === 'teste' && (
                    <Input
                        label="Data Fim do Trial"
                        type="date"
                        value={dataFimTeste}
                        onChange={(e) => setDataFimTeste(e.target.value)}
                    />
                )}

                {/* Seção Síndico - só para novo condo */}
                {!condo && (
                    <div className="border-t pt-4 mt-4">
                        <div className="flex items-center gap-2 mb-4">
                            <input
                                type="checkbox"
                                id="criarSindico"
                                checked={criarSindico}
                                onChange={(e) => setCriarSindico(e.target.checked)}
                                className="w-4 h-4 text-emerald-600 rounded border-gray-300"
                            />
                            <label htmlFor="criarSindico" className="text-sm font-medium text-gray-700">
                                Criar usuário Síndico para este condomínio
                            </label>
                        </div>

                        {criarSindico && (
                            <div className="space-y-3 bg-gray-50 p-4 rounded-lg">
                                <Input
                                    label="Nome do Síndico"
                                    value={sindicoNome}
                                    onChange={(e) => setSindicoNome(e.target.value)}
                                    placeholder="Nome completo"
                                    required={criarSindico}
                                />
                                <div className="grid grid-cols-2 gap-3">
                                    <Input
                                        label="Email do Síndico"
                                        type="email"
                                        value={sindicoEmail}
                                        onChange={(e) => setSindicoEmail(e.target.value)}
                                        placeholder="sindico@email.com"
                                        required={criarSindico}
                                    />
                                    <Input
                                        label="Telefone"
                                        value={sindicoTelefone}
                                        onChange={(e) => setSindicoTelefone(e.target.value)}
                                        placeholder="(00) 00000-0000"
                                    />
                                </div>
                                <Input
                                    label="Senha Inicial"
                                    value={sindicoSenha}
                                    onChange={(e) => setSindicoSenha(e.target.value)}
                                    placeholder="Mínimo 6 caracteres"
                                    required={criarSindico}
                                />
                                <p className="text-xs text-gray-500">
                                    O síndico receberá um email com as credenciais de acesso.
                                </p>
                            </div>
                        )}
                    </div>
                )}

                <div className="flex gap-3 justify-end pt-4">
                    <Button type="button" variant="ghost" onClick={onClose}>
                        Cancelar
                    </Button>
                    <Button type="submit" loading={loading}>
                        {condo ? 'Salvar' : 'Criar'}
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
