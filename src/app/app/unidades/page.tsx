'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { MobileHeader, BottomNav } from '@/components/mobile';
import { Home, ChevronRight } from 'lucide-react';

interface Unidade {
    id: string;
    numero_unidade: string;
    bloco: string | null;
    tipo: string;
    moradores: number;
}

/**
 * Unidades - Síndico
 */
export default function AppUnidadesPage() {
    const [unidades, setUnidades] = useState<Unidade[]>([]);
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

                const { data: unidadesData } = await supabase
                    .from('units')
                    .select('id, numero_unidade, bloco, tipo')
                    .eq('condo_id', profile.condo_id)
                    .order('numero_unidade')
                    .limit(100);

                setUnidades(unidadesData || []);
            }
        } catch (err) {
            console.error('[APP] Erro:', err);
        }
        setLoading(false);
    };

    if (loading) {
        return (
            <>
                <MobileHeader title="Unidades" showBack />
                <main className="app-content">
                    <div className="app-loading"><div className="app-spinner" /></div>
                </main>
            </>
        );
    }

    return (
        <>
            <MobileHeader title="Unidades" showBack />

            <main className="app-content">
                <p style={{ color: '#6b7280', fontSize: 14, marginBottom: 16 }}>
                    {unidades.length} unidade(s) cadastrada(s)
                </p>

                {unidades.length === 0 ? (
                    <div className="app-card" style={{ textAlign: 'center', padding: 32 }}>
                        <Home size={48} style={{ color: '#d1d5db', marginBottom: 16 }} />
                        <p style={{ color: '#6b7280' }}>Nenhuma unidade cadastrada</p>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                        {unidades.map((unidade) => (
                            <div key={unidade.id} className="app-card" style={{
                                textAlign: 'center',
                                padding: 12,
                                cursor: 'pointer'
                            }}>
                                <Home size={20} style={{ color: '#3b82f6', marginBottom: 4 }} />
                                <p style={{ fontWeight: 600, color: '#111827', fontSize: 14 }}>
                                    {unidade.numero_unidade}
                                </p>
                                {unidade.bloco && (
                                    <p style={{ color: '#6b7280', fontSize: 11 }}>Bloco {unidade.bloco}</p>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </main>

            <BottomNav role="sindico" />
        </>
    );
}
