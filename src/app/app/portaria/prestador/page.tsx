'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { MobileHeader, BottomNav } from '@/components/mobile';
import { Briefcase, LogIn } from 'lucide-react';

/**
 * Registrar Prestador - Porteiro
 */
export default function AppPortariaPrestadorPage() {
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [formData, setFormData] = useState({
        nome: '',
        documento: '',
        empresa: '',
        servico: '',
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
                nome: formData.nome,
                documento: formData.documento,
                tipo: 'prestador',
                empresa: formData.empresa,
                servico: formData.servico,
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
            <MobileHeader title="Registrar Prestador" showBack />

            <main className="app-content">
                {success ? (
                    <div className="app-card" style={{ textAlign: 'center', padding: 32 }}>
                        <Briefcase size={48} style={{ color: '#f59e0b', marginBottom: 16 }} />
                        <h3 style={{ color: '#f59e0b', fontSize: 18, fontWeight: 600 }}>Prestador Registrado!</h3>
                        <p style={{ color: '#6b7280', marginTop: 8 }}>Entrada registrada com sucesso.</p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="app-card">
                        <div style={{ marginBottom: 16 }}>
                            <label style={{ display: 'block', marginBottom: 6, color: '#374151', fontWeight: 500 }}>Nome do Prestador *</label>
                            <input
                                type="text"
                                className="app-input"
                                value={formData.nome}
                                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                                required
                                placeholder="Nome completo"
                            />
                        </div>

                        <div style={{ marginBottom: 16 }}>
                            <label style={{ display: 'block', marginBottom: 6, color: '#374151', fontWeight: 500 }}>Documento</label>
                            <input
                                type="text"
                                className="app-input"
                                value={formData.documento}
                                onChange={(e) => setFormData({ ...formData, documento: e.target.value })}
                                placeholder="RG ou CPF"
                            />
                        </div>

                        <div style={{ marginBottom: 16 }}>
                            <label style={{ display: 'block', marginBottom: 6, color: '#374151', fontWeight: 500 }}>Empresa</label>
                            <input
                                type="text"
                                className="app-input"
                                value={formData.empresa}
                                onChange={(e) => setFormData({ ...formData, empresa: e.target.value })}
                                placeholder="Nome da empresa"
                            />
                        </div>

                        <div style={{ marginBottom: 16 }}>
                            <label style={{ display: 'block', marginBottom: 6, color: '#374151', fontWeight: 500 }}>Serviço</label>
                            <input
                                type="text"
                                className="app-input"
                                value={formData.servico}
                                onChange={(e) => setFormData({ ...formData, servico: e.target.value })}
                                placeholder="Ex: Manutenção, Entrega, etc"
                            />
                        </div>

                        <div style={{ marginBottom: 24 }}>
                            <label style={{ display: 'block', marginBottom: 6, color: '#374151', fontWeight: 500 }}>Destino</label>
                            <input
                                type="text"
                                className="app-input"
                                value={formData.destino}
                                onChange={(e) => setFormData({ ...formData, destino: e.target.value })}
                                placeholder="Ex: Área comum, Apto 101"
                            />
                        </div>

                        <button
                            type="submit"
                            className="app-button app-button-primary app-w-full"
                            disabled={loading}
                            style={{ background: '#f59e0b' }}
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
