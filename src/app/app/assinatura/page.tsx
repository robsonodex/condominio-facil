'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { MobileHeader, BottomNav } from '@/components/mobile';
import { CreditCard, CheckCircle, Clock, AlertCircle } from 'lucide-react';

interface Subscription {
    planName: string;
    status: string;
    dataVencimento: string;
    valor: number;
    diasRestantes: number;
}

/**
 * Assinatura - Síndico
 */
export default function AppAssinaturaPage() {
    const [subscription, setSubscription] = useState<Subscription | null>(null);
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

                // Buscar assinatura do condomínio
                const { data: condoData } = await supabase
                    .from('condos')
                    .select('status, subscription_ends_at, plan:plans(nome, preco)')
                    .eq('id', profile.condo_id)
                    .single();

                if (condoData) {
                    const dataVencimento = condoData.subscription_ends_at
                        ? new Date(condoData.subscription_ends_at)
                        : new Date();
                    const hoje = new Date();
                    const diasRestantes = Math.ceil((dataVencimento.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));

                    setSubscription({
                        planName: condoData.plan?.nome || 'Teste',
                        status: condoData.status || 'trial',
                        dataVencimento: dataVencimento.toLocaleDateString('pt-BR'),
                        valor: condoData.plan?.preco || 0,
                        diasRestantes
                    });
                }
            }
        } catch (err) {
            console.error('[APP] Erro:', err);
        }
        setLoading(false);
    };

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'active': return { bg: '#dcfce7', color: '#166534', icon: <CheckCircle size={20} />, label: 'Ativo' };
            case 'trial': return { bg: '#dbeafe', color: '#1e40af', icon: <Clock size={20} />, label: 'Período de Teste' };
            default: return { bg: '#fef2f2', color: '#dc2626', icon: <AlertCircle size={20} />, label: 'Pendente' };
        }
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
    };

    if (loading) {
        return (
            <>
                <MobileHeader title="Assinatura" showBack />
                <main className="app-content">
                    <div className="app-loading"><div className="app-spinner" /></div>
                </main>
            </>
        );
    }

    const status = subscription ? getStatusStyle(subscription.status) : getStatusStyle('pending');

    return (
        <>
            <MobileHeader title="Assinatura" showBack />

            <main className="app-content">
                {/* Status Card */}
                <div className="app-card" style={{ textAlign: 'center', marginBottom: 16 }}>
                    <div style={{
                        width: 60,
                        height: 60,
                        borderRadius: '50%',
                        background: status.bg,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 12px',
                        color: status.color
                    }}>
                        {status.icon}
                    </div>
                    <h2 style={{ fontSize: 18, fontWeight: 700, color: '#111827' }}>
                        Plano {subscription?.planName}
                    </h2>
                    <span style={{
                        display: 'inline-block',
                        marginTop: 8,
                        padding: '4px 12px',
                        background: status.bg,
                        color: status.color,
                        borderRadius: 20,
                        fontSize: 13,
                        fontWeight: 500
                    }}>
                        {status.label}
                    </span>
                </div>

                {/* Detalhes */}
                <div className="app-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #e5e7eb' }}>
                        <span style={{ color: '#6b7280' }}>Valor Mensal</span>
                        <span style={{ fontWeight: 600, color: '#111827' }}>{formatCurrency(subscription?.valor || 0)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #e5e7eb' }}>
                        <span style={{ color: '#6b7280' }}>Próximo Vencimento</span>
                        <span style={{ fontWeight: 600, color: '#111827' }}>{subscription?.dataVencimento}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0' }}>
                        <span style={{ color: '#6b7280' }}>Dias Restantes</span>
                        <span style={{
                            fontWeight: 600,
                            color: (subscription?.diasRestantes || 0) < 7 ? '#ef4444' : '#10b981'
                        }}>
                            {subscription?.diasRestantes} dias
                        </span>
                    </div>
                </div>

                {/* Info */}
                <p style={{
                    textAlign: 'center',
                    color: '#9ca3af',
                    fontSize: 12,
                    marginTop: 24
                }}>
                    Para alterar plano ou forma de pagamento,<br />acesse a versão web.
                </p>
            </main>

            <BottomNav role="sindico" />
        </>
    );
}
