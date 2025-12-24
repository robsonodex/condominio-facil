import Link from 'next/link';
import {
    CheckCircle, Shield, CreditCard, Users, FileText, Bell, BarChart3, Building2,
    ArrowRight, Star, Calendar, Package, Smartphone, Bot, Wrench, Vote, Camera,
    AlertTriangle, MessageSquare, Zap
} from 'lucide-react';

export const metadata = {
    title: 'Meu Condomínio Fácil - Sistema de Gestão para Condomínios',
    description: 'Plataforma de gestão para condomínios pequenos e médios. Controle financeiro, comunicação e portaria em um único sistema. App móvel incluso. Teste grátis 7 dias.',
    keywords: 'gestão de condomínio, software para condomínio, sistema para síndico',
    openGraph: {
        title: 'Meu Condomínio Fácil - Sistema de Gestão para Condomínios',
        description: 'Plataforma de gestão para condomínios pequenos e médios.',
        url: 'https://meucondominiofacil.com',
        siteName: 'Meu Condomínio Fácil',
        type: 'website',
    }
};

export default function LandingPage() {
    return (
        <div className="min-h-screen bg-white">
            {/* Header */}
            <header className="fixed top-0 left-0 right-0 bg-white/95 backdrop-blur z-50 border-b">
                <div className="max-w-6xl mx-auto px-4 flex items-center justify-between h-16">
                    <div className="flex items-center gap-2">
                        <Building2 className="h-7 w-7 text-emerald-600" />
                        <span className="font-bold text-lg text-gray-900">Meu Condomínio Fácil</span>
                    </div>
                    <div className="hidden md:flex items-center gap-6 text-sm">
                        <a href="#para-quem" className="text-gray-600 hover:text-emerald-600">Para quem</a>
                        <a href="#funcionalidades" className="text-gray-600 hover:text-emerald-600">Funcionalidades</a>
                        <a href="#planos" className="text-gray-600 hover:text-emerald-600">Planos</a>
                        <a href="#faq" className="text-gray-600 hover:text-emerald-600">FAQ</a>
                    </div>
                    <div className="flex items-center gap-3">
                        <Link href="/login" className="text-gray-600 hover:text-emerald-600 font-medium text-sm">
                            Entrar
                        </Link>
                        <Link href="/register" className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 font-medium text-sm">
                            Criar conta gratuita
                        </Link>
                    </div>
                </div>
            </header>

            {/* 1. HEADLINE CLARA - Público e proposta definidos */}
            <section className="pt-28 pb-16 bg-gradient-to-b from-gray-50 to-white">
                <div className="max-w-4xl mx-auto px-4 text-center">
                    <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 leading-tight">
                        Plataforma de gestão para condomínios pequenos e médios
                    </h1>
                    <p className="text-lg text-gray-600 mb-6 max-w-2xl mx-auto">
                        Controle financeiro, comunicação com moradores e gestão de portaria em um único sistema.
                        Web + app móvel para Android e iOS.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-6">
                        <Link
                            href="/register"
                            className="bg-emerald-600 text-white px-6 py-3 rounded-lg hover:bg-emerald-700 font-semibold flex items-center gap-2"
                        >
                            Criar conta para teste gratuito <ArrowRight className="h-4 w-4" />
                        </Link>
                        <span className="text-sm text-gray-500">7 dias grátis · Sem cartão de crédito</span>
                    </div>
                </div>
            </section>

            {/* 2. PARA QUEM É - Público-alvo definido */}
            <section id="para-quem" className="py-12 bg-white border-y">
                <div className="max-w-5xl mx-auto px-4">
                    <h2 className="text-xl font-bold text-gray-900 mb-6 text-center">Para quem é este sistema</h2>
                    <div className="grid md:grid-cols-3 gap-6">
                        <div className="p-5 bg-gray-50 rounded-xl">
                            <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center mb-3">
                                <Users className="h-5 w-5 text-emerald-600" />
                            </div>
                            <h3 className="font-semibold text-gray-900 mb-1">Síndicos moradores</h3>
                            <p className="text-sm text-gray-600">Gerenciam 1 condomínio e precisam de organização sem complexidade.</p>
                        </div>
                        <div className="p-5 bg-gray-50 rounded-xl">
                            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mb-3">
                                <Building2 className="h-5 w-5 text-blue-600" />
                            </div>
                            <h3 className="font-semibold text-gray-900 mb-1">Síndicos profissionais</h3>
                            <p className="text-sm text-gray-600">Gerenciam múltiplos condomínios e precisam de controle centralizado.</p>
                        </div>
                        <div className="p-5 bg-gray-50 rounded-xl">
                            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mb-3">
                                <BarChart3 className="h-5 w-5 text-purple-600" />
                            </div>
                            <h3 className="font-semibold text-gray-900 mb-1">Administradoras</h3>
                            <p className="text-sm text-gray-600">Gerenciam carteira de condomínios com relatórios e integrações.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* 3. PROBLEMAS RESOLVIDOS */}
            <section className="py-12 bg-gray-50">
                <div className="max-w-5xl mx-auto px-4">
                    <h2 className="text-xl font-bold text-gray-900 mb-6 text-center">Problemas que o sistema resolve</h2>
                    <div className="grid md:grid-cols-2 gap-4">
                        {[
                            { icon: AlertTriangle, problem: 'Inadimplência difícil de acompanhar', solution: 'Dashboard com indicadores em tempo real' },
                            { icon: FileText, problem: 'Documentos e informações desorganizados', solution: 'Repositório centralizado e acessível' },
                            { icon: MessageSquare, problem: 'Comunicação fragmentada com moradores', solution: 'Avisos, chat e notificações integrados' },
                            { icon: Package, problem: 'Encomendas perdidas na portaria', solution: 'Registro com foto e notificação automática' },
                            { icon: BarChart3, problem: 'Prestação de contas trabalhosa', solution: 'Relatórios PDF/Excel gerados automaticamente' },
                            { icon: Shield, problem: 'Registro manual de visitantes', solution: 'Portaria digital com histórico completo' },
                        ].map((item, i) => (
                            <div key={i} className="flex gap-4 p-4 bg-white rounded-lg">
                                <item.icon className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-sm text-gray-500 line-through">{item.problem}</p>
                                    <p className="text-sm text-gray-900 font-medium">{item.solution}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* 4. FUNCIONALIDADES AGRUPADAS EM 3 CATEGORIAS */}
            <section id="funcionalidades" className="py-16 bg-white">
                <div className="max-w-5xl mx-auto px-4">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2 text-center">Funcionalidades do sistema</h2>
                    <p className="text-gray-600 text-center mb-10">Organizadas por área de atuação</p>

                    {/* Categoria 1: Operacional */}
                    <div className="mb-10">
                        <h3 className="text-sm font-semibold text-emerald-600 uppercase tracking-wide mb-4">Operacional (dia a dia)</h3>
                        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            {[
                                { icon: Shield, name: 'Portaria', desc: 'Registro de visitantes com foto' },
                                { icon: Package, name: 'Encomendas', desc: 'Controle de entregas' },
                                { icon: Calendar, name: 'Reservas', desc: 'Áreas comuns com aprovação' },
                                { icon: FileText, name: 'Ocorrências', desc: 'Chamados com acompanhamento' },
                            ].map((f, i) => (
                                <div key={i} className="p-4 border rounded-lg hover:border-emerald-300 transition-colors">
                                    <f.icon className="h-6 w-6 text-emerald-600 mb-2" />
                                    <h4 className="font-medium text-gray-900">{f.name}</h4>
                                    <p className="text-xs text-gray-500">{f.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Categoria 2: Administrativa */}
                    <div className="mb-10">
                        <h3 className="text-sm font-semibold text-blue-600 uppercase tracking-wide mb-4">Administrativa (gestão)</h3>
                        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            {[
                                { icon: CreditCard, name: 'Financeiro', desc: 'Receitas, despesas e inadimplência' },
                                { icon: Users, name: 'Moradores', desc: 'Cadastro completo com importação' },
                                { icon: Bell, name: 'Avisos', desc: 'Comunicados com prioridade' },
                                { icon: BarChart3, name: 'Relatórios', desc: 'PDF e Excel para prestação de contas' },
                            ].map((f, i) => (
                                <div key={i} className="p-4 border rounded-lg hover:border-blue-300 transition-colors">
                                    <f.icon className="h-6 w-6 text-blue-600 mb-2" />
                                    <h4 className="font-medium text-gray-900">{f.name}</h4>
                                    <p className="text-xs text-gray-500">{f.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Categoria 3: Avançada */}
                    <div>
                        <h3 className="text-sm font-semibold text-purple-600 uppercase tracking-wide mb-4">Avançada (plano Premium)</h3>
                        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            {[
                                { icon: Camera, name: 'Câmeras', desc: 'Monitoramento ao vivo' },
                                { icon: Vote, name: 'Governança', desc: 'Enquetes e assembleias online' },
                                { icon: Wrench, name: 'Manutenção', desc: 'Ordens de serviço em Kanban' },
                                { icon: Bot, name: 'Assistente IA', desc: 'Chatbot treinado (add-on)' },
                            ].map((f, i) => (
                                <div key={i} className="p-4 border rounded-lg hover:border-purple-300 transition-colors bg-purple-50/30">
                                    <f.icon className="h-6 w-6 text-purple-600 mb-2" />
                                    <h4 className="font-medium text-gray-900">{f.name}</h4>
                                    <p className="text-xs text-gray-500">{f.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* 5. PLANOS COM ORIENTAÇÃO */}
            <section id="planos" className="py-16 bg-gray-50">
                <div className="max-w-5xl mx-auto px-4">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2 text-center">Planos e preços</h2>
                    <p className="text-gray-600 text-center mb-4">Escolha baseado no número de unidades do seu condomínio</p>

                    {/* Orientação de escolha */}
                    <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mb-8 max-w-2xl mx-auto">
                        <p className="text-sm text-blue-800 text-center">
                            <strong>Como escolher:</strong> Até 20 unidades → Básico · Até 50 unidades → Profissional · Mais de 50 → Premium
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-6">
                        {/* Básico */}
                        <div className="p-6 bg-white rounded-xl border">
                            <h3 className="text-lg font-bold text-gray-900">Básico</h3>
                            <p className="text-sm text-gray-500 mb-4">Até 20 unidades</p>
                            <div className="mb-4">
                                <span className="text-3xl font-bold text-gray-900">R$ 99,90</span>
                                <span className="text-gray-500">/mês</span>
                            </div>
                            <ul className="space-y-2 mb-6 text-sm">
                                {['Financeiro', 'Moradores', 'Avisos', 'Cobranças', 'App móvel'].map((f, i) => (
                                    <li key={i} className="flex items-center gap-2 text-gray-700">
                                        <CheckCircle className="h-4 w-4 text-emerald-500" /> {f}
                                    </li>
                                ))}
                            </ul>
                            <Link href="/register" className="block text-center py-2.5 rounded-lg font-medium bg-gray-100 text-gray-700 hover:bg-gray-200">
                                Criar conta gratuita
                            </Link>
                        </div>

                        {/* Profissional - RECOMENDADO */}
                        <div className="p-6 bg-white rounded-xl border-2 border-emerald-500 relative">
                            <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-500 text-white text-xs px-3 py-1 rounded-full font-medium">
                                Recomendado
                            </span>
                            <h3 className="text-lg font-bold text-gray-900">Profissional</h3>
                            <p className="text-sm text-gray-500 mb-4">Até 50 unidades</p>
                            <div className="mb-4">
                                <span className="text-3xl font-bold text-gray-900">R$ 249,90</span>
                                <span className="text-gray-500">/mês</span>
                            </div>
                            <ul className="space-y-2 mb-6 text-sm">
                                {['Tudo do Básico +', 'Portaria', 'Reservas', 'Ocorrências', 'Encomendas', 'Relatórios'].map((f, i) => (
                                    <li key={i} className="flex items-center gap-2 text-gray-700">
                                        <CheckCircle className="h-4 w-4 text-emerald-500" /> {f}
                                    </li>
                                ))}
                            </ul>
                            <Link href="/register" className="block text-center py-2.5 rounded-lg font-semibold bg-emerald-600 text-white hover:bg-emerald-700">
                                Criar conta gratuita
                            </Link>
                        </div>

                        {/* Premium */}
                        <div className="p-6 bg-white rounded-xl border">
                            <h3 className="text-lg font-bold text-gray-900">Premium</h3>
                            <p className="text-sm text-gray-500 mb-4">Sem limite de unidades</p>
                            <div className="mb-4">
                                <span className="text-3xl font-bold text-gray-900">R$ 399,90</span>
                                <span className="text-gray-500">/mês</span>
                            </div>
                            <ul className="space-y-2 mb-6 text-sm">
                                {['Tudo do Profissional +', 'Câmeras ao vivo', 'Governança digital', 'Multi-condomínios', 'Automações'].map((f, i) => (
                                    <li key={i} className="flex items-center gap-2 text-gray-700">
                                        <CheckCircle className="h-4 w-4 text-emerald-500" /> {f}
                                    </li>
                                ))}
                            </ul>
                            <Link href="/register" className="block text-center py-2.5 rounded-lg font-medium bg-gray-100 text-gray-700 hover:bg-gray-200">
                                Criar conta gratuita
                            </Link>
                        </div>
                    </div>

                    {/* Serviços adicionais */}
                    <div className="mt-8 p-4 bg-white rounded-lg border max-w-2xl mx-auto">
                        <p className="text-sm text-gray-600 text-center">
                            <strong>Serviços opcionais:</strong> Integração bancária (PIX/boleto) e Assistente IA disponíveis mediante contratação separada.
                        </p>
                    </div>
                </div>
            </section>

            {/* 6. FAQ OBJETIVO */}
            <section id="faq" className="py-16 bg-white">
                <div className="max-w-3xl mx-auto px-4">
                    <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">Perguntas frequentes</h2>
                    <div className="space-y-4">
                        {[
                            {
                                q: 'Tem aplicativo para celular?',
                                a: 'Sim. App nativo para Android e iOS disponível nas lojas oficiais. Sincroniza em tempo real com o sistema web.'
                            },
                            {
                                q: 'Como funciona o período de teste?',
                                a: '7 dias grátis com acesso a todas as funcionalidades do plano escolhido. Não exigimos cartão de crédito. Após o período, você decide se continua.'
                            },
                            {
                                q: 'Posso cancelar quando quiser?',
                                a: 'Sim. Não há fidelidade. O cancelamento é feito diretamente pelo sistema.'
                            },
                            {
                                q: 'Como funciona a integração bancária?',
                                a: 'É um serviço contratado separadamente. Inclui PIX dinâmico, boleto automático e conciliação. Implantação: R$ 999 + R$ 199/mês.'
                            },
                            {
                                q: 'E o Assistente IA?',
                                a: 'Recurso adicional disponível para o plano Premium. Chatbot treinado com os documentos do seu condomínio. Implantação: R$ 997 + R$ 149/mês.'
                            },
                            {
                                q: 'Os dados estão seguros?',
                                a: 'Sim. Criptografia de ponta a ponta, isolamento de dados por condomínio e hospedagem em servidores seguros. Conformidade com LGPD.'
                            },
                        ].map((item, i) => (
                            <div key={i} className="p-4 bg-gray-50 rounded-lg">
                                <h3 className="font-medium text-gray-900 mb-1">{item.q}</h3>
                                <p className="text-sm text-gray-600">{item.a}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* 7. CTA FINAL OBJETIVO */}
            <section className="py-16 bg-emerald-600">
                <div className="max-w-2xl mx-auto px-4 text-center">
                    <h2 className="text-2xl font-bold text-white mb-3">
                        Teste o sistema por 7 dias
                    </h2>
                    <p className="text-emerald-100 mb-6">
                        Crie sua conta e avalie se atende às necessidades do seu condomínio.
                    </p>
                    <Link
                        href="/register"
                        className="inline-flex items-center gap-2 bg-white text-emerald-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100"
                    >
                        Criar conta para teste gratuito <ArrowRight className="h-4 w-4" />
                    </Link>
                    <p className="text-emerald-200 text-sm mt-4">Sem cartão de crédito · Cancele quando quiser</p>
                </div>
            </section>

            <footer className="py-8 bg-gray-900 text-gray-400 text-center text-sm">
                <p>© 2025 Meu Condomínio Fácil</p>
            </footer>
        </div>
    );
}
