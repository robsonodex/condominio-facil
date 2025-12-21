'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { MobileHeader, BottomNav } from '@/components/mobile';
import { Calendar, Clock, MapPin, CheckCircle, XCircle, Loader2, Plus, Settings } from 'lucide-react';

interface Reservation {
    id: string;
    area_nome: string;
    data: string;
    hora_inicio: string;
    hora_fim: string;
    status: 'pendente' | 'aprovada' | 'rejeitada';
}

/**
 * Reservas Mobile - Morador
 */
export default function AppReservasPage() {
    const [reservations, setReservations] = useState<Reservation[]>([]);
    const [loading, setLoading] = useState(true);
    const [role, setRole] = useState<'sindico' | 'morador' | 'porteiro'>('morador');
    const router = useRouter();
    const supabase = createClient();

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) {
            router.push('/app/login');
            return;
        }

        try {
            const response = await fetch('/api/auth/profile', {
                credentials: 'include',
                headers: { 'Authorization': `Bearer ${session.access_token}` },
            });

            if (response.ok) {
                const data = await response.json();
                const profile = data.profile;
                setRole(profile.role as any);

                // Buscar reservas
                let query = supabase
                    .from('reservations')
                    .select('*, common_areas(nome)')
                    .eq('condo_id', profile.condo_id)
                    .order('data', { ascending: false })
                    .limit(20);

                // Morador vê só as próprias
                if (profile.role === 'morador') {
                    query = query.eq('morador_id', profile.id);
                }

                const { data: reservasData } = await query;

                setReservations(reservasData?.map(r => ({
                    ...r,
                    area_nome: r.common_areas?.nome || 'Área comum'
                })) || []);
            }
        } catch (err) {
            console.error('[APP] Erro:', err);
        }
        setLoading(false);
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'aprovada':
                return { bg: '#dcfce7', color: '#166534', icon: <CheckCircle size={14} />, label: 'Aprovada' };
            case 'rejeitada':
                return { bg: '#fef2f2', color: '#dc2626', icon: <XCircle size={14} />, label: 'Rejeitada' };
            default:
                return { bg: '#fef3c7', color: '#d97706', icon: <Loader2 size={14} />, label: 'Pendente' };
        }
    };

    if (loading) {
        return (
            <>
                <MobileHeader title="Reservas" showBack />
                <main className="app-content">
                    <div className="app-loading"><div className="app-spinner" /></div>
                </main>
            </>
        );
    }

    return (
        <>
            <MobileHeader title="Minhas Reservas" showBack />

            <main className="app-content">
                {/* Botões de ação para síndico */}
                {role === 'sindico' && (
                    <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                        <button
                            className="app-button"
                            style={{ flex: 1, background: '#dcfce7', color: '#166534', border: 'none' }}
                            onClick={() => router.push('/app/reservas/aprovar')}
                        >
                            <CheckCircle size={18} style={{ marginRight: 6 }} />
                            Aprovar
                        </button>
                        <button
                            className="app-button"
                            style={{ flex: 1, background: '#dbeafe', color: '#1e40af', border: 'none' }}
                            onClick={() => router.push('/app/espacos')}
                        >
                            <Settings size={18} style={{ marginRight: 6 }} />
                            Espaços
                        </button>
                    </div>
                )}

                {/* Botão nova reserva */}
                <button
                    className="app-button app-button-primary app-w-full"
                    style={{ marginBottom: 20 }}
                    onClick={() => router.push('/app/reservas/nova')}
                >
                    <Calendar size={20} style={{ marginRight: 8 }} />
                    Nova Reserva
                </button>

                {/* Lista de reservas */}
                {reservations.length === 0 ? (
                    <div className="app-card app-text-center" style={{ color: '#6b7280', padding: 32 }}>
                        <Calendar size={48} style={{ color: '#d1d5db', marginBottom: 12 }} />
                        <p>Nenhuma reserva encontrada</p>
                    </div>
                ) : (
                    <div style={{ borderRadius: 12, overflow: 'hidden' }}>
                        {reservations.map((reservation) => {
                            const status = getStatusBadge(reservation.status);
                            return (
                                <div key={reservation.id} className="app-list-item" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                                    <div style={{ display: 'flex', width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <MapPin size={16} style={{ color: '#10b981' }} />
                                            <span style={{ fontWeight: 600, color: '#111827' }}>{reservation.area_nome}</span>
                                        </div>
                                        <span style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 4,
                                            padding: '2px 8px',
                                            borderRadius: 12,
                                            fontSize: 11,
                                            fontWeight: 500,
                                            background: status.bg,
                                            color: status.color
                                        }}>
                                            {status.icon} {status.label}
                                        </span>
                                    </div>
                                    <div style={{ display: 'flex', gap: 16, marginTop: 8 }}>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#6b7280', fontSize: 13 }}>
                                            <Calendar size={14} />
                                            {new Date(reservation.data).toLocaleDateString('pt-BR')}
                                        </span>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#6b7280', fontSize: 13 }}>
                                            <Clock size={14} />
                                            {reservation.hora_inicio} - {reservation.hora_fim}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </main>

            <BottomNav role={role} />
        </>
    );
}
