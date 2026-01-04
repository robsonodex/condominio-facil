'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, Button, Select, Input, Badge } from '@/components/ui';
import { Modal } from '@/components/ui/modal';
import { useAuth } from '@/hooks/useAuth';
import { useUser } from '@/hooks/useUser';
import { createClient } from '@/lib/supabase/client';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Calendar, Plus, CheckCircle, XCircle, Clock, MapPin, Users, ChevronLeft, ChevronRight, Edit2 } from 'lucide-react';

interface CommonArea {
    id: string;
    nome: string;
    descricao: string;
    capacidade_maxima: number;
    valor_taxa: number;
    requer_aprovacao: boolean;
    horario_abertura: string;
    horario_fechamento: string;
    regras: string;
}

interface Reservation {
    id: string;
    area_id: string;
    data_reserva: string;
    horario_inicio: string;
    horario_fim: string;
    num_convidados: number;
    observacoes: string;
    status: string;
    area: { id: string; nome: string };
    user: { id: string; nome: string };
    unidade: { bloco: string; numero_unidade: string } | null;
}

export default function ReservasPage() {
    const { session } = useAuth();
    const { isSindico, isSuperAdmin, condoId } = useUser();
    const [areas, setAreas] = useState<CommonArea[]>([]);
    const [reservations, setReservations] = useState<Reservation[]>([]);
    const [selectedArea, setSelectedArea] = useState<string>('');
    const [currentDate, setCurrentDate] = useState(new Date());
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showAreaModal, setShowAreaModal] = useState(false);
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [rejectingReservation, setRejectingReservation] = useState<Reservation | null>(null);
    const [rejectReason, setRejectReason] = useState('');
    const [selectedDate, setSelectedDate] = useState('');
    const [editingReservation, setEditingReservation] = useState<Reservation | null>(null);

    // Form states
    const [horarioInicio, setHorarioInicio] = useState('08:00');
    const [horarioFim, setHorarioFim] = useState('10:00');
    const [numConvidados, setNumConvidados] = useState('0');
    const [observacoes, setObservacoes] = useState('');
    const [termoAceito, setTermoAceito] = useState(false);
    const [saving, setSaving] = useState(false);

    // Area form
    const [areaForm, setAreaForm] = useState({ nome: '', descricao: '', capacidade_maxima: 20, valor_taxa: 0, requer_aprovacao: false, regras: '' });

    const getAuthHeaders = () => ({
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session?.access_token}`,
    });

    useEffect(() => {
        if (session?.access_token) {
            fetchAreas();
        }
    }, [session]);

    useEffect(() => {
        if (session?.access_token && selectedArea) {
            fetchReservations();
        }
    }, [session, selectedArea, currentDate]);

    // Realtime subscription for reservation status updates
    useEffect(() => {
        if (!condoId) return;

        const supabase = createClient();

        const channel = supabase
            .channel('reservas-realtime')
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'reservations',
                    filter: `condo_id=eq.${condoId}`
                },
                (payload) => {
                    console.log('[RESERVAS] Realtime update:', payload.new);
                    setReservations(prev =>
                        prev.map(r => r.id === payload.new.id
                            ? { ...r, ...payload.new } as Reservation
                            : r
                        )
                    );
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [condoId]);

    const fetchAreas = async () => {
        try {
            const res = await fetch('/api/common-areas', { headers: getAuthHeaders() });
            const data = await res.json();
            setAreas(data.areas || []);
            if (data.areas?.length > 0 && !selectedArea) {
                setSelectedArea(data.areas[0].id);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const fetchReservations = async () => {
        const startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).toISOString().split('T')[0];
        const endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).toISOString().split('T')[0];

        try {
            const res = await fetch(`/api/reservations?area_id=${selectedArea}&start_date=${startDate}&end_date=${endDate}`, { headers: getAuthHeaders() });
            const data = await res.json();
            setReservations(data.reservations || []);
        } catch (e) {
            console.error(e);
        }
    };

    const handleCreateReservation = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedDate || !selectedArea) return;

        setSaving(true);
        try {
            const res = await fetch('/api/reservations', {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({
                    area_id: selectedArea,
                    data_reserva: selectedDate,
                    horario_inicio: horarioInicio,
                    horario_fim: horarioFim,
                    num_convidados: parseInt(numConvidados),
                    observacoes,
                }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            alert(`✅ ${data.message}`);
            setShowModal(false);
            fetchReservations();
            resetForm();
        } catch (e: any) {
            alert(`❌ ${e.message}`);
        } finally {
            setSaving(false);
        }
    };

    const handleAction = async (id: string, action: string, motivo?: string) => {
        try {
            const res = await fetch('/api/reservations', {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify({ id, action, motivo_rejeicao: motivo }),
            });
            if (!res.ok) throw new Error('Erro na operação');
            fetchReservations();

            // Fechar modal de rejeição se estiver aberto
            if (action === 'rejeitar') {
                setShowRejectModal(false);
                setRejectingReservation(null);
                setRejectReason('');
            }
        } catch (e: any) {
            alert(`❌ ${e.message}`);
        }
    };

    const openRejectModal = (reservation: Reservation) => {
        setRejectingReservation(reservation);
        setRejectReason('');
        setShowRejectModal(true);
    };

    const handleReject = () => {
        if (!rejectingReservation) return;
        if (!rejectReason.trim()) {
            alert('❌ Por favor, informe o motivo da rejeição');
            return;
        }
        handleAction(rejectingReservation.id, 'rejeitar', rejectReason);
    };

    const handleCreateArea = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const res = await fetch('/api/common-areas', {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify(areaForm),
            });
            if (!res.ok) throw new Error('Erro ao criar área');
            alert('✅ Área criada!');
            setShowAreaModal(false);
            fetchAreas();
            setAreaForm({ nome: '', descricao: '', capacidade_maxima: 20, valor_taxa: 0, requer_aprovacao: false, regras: '' });
        } catch (e: any) {
            alert(`❌ ${e.message}`);
        } finally {
            setSaving(false);
        }
    };

    const resetForm = () => {
        setHorarioInicio('08:00');
        setHorarioFim('10:00');
        setNumConvidados('0');
        setObservacoes('');
        setSelectedDate('');
        setEditingReservation(null);
        setTermoAceito(false);
    };

    const openEditModal = (reservation: Reservation) => {
        setEditingReservation(reservation);
        setSelectedArea(reservation.area_id);
        setSelectedDate(reservation.data_reserva);
        setHorarioInicio(reservation.horario_inicio);
        setHorarioFim(reservation.horario_fim);
        setNumConvidados(String(reservation.num_convidados));
        setObservacoes(reservation.observacoes || '');
        setShowModal(true);
    };

    const handleSaveReservation = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedDate || !selectedArea) return;

        setSaving(true);
        try {
            if (editingReservation) {
                // Atualizar reserva existente
                const res = await fetch('/api/reservations', {
                    method: 'PUT',
                    headers: getAuthHeaders(),
                    body: JSON.stringify({
                        id: editingReservation.id,
                        action: 'update',
                        data_reserva: selectedDate,
                        horario_inicio: horarioInicio,
                        horario_fim: horarioFim,
                        num_convidados: parseInt(numConvidados),
                        observacoes,
                    }),
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.error);
                alert(`✅ Reserva atualizada!`);
            } else {
                // Criar nova reserva
                const res = await fetch('/api/reservations', {
                    method: 'POST',
                    headers: getAuthHeaders(),
                    body: JSON.stringify({
                        area_id: selectedArea,
                        data_reserva: selectedDate,
                        horario_inicio: horarioInicio,
                        horario_fim: horarioFim,
                        num_convidados: parseInt(numConvidados),
                        observacoes,
                    }),
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.error);
                alert(`✅ ${data.message}`);
            }
            setShowModal(false);
            fetchReservations();
            resetForm();
        } catch (e: any) {
            alert(`❌ ${e.message}`);
        } finally {
            setSaving(false);
        }
    };

    const getDaysInMonth = () => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const days = [];

        for (let i = 0; i < firstDay; i++) days.push(null);
        for (let i = 1; i <= daysInMonth; i++) days.push(i);
        return days;
    };

    const getReservationsForDay = (day: number) => {
        const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        return reservations.filter(r => r.data_reserva === dateStr);
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'aprovada': return <Badge variant="success">Aprovada</Badge>;
            case 'pendente': return <Badge variant="warning">Pendente</Badge>;
            case 'rejeitada': return <Badge variant="danger">Rejeitada</Badge>;
            case 'cancelada': return <Badge variant="default">Cancelada</Badge>;
            default: return <Badge>{status}</Badge>;
        }
    };

    const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
    const selectedAreaData = areas.find(a => a.id === selectedArea);

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <Calendar className="h-6 w-6 text-emerald-500" />
                        Reservas de Áreas Comuns
                    </h1>
                    <p className="text-gray-500">Agende o uso de salões, churrasqueiras e outras áreas</p>
                </div>
                <div className="flex gap-2 flex-wrap">
                    {(isSindico || isSuperAdmin) && (
                        <>
                            <Button variant="outline" onClick={() => setShowAreaModal(true)}>
                                <Plus className="h-4 w-4 mr-2" />
                                Nova Área
                            </Button>
                            <Button
                                variant="outline"
                                className="border-amber-500 text-amber-600 hover:bg-amber-50"
                                onClick={() => {
                                    const section = document.getElementById('secao-aprovacao');
                                    section?.scrollIntoView({ behavior: 'smooth' });
                                }}
                            >
                                <Clock className="h-4 w-4 mr-2" />
                                Aprovar Pendentes ({reservations.filter(r => r.status === 'pendente').length})
                            </Button>
                        </>
                    )}
                    <Button onClick={() => { setSelectedDate(new Date().toISOString().split('T')[0]); setShowModal(true); }}>
                        <Plus className="h-4 w-4 mr-2" />
                        Nova Reserva
                    </Button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0">
                    <CardContent className="py-4 text-center">
                        <Calendar className="h-8 w-8 mx-auto mb-2 opacity-80" />
                        <p className="text-2xl font-bold">{reservations.length}</p>
                        <p className="text-sm text-purple-100">Total de Reservas</p>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white border-0">
                    <CardContent className="py-4 text-center">
                        <CheckCircle className="h-8 w-8 mx-auto mb-2 opacity-80" />
                        <p className="text-2xl font-bold">{reservations.filter(r => r.status === 'aprovada').length}</p>
                        <p className="text-sm text-emerald-100">Aprovadas</p>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-amber-500 to-amber-600 text-white border-0">
                    <CardContent className="py-4 text-center">
                        <Clock className="h-8 w-8 mx-auto mb-2 opacity-80" />
                        <p className="text-2xl font-bold">{reservations.filter(r => r.status === 'pendente').length}</p>
                        <p className="text-sm text-amber-100">Pendentes</p>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0">
                    <CardContent className="py-4 text-center">
                        <MapPin className="h-8 w-8 mx-auto mb-2 opacity-80" />
                        <p className="text-2xl font-bold">{areas.length}</p>
                        <p className="text-sm text-blue-100">Áreas Disponíveis</p>
                    </CardContent>
                </Card>
            </div>

            {/* Seletor de Área */}
            <div className="flex flex-wrap gap-4 items-center">
                <Select
                    value={selectedArea}
                    onChange={(e) => setSelectedArea(e.target.value)}
                    options={areas.map(a => ({ value: a.id, label: a.nome }))}
                    className="w-64"
                />
                {selectedAreaData && (
                    <div className="flex gap-4 text-sm text-gray-600">
                        <span className="flex items-center gap-1"><Users className="h-4 w-4" /> Máx: {selectedAreaData.capacidade_maxima}</span>
                        <span className="flex items-center gap-1"><Clock className="h-4 w-4" /> {selectedAreaData.horario_abertura} - {selectedAreaData.horario_fechamento}</span>
                        {selectedAreaData.valor_taxa > 0 && <span>Taxa: {formatCurrency(selectedAreaData.valor_taxa)}</span>}
                        {selectedAreaData.requer_aprovacao && <Badge variant="warning">Requer Aprovação</Badge>}
                    </div>
                )}
            </div>

            {/* Calendário */}
            <Card>
                <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-4">
                        <Button variant="ghost" size="sm" onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))}>
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <h2 className="text-lg font-semibold">{monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}</h2>
                        <Button variant="ghost" size="sm" onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))}>
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>

                    <div className="grid grid-cols-7 gap-1">
                        {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(d => (
                            <div key={d} className="text-center text-sm font-medium text-gray-500 py-2">{d}</div>
                        ))}
                        {getDaysInMonth().map((day, i) => {
                            if (!day) return <div key={i} />;
                            const dayReservations = getReservationsForDay(day);
                            const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                            const isToday = new Date().toISOString().split('T')[0] === dateStr;

                            return (
                                <div
                                    key={i}
                                    onClick={() => { setSelectedDate(dateStr); setShowModal(true); }}
                                    className={`min-h-[80px] p-1 border rounded cursor-pointer hover:bg-gray-50 ${isToday ? 'bg-emerald-50 border-emerald-300' : ''}`}
                                >
                                    <div className={`text-sm font-medium ${isToday ? 'text-emerald-600' : ''}`}>{day}</div>
                                    <div className="space-y-1 mt-1">
                                        {dayReservations.slice(0, 2).map(r => (
                                            <div key={r.id} className={`text-xs px-1 rounded truncate ${r.status === 'aprovada' ? 'bg-emerald-100 text-emerald-700' :
                                                r.status === 'pendente' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600'
                                                }`}>
                                                {r.horario_inicio.slice(0, 5)} - {r.user?.nome?.split(' ')[0] || 'Reserva'}
                                            </div>
                                        ))}
                                        {dayReservations.length > 2 && <div className="text-xs text-gray-500">+{dayReservations.length - 2} mais</div>}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </CardContent>
            </Card>

            {/* Lista de Reservas Aguardando Aprovação (Síndico) */}
            {(isSindico || isSuperAdmin) && (
                <Card id="secao-aprovacao" className="border-amber-200">
                    <CardContent className="p-4">
                        <h3 className="font-semibold mb-3 flex items-center gap-2">
                            <Clock className="h-5 w-5 text-amber-500" />
                            Reservas Aguardando Aprovação
                        </h3>
                        {reservations.filter(r => r.status === 'pendente').length > 0 ? (
                            <div className="space-y-2">
                                {reservations.filter(r => r.status === 'pendente').map(r => (
                                    <div key={r.id} className="flex items-center justify-between p-3 bg-amber-50 rounded-lg">
                                        <div>
                                            <p className="font-medium">{r.area?.nome} - {formatDate(r.data_reserva)}</p>
                                            <p className="text-sm text-gray-600">{r.user?.nome} • {r.horario_inicio} às {r.horario_fim}</p>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button size="sm" onClick={() => handleAction(r.id, 'aprovar')}>
                                                <CheckCircle className="h-4 w-4 mr-1" /> Aprovar
                                            </Button>
                                            <Button size="sm" variant="outline" onClick={() => openEditModal(r)}>
                                                <Edit2 className="h-4 w-4 mr-1" /> Editar
                                            </Button>
                                            <Button size="sm" variant="ghost" onClick={() => openRejectModal(r)}>
                                                <XCircle className="h-4 w-4 mr-1" /> Rejeitar
                                            </Button>
                                            <Button size="sm" variant="danger" onClick={() => handleAction(r.id, 'cancelar')}>
                                                Cancelar
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-gray-500 text-sm">Nenhuma reserva pendente de aprovação.</p>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Lista de Todas as Reservas (Síndico pode cancelar) */}
            {(isSindico || isSuperAdmin) && reservations.filter(r => r.status === 'aprovada').length > 0 && (
                <Card>
                    <CardContent className="p-4">
                        <h3 className="font-semibold mb-3 flex items-center gap-2">
                            <CheckCircle className="h-5 w-5 text-emerald-500" />
                            Reservas Aprovadas
                        </h3>
                        <div className="space-y-2">
                            {reservations.filter(r => r.status === 'aprovada').map(r => (
                                <div key={r.id} className="flex items-center justify-between p-3 bg-emerald-50 rounded-lg">
                                    <div>
                                        <p className="font-medium">{r.area?.nome} - {formatDate(r.data_reserva)}</p>
                                        <p className="text-sm text-gray-600">{r.user?.nome} • {r.horario_inicio} às {r.horario_fim}</p>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button size="sm" variant="outline" onClick={() => openEditModal(r)}>
                                            <Edit2 className="h-4 w-4 mr-1" /> Editar
                                        </Button>
                                        <Button size="sm" variant="danger" onClick={() => handleAction(r.id, 'cancelar')}>
                                            Cancelar
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Minhas Reservas - Para Moradores */}
            {!isSindico && !isSuperAdmin && reservations.length > 0 && (
                <Card className="border-blue-200">
                    <CardContent className="p-4">
                        <h3 className="font-semibold mb-3 flex items-center gap-2">
                            <Calendar className="h-5 w-5 text-blue-500" />
                            Minhas Reservas
                        </h3>
                        <div className="space-y-2">
                            {reservations.filter(r => r.status === 'aprovada').length > 0 && (
                                <div className="mb-4">
                                    <p className="text-xs font-bold text-emerald-600 uppercase tracking-wide mb-2">✅ Aprovadas</p>
                                    {reservations.filter(r => r.status === 'aprovada').map(r => (
                                        <div key={r.id} className="flex items-center justify-between p-3 bg-emerald-50 rounded-lg mb-2">
                                            <div>
                                                <p className="font-medium">{r.area?.nome} - {formatDate(r.data_reserva)}</p>
                                                <p className="text-sm text-gray-600">{r.horario_inicio} às {r.horario_fim}</p>
                                            </div>
                                            {getStatusBadge(r.status)}
                                        </div>
                                    ))}
                                </div>
                            )}
                            {reservations.filter(r => r.status === 'pendente').length > 0 && (
                                <div className="mb-4">
                                    <p className="text-xs font-bold text-amber-600 uppercase tracking-wide mb-2">⏳ Aguardando Aprovação</p>
                                    {reservations.filter(r => r.status === 'pendente').map(r => (
                                        <div key={r.id} className="flex items-center justify-between p-3 bg-amber-50 rounded-lg mb-2">
                                            <div>
                                                <p className="font-medium">{r.area?.nome} - {formatDate(r.data_reserva)}</p>
                                                <p className="text-sm text-gray-600">{r.horario_inicio} às {r.horario_fim}</p>
                                            </div>
                                            {getStatusBadge(r.status)}
                                        </div>
                                    ))}
                                </div>
                            )}
                            {reservations.filter(r => r.status === 'rejeitada').length > 0 && (
                                <div>
                                    <p className="text-xs font-bold text-red-600 uppercase tracking-wide mb-2">❌ Rejeitadas</p>
                                    {reservations.filter(r => r.status === 'rejeitada').map(r => (
                                        <div key={r.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg mb-2">
                                            <div>
                                                <p className="font-medium">{r.area?.nome} - {formatDate(r.data_reserva)}</p>
                                                <p className="text-sm text-gray-600">{r.horario_inicio} às {r.horario_fim}</p>
                                            </div>
                                            {getStatusBadge(r.status)}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Modal Nova/Editar Reserva */}
            <Modal isOpen={showModal} onClose={() => { setShowModal(false); resetForm(); }} title={editingReservation ? 'Editar Reserva' : 'Nova Reserva'} size="md">
                <form onSubmit={handleSaveReservation} className="space-y-4">
                    <Select
                        label="Espaço *"
                        value={selectedArea}
                        onChange={(e) => setSelectedArea(e.target.value)}
                        options={[
                            { value: '', label: 'Selecione um espaço...' },
                            ...areas.map(a => ({ value: a.id, label: a.nome }))
                        ]}
                        required
                    />
                    <Input label="Data" type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} required />
                    <div className="grid grid-cols-2 gap-4">
                        <Input label="Início" type="time" value={horarioInicio} onChange={(e) => setHorarioInicio(e.target.value)} required />
                        <Input label="Término" type="time" value={horarioFim} onChange={(e) => setHorarioFim(e.target.value)} required />
                    </div>
                    <Input label="Número de Convidados" type="number" value={numConvidados} onChange={(e) => setNumConvidados(e.target.value)} min="0" />
                    <Input label="Observações" value={observacoes} onChange={(e) => setObservacoes(e.target.value)} placeholder="Informações adicionais..." />

                    {selectedAreaData?.regras && (
                        <div className="bg-blue-50 p-3 rounded text-sm">
                            <p className="font-medium text-blue-900">Regras de uso:</p>
                            <p className="text-blue-700">{selectedAreaData.regras}</p>
                        </div>
                    )}

                    {/* Termo de Aceite - Lei do Silêncio (Lei 3.268/01 RJ) */}
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                        <label className="flex items-start gap-3 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={termoAceito}
                                onChange={(e) => setTermoAceito(e.target.checked)}
                                className="mt-1 h-4 w-4 text-amber-600 rounded border-gray-300 focus:ring-amber-500"
                                required
                            />
                            <div className="text-sm">
                                <p className="font-medium text-amber-800">Termo de Compromisso - Lei do Silêncio</p>
                                <p className="text-amber-700 mt-1">
                                    Estou ciente de que após as 22h o limite de ruído é de 50dB conforme Lei Municipal 3.268/01.
                                    O descumprimento pode acarretar multa prevista na Convenção do Condomínio.
                                </p>
                            </div>
                        </label>
                    </div>

                    <div className="flex gap-3 justify-end pt-4">
                        <Button type="button" variant="ghost" onClick={() => setShowModal(false)}>Cancelar</Button>
                        <Button type="submit" loading={saving} disabled={!termoAceito}>Confirmar Reserva</Button>
                    </div>
                </form>
            </Modal>

            {/* Modal Nova Área */}
            <Modal isOpen={showAreaModal} onClose={() => setShowAreaModal(false)} title="Nova Área Comum" size="md">
                <form onSubmit={handleCreateArea} className="space-y-4">
                    <Input label="Nome" value={areaForm.nome} onChange={(e) => setAreaForm({ ...areaForm, nome: e.target.value })} placeholder="Ex: Salão de Festas" required />
                    <Input label="Descrição" value={areaForm.descricao} onChange={(e) => setAreaForm({ ...areaForm, descricao: e.target.value })} />
                    <div className="grid grid-cols-2 gap-4">
                        <Input label="Capacidade Máxima" type="number" value={areaForm.capacidade_maxima} onChange={(e) => setAreaForm({ ...areaForm, capacidade_maxima: parseInt(e.target.value) })} />
                        <Input label="Taxa (R$)" type="number" step="0.01" value={areaForm.valor_taxa} onChange={(e) => setAreaForm({ ...areaForm, valor_taxa: parseFloat(e.target.value) })} />
                    </div>
                    <div className="flex items-center gap-2">
                        <input type="checkbox" id="requer_aprovacao" checked={areaForm.requer_aprovacao} onChange={(e) => setAreaForm({ ...areaForm, requer_aprovacao: e.target.checked })} />
                        <label htmlFor="requer_aprovacao">Requer aprovação do síndico</label>
                    </div>
                    <Input label="Regras de Uso" value={areaForm.regras} onChange={(e) => setAreaForm({ ...areaForm, regras: e.target.value })} placeholder="Regras e orientações..." />

                    <div className="flex gap-3 justify-end pt-4">
                        <Button type="button" variant="ghost" onClick={() => setShowAreaModal(false)}>Cancelar</Button>
                        <Button type="submit" loading={saving}>Criar Área</Button>
                    </div>
                </form>
            </Modal>

            {/* Modal Rejeição com Justificativa */}
            <Modal isOpen={showRejectModal} onClose={() => { setShowRejectModal(false); setRejectingReservation(null); }} title="Rejeitar Reserva" size="md">
                <div className="space-y-4">
                    <p className="text-gray-600">
                        Você está rejeitando a reserva de <span className="font-bold">{rejectingReservation?.user?.nome}</span> para{' '}
                        <span className="font-bold">{rejectingReservation?.area?.nome}</span> em{' '}
                        <span className="font-bold">{rejectingReservation && formatDate(rejectingReservation.data_reserva)}</span>.
                    </p>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Motivo da Rejeição <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                            placeholder="Explique o motivo da rejeição. Esta mensagem será enviada ao morador."
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 min-h-[100px]"
                            required
                        />
                    </div>

                    <div className="flex gap-3 justify-end pt-4">
                        <Button type="button" variant="ghost" onClick={() => { setShowRejectModal(false); setRejectingReservation(null); }}>Cancelar</Button>
                        <Button type="button" variant="danger" onClick={handleReject}>
                            <XCircle className="h-4 w-4 mr-1" /> Confirmar Rejeição
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
