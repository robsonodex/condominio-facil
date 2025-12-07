'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, Button, Input, Select, Badge, Table } from '@/components/ui';
import { Modal } from '@/components/ui/modal';
import { Textarea } from '@/components/ui/textarea';
import { createClient } from '@/lib/supabase/client';
import { useUser } from '@/hooks/useUser';
import { formatDate, formatDateTime, getStatusColor, getStatusLabel, getPriorityColor, getOccurrenceTypeLabel } from '@/lib/utils';
import { Plus, Search, AlertTriangle, Eye, Edit, Filter, Camera } from 'lucide-react';
import { Occurrence, Unit, User } from '@/types/database';
import Link from 'next/link';

export default function OcorrenciasPage() {
    const { condoId, isSindico, isSuperAdmin, isPorteiro, isMorador, profile } = useUser();
    const [occurrences, setOccurrences] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingOccurrence, setEditingOccurrence] = useState<any>(null);
    const [filterStatus, setFilterStatus] = useState('');
    const [filterType, setFilterType] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const supabase = createClient();

    useEffect(() => {
        if (condoId) fetchOccurrences();
    }, [condoId, filterStatus, filterType]);

    const fetchOccurrences = async () => {
        setLoading(true);
        let query = supabase
            .from('occurrences')
            .select('*, unit:units(bloco, numero_unidade), criado_por:users!criado_por_user_id(nome), responsavel:users!responsavel_user_id(nome)')
            .eq('condo_id', condoId)
            .order('data_abertura', { ascending: false });

        // Residents only see their own occurrences
        if (isMorador && profile?.unidade_id) {
            query = query.eq('unidade_id', profile.unidade_id);
        }

        if (filterStatus) query = query.eq('status', filterStatus);
        if (filterType) query = query.eq('tipo', filterType);

        const { data } = await query;
        setOccurrences(data || []);
        setLoading(false);
    };

    const canEdit = isSindico || isSuperAdmin || isPorteiro;

    const filteredOccurrences = occurrences.filter(o =>
        o.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.descricao?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const columns = [
        {
            key: 'titulo',
            header: 'Ocorrência',
            render: (o: any) => (
                <div>
                    <p className="font-medium text-gray-900">{o.titulo}</p>
                    <p className="text-sm text-gray-500 line-clamp-1">{o.descricao}</p>
                </div>
            )
        },
        {
            key: 'tipo',
            header: 'Tipo',
            render: (o: any) => (
                <Badge variant="default">{getOccurrenceTypeLabel(o.tipo)}</Badge>
            )
        },
        {
            key: 'unit',
            header: 'Unidade',
            render: (o: any) => o.unit ? `${o.unit.bloco || ''} ${o.unit.numero_unidade}` : '-'
        },
        {
            key: 'prioridade',
            header: 'Prioridade',
            render: (o: any) => (
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(o.prioridade)}`}>
                    {o.prioridade === 'baixa' ? 'Baixa' : o.prioridade === 'media' ? 'Média' : 'Alta'}
                </span>
            )
        },
        {
            key: 'status',
            header: 'Status',
            render: (o: any) => (
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(o.status)}`}>
                    {getStatusLabel(o.status)}
                </span>
            )
        },
        {
            key: 'data_abertura',
            header: 'Abertura',
            render: (o: any) => formatDate(o.data_abertura)
        },
        {
            key: 'actions',
            header: '',
            className: 'text-right',
            render: (o: any) => (
                <div className="flex gap-2 justify-end">
                    <button
                        onClick={(e) => { e.stopPropagation(); setEditingOccurrence(o); setShowModal(true); }}
                        className="p-1 hover:bg-gray-100 rounded"
                    >
                        <Eye className="h-4 w-4 text-gray-500" />
                    </button>
                </div>
            )
        },
    ];

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Ocorrências</h1>
                    <p className="text-gray-500">
                        {isMorador ? 'Acompanhe suas ocorrências' : 'Gerencie as ocorrências do condomínio'}
                    </p>
                </div>
                <Button onClick={() => { setEditingOccurrence(null); setShowModal(true); }}>
                    <Plus className="h-4 w-4 mr-2" />
                    Nova Ocorrência
                </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="py-4 text-center">
                        <p className="text-2xl font-bold text-gray-900">{occurrences.length}</p>
                        <p className="text-sm text-gray-500">Total</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="py-4 text-center">
                        <p className="text-2xl font-bold text-blue-600">{occurrences.filter(o => o.status === 'aberta').length}</p>
                        <p className="text-sm text-gray-500">Abertas</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="py-4 text-center">
                        <p className="text-2xl font-bold text-orange-600">{occurrences.filter(o => o.status === 'em_andamento').length}</p>
                        <p className="text-sm text-gray-500">Em Andamento</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="py-4 text-center">
                        <p className="text-2xl font-bold text-emerald-600">{occurrences.filter(o => o.status === 'resolvida').length}</p>
                        <p className="text-sm text-gray-500">Resolvidas</p>
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
                        placeholder="Buscar ocorrências..."
                        className="pl-10"
                    />
                </div>
                <Select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    options={[
                        { value: '', label: 'Todos os status' },
                        { value: 'aberta', label: 'Aberta' },
                        { value: 'em_andamento', label: 'Em Andamento' },
                        { value: 'resolvida', label: 'Resolvida' },
                        { value: 'cancelada', label: 'Cancelada' },
                    ]}
                    className="w-40"
                />
                <Select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    options={[
                        { value: '', label: 'Todos os tipos' },
                        { value: 'reclamacao', label: 'Reclamação' },
                        { value: 'incidente', label: 'Incidente' },
                        { value: 'manutencao', label: 'Manutenção' },
                        { value: 'outro', label: 'Outro' },
                    ]}
                    className="w-40"
                />
            </div>

            {/* Table */}
            <Card>
                <CardContent className="p-0">
                    <Table
                        data={filteredOccurrences}
                        columns={columns}
                        loading={loading}
                        emptyMessage="Nenhuma ocorrência encontrada"
                    />
                </CardContent>
            </Card>

            {/* Modal */}
            <OccurrenceModal
                isOpen={showModal}
                onClose={() => { setShowModal(false); setEditingOccurrence(null); }}
                onSuccess={fetchOccurrences}
                condoId={condoId}
                occurrence={editingOccurrence}
                canEdit={canEdit}
                userId={profile?.id}
                userUnitId={profile?.unidade_id}
            />
        </div>
    );
}

