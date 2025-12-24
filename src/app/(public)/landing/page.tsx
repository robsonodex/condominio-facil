import Link from 'next/link';
import {
    CheckCircle, Shield, CreditCard, Users, FileText, Bell, BarChart3, Building2,
    ArrowRight, Star, Calendar, Package, Smartphone
} from 'lucide-react';

export const metadata = {
    title: 'Meu Condomínio Fácil - Gestão de Condomínios | Sistema 100% Online',
    description: 'Sistema completo para gestão de condomínios. Financeiro, moradores, portaria, reservas e app móvel. Teste grátis 7 dias.',
    keywords: 'gestão de condomínio, software para condomínio, sistema para síndico',
};

const features = [
    { icon: CreditCard, name: 'Financeiro', desc: 'Controle receitas, despesas e inadimplência' },
    { icon: Users, name: 'Moradores', desc: 'Cadastro completo com importação CSV' },
    { icon: Shield, name: 'Portaria', desc: 'Registro de visitantes com foto' },
    { icon: Calendar, name: 'Reservas', desc: 'Áreas comuns com aprovação' },
    { icon: FileText, name: 'Ocorrências', desc: 'Chamados com chat em tempo real' },
    { icon: Package, name: 'Encomendas', desc: 'Controle de entregas com notificação' },
];

const plans = [
    {
        name: 'Básico',
        price: '99,90',
        units: 'Até 20 unidades',
        features: ['Financeiro', 'Moradores', 'Avisos', 'App móvel'],
        popular: false,
    },
    {
        name: 'Profissional',
        price: '249,90',
        units: 'Até 50 unidades',
        features: ['Tudo do Básico +', 'Portaria', 'Ocorrências', 'Reservas', 'Relatórios', 'Encomendas'],
        popular: true,
    },
    {
        name: 'Premium',
        price: '399,90',
        units: 'Ilimitado',
        features: ['Tudo do Profissional +', 'Câmeras ao vivo', 'Governança digital', 'Multi-condomínios'],
        popular: false,
    },
];

