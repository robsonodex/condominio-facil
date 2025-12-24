'use client';

import { useEffect, useState, useMemo } from 'react';
import { Card, CardContent, Button, Input, Select, Badge } from '@/components/ui';
import { Modal } from '@/components/ui/modal';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useUser } from '@/hooks/useUser';
import { formatDate, formatDateTime } from '@/lib/utils';
import { Package, Plus, Search, Check, AlertCircle, Clock, User, Home, Mail, Phone, Lock, PenTool } from 'lucide-react';
import Link from 'next/link';
import { SignaturePad } from '@/components/ui/SignaturePad';

interface Entrega {
    id: string;
    remetente: string;
    descricao: string;
    tipo: string;
    codigo_rastreio: string;
    status: string;
    data_recebimento: string;
    data_retirada: string;
    retirado_por_nome: string;
    retirado_por_documento: string;
    notificado_em: string;
    unit: { id: string; bloco: string; numero_unidade: string } | null;
    morador: { id: string; nome: string; email: string; telefone: string } | null;
}

interface Unit {
    id: string;
    bloco: string;
    numero_unidade: string;
}

interface Morador {
    id: string;
    nome: string;
    email: string;
    telefone: string;
}

export default function MensageriaPage() {
    const { session } = useAuth();
    const { condoId, isPorteiro, isSindico, isSuperAdmin } = useUser();
    const supabase = useMemo(() => createClient(), []);

    const [entregas, setEntregas] = useState<Entrega[]>([]);
    const [units, setUnits] = useState<Unit[]>([]);
    const [moradores, setMoradores] = useState<Morador[]>([]);
    const [loading, setLoading] = useState(true);
    const [mensageriaAtivo, setMensageriaAtivo] = useState<boolean | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [showRetiradaModal, setShowRetiradaModal] = useState(false);
    const [selectedEntrega, setSelectedEntrega] = useState<Entrega | null>(null);
    const [filterStatus, setFilterStatus] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    // Form states
    const [unitId, setUnitId] = useState('');
    const [moradorId, setMoradorId] = useState('');
    const [remetente, setRemetente] = useState('');
    const [descricao, setDescricao] = useState('');
    const [tipo, setTipo] = useState('encomenda');
    const [codigoRastreio, setCodigoRastreio] = useState('');
    const [notificar, setNotificar] = useState(true);
    const [saving, setSaving] = useState(false);

    // Retirada states
    const [retiradoNome, setRetiradoNome] = useState('');
    const [retiradoDocumento, setRetiradoDocumento] = useState('');
    const [signatureBase64, setSignatureBase64] = useState('');

    const getAuthHeaders = () => ({
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session?.access_token}`,
    });

    // Verificar se mensageria está ativa para o condomínio
    useEffect(() => {
        if (condoId) {
            checkMensageriaAtivo();
        }
    }, [condoId]);

    const checkMensageriaAtivo = async () => {
        try {
            const { data } = await supabase
                .from('condos')
                .select('mensageria_ativo')
                .eq('id', condoId)
                .single();
            setMensageriaAtivo(data?.mensageria_ativo || false);
        } catch (e) {
            console.error('[Mensageria] Error checking status:', e);
            setMensageriaAtivo(false);
        }
    };

    useEffect(() => {
        if (session?.access_token && condoId && mensageriaAtivo === true) {
            fetchEntregas();
            fetchUnits();
        } else {
            setLoading(false);
        }
    }, [session, condoId, mensageriaAtivo]);

    useEffect(() => {
        if (unitId) {
            fetchMoradores(unitId);
        } else {
            setMoradores([]);
            setMoradorId('');
        }
    }, [unitId]);

    const fetchEntregas = async () => {
        try {
            const res = await fetch(`/api/mensageria${filterStatus ? `?status=${filterStatus}` : ''}`, {
                headers: getAuthHeaders()
            });
            const data = await res.json();
            setEntregas(data.entregas || []);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const fetchUnits = async () => {
        const { data } = await supabase
            .from('units')
            .select('id, bloco, numero_unidade')
            .eq('condo_id', condoId)
            .order('bloco')
            .order('numero_unidade');
        setUnits(data || []);
    };

    const fetchMoradores = async (unitId: string) => {
        const { data } = await supabase
            .from('users')
            .select('id, nome, email, telefone')
            .eq('unidade_id', unitId)
            .eq('ativo', true)
            .in('role', ['morador', 'inquilino']);
        setMoradores(data || []);
        if (data && data.length === 1) {
            setMoradorId(data[0].id);
        }
    };

    const handleCadastrar = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!unitId || !moradorId) {
            alert('❌ Selecione a unidade e o morador');
            return;
        }

        setSaving(true);
        try {
            const res = await fetch('/api/mensageria', {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({
                    unit_id: unitId,
                    morador_id: moradorId,
                    remetente,
                    descricao,
                    tipo,
                    codigo_rastreio: codigoRastreio,
                    notificar
                }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            alert(`✅ ${data.message}`);
            setShowModal(false);
            resetForm();
            fetchEntregas();
        } catch (e: any) {
            alert(`❌ ${e.message}`);
        } finally {
            setSaving(false);
        }
    };

    const handleRetirada = async (signature?: string) => {
        if (!selectedEntrega || !retiradoNome.trim()) {
            alert('❌ Informe o nome de quem está retirando');
            return;
        }

        setSaving(true);
        try {
            const res = await fetch('/api/mensageria', {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify({
                    id: selectedEntrega.id,
                    action: 'retirar',
                    retirado_por_nome: retiradoNome,
                    retirado_por_documento: retiradoDocumento,
                    signature_base64: signature || signatureBase64
                }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            alert(`✅ Entrega registrada para ${retiradoNome}!`);
            setShowRetiradaModal(false);
            setSelectedEntrega(null);
            setRetiradoNome('');
            setRetiradoDocumento('');
            setSignatureBase64('');
            fetchEntregas();
        } catch (e: any) {
            alert(`❌ ${e.message}`);
        } finally {
            setSaving(false);
        }
    };

    const resetForm = () => {
        setUnitId('');
        setMoradorId('');
        setRemetente('');
        setDescricao('');
        setTipo('encomenda');
        setCodigoRastreio('');
        setNotificar(true);
    };

    const openRetiradaModal = (entrega: Entrega) => {
        setSelectedEntrega(entrega);
        setRetiradoNome('');
        setRetiradoDocumento('');
        setSignatureBase64('');
        setShowRetiradaModal(true);
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'aguardando': return <Badge variant="warning"><Clock className="h-3 w-3 mr-1" /> Aguardando</Badge>;
            case 'notificado': return <Badge variant="primary"><Mail className="h-3 w-3 mr-1" /> Notificado</Badge>;
            case 'retirado': return <Badge variant="success"><Check className="h-3 w-3 mr-1" /> Retirado</Badge>;
            case 'devolvido': return <Badge variant="danger"><AlertCircle className="h-3 w-3 mr-1" /> Devolvido</Badge>;
            default: return <Badge>{status}</Badge>;
        }
    };

    const filteredEntregas = entregas.filter(e => {
        const matchesSearch = !searchTerm ||
            e.remetente?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            e.morador?.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            e.unit?.numero_unidade?.includes(searchTerm);
        const matchesStatus = !filterStatus || e.status === filterStatus;
        return matchesSearch && matchesStatus;
    });

    const canManage = isPorteiro || isSindico || isSuperAdmin;

    // Módulo desativado pelo admin
    if (mensageriaAtivo === false) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
                <Lock className="h-16 w-16 text-gray-300" />
                <h2 className="text-xl font-bold text-gray-700">Módulo Desativado</h2>
                <p className="text-gray-500 text-center max-w-md">
                    O módulo de Mensageria não está ativado para este condomínio.
                    <br />
                    Entre em contato com o suporte para ativar.
                </p>
                <Link href="/dashboard">
                    <Button variant="outline">Voltar ao Dashboard</Button>
                </Link>
            </div>
        );
    }

    // Ainda carregando status
    if (mensageriaAtivo === null) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
                <Package className="h-16 w-16 text-gray-300 animate-pulse" />
                <p className="text-gray-500">Carregando...</p>
            </div>
        );
    }

    if (!canManage) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
                <Package className="h-16 w-16 text-gray-300" />
                <h2 className="text-xl font-bold text-gray-700">Acesso Restrito</h2>
                <p className="text-gray-500">Apenas porteiros e síndicos podem acessar a mensageria.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <Package className="h-6 w-6 text-emerald-500" />
                        Mensageria
                    </h1>
                    <p className="text-gray-500">Controle de encomendas e entregas</p>
                </div>
                <Button onClick={() => setShowModal(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Nova Entrega
                </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <Card className="bg-gradient-to-br from-amber-500 to-amber-600 text-white border-0">
                    <CardContent className="py-4 text-center">
                        <Clock className="h-8 w-8 mx-auto mb-2 opacity-80" />
                        <p className="text-2xl font-bold">{entregas.filter(e => e.status === 'aguardando' || e.status === 'notificado').length}</p>
                        <p className="text-sm text-amber-100">Aguardando</p>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white border-0">
                    <CardContent className="py-4 text-center">
                        <Check className="h-8 w-8 mx-auto mb-2 opacity-80" />
                        <p className="text-2xl font-bold">{entregas.filter(e => e.status === 'retirado').length}</p>
                        <p className="text-sm text-emerald-100">Retiradas</p>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0">
                    <CardContent className="py-4 text-center">
                        <Mail className="h-8 w-8 mx-auto mb-2 opacity-80" />
                        <p className="text-2xl font-bold">{entregas.filter(e => e.status === 'notificado').length}</p>
                        <p className="text-sm text-blue-100">Notificados</p>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0">
                    <CardContent className="py-4 text-center">
                        <Package className="h-8 w-8 mx-auto mb-2 opacity-80" />
                        <p className="text-2xl font-bold">{entregas.length}</p>
                        <p className="text-sm text-purple-100">Total</p>
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
                        placeholder="Buscar por remetente, morador ou unidade..."
                        className="pl-10"
                    />
                </div>
                <Select
                    value={filterStatus}
                    onChange={(e) => { setFilterStatus(e.target.value); fetchEntregas(); }}
                    options={[
                        { value: '', label: 'Todos os status' },
                        { value: 'aguardando', label: 'Aguardando' },
                        { value: 'notificado', label: 'Notificado' },
                        { value: 'retirado', label: 'Retirado' },
                        { value: 'devolvido', label: 'Devolvido' },
                    ]}
                    className="w-40"
                />
            </div>

            {/* Lista */}
            <Card>
                <CardContent className="p-0">
                    {loading ? (
                        <div className="p-8 text-center text-gray-500">Carregando...</div>
                    ) : filteredEntregas.length === 0 ? (
                        <div className="p-8 text-center">
                            <Package className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                            <p className="text-gray-500">Nenhuma entrega encontrada</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-100">
                            {filteredEntregas.map((entrega) => (
                                <div key={entrega.id} className="p-4 hover:bg-gray-50 transition-colors">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-2">
                                                {getStatusBadge(entrega.status)}
                                                <Badge variant="secondary">{entrega.tipo}</Badge>
                                            </div>
                                            <div className="flex items-center gap-4 text-sm">
                                                <span className="flex items-center gap-1 text-gray-600">
                                                    <Home className="h-4 w-4" />
                                                    {entrega.unit ? `${entrega.unit.bloco} ${entrega.unit.numero_unidade}` : '-'}
                                                </span>
                                                <span className="flex items-center gap-1 text-gray-600">
                                                    <User className="h-4 w-4" />
                                                    {entrega.morador?.nome || '-'}
                                                </span>
                                            </div>
                                            {entrega.remetente && (
                                                <p className="text-sm text-gray-500 mt-1">
                                                    <strong>Remetente:</strong> {entrega.remetente}
                                                </p>
                                            )}
                                            {entrega.descricao && (
                                                <p className="text-sm text-gray-500">{entrega.descricao}</p>
                                            )}
                                            <p className="text-xs text-gray-400 mt-2">
                                                Recebido em {formatDateTime(entrega.data_recebimento)}
                                                {entrega.data_retirada && (
                                                    <> • Retirado em {formatDateTime(entrega.data_retirada)} por {entrega.retirado_por_nome}</>
                                                )}
                                            </p>
                                        </div>
                                        {(entrega.status === 'aguardando' || entrega.status === 'notificado') && (
                                            <Button size="sm" onClick={() => openRetiradaModal(entrega)}>
                                                <Check className="h-4 w-4 mr-1" /> Registrar Retirada
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Modal Nova Entrega */}
            <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Cadastrar Nova Entrega" size="md">
                <form onSubmit={handleCadastrar} className="space-y-4">
                    <Select
                        label="Unidade *"
                        value={unitId}
                        onChange={(e) => setUnitId(e.target.value)}
                        options={[
                            { value: '', label: 'Selecione a unidade...' },
                            ...units.map(u => ({ value: u.id, label: `${u.bloco} ${u.numero_unidade}` }))
                        ]}
                        required
                    />

                    <Select
                        label="Morador *"
                        value={moradorId}
                        onChange={(e) => setMoradorId(e.target.value)}
                        options={[
                            { value: '', label: moradores.length === 0 ? 'Selecione a unidade primeiro' : 'Selecione o morador...' },
                            ...moradores.map(m => ({ value: m.id, label: `${m.nome}${m.telefone ? ` - ${m.telefone}` : ''}` }))
                        ]}
                        required
                        disabled={!unitId}
                    />

                    <Input
                        label="Remetente"
                        value={remetente}
                        onChange={(e) => setRemetente(e.target.value)}
                        placeholder="Ex: Amazon, Magazine Luiza, João..."
                    />

                    <div className="grid grid-cols-2 gap-4">
                        <Select
                            label="Tipo"
                            value={tipo}
                            onChange={(e) => setTipo(e.target.value)}
                            options={[
                                { value: 'encomenda', label: '📦 Encomenda' },
                                { value: 'carta', label: '✉️ Carta' },
                                { value: 'pacote', label: '📮 Pacote' },
                                { value: 'documento', label: '📄 Documento' },
                                { value: 'outro', label: '📋 Outro' },
                            ]}
                        />
                        <Input
                            label="Código de Rastreio"
                            value={codigoRastreio}
                            onChange={(e) => setCodigoRastreio(e.target.value)}
                            placeholder="Opcional"
                        />
                    </div>

                    <Input
                        label="Descrição"
                        value={descricao}
                        onChange={(e) => setDescricao(e.target.value)}
                        placeholder="Detalhes adicionais..."
                    />

                    <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
                        <input
                            type="checkbox"
                            id="notificar"
                            checked={notificar}
                            onChange={(e) => setNotificar(e.target.checked)}
                            className="rounded text-blue-600 h-5 w-5"
                        />
                        <label htmlFor="notificar" className="text-sm text-blue-800">
                            📧 Notificar morador por e-mail e push
                        </label>
                    </div>

                    {/* WhatsApp bloqueado - Banner de propaganda */}
                    <div className="p-3 bg-gray-100 rounded-lg border border-gray-200 opacity-70">
                        <div className="flex items-center gap-2 text-gray-500">
                            <Phone className="h-5 w-5" />
                            <span className="text-sm">📱 Notificar via WhatsApp</span>
                            <Badge variant="secondary" className="text-xs">Premium</Badge>
                        </div>
                        <p className="text-xs text-gray-400 mt-1">
                            Ative o módulo WhatsApp Oficial para enviar notificações via WhatsApp.
                        </p>
                    </div>

                    <div className="flex gap-3 justify-end pt-4">
                        <Button type="button" variant="ghost" onClick={() => setShowModal(false)}>Cancelar</Button>
                        <Button type="submit" loading={saving}>
                            <Package className="h-4 w-4 mr-1" /> Cadastrar e Notificar
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* Modal Retirada com Assinatura */}
            <Modal isOpen={showRetiradaModal} onClose={() => setShowRetiradaModal(false)} title="Registrar Retirada" size="lg">
                <div className="space-y-4">
                    {/* Dados da Entrega */}
                    <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-600">
                            <strong>Entrega:</strong> {selectedEntrega?.tipo} de {selectedEntrega?.remetente || 'N/A'}
                        </p>
                        <p className="text-sm text-gray-600">
                            <strong>Morador:</strong> {selectedEntrega?.morador?.nome}
                        </p>
                        <p className="text-sm text-gray-600">
                            <strong>Unidade:</strong> {selectedEntrega?.unit?.bloco} {selectedEntrega?.unit?.numero_unidade}
                        </p>
                    </div>

                    {/* Dados de quem está retirando */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <Input
                            label="Nome de quem está retirando *"
                            value={retiradoNome}
                            onChange={(e) => setRetiradoNome(e.target.value)}
                            placeholder="Nome completo"
                            required
                        />
                        <Input
                            label="Documento (RG/CPF)"
                            value={retiradoDocumento}
                            onChange={(e) => setRetiradoDocumento(e.target.value)}
                            placeholder="Opcional"
                        />
                    </div>

                    {/* Captura de Assinatura */}
                    <div className="border rounded-lg p-4 bg-white">
                        <div className="flex items-center gap-2 mb-3">
                            <PenTool className="h-5 w-5 text-emerald-600" />
                            <span className="font-medium text-gray-900">Assinatura do Recebedor</span>
                        </div>
                        <SignaturePad
                            onSave={(sig) => handleRetirada(sig)}
                            onClear={() => setSignatureBase64('')}
                            disabled={saving || !retiradoNome.trim()}
                        />
                        {!retiradoNome.trim() && (
                            <p className="text-xs text-amber-600 mt-2">
                                ⚠️ Preencha o nome acima antes de assinar
                            </p>
                        )}
                    </div>

                    <div className="flex gap-3 justify-end pt-2">
                        <Button type="button" variant="ghost" onClick={() => setShowRetiradaModal(false)}>
                            Cancelar
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
