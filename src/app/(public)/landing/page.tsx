import Link from 'next/link';
import Image from 'next/image';
import {
    CheckCircle, Shield, CreditCard, Users, FileText, Bell, BarChart3, Building2,
    ArrowRight, Star, Clock, TrendingUp, Phone, Mail, Lock, Check, X,
    Calendar, Package, Camera, Zap, MessageSquare, Smartphone, Vote, Wrench, Settings
} from 'lucide-react';

export const metadata = {
    title: 'Meu Condomínio Fácil - Gestão Completa de Condomínios | Sistema Online',
    description: 'Sistema 100% web para gestão de condomínios. Financeiro, moradores, portaria, reservas e muito mais. Integrações bancárias e WhatsApp disponíveis mediante implantação. Teste grátis 7 dias.',
    keywords: 'gestão de condomínio, software para condomínio, sistema para síndico, sistema web condomínio, portaria virtual',
    openGraph: {
        title: 'Meu Condomínio Fácil - Gestão Completa de Condomínios',
        description: 'Sistema 100% web para gestão de condomínios. Controle financeiro, portaria e muito mais.',
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
        title: 'Gestão Financeira',
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
        title: 'Cobranças com PIX/Boleto',
        description: 'Gere cobranças para moradores. Integração bancária disponível mediante implantação.',
        screenshot: '/screenshots/pix-qr.png',
        benefits: [
            'Cadastro de cobranças manuais',
            '⚙️ PIX dinâmico + QR Code *',
            '⚙️ Boleto automático *',
            '⚙️ Conciliação automática *'
        ],
        hasImplantation: true,
        implantationNote: '* Requer contratação do serviço de Integração Bancária'
    },
    {
        icon: MessageSquare,
        title: 'Notificações WhatsApp',
        description: 'Envie notificações de cobrança e avisos direto no WhatsApp do morador.',
        screenshot: '/screenshots/whatsapp.png',
        benefits: [
            '⚙️ Notificação de novas cobranças *',
            '⚙️ Lembrete de vencimento *',
            '⚙️ Confirmação de pagamento *',
            '⚙️ Avisos do condomínio *'
        ],
        hasImplantation: true,
        implantationNote: '* Requer contratação do serviço de Integração WhatsApp'
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
        description: 'Controle chegada e retirada de pacotes com registro completo.',
        screenshot: '/screenshots/encomendas.png',
        benefits: [
            'Foto da encomenda na chegada',
            'Registro de código e remetente',
            'Confirmação de retirada',
            '⚙️ Notificação WhatsApp/Email *'
        ],
        hasImplantation: true,
        implantationNote: '* Notificação automática requer Integração WhatsApp'
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
        description: 'Modernize a gestão democrática do condomínio com enquetes, assembleias e documentos.',
        screenshot: '/screenshots/governanca.png',
        benefits: [
            'Enquetes - Votações online',
            'Assembleias - Pautas e atas digitais',
            'Documentos - Repositório centralizado',
            'Transparência e participação'
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
            'Gestão financeira (manual)',
            'Cadastro de moradores',
            'Avisos e comunicados',
            'Cadastro de cobranças',
            'Acesso pelo navegador (PWA)',
        ],
        notIncluded: ['Portaria', 'Ocorrências', 'Reservas', 'Relatórios', 'Integrações'],
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
            'Relatórios PDF/Excel',
            'Suporte prioritário',
            '⚙️ Pode contratar integrações',
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
            'Suporte via WhatsApp direto',
            '⚙️ Pode contratar integrações',
        ],
        notIncluded: [],
        popular: false,
        highlight: 'Veja seu condomínio de qualquer lugar'
    },
];

