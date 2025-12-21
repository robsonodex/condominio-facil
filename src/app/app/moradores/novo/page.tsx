'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { MobileHeader, BottomNav } from '@/components/mobile';
import { Users, Send } from 'lucide-react';

/**
 * Cadastrar Morador - Síndico
 */
export default function AppNovoMoradorPage() {
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [profile, setProfile] = useState<any>(null);
    const [unidades, setUnidades] = useState<any[]>([]);
    const [formData, setFormData] = useState({
        nome: '',
        email: '',
        telefone: '',
        cpf: '',
        unidade_id: ''
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

        const response = await fetch('/api/auth/profile', {
            credentials: 'include',
            headers: { 'Authorization': `Bearer ${session.access_token}` },
        });

        if (response.ok) {
            const data = await response.json();
            setProfile(data.profile);

            // Buscar unidades
            const { data: unidadesData } = await supabase
                .from('units')
                .select('id, numero_unidade, bloco')
                .eq('condo_id', data.profile.condo_id)
                .order('numero_unidade');

            setUnidades(unidadesData || []);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!profile?.condo_id) return;

        setLoading(true);
        try {
            const { error } = await supabase.from('residents').insert({
                condo_id: profile.condo_id,
                nome: formData.nome,
                email: formData.email,
                telefone: formData.telefone || null,
                cpf: formData.cpf || null,
                unidade_id: formData.unidade_id || null,
                ativo: true
            });

            if (!error) {
                setSuccess(true);
                setTimeout(() => router.push('/app/moradores'), 1500);
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
            <MobileHeader title="Novo Morador" showBack />

            <main className="app-content">
                {success ? (
                    <div className="app-card" style={{ textAlign: 'center', padding: 32 }}>
                        <Users size={48} style={{ color: '#10b981', marginBottom: 16 }} />
                        <h3 style={{ color: '#10b981', fontSize: 18, fontWeight: 600 }}>Morador Cadastrado!</h3>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="app-card">
                        <div style={{ marginBottom: 16 }}>
                            <label style={{ display: 'block', marginBottom: 6, color: '#374151', fontWeight: 500 }}>Nome *</label>
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
                            <label style={{ display: 'block', marginBottom: 6, color: '#374151', fontWeight: 500 }}>Email *</label>
                            <input
                                type="email"
                                className="app-input"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                required
                                placeholder="email@exemplo.com"
                            />
                        </div>

                        <div style={{ marginBottom: 16 }}>
                            <label style={{ display: 'block', marginBottom: 6, color: '#374151', fontWeight: 500 }}>Telefone</label>
                            <input
                                type="tel"
                                className="app-input"
                                value={formData.telefone}
                                onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                                placeholder="(00) 00000-0000"
                            />
                        </div>

                        <div style={{ marginBottom: 16 }}>
                            <label style={{ display: 'block', marginBottom: 6, color: '#374151', fontWeight: 500 }}>CPF</label>
                            <input
                                type="text"
                                className="app-input"
                                value={formData.cpf}
                                onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
                                placeholder="000.000.000-00"
                            />
                        </div>

                        <div style={{ marginBottom: 24 }}>
                            <label style={{ display: 'block', marginBottom: 6, color: '#374151', fontWeight: 500 }}>Unidade</label>
                            <select
                                className="app-input"
                                value={formData.unidade_id}
                                onChange={(e) => setFormData({ ...formData, unidade_id: e.target.value })}
                            >
                                <option value="">Selecione a unidade</option>
                                {unidades.map((u) => (
                                    <option key={u.id} value={u.id}>
                                        {u.numero_unidade} {u.bloco ? `- Bloco ${u.bloco}` : ''}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <button
                            type="submit"
                            className="app-button app-button-primary app-w-full"
                            disabled={loading}
                        >
                            <Send size={20} style={{ marginRight: 8 }} />
                            {loading ? 'Salvando...' : 'Cadastrar Morador'}
                        </button>
                    </form>
                )}
            </main>

            <BottomNav role="sindico" />
        </>
    );
}
