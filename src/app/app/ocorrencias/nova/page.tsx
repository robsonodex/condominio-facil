'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { MobileHeader, BottomNav } from '@/components/mobile';
import { AlertTriangle, Send } from 'lucide-react';

/**
 * Nova Ocorrência - Morador/Porteiro
 */
export default function AppNovaOcorrenciaPage() {
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [profile, setProfile] = useState<any>(null);
    const [formData, setFormData] = useState({
        titulo: '',
        descricao: '',
        categoria: 'geral',
        local: '',
        prioridade: 'media'
    });
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
            const { error } = await supabase.from('occurrences').insert({
                condo_id: profile.condo_id,
                morador_id: profile.id,
                titulo: formData.titulo,
                descricao: formData.descricao,
                categoria: formData.categoria,
                local: formData.local,
                prioridade: formData.prioridade,
                status: 'aberta'
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

    const role = (profile?.role as 'sindico' | 'morador' | 'porteiro') || 'morador';

    return (
        <>
            <MobileHeader title="Nova Ocorrência" showBack />

            <main className="app-content">
                {success ? (
                    <div className="app-card" style={{ textAlign: 'center', padding: 32 }}>
                        <AlertTriangle size={48} style={{ color: '#10b981', marginBottom: 16 }} />
                        <h3 style={{ color: '#10b981', fontSize: 18, fontWeight: 600 }}>Ocorrência Registrada!</h3>
                        <p style={{ color: '#6b7280', marginTop: 8 }}>Sua ocorrência foi enviada com sucesso.</p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="app-card">
                        <div style={{ marginBottom: 16 }}>
                            <label style={{ display: 'block', marginBottom: 6, color: '#374151', fontWeight: 500 }}>Título *</label>
                            <input
                                type="text"
                                className="app-input"
                                value={formData.titulo}
                                onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                                required
                                placeholder="Resumo do problema"
                            />
                        </div>

                        <div style={{ marginBottom: 16 }}>
                            <label style={{ display: 'block', marginBottom: 6, color: '#374151', fontWeight: 500 }}>Categoria</label>
                            <select
                                className="app-input"
                                value={formData.categoria}
                                onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                            >
                                <option value="geral">Geral</option>
                                <option value="barulho">Barulho</option>
                                <option value="manutencao">Manutenção</option>
                                <option value="seguranca">Segurança</option>
                                <option value="convivencia">Convivência</option>
                                <option value="limpeza">Limpeza</option>
                            </select>
                        </div>

                        <div style={{ marginBottom: 16 }}>
                            <label style={{ display: 'block', marginBottom: 6, color: '#374151', fontWeight: 500 }}>Local</label>
                            <input
                                type="text"
                                className="app-input"
                                value={formData.local}
                                onChange={(e) => setFormData({ ...formData, local: e.target.value })}
                                placeholder="Ex: Garagem, Salão de Festas"
                            />
                        </div>

                        <div style={{ marginBottom: 16 }}>
                            <label style={{ display: 'block', marginBottom: 6, color: '#374151', fontWeight: 500 }}>Prioridade</label>
                            <div style={{ display: 'flex', gap: 8 }}>
                                {['baixa', 'media', 'alta'].map((p) => (
                                    <button
                                        key={p}
                                        type="button"
                                        onClick={() => setFormData({ ...formData, prioridade: p })}
                                        style={{
                                            flex: 1,
                                            padding: '12px 8px',
                                            borderRadius: 8,
                                            border: `2px solid ${formData.prioridade === p ? (p === 'alta' ? '#ef4444' : p === 'media' ? '#f59e0b' : '#10b981') : '#e5e7eb'}`,
                                            background: formData.prioridade === p ? (p === 'alta' ? '#fef2f2' : p === 'media' ? '#fffbeb' : '#ecfdf5') : '#fff',
                                            color: p === 'alta' ? '#dc2626' : p === 'media' ? '#d97706' : '#059669',
                                            fontWeight: 600,
                                            fontSize: 13,
                                            cursor: 'pointer'
                                        }}
                                    >
                                        {p.charAt(0).toUpperCase() + p.slice(1)}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div style={{ marginBottom: 24 }}>
                            <label style={{ display: 'block', marginBottom: 6, color: '#374151', fontWeight: 500 }}>Descrição *</label>
                            <textarea
                                className="app-input"
                                value={formData.descricao}
                                onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                                required
                                placeholder="Descreva detalhadamente o problema..."
                                rows={4}
                                style={{ resize: 'none' }}
                            />
                        </div>

                        <button
                            type="submit"
                            className="app-button app-button-primary app-w-full"
                            disabled={loading}
                        >
                            <Send size={20} style={{ marginRight: 8 }} />
                            {loading ? 'Enviando...' : 'Enviar Ocorrência'}
                        </button>
                    </form>
                )}
            </main>

            <BottomNav role={role} />
        </>
    );
}
