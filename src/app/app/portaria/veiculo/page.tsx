'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { MobileHeader, BottomNav } from '@/components/mobile';
import { Car, LogIn } from 'lucide-react';

/**
 * Registrar Veículo - Porteiro
 */
export default function AppPortariaVeiculoPage() {
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [formData, setFormData] = useState({
        placa: '',
        modelo: '',
        cor: '',
        motorista: '',
        destino: ''
    });
    const [profile, setProfile] = useState<any>(null);
    const router = useRouter();
    const supabase = createClient();

    useEffect(() => {
        loadProfile();
    }, []);

    const loadProfile = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) {
            router.push('/app/login');
            return;
        }

        const response = await fetch('/api/auth/profile', {
            credentials: 'include',
            headers: { 'Authorization': `Bearer ${session.access_token}` },
        });

        if (response.ok) {
            const data = await response.json();
            setProfile(data.profile);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!profile?.condo_id) return;

        setLoading(true);
        try {
            const { error } = await supabase.from('visitor_entries').insert({
                condo_id: profile.condo_id,
                nome: formData.motorista || `Veículo ${formData.placa}`,
                tipo: 'veiculo',
                placa: formData.placa,
                modelo: formData.modelo,
                cor: formData.cor,
                destino: formData.destino,
                entrada: new Date().toISOString(),
                registrado_por: profile.id
            });

            if (!error) {
                setSuccess(true);
                setTimeout(() => router.push('/app/dashboard'), 1500);
            }
        } catch (err) {
            console.error(err);
        }
        setLoading(false);
    };

    return (
        <>
            <MobileHeader title="Registrar Veículo" showBack />

            <main className="app-content">
                {success ? (
                    <div className="app-card" style={{ textAlign: 'center', padding: 32 }}>
                        <Car size={48} style={{ color: '#10b981', marginBottom: 16 }} />
                        <h3 style={{ color: '#10b981', fontSize: 18, fontWeight: 600 }}>Veículo Registrado!</h3>
                        <p style={{ color: '#6b7280', marginTop: 8 }}>Entrada registrada com sucesso.</p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="app-card">
                        <div style={{ marginBottom: 16 }}>
                            <label style={{ display: 'block', marginBottom: 6, color: '#374151', fontWeight: 500 }}>Placa *</label>
                            <input
                                type="text"
                                className="app-input"
                                value={formData.placa}
                                onChange={(e) => setFormData({ ...formData, placa: e.target.value.toUpperCase() })}
                                required
                                placeholder="ABC-1234"
                                style={{ textTransform: 'uppercase' }}
                            />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                            <div style={{ marginBottom: 16 }}>
                                <label style={{ display: 'block', marginBottom: 6, color: '#374151', fontWeight: 500 }}>Modelo</label>
                                <input
                                    type="text"
                                    className="app-input"
                                    value={formData.modelo}
                                    onChange={(e) => setFormData({ ...formData, modelo: e.target.value })}
                                    placeholder="Ex: Gol"
                                />
                            </div>

                            <div style={{ marginBottom: 16 }}>
                                <label style={{ display: 'block', marginBottom: 6, color: '#374151', fontWeight: 500 }}>Cor</label>
                                <input
                                    type="text"
                                    className="app-input"
                                    value={formData.cor}
                                    onChange={(e) => setFormData({ ...formData, cor: e.target.value })}
                                    placeholder="Ex: Prata"
                                />
                            </div>
                        </div>

                        <div style={{ marginBottom: 16 }}>
                            <label style={{ display: 'block', marginBottom: 6, color: '#374151', fontWeight: 500 }}>Motorista</label>
                            <input
                                type="text"
                                className="app-input"
                                value={formData.motorista}
                                onChange={(e) => setFormData({ ...formData, motorista: e.target.value })}
                                placeholder="Nome do motorista"
                            />
                        </div>

                        <div style={{ marginBottom: 24 }}>
                            <label style={{ display: 'block', marginBottom: 6, color: '#374151', fontWeight: 500 }}>Destino</label>
                            <input
                                type="text"
                                className="app-input"
                                value={formData.destino}
                                onChange={(e) => setFormData({ ...formData, destino: e.target.value })}
                                placeholder="Ex: Visitando Apto 101"
                            />
                        </div>

                        <button
                            type="submit"
                            className="app-button app-button-primary app-w-full"
                            disabled={loading}
                        >
                            <LogIn size={20} style={{ marginRight: 8 }} />
                            {loading ? 'Registrando...' : 'Registrar Entrada'}
                        </button>
                    </form>
                )}
            </main>

            <BottomNav role="porteiro" />
        </>
    );
}
