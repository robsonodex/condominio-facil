'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { MobileHeader, BottomNav } from '@/components/mobile';
import { Bell, AlertTriangle, DollarSign, ChevronRight, Calendar, CreditCard, DoorOpen } from 'lucide-react';
import Link from 'next/link';

interface UserProfile {
    id: string;
    nome: string;
    email: string;
    role: string;
    condo_id: string;
}

interface Notice {
    id: string;
    titulo: string;
    data_publicacao: string;
}

/**
 * Dashboard Mobile
 * Tela principal com cards de acesso rápido e avisos recentes
 */
export default function AppDashboardPage() {
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [notices, setNotices] = useState<Notice[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const supabase = createClient();

    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async () => {
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

                    // Buscar avisos
                    const { data: noticesData } = await supabase
                        .from('notices')
                        .select('id, titulo, data_publicacao')
                        .eq('condo_id', data.profile.condo_id)
                        .order('data_publicacao', { ascending: false })
                        .limit(3);

                    setNotices(noticesData || []);
                }
            }
        } catch (err) {
            console.error('[APP] Erro ao buscar perfil:', err);
        }

        setLoading(false);
    };

    if (loading) {
        return (
            <>
                <MobileHeader title="Carregando..." />
                <main className="app-content">
                    <div className="app-loading">
                        <div className="app-spinner" />
                    </div>
                </main>
            </>
        );
    }

    const role = (profile?.role as 'sindico' | 'morador' | 'porteiro') || 'morador';
    const firstName = profile?.nome?.split(' ')[0] || 'Usuário';

    return (
        <>
            <MobileHeader title="Meu Condomínio" showLogout />

            <main className="app-content">
                {/* Saudação */}
                <div style={{ marginBottom: 24 }}>
                    <h2 style={{ fontSize: 24, fontWeight: 700, color: '#111827' }}>
                        Olá, {firstName}! 👋
                    </h2>
                    <p style={{ color: '#6b7280', marginTop: 4 }}>
                        {role === 'sindico' && 'Gerencie seu condomínio'}
                        {role === 'morador' && 'Veja as novidades do seu condomínio'}
                        {role === 'porteiro' && 'Controle a portaria'}
                    </p>
                </div>

                {/* Cards de acesso rápido */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
                    <Link href="/app/avisos" style={{ textDecoration: 'none' }}>
                        <div className="app-card app-ripple" style={{ textAlign: 'center', cursor: 'pointer' }}>
                            <Bell size={32} style={{ color: '#10b981', marginBottom: 8 }} />
                            <p style={{ fontWeight: 600, color: '#111827', fontSize: 14 }}>Avisos</p>
                        </div>
                    </Link>

                    <Link href="/app/ocorrencias" style={{ textDecoration: 'none' }}>
                        <div className="app-card app-ripple" style={{ textAlign: 'center', cursor: 'pointer' }}>
                            <AlertTriangle size={32} style={{ color: '#f59e0b', marginBottom: 8 }} />
                            <p style={{ fontWeight: 600, color: '#111827', fontSize: 14 }}>Ocorrências</p>
                        </div>
                    </Link>

                    {role === 'sindico' && (
                        <Link href="/app/financeiro" style={{ textDecoration: 'none' }}>
                            <div className="app-card app-ripple" style={{ textAlign: 'center', cursor: 'pointer' }}>
                                <DollarSign size={32} style={{ color: '#3b82f6', marginBottom: 8 }} />
                                <p style={{ fontWeight: 600, color: '#111827', fontSize: 14 }}>Financeiro</p>
                            </div>
                        </Link>
                    )}

                    {role === 'porteiro' && (
                        <Link href="/app/portaria" style={{ textDecoration: 'none' }}>
                            <div className="app-card app-ripple" style={{ textAlign: 'center', cursor: 'pointer' }}>
                                <DoorOpen size={32} style={{ color: '#8b5cf6', marginBottom: 8 }} />
                                <p style={{ fontWeight: 600, color: '#111827', fontSize: 14 }}>Portaria</p>
                            </div>
                        </Link>
                    )}

                    {role === 'morador' && (
                        <>
                            <Link href="/app/reservas" style={{ textDecoration: 'none' }}>
                                <div className="app-card app-ripple" style={{ textAlign: 'center', cursor: 'pointer' }}>
                                    <Calendar size={32} style={{ color: '#8b5cf6', marginBottom: 8 }} />
                                    <p style={{ fontWeight: 600, color: '#111827', fontSize: 14 }}>Reservas</p>
                                </div>
                            </Link>
                            <Link href="/app/minhas-cobrancas" style={{ textDecoration: 'none' }}>
                                <div className="app-card app-ripple" style={{ textAlign: 'center', cursor: 'pointer' }}>
                                    <CreditCard size={32} style={{ color: '#3b82f6', marginBottom: 8 }} />
                                    <p style={{ fontWeight: 600, color: '#111827', fontSize: 14 }}>Cobranças</p>
                                </div>
                            </Link>
                        </>
                    )}
                </div>

                {/* Avisos Recentes */}
                <div style={{ marginBottom: 24 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                        <h3 style={{ fontSize: 18, fontWeight: 600, color: '#111827' }}>Avisos Recentes</h3>
                        <Link href="/app/avisos" style={{ color: '#10b981', fontSize: 14, fontWeight: 500 }}>
                            Ver todos
                        </Link>
                    </div>

                    {notices.length === 0 ? (
                        <div className="app-card" style={{ textAlign: 'center', color: '#6b7280' }}>
                            Nenhum aviso recente
                        </div>
                    ) : (
                        <div style={{ borderRadius: 12, overflow: 'hidden' }}>
                            {notices.map((notice) => (
                                <Link
                                    key={notice.id}
                                    href={`/app/avisos/${notice.id}`}
                                    style={{ textDecoration: 'none' }}
                                >
                                    <div className="app-list-item app-ripple">
                                        <Bell size={20} style={{ color: '#10b981', marginRight: 12 }} />
                                        <div style={{ flex: 1 }}>
                                            <p style={{ fontWeight: 500, color: '#111827', fontSize: 14 }}>
                                                {notice.titulo}
                                            </p>
                                            <p style={{ color: '#6b7280', fontSize: 12, marginTop: 2 }}>
                                                {new Date(notice.data_publicacao).toLocaleDateString('pt-BR')}
                                            </p>
                                        </div>
                                        <ChevronRight size={20} style={{ color: '#9ca3af' }} />
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </main>

            <BottomNav role={role} />
        </>
    );
}
