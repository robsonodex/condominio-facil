'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { MobileHeader, BottomNav } from '@/components/mobile';
import { CreditCard, Calendar, CheckCircle, AlertCircle, Clock } from 'lucide-react';

interface Cobranca {
    id: string;
    descricao: string;
    valor: number;
    data_vencimento: string;
    status: 'pendente' | 'pago' | 'atrasado';
}

/**
 * Minhas Cobranças Mobile - Morador
 */
export default function AppMinhasCobrancasPage() {
    const [cobrancas, setCobrancas] = useState<Cobranca[]>([]);
    const [loading, setLoading] = useState(true);
    const [role, setRole] = useState<'sindico' | 'morador' | 'porteiro'>('morador');
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
                setRole(profile.role as any);

                // Buscar cobranças do morador
                const { data: cobrancasData } = await supabase
                    .from('resident_invoices')
                    .select('*')
                    .eq('morador_id', profile.id)
                    .order('data_vencimento', { ascending: false })
                    .limit(20);

                setCobrancas(cobrancasData || []);
            }
        } catch (err) {
            console.error('[APP] Erro:', err);
        }
        setLoading(false);
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
    };

    const getStatusBadge = (status: string, dataVencimento: string) => {
        const hoje = new Date();
        const vencimento = new Date(dataVencimento);
        const isAtrasado = status === 'pendente' && vencimento < hoje;

        if (status === 'pago') {
            return { bg: '#dcfce7', color: '#166534', icon: <CheckCircle size={14} />, label: 'Pago' };
        }
        if (isAtrasado) {
            return { bg: '#fef2f2', color: '#dc2626', icon: <AlertCircle size={14} />, label: 'Atrasado' };
        }
        return { bg: '#fef3c7', color: '#d97706', icon: <Clock size={14} />, label: 'Pendente' };
    };

    // Calcular totais
    const totalPendente = cobrancas
        .filter(c => c.status === 'pendente')
        .reduce((sum, c) => sum + Number(c.valor), 0);

    if (loading) {
        return (
            <>
                <MobileHeader title="Cobranças" showBack />
                <main className="app-content">
                    <div className="app-loading"><div className="app-spinner" /></div>
                </main>
            </>
        );
    }

    return (
        <>
            <MobileHeader title="Minhas Cobranças" showBack />

            <main className="app-content">
                {/* Resumo */}
                {totalPendente > 0 && (
                    <div className="app-card" style={{
                        marginBottom: 20,
                        background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
                        border: '1px solid #fcd34d'
                    }}>
                        <p style={{ fontSize: 13, color: '#92400e' }}>Total Pendente</p>
                        <p style={{ fontSize: 28, fontWeight: 700, color: '#92400e' }}>
                            {formatCurrency(totalPendente)}
                        </p>
                    </div>
                )}

                {/* Lista de cobranças */}
                {cobrancas.length === 0 ? (
                    <div className="app-card app-text-center" style={{ color: '#6b7280', padding: 32 }}>
                        <CreditCard size={48} style={{ color: '#d1d5db', marginBottom: 12 }} />
                        <p>Nenhuma cobrança encontrada</p>
                    </div>
                ) : (
                    <div style={{ borderRadius: 12, overflow: 'hidden' }}>
                        {cobrancas.map((cobranca) => {
                            const status = getStatusBadge(cobranca.status, cobranca.data_vencimento);
                            return (
                                <div key={cobranca.id} className="app-list-item">
                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span style={{ fontWeight: 600, color: '#111827', fontSize: 14 }}>
                                                {cobranca.descricao}
                                            </span>
                                            <span style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 4,
                                                padding: '2px 8px',
                                                borderRadius: 12,
                                                fontSize: 11,
                                                fontWeight: 500,
                                                background: status.bg,
                                                color: status.color
                                            }}>
                                                {status.icon} {status.label}
                                            </span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#6b7280', fontSize: 13 }}>
                                                <Calendar size={14} />
                                                Vence: {new Date(cobranca.data_vencimento).toLocaleDateString('pt-BR')}
                                            </span>
                                            <span style={{ fontWeight: 700, color: '#111827', fontSize: 15 }}>
                                                {formatCurrency(cobranca.valor)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </main>

            <BottomNav role={role} />
        </>
    );
}
