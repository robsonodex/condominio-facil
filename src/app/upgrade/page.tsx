'use client';

import { useEffect, useState } from 'react';
import { Check, Crown, Zap, Shield, Building2, MessageCircle, ArrowLeft } from 'lucide-react';
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
            price: 149.90,
            units: 20,
            tagline: 'Ideal para pequenos condomínios',
            features: [
                'Até 20 unidades exclusivas',
                'Gestão Financeira completa',
                'Cadastro de Moradores ilimitado',
                'Mural de Avisos Digital',
                'Chat Direto Síndico-Morador',
                'Marketplace Interno',
                'Módulo de Autovistoria Predial',
                'App Móvel (Android e iOS)',
                'Suporte via Email'
            ],
            notIncluded: ['Portaria QR', 'Encomendas', 'Reservas', 'Câmeras', 'IA']
        },
        {
            name: 'Plus',
            price: 249.90,
            units: 50,
            popular: true,
            tagline: 'O queridinho dos Síndicos Profissionais',
            badge: 'Mais Vendido',
            savings: 'Segurança + Organização + Agilidade',
            features: [
                'Até 50 unidades exclusivas',
                'Tudo do Plano Básico +',
                'Portaria Virtual Profissional',
                'Convites com QR Code para Visitantes',
                'Gestão de Encomendas (Notificação Push)',
                'Reserva Online de Áreas Comuns',
                'Registro e Gestão de Ocorrências',
                'Relatórios em PDF e Excel',
                '✓ Suporte Prioritário via Chat'
            ],
            notIncluded: ['Câmeras ao Vivo', 'IA Avançada', 'Assembleias Online'],
            highlight: 'Reduza em 70% as reclamações no WhatsApp pessoal'
        },
        {
            name: 'Pro',
            price: 399.90,
            units: 'Ilimitadas',
            tagline: 'Tecnologia de Ponta e Segurança Total',
            badge: 'Completo',
            features: [
                'Unidades Ilimitadas',
                'Tudo do Plano Plus +',
                'Câmeras de Segurança ao Vivo no App',
                'Assembleias e Enquetes Online',
                'Governança Digital Completa',
                'IA com Llama 3 (Análise de Orçamentos)',
                'Múltiplos Condomínios (Multi-condo)',
                'Suporte VIP Direto via WhatsApp',
                '✓ Setup de Integrações Gratuito',
                '✓ Assistente IA Liberado'
            ],
            notIncluded: [],
            highlight: 'A experiência definitiva em gestão 4.0'
        }
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-blue-50">
            <div className="max-w-7xl mx-auto px-4 py-12">
                {/* Header */}
                <div className="text-center mb-16">
                    {trialInfo?.isExpired ? (
                        <div className="space-y-4">
                            <h1 className="text-5xl font-extrabold text-gray-900 tracking-tight">
                                Seu período de teste <span className="text-emerald-600">chegou ao fim</span>
                            </h1>
                            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                                Não deixe sua gestão parar! Escolha o plano que melhor se adapta ao seu condomínio e continue com a melhor tecnologia do mercado.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <h1 className="text-5xl font-extrabold text-gray-900 tracking-tight">
                                Pronto para elevar o <span className="text-emerald-600">nível da sua gestão?</span>
                            </h1>
                            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                                {trialInfo?.daysLeft > 0
                                    ? `Você ainda tem ${trialInfo.daysLeft} dias de teste, mas já pode garantir seu plano agora!`
                                    : 'Recursos profissionais para quem busca eficiência e transparência.'}
                            </p>
                        </div>
                    )}
                </div>

                {/* Plans */}
                <div className="grid md:grid-cols-3 gap-8 mb-20">
                    {plans.map((plan, idx) => (
                        <div
                            key={idx}
                            className={`relative bg-white rounded-3xl shadow-2xl p-8 transition-all duration-300 hover:shadow-emerald-100 ${plan.popular ? 'ring-4 ring-emerald-500 scale-105 z-10' : 'hover:scale-105'
                                }`}
                        >
                            {plan.badge && (
                                <div className="absolute -top-5 left-1/2 -translate-x-1/2 z-20">
                                    <span className="bg-gradient-to-r from-orange-500 to-red-600 text-white px-6 py-1.5 rounded-full text-sm font-bold shadow-xl border-2 border-white">
                                        {plan.badge}
                                    </span>
                                </div>
                            )}

                            <div className="text-center mb-8 border-b border-gray-100 pb-8">
                                <h3 className="text-3xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                                {plan.tagline && (
                                    <p className="text-sm text-emerald-600 font-bold mb-4 uppercase tracking-wider">{plan.tagline}</p>
                                )}
                                <div className="flex items-baseline justify-center gap-1 mb-2">
                                    <span className="text-5xl font-black text-gray-900">
                                        R$ {plan.price.toFixed(2).replace('.', ',')}
                                    </span>
                                    <span className="text-gray-500 font-medium">/mês</span>
                                </div>
                                <p className="text-sm text-gray-500">
                                    {typeof plan.units === 'number' ? `Para até ${plan.units}` : plan.units} unidades
                                </p>
                            </div>

                            <ul className="space-y-4 mb-8">
                                {plan.features.map((feature, i) => (
                                    <li key={i} className="flex items-start gap-3">
                                        <div className="mt-1 bg-emerald-100 rounded-full p-0.5">
                                            <Check className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                                        </div>
                                        <span className="text-gray-700 font-medium">{feature}</span>
                                    </li>
                                ))}
                            </ul>

                            {plan.highlight && (
                                <div className="mb-8 p-4 bg-emerald-50 rounded-2xl border border-emerald-100 italic">
                                    <p className="text-sm text-emerald-800 font-semibold text-center">
                                        💡 {plan.highlight}
                                    </p>
                                </div>
                            )}

                            <a
                                href={`https://wa.me/5521965532247?text=Olá! Gostaria de assinar o plano ${plan.name} do Condomínio Fácil.`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`block w-full text-center py-4 px-6 rounded-2xl font-bold text-lg transition-all shadow-lg ${plan.popular
                                    ? 'bg-emerald-600 text-white hover:bg-emerald-700 hover:shadow-emerald-200'
                                    : 'bg-gray-900 text-white hover:bg-gray-800'
                                    }`}
                            >
                                Assinar Agora
                            </a>
                        </div>
                    ))}
                </div>

                {/* Features Grid - Selling Point */}
                <div className="mb-20">
                    <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">Por que escolher o Condomínio Fácil?</h2>
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4 text-blue-600">
                                <Zap className="h-6 w-6" />
                            </div>
                            <h4 className="font-bold text-gray-900 mb-2">WhatsApp Integrado</h4>
                            <p className="text-sm text-gray-600">Envio automático de boletos e avisos urgentes direto no celular do morador.</p>
                        </div>
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                            <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center mb-4 text-emerald-600">
                                <Crown className="h-6 w-6" />
                            </div>
                            <h4 className="font-bold text-gray-900 mb-2">Portaria 2.0</h4>
                            <p className="text-sm text-gray-600">Convites via QR Code e gestão de encomendas com alertas em tempo real.</p>
                        </div>
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-4 text-purple-600">
                                <Building2 className="h-6 w-6" />
                            </div>
                            <h4 className="font-bold text-gray-900 mb-2">Reservas Online</h4>
                            <p className="text-sm text-gray-600">Salão de festas, churrasqueiras e áreas comuns com gestão automática de taxas.</p>
                        </div>
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                            <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mb-4 text-orange-600">
                                <Shield className="h-6 w-6" />
                            </div>
                            <h4 className="font-bold text-gray-900 mb-2">Segurança Máxima</h4>
                            <p className="text-sm text-gray-600">Tudo nas nuvens com backups diários e total conformidade com a LGPD.</p>
                        </div>
                    </div>
                </div>

                {/* CTA Help */}
                <div className="bg-gradient-to-r from-emerald-600 to-emerald-800 rounded-[2rem] p-12 text-center text-white shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
                    <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-40 h-40 bg-emerald-400/20 rounded-full blur-3xl"></div>

                    <h2 className="text-4xl font-black mb-4">Ainda tem dúvidas?</h2>
                    <p className="text-emerald-50 mb-8 max-w-xl mx-auto text-lg">
                        Nossa equipe está pronta para fazer uma demonstração personalizada e ajudar você a escolher o melhor plano.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <a
                            href="https://wa.me/5521965532247"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-white text-emerald-700 px-10 py-4 rounded-2xl font-bold hover:bg-emerald-50 transition-all shadow-lg flex items-center justify-center gap-2"
                        >
                            <MessageCircle className="h-5 w-5" />
                            Falar com consultor
                        </a>
                    </div>
                </div>

                {/* Back Link */}
                <div className="text-center mt-12 pb-12">
                    <Link href="/" className="text-gray-500 hover:text-emerald-600 font-bold transition-colors flex items-center justify-center gap-2">
                        <ArrowLeft className="h-4 w-4" />
                        Voltar ao Dashboard
                    </Link>
                </div>
            </div>
        </div>
    );
}