const faqs = [
    {
        question: 'Tem aplicativo para celular (Android/iOS)?',
        answer: 'Não temos aplicativo nativo nas lojas (Play Store/App Store). O Condomínio Fácil é um sistema 100% WEB que funciona perfeitamente no navegador do celular. Você pode "instalar" como PWA - fica com ícone na tela inicial, funciona offline e parece um app. A vantagem é que não precisa baixar nada!'
    },
    {
        question: 'O WhatsApp automático já vem incluso no plano?',
        answer: 'Não. A integração com WhatsApp para envio automático de mensagens é um SERVIÇO DE IMPLANTAÇÃO contratado separadamente. Requer taxa de implantação (R$ 697) + mensalidade de infraestrutura (R$ 149/mês). Também exige um chip exclusivo do condomínio. Disponível para planos Profissional e Premium.'
    },
    {
        question: 'O PIX dinâmico e boleto automático estão inclusos?',
        answer: 'Não automaticamente. O sistema permite cadastrar cobranças manualmente. Para gerar PIX dinâmico com QR Code e boletos automáticos com conciliação, é necessário contratar o SERVIÇO DE INTEGRAÇÃO BANCÁRIA. Taxa de implantação: R$ 999 + mensalidade: R$ 199/mês. Requer conta ativa no banco/gateway.'
    },
    {
        question: 'Como funciona o período de teste?',
        answer: 'Você tem 7 dias grátis para testar todas as funcionalidades do plano escolhido. Não pedimos cartão de crédito no cadastro. O sistema WEB (gestão financeira, moradores, portaria, reservas) está 100% pronto e funcionando.'
    },
    {
        question: 'Posso cancelar a qualquer momento?',
        answer: 'Sim! Não há fidelidade. Cancele quando quiser pelo próprio sistema. Os serviços de implantação (WhatsApp e Bancário) têm regras específicas detalhadas no contrato de cada serviço.'
    },
    {
        question: 'O que preciso para ter a integração bancária?',
        answer: 'Você precisa: 1) CNPJ ativo do condomínio, 2) Conta no banco ou gateway desejado (Mercado Pago, Asaas, etc.), 3) Credenciais de API fornecidas pelo banco, 4) Documento comprovando que você é o síndico. Nós fazemos toda a configuração técnica.'
    },
    {
        question: 'O que preciso para ter o WhatsApp automático?',
        answer: 'Você precisa: 1) Um chip de celular EXCLUSIVO para o condomínio, 2) Disponibilidade para escanear QR Code via videochamada, 3) Compreensão dos riscos de banimento pelo WhatsApp. Nós configuramos o servidor e fazemos a manutenção.'
    },
    {
        question: 'Meus dados estão seguros?',
        answer: 'Absolutamente. Usamos criptografia de ponta a ponta, RLS (Row Level Security) para isolamento de dados, e hospedagem em servidores seguros. Estamos em conformidade com a LGPD.'
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
                        "operatingSystem": "Web Browser",
                        "offers": {
                            "@type": "AggregateOffer",
                            "lowPrice": "99.90",
                            "highPrice": "399.90",
                            "priceCurrency": "BRL"
                        },
                        "description": "Sistema web para gestão de condomínios com financeiro, portaria, reservas e mais",
                        "provider": {
                            "@type": "Organization",
                            "name": "Meu Condomínio Fácil",
                            "taxID": "57.444.727/0001-85"
                        }
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
                            <a href="#implantacoes" className="text-gray-600 hover:text-emerald-600 transition-colors">Implantações</a>
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
                            <span className="text-emerald-600 block mt-2">100% online</span>
                        </h1>
                        <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
                            Sistema web para gestão de condomínios pequenos e médios. Financeiro, moradores,
                            portaria, reservas, ocorrências e muito mais. Acesse de qualquer navegador.
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
                                <span>Sistema 100% Web</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <CheckCircle className="h-5 w-5 text-emerald-600" />
                                <span>Sem instalação</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <CheckCircle className="h-5 w-5 text-emerald-600" />
                                <span>Funciona no celular (PWA)</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <CheckCircle className="h-5 w-5 text-emerald-600" />
                                <span>Dados seguros</span>
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
                            <Shield className="h-5 w-5 text-gray-600" />
                            <span className="text-gray-600 font-medium">LGPD Compliant</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Smartphone className="h-5 w-5 text-gray-600" />
                            <span className="text-gray-600 font-medium">Acesso PWA</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <BarChart3 className="h-5 w-5 text-gray-600" />
                            <span className="text-gray-600 font-medium">Relatórios PDF/Excel</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* Quick Features Grid */}
            <section className="py-16 bg-gray-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-bold text-gray-900 mb-4">
                            Módulos do Sistema
                        </h2>
                        <p className="text-gray-600">Tudo que seu condomínio precisa em uma única plataforma web</p>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                        {[
                            { icon: BarChart3, name: 'Dashboard', included: true },
                            { icon: CreditCard, name: 'Financeiro', included: true },
                            { icon: Users, name: 'Moradores', included: true },
                            { icon: Building2, name: 'Unidades', included: true },
                            { icon: Bell, name: 'Avisos', included: true },
                            { icon: Shield, name: 'Portaria', included: true },
                            { icon: Package, name: 'Encomendas', included: true },
                            { icon: Calendar, name: 'Reservas', included: true },
                            { icon: FileText, name: 'Ocorrências', included: true },
                            { icon: Camera, name: 'Câmeras', included: true, isNew: true },
                            { icon: Vote, name: 'Governança', included: true, isNew: true },
                            { icon: BarChart3, name: 'Relatórios', included: true },
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

            {/* Implantações - NOVA SEÇÃO */}
            <section id="implantacoes" className="py-16 bg-amber-50 border-y border-amber-200">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-12">
                        <div className="inline-flex items-center gap-2 bg-amber-100 text-amber-800 px-4 py-2 rounded-full text-sm font-medium mb-4">
                            <Settings className="h-4 w-4" />
                            <span>Serviços Opcionais</span>
                        </div>
                        <h2 className="text-3xl font-bold text-gray-900 mb-4">
                            Integrações via Implantação
                        </h2>
                        <p className="text-gray-600 max-w-2xl mx-auto">
                            Os serviços abaixo <strong>NÃO estão inclusos</strong> nos planos padrão.
                            São contratados separadamente e requerem configuração técnica pela nossa equipe.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-8">
                        {/* Integração Bancária */}
                        <div className="bg-white rounded-2xl p-8 shadow-lg border border-amber-200">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                                    <CreditCard className="h-6 w-6 text-blue-600" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900">Integração Bancária</h3>
                                    <p className="text-sm text-gray-500">PIX dinâmico + Boleto automático</p>
                                </div>
                            </div>
                            <ul className="space-y-2 text-gray-700 mb-6">
                                <li className="flex items-center gap-2">
                                    <Check className="h-4 w-4 text-emerald-600" />
                                    PIX com QR Code gerado automaticamente
                                </li>
                                <li className="flex items-center gap-2">
                                    <Check className="h-4 w-4 text-emerald-600" />
                                    Boleto registrado
                                </li>
                                <li className="flex items-center gap-2">
                                    <Check className="h-4 w-4 text-emerald-600" />
                                    Conciliação automática de pagamentos
                                </li>
                                <li className="flex items-center gap-2">
                                    <Check className="h-4 w-4 text-emerald-600" />
                                    Mercado Pago, Asaas, bancos tradicionais
                                </li>
                            </ul>
                            <div className="bg-gray-50 rounded-lg p-4 mb-4">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-gray-600">Taxa de Implantação:</span>
                                    <span className="font-bold text-gray-900">R$ 999,00</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600">Mensalidade:</span>
                                    <span className="font-bold text-gray-900">+ R$ 199,00/mês</span>
                                </div>
                            </div>
                            <p className="text-xs text-gray-500">
                                Requer: CNPJ ativo, conta no banco/gateway, credenciais de API, documento do síndico.
                            </p>
                        </div>

                        {/* Integração WhatsApp */}
                        <div className="bg-white rounded-2xl p-8 shadow-lg border border-amber-200">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                                    <MessageSquare className="h-6 w-6 text-green-600" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900">Integração WhatsApp</h3>
                                    <p className="text-sm text-gray-500">Mensagens automáticas</p>
                                </div>
                            </div>
                            <ul className="space-y-2 text-gray-700 mb-6">
                                <li className="flex items-center gap-2">
                                    <Check className="h-4 w-4 text-emerald-600" />
                                    Notificação de cobranças geradas
                                </li>
                                <li className="flex items-center gap-2">
                                    <Check className="h-4 w-4 text-emerald-600" />
                                    Lembrete de vencimento
                                </li>
                                <li className="flex items-center gap-2">
                                    <Check className="h-4 w-4 text-emerald-600" />
                                    Aviso de encomendas
                                </li>
                                <li className="flex items-center gap-2">
                                    <Check className="h-4 w-4 text-emerald-600" />
                                    Servidor dedicado (VPS)
                                </li>
                            </ul>
                            <div className="bg-gray-50 rounded-lg p-4 mb-4">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-gray-600">Taxa de Implantação:</span>
                                    <span className="font-bold text-gray-900">R$ 697,00</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600">Mensalidade:</span>
                                    <span className="font-bold text-gray-900">+ R$ 149,00/mês</span>
                                </div>
                            </div>
                            <p className="text-xs text-gray-500">
                                Requer: Chip exclusivo do condomínio, disponibilidade para escanear QR Code.
                            </p>
                        </div>
                    </div>

                    <p className="text-center text-sm text-amber-800 mt-8 bg-amber-100 py-3 px-6 rounded-lg inline-block mx-auto">
                        ⚠️ Disponível apenas para planos <strong>Profissional</strong> e <strong>Premium</strong>
                    </p>
                </div>
            </section>

            {/* Detailed Features */}
            <section id="funcionalidades" className="py-24 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold text-gray-900 mb-4">
                            Funcionalidades Inclusas
                        </h2>
                        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                            Conheça cada módulo que já vem pronto no sistema
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
                                        {feature.hasImplantation && (
                                            <span className="bg-amber-100 text-amber-800 text-xs px-3 py-1 rounded-full font-medium">
                                                ⚙️ Requer implantação
                                            </span>
                                        )}
                                    </div>
                                    <h3 className="text-2xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                                    <p className="text-gray-600 mb-5 leading-relaxed">{feature.description}</p>
                                    <ul className="space-y-2">
                                        {feature.benefits.map((benefit, bIndex) => (
                                            <li key={bIndex} className={`flex items-center gap-2 ${benefit.startsWith('⚙️') ? 'text-amber-700' : 'text-gray-700'}`}>
                                                <CheckCircle className={`h-5 w-5 flex-shrink-0 ${benefit.startsWith('⚙️') ? 'text-amber-500' : 'text-emerald-600'}`} />
                                                <span>{benefit}</span>
                                            </li>
                                        ))}
                                    </ul>
                                    {feature.implantationNote && (
                                        <p className="text-xs text-amber-600 mt-3 bg-amber-50 p-2 rounded">
                                            {feature.implantationNote}
                                        </p>
                                    )}
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
                                        <li key={fIndex} className={`flex items-start gap-3 ${feature.startsWith('⚙️') ? 'text-amber-700' : 'text-gray-700'}`}>
                                            <Check className={`h-5 w-5 flex-shrink-0 mt-0.5 ${feature.startsWith('⚙️') ? 'text-amber-500' : 'text-emerald-600'}`} />
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
                                        { name: 'Gestão Financeira (manual)', basic: true, pro: true, adv: true },
                                        { name: 'Cadastro de Moradores', basic: true, pro: true, adv: true },
                                        { name: 'Cadastro de Unidades', basic: true, pro: true, adv: true },
                                        { name: 'Avisos e Comunicados', basic: true, pro: true, adv: true },
                                        { name: 'Cadastro de Cobranças', basic: true, pro: true, adv: true },
                                        { name: 'Acesso PWA (navegador)', basic: true, pro: true, adv: true },
                                        { name: 'Portaria Virtual', basic: false, pro: true, adv: true },
                                        { name: 'Gestão de Encomendas', basic: false, pro: true, adv: true },
                                        { name: 'Reservas de Áreas Comuns', basic: false, pro: true, adv: true },
                                        { name: 'Controle de Ocorrências', basic: false, pro: true, adv: true },
                                        { name: 'Relatórios PDF/Excel', basic: false, pro: true, adv: true },
                                        { name: 'Câmeras de Segurança', basic: false, pro: false, adv: true },
                                        { name: 'Governança Digital', basic: false, pro: false, adv: true },
                                        { name: 'Enquetes e Assembleias', basic: false, pro: false, adv: true },
                                        { name: 'Automações', basic: false, pro: false, adv: true },
                                        { name: 'Múltiplos Condomínios', basic: false, pro: false, adv: true },
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
                                    {/* Serviços de Implantação */}
                                    <tr className="bg-amber-50">
                                        <td colSpan={4} className="px-6 py-3 text-sm font-semibold text-amber-800">
                                            ⚙️ Serviços de Implantação (contratados separadamente)
                                        </td>
                                    </tr>
                                    {[
                                        { name: 'Integração Bancária (PIX/Boleto)', basic: false, pro: 'opt', adv: 'opt' },
                                        { name: 'Integração WhatsApp Automático', basic: false, pro: 'opt', adv: 'opt' },
                                    ].map((row, index) => (
                                        <tr key={`impl-${index}`} className="hover:bg-amber-50/50 bg-amber-50/30">
                                            <td className="px-6 py-4 text-sm text-amber-800">{row.name}</td>
                                            <td className="px-6 py-4 text-center">
                                                <X className="h-5 w-5 text-gray-300 mx-auto" />
                                            </td>
                                            <td className="px-6 py-4 text-center bg-emerald-50">
                                                <span className="text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded-full">⚙️ Opcional</span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className="text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded-full">⚙️ Opcional</span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <p className="text-center text-sm text-gray-500 mt-4">
                            ⚙️ = Serviço opcional com taxa de implantação + mensalidade adicional
                        </p>
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
                        Sistema 100% web, pronto para usar. Financeiro, portaria, reservas e mais.
                        <br />7 dias grátis para testar todas as funcionalidades.
                    </p>
                    <Link
                        href="/register"
                        className="inline-flex items-center gap-2 bg-white text-emerald-600 px-10 py-5 rounded-xl font-bold text-lg hover:bg-gray-100 transition-all shadow-xl hover:shadow-2xl hover:scale-105"
                    >
                        Começar Teste Grátis Agora <ArrowRight className="h-6 w-6" />
                    </Link>
                    <p className="text-emerald-100 text-sm mt-6">
                        Sem cartão de crédito • Cancele quando quiser
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
                            <p className="text-sm leading-relaxed mb-2">
                                Sistema web para gestão de condomínios pequenos e médios.
                            </p>
                            <p className="text-xs text-gray-500">
                                CNPJ: 57.444.727/0001-85
                            </p>
                        </div>
                        <div>
                            <h4 className="font-semibold text-white mb-4">Produto</h4>
                            <ul className="space-y-3 text-sm">
                                <li><a href="#funcionalidades" className="hover:text-white transition-colors">Funcionalidades</a></li>
                                <li><a href="#precos" className="hover:text-white transition-colors">Preços</a></li>
                                <li><a href="#implantacoes" className="hover:text-white transition-colors">Integrações</a></li>
                                <li><a href="#faq" className="hover:text-white transition-colors">FAQ</a></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-semibold text-white mb-4">Legal</h4>
                            <ul className="space-y-3 text-sm">
                                <li><Link href="/termos" className="hover:text-white transition-colors">Termos de Uso</Link></li>
                                <li><Link href="/privacidade" className="hover:text-white transition-colors">Política de Privacidade</Link></li>
                                <li><Link href="/contrato" className="hover:text-white transition-colors">Contrato de Prestação</Link></li>
                                <li><Link href="/lgpd" className="hover:text-white transition-colors">LGPD</Link></li>
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
                                <li className="flex items-center gap-2">
                                    <Phone className="h-4 w-4" />
                                    <span>(21) 96553-2247</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                    <div className="border-t border-gray-800 pt-8 text-center text-sm">
                        <p>© {new Date().getFullYear()} Meu Condomínio Fácil. Todos os direitos reservados.</p>
                        <p className="text-xs text-gray-500 mt-2">CNPJ: 57.444.727/0001-85</p>
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
