'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { MobileHeader, BottomNav } from '@/components/mobile';
import { Users, Send, Key } from 'lucide-react';

/**
 * Cadastrar Usuário - Síndico
 */
export default function AppNovoUsuarioPage() {
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [profile, setProfile] = useState<any>(null);
    const [session, setSession] = useState<any>(null);
    const [formData, setFormData] = useState({
        nome: '',
        email: '',
        telefone: '',
        role: 'morador',
        senha: ''
    });
    const router = useRouter();
    const supabase = createClient();

    useEffect(() => {
        loadProfile();
    }, []);

    const loadProfile = async () => {
        const { data: { session: s } } = await supabase.auth.getSession();
        if (!s?.user) {
            router.push('/app/login');
            return;
        }
        setSession(s);

        const response = await fetch('/api/auth/profile', {
            credentials: 'include',
            headers: { 'Authorization': `Bearer ${s.access_token}` },
        });

        if (response.ok) {
            const data = await response.json();
            setProfile(data.profile);
        }
    };

    const generatePassword = () => {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
        let password = '';
        for (let i = 0; i < 8; i++) {
            password += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        setFormData({ ...formData, senha: password });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!profile?.condo_id || !session) return;

        setLoading(true);
        try {
            const response = await fetch('/api/usuarios/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`,
                },
                credentials: 'include',
                body: JSON.stringify({
                    email: formData.email,
                    password: formData.senha,
                    nome: formData.nome,
                    telefone: formData.telefone || null,
                    role: formData.role,
                    condo_id: profile.condo_id,
                }),
            });

            const data = await response.json();

            if (response.ok && data.success) {
                setSuccess(true);
                setTimeout(() => router.push('/app/usuarios'), 1500);
            } else {
                alert('Erro: ' + (data.error || 'Erro ao criar usuário'));
            }
        } catch (err: any) {
            alert('Erro: ' + err.message);
        }
        setLoading(false);
    };

    return (
        <>
            <MobileHeader title="Novo Usuário" showBack />

            <main className="app-content">
                {success ? (
                    <div className="app-card" style={{ textAlign: 'center', padding: 32 }}>
                        <Users size={48} style={{ color: '#10b981', marginBottom: 16 }} />
                        <h3 style={{ color: '#10b981', fontSize: 18, fontWeight: 600 }}>Usuário Criado!</h3>
                        <p style={{ color: '#6b7280', marginTop: 8 }}>Email com credenciais foi enviado.</p>
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
                            <label style={{ display: 'block', marginBottom: 6, color: '#374151', fontWeight: 500 }}>Tipo de Usuário *</label>
                            <select
                                className="app-input"
                                value={formData.role}
                                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                required
                            >
                                <option value="morador">Morador</option>
                                <option value="porteiro">Porteiro</option>
                                <option value="sindico">Síndico</option>
                            </select>
                        </div>

                        <div style={{ marginBottom: 24 }}>
                            <label style={{ display: 'block', marginBottom: 6, color: '#374151', fontWeight: 500 }}>Senha Inicial *</label>
                            <div style={{ display: 'flex', gap: 8 }}>
                                <input
                                    type="text"
                                    className="app-input"
                                    value={formData.senha}
                                    onChange={(e) => setFormData({ ...formData, senha: e.target.value })}
                                    required
                                    minLength={6}
                                    placeholder="Mínimo 6 caracteres"
                                    style={{ flex: 1 }}
                                />
                                <button
                                    type="button"
                                    onClick={generatePassword}
                                    style={{
                                        padding: '12px 16px',
                                        background: '#f3f4f6',
                                        border: '1px solid #d1d5db',
                                        borderRadius: 8,
                                        cursor: 'pointer'
                                    }}
                                >
                                    <Key size={20} style={{ color: '#6b7280' }} />
                                </button>
                            </div>
                            <p style={{ color: '#9ca3af', fontSize: 12, marginTop: 4 }}>
                                Clique no ícone para gerar senha automática
                            </p>
                        </div>

                        <button
                            type="submit"
                            className="app-button app-button-primary app-w-full"
                            disabled={loading}
                        >
                            <Send size={20} style={{ marginRight: 8 }} />
                            {loading ? 'Criando...' : 'Criar Usuário'}
                        </button>
                    </form>
                )}
            </main>

            <BottomNav role="sindico" />
        </>
    );
}
