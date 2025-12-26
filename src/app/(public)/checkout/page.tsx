'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Building2, ArrowLeft, Loader2 } from 'lucide-react';
import { trackEvent } from '@/components/shared/Analytics';
import { getStoredUtmParams } from '@/hooks/useUtmTracking';

export const dynamic = 'force-dynamic';

const plans = [
    { id: 'essencial', name: 'Essencial', price: 99.90, units: 20 },
    { id: 'plus', name: 'Plus', price: 179.90, units: 40 },
    { id: 'pro', name: 'Pro', price: 249.90, units: 60 },
];

function CheckoutForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const planParam = searchParams?.get('plan') || 'plus';

    const selectedPlan = plans.find(p => p.id === planParam) || plans[1];

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        condo_name: '',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            // Get UTM params
            const utmParams = getStoredUtmParams();

            // Track checkout start
            trackEvent('begin_checkout', {
                value: selectedPlan.price,
                currency: 'BRL',
                items: [{ item_name: selectedPlan.name }]
            });

            // Call checkout API
            const response = await fetch('/api/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    plan_id: selectedPlan.id,
                    plan_name: selectedPlan.name,
                    amount: selectedPlan.price,
                    ...utmParams
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Erro ao criar checkout');
            }

            // Redirect to Mercado Pago
            if (data.init_point) {
                trackEvent('redirect_to_payment', {
                    plan: selectedPlan.name,
                    value: selectedPlan.price
                });
                window.location.href = data.init_point;
            } else {
                throw new Error('Link de pagamento não gerado');
            }
        } catch (err: any) {
            setError(err.message || 'Erro ao processar checkout');
            console.error('Checkout error:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 py-12">
            <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
                <Link href="/" className="inline-flex items-center gap-2 text-gray-600 hover:text-emerald-600 mb-8">
                    <ArrowLeft className="h-4 w-4" />
                    Voltar para a página inicial
                </Link>

                <div className="bg-white rounded-2xl shadow-lg p-8">
                    <div className="flex items-center gap-3 mb-8">
                        <Building2 className="h-10 w-10 text-emerald-600" />
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Finalizar Cadastro</h1>
                            <p className="text-gray-600">Preencha seus dados para continuar</p>
                        </div>
                    </div>

                    {/* Plan Summary */}
                    <div className="bg-emerald-50 rounded-xl p-6 mb-8 border border-emerald-200">
                        <div className="flex justify-between items-center mb-2">
                            <h3 className="font-semibold text-gray-900">Plano Selecionado</h3>
                            <Link href="/#precos" className="text-sm text-emerald-600 hover:text-emerald-700">
                                Alterar plano
                            </Link>
                        </div>
                        <div className="flex justify-between items-center">
                            <div>
                                <p className="text-lg font-bold text-gray-900">{selectedPlan.name}</p>
                                <p className="text-sm text-gray-600">Até {selectedPlan.units} unidades</p>
                            </div>
                            <div className="text-right">
                                <p className="text-2xl font-bold text-emerald-600">
                                    R$ {selectedPlan.price.toFixed(2)}
                                </p>
                                <p className="text-sm text-gray-600">por mês</p>
                            </div>
                        </div>
                        <div className="mt-4 pt-4 border-t border-emerald-200">
                            <p className="text-sm text-gray-600">
                                ✓ 7 dias grátis para teste • Cancele quando quiser
                            </p>
                        </div>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Nome Completo *
                            </label>
                            <input
                                type="text"
                                required
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                placeholder="Seu nome"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Email *
                            </label>
                            <input
                                type="email"
                                required
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                placeholder="seu@email.com"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Telefone *
                            </label>
                            <input
                                type="tel"
                                required
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                placeholder="(11) 98765-4321"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Nome do Condomínio *
                            </label>
                            <input
                                type="text"
                                required
                                value={formData.condo_name}
                                onChange={(e) => setFormData({ ...formData, condo_name: e.target.value })}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                placeholder="Ex: Edifício Solar"
                            />
                        </div>

                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-emerald-600 text-white py-4 rounded-xl font-semibold hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                    Processando...
                                </>
                            ) : (
                                'Continuar para Pagamento'
                            )}
                        </button>

                        <p className="text-xs text-gray-500 text-center">
                            Ao continuar, você será redirecionado para o Mercado Pago para realizar o pagamento de forma segura.
                            Você concorda com nossos{' '}
                            <Link href="/termos" className="text-emerald-600 hover:underline">
                                Termos de Uso
                            </Link>{' '}
                            e{' '}
                            <Link href="/privacidade" className="text-emerald-600 hover:underline">
                                Política de Privacidade
                            </Link>.
                        </p>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default function CheckoutPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
            </div>
        }>
            <CheckoutForm />
        </Suspense>
    );
}
