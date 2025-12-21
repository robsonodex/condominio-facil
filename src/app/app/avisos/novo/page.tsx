'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { MobileHeader, BottomNav } from '@/components/mobile';
import { Bell, Send } from 'lucide-react';

/**
 * Cadastrar Aviso - Síndico
 */
export default function AppNovoAvisoPage() {
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [profile, setProfile] = useState<any>(null);
    const [formData, setFormData] = useState({
        titulo: '',
        conteudo: '',
        prioridade: 'normal'
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
            const { error } = await supabase.from('notices').insert({
                condo_id: profile.condo_id,
                autor_id: profile.id,
                titulo: formData.titulo,
                conteudo: formData.conteudo,
                prioridade: formData.prioridade,
                ativo: true
            });

            if (!error) {
                setSuccess(true);
                setTimeout(() => router.push('/app/avisos'), 1500);
            } else {
                alert('Erro: ' + error.message);
            }
        } catch (err: any) {
            alert('Erro: ' + err.message);
        }
        setLoading(false);
    };

    return (
        <>
            <MobileHeader title="Novo Aviso" showBack />

            <main className="app-content">
                {success ? (
                    <div className="app-card" style={{ textAlign: 'center', padding: 32 }}>
                        <Bell size={48} style={{ color: '#10b981', marginBottom: 16 }} />
                        <h3 style={{ color: '#10b981', fontSize: 18, fontWeight: 600 }}>Aviso Publicado!</h3>
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
                                placeholder="Título do aviso"
                            />
                        </div>

                        <div style={{ marginBottom: 16 }}>
                            <label style={{ display: 'block', marginBottom: 6, color: '#374151', fontWeight: 500 }}>Prioridade</label>
                            <div style={{ display: 'flex', gap: 8 }}>
                                {['baixa', 'normal', 'alta'].map((p) => (
                                    <button
                                        key={p}
                                        type="button"
                                        onClick={() => setFormData({ ...formData, prioridade: p })}
                                        style={{
                                            flex: 1,
                                            padding: '12px 8px',
                                            borderRadius: 8,
                                            border: `2px solid ${formData.prioridade === p ? (p === 'alta' ? '#ef4444' : p === 'normal' ? '#f59e0b' : '#10b981') : '#e5e7eb'}`,
                                            background: formData.prioridade === p ? (p === 'alta' ? '#fef2f2' : p === 'normal' ? '#fffbeb' : '#ecfdf5') : '#fff',
                                            color: p === 'alta' ? '#dc2626' : p === 'normal' ? '#d97706' : '#059669',
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
                            <label style={{ display: 'block', marginBottom: 6, color: '#374151', fontWeight: 500 }}>Conteúdo *</label>
                            <textarea
                                className="app-input"
                                value={formData.conteudo}
                                onChange={(e) => setFormData({ ...formData, conteudo: e.target.value })}
                                required
                                placeholder="Escreva o conteúdo do aviso..."
                                rows={5}
                                style={{ resize: 'none' }}
                            />
                        </div>

                        <button
                            type="submit"
                            className="app-button app-button-primary app-w-full"
                            disabled={loading}
                        >
                            <Send size={20} style={{ marginRight: 8 }} />
                            {loading ? 'Publicando...' : 'Publicar Aviso'}
                        </button>
                    </form>
                )}
            </main>

            <BottomNav role="sindico" />
        </>
    );
}
