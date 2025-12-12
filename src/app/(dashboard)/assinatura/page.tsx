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
    const [generatingCheckout, setGeneratingCheckout] = useState(false);
    const [pixCode, setPixCode] = useState('');
    const [copied, setCopied] = useState(false);
    const supabase = createClient();

    useEffect(() => {
        if (condoId) {
            fetchData();
        }
    }, [condoId]);

    const fetchData = async () => {
        try {
            // Fetch subscription - use maybeSingle to avoid error if not found
            const { data: subData, error: subError } = await supabase
                .from('subscriptions')
                .select('*, plan:plans(*)')
                .eq('condo_id', condoId)
                .maybeSingle();

            if (subError) {
                console.error('Error fetching subscription:', subError);
            }

            setSubscription(subData);

            // Fetch payment history
            const { data: payData, error: payError } = await supabase
                .from('payments')
                .select('*')
                .eq('condo_id', condoId)
                .order('created_at', { ascending: false })
                .limit(10);

            if (payError) {
                console.error('Error fetching payments:', payError);
            }

            setPayments(payData || []);
        } catch (error) {
            console.error('Error in fetchData:', error);
        } finally {
            setLoading(false);
        }
    };

    // Checkout Mercado Pago - redireciona para pagamento
    const generateMercadoPagoCheckout = async () => {
        if (!subscription || !condoId) return;

        setGeneratingCheckout(true);
        try {
            const response = await fetch('/api/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    condoId: condoId,
                    planId: (subscription as any).plano_id || (subscription as any).plan?.id,
                    metodoPagamento: 'cartao'
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Erro ao gerar checkout');
            }

            // Redirecionar para Mercado Pago em nova aba
            const url = data.paymentUrl || data.checkout_url || data.init_point;
            if (url) {
                window.open(url, '_blank');
            } else {
                // Se não tem URL, pode ser que o MP não está configurado - mostrar PIX como alternativa
                throw new Error('Mercado Pago não configurado. Use PIX Direto.');
            }
        } catch (error: any) {
            alert(`❌ ${error.message}`);
        } finally {
            setGeneratingCheckout(false);
        }
    };

    const generatePixPayment = async () => {
        setGeneratingPix(true);

        try {
            const valor = subscription?.valor_mensal_cobrado || subscription?.plan?.valor_mensal || 49.90;

            // Call PIX API
            const response = await fetch('/api/pix', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    valor,
                    descricao: 'Mensalidade Condomínio Fácil',
                    useRealApi: true, // Try Banco Inter first
                }),
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.error || 'Erro ao gerar PIX');
            }

            // Save to database
            const { error } = await supabase
                .from('payments')
                .insert({
                    condo_id: condoId,
                    valor: valor,
                    status: 'pendente',
                    pix_code: data.pixCode,
                    txid: data.txid,
                    data_vencimento: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                });

            if (error) throw error;

            setPixCode(data.pixCode);
            fetchData();
        } catch (err: any) {
            console.error('Error generating PIX:', err);
            alert(err.message || 'Erro ao gerar PIX. Tente novamente.');
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

                            {/* Botões de Pagamento - sempre visíveis */}
                            <div className="space-y-4 pt-4 border-t">
                                <p className="text-sm font-medium text-gray-700">Opções de pagamento:</p>

                                {/* PIX Estático - Sempre visível */}
                                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                                    <div className="flex items-start gap-3">
                                        <QrCode className="h-8 w-8 text-emerald-600 flex-shrink-0" />
                                        <div className="flex-1">
                                            <h4 className="font-semibold text-emerald-800">Pagamento via PIX</h4>
                                            <p className="text-sm text-emerald-700 mb-2">Chave PIX (CNPJ):</p>
                                            <div className="flex items-center gap-2 bg-white p-2 rounded border border-emerald-300">
                                                <code className="text-sm font-mono flex-1">57.444.727/0001-85</code>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => {
                                                        navigator.clipboard.writeText('57444727000185');
                                                        setCopied(true);
                                                        setTimeout(() => setCopied(false), 2000);
                                                    }}
                                                >
                                                    <Copy className="h-4 w-4" />
                                                    {copied ? 'Copiado!' : ''}
                                                </Button>
                                            </div>
                                            <p className="text-xs text-emerald-600 mt-2">
                                                Valor: <strong>{formatCurrency(subscription?.valor_mensal_cobrado || subscription?.plan?.valor_mensal || 49.90)}</strong>
                                            </p>
                                        </div>
                                    </div>

                                    {/* WhatsApp Button */}
                                    <div className="mt-4 pt-3 border-t border-emerald-200">
                                        <p className="text-xs text-emerald-700 mb-2">
                                            ⚠️ Após pagar, envie o comprovante para dar baixa no sistema:
                                        </p>
                                        <Button
                                            variant="outline"
                                            className="w-full border-emerald-500 text-emerald-700 hover:bg-emerald-100"
                                            onClick={() => {
                                                const msg = encodeURIComponent(
                                                    `Olá! Segue comprovante de pagamento da mensalidade do Condomínio Fácil.\n\n` +
                                                    `Condomínio: ${profile?.condo_nome || 'N/A'}\n` +
                                                    `Valor: ${formatCurrency(subscription?.valor_mensal_cobrado || 49.90)}\n\n` +
                                                    `Por favor, confirmem o recebimento.`
                                                );
                                                window.open(`https://wa.me/5588999999999?text=${msg}`, '_blank');
                                            }}
                                        >
                                            📱 Enviar Comprovante via WhatsApp
                                        </Button>
                                    </div>
                                </div>

                                {/* Outras opções */}
                                <p className="text-xs text-gray-500 text-center">
                                    Ou use as opções abaixo para gerar código de pagamento automático:
                                </p>
                                <div className="grid grid-cols-2 gap-3">
                                    <Button
                                        onClick={generateMercadoPagoCheckout}
                                        disabled={generatingCheckout}
                                        variant="primary"
                                    >
                                        <CreditCard className="h-4 w-4 mr-2" />
                                        {generatingCheckout ? 'Abrindo...' : 'Cartão/Boleto'}
                                    </Button>
                                    <Button
                                        onClick={generatePixPayment}
                                        disabled={generatingPix}
                                        variant="outline"
                                    >
                                        <QrCode className="h-4 w-4 mr-2" />
                                        {generatingPix ? 'Gerando...' : 'Gerar QR Code'}
                                    </Button>
                                </div>
                            </div>
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