function OccurrenceModal({ isOpen, onClose, onSuccess, condoId, occurrence, canEdit, userId, userUnitId }: {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    condoId: string | null | undefined;
    occurrence: any;
    canEdit: boolean;
    userId: string | undefined;
    userUnitId: string | null | undefined;
}) {
    const [loading, setLoading] = useState(false);
    const [titulo, setTitulo] = useState('');
    const [descricao, setDescricao] = useState('');
    const [tipo, setTipo] = useState('reclamacao');
    const [prioridade, setPrioridade] = useState('media');
    const [status, setStatus] = useState('aberta');
    const [unidadeId, setUnidadeId] = useState('');
    const [responsavelId, setResponsavelId] = useState('');
    const [units, setUnits] = useState<Unit[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const supabase = createClient();

    useEffect(() => {
        if (condoId) {
            supabase.from('units').select('*').eq('condo_id', condoId).then(({ data }) => setUnits(data || []));
            supabase.from('users').select('*').eq('condo_id', condoId).in('role', ['sindico', 'porteiro']).then(({ data }) => setUsers(data || []));
        }
    }, [condoId]);

    useEffect(() => {
        if (occurrence) {
            setTitulo(occurrence.titulo);
            setDescricao(occurrence.descricao || '');
            setTipo(occurrence.tipo);
            setPrioridade(occurrence.prioridade);
            setStatus(occurrence.status);
            setUnidadeId(occurrence.unidade_id || '');
            setResponsavelId(occurrence.responsavel_user_id || '');
        } else {
            setTitulo('');
            setDescricao('');
            setTipo('reclamacao');
            setPrioridade('media');
            setStatus('aberta');
            setUnidadeId(userUnitId || '');
            setResponsavelId('');
        }
    }, [occurrence, userUnitId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!condoId || !userId) return;

        setLoading(true);
        const data = {
            condo_id: condoId,
            titulo,
            descricao,
            tipo,
            prioridade,
            status,
            unidade_id: unidadeId || null,
            responsavel_user_id: responsavelId || null,
            ...(occurrence ? {} : { criado_por_user_id: userId }),
            ...(status === 'resolvida' && !occurrence?.data_fechamento ? { data_fechamento: new Date().toISOString() } : {}),
        };

        if (occurrence) {
            await supabase.from('occurrences').update(data).eq('id', occurrence.id);
        } else {
            await supabase.from('occurrences').insert(data);
        }

        onSuccess();
        onClose();
        setLoading(false);
    };

    const isEditing = !!occurrence;
    const isViewOnly = isEditing && !canEdit;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={occurrence ? (isViewOnly ? 'Detalhes da Ocorrência' : 'Editar Ocorrência') : 'Nova Ocorrência'} size="lg">
            <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                    label="Título"
                    value={titulo}
                    onChange={(e) => setTitulo(e.target.value)}
                    placeholder="Resumo da ocorrência"
                    required
                    disabled={isViewOnly}
                />

                <Textarea
                    label="Descrição"
                    value={descricao}
                    onChange={(e) => setDescricao(e.target.value)}
                    placeholder="Descreva a ocorrência em detalhes..."
                    className="min-h-[100px]"
                    disabled={isViewOnly}
                />

                <div className="grid grid-cols-2 gap-4">
                    <Select
                        label="Tipo"
                        value={tipo}
                        onChange={(e) => setTipo(e.target.value)}
                        options={[
                            { value: 'reclamacao', label: 'Reclamação' },
                            { value: 'incidente', label: 'Incidente' },
                            { value: 'manutencao', label: 'Manutenção' },
                            { value: 'outro', label: 'Outro' },
                        ]}
                        required
                        disabled={isViewOnly}
                    />
                    <Select
                        label="Prioridade"
                        value={prioridade}
                        onChange={(e) => setPrioridade(e.target.value)}
                        options={[
                            { value: 'baixa', label: 'Baixa' },
                            { value: 'media', label: 'Média' },
                            { value: 'alta', label: 'Alta' },
                        ]}
                        required
                        disabled={isViewOnly && !canEdit}
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <Select
                        label="Unidade Relacionada"
                        value={unidadeId}
                        onChange={(e) => setUnidadeId(e.target.value)}
                        options={units.map(u => ({ value: u.id, label: `${u.bloco || ''} ${u.numero_unidade}` }))}
                        placeholder="Área comum"
                        disabled={isViewOnly}
                    />
                    {canEdit && (
                        <Select
                            label="Status"
                            value={status}
                            onChange={(e) => setStatus(e.target.value)}
                            options={[
                                { value: 'aberta', label: 'Aberta' },
                                { value: 'em_andamento', label: 'Em Andamento' },
                                { value: 'resolvida', label: 'Resolvida' },
                                { value: 'cancelada', label: 'Cancelada' },
                            ]}
                            required
                        />
                    )}
                </div>

                {canEdit && (
                    <Select
                        label="Responsável"
                        value={responsavelId}
                        onChange={(e) => setResponsavelId(e.target.value)}
                        options={users.map(u => ({ value: u.id, label: u.nome }))}
                        placeholder="Sem responsável"
                    />
                )}

                {occurrence && (
                    <div className="pt-4 border-t border-gray-200 text-sm text-gray-500 space-y-1">
                        <p>Aberta em: {formatDateTime(occurrence.data_abertura)}</p>
                        {occurrence.criado_por && <p>Criada por: {occurrence.criado_por.nome}</p>}
                        {occurrence.responsavel && <p>Responsável: {occurrence.responsavel.nome}</p>}
                        {occurrence.data_fechamento && <p>Fechada em: {formatDateTime(occurrence.data_fechamento)}</p>}
                    </div>
                )}

                <div className="flex gap-3 justify-end pt-4">
                    <Button type="button" variant="ghost" onClick={onClose}>
                        {isViewOnly ? 'Fechar' : 'Cancelar'}
                    </Button>
                    {!isViewOnly && (
                        <Button type="submit" loading={loading}>
                            {occurrence ? 'Salvar' : 'Criar'}
                        </Button>
                    )}
                </div>
            </form>
        </Modal>
    );
}
