'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { MobileHeader, BottomNav } from '@/components/mobile';
import { Calendar, Clock, MapPin, CheckCircle, XCircle, User } from 'lucide-react';

interface Reserva {
    id: string;
    area_nome: string;
    morador_nome: string;
    data: string;
    hora_inicio: string;
    hora_fim: string;
    status: string;
    observacoes: string | null;
}

/**
 * Aprovar Reservas - Síndico
 */
export default function AppAprovarReservasPage() {
    const [reservas, setReservas] = useState<Reserva[]>([]);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState<string | null>(null);
    const [profile, setProfile] = useState<any>(null);
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
                setProfile(data.profile);

                if (data.profile?.role !== 'sindico' && data.profile?.role !== 'superadmin') {
                    router.push('/app/dashboard');
                    return;
                }

                // Buscar reservas pendentes
                const { data: reservasData } = await supabase
                    .from('reservations')
                    .select('*, common_areas(nome), morador:users(nome)')
                    .eq('condo_id', data.profile.condo_id)
                    .eq('status', 'pendente')
                    .order('data', { ascending: true });

                setReservas(reservasData?.map(r => ({
                    ...r,
                    area_nome: r.common_areas?.nome || 'Área comum',
                    morador_nome: r.morador?.nome || 'Morador'
                })) || []);
            }
        } catch (err) {
            console.error('[APP] Erro:', err);
        }
        setLoading(false);
    };

    const handleAction = async (id: string, status: 'aprovada' | 'rejeitada') => {
        setProcessing(id);
        try {
            const { error } = await supabase
                .from('reservations')
                .update({ status })
                .eq('id', id);

            if (!error) {
                setReservas(prev => prev.filter(r => r.id !== id));
            }
        } catch (err) {
            console.error(err);
        }
        setProcessing(null);
    };

    if (loading) {
        return (
            <>
                <MobileHeader title="Aprovar Reservas" showBack />
                <main className="app-content">
                    <div className="app-loading"><div className="app-spinner" /></div>
                </main>
            </>
        );
    }

    return (
        <>
            <MobileHeader title="Aprovar Reservas" showBack />

            <main className="app-content">
                {reservas.length === 0 ? (
                    <div className="app-card" style={{ textAlign: 'center', padding: 32 }}>
                        <CheckCircle size={48} style={{ color: '#10b981', marginBottom: 16 }} />
                        <h3 style={{ color: '#10b981', fontSize: 16 }}>Tudo em dia!</h3>
                        <p style={{ color: '#6b7280', fontSize: 14, marginTop: 4 }}>
                            Não há reservas pendentes
                        </p>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {reservas.map((reserva) => (
                            <div key={reserva.id} className="app-card" style={{ padding: 16 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                                    <MapPin size={16} style={{ color: '#10b981' }} />
                                    <span style={{ fontWeight: 600, color: '#111827' }}>{reserva.area_nome}</span>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                                    <User size={14} style={{ color: '#6b7280' }} />
                                    <span style={{ color: '#6b7280', fontSize: 13 }}>{reserva.morador_nome}</span>
                                </div>

                                <div style={{ display: 'flex', gap: 16, marginBottom: 12 }}>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#6b7280', fontSize: 13 }}>
                                        <Calendar size={14} />
                                        {new Date(reserva.data).toLocaleDateString('pt-BR')}
                                    </span>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#6b7280', fontSize: 13 }}>
                                        <Clock size={14} />
                                        {reserva.hora_inicio} - {reserva.hora_fim}
                                    </span>
                                </div>

                                {reserva.observacoes && (
                                    <p style={{ color: '#9ca3af', fontSize: 12, marginBottom: 12, fontStyle: 'italic' }}>
                                        "{reserva.observacoes}"
                                    </p>
                                )}

                                <div style={{ display: 'flex', gap: 8 }}>
                                    <button
                                        onClick={() => handleAction(reserva.id, 'aprovada')}
                                        disabled={processing === reserva.id}
                                        style={{
                                            flex: 1,
                                            padding: '12px',
                                            borderRadius: 8,
                                            border: 'none',
                                            background: '#dcfce7',
                                            color: '#166534',
                                            fontWeight: 600,
                                            fontSize: 14,
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: 6
                                        }}
                                    >
                                        <CheckCircle size={16} />
                                        Aprovar
                                    </button>
                                    <button
                                        onClick={() => handleAction(reserva.id, 'rejeitada')}
                                        disabled={processing === reserva.id}
                                        style={{
                                            flex: 1,
                                            padding: '12px',
                                            borderRadius: 8,
                                            border: 'none',
                                            background: '#fef2f2',
                                            color: '#dc2626',
                                            fontWeight: 600,
                                            fontSize: 14,
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: 6
                                        }}
                                    >
                                        <XCircle size={16} />
                                        Rejeitar
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>

            <BottomNav role="sindico" />
        </>
    );
}