export default function LandingPage() {
    return (
        <div className="min-h-screen bg-white">
            {/* Header */}
            <header className="fixed top-0 left-0 right-0 bg-white/95 backdrop-blur z-50 border-b">
                <div className="max-w-6xl mx-auto px-4 flex items-center justify-between h-16">
                    <div className="flex items-center gap-2">
                        <Building2 className="h-7 w-7 text-emerald-600" />
                        <span className="font-bold text-lg">Condomínio Fácil</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <Link href="/login" className="text-gray-600 hover:text-emerald-600 font-medium">
                            Entrar
                        </Link>
                        <Link href="/register" className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 font-semibold">
                            Teste Grátis
                        </Link>
                    </div>
                </div>
            </header>

            {/* Hero - Direto ao ponto */}
            <section className="pt-28 pb-16 bg-gradient-to-b from-emerald-50 to-white">
                <div className="max-w-4xl mx-auto px-4 text-center">
                    <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                        Gestão de condomínio
                        <span className="text-emerald-600"> simplificada</span>
                    </h1>
                    <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
                        Sistema 100% online para síndicos. Financeiro, moradores, portaria, reservas e muito mais.
                        <strong> App móvel para Android e iOS.</strong>
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
                        <Link
                            href="/register"
                            className="bg-emerald-600 text-white px-8 py-4 rounded-xl hover:bg-emerald-700 font-bold text-lg flex items-center gap-2 shadow-lg"
                        >
                            Começar Grátis <ArrowRight className="h-5 w-5" />
                        </Link>
                    </div>
                    <div className="flex items-center justify-center gap-6 text-sm text-gray-500">
                        <span className="flex items-center gap-1"><CheckCircle className="h-4 w-4 text-emerald-600" /> 7 dias grátis</span>
                        <span className="flex items-center gap-1"><CheckCircle className="h-4 w-4 text-emerald-600" /> Sem cartão</span>
                        <span className="flex items-center gap-1"><Smartphone className="h-4 w-4 text-emerald-600" /> App móvel</span>
                    </div>
                </div>
            </section>

            {/* Features - Grid simples */}
            <section className="py-16 bg-white">
                <div className="max-w-5xl mx-auto px-4">
                    <h2 className="text-2xl font-bold text-center text-gray-900 mb-10">
                        Tudo que seu condomínio precisa
                    </h2>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                        {features.map((f, i) => (
                            <div key={i} className="p-5 rounded-xl bg-gray-50 hover:bg-emerald-50 transition-colors">
                                <f.icon className="h-8 w-8 text-emerald-600 mb-3" />
                                <h3 className="font-semibold text-gray-900 mb-1">{f.name}</h3>
                                <p className="text-sm text-gray-600">{f.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Planos */}
            <section id="precos" className="py-16 bg-gray-50">
                <div className="max-w-5xl mx-auto px-4">
                    <h2 className="text-2xl font-bold text-center text-gray-900 mb-10">
                        Escolha seu plano
                    </h2>
                    <div className="grid md:grid-cols-3 gap-6">
                        {plans.map((plan, i) => (
                            <div
                                key={i}
                                className={`p-6 rounded-2xl bg-white shadow-sm ${plan.popular ? 'ring-2 ring-emerald-500 shadow-lg' : ''}`}
                            >
                                {plan.popular && (
                                    <span className="bg-emerald-500 text-white text-xs px-3 py-1 rounded-full font-medium">
                                        Mais Vendido
                                    </span>
                                )}
                                <h3 className="text-xl font-bold text-gray-900 mt-4">{plan.name}</h3>
                                <p className="text-gray-500 text-sm">{plan.units}</p>
                                <div className="my-4">
                                    <span className="text-3xl font-bold text-gray-900">R$ {plan.price}</span>
                                    <span className="text-gray-500">/mês</span>
                                </div>
                                <ul className="space-y-2 mb-6">
                                    {plan.features.map((f, j) => (
                                        <li key={j} className="flex items-center gap-2 text-sm text-gray-700">
                                            <CheckCircle className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                                            {f}
                                        </li>
                                    ))}
                                </ul>
                                <Link
                                    href="/register"
                                    className={`block text-center py-3 rounded-lg font-semibold ${plan.popular
                                        ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        }`}
                                >
                                    Começar Grátis
                                </Link>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* FAQ Resumido */}
            <section className="py-16 bg-white">
                <div className="max-w-3xl mx-auto px-4">
                    <h2 className="text-2xl font-bold text-center text-gray-900 mb-10">
                        Perguntas Frequentes
                    </h2>
                    <div className="space-y-4">
                        <div className="p-5 bg-gray-50 rounded-xl">
                            <h3 className="font-semibold text-gray-900 mb-2">Tem app para celular?</h3>
                            <p className="text-gray-600 text-sm">Sim! App nativo para Android e iOS. Baixe nas lojas oficiais.</p>
                        </div>
                        <div className="p-5 bg-gray-50 rounded-xl">
                            <h3 className="font-semibold text-gray-900 mb-2">Como funciona o teste grátis?</h3>
                            <p className="text-gray-600 text-sm">7 dias para testar todas as funcionalidades. Sem cartão de crédito.</p>
                        </div>
                        <div className="p-5 bg-gray-50 rounded-xl">
                            <h3 className="font-semibold text-gray-900 mb-2">Posso cancelar quando quiser?</h3>
                            <p className="text-gray-600 text-sm">Sim! Sem fidelidade. Cancele pelo próprio sistema.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Final */}
            <section className="py-16 bg-emerald-600">
                <div className="max-w-2xl mx-auto px-4 text-center">
                    <h2 className="text-3xl font-bold text-white mb-4">
                        Pronto para simplificar sua gestão?
                    </h2>
                    <p className="text-emerald-100 mb-8">
                        Teste grátis por 7 dias. Sem compromisso.
                    </p>
                    <Link
                        href="/register"
                        className="inline-flex items-center gap-2 bg-white text-emerald-600 px-8 py-4 rounded-xl font-bold text-lg hover:bg-gray-100"
                    >
                        Começar Agora <ArrowRight className="h-5 w-5" />
                    </Link>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-8 bg-gray-900 text-gray-400 text-center text-sm">
                <p>© 2024 Meu Condomínio Fácil · CNPJ: 57.444.727/0001-85</p>
            </footer>
        </div>
    );
}
