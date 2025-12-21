'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { MobileHeader, BottomNav } from '@/components/mobile';
import { User, Mail, Phone, MapPin, LogOut, ChevronRight } from 'lucide-react';

interface UserProfile {
    id: string;
    nome: string;
    email: string;
    telefone: string;
    role: string;
    condo_id: string;
}

interface Condo {
    nome: string;
    cidade: string;
    estado: string;
}

/**
 * Tela de Perfil Mobile
 */
export default function AppPerfilPage() {
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [condo, setCondo] = useState<Condo | null>(null);
    const [loading, setLoading] = useState(true);
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

        // Buscar perfil via API (mesmo método do site web)
        try {
            const response = await fetch('/api/auth/profile', {
                credentials: 'include',
                cache: 'no-store',
                headers: {
                    'Authorization': `Bearer ${session.access_token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (response.ok) {
                const data = await response.json();
                if (data.profile) {
                    setProfile(data.profile);

                    // Buscar dados do condomínio
                    const { data: condoData } = await supabase
                        .from('condos')
                        .select('nome, cidade, estado')
                        .eq('id', data.profile.condo_id)
                        .single();

                    setCondo(condoData);
                }
            }
        } catch (err) {
            console.error('[APP] Erro ao buscar perfil:', err);
        }
        setLoading(false);
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        document.cookie = 'cf_app_mode=; path=/; max-age=0';
        router.push('/app/login');
    };

    const getRoleLabel = (role: string) => {
        switch (role) {
            case 'sindico': return 'Síndico';
            case 'morador': return 'Morador';
            case 'porteiro': return 'Porteiro';
            case 'superadmin': return 'Administrador';
            default: return role;
        }
    };

    if (loading) {
        return (
            <>
                <MobileHeader title="Perfil" />
                <main className="app-content">
                    <div className="app-loading">
                        <div className="app-spinner" />
                    </div>
                </main>
            </>
        );
    }

    const role = (profile?.role as 'sindico' | 'morador' | 'porteiro') || 'morador';

    return (
        <>
            <MobileHeader title="Meu Perfil" />

            <main className="app-content">
                {/* Avatar e Nome */}
                <div className="app-card" style={{ textAlign: 'center', paddingTop: 32, paddingBottom: 32 }}>
                    <div style={{
                        width: 80,
                        height: 80,
                        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 16px',
                    }}>
                        <User size={36} style={{ color: 'white' }} />
                    </div>
                    <h2 style={{ fontSize: 20, fontWeight: 700, color: '#111827' }}>
                        {profile?.nome}
                    </h2>
                    <p style={{
                        display: 'inline-block',
                        marginTop: 8,
                        padding: '4px 12px',
                        background: '#dcfce7',
                        color: '#166534',
                        borderRadius: 20,
                        fontSize: 13,
                        fontWeight: 500
                    }}>
                        {getRoleLabel(profile?.role || '')}
                    </p>
                </div>

                {/* Informações */}
                <div style={{ marginTop: 16 }}>
                    <h3 style={{ fontSize: 14, fontWeight: 600, color: '#6b7280', marginBottom: 12, paddingLeft: 4 }}>
                        INFORMAÇÕES
                    </h3>
                    <div style={{ borderRadius: 12, overflow: 'hidden' }}>
                        <div className="app-list-item">
                            <Mail size={20} style={{ color: '#6b7280', marginRight: 12 }} />
                            <div style={{ flex: 1 }}>
                                <p style={{ color: '#6b7280', fontSize: 12 }}>Email</p>
                                <p style={{ color: '#111827', fontWeight: 500, fontSize: 14 }}>{profile?.email}</p>
                            </div>
                        </div>

                        <div className="app-list-item">
                            <Phone size={20} style={{ color: '#6b7280', marginRight: 12 }} />
                            <div style={{ flex: 1 }}>
                                <p style={{ color: '#6b7280', fontSize: 12 }}>Telefone</p>
                                <p style={{ color: '#111827', fontWeight: 500, fontSize: 14 }}>
                                    {profile?.telefone || 'Não informado'}
                                </p>
                            </div>
                        </div>

                        <div className="app-list-item">
                            <MapPin size={20} style={{ color: '#6b7280', marginRight: 12 }} />
                            <div style={{ flex: 1 }}>
                                <p style={{ color: '#6b7280', fontSize: 12 }}>Condomínio</p>
                                <p style={{ color: '#111827', fontWeight: 500, fontSize: 14 }}>
                                    {condo?.nome}
                                </p>
                                <p style={{ color: '#9ca3af', fontSize: 12 }}>
                                    {condo?.cidade}, {condo?.estado}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Logout */}
                <button
                    onClick={handleLogout}
                    className="app-button app-w-full"
                    style={{
                        marginTop: 32,
                        background: '#fef2f2',
                        color: '#dc2626',
                        border: '1px solid #fecaca'
                    }}
                >
                    <LogOut size={20} style={{ marginRight: 8 }} />
                    Sair da Conta
                </button>

                {/* Versão */}
                <p style={{ textAlign: 'center', color: '#9ca3af', fontSize: 12, marginTop: 24 }}>
                    Meu Condomínio Fácil v1.0
                </p>
            </main>

            <BottomNav role={role} />
        </>
    );
}
