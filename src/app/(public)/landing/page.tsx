import Link from 'next/link';
import Image from 'next/image';
import {
    CheckCircle, Shield, CreditCard, Users, FileText, Bell, BarChart3, Building2,
    ArrowRight, Star, Clock, TrendingUp, Phone, Mail, Lock, Check, X,
    Calendar, Package, Camera, Zap, MessageSquare, Smartphone, Vote, Wrench
} from 'lucide-react';

export const metadata = {
    title: 'Meu Condomínio Fácil - Gestão Completa de Condomínios | Sistema Online',
    description: 'Sistema completo para gestão de condomínios. PIX com QR Code, WhatsApp automático, portaria virtual, reservas, encomendas, câmeras e muito mais. Teste grátis por 7 dias.',
    keywords: 'gestão de condomínio, software para condomínio, sistema para síndico, cobrança automática, boleto condomínio, portaria virtual, pix qr code, whatsapp condomínio',
    openGraph: {
        title: 'Meu Condomínio Fácil - Gestão Completa de Condomínios',
        description: 'Sistema completo para gestão de condomínios. PIX com QR Code, WhatsApp, controle financeiro, portaria e muito mais.',
        url: 'https://meucondominiofacil.com',
        siteName: 'Meu Condomínio Fácil',
        type: 'website',
        images: ['/logo.png'],
    },
    twitter: {
        card: 'summary_large_image',
        title: 'Meu Condomínio Fácil - Sistema de Gestão para Condomínios',
        description: 'Simplifique a administração do seu condomínio. Teste grátis por 7 dias.',
    }
};

