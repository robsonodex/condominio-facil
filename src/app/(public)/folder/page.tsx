'use client';

import { useState, useRef } from 'react';
import { Building2, Users, DoorOpen, Calendar, ClipboardList, BarChart3, Check, Download, Phone, Globe, Shield, Clock, Zap, Star, ArrowRight, Printer } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

export default function FolderPage() {
    const folderRef = useRef<HTMLDivElement>(null);
    const [downloading, setDownloading] = useState(false);

    const handlePrint = () => {
        window.print();
    };

    const features = [
        { icon: Building2, title: 'Controle Financeiro', desc: 'Gerencie receitas, despesas e inadimplência' },
        { icon: Users, title: 'Gestão de Moradores', desc: 'Cadastro completo de unidades e residentes' },
        { icon: DoorOpen, title: 'Portaria Digital', desc: 'Controle de visitantes e entregas' },
        { icon: Calendar, title: 'Reservas de Áreas', desc: 'Salão de festas, churrasqueira e mais' },
        { icon: ClipboardList, title: 'Ocorrências', desc: 'Registro e acompanhamento de problemas' },
        { icon: BarChart3, title: 'Relatórios', desc: 'Prestação de contas automatizada' },
    ];

    const plans = [
        {
            name: 'Básico',
            price: 'R$ 99,90',
            units: 'Até 20 unidades',
            features: ['Gestão Financeira', 'Cadastro de Moradores', 'Avisos e Comunicados', 'Suporte por Email'],
            popular: false
        },
        {
            name: 'Profissional',
            price: 'R$ 249,90',
            units: 'Até 50 unidades',
            features: ['Tudo do Básico', 'Portaria Digital', 'Reservas de Áreas', 'Ocorrências', 'Encomendas', 'Relatórios Avançados'],
            popular: true
        },
        {
            name: 'Premium',
            price: 'R$ 399,90',
            units: 'Ilimitado',
            features: ['Tudo do Profissional', 'Multi-Condomínio', 'Governança Digital', 'Automações', 'Suporte Prioritário'],
            popular: false
        },
    ];

    const benefits = [
        { icon: Shield, text: 'Dados 100% Seguros' },
        { icon: Clock, text: 'Economize até 10h/semana' },
        { icon: Zap, text: 'Implantação em 24h' },
        { icon: Star, text: 'Satisfação Garantida' },
    ];

    return (
        <>
            {/* Print Styles */}
            <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #folder-content, #folder-content * {
            visibility: visible;
          }
          #folder-content {
            position: absolute;
            left: 0;
            top: 0;
            width: 210mm;
            padding: 10mm;
          }
          .no-print {
            display: none !important;
          }
          @page {
            size: A4;
            margin: 0;
          }
        }
      `}</style>

            <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
                {/* Header com botões de ação */}
                <div className="no-print bg-gray-900/80 backdrop-blur-sm border-b border-gray-700 sticky top-0 z-50">
                    <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
                        <Link href="/" className="flex items-center gap-2 text-white hover:text-green-400 transition-colors">
                            <Building2 className="h-6 w-6 text-green-500" />
                            <span className="font-bold">Meu Condomínio Fácil</span>
                        </Link>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={handlePrint}
                                className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                            >
                                <Printer className="h-4 w-4" />
                                <span className="hidden sm:inline">Imprimir / Salvar PDF</span>
                            </button>
                            <Link
                                href="/register"
                                className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg transition-colors font-semibold"
                            >
                                <span>Começar Grátis</span>
                                <ArrowRight className="h-4 w-4" />
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Folder Content - Printable */}
                <div id="folder-content" ref={folderRef} className="max-w-4xl mx-auto p-6 sm:p-8 print:p-0">

                    {/* Hero Section */}
                    <div className="text-center mb-12 print:mb-8">
                        <div className="inline-flex items-center justify-center gap-3 mb-6">
                            <div className="bg-green-500 p-3 rounded-2xl">
                                <Building2 className="h-10 w-10 text-white" />
                            </div>
                            <div className="text-left">
                                <p className="text-green-400 text-sm font-medium italic -mb-1">Meu</p>
                                <h1 className="text-3xl sm:text-4xl font-bold text-white">Condomínio Fácil</h1>
                            </div>
                        </div>
                        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
                            Gestão de Condomínio <span className="text-green-400">Simples e Eficiente</span>
                        </h2>
                        <p className="text-gray-300 text-lg max-w-2xl mx-auto">
                            Sistema 100% web para síndicos que querem mais organização, menos trabalho e moradores satisfeitos.
                        </p>
                    </div>

                    {/* Benefits Bar */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-12 print:mb-8">
                        {benefits.map((benefit, i) => (
                            <div key={i} className="bg-gray-800/50 backdrop-blur rounded-xl p-4 text-center border border-gray-700">
                                <benefit.icon className="h-6 w-6 text-green-400 mx-auto mb-2" />
                                <p className="text-white text-sm font-medium">{benefit.text}</p>
                            </div>
                        ))}
                    </div>

                    {/* Features Grid */}
                    <div className="mb-12 print:mb-8">
                        <h3 className="text-xl font-bold text-white text-center mb-6">
                            Tudo que você precisa em um só lugar
                        </h3>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                            {features.map((feature, i) => (
                                <div key={i} className="bg-gradient-to-br from-gray-800 to-gray-800/50 rounded-xl p-4 border border-gray-700 hover:border-green-500/50 transition-colors">
                                    <feature.icon className="h-8 w-8 text-green-400 mb-3" />
                                    <h4 className="text-white font-semibold mb-1">{feature.title}</h4>
                                    <p className="text-gray-400 text-sm">{feature.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Pricing Section */}
                    <div className="mb-12 print:mb-8">
                        <h3 className="text-xl font-bold text-white text-center mb-2">
                            Planos que cabem no seu bolso
                        </h3>
                        <p className="text-green-400 text-center mb-6 font-medium">
                            🎁 Teste grátis por 7 dias - Sem cartão de crédito!
                        </p>
                        <div className="grid sm:grid-cols-3 gap-4">
                            {plans.map((plan, i) => (
                                <div
                                    key={i}
                                    className={`relative rounded-2xl p-5 border-2 transition-transform hover:scale-[1.02] ${plan.popular
                                            ? 'bg-gradient-to-br from-green-900/50 to-green-800/30 border-green-500'
                                            : 'bg-gray-800/50 border-gray-700'
                                        }`}
                                >
                                    {plan.popular && (
                                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                                            MAIS POPULAR
                                        </div>
                                    )}
                                    <h4 className="text-white font-bold text-lg mb-1">{plan.name}</h4>
                                    <p className="text-gray-400 text-sm mb-3">{plan.units}</p>
                                    <p className="text-3xl font-bold text-white mb-1">{plan.price}</p>
                                    <p className="text-gray-400 text-sm mb-4">/mês</p>
                                    <ul className="space-y-2">
                                        {plan.features.map((f, j) => (
                                            <li key={j} className="flex items-center gap-2 text-sm text-gray-300">
                                                <Check className="h-4 w-4 text-green-400 flex-shrink-0" />
                                                {f}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* CTA Section */}
                    <div className="bg-gradient-to-r from-green-600 to-green-500 rounded-2xl p-8 text-center mb-8">
                        <h3 className="text-2xl font-bold text-white mb-2">
                            Transforme a gestão do seu condomínio hoje!
                        </h3>
                        <p className="text-green-100 mb-6">
                            Junte-se a centenas de síndicos que já simplificaram seu trabalho
                        </p>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                            <Link
                                href="/register"
                                className="no-print w-full sm:w-auto bg-white text-green-600 font-bold px-8 py-3 rounded-xl hover:bg-gray-100 transition-colors inline-flex items-center justify-center gap-2"
                            >
                                Começar Teste Grátis
                                <ArrowRight className="h-5 w-5" />
                            </Link>
                            <a
                                href="https://wa.me/5521965532247?text=Olá! Gostaria de saber mais sobre o Meu Condomínio Fácil"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-full sm:w-auto bg-green-700 text-white font-bold px-8 py-3 rounded-xl hover:bg-green-800 transition-colors inline-flex items-center justify-center gap-2"
                            >
                                <Phone className="h-5 w-5" />
                                Falar no WhatsApp
                            </a>
                        </div>
                    </div>

                    {/* Contact Footer */}
                    <div className="text-center text-gray-400 space-y-2">
                        <div className="flex items-center justify-center gap-6 flex-wrap">
                            <a href="https://meucondominiofacil.com" className="flex items-center gap-2 hover:text-green-400 transition-colors">
                                <Globe className="h-4 w-4" />
                                meucondominiofacil.com
                            </a>
                            <a href="tel:+5521965532247" className="flex items-center gap-2 hover:text-green-400 transition-colors">
                                <Phone className="h-4 w-4" />
                                (21) 96553-2247
                            </a>
                        </div>
                        <p className="text-sm">
                            ✓ Sem fidelidade &nbsp;•&nbsp; ✓ Cancele quando quiser &nbsp;•&nbsp; ✓ Suporte humanizado
                        </p>
                    </div>

                </div>
            </div>
        </>
    );
}
