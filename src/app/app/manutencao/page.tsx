'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { MobileHeader, BottomNav } from '@/components/mobile';
import { Wrench, Calendar, CheckCircle, Clock } from 'lucide-react';

interface Manutencao {
    id: string;
    titulo: string;
    descricao: string;
    tipo: string;
    data_prevista: string;
    status: 'pendente' | 'concluida' | 'agendada';
}

/**
 * Manutenção Preventiva - Síndico
 */
export default function AppManutencaoPage() {
    const [manutencoes, setManutencoes] = useState<Manutencao[]>([]);
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

        try {
            const response = await fetch('/api/auth/profile', {
                credentials: 'include',
                headers: { 'Authorization': `Bearer ${session.access_token}` },
            });

            if (response.ok) {
                const data = await response.json();
                const profile = data.profile;

                if (profile?.role !== 'sindico' && profile?.role !== 'superadmin') {
                    router.push('/app/dashboard');
                    return;
                }

                const { data: manutData } = await supabase
                    .from('maintenance_tasks')
                    .select('*')
                    .eq('condo_id', profile.condo_id)
                    .order('data_prevista', { ascending: true })
                    .limit(20);

                setManutencoes(manutData || []);
            }
        } catch (err) {
            console.error('[APP] Erro:', err);
        }
        setLoading(false);
    };

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'concluida': return { bg: '#dcfce7', color: '#166534', icon: <CheckCircle size={14} /> };
            case 'agendada': return { bg: '#dbeafe', color: '#1e40af', icon: <Calendar size={14} /> };
            default: return { bg: '#fef3c7', color: '#d97706', icon: <Clock size={14} /> };
        }
    };

    if (loading) {
        return (
            <>
                <MobileHeader title="Manutenção" showBack />
                <main className="app-content">
                    <div className="app-loading"><div className="app-spinner" /></div>
                </main>
            </>
        );
    }

    return (
        <>
            <MobileHeader title="Manutenção Preventiva" showBack />

            <main className="app-content">
                {manutencoes.length === 0 ? (
                    <div className="app-card" style={{ textAlign: 'center', padding: 32 }}>
                        <Wrench size={48} style={{ color: '#d1d5db', marginBottom: 16 }} />
                        <h3 style={{ color: '#6b7280', fontSize: 16 }}>Nenhuma manutenção</h3>
                        <p style={{ color: '#9ca3af', fontSize: 14, marginTop: 4 }}>
                            Cadastre pela versão web
                        </p>
                    </div>
                ) : (
                    <div style={{ borderRadius: 12, overflow: 'hidden' }}>
                        {manutencoes.map((manut) => {
                            const status = getStatusStyle(manut.status);
                            return (
                                <div key={manut.id} className="app-list-item" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                                    <div style={{ display: 'flex', width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <Wrench size={16} style={{ color: '#6366f1' }} />
                                            <span style={{ fontWeight: 600, color: '#111827' }}>{manut.titulo}</span>
                                        </div>
                                        <span style={{
                                            display: 'flex', alignItems: 'center', gap: 4,
                                            padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 500,
                                            background: status.bg, color: status.color
                                        }}>
                                            {status.icon} {manut.status}
                                        </span>
                                    </div>
                                    <p style={{ color: '#6b7280', fontSize: 12, marginTop: 4 }}>{manut.tipo}</p>
                                    <p style={{ color: '#9ca3af', fontSize: 11, marginTop: 2 }}>
                                        Prevista: {new Date(manut.data_prevista).toLocaleDateString('pt-BR')}
                                    </p>
                                </div>
                            );
                        })}
                    </div>
                )}
            </main>

            <BottomNav role="sindico" />
        </>
    );
}