const detailedFeatures = [
    {
        icon: BarChart3,
        title: 'Dashboard Intuitivo',
        description: 'Visualize todas as métricas importantes do seu condomínio em tempo real.',
        screenshot: '/screenshots/dashboard.png',
        benefits: [
            'Visão geral de inadimplência',
            'Saldo financeiro atualizado',
            'Ocupação de unidades',
            'Alertas importantes'
        ]
    },
    {
        icon: CreditCard,
        title: 'Gestão Financeira Completa',
        description: 'Controle receitas, despesas e inadimplência com facilidade.',
        screenshot: '/screenshots/financeiro.png',
        benefits: [
            'Lançamentos categorizados',
            'Controle de inadimplência',
            'Prestação de contas automática',
            'Relatórios financeiros'
        ]
    },
    {
        icon: Zap,
        title: 'PIX Dinâmico + QR Code',
        description: 'Gere cobranças instantâneas com QR Code que o morador paga na hora.',
        screenshot: '/screenshots/pix-qr.png',
        benefits: [
            'QR Code gerado automaticamente',
            'Confirmação em tempo real',
            'Integração Mercado Pago',
            'Reconciliação automática'
        ],
        isNew: true
    },
    {
        icon: MessageSquare,
        title: 'WhatsApp Automático',
        description: 'Envie notificações de cobrança e avisos direto no WhatsApp do morador.',
        screenshot: '/screenshots/whatsapp.png',
        benefits: [
            'Notificação de novas cobranças',
            'Lembrete de vencimento',
            'Confirmação de pagamento',
            'Avisos do condomínio'
        ],
        isNew: true
    },
    {
        icon: Shield,
        title: 'Portaria Virtual Profissional',
        description: 'Registre visitantes, prestadores e entregas com captura de foto.',
        screenshot: '/screenshots/portaria.png',
        benefits: [
            'Modo tela cheia para porteiros',
            'Captura de foto via webcam',
            'Impressão de crachá',
            'Busca por CPF, placa ou nome'
        ]
    },
    {
        icon: Package,
        title: 'Gestão de Encomendas',
        description: 'Controle chegada e retirada de pacotes com notificação automática.',
        screenshot: '/screenshots/encomendas.png',
        benefits: [
            'Foto da encomenda na chegada',
            'WhatsApp/Email para morador',
            'Confirmação de retirada',
            'Histórico completo'
        ],
        isNew: true
    },
    {
        icon: Calendar,
        title: 'Reservas de Áreas Comuns',
        description: 'Moradores reservam salão, churrasqueira e piscina pelo sistema.',
        screenshot: '/screenshots/reservas.png',
        benefits: [
            'Calendário interativo',
            'Aprovação do síndico',
            'Taxa opcional por reserva',
            'Bloqueio de conflitos'
        ]
    },
    {
        icon: FileText,
        title: 'Controle de Ocorrências',
        description: 'Moradores abrem chamados e você acompanha a resolução.',
        screenshot: '/screenshots/ocorrencias.png',
        benefits: [
            'Abertura por moradores',
            'Priorização de demandas',
            'Acompanhamento de status',
            'Histórico de resoluções'
        ]
    },
    {
        icon: Camera,
        title: 'Monitoramento de Câmeras',
        description: 'Visualize câmeras do condomínio em tempo real pelo navegador.',
        screenshot: '/screenshots/cameras.png',
        benefits: [
            'Stream ao vivo RTSP/HLS',
            'Captura de snapshot',
            'Status online/offline',
            'Acesso seguro por RLS'
        ],
        isNew: true
    },
    {
        icon: Vote,
        title: 'Governança Digital',
        description: 'Modernize a gestão democrática do condomínio com três módulos integrados: Enquetes para consultas rápidas, Assembleias com ata digital e Documentos centralizados.',
        screenshot: '/screenshots/governanca.png',
        benefits: [
            'Enquetes - Votações online com resultados em tempo real',
            'Assembleias - Pautas, votações e atas digitais',
            'Documentos - Repositório centralizado e organizado',
            'Transparência e participação democrática'
        ],
        isNew: true
    },
    {
        icon: Wrench,
        title: 'Gestão de Manutenção',
        description: 'Gerencie manutenções preventivas e corretivas do condomínio.',
        screenshot: '/screenshots/manutencao.png',
        benefits: [
            'Agendamento de serviços',
            'Controle de fornecedores',
            'Histórico de manutenções',
            'Notificações automáticas'
        ],
        isNew: true
    },
    {
        icon: Zap,
        title: 'Automações de Inadimplência',
        description: 'Configure regras automáticas para cobrar em atraso.',
        screenshot: '/screenshots/automacoes.png',
        benefits: [
            'Lembrete após X dias',
            'Multa automática',
            'Cobrança via gateway',
            'Relatório mensal'
        ],
        isNew: true
    },
    {
        icon: BarChart3,
        title: 'Relatórios Profissionais',
        description: 'Exporte PDFs e planilhas Excel para prestação de contas.',
        screenshot: '/screenshots/relatorios.png',
        benefits: [
            'PDF com logo do condomínio',
            'Excel formatado',
            'Filtro por período',
            'Comparativo mensal'
        ]
    },
];


