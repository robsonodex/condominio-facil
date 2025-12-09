import Link from 'next/link';
import { CheckCircle, Shield, CreditCard, Users, FileText, Bell, BarChart3, Building2, ArrowRight, Star } from 'lucide-react';

export const metadata = {
    title: 'Condomínio Fácil - Gestão Completa de Condomínios',
    description: 'Sistema completo para gestão de condomínios pequenos e médios. Cobrança, portaria, moradores e finanças em um só lugar.',
    openGraph: {
        title: 'Condomínio Fácil - Gestão Completa de Condomínios',
        description: 'Sistema completo para gestão de condomínios pequenos e médios. Cobrança, portaria, moradores e finanças em um só lugar.',
        url: 'https://meucondominiofacil.com',
        siteName: 'Condomínio Fácil',
        type: 'website',
    },
};

const features = [
    {
        icon: CreditCard,
        title: 'Cobrança Automática',
        description: 'Gere boletos e PIX automaticamente. Receba pagamentos via Mercado Pago.'
    },
    {
        icon: Users,
        title: 'Gestão de Moradores',
        description: 'Cadastre unidades, moradores e inquilinos. Controle de acesso completo.'
    },
    {
        icon: FileText,
        title: 'Ocorrências',
        description: 'Moradores abrem chamados. Síndico acompanha e resolve.'
    },
    {
        icon: Bell,
        title: 'Avisos e Comunicados',
        description: 'Envie avisos para todos ou grupos específicos. Notificações por email.'
    },
    {
        icon: BarChart3,
        title: 'Relatórios Financeiros',
        description: 'Prestação de contas, receitas, despesas e inadimplência.'
    },
    {
        icon: Shield,
        title: 'Portaria Virtual',
        description: 'Controle entrada de visitantes. Histórico completo de visitas.'
    },
];

const plans = [
    {
        name: 'Básico',
        price: '49,90',
        units: 'Até 20 unidades',
        features: ['Financeiro', 'Moradores', 'Avisos', 'Suporte email'],
        popular: false,
    },
    {
        name: 'Profissional',
        price: '99,90',
        units: 'Até 50 unidades',
        features: ['Tudo do Básico', 'Ocorrências', 'Portaria', 'Relatórios', 'Suporte prioritário'],
        popular: true,
    },
    {
        name: 'Empresarial',
        price: '199,90',
        units: 'Ilimitado',
        features: ['Tudo do Profissional', 'Multi-condomínios', 'API', 'Suporte 24/7'],
        popular: false,
    },
];

const faqs = [
    {
        question: 'Como funciona o período de teste?',
        answer: 'Você tem 7 dias grátis para testar todas as funcionalidades. Não pedimos cartão de crédito no cadastro.'
    },
    {
        question: 'Posso cancelar a qualquer momento?',
        answer: 'Sim! Não há fidelidade. Cancele quando quiser pelo próprio sistema.'
    },
    {
        question: 'Como recebo os pagamentos dos moradores?',
        answer: 'Os pagamentos vão direto para sua conta do Mercado Pago. Você pode sacar a qualquer momento.'
    },
    {
        question: 'Preciso instalar algo?',
        answer: 'Não! O sistema é 100% online. Acesse de qualquer dispositivo com internet.'
    },
];

