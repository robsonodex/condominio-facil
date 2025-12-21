'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { MobileHeader, BottomNav } from '@/components/mobile';
import { Users, ChevronRight, Phone, Mail } from 'lucide-react';

interface Morador {
    id: string;
    nome: string;
    email: string;
    telefone: string;
    unidade: { numero_unidade: string } | null;
}

/**
 * Moradores - Síndico
 */
export default function AppMoradoresPage() {
    const [moradores, setMoradores] = useState<Morador[]>([]);
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

                const { data: moradoresData } = await supabase
                    .from('residents')
                    .select('id, nome, email, telefone, unidade:units(numero_unidade)')
                    .eq('condo_id', profile.condo_id)
                    .order('nome')
                    .limit(50);

                setMoradores(moradoresData || []);
            }
        } catch (err) {
            console.error('[APP] Erro:', err);
        }
        setLoading(false);
    };

    if (loading) {
        return (
            <>
                <MobileHeader title="Moradores" showBack />
                <main className="app-content">
                    <div className="app-loading"><div className="app-spinner" /></div>
                </main>
            </>
        );
    }

    return (
        <>
            <MobileHeader title="Moradores" showBack />

            <main className="app-content">
                <p style={{ color: '#6b7280', fontSize: 14, marginBottom: 16 }}>
                    {moradores.length} morador(es) cadastrado(s)
                </p>

                {moradores.length === 0 ? (
                    <div className="app-card" style={{ textAlign: 'center', padding: 32 }}>
                        <Users size={48} style={{ color: '#d1d5db', marginBottom: 16 }} />
                        <p style={{ color: '#6b7280' }}>Nenhum morador cadastrado</p>
                    </div>
                ) : (
                    <div style={{ borderRadius: 12, overflow: 'hidden' }}>
                        {moradores.map((morador) => (
                            <div key={morador.id} className="app-list-item">
                                <div style={{
                                    width: 40,
                                    height: 40,
                                    borderRadius: '50%',
                                    background: '#dcfce7',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    marginRight: 12
                                }}>
                                    <Users size={20} style={{ color: '#10b981' }} />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <p style={{ fontWeight: 600, color: '#111827', fontSize: 14 }}>{morador.nome}</p>
                                    <p style={{ color: '#6b7280', fontSize: 12 }}>
                                        {morador.unidade?.numero_unidade || 'Sem unidade'}
                                    </p>
                                </div>
                                {morador.telefone && (
                                    <a href={`tel:${morador.telefone}`} style={{ padding: 8 }}>
                                        <Phone size={18} style={{ color: '#10b981' }} />
                                    </a>
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