const plans = [
    {
        name: 'Básico',
        price: '99,90',
        units: 'Até 20 unidades',
        tagline: 'Comece sua gestão digital',
        features: [
            'Gestão financeira completa',
            'Cadastro de moradores',
            'Avisos e comunicados',
            'Boletos e PIX',
            'App mobile (PWA)',
        ],
        notIncluded: ['Portaria', 'Ocorrências', 'Assembleias', 'Câmeras', 'Enquetes'],
        popular: false,
    },
    {
        name: 'Profissional',
        price: '249,90',
        units: 'Até 50 unidades',
        tagline: 'Gestão profissional completa',
        badge: 'Mais Vendido',
        savings: 'Economize 5 horas/mês',
        features: [
            'Tudo do Básico +',
            'Portaria virtual profissional',
            'Gestão de encomendas',
            'Reserva de áreas comuns',
            'Registro de ocorrências',
            'WhatsApp automático',
            'Relatórios PDF/Excel',
            'Suporte prioritário',
        ],
        notIncluded: ['Câmeras', 'Governança', 'Automações'],
        popular: true,
        highlight: 'Escolha de 80% dos síndicos profissionais'
    },
    {
        name: 'Premium',
        price: '399,90',
        units: 'Unidades ilimitadas',
        tagline: 'Tecnologia e segurança avançada',
        features: [
            'Tudo do Profissional +',
            'Câmeras de segurança ao vivo',
            'Governança digital completa',
            'Enquetes e assembleias online',
            'Automações de inadimplência',
            'Múltiplos condomínios',
            'Gestão de manutenção',
            'Suporte via WhatsApp direto',
        ],
        notIncluded: [],
        popular: false,
        highlight: 'Veja seu condomínio de qualquer lugar'
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
        answer: 'Não! O sistema é 100% online. Você pode até instalar como app no celular (PWA).'
    },
    {
        question: 'Os moradores também têm acesso?',
        answer: 'Sim! Cada morador recebe um login para ver suas cobranças, fazer reservas, abrir ocorrências e receber avisos.'
    },
    {
        question: 'Como funciona o WhatsApp automático?',
        answer: 'Com um clique você envia cobranças e avisos direto no WhatsApp do morador. Integramos com Meta Cloud API.'
    },
    {
        question: 'Meus dados estão seguros?',
        answer: 'Absolutamente. Usamos criptografia de ponta a ponta, RLS (Row Level Security) e hospedagem em servidores seguros.'
    },
];

