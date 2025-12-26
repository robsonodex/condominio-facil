import Link from 'next/link';
import { Building2, ArrowLeft, Star, Quote } from 'lucide-react';

export const metadata = {
    title: 'Casos de Sucesso - Meu Condomínio Fácil',
    description: 'Veja como síndicos estão usando o Meu Condomínio Fácil para simplificar a gestão dos seus condomínios.',
};

const cases = [
    {
        id: 1,
        name: 'Carlos Silva',
        role: 'Síndico',
        condo: 'Residencial Jardim das Flores',
        location: 'Rio de Janeiro, RJ',
        units: 32,
        quote: 'Antes eu perdia horas por semana cobrando inadimplentes no WhatsApp. Agora o sistema faz tudo automaticamente. A inadimplência caiu de 25% para 8% em 3 meses.',
        highlight: 'Redução de 68% na inadimplência',
        avatar: '👨‍💼'
    },
    {
        id: 2,
        name: 'Maria Santos',
        role: 'Síndica Profissional',
        condo: 'Condomínio Vista Mar',
        location: 'Niterói, RJ',
        units: 48,
        quote: 'Gerencio 3 condomínios ao mesmo tempo. O app me dá controle total de qualquer lugar. O chat com moradores acabou com aquelas ligações às 22h.',
        highlight: 'Gerencia 3 condomínios com facilidade',
        avatar: '👩‍💼'
    },
    {
        id: 3,
        name: 'Roberto Almeida',
        role: 'Síndico Morador',
        condo: 'Edifício Solar',
        location: 'São Gonçalo, RJ',
        units: 18,
        quote: 'Sou síndico há 2 anos e nunca tinha usado sistema. Achei que seria complicado, mas em 1 semana já estava funcionando. O suporte ajudou muito.',
        highlight: 'Implementação em 1 semana',
        avatar: '👨‍🦳'
    }
];

export default function CasosPage() {
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
            <section className="py-16">
                <div className="container mx-auto px-4 text-center">
                    <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                        Casos de Sucesso
                    </h1>
                    <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                        Veja como síndicos reais estão transformando a gestão dos seus condomínios
                    </p>
                </div>
            </section>

            {/* Cases */}
            <section className="pb-16">
                <div className="container mx-auto px-4">
                    <div className="max-w-4xl mx-auto space-y-8">
                        {cases.map((caseItem) => (
                            <div key={caseItem.id} className="bg-white rounded-2xl shadow-lg p-8 relative overflow-hidden">
                                {/* Quote icon */}
                                <Quote className="absolute top-6 right-6 h-12 w-12 text-emerald-100" />

                                <div className="flex flex-col md:flex-row gap-6">
                                    {/* Avatar */}
                                    <div className="flex-shrink-0">
                                        <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center text-4xl">
                                            {caseItem.avatar}
                                        </div>
                                    </div>

                                    {/* Content */}
                                    <div className="flex-grow">
                                        {/* Rating */}
                                        <div className="flex gap-1 mb-3">
                                            {[1, 2, 3, 4, 5].map((star) => (
                                                <Star key={star} className="h-5 w-5 text-amber-400 fill-amber-400" />
                                            ))}
                                        </div>

                                        {/* Quote */}
                                        <blockquote className="text-lg text-gray-700 mb-4 italic">
                                            "{caseItem.quote}"
                                        </blockquote>

                                        {/* Highlight */}
                                        <div className="inline-block bg-emerald-100 text-emerald-700 px-4 py-2 rounded-full text-sm font-semibold mb-4">
                                            ✓ {caseItem.highlight}
                                        </div>

                                        {/* Author */}
                                        <div className="border-t pt-4">
                                            <p className="font-semibold text-gray-900">{caseItem.name}</p>
                                            <p className="text-sm text-gray-600">{caseItem.role} · {caseItem.condo}</p>
                                            <p className="text-sm text-gray-500">{caseItem.location} · {caseItem.units} unidades</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="py-16 bg-emerald-600">
                <div className="container mx-auto px-4 text-center">
                    <h2 className="text-3xl font-bold text-white mb-4">
                        Quer ser o próximo caso de sucesso?
                    </h2>
                    <p className="text-emerald-100 mb-8">
                        Comece seu teste grátis de 7 dias agora mesmo.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link
                            href="/register"
                            className="px-8 py-4 bg-white text-emerald-600 rounded-xl font-semibold hover:bg-gray-100 transition-colors"
                        >
                            Começar Teste Grátis
                        </Link>
                        <Link
                            href="/landing#planos"
                            className="px-8 py-4 border-2 border-white text-white rounded-xl font-semibold hover:bg-emerald-700 transition-colors"
                        >
                            Ver Planos
                        </Link>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-8 bg-gray-900 text-white">
                <div className="container mx-auto px-4 text-center">
                    <p className="text-gray-400 text-sm">
                        © 2025 Meu Condomínio Fácil · CNPJ 57.444.727/0001-85
                    </p>
                </div>
            </footer>
        </div>
    );
}
