'use client';

import { useEffect, useState } from 'react';
import { Check, Crown, Zap } from 'lucide-react';
import Link from 'next/link';

export default function UpgradePage() {
    const [trialInfo, setTrialInfo] = useState<any>(null);

    useEffect(() => {
        fetch('/api/check-trial')
            .then(res => res.json())
            .then(data => setTrialInfo(data))
            .catch(err => console.error(err));
    }, []);

    const plans = [
        {
            name: 'Básico',
            price: 99.90,
            units: 20,
            tagline: 'Ideal para condomínios pequenos',
            features: [
                'Até 20 unidades',
                'Gestão financeira completa',
                'Controle de portaria digital',
                'Avisos e comunicados',
                'Cadastro de moradores',
                'Relatórios financeiros',
                'Integração com boletos e PIX',
                'Acesso mobile',
                'Suporte por email'
            ]
        },
        {
            name: 'Avançado',
            price: 249.90,
            units: 60,
            popular: true,
            tagline: 'Mais recursos e capacidade',
            badge: 'Recomendado',
            features: [
                'Até 60 unidades',
                'Tudo do plano Básico',
                'Assembleias digitais',
                'Enquetes e pesquisas',
                'Gestão de documentos',
                'Reserva de áreas comuns',
                'Registro de ocorrências',
                'Notificações em tempo real',
                'Dashboard executivo',
                'Suporte prioritário'
            ]
        },
        {
            name: 'Premium',
            price: 399.90,
            units: 'Ilimitadas',
            tagline: 'Solução corporativa completa',
            badge: 'Empresarial',
            features: [
                'Unidades ilimitadas',
                'Tudo do plano Avançado',
                'Múltiplos condomínios',
                'Controle de manutenção',
                'Gestão de fornecedores',
                'Relatórios personalizados',
                'Histórico completo',
                'Gerente de conta dedicado',
                'Suporte via WhatsApp'
            ]
        }
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-blue-50">
            <div className="max-w-7xl mx-auto px-4 py-12">
                {/* Header */}
                <div className="text-center mb-12">
                    {trialInfo?.isExpired ? (
                        <>
                            <h1 className="text-4xl font-bold text-gray-900 mb-4">
                                Seu período de teste expirou
                            </h1>
                            <p className="text-xl text-gray-600">
                                Continue aproveitando todos os recursos do Condomínio Fácil
                            </p>
                        </>
                    ) : (
                        <>
                            <h1 className="text-4xl font-bold text-gray-900 mb-4">
                                Aproveite enquanto é tempo! ⏰
                            </h1>
                            <p className="text-xl text-gray-600">
                                {trialInfo?.daysLeft > 0 && `Restam ${trialInfo.daysLeft} dias do seu teste grátis`}
                            </p>
                        </>
                    )}
                </div>

                {/* Plans */}
                <div className="grid md:grid-cols-3 gap-8 mb-12">
                    {plans.map((plan, idx) => (
                        <div
                            key={idx}
                            className={`relative bg-white rounded-2xl shadow-xl p-8 ${plan.popular ? 'ring-2 ring-emerald-500 scale-105' : ''
                                }`}
                        >
                            {plan.badge && (
                                <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
                                    <span className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-4 py-1 rounded-full text-sm font-bold shadow-lg">
                                        {plan.badge}
                                    </span>
                                </div>
                            )}

                            {plan.popular && !plan.badge && (
                                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                                    <span className="bg-emerald-500 text-white px-4 py-1 rounded-full text-sm font-semibold flex items-center gap-1">
                                        <Crown className="h-4 w-4" />
                                        Mais Popular
                                    </span>
                                </div>
                            )}

                            <div className="text-center mb-6">
                                <h3 className="text-2xl font-bold text-gray-900 mb-1">{plan.name}</h3>
                                {plan.tagline && (
                                    <p className="text-sm text-emerald-600 font-medium mb-3">{plan.tagline}</p>
                                )}
                                <div className="flex items-baseline justify-center gap-1">
                                    <span className="text-4xl font-bold text-emerald-600">
                                        R$ {plan.price.toFixed(2)}
                                    </span>
                                    <span className="text-gray-500">/mês</span>
                                </div>
                                <p className="text-sm text-gray-600 mt-2">
                                    {typeof plan.units === 'number' ? `Até ${plan.units}` : plan.units} unidades
                                </p>
                            </div>

                            <ul className="space-y-3 mb-8">
                                {plan.features.map((feature, i) => (
                                    <li key={i} className="flex items-start gap-2">
                                        <Check className="h-5 w-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                                        <span className="text-gray-700">{feature}</span>
                                    </li>
                                ))}
                            </ul>

                            <a
                                href={`https://wa.me/5521965532247?text=Olá! Quero assinar o plano ${plan.name} (R$ ${plan.price.toFixed(2)}/mês)`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`block w-full text-center py-3 px-6 rounded-lg font-semibold transition-colors ${plan.popular
                                    ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                                    : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                                    }`}
                            >
                                Assinar via WhatsApp
                            </a>
                        </div>
                    ))}
                </div>

                {/* CTA */}
                <div className="bg-emerald-600 rounded-2xl p-8 text-center text-white">
                    <Zap className="h-12 w-12 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold mb-2">Precisa de ajuda para escolher?</h2>
                    <p className="text-emerald-100 mb-6">
                        Entre em contato conosco e teremos prazer em ajudá-lo!
                    </p>
                    <div className="flex gap-4 justify-center">
                        <a
                            href="https://wa.me/5521965532247"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-white text-emerald-600 px-6 py-3 rounded-lg font-semibold hover:bg-emerald-50 transition-colors"
                        >
                            Falar no WhatsApp
                        </a>
                        <a
                            href="mailto:contato@meucondominiofacil.com"
                            className="bg-emerald-700 text-white px-6 py-3 rounded-lg font-semibold hover:bg-emerald-800 transition-colors"
                        >
                            Enviar Email
                        </a>
                    </div>
                </div>

                {/* Back to dashboard */}
                <div className="text-center mt-8">
                    <Link href="/" className="text-emerald-600 hover:text-emerald-700 font-medium">
                        ← Voltar ao Dashboard
                    </Link>
                </div>
            </div>
        </div>
    );
}