export default function LandingPage() {
    return (
        <div className="min-h-screen bg-white">
            {/* Schema.org JSON-LD */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "SoftwareApplication",
                        "name": "Meu Condomínio Fácil",
                        "applicationCategory": "BusinessApplication",
                        "offers": {
                            "@type": "AggregateOffer",
                            "lowPrice": "49.90",
                            "highPrice": "199.90",
                            "priceCurrency": "BRL"
                        },
                        "description": "Sistema completo para gestão de condomínios com PIX, WhatsApp, portaria e muito mais",
                        "featureList": "PIX QR Code, WhatsApp Automático, Portaria Virtual, Reservas, Encomendas, Câmeras, Governança"
                    })
                }}
            />

            {/* Header */}
            <header className="fixed top-0 left-0 right-0 bg-white/95 backdrop-blur-md z-50 border-b border-gray-100 shadow-sm">
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
                            <Link href="/login" className="text-gray-600 hover:text-emerald-600 transition-colors font-medium">
                                Entrar
                            </Link>
                            <Link
                                href="/register"
                                className="bg-emerald-600 text-white px-5 py-2.5 rounded-lg hover:bg-emerald-700 transition-colors font-semibold shadow-sm"
                            >
                                Teste Grátis
                            </Link>
                        </div>
                    </div>
                </div>
            </header>

            {/* Hero */}
            <section className="pt-32 pb-20 bg-gradient-to-br from-emerald-50 via-white to-blue-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center max-w-4xl mx-auto">
                        <div className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
                            <Clock className="h-4 w-4" />
                            <span>7 dias grátis • Sem cartão de crédito</span>
                        </div>
                        <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
                            Gestão completa do seu condomínio
                            <span className="text-emerald-600 block mt-2">em um só lugar</span>
                        </h1>
                        <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
                            PIX com QR Code, WhatsApp automático, portaria virtual, reservas, encomendas e muito mais.
                            Tudo que você precisa para administrar seu condomínio de forma simples e profissional.
                        </p>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
                            <Link
                                href="/register"
                                className="bg-emerald-600 text-white px-8 py-4 rounded-xl hover:bg-emerald-700 transition-all font-semibold text-lg flex items-center gap-2 shadow-lg shadow-emerald-200 hover:shadow-xl hover:scale-105"
                            >
                                Começar Grátis Agora <ArrowRight className="h-5 w-5" />
                            </Link>
                            <a
                                href="#funcionalidades"
                                className="text-gray-700 bg-white border-2 border-gray-200 px-8 py-4 rounded-xl hover:border-emerald-300 transition-all font-semibold text-lg hover:shadow-md"
                            >
                                Ver Funcionalidades
                            </a>
                        </div>
                        <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-gray-600">
                            <div className="flex items-center gap-2">
                                <CheckCircle className="h-5 w-5 text-emerald-600" />
                                <span>PIX + QR Code</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <CheckCircle className="h-5 w-5 text-emerald-600" />
                                <span>WhatsApp Automático</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <CheckCircle className="h-5 w-5 text-emerald-600" />
                                <span>100% online</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <CheckCircle className="h-5 w-5 text-emerald-600" />
                                <span>App instalável (PWA)</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Trust Badges */}
            <section className="py-12 bg-white border-y border-gray-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-wrap items-center justify-center gap-8 opacity-70">
                        <div className="flex items-center gap-2">
                            <Lock className="h-5 w-5 text-gray-600" />
                            <span className="text-gray-600 font-medium">Dados Criptografados</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <CreditCard className="h-5 w-5 text-gray-600" />
                            <span className="text-gray-600 font-medium">Mercado Pago Integrado</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <MessageSquare className="h-5 w-5 text-gray-600" />
                            <span className="text-gray-600 font-medium">WhatsApp Business</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Smartphone className="h-5 w-5 text-gray-600" />
                            <span className="text-gray-600 font-medium">App PWA</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* Quick Features Grid */}
            <section className="py-16 bg-gray-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-bold text-gray-900 mb-4">
                            +12 Módulos Integrados
                        </h2>
                        <p className="text-gray-600">Tudo que seu condomínio precisa em uma única plataforma</p>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                        {[
                            { icon: BarChart3, name: 'Dashboard', isNew: false },
                            { icon: CreditCard, name: 'Financeiro', isNew: false },
                            { icon: Zap, name: 'PIX QR', isNew: true },
                            { icon: MessageSquare, name: 'WhatsApp', isNew: true },
                            { icon: Shield, name: 'Portaria', isNew: false },
                            { icon: Package, name: 'Encomendas', isNew: true },
                            { icon: Calendar, name: 'Reservas', isNew: false },
                            { icon: FileText, name: 'Ocorrências', isNew: false },
                            { icon: Camera, name: 'Câmeras', isNew: true },
                            { icon: Vote, name: 'Governança', isNew: true },
                            { icon: Zap, name: 'Automações', isNew: true },
                            { icon: BarChart3, name: 'Relatórios', isNew: false },
                        ].map((item, index) => (
                            <div key={index} className="relative bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow text-center">
                                {item.isNew && (
                                    <span className="absolute -top-2 -right-2 bg-orange-500 text-white text-xs px-2 py-0.5 rounded-full font-medium">
                                        NOVO
                                    </span>
                                )}
                                <item.icon className="h-8 w-8 text-emerald-600 mx-auto mb-2" />
                                <span className="text-sm font-medium text-gray-700">{item.name}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Detailed Features */}
            <section id="funcionalidades" className="py-24 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold text-gray-900 mb-4">
                            Funcionalidades Completas
                        </h2>
                        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                            Conheça cada módulo e veja como podemos facilitar sua gestão
                        </p>
                    </div>

                    <div className="space-y-20">
                        {detailedFeatures.map((feature, index) => (
                            <div
                                key={index}
                                className={`flex flex-col ${index % 2 === 0 ? 'lg:flex-row' : 'lg:flex-row-reverse'} gap-12 items-center`}
                            >
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                                            <feature.icon className="h-6 w-6 text-emerald-600" />
                                        </div>
                                        {feature.isNew && (
                                            <span className="bg-orange-500 text-white text-xs px-3 py-1 rounded-full font-medium">
                                                NOVO
                                            </span>
                                        )}
                                    </div>
                                    <h3 className="text-2xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                                    <p className="text-gray-600 mb-5 leading-relaxed">{feature.description}</p>
                                    <ul className="space-y-2">
                                        {feature.benefits.map((benefit, bIndex) => (
                                            <li key={bIndex} className="flex items-center gap-2 text-gray-700">
                                                <CheckCircle className="h-5 w-5 text-emerald-600 flex-shrink-0" />
                                                <span>{benefit}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                                <div className="flex-1">
                                    <div className="relative rounded-2xl overflow-hidden shadow-xl border border-gray-200 bg-gradient-to-br from-gray-50 to-gray-100 aspect-video flex items-center justify-center p-4">
                                        <Image
                                            src={feature.screenshot}
                                            alt={feature.title}
                                            width={800}
                                            height={450}
                                            className="w-full h-full object-contain"
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Pricing */}
            <section id="precos" className="py-24 bg-gray-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold text-gray-900 mb-4">
                            Planos que cabem no seu bolso
                        </h2>
                        <p className="text-xl text-gray-600">
                            Escolha o plano ideal para o tamanho do seu condomínio
                        </p>
                        <p className="text-sm text-emerald-600 font-medium mt-2">
                            Todos os planos incluem 7 dias grátis para teste
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto mb-16">
                        {plans.map((plan, index) => (
                            <div
                                key={index}
                                className={`bg-white rounded-2xl p-8 relative ${plan.popular
                                    ? 'ring-2 ring-emerald-600 shadow-2xl shadow-emerald-100 scale-105'
                                    : 'border border-gray-200 shadow-lg'
                                    }`}
                            >
                                {plan.popular && (
                                    <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-emerald-600 text-white px-6 py-1.5 rounded-full text-sm font-semibold shadow-lg">
                                        {plan.badge || 'Mais Popular'}
                                    </div>
                                )}
                                <h3 className="text-2xl font-bold text-gray-900 mb-1">{plan.name}</h3>
                                {plan.tagline && (
                                    <p className="text-emerald-600 text-sm font-medium mb-3">{plan.tagline}</p>
                                )}
                                <p className="text-gray-500 text-sm mb-4">{plan.units}</p>
                                {plan.savings && (
                                    <div className="inline-block bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-xs font-semibold mb-3">
                                        ⏱️ {plan.savings}
                                    </div>
                                )}
                                <div className="mb-6">
                                    <span className="text-5xl font-bold text-gray-900">R$ {plan.price}</span>
                                    <span className="text-gray-500 text-lg">/mês</span>
                                </div>
                                <ul className="space-y-3 mb-6">
                                    {plan.features.map((feature, fIndex) => (
                                        <li key={fIndex} className="flex items-start gap-3 text-gray-700">
                                            <Check className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                                            <span>{feature}</span>
                                        </li>
                                    ))}
                                    {plan.notIncluded.map((feature, fIndex) => (
                                        <li key={`not-${fIndex}`} className="flex items-start gap-3 text-gray-400">
                                            <X className="h-5 w-5 text-gray-300 flex-shrink-0 mt-0.5" />
                                            <span>{feature}</span>
                                        </li>
                                    ))}
                                </ul>
                                {plan.highlight && (
                                    <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                                        <p className="text-sm text-emerald-800 font-medium text-center">
                                            ⭐ {plan.highlight}
                                        </p>
                                    </div>
                                )}
                                <Link
                                    href={`/register?plan=${plan.name.toLowerCase()}`}
                                    className={`block text-center py-4 rounded-xl font-semibold transition-all ${plan.popular
                                        ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg hover:shadow-xl'
                                        : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                                        }`}
                                >
                                    Começar Teste Grátis
                                </Link>
                            </div>
                        ))}
                    </div>

                    {/* Plan Comparison Table */}
                    <div className="max-w-5xl mx-auto">
                        <h3 className="text-2xl font-bold text-center mb-8">Comparativo Completo</h3>
                        <div className="overflow-x-auto">
                            <table className="w-full bg-white rounded-xl border border-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Funcionalidade</th>
                                        <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">Básico</th>
                                        <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900 bg-emerald-50">Profissional</th>
                                        <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">Premium</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {[
                                        { name: 'Dashboard Completo', basic: true, pro: true, adv: true },
                                        { name: 'Gestão Financeira', basic: true, pro: true, adv: true },
                                        { name: 'Cadastro de Moradores', basic: true, pro: true, adv: true },
                                        { name: 'Cadastro de Unidades', basic: true, pro: true, adv: true },
                                        { name: 'Avisos e Comunicados', basic: true, pro: true, adv: true },
                                        { name: 'Geração de Boletos/PIX', basic: true, pro: true, adv: true },
                                        { name: 'App Mobile (PWA)', basic: true, pro: true, adv: true },
                                        { name: 'Portaria Virtual', basic: false, pro: true, adv: true },
                                        { name: 'Gestão de Encomendas', basic: false, pro: true, adv: true },
                                        { name: 'Reservas de Áreas Comuns', basic: false, pro: true, adv: true },
                                        { name: 'Controle de Ocorrências', basic: false, pro: true, adv: true },
                                        { name: 'Notificações WhatsApp', basic: false, pro: true, adv: true },
                                        { name: 'Relatórios PDF/Excel', basic: false, pro: true, adv: true },
                                        { name: 'Cobranças Personalizadas', basic: false, pro: true, adv: true },
                                        { name: 'Câmeras de Segurança', basic: false, pro: false, adv: true },
                                        { name: 'Governança Digital', basic: false, pro: false, adv: true },
                                        { name: 'Enquetes e Assembleias', basic: false, pro: false, adv: true },
                                        { name: 'Automações de Inadimplência', basic: false, pro: false, adv: true },
                                        { name: 'Gestão de Manutenção', basic: false, pro: false, adv: true },
                                        { name: 'Múltiplos Condomínios', basic: false, pro: false, adv: true },
                                        { name: 'Suporte WhatsApp Direto', basic: false, pro: false, adv: true },
                                    ].map((row, index) => (
                                        <tr key={index} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 text-sm text-gray-900">{row.name}</td>
                                            <td className="px-6 py-4 text-center">
                                                {row.basic ? <Check className="h-5 w-5 text-emerald-600 mx-auto" /> : <X className="h-5 w-5 text-gray-300 mx-auto" />}
                                            </td>
                                            <td className="px-6 py-4 text-center bg-emerald-50">
                                                {row.pro ? <Check className="h-5 w-5 text-emerald-600 mx-auto" /> : <X className="h-5 w-5 text-gray-300 mx-auto" />}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                {row.adv ? <Check className="h-5 w-5 text-emerald-600 mx-auto" /> : <X className="h-5 w-5 text-gray-300 mx-auto" />}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </section>

            {/* Testimonials */}
            <section className="py-24 bg-gradient-to-br from-emerald-50 to-blue-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold text-gray-900 mb-4">
                            O que nossos clientes dizem
                        </h2>
                        <p className="text-xl text-gray-600">
                            Síndicos reais usando o Condomínio Fácil no dia a dia
                        </p>
                    </div>
                    <div className="grid md:grid-cols-3 gap-8">
                        {[
                            { name: 'Carlos Silva', role: 'Síndico - Ed. Solar', text: 'O PIX com QR Code foi um divisor de águas! Agora os moradores pagam na hora e eu recebo confirmação automática.' },
                            { name: 'Maria Santos', role: 'Síndica - Cond. Verde', text: 'Adoro a gestão de encomendas. O porteiro registra e o morador recebe WhatsApp na hora. Zero pacotes perdidos!' },
                            { name: 'João Oliveira', role: 'Síndico - Res. Park', text: 'As reservas online acabaram com os conflitos. Moradores reservam pelo celular e o sistema bloqueia automaticamente.' },
                        ].map((testimonial, index) => (
                            <div key={index} className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow">
                                <div className="flex items-center gap-1 mb-4">
                                    {[1, 2, 3, 4, 5].map(star => (
                                        <Star key={star} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                                    ))}
                                </div>
                                <p className="text-gray-700 mb-6 leading-relaxed italic">"{testimonial.text}"</p>
                                <div>
                                    <p className="font-bold text-gray-900">{testimonial.name}</p>
                                    <p className="text-sm text-gray-500">{testimonial.role}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* FAQ */}
            <section id="faq" className="py-24 bg-white">
                <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold text-gray-900 mb-4">
                            Perguntas Frequentes
                        </h2>
                        <p className="text-xl text-gray-600">
                            Tire suas dúvidas antes de começar
                        </p>
                    </div>
                    <div className="space-y-6">
                        {faqs.map((faq, index) => (
                            <div key={index} className="bg-gray-50 rounded-xl p-6 hover:bg-emerald-50 transition-colors">
                                <h3 className="font-bold text-lg text-gray-900 mb-3">{faq.question}</h3>
                                <p className="text-gray-700 leading-relaxed">{faq.answer}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Final CTA */}
            <section className="py-24 bg-gradient-to-br from-emerald-600 to-emerald-700">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                        Pronto para modernizar seu condomínio?
                    </h2>
                    <p className="text-emerald-100 mb-8 text-xl leading-relaxed">
                        PIX com QR Code, WhatsApp automático, portaria virtual e muito mais.
                        <br />7 dias grátis para testar todas as funcionalidades.
                    </p>
                    <Link
                        href="/register"
                        className="inline-flex items-center gap-2 bg-white text-emerald-600 px-10 py-5 rounded-xl font-bold text-lg hover:bg-gray-100 transition-all shadow-xl hover:shadow-2xl hover:scale-105"
                    >
                        Começar Teste Grátis Agora <ArrowRight className="h-6 w-6" />
                    </Link>
                    <p className="text-emerald-100 text-sm mt-6">
                        Junte-se a centenas de síndicos que já simplificaram sua rotina
                    </p>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-gray-900 text-gray-400 py-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid md:grid-cols-4 gap-12 mb-8">
                        <div>
                            <div className="flex items-center gap-2 mb-4">
                                <Building2 className="h-8 w-8 text-emerald-500" />
                                <span className="font-bold text-xl text-white">Condomínio Fácil</span>
                            </div>
                            <p className="text-sm leading-relaxed">
                                Sistema completo para gestão de condomínios pequenos e médios com PIX, WhatsApp e muito mais.
                            </p>
                        </div>
                        <div>
                            <h4 className="font-semibold text-white mb-4">Produto</h4>
                            <ul className="space-y-3 text-sm">
                                <li><a href="#funcionalidades" className="hover:text-white transition-colors">Funcionalidades</a></li>
                                <li><a href="#precos" className="hover:text-white transition-colors">Preços</a></li>
                                <li><a href="#faq" className="hover:text-white transition-colors">FAQ</a></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-semibold text-white mb-4">Legal</h4>
                            <ul className="space-y-3 text-sm">
                                <li><Link href="/termos" className="hover:text-white transition-colors">Termos de Uso</Link></li>
                                <li><Link href="/privacidade" className="hover:text-white transition-colors">Privacidade</Link></li>
                                <li><Link href="/contrato" className="hover:text-white transition-colors">Contrato</Link></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-semibold text-white mb-4">Contato</h4>
                            <ul className="space-y-3 text-sm">
                                <li className="flex items-center gap-2">
                                    <Mail className="h-4 w-4" />
                                    <a href="mailto:contato@meucondominiofacil.com" className="hover:text-white transition-colors">
                                        contato@meucondominiofacil.com
                                    </a>
                                </li>
                            </ul>
                        </div>
                    </div>
                    <div className="border-t border-gray-800 pt-8 text-center text-sm">
                        <p>© {new Date().getFullYear()} Meu Condomínio Fácil. Todos os direitos reservados.</p>
                    </div>
                </div>
            </footer>

            {/* Schema.org FAQPage */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "FAQPage",
                        "mainEntity": faqs.map(faq => ({
                            "@type": "Question",
                            "name": faq.question,
                            "acceptedAnswer": {
                                "@type": "Answer",
                                "text": faq.answer
                            }
                        }))
                    })
                }}
            />
        </div>
    );
}
