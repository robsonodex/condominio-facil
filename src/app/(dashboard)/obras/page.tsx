'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Hammer, Plus, FileText, Clock, CheckCircle, XCircle, AlertTriangle, Upload, User, X } from 'lucide-react';
import { format } from 'date-fns';

interface Reform {
    id: string;
    descricao: string;
    tipo_obra: string;
    art_rrt_url: string;
    inicio_previsto: string | null;
    fim_previsto: string | null;
    status: 'analise' | 'pendente' | 'autorizada' | 'rejeitada' | 'em_andamento' | 'concluida' | 'cancelada';
    motivo_rejeicao: string | null;
    observacoes_sindico: string | null;
    created_at: string;
    units?: { identificacao: string };
    solicitante?: { nome: string };
}

interface Unit {
    id: string;
    identificacao: string;
}

export default function ObrasPage() {
    const [reforms, setReforms] = useState<Reform[]>([]);
    const [units, setUnits] = useState<Unit[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showApprovalModal, setShowApprovalModal] = useState(false);
    const [selectedReform, setSelectedReform] = useState<Reform | null>(null);
    const [condoId, setCondoId] = useState<string | null>(null);
    const [userRole, setUserRole] = useState<string>('morador');
    const [userId, setUserId] = useState<string | null>(null);

    // Form states
    const [unitId, setUnitId] = useState('');
    const [descricao, setDescricao] = useState('');
    const [tipoObra, setTipoObra] = useState('reforma');
    const [inicioPrevisto, setInicioPrevisto] = useState('');
    const [fimPrevisto, setFimPrevisto] = useState('');
    const [artFile, setArtFile] = useState<File | null>(null);
    const [saving, setSaving] = useState(false);

    // Approval form
    const [approvalAction, setApprovalAction] = useState<'autorizada' | 'pendente' | 'rejeitada'>('autorizada');
    const [observacoesSindico, setObservacoesSindico] = useState('');

    const supabase = createClient();

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            setUserId(user.id);

            const { data: profile } = await supabase
                .from('users')
                .select('condo_id, role')
                .eq('id', user.id)
                .single();

            if (profile?.condo_id) {
                setCondoId(profile.condo_id);
                setUserRole(profile.role);

                const { data: reformsData } = await supabase
                    .from('unit_reforms')
                    .select(`*, units (identificacao), solicitante:users!unit_reforms_solicitante_id_fkey (nome)`)
                    .eq('condo_id', profile.condo_id)
                    .order('created_at', { ascending: false });

                setReforms(reformsData || []);

                // Para moradores, busca sua unidade específica; síndico vê todas
                if (profile.role === 'morador' || profile.role === 'inquilino') {
                    // Buscar unidade vinculada ao morador
                    const { data: userWithUnit } = await supabase
                        .from('users')
                        .select('unit_id')
                        .eq('id', user.id)
                        .single();

                    if (userWithUnit?.unit_id) {
                        const { data: unitsData } = await supabase
                            .from('units')
                            .select('id, identificacao')
                            .eq('id', userWithUnit.unit_id);
                        setUnits(unitsData || []);
                    } else {
                        // Se não tem unidade vinculada, tenta buscar todas do condomínio
                        const { data: unitsData } = await supabase
                            .from('units')
                            .select('id, identificacao')
                            .eq('condo_id', profile.condo_id)
                            .order('identificacao');
                        setUnits(unitsData || []);
                    }
                } else {
                    // Síndico/admin vê todas as unidades
                    const { data: unitsData } = await supabase
                        .from('units')
                        .select('id, identificacao')
                        .eq('condo_id', profile.condo_id)
                        .order('identificacao');
                    setUnits(unitsData || []);
                }
            }
        } catch (error) {
            console.error('Erro ao carregar:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!condoId || !unitId || !descricao || !artFile) return;

        setSaving(true);
        try {
            const fileName = `${condoId}/obras/${Date.now()}_${artFile.name}`;
            const { error: uploadError } = await supabase.storage
                .from('documents')
                .upload(fileName, artFile);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('documents')
                .getPublicUrl(fileName);

            const { error } = await supabase
                .from('unit_reforms')
                .insert({
                    condo_id: condoId,
                    unit_id: unitId,
                    solicitante_id: userId,
                    descricao,
                    tipo_obra: tipoObra,
                    art_rrt_url: publicUrl,
                    inicio_previsto: inicioPrevisto || null,
                    fim_previsto: fimPrevisto || null,
                    status: 'analise',
                });

            if (error) throw error;

            setUnitId('');
            setDescricao('');
            setTipoObra('reforma');
            setInicioPrevisto('');
            setFimPrevisto('');
            setArtFile(null);
            setShowModal(false);
            loadData();

            alert('✅ Solicitação de obra enviada para análise!');
        } catch (error: any) {
            console.error('Erro ao salvar:', error);
            alert('❌ Erro: ' + error.message);
        } finally {
            setSaving(false);
        }
    };

    const handleApproval = async () => {
        if (!selectedReform) return;

        setSaving(true);
        try {
            const updateData: any = {
                status: approvalAction,
                observacoes_sindico: observacoesSindico || null,
            };

            if (approvalAction === 'autorizada') {
                updateData.aprovado_por = userId;
                updateData.aprovado_em = new Date().toISOString();
            }

            if (approvalAction === 'rejeitada') {
                updateData.motivo_rejeicao = observacoesSindico;
            }

            const { error } = await supabase
                .from('unit_reforms')
                .update(updateData)
                .eq('id', selectedReform.id);

            if (error) throw error;

            setShowApprovalModal(false);
            setSelectedReform(null);
            setObservacoesSindico('');
            loadData();

            alert(`✅ Obra ${approvalAction === 'autorizada' ? 'aprovada' : approvalAction === 'rejeitada' ? 'rejeitada' : 'devolvida'}!`);
        } catch (error: any) {
            alert('❌ Erro: ' + error.message);
        } finally {
            setSaving(false);
        }
    };

    const getStatusBadge = (status: string) => {
        const badges: Record<string, { icon: any; color: string; label: string }> = {
            analise: { icon: Clock, color: 'bg-blue-100 text-blue-700', label: 'Em Análise' },
            pendente: { icon: AlertTriangle, color: 'bg-amber-100 text-amber-700', label: 'Pendente' },
            autorizada: { icon: CheckCircle, color: 'bg-emerald-100 text-emerald-700', label: 'Autorizada' },
            rejeitada: { icon: XCircle, color: 'bg-red-100 text-red-700', label: 'Rejeitada' },
            em_andamento: { icon: Hammer, color: 'bg-purple-100 text-purple-700', label: 'Em Andamento' },
            concluida: { icon: CheckCircle, color: 'bg-gray-100 text-gray-700', label: 'Concluída' },
        };
        const badge = badges[status] || badges.analise;
        const Icon = badge.icon;
        return (
            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${badge.color}`}>
                <Icon className="h-3 w-3" /> {badge.label}
            </span>
        );
    };

    const isSindico = userRole === 'sindico' || userRole === 'superadmin';

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-amber-100 rounded-lg">
                        <Hammer className="h-6 w-6 text-amber-600" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Obras e Reformas</h1>
                        <p className="text-sm text-gray-500">Gestão de reformas (NBR 16.280)</p>
                    </div>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700"
                >
                    <Plus className="h-4 w-4" /> Nova Solicitação
                </button>
            </div>

            {/* Lista */}
            {reforms.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm p-12 text-center border">
                    <Hammer className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 mb-4">Nenhuma obra cadastrada</p>
                    <button
                        onClick={() => setShowModal(true)}
                        className="inline-flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700"
                    >
                        <Plus className="h-4 w-4" /> Solicitar Obra
                    </button>
                </div>
            ) : (
                <div className="grid gap-4">
                    {reforms.map((reform) => (
                        <div key={reform.id} className="bg-white rounded-xl shadow-sm p-6 border">
                            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <span className="font-medium text-gray-900">
                                            {reform.units?.identificacao || 'Unidade'}
                                        </span>
                                        {getStatusBadge(reform.status)}
                                    </div>
                                    <p className="text-gray-600 mb-2">{reform.descricao}</p>
                                    <div className="text-sm text-gray-500">
                                        <span className="capitalize">{reform.tipo_obra}</span>
                                        {reform.inicio_previsto && (
                                            <> · {format(new Date(reform.inicio_previsto), 'dd/MM/yyyy')}</>
                                        )}
                                        {reform.solicitante?.nome && (
                                            <> · {reform.solicitante.nome}</>
                                        )}
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <a
                                        href={reform.art_rrt_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-2 px-3 py-1.5 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 text-sm"
                                    >
                                        <FileText className="h-4 w-4" /> ART/RRT
                                    </a>
                                    {isSindico && reform.status === 'analise' && (
                                        <button
                                            onClick={() => {
                                                setSelectedReform(reform);
                                                setShowApprovalModal(true);
                                            }}
                                            className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-sm"
                                        >
                                            Analisar
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal Nova Solicitação */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between p-4 border-b">
                            <h2 className="text-lg font-semibold">Solicitar Obra/Reforma</h2>
                            <button onClick={() => setShowModal(false)} className="p-1 hover:bg-gray-100 rounded">
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-4 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Unidade</label>
                                <select
                                    value={unitId}
                                    onChange={(e) => setUnitId(e.target.value)}
                                    required
                                    className="w-full rounded-lg border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
                                >
                                    <option value="">Selecione...</option>
                                    {units.map((unit) => (
                                        <option key={unit.id} value={unit.id}>{unit.identificacao}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                                <select
                                    value={tipoObra}
                                    onChange={(e) => setTipoObra(e.target.value)}
                                    className="w-full rounded-lg border-gray-300 shadow-sm"
                                >
                                    <option value="reforma">Reforma</option>
                                    <option value="manutencao">Manutenção</option>
                                    <option value="instalacao">Instalação</option>
                                    <option value="estrutural">Estrutural</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                                <textarea
                                    value={descricao}
                                    onChange={(e) => setDescricao(e.target.value)}
                                    required
                                    rows={3}
                                    className="w-full rounded-lg border-gray-300 shadow-sm"
                                    placeholder="Descreva a obra..."
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Início</label>
                                    <input
                                        type="date"
                                        value={inicioPrevisto}
                                        onChange={(e) => setInicioPrevisto(e.target.value)}
                                        className="w-full rounded-lg border-gray-300 shadow-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Fim</label>
                                    <input
                                        type="date"
                                        value={fimPrevisto}
                                        onChange={(e) => setFimPrevisto(e.target.value)}
                                        className="w-full rounded-lg border-gray-300 shadow-sm"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    ART/RRT <span className="text-red-500">*</span>
                                </label>
                                <label className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-emerald-400 hover:bg-emerald-50">
                                    <Upload className="h-5 w-5 text-gray-400" />
                                    <span className="text-sm text-gray-600">
                                        {artFile ? artFile.name : 'Selecionar arquivo...'}
                                    </span>
                                    <input
                                        type="file"
                                        accept=".pdf,.jpg,.png"
                                        className="hidden"
                                        onChange={(e) => setArtFile(e.target.files?.[0] || null)}
                                        required
                                    />
                                </label>
                            </div>

                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
                                <strong>NBR 16.280:</strong> Upload de ART/RRT é obrigatório.
                            </div>

                            <div className="flex justify-end gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving || !unitId || !descricao || !artFile}
                                    className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50"
                                >
                                    {saving ? 'Enviando...' : 'Solicitar'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal Aprovação */}
            {showApprovalModal && selectedReform && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl max-w-lg w-full">
                        <div className="flex items-center justify-between p-4 border-b">
                            <h2 className="text-lg font-semibold">Analisar Solicitação</h2>
                            <button onClick={() => setShowApprovalModal(false)} className="p-1 hover:bg-gray-100 rounded">
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        <div className="p-4 space-y-4">
                            <div className="p-4 bg-gray-50 rounded-lg">
                                <p className="font-medium">{selectedReform.units?.identificacao}</p>
                                <p className="text-gray-600 text-sm">{selectedReform.descricao}</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Decisão</label>
                                <div className="flex gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setApprovalAction('autorizada')}
                                        className={`flex-1 p-3 rounded-lg border-2 text-center ${approvalAction === 'autorizada' ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200'}`}
                                    >
                                        <CheckCircle className={`h-5 w-5 mx-auto mb-1 ${approvalAction === 'autorizada' ? 'text-emerald-600' : 'text-gray-400'}`} />
                                        <span className="text-sm font-medium">Aprovar</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setApprovalAction('pendente')}
                                        className={`flex-1 p-3 rounded-lg border-2 text-center ${approvalAction === 'pendente' ? 'border-amber-500 bg-amber-50' : 'border-gray-200'}`}
                                    >
                                        <AlertTriangle className={`h-5 w-5 mx-auto mb-1 ${approvalAction === 'pendente' ? 'text-amber-600' : 'text-gray-400'}`} />
                                        <span className="text-sm font-medium">Ajuste</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setApprovalAction('rejeitada')}
                                        className={`flex-1 p-3 rounded-lg border-2 text-center ${approvalAction === 'rejeitada' ? 'border-red-500 bg-red-50' : 'border-gray-200'}`}
                                    >
                                        <XCircle className={`h-5 w-5 mx-auto mb-1 ${approvalAction === 'rejeitada' ? 'text-red-600' : 'text-gray-400'}`} />
                                        <span className="text-sm font-medium">Rejeitar</span>
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Observações</label>
                                <textarea
                                    value={observacoesSindico}
                                    onChange={(e) => setObservacoesSindico(e.target.value)}
                                    rows={3}
                                    className="w-full rounded-lg border-gray-300 shadow-sm"
                                    required={approvalAction === 'rejeitada'}
                                />
                            </div>

                            <div className="flex justify-end gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowApprovalModal(false)}
                                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleApproval}
                                    disabled={saving}
                                    className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50"
                                >
                                    {saving ? 'Salvando...' : 'Confirmar'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
