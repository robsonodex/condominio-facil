'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, Button, Input } from '@/components/ui';
import { Modal } from '@/components/ui/modal';
import { Building2, Plus, FileText, AlertTriangle, CheckCircle, Clock, Upload } from 'lucide-react';
import { format, addYears, differenceInMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Inspection {
    id: string;
    data_realizacao: string;
    data_limite_proxima: string;
    engenheiro_responsavel: string;
    crea_cau_numero: string;
    status: 'vigente' | 'proximo_vencimento' | 'vencida';
    laudo_url: string | null;
    comunicado_prefeitura_url: string | null;
    observacoes: string | null;
}

export default function AutovistoriaPage() {
    const supabase = createClient();
    const [inspections, setInspections] = useState<Inspection[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [condoId, setCondoId] = useState<string | null>(null);

    // Form states
    const [dataRealizacao, setDataRealizacao] = useState('');
    const [engenheiro, setEngenheiro] = useState('');
    const [creaCau, setCreaCau] = useState('');
    const [observacoes, setObservacoes] = useState('');
    const [laudoFile, setLaudoFile] = useState<File | null>(null);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data: profile } = await supabase
                .from('users')
                .select('condo_id')
                .eq('id', user.id)
                .single();

            if (profile?.condo_id) {
                setCondoId(profile.condo_id);

                const { data } = await supabase
                    .from('building_inspections')
                    .select('*')
                    .eq('condo_id', profile.condo_id)
                    .order('data_realizacao', { ascending: false });

                setInspections(data || []);
            }
        } catch (error) {
            console.error('Erro ao carregar vistorias:', error);
        } finally {
            setLoading(false);
        }
    };

    const calculateStatus = (dataLimite: string): 'vigente' | 'proximo_vencimento' | 'vencida' => {
        const limite = new Date(dataLimite);
        const hoje = new Date();
        const mesesRestantes = differenceInMonths(limite, hoje);

        if (mesesRestantes < 0) return 'vencida';
        if (mesesRestantes <= 6) return 'proximo_vencimento';
        return 'vigente';
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!condoId || !dataRealizacao) return;

        setSaving(true);
        try {
            // Calcular data limite (+5 anos)
            const dataLimite = addYears(new Date(dataRealizacao), 5).toISOString().split('T')[0];
            const status = calculateStatus(dataLimite);

            // Upload do laudo se houver
            let laudoUrl = null;
            if (laudoFile) {
                const fileName = `${condoId}/autovistoria/${Date.now()}_${laudoFile.name}`;
                const { data: uploadData, error: uploadError } = await supabase.storage
                    .from('documents')
                    .upload(fileName, laudoFile);

                if (!uploadError && uploadData) {
                    const { data: { publicUrl } } = supabase.storage
                        .from('documents')
                        .getPublicUrl(fileName);
                    laudoUrl = publicUrl;
                }
            }

            const { error } = await supabase
                .from('building_inspections')
                .insert({
                    condo_id: condoId,
                    data_realizacao: dataRealizacao,
                    data_limite_proxima: dataLimite,
                    engenheiro_responsavel: engenheiro || null,
                    crea_cau_numero: creaCau || null,
                    status,
                    laudo_url: laudoUrl,
                    observacoes: observacoes || null,
                });

            if (error) throw error;

            // Reset form
            setDataRealizacao('');
            setEngenheiro('');
            setCreaCau('');
            setObservacoes('');
            setLaudoFile(null);
            setShowModal(false);
            loadData();

            alert('✅ Vistoria cadastrada com sucesso!');
        } catch (error: any) {
            console.error('Erro ao salvar:', error);
            alert('❌ Erro ao salvar: ' + error.message);
        } finally {
            setSaving(false);
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'vigente':
                return (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium">
                        <CheckCircle className="h-3 w-3" /> Vigente
                    </span>
                );
            case 'proximo_vencimento':
                return (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-medium">
                        <Clock className="h-3 w-3" /> Próximo ao Vencimento
                    </span>
                );
            case 'vencida':
                return (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">
                        <AlertTriangle className="h-3 w-3" /> Vencida
                    </span>
                );
            default:
                return null;
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <Building2 className="h-6 w-6 text-emerald-600" />
                        <h1 className="text-2xl font-bold text-gray-900">Autovistoria Predial</h1>
                    </div>
                    <p className="text-gray-500">
                        Controle de vistorias obrigatórias (Lei 6.400/RJ)
                    </p>
                </div>
                <Button onClick={() => setShowModal(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Nova Vistoria
                </Button>
            </div>

            {/* Alerta se houver vistoria vencida ou próxima */}
            {inspections.some(i => i.status === 'vencida') && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                    <div>
                        <p className="font-medium text-red-800">Autovistoria Vencida!</p>
                        <p className="text-sm text-red-600">
                            Seu condomínio está com a autovistoria vencida. Providencie uma nova vistoria urgentemente para evitar multas.
                        </p>
                    </div>
                </div>
            )}

            {inspections.some(i => i.status === 'proximo_vencimento') && !inspections.some(i => i.status === 'vencida') && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
                    <Clock className="h-5 w-5 text-amber-600 mt-0.5" />
                    <div>
                        <p className="font-medium text-amber-800">Autovistoria próxima do vencimento</p>
                        <p className="text-sm text-amber-600">
                            A autovistoria vence em menos de 6 meses. Comece a providenciar a renovação.
                        </p>
                    </div>
                </div>
            )}

            {inspections.length === 0 ? (
                <Card>
                    <CardContent>
                        <div className="text-center py-12">
                            <Building2 className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                            <p className="text-gray-500 mb-4">Nenhuma vistoria cadastrada</p>
                            <Button
                                onClick={() => setShowModal(true)}
                                className="bg-emerald-600 hover:bg-emerald-700"
                            >
                                <Plus className="h-4 w-4" /> Cadastrar Primeira Vistoria
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4">
                    {inspections.map((inspection) => (
                        <Card key={inspection.id}>
                            <CardContent className="p-6">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <FileText className="h-5 w-5 text-emerald-600" />
                                            <span className="font-medium text-gray-900">
                                                Vistoria de {format(new Date(inspection.data_realizacao), "dd/MM/yyyy")}
                                            </span>
                                            {getStatusBadge(inspection.status)}
                                        </div>
                                        <div className="text-sm text-gray-600 space-y-1">
                                            <p>
                                                <strong>Válida até:</strong>{' '}
                                                {format(new Date(inspection.data_limite_proxima), "dd/MM/yyyy")}
                                            </p>
                                            {inspection.engenheiro_responsavel && (
                                                <p>
                                                    <strong>Engenheiro:</strong> {inspection.engenheiro_responsavel}
                                                    {inspection.crea_cau_numero && ` (${inspection.crea_cau_numero})`}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    {inspection.laudo_url && (
                                        <a
                                            href={inspection.laudo_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-2 px-4 py-2 border border-emerald-200 text-emerald-600 rounded-lg hover:bg-emerald-50 text-sm"
                                        >
                                            <FileText className="h-4 w-4" /> Ver Laudo
                                        </a>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Modal de nova vistoria */}
            <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Nova Autovistoria" size="md">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <Input
                        label="Data da Realização"
                        type="date"
                        value={dataRealizacao}
                        onChange={(e) => setDataRealizacao(e.target.value)}
                        required
                    />

                    <Input
                        label="Engenheiro Responsável"
                        value={engenheiro}
                        onChange={(e) => setEngenheiro(e.target.value)}
                        placeholder="Nome completo do engenheiro"
                    />

                    <Input
                        label="CREA/CAU"
                        value={creaCau}
                        onChange={(e) => setCreaCau(e.target.value)}
                        placeholder="Número do registro"
                    />

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Laudo (PDF)
                        </label>
                        <div className="flex items-center gap-2">
                            <label className="flex-1 flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-emerald-400 hover:bg-emerald-50 transition-colors">
                                <Upload className="h-5 w-5 text-gray-400" />
                                <span className="text-sm text-gray-600">
                                    {laudoFile ? laudoFile.name : 'Selecionar arquivo...'}
                                </span>
                                <input
                                    type="file"
                                    accept=".pdf"
                                    className="hidden"
                                    onChange={(e) => setLaudoFile(e.target.files?.[0] || null)}
                                />
                            </label>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Observações
                        </label>
                        <textarea
                            value={observacoes}
                            onChange={(e) => setObservacoes(e.target.value)}
                            rows={3}
                            className="w-full rounded-lg border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
                            placeholder="Anotações adicionais..."
                        />
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <p className="text-sm text-blue-800">
                            <strong>Lei 6.400/RJ:</strong> A autovistoria deve ser realizada a cada 5 anos.
                            O sistema calculará automaticamente a data de vencimento.
                        </p>
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => setShowModal(false)}
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="submit"
                            disabled={saving || !dataRealizacao}
                            className="bg-emerald-600 hover:bg-emerald-700"
                            loading={saving}
                        >
                            Salvar Vistoria
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
