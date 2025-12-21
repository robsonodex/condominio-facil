'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { MobileHeader, BottomNav } from '@/components/mobile';
import { DoorOpen, User, Car, Briefcase, LogIn, LogOut, ChevronRight } from 'lucide-react';

interface VisitorEntry {
    id: string;
    nome: string;
    tipo: 'visitante' | 'prestador' | 'veiculo';
    documento: string;
    entrada: string;
    saida: string | null;
}

/**
 * Portaria Mobile - Porteiro
 */
export default function AppPortariaPage() {
    const [entries, setEntries] = useState<VisitorEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ visitantes: 0, prestadores: 0, veiculos: 0 });
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
                const profile = data.profile;

                if (!['porteiro', 'sindico', 'superadmin'].includes(profile?.role)) {
                    router.push('/app/dashboard');
                    return;
                }

                // Buscar entradas de hoje
                const today = new Date().toISOString().split('T')[0];
                const { data: entriesData } = await supabase
                    .from('visitor_entries')
                    .select('*')
                    .eq('condo_id', profile.condo_id)
                    .gte('entrada', today)
                    .order('entrada', { ascending: false })
                    .limit(20);

                setEntries(entriesData || []);

                // Stats
                const visitantes = entriesData?.filter(e => e.tipo === 'visitante').length || 0;
                const prestadores = entriesData?.filter(e => e.tipo === 'prestador').length || 0;
                const veiculos = entriesData?.filter(e => e.tipo === 'veiculo').length || 0;
                setStats({ visitantes, prestadores, veiculos });
            }
        } catch (err) {
            console.error('[APP] Erro:', err);
        }
        setLoading(false);
    };

    const getTipoIcon = (tipo: string) => {
        switch (tipo) {
            case 'visitante': return <User size={20} style={{ color: '#3b82f6' }} />;
            case 'prestador': return <Briefcase size={20} style={{ color: '#f59e0b' }} />;
            case 'veiculo': return <Car size={20} style={{ color: '#10b981' }} />;
            default: return <User size={20} />;
        }
    };

    if (loading) {
        return (
            <>
                <MobileHeader title="Portaria" showBack />
                <main className="app-content">
                    <div className="app-loading"><div className="app-spinner" /></div>
                </main>
            </>
        );
    }

    return (
        <>
            <MobileHeader title="Portaria" showBack />

            <main className="app-content">
                {/* Stats de hoje */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 20 }}>
                    <div className="app-card" style={{ textAlign: 'center', padding: 12 }}>
                        <User size={20} style={{ color: '#3b82f6', marginBottom: 4 }} />
                        <p style={{ fontSize: 20, fontWeight: 700, color: '#111827' }}>{stats.visitantes}</p>
                        <p style={{ fontSize: 11, color: '#6b7280' }}>Visitantes</p>
                    </div>
                    <div className="app-card" style={{ textAlign: 'center', padding: 12 }}>
                        <Briefcase size={20} style={{ color: '#f59e0b', marginBottom: 4 }} />
                        <p style={{ fontSize: 20, fontWeight: 700, color: '#111827' }}>{stats.prestadores}</p>
                        <p style={{ fontSize: 11, color: '#6b7280' }}>Prestadores</p>
                    </div>
                    <div className="app-card" style={{ textAlign: 'center', padding: 12 }}>
                        <Car size={20} style={{ color: '#10b981', marginBottom: 4 }} />
                        <p style={{ fontSize: 20, fontWeight: 700, color: '#111827' }}>{stats.veiculos}</p>
                        <p style={{ fontSize: 11, color: '#6b7280' }}>Veículos</p>
                    </div>
                </div>

                {/* Botões de ação rápida */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
                    <button className="app-button app-button-primary" style={{ padding: '16px 12px' }}>
                        <LogIn size={20} style={{ marginRight: 8 }} />
                        Registrar Entrada
                    </button>
                    <button className="app-button app-button-outline" style={{ padding: '16px 12px' }}>
                        <LogOut size={20} style={{ marginRight: 8 }} />
                        Registrar Saída
                    </button>
                </div>

                {/* Lista de entradas de hoje */}
                <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12, color: '#111827' }}>Entradas Hoje</h3>

                {entries.length === 0 ? (
                    <div className="app-card app-text-center" style={{ color: '#6b7280', padding: 24 }}>
                        <DoorOpen size={40} style={{ color: '#d1d5db', marginBottom: 8 }} />
                        <p>Nenhuma entrada registrada hoje</p>
                    </div>
                ) : (
                    <div style={{ borderRadius: 12, overflow: 'hidden' }}>
                        {entries.map((entry) => (
                            <div key={entry.id} className="app-list-item">
                                {getTipoIcon(entry.tipo)}
                                <div style={{ flex: 1, marginLeft: 12 }}>
                                    <p style={{ fontWeight: 500, color: '#111827', fontSize: 14 }}>{entry.nome}</p>
                                    <p style={{ color: '#6b7280', fontSize: 12 }}>
                                        {new Date(entry.entrada).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                        {entry.saida ? ' - ' + new Date(entry.saida).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : ' (presente)'}
                                    </p>
                                </div>
                                {!entry.saida && (
                                    <span style={{
                                        background: '#dcfce7',
                                        color: '#166534',
                                        padding: '2px 8px',
                                        borderRadius: 12,
                                        fontSize: 11,
                                        fontWeight: 500
                                    }}>
                                        Ativo
                                    </span>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </main>

            <BottomNav role="porteiro" />
        </>
    );
}