export default function LandingPage() {
    return (
        <div className="min-h-screen bg-white">
            {/* Header */}
            <header className="fixed top-0 left-0 right-0 bg-white/90 backdrop-blur-md z-50 border-b border-gray-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center gap-2">
                            <Building2 className="h-8 w-8 text-emerald-600" />
                            <span className="font-bold text-xl text-gray-900">Condomínio Fácil</span>
                        </div>
                        <div className="hidden md:flex items-center gap-8">
                            <a href="#funcionalidades" className="text-gray-600 hover:text-emerald-600 transition-colors">Funcionalidades</a>
                            <a href="#precos" className="text-gray-600 hover:text-emerald-600 transition-colors">Preços</a>
                            <a href="#faq" className="text-gray-600 hover:text-emerald-600 transition-colors">FAQ</a>
                        </div>
                        <div className="flex items-center gap-4">
                            <Link href="/login" className="text-gray-600 hover:text-emerald-600 transition-colors">
                                Entrar
                            </Link>
                            <Link
                                href="/register"
                                className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors font-medium"
                            >
                                Começar Grátis
                            </Link>
                        </div>
                    </div>
                </div>
            </header>

            {/* Hero */}
            <section className="pt-32 pb-20 bg-gradient-to-br from-emerald-50 via-white to-blue-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center max-w-4xl mx-auto">
                        <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
                            Gestão completa do seu condomínio
                            <span className="text-emerald-600"> em um só lugar</span>
                        </h1>
                        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
                            Cobrança automática, portaria, moradores e finanças.
                            Tudo que você precisa para administrar seu condomínio de forma simples e profissional.
                        </p>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                            <Link
                                href="/register"
                                className="bg-emerald-600 text-white px-8 py-4 rounded-xl hover:bg-emerald-700 transition-all font-semibold text-lg flex items-center gap-2 shadow-lg shadow-emerald-200"
                            >
                                Começar Grátis <ArrowRight className="h-5 w-5" />
                            </Link>
                            <a
                                href="#funcionalidades"
                                className="text-gray-600 hover:text-emerald-600 transition-colors font-medium"
                            >
                                Ver funcionalidades →
                            </a>
                        </div>
                        <p className="mt-4 text-sm text-gray-500">
                            ✓ 7 dias grátis  ✓ Sem cartão de crédito  ✓ Cancele quando quiser
                        </p>
                    </div>
                </div>
            </section>

            {/* Features */}
            <section id="funcionalidades" className="py-20 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold text-gray-900 mb-4">
                            Tudo que seu condomínio precisa
                        </h2>
                        <p className="text-gray-600 max-w-2xl mx-auto">
                            Funcionalidades completas para simplificar a administração do seu condomínio
                        </p>
                    </div>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {features.map((feature, index) => (
                            <div
                                key={index}
                                className="bg-gray-50 rounded-2xl p-6 hover:bg-emerald-50 transition-colors group"
                            >
                                <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center mb-4 group-hover:bg-emerald-200 transition-colors">
                                    <feature.icon className="h-6 w-6 text-emerald-600" />
                                </div>
                                <h3 className="text-xl font-semibold text-gray-900 mb-2">{feature.title}</h3>
                                <p className="text-gray-600">{feature.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Pricing */}
            <section id="precos" className="py-20 bg-gray-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold text-gray-900 mb-4">
                            Planos que cabem no seu bolso
                        </h2>
                        <p className="text-gray-600">
                            Escolha o plano ideal para o tamanho do seu condomínio
                        </p>
                    </div>
                    <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                        {plans.map((plan, index) => (
                            <div
                                key={index}
                                className={`bg-white rounded-2xl p-8 relative ${plan.popular
                                        ? 'ring-2 ring-emerald-600 shadow-xl shadow-emerald-100'
                                        : 'border border-gray-200'
                                    }`}
                            >
                                {plan.popular && (
                                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-emerald-600 text-white px-4 py-1 rounded-full text-sm font-medium">
                                        Mais popular
                                    </div>
                                )}
                                <h3 className="text-xl font-semibold text-gray-900 mb-2">{plan.name}</h3>
                                <p className="text-gray-500 text-sm mb-4">{plan.units}</p>
                                <div className="mb-6">
                                    <span className="text-4xl font-bold text-gray-900">R$ {plan.price}</span>
                                    <span className="text-gray-500">/mês</span>
                                </div>
                                <ul className="space-y-3 mb-8">
                                    {plan.features.map((feature, fIndex) => (
                                        <li key={fIndex} className="flex items-center gap-2 text-gray-600">
                                            <CheckCircle className="h-5 w-5 text-emerald-600" />
                                            {feature}
                                        </li>
                                    ))}
                                </ul>
                                <Link
                                    href={`/register?plan=${plan.name.toLowerCase()}`}
                                    className={`block text-center py-3 rounded-xl font-semibold transition-colors ${plan.popular
                                            ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                                            : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                                        }`}
                                >
                                    Começar agora
                                </Link>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Testimonials */}
            <section className="py-20 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold text-gray-900 mb-4">
                            O que nossos clientes dizem
                        </h2>
                    </div>
                    <div className="grid md:grid-cols-3 gap-8">
                        {[
                            { name: 'Carlos Silva', role: 'Síndico - Ed. Solar', text: 'Reduzi meu trabalho pela metade. Agora os moradores pagam em dia!' },
                            { name: 'Maria Santos', role: 'Síndica - Cond. Verde', text: 'Sistema fácil de usar. Até os moradores mais velhos conseguem acessar.' },
                            { name: 'João Oliveira', role: 'Síndico - Res. Park', text: 'O suporte é excelente. Sempre me ajudam quando preciso.' },
                        ].map((testimonial, index) => (
                            <div key={index} className="bg-gray-50 rounded-2xl p-6">
                                <div className="flex items-center gap-1 mb-4">
                                    {[1, 2, 3, 4, 5].map(star => (
                                        <Star key={star} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                                    ))}
                                </div>
                                <p className="text-gray-600 mb-4">"{testimonial.text}"</p>
                                <div>
                                    <p className="font-semibold text-gray-900">{testimonial.name}</p>
                                    <p className="text-sm text-gray-500">{testimonial.role}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* FAQ */}
            <section id="faq" className="py-20 bg-gray-50">
                <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold text-gray-900 mb-4">
                            Perguntas Frequentes
                        </h2>
                    </div>
                    <div className="space-y-4">
                        {faqs.map((faq, index) => (
                            <div key={index} className="bg-white rounded-xl p-6">
                                <h3 className="font-semibold text-gray-900 mb-2">{faq.question}</h3>
                                <p className="text-gray-600">{faq.answer}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="py-20 bg-emerald-600">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <h2 className="text-3xl font-bold text-white mb-4">
                        Pronto para simplificar a gestão do seu condomínio?
                    </h2>
                    <p className="text-emerald-100 mb-8 text-lg">
                        Comece hoje mesmo e veja a diferença em 7 dias grátis.
                    </p>
                    <Link
                        href="/register"
                        className="inline-flex items-center gap-2 bg-white text-emerald-600 px-8 py-4 rounded-xl font-semibold text-lg hover:bg-gray-100 transition-colors"
                    >
                        Começar Grátis <ArrowRight className="h-5 w-5" />
                    </Link>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-gray-900 text-gray-400 py-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid md:grid-cols-4 gap-8">
                        <div>
                            <div className="flex items-center gap-2 mb-4">
                                <Building2 className="h-8 w-8 text-emerald-500" />
                                <span className="font-bold text-xl text-white">Condomínio Fácil</span>
                            </div>
                            <p className="text-sm">
                                Sistema completo para gestão de condomínios.
                            </p>
                        </div>
                        <div>
                            <h4 className="font-semibold text-white mb-4">Produto</h4>
                            <ul className="space-y-2 text-sm">
                                <li><a href="#funcionalidades" className="hover:text-white">Funcionalidades</a></li>
                                <li><a href="#precos" className="hover:text-white">Preços</a></li>
                                <li><a href="#faq" className="hover:text-white">FAQ</a></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-semibold text-white mb-4">Legal</h4>
                            <ul className="space-y-2 text-sm">
                                <li><Link href="/termos" className="hover:text-white">Termos de Uso</Link></li>
                                <li><Link href="/privacidade" className="hover:text-white">Privacidade</Link></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-semibold text-white mb-4">Contato</h4>
                            <ul className="space-y-2 text-sm">
                                <li>contato@meucondominiofacil.com</li>
                            </ul>
                        </div>
                    </div>
                    <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm">
                        © {new Date().getFullYear()} Condomínio Fácil. Todos os direitos reservados.
                    </div>
                </div>
            </footer>
        </div>
    );
}
