'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, Button, Badge } from '@/components/ui';
import { createClient } from '@/lib/supabase/client';
import { useUser } from '@/hooks/useUser';
import { formatCurrency, formatDate } from '@/lib/utils';
import { CreditCard, QrCode, CheckCircle, AlertTriangle, Clock, Copy } from 'lucide-react';

interface Subscription {
    id: string;
    status: string;
    plan: {
        nome_plano: string;
        valor_mensal: number;
    };
    data_inicio: string;
    data_fim: string;
    valor_mensal_cobrado: number;
}

interface Payment {
    id: string;
    valor: number;
    status: string;
    pix_code: string;
    data_vencimento: string;
    data_pagamento: string | null;
    created_at: string;
}

export default function AssinaturaPage() {
    const { condoId, profile } = useUser();
    const [subscription, setSubscription] = useState<Subscription | null>(null);
    const [payments, setPayments] = useState<Payment[]>([]);
    const [loading, setLoading] = useState(true);
    const [generatingPix, setGeneratingPix] = useState(false);
    const [pixCode, setPixCode] = useState('');
    const [copied, setCopied] = useState(false);
    const supabase = createClient();

    useEffect(() => {
        if (condoId) {
            fetchData();
        }
    }, [condoId]);

    const fetchData = async () => {
        // Fetch subscription
        const { data: subData } = await supabase
            .from('subscriptions')
            .select('*, plan:plans(*)')
            .eq('condo_id', condoId)
            .single();

        setSubscription(subData);

        // Fetch payment history
        const { data: payData } = await supabase
            .from('payments')
            .select('*')
            .eq('condo_id', condoId)
            .order('created_at', { ascending: false })
            .limit(10);

        setPayments(payData || []);
        setLoading(false);
    };

    const generatePixPayment = async () => {
        setGeneratingPix(true);

        try {
            // In production, this would call the Banco Inter API
            // For now, we simulate a PIX code
            const valor = subscription?.valor_mensal_cobrado || subscription?.plan?.valor_mensal || 49.90;

            // Simulated PIX code (EMV format)
            const pixSimulado = `00020126580014br.gov.bcb.pix0136${profile?.email || 'pagamento@condominiofacil.com.br'}5204000053039865406${valor.toFixed(2)}5802BR5925CONDOMINIO FACIL6009SAO PAULO62070503***6304`;

            // Save to database
            const { data: paymentData, error } = await supabase
                .from('payments')
                .insert({
                    condo_id: condoId,
                    valor: valor,
                    status: 'pendente',
                    pix_code: pixSimulado,
                    data_vencimento: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                })
                .select()
                .single();

            if (error) throw error;

            setPixCode(pixSimulado);
            fetchData();
        } catch (err) {
            console.error('Error generating PIX:', err);
            alert('Erro ao gerar PIX. Tente novamente.');
        } finally {
            setGeneratingPix(false);
        }
    };

    const copyPixCode = () => {
        navigator.clipboard.writeText(pixCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const getStatusInfo = (status: string) => {
        switch (status) {
            case 'ativo':
                return { variant: 'success' as const, label: 'Ativo', icon: CheckCircle };
            case 'teste':
                return { variant: 'warning' as const, label: 'Período de Teste', icon: Clock };
            case 'suspenso':
                return { variant: 'danger' as const, label: 'Suspenso', icon: AlertTriangle };
            default:
                return { variant: 'secondary' as const, label: status, icon: Clock };
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-emerald-600 border-t-transparent"></div>
            </div>
        );
    }

    const statusInfo = subscription ? getStatusInfo(subscription.status) : null;
    const StatusIcon = statusInfo?.icon || Clock;

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Minha Assinatura</h1>
                <p className="text-gray-500">Gerencie seu plano e pagamentos</p>
            </div>

            {/* Current Plan */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <CreditCard className="h-5 w-5" />
                        Plano Atual
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {subscription ? (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900">
                                        {subscription.plan?.nome_plano || 'Plano'}
                                    </h3>
                                    <p className="text-gray-500">
                                        {formatCurrency(subscription.valor_mensal_cobrado || subscription.plan?.valor_mensal || 0)}/mês
                                    </p>
                                </div>
                                <Badge variant={statusInfo?.variant}>
                                    <StatusIcon className="h-4 w-4 mr-1" />
                                    {statusInfo?.label}
                                </Badge>
                            </div>

                            <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                                <div>
                                    <p className="text-sm text-gray-500">Início</p>
                                    <p className="font-medium">{formatDate(subscription.data_inicio)}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Próximo vencimento</p>
                                    <p className="font-medium">{formatDate(subscription.data_fim)}</p>
                                </div>
                            </div>

                            {subscription.status !== 'ativo' && (
                                <Button
                                    onClick={generatePixPayment}
                                    disabled={generatingPix}
                                    className="w-full"
                                >
                                    <QrCode className="h-4 w-4 mr-2" />
                                    {generatingPix ? 'Gerando...' : 'Gerar PIX para Pagamento'}
                                </Button>
                            )}
                        </div>
                    ) : (
                        <p className="text-gray-500">Nenhuma assinatura encontrada</p>
                    )}
                </CardContent>
            </Card>

            {/* PIX Code */}
            {pixCode && (
                <Card className="border-emerald-200 bg-emerald-50">
                    <CardHeader>
                        <CardTitle className="text-emerald-700 flex items-center gap-2">
                            <QrCode className="h-5 w-5" />
                            PIX Gerado - Copie e Pague
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="p-4 bg-white rounded-lg border border-emerald-200">
                                <p className="text-xs text-gray-500 mb-2">Código PIX Copia e Cola:</p>
                                <p className="font-mono text-sm break-all">{pixCode}</p>
                            </div>
                            <Button onClick={copyPixCode} className="w-full" variant={copied ? 'outline' : 'primary'}>
                                <Copy className="h-4 w-4 mr-2" />
                                {copied ? 'Copiado!' : 'Copiar Código PIX'}
                            </Button>
                            <p className="text-sm text-emerald-700 text-center">
                                Abra o app do seu banco, escolha PIX → Colar Código e pague!
                            </p>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Payment History */}
            <Card>
                <CardHeader>
                    <CardTitle>Histórico de Pagamentos</CardTitle>
                </CardHeader>
                <CardContent>
                    {payments.length > 0 ? (
                        <div className="space-y-3">
                            {payments.map((payment) => (
                                <div
                                    key={payment.id}
                                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                                >
                                    <div>
                                        <p className="font-medium">{formatCurrency(payment.valor)}</p>
                                        <p className="text-sm text-gray-500">
                                            Vencimento: {formatDate(payment.data_vencimento)}
                                        </p>
                                    </div>
                                    <Badge
                                        variant={
                                            payment.status === 'pago' ? 'success' :
                                                payment.status === 'pendente' ? 'warning' : 'danger'
                                        }
                                    >
                                        {payment.status === 'pago' ? 'Pago' :
                                            payment.status === 'pendente' ? 'Pendente' : 'Cancelado'}
                                    </Badge>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-gray-500 text-center py-4">Nenhum pagamento registrado</p>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
