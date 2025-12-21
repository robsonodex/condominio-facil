'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { MobileHeader, BottomNav } from '@/components/mobile';
import { Calendar, Clock, MapPin, Send } from 'lucide-react';

interface AreaComum {
    id: string;
    nome: string;
    horario_inicio: string;
    horario_fim: string;
}

/**
 * Nova Reserva - Morador
 */
export default function AppNovaReservaPage() {
    const [loading, setLoading] = useState(false);
    const [loadingAreas, setLoadingAreas] = useState(true);
    const [success, setSuccess] = useState(false);
    const [profile, setProfile] = useState<any>(null);
    const [areas, setAreas] = useState<AreaComum[]>([]);
    const [formData, setFormData] = useState({
        area_id: '',
        data: '',
        hora_inicio: '',
        hora_fim: '',
        observacoes: ''
    });
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

                // Buscar áreas comuns
                const { data: areasData } = await supabase
                    .from('common_areas')
                    .select('id, nome, horario_inicio, horario_fim')
                    .eq('condo_id', data.profile.condo_id)
                    .eq('ativo', true)
                    .order('nome');

                setAreas(areasData || []);
            }
        } catch (err) {
            console.error('[APP] Erro:', err);
        }
        setLoadingAreas(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!profile?.condo_id || !formData.area_id) return;

        setLoading(true);
        try {
            const { error } = await supabase.from('reservations').insert({
                condo_id: profile.condo_id,
                morador_id: profile.id,
                area_id: formData.area_id,
                data: formData.data,
                hora_inicio: formData.hora_inicio,
                hora_fim: formData.hora_fim,
                observacoes: formData.observacoes || null,
                status: 'pendente'
            });

            if (!error) {
                setSuccess(true);
                setTimeout(() => router.push('/app/reservas'), 1500);
            } else {
                alert('Erro ao criar reserva: ' + error.message);
            }
        } catch (err: any) {
            alert('Erro: ' + err.message);
        }
        setLoading(false);
    };

    // Gerar data mínima (hoje)
    const today = new Date().toISOString().split('T')[0];

    const role = (profile?.role as 'sindico' | 'morador' | 'porteiro') || 'morador';

    if (loadingAreas) {
        return (
            <>
                <MobileHeader title="Nova Reserva" showBack />
                <main className="app-content">
                    <div className="app-loading"><div className="app-spinner" /></div>
                </main>
            </>
        );
    }

    return (
        <>
            <MobileHeader title="Nova Reserva" showBack />

            <main className="app-content">
                {success ? (
                    <div className="app-card" style={{ textAlign: 'center', padding: 32 }}>
                        <Calendar size={48} style={{ color: '#10b981', marginBottom: 16 }} />
                        <h3 style={{ color: '#10b981', fontSize: 18, fontWeight: 600 }}>Reserva Solicitada!</h3>
                        <p style={{ color: '#6b7280', marginTop: 8 }}>Aguarde a aprovação do síndico.</p>
                    </div>
                ) : areas.length === 0 ? (
                    <div className="app-card" style={{ textAlign: 'center', padding: 32 }}>
                        <MapPin size={48} style={{ color: '#d1d5db', marginBottom: 16 }} />
                        <h3 style={{ color: '#6b7280', fontSize: 16 }}>Nenhuma área disponível</h3>
                        <p style={{ color: '#9ca3af', fontSize: 14, marginTop: 4 }}>
                            O condomínio não possui áreas comuns cadastradas
                        </p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="app-card">
                        <div style={{ marginBottom: 16 }}>
                            <label style={{ display: 'block', marginBottom: 6, color: '#374151', fontWeight: 500 }}>
                                <MapPin size={16} style={{ marginRight: 4, verticalAlign: 'middle' }} />
                                Área Comum *
                            </label>
                            <select
                                className="app-input"
                                value={formData.area_id}
                                onChange={(e) => setFormData({ ...formData, area_id: e.target.value })}
                                required
                            >
                                <option value="">Selecione uma área</option>
                                {areas.map((area) => (
                                    <option key={area.id} value={area.id}>
                                        {area.nome}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div style={{ marginBottom: 16 }}>
                            <label style={{ display: 'block', marginBottom: 6, color: '#374151', fontWeight: 500 }}>
                                <Calendar size={16} style={{ marginRight: 4, verticalAlign: 'middle' }} />
                                Data *
                            </label>
                            <input
                                type="date"
                                className="app-input"
                                value={formData.data}
                                onChange={(e) => setFormData({ ...formData, data: e.target.value })}
                                required
                                min={today}
                            />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: 6, color: '#374151', fontWeight: 500 }}>
                                    <Clock size={16} style={{ marginRight: 4, verticalAlign: 'middle' }} />
                                    Início *
                                </label>
                                <input
                                    type="time"
                                    className="app-input"
                                    value={formData.hora_inicio}
                                    onChange={(e) => setFormData({ ...formData, hora_inicio: e.target.value })}
                                    required
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: 6, color: '#374151', fontWeight: 500 }}>
                                    <Clock size={16} style={{ marginRight: 4, verticalAlign: 'middle' }} />
                                    Fim *
                                </label>
                                <input
                                    type="time"
                                    className="app-input"
                                    value={formData.hora_fim}
                                    onChange={(e) => setFormData({ ...formData, hora_fim: e.target.value })}
                                    required
                                />
                            </div>
                        </div>

                        <div style={{ marginBottom: 24 }}>
                            <label style={{ display: 'block', marginBottom: 6, color: '#374151', fontWeight: 500 }}>
                                Observações
                            </label>
                            <textarea
                                className="app-input"
                                value={formData.observacoes}
                                onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                                placeholder="Ex: Festa de aniversário, 30 convidados"
                                rows={3}
                                style={{ resize: 'none' }}
                            />
                        </div>

                        <button
                            type="submit"
                            className="app-button app-button-primary app-w-full"
                            disabled={loading}
                        >
                            <Send size={20} style={{ marginRight: 8 }} />
                            {loading ? 'Enviando...' : 'Solicitar Reserva'}
                        </button>
                    </form>
                )}
            </main>

            <BottomNav role={role} />
        </>
    );
}
