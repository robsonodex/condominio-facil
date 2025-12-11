'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, Button, Select, Input, Badge } from '@/components/ui';
import { Modal } from '@/components/ui/modal';
import { useAuth } from '@/hooks/useAuth';
import { useUser } from '@/hooks/useUser';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Calendar, Plus, CheckCircle, XCircle, Clock, MapPin, Users, ChevronLeft, ChevronRight } from 'lucide-react';

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
    const [selectedDate, setSelectedDate] = useState('');

    // Form states
    const [horarioInicio, setHorarioInicio] = useState('08:00');
    const [horarioFim, setHorarioFim] = useState('10:00');
    const [numConvidados, setNumConvidados] = useState('0');
    const [observacoes, setObservacoes] = useState('');
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

    const handleAction = async (id: string, action: string) => {
        try {
            const res = await fetch('/api/reservations', {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify({ id, action }),
            });
            if (!res.ok) throw new Error('Erro na operação');
            fetchReservations();
        } catch (e: any) {
            alert(`❌ ${e.message}`);
        }
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
                <div className="flex gap-2">
                    {(isSindico || isSuperAdmin) && (
                        <Button variant="outline" onClick={() => setShowAreaModal(true)}>
                            <Plus className="h-4 w-4 mr-2" />
                            Nova Área
                        </Button>
                    )}
                    <Button onClick={() => { setSelectedDate(new Date().toISOString().split('T')[0]); setShowModal(true); }}>
                        <Plus className="h-4 w-4 mr-2" />
                        Nova Reserva
                    </Button>
                </div>
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

            {/* Lista de Reservas Pendentes (Síndico) */}
            {(isSindico || isSuperAdmin) && reservations.filter(r => r.status === 'pendente').length > 0 && (
                <Card>
                    <CardContent className="p-4">
                        <h3 className="font-semibold mb-3">Reservas Aguardando Aprovação</h3>
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
                                        <Button size="sm" variant="ghost" onClick={() => handleAction(r.id, 'rejeitar')}>
                                            <XCircle className="h-4 w-4 mr-1" /> Rejeitar
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Modal Nova Reserva */}
            <Modal isOpen={showModal} onClose={() => { setShowModal(false); resetForm(); }} title="Nova Reserva" size="md">
                <form onSubmit={handleCreateReservation} className="space-y-4">
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

                    <div className="flex gap-3 justify-end pt-4">
                        <Button type="button" variant="ghost" onClick={() => setShowModal(false)}>Cancelar</Button>
                        <Button type="submit" loading={saving}>Confirmar Reserva</Button>
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
        </div>
    );
}
