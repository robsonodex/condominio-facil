'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { MobileHeader, BottomNav } from '@/components/mobile';
import { DollarSign, TrendingUp, TrendingDown, PlusCircle } from 'lucide-react';

interface FinancialEntry {
    id: string;
    tipo: 'receita' | 'despesa';
    descricao: string;
    categoria: string;
    valor: number;
    data_vencimento: string;
    status: string;
}

interface Stats {
    receitas: number;
    despesas: number;
    saldo: number;
}

/**
 * Financeiro Mobile - Síndico
 */
export default function AppFinanceiroPage() {
    const [entries, setEntries] = useState<FinancialEntry[]>([]);
    const [stats, setStats] = useState<Stats>({ receitas: 0, despesas: 0, saldo: 0 });
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
                headers: {
                    'Authorization': `Bearer ${session.access_token}`,
                },
            });

            if (response.ok) {
                const data = await response.json();
                const profile = data.profile;

                if (profile?.role !== 'sindico' && profile?.role !== 'superadmin') {
                    router.push('/app/dashboard');
                    return;
                }

                // Buscar lançamentos
                const { data: entriesData } = await supabase
                    .from('financial_entries')
                    .select('*')
                    .eq('condo_id', profile.condo_id)
                    .order('data_vencimento', { ascending: false })
                    .limit(20);

                setEntries(entriesData || []);

                // Calcular stats
                const receitas = entriesData?.filter(e => e.tipo === 'receita').reduce((sum, e) => sum + Number(e.valor), 0) || 0;
                const despesas = entriesData?.filter(e => e.tipo === 'despesa').reduce((sum, e) => sum + Number(e.valor), 0) || 0;
                setStats({ receitas, despesas, saldo: receitas - despesas });
            }
        } catch (err) {
            console.error('[APP] Erro:', err);
        }
        setLoading(false);
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
    };

    if (loading) {
        return (
            <>
                <MobileHeader title="Financeiro" showBack />
                <main className="app-content">
                    <div className="app-loading"><div className="app-spinner" /></div>
                </main>
            </>
        );
    }

    return (
        <>
            <MobileHeader title="Financeiro" showBack />

            <main className="app-content">
                {/* Cards de resumo */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
                    <div className="app-card" style={{ textAlign: 'center' }}>
                        <TrendingUp size={24} style={{ color: '#10b981', marginBottom: 4 }} />
                        <p style={{ fontSize: 12, color: '#6b7280' }}>Receitas</p>
                        <p style={{ fontSize: 16, fontWeight: 700, color: '#10b981' }}>{formatCurrency(stats.receitas)}</p>
                    </div>
                    <div className="app-card" style={{ textAlign: 'center' }}>
                        <TrendingDown size={24} style={{ color: '#ef4444', marginBottom: 4 }} />
                        <p style={{ fontSize: 12, color: '#6b7280' }}>Despesas</p>
                        <p style={{ fontSize: 16, fontWeight: 700, color: '#ef4444' }}>{formatCurrency(stats.despesas)}</p>
                    </div>
                </div>

                {/* Saldo */}
                <div className="app-card" style={{ marginBottom: 20, textAlign: 'center' }}>
                    <p style={{ fontSize: 14, color: '#6b7280' }}>Saldo</p>
                    <p style={{ fontSize: 28, fontWeight: 700, color: stats.saldo >= 0 ? '#10b981' : '#ef4444' }}>
                        {formatCurrency(stats.saldo)}
                    </p>
                </div>

                {/* Lista de lançamentos */}
                <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12, color: '#111827' }}>Últimos Lançamentos</h3>

                {entries.length === 0 ? (
                    <div className="app-card app-text-center" style={{ color: '#6b7280' }}>
                        Nenhum lançamento encontrado
                    </div>
                ) : (
                    <div style={{ borderRadius: 12, overflow: 'hidden' }}>
                        {entries.slice(0, 10).map((entry) => (
                            <div key={entry.id} className="app-list-item">
                                <div style={{
                                    width: 8,
                                    height: 8,
                                    borderRadius: '50%',
                                    background: entry.tipo === 'receita' ? '#10b981' : '#ef4444',
                                    marginRight: 12
                                }} />
                                <div style={{ flex: 1 }}>
                                    <p style={{ fontWeight: 500, color: '#111827', fontSize: 14 }}>
                                        {entry.descricao || entry.categoria}
                                    </p>
                                    <p style={{ color: '#6b7280', fontSize: 12 }}>{entry.categoria}</p>
                                </div>
                                <p style={{
                                    fontWeight: 600,
                                    color: entry.tipo === 'receita' ? '#10b981' : '#ef4444',
                                    fontSize: 14
                                }}>
                                    {entry.tipo === 'despesa' && '-'}{formatCurrency(entry.valor)}
                                </p>
                            </div>
                        ))}
                    </div>
                )}
            </main>

            <BottomNav role="sindico" />
        </>
    );
}
