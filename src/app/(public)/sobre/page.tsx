'use client';

import Link from 'next/link';
import { Building2, Users, Shield, Heart, MapPin, Mail, Phone, ArrowLeft } from 'lucide-react';

export default function SobrePage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-emerald-50">
            {/* Header */}
            <header className="bg-white shadow-sm">
                <div className="container mx-auto px-4 py-4 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2">
                        <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-xl flex items-center justify-center">
                            <Building2 className="h-6 w-6 text-white" />
                        </div>
                        <div className="flex flex-col leading-tight">
                            <span className="text-xs text-emerald-500 italic font-medium -mb-1">Meu</span>
                            <span className="font-bold text-gray-900">Condomínio Fácil</span>
                        </div>
                    </Link>
                    <Link href="/" className="flex items-center gap-2 text-gray-600 hover:text-emerald-600 transition-colors">
                        <ArrowLeft className="h-4 w-4" />
                        Voltar
                    </Link>
                </div>
            </header>

            {/* Hero */}
            <section className="py-16 md:py-24">
                <div className="container mx-auto px-4 text-center">
                    <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                        Quem Somos
                    </h1>
                    <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                        Somos uma empresa brasileira focada em simplificar a gestão de condomínios.
                        Criamos tecnologia para resolver problemas reais de síndicos e moradores.
                    </p>
                </div>
            </section>

            {/* Empresa */}
            <section className="py-12 bg-white">
                <div className="container mx-auto px-4">
                    <div className="max-w-4xl mx-auto">
                        <div className="grid md:grid-cols-2 gap-12">
                            {/* Info */}
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900 mb-6">Nossa Empresa</h2>

                                <div className="space-y-4">
                                    <div className="flex items-start gap-3">
                                        <Building2 className="h-5 w-5 text-emerald-600 mt-1" />
                                        <div>
                                            <p className="font-medium text-gray-900">Razão Social</p>
                                            <p className="text-gray-600">NODEX SOLUÇÕES EM TECNOLOGIA LTDA</p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-3">
                                        <Shield className="h-5 w-5 text-emerald-600 mt-1" />
                                        <div>
                                            <p className="font-medium text-gray-900">CNPJ</p>
                                            <p className="text-gray-600">57.444.727/0001-85</p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-3">
                                        <MapPin className="h-5 w-5 text-emerald-600 mt-1" />
                                        <div>
                                            <p className="font-medium text-gray-900">Endereço</p>
                                            <p className="text-gray-600">Rio de Janeiro - RJ, Brasil</p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-3">
                                        <Mail className="h-5 w-5 text-emerald-600 mt-1" />
                                        <div>
                                            <p className="font-medium text-gray-900">E-mail</p>
                                            <p className="text-gray-600">contato@meucondominiofacil.com</p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-3">
                                        <Phone className="h-5 w-5 text-emerald-600 mt-1" />
                                        <div>
                                            <p className="font-medium text-gray-900">Telefone</p>
                                            <p className="text-gray-600">(21) 96553-2247</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Valores */}
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900 mb-6">Nossos Valores</h2>

                                <div className="space-y-4">
                                    <div className="p-4 bg-emerald-50 rounded-xl">
                                        <h3 className="font-semibold text-emerald-700 mb-1">Simplicidade</h3>
                                        <p className="text-gray-600 text-sm">Tecnologia deve resolver problemas, não criar novos.</p>
                                    </div>

                                    <div className="p-4 bg-blue-50 rounded-xl">
                                        <h3 className="font-semibold text-blue-700 mb-1">Transparência</h3>
                                        <p className="text-gray-600 text-sm">Preços claros, sem letras miúdas, sem surpresas.</p>
                                    </div>

                                    <div className="p-4 bg-purple-50 rounded-xl">
                                        <h3 className="font-semibold text-purple-700 mb-1">Independência</h3>
                                        <p className="text-gray-600 text-sm">Sistema pertence ao condomínio, não a nós. Seus dados são seus.</p>
                                    </div>

                                    <div className="p-4 bg-amber-50 rounded-xl">
                                        <h3 className="font-semibold text-amber-700 mb-1">Suporte Real</h3>
                                        <p className="text-gray-600 text-sm">Atendimento humano, não robô. Resposta rápida.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Missão */}
            <section className="py-16 bg-emerald-600">
                <div className="container mx-auto px-4 text-center">
                    <h2 className="text-3xl font-bold text-white mb-6">Nossa Missão</h2>
                    <p className="text-xl text-emerald-100 max-w-2xl mx-auto">
                        Dar ao síndico o controle que ele precisa, com a simplicidade que ele merece.
                        Menos papel, menos inadimplência, menos dor de cabeça.
                    </p>
                </div>
            </section>

            {/* Diferenciais */}
            <section className="py-16 bg-white">
                <div className="container mx-auto px-4">
                    <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">Por que somos diferentes?</h2>

                    <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
                        <div className="text-center p-6">
                            <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                                <Shield className="h-6 w-6 text-emerald-600" />
                            </div>
                            <h3 className="font-semibold text-gray-900 mb-2">Sem Contrato Longo</h3>
                            <p className="text-gray-600 text-sm">Cancele quando quiser. Seus dados são exportados.</p>
                        </div>

                        <div className="text-center p-6">
                            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                                <Building2 className="h-6 w-6 text-blue-600" />
                            </div>
                            <h3 className="font-semibold text-gray-900 mb-2">Independente</h3>
                            <p className="text-gray-600 text-sm">Não depende de administradora. O sistema é do condomínio.</p>
                        </div>

                        <div className="text-center p-6">
                            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                                <Heart className="h-6 w-6 text-purple-600" />
                            </div>
                            <h3 className="font-semibold text-gray-900 mb-2">Feito para Você</h3>
                            <p className="text-gray-600 text-sm">Adaptado à realidade dos condomínios brasileiros.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="py-16 bg-gray-50">
                <div className="container mx-auto px-4 text-center">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Quer conhecer o sistema?</h2>
                    <p className="text-gray-600 mb-6">Faça um teste gratuito de 7 dias, sem compromisso.</p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link
                            href="/register"
                            className="px-8 py-3 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 transition-colors"
                        >
                            Começar Agora
                        </Link>
                        <Link
                            href="/landing"
                            className="px-8 py-3 border-2 border-emerald-600 text-emerald-600 rounded-xl font-semibold hover:bg-emerald-50 transition-colors"
                        >
                            Ver Funcionalidades
                        </Link>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-8 bg-gray-900 text-white">
                <div className="container mx-auto px-4 text-center">
                    <p className="text-gray-400 text-sm">
                        © 2025 Meu Condomínio Fácil. NODEX SOLUÇÕES EM TECNOLOGIA LTDA - CNPJ 57.444.727/0001-85
                    </p>
                </div>
            </footer>
        </div>
    );
}
