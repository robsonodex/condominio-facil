import Link from 'next/link';
import { CheckCircle, Clock, Shield, Zap, Users, Building2, ArrowRight, Phone, Mail } from 'lucide-react';

export default function ImplantacaoPage() {
    const steps = [
        { day: 1, title: 'Cadastro e Configuração Inicial', desc: 'Criamos seu condomínio no sistema e configuramos os dados básicos' },
        { day: 2, title: 'Importação de Dados', desc: 'Migração de moradores, unidades e saldos existentes' },
        { day: 3, title: 'Configuração Financeira', desc: 'Configuração de taxas, categorias e formas de pagamento' },
        { day: 4, title: 'Treinamento do Síndico', desc: 'Sessão online de treinamento completo do sistema' },
        { day: 5, title: 'Ativação de Portaria', desc: 'Configuração do controle de visitantes e acessos' },
        { day: 6, title: 'Testes e Ajustes', desc: 'Revisão completa com ajustes personalizados' },
        { day: 7, title: 'Go Live!', desc: 'Sistema 100% operacional e moradores acessando' },
    ];

    const benefits = [
        { icon: Clock, title: 'Pronto em 7 Dias', desc: 'Implantação expressa sem burocracia' },
        { icon: Shield, title: 'Suporte Dedicado', desc: 'Acompanhamento durante toda implantação' },
        { icon: Zap, title: 'Sem Complicação', desc: 'Nós fazemos todo o trabalho pesado' },
        { icon: Users, title: 'Treinamento Incluso', desc: 'Capacitação completa da equipe' },
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-blue-50">
            {/* Header */}
            <header className="container mx-auto px-4 py-6">
                <nav className="flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2">
                        <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-xl flex items-center justify-center">
                            <Building2 className="h-6 w-6 text-white" />
                        </div>
                        <span className="text-xl font-bold text-gray-900">Condomínio Fácil</span>
                    </Link>
                    <div className="flex gap-4">
                        <Link href="/landing" className="text-gray-600 hover:text-emerald-600">Ver Planos</Link>
                        <Link href="/login" className="bg-emerald-500 text-white px-4 py-2 rounded-lg hover:bg-emerald-600">Acessar</Link>
                    </div>
                </nav>
            </header>

            {/* Hero */}
            <section className="container mx-auto px-4 py-16 text-center">
                <div className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-700 px-4 py-2 rounded-full mb-6">
                    <Clock className="h-4 w-4" />
                    <span className="text-sm font-medium">Implantação Expressa</span>
                </div>
                <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
                    Seu Condomínio Digital<br />
                    <span className="text-emerald-500">em Apenas 7 Dias</span>
                </h1>
                <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
                    Chega de planilhas, papelada e confusão. Transformamos a gestão do seu
                    condomínio com uma implantação rápida e sem complicações.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Link
                        href="https://wa.me/5521962532247?text=Olá!%20Quero%20implantar%20o%20Condomínio%20Fácil%20em%207%20dias"
                        target="_blank"
                        className="bg-emerald-500 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:bg-emerald-600 transition flex items-center justify-center gap-2"
                    >
                        Quero Implantar Agora
                        <ArrowRight className="h-5 w-5" />
                    </Link>
                    <Link
                        href="/landing"
                        className="border-2 border-gray-300 text-gray-700 px-8 py-4 rounded-xl text-lg font-semibold hover:border-emerald-500 hover:text-emerald-600 transition"
                    >
                        Ver Planos e Preços
                    </Link>
                </div>
            </section>

            {/* Benefits */}
            <section className="container mx-auto px-4 py-16">
                <div className="grid md:grid-cols-4 gap-6">
                    {benefits.map((b, i) => (
                        <div key={i} className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
                            <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center mb-4">
                                <b.icon className="h-6 w-6 text-emerald-600" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">{b.title}</h3>
                            <p className="text-gray-600">{b.desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* Timeline */}
            <section className="container mx-auto px-4 py-16">
                <h2 className="text-3xl font-bold text-center text-gray-900 mb-4">
                    Como Funciona?
                </h2>
                <p className="text-center text-gray-600 mb-12 max-w-xl mx-auto">
                    Um processo estruturado e transparente para você acompanhar cada etapa
                </p>
                <div className="max-w-3xl mx-auto">
                    {steps.map((step, i) => (
                        <div key={i} className="flex gap-4 mb-8">
                            <div className="flex flex-col items-center">
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold ${i === 6 ? 'bg-emerald-500 text-white' : 'bg-emerald-100 text-emerald-700'
                                    }`}>
                                    {step.day}
                                </div>
                                {i < 6 && <div className="w-0.5 h-full bg-emerald-200 mt-2" />}
                            </div>
                            <div className="flex-1 pb-8">
                                <h3 className="font-semibold text-gray-900 text-lg">{step.title}</h3>
                                <p className="text-gray-600">{step.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* CTA Final */}
            <section className="container mx-auto px-4 py-16">
                <div className="bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-3xl p-8 md:p-16 text-center text-white">
                    <h2 className="text-3xl md:text-4xl font-bold mb-4">
                        Pronto para Transformar seu Condomínio?
                    </h2>
                    <p className="text-emerald-100 text-lg mb-8 max-w-xl mx-auto">
                        Entre em contato agora e comece a implantação. Em uma semana você terá
                        o controle total do seu condomínio na palma da mão.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link
                            href="https://wa.me/5521965532247?text=Olá!%20Quero%20implantar%20o%20Condomínio%20Fácil"
                            target="_blank"
                            className="bg-white text-emerald-600 px-8 py-4 rounded-xl text-lg font-semibold hover:bg-emerald-50 transition flex items-center justify-center gap-2"
                        >
                            <Phone className="h-5 w-5" />
                            Falar pelo WhatsApp
                        </Link>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="container mx-auto px-4 py-8 text-center text-gray-500 text-sm">
                <p>© {new Date().getFullYear()} Condomínio Fácil. Todos os direitos reservados.</p>
                <div className="mt-2 flex gap-4 justify-center">
                    <Link href="/termos" className="hover:text-emerald-600">Termos</Link>
                    <Link href="/privacidade" className="hover:text-emerald-600">Privacidade</Link>
                    <Link href="/landing" className="hover:text-emerald-600">Planos</Link>
                </div>
            </footer>
        </div>
    );
}
