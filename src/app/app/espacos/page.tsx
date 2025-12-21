'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { MobileHeader, BottomNav } from '@/components/mobile';
import { MapPin, Plus, Clock, CheckCircle } from 'lucide-react';

interface Espaco {
    id: string;
    nome: string;
    descricao: string | null;
    horario_inicio: string;
    horario_fim: string;
    ativo: boolean;
}

/**
 * Espaços/Áreas Comuns - Síndico
 */
export default function AppEspacosPage() {
    const [espacos, setEspacos] = useState<Espaco[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [saving, setSaving] = useState(false);
    const [profile, setProfile] = useState<any>(null);
    const [formData, setFormData] = useState({
        nome: '',
        descricao: '',
        horario_inicio: '08:00',
        horario_fim: '22:00'
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

                if (data.profile?.role !== 'sindico' && data.profile?.role !== 'superadmin') {
                    router.push('/app/dashboard');
                    return;
                }

                const { data: espacosData } = await supabase
                    .from('common_areas')
                    .select('*')
                    .eq('condo_id', data.profile.condo_id)
                    .order('nome');

                setEspacos(espacosData || []);
            }
        } catch (err) {
            console.error('[APP] Erro:', err);
        }
        setLoading(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!profile?.condo_id) return;

        setSaving(true);
        try {
            const { error } = await supabase.from('common_areas').insert({
                condo_id: profile.condo_id,
                nome: formData.nome,
                descricao: formData.descricao || null,
                horario_inicio: formData.horario_inicio,
                horario_fim: formData.horario_fim,
                ativo: true
            });

            if (!error) {
                setShowForm(false);
                setFormData({ nome: '', descricao: '', horario_inicio: '08:00', horario_fim: '22:00' });
                loadData();
            } else {
                alert('Erro: ' + error.message);
            }
        } catch (err: any) {
            alert('Erro: ' + err.message);
        }
        setSaving(false);
    };

    if (loading) {
        return (
            <>
                <MobileHeader title="Espaços" showBack />
                <main className="app-content">
                    <div className="app-loading"><div className="app-spinner" /></div>
                </main>
            </>
        );
    }

    return (
        <>
            <MobileHeader title="Espaços" showBack />

            <main className="app-content">
                {/* Botão Cadastrar */}
                <button
                    className="app-button app-button-primary app-w-full"
                    style={{ marginBottom: 16 }}
                    onClick={() => setShowForm(!showForm)}
                >
                    <Plus size={20} style={{ marginRight: 8 }} />
                    {showForm ? 'Cancelar' : 'Cadastrar Espaço'}
                </button>

                {/* Formulário */}
                {showForm && (
                    <form onSubmit={handleSubmit} className="app-card" style={{ marginBottom: 16 }}>
                        <div style={{ marginBottom: 12 }}>
                            <label style={{ display: 'block', marginBottom: 4, color: '#374151', fontWeight: 500, fontSize: 14 }}>Nome *</label>
                            <input
                                type="text"
                                className="app-input"
                                value={formData.nome}
                                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                                required
                                placeholder="Ex: Salão de Festas"
                            />
                        </div>
                        <div style={{ marginBottom: 12 }}>
                            <label style={{ display: 'block', marginBottom: 4, color: '#374151', fontWeight: 500, fontSize: 14 }}>Descrição</label>
                            <input
                                type="text"
                                className="app-input"
                                value={formData.descricao}
                                onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                                placeholder="Descrição (opcional)"
                            />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: 4, color: '#374151', fontWeight: 500, fontSize: 14 }}>Abre</label>
                                <input
                                    type="time"
                                    className="app-input"
                                    value={formData.horario_inicio}
                                    onChange={(e) => setFormData({ ...formData, horario_inicio: e.target.value })}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: 4, color: '#374151', fontWeight: 500, fontSize: 14 }}>Fecha</label>
                                <input
                                    type="time"
                                    className="app-input"
                                    value={formData.horario_fim}
                                    onChange={(e) => setFormData({ ...formData, horario_fim: e.target.value })}
                                />
                            </div>
                        </div>
                        <button
                            type="submit"
                            className="app-button app-button-primary app-w-full"
                            disabled={saving}
                        >
                            {saving ? 'Salvando...' : 'Salvar Espaço'}
                        </button>
                    </form>
                )}

                {/* Lista */}
                {espacos.length === 0 ? (
                    <div className="app-card" style={{ textAlign: 'center', padding: 32 }}>
                        <MapPin size={48} style={{ color: '#d1d5db', marginBottom: 16 }} />
                        <p style={{ color: '#6b7280' }}>Nenhum espaço cadastrado</p>
                    </div>
                ) : (
                    <div style={{ borderRadius: 12, overflow: 'hidden' }}>
                        {espacos.map((espaco) => (
                            <div key={espaco.id} className="app-list-item">
                                <div style={{
                                    width: 40,
                                    height: 40,
                                    borderRadius: 8,
                                    background: espaco.ativo ? '#dcfce7' : '#f3f4f6',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    marginRight: 12
                                }}>
                                    <MapPin size={20} style={{ color: espaco.ativo ? '#10b981' : '#9ca3af' }} />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <p style={{ fontWeight: 600, color: '#111827', fontSize: 14 }}>{espaco.nome}</p>
                                    <p style={{ color: '#6b7280', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
                                        <Clock size={12} />
                                        {espaco.horario_inicio} - {espaco.horario_fim}
                                    </p>
                                </div>
                                <span style={{
                                    padding: '4px 8px',
                                    borderRadius: 12,
                                    fontSize: 11,
                                    fontWeight: 500,
                                    background: espaco.ativo ? '#dcfce7' : '#f3f4f6',
                                    color: espaco.ativo ? '#166534' : '#6b7280'
                                }}>
                                    {espaco.ativo ? 'Ativo' : 'Inativo'}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </main>

            <BottomNav role="sindico" />
        </>
    );
}
