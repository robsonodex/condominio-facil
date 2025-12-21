'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { MobileHeader, BottomNav } from '@/components/mobile';
import { Package, ChevronRight } from 'lucide-react';

interface Encomenda {
    id: string;
    descricao: string;
    remetente: string;
    recebido_em: string;
    retirado_em: string | null;
    status: string;
}

/**
 * Minhas Encomendas - Morador
 */
export default function AppEncomendasPage() {
    const [encomendas, setEncomendas] = useState<Encomenda[]>([]);
    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState<any>(null);
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

                // Buscar encomendas do morador
                const { data: encomendasData } = await supabase
                    .from('deliveries')
                    .select('*')
                    .eq('morador_id', data.profile.id)
                    .order('recebido_em', { ascending: false })
                    .limit(20);

                setEncomendas(encomendasData || []);
            }
        } catch (err) {
            console.error('[APP] Erro:', err);
        }
        setLoading(false);
    };

    const role = (profile?.role as 'sindico' | 'morador' | 'porteiro') || 'morador';

    if (loading) {
        return (
            <>
                <MobileHeader title="Encomendas" showBack />
                <main className="app-content">
                    <div className="app-loading"><div className="app-spinner" /></div>
                </main>
            </>
        );
    }

    return (
        <>
            <MobileHeader title="Minhas Encomendas" showBack />

            <main className="app-content">
                {encomendas.length === 0 ? (
                    <div className="app-card" style={{ textAlign: 'center', padding: 32 }}>
                        <Package size={48} style={{ color: '#d1d5db', marginBottom: 16 }} />
                        <h3 style={{ color: '#6b7280', fontSize: 16 }}>Nenhuma encomenda</h3>
                        <p style={{ color: '#9ca3af', fontSize: 14, marginTop: 4 }}>
                            Você não tem encomendas pendentes
                        </p>
                    </div>
                ) : (
                    <div style={{ borderRadius: 12, overflow: 'hidden' }}>
                        {encomendas.map((encomenda) => (
                            <div key={encomenda.id} className="app-list-item">
                                <Package
                                    size={24}
                                    style={{
                                        color: encomenda.retirado_em ? '#9ca3af' : '#f59e0b',
                                        marginRight: 12
                                    }}
                                />
                                <div style={{ flex: 1 }}>
                                    <p style={{ fontWeight: 500, color: '#111827', fontSize: 14 }}>
                                        {encomenda.descricao || 'Encomenda'}
                                    </p>
                                    <p style={{ color: '#6b7280', fontSize: 12, marginTop: 2 }}>
                                        {encomenda.remetente && `De: ${encomenda.remetente} • `}
                                        {new Date(encomenda.recebido_em).toLocaleDateString('pt-BR')}
                                    </p>
                                </div>
                                <span style={{
                                    padding: '4px 10px',
                                    borderRadius: 12,
                                    fontSize: 11,
                                    fontWeight: 500,
                                    background: encomenda.retirado_em ? '#f3f4f6' : '#fef3c7',
                                    color: encomenda.retirado_em ? '#6b7280' : '#d97706'
                                }}>
                                    {encomenda.retirado_em ? 'Retirada' : 'Pendente'}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </main>

            <BottomNav role={role} />
        </>
    );
}
