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

                {/* Cards de acesso rápido - SÍNDICO */}
                {role === 'sindico' && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
                        <Link href="/app/moradores" style={{ textDecoration: 'none' }}>
                            <div className="app-card app-ripple" style={{ textAlign: 'center', cursor: 'pointer' }}>
                                <Bell size={32} style={{ color: '#10b981', marginBottom: 8 }} />
                                <p style={{ fontWeight: 600, color: '#111827', fontSize: 14 }}>Moradores</p>
                            </div>
                        </Link>
                        <Link href="/app/unidades" style={{ textDecoration: 'none' }}>
                            <div className="app-card app-ripple" style={{ textAlign: 'center', cursor: 'pointer' }}>
                                <DoorOpen size={32} style={{ color: '#3b82f6', marginBottom: 8 }} />
                                <p style={{ fontWeight: 600, color: '#111827', fontSize: 14 }}>Unidades</p>
                            </div>
                        </Link>
                        <Link href="/app/usuarios" style={{ textDecoration: 'none' }}>
                            <div className="app-card app-ripple" style={{ textAlign: 'center', cursor: 'pointer' }}>
                                <DollarSign size={32} style={{ color: '#8b5cf6', marginBottom: 8 }} />
                                <p style={{ fontWeight: 600, color: '#111827', fontSize: 14 }}>Usuários</p>
                            </div>
                        </Link>
                        <Link href="/app/avisos" style={{ textDecoration: 'none' }}>
                            <div className="app-card app-ripple" style={{ textAlign: 'center', cursor: 'pointer' }}>
                                <Bell size={32} style={{ color: '#f59e0b', marginBottom: 8 }} />
                                <p style={{ fontWeight: 600, color: '#111827', fontSize: 14 }}>Avisos</p>
                            </div>
                        </Link>
                        <Link href="/app/reservas" style={{ textDecoration: 'none' }}>
                            <div className="app-card app-ripple" style={{ textAlign: 'center', cursor: 'pointer' }}>
                                <Calendar size={32} style={{ color: '#ec4899', marginBottom: 8 }} />
                                <p style={{ fontWeight: 600, color: '#111827', fontSize: 14 }}>Reservas</p>
                            </div>
                        </Link>
                        <Link href="/app/manutencao" style={{ textDecoration: 'none' }}>
                            <div className="app-card app-ripple" style={{ textAlign: 'center', cursor: 'pointer' }}>
                                <AlertTriangle size={32} style={{ color: '#6366f1', marginBottom: 8 }} />
                                <p style={{ fontWeight: 600, color: '#111827', fontSize: 14 }}>Manutenção</p>
                            </div>
                        </Link>
                        <Link href="/app/assinatura" style={{ textDecoration: 'none' }}>
                            <div className="app-card app-ripple" style={{ textAlign: 'center', cursor: 'pointer' }}>
                                <CreditCard size={32} style={{ color: '#14b8a6', marginBottom: 8 }} />
                                <p style={{ fontWeight: 600, color: '#111827', fontSize: 14 }}>Assinatura</p>
                            </div>
                        </Link>
                    </div>
                )}

                {/* Cards de acesso rápido - PORTEIRO */}
                {role === 'porteiro' && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
                        <Link href="/app/portaria/visitante" style={{ textDecoration: 'none' }}>
                            <div className="app-card app-ripple" style={{ textAlign: 'center', cursor: 'pointer' }}>
                                <Bell size={32} style={{ color: '#3b82f6', marginBottom: 8 }} />
                                <p style={{ fontWeight: 600, color: '#111827', fontSize: 14 }}>Visitante</p>
                            </div>
                        </Link>
                        <Link href="/app/portaria/prestador" style={{ textDecoration: 'none' }}>
                            <div className="app-card app-ripple" style={{ textAlign: 'center', cursor: 'pointer' }}>
                                <DoorOpen size={32} style={{ color: '#f59e0b', marginBottom: 8 }} />
                                <p style={{ fontWeight: 600, color: '#111827', fontSize: 14 }}>Prestador</p>
                            </div>
                        </Link>
                        <Link href="/app/portaria/veiculo" style={{ textDecoration: 'none' }}>
                            <div className="app-card app-ripple" style={{ textAlign: 'center', cursor: 'pointer' }}>
                                <DollarSign size={32} style={{ color: '#10b981', marginBottom: 8 }} />
                                <p style={{ fontWeight: 600, color: '#111827', fontSize: 14 }}>Veículo</p>
                            </div>
                        </Link>
                        <Link href="/app/ocorrencias/nova" style={{ textDecoration: 'none' }}>
                            <div className="app-card app-ripple" style={{ textAlign: 'center', cursor: 'pointer' }}>
                                <AlertTriangle size={32} style={{ color: '#ef4444', marginBottom: 8 }} />
                                <p style={{ fontWeight: 600, color: '#111827', fontSize: 14 }}>Nova Ocorrência</p>
                            </div>
                        </Link>
                    </div>
                )}

                {/* Cards de acesso rápido - MORADOR */}
                {role === 'morador' && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
                        <Link href="/app/reservas" style={{ textDecoration: 'none' }}>
                            <div className="app-card app-ripple" style={{ textAlign: 'center', cursor: 'pointer' }}>
                                <Calendar size={32} style={{ color: '#8b5cf6', marginBottom: 8 }} />
                                <p style={{ fontWeight: 600, color: '#111827', fontSize: 14 }}>Reservas</p>
                            </div>
                        </Link>
                        <Link href="/app/ocorrencias/nova" style={{ textDecoration: 'none' }}>
                            <div className="app-card app-ripple" style={{ textAlign: 'center', cursor: 'pointer' }}>
                                <AlertTriangle size={32} style={{ color: '#ef4444', marginBottom: 8 }} />
                                <p style={{ fontWeight: 600, color: '#111827', fontSize: 14 }}>Abrir Ocorrência</p>
                            </div>
                        </Link>
                        <Link href="/app/avisos" style={{ textDecoration: 'none' }}>
                            <div className="app-card app-ripple" style={{ textAlign: 'center', cursor: 'pointer' }}>
                                <Bell size={32} style={{ color: '#10b981', marginBottom: 8 }} />
                                <p style={{ fontWeight: 600, color: '#111827', fontSize: 14 }}>Avisos</p>
                            </div>
                        </Link>
                        <Link href="/app/minhas-cobrancas" style={{ textDecoration: 'none' }}>
                            <div className="app-card app-ripple" style={{ textAlign: 'center', cursor: 'pointer' }}>
                                <CreditCard size={32} style={{ color: '#3b82f6', marginBottom: 8 }} />
                                <p style={{ fontWeight: 600, color: '#111827', fontSize: 14 }}>Boletos</p>
                            </div>
                        </Link>
                        <Link href="/app/encomendas" style={{ textDecoration: 'none' }}>
                            <div className="app-card app-ripple" style={{ textAlign: 'center', cursor: 'pointer', gridColumn: 'span 2' }}>
                                <DoorOpen size={32} style={{ color: '#f59e0b', marginBottom: 8 }} />
                                <p style={{ fontWeight: 600, color: '#111827', fontSize: 14 }}>Minhas Encomendas</p>
                            </div>
                        </Link>
                    </div>
                )}

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
