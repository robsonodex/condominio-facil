'use client';

import { useState } from 'react';
import { X, ArrowRight, ArrowLeft, CreditCard, MessageSquare, Package, Smartphone, CheckCircle } from 'lucide-react';

interface GuidedDemoModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const demoSteps = [
    {
        id: 1,
        title: 'Cobranças em segundos',
        description: 'Crie cobranças por PIX ou boleto em poucos cliques. O morador recebe por e-mail e WhatsApp automaticamente.',
        icon: CreditCard,
        color: 'emerald',
        benefits: ['PIX gerado na hora', 'E-mail automático', 'Histórico completo']
    },
    {
        id: 2,
        title: 'Comunicação direta',
        description: 'Envie avisos, notificações e converse diretamente com os moradores. Tudo fica registrado.',
        icon: MessageSquare,
        color: 'blue',
        benefits: ['Avisos no app', 'Chat síndico-morador', 'Histórico salvo']
    },
    {
        id: 3,
        title: 'Portaria sem papel',
        description: 'Registro de visitantes e encomendas digitalizado. Acabou o papelzinho perdido.',
        icon: Package,
        color: 'purple',
        benefits: ['Visitantes registrados', 'Encomendas controladas', 'Notificação ao morador']
    },
    {
        id: 4,
        title: 'App para todos',
        description: 'Síndico, morador e porteiro têm app próprio. Cada um vê só o que precisa.',
        icon: Smartphone,
        color: 'amber',
        benefits: ['Android e iOS', 'Interface por perfil', 'Acesso seguro']
    },
    {
        id: 5,
        title: 'Pronto para começar?',
        description: 'Teste grátis por 7 dias. Sem cartão. Sem compromisso. Cancele quando quiser.',
        icon: CheckCircle,
        color: 'emerald',
        benefits: ['7 dias grátis', 'Sem cartão', 'Suporte incluso'],
        isFinal: true
    }
];

export function GuidedDemoModal({ isOpen, onClose }: GuidedDemoModalProps) {
    const [currentStep, setCurrentStep] = useState(0);

    if (!isOpen) return null;

    const step = demoSteps[currentStep];
    const isLast = currentStep === demoSteps.length - 1;
    const isFirst = currentStep === 0;

    const colorClasses: Record<string, { bg: string; text: string; icon: string }> = {
        emerald: { bg: 'bg-emerald-100', text: 'text-emerald-600', icon: 'text-emerald-600' },
        blue: { bg: 'bg-blue-100', text: 'text-blue-600', icon: 'text-blue-600' },
        purple: { bg: 'bg-purple-100', text: 'text-purple-600', icon: 'text-purple-600' },
        amber: { bg: 'bg-amber-100', text: 'text-amber-600', icon: 'text-amber-600' }
    };

    const colors = colorClasses[step.color] || colorClasses.emerald;

    const handleNext = () => {
        if (isLast) {
            window.location.href = '/register';
        } else {
            setCurrentStep(prev => prev + 1);
        }
    };

    const handlePrev = () => {
        if (!isFirst) {
            setCurrentStep(prev => prev - 1);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b">
                    <div className="flex items-center gap-2">
                        {demoSteps.map((_, idx) => (
                            <div
                                key={idx}
                                className={`w-2 h-2 rounded-full transition-colors ${idx === currentStep ? 'bg-emerald-600' : idx < currentStep ? 'bg-emerald-300' : 'bg-gray-200'
                                    }`}
                            />
                        ))}
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <X className="h-5 w-5 text-gray-500" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-8 text-center">
                    <div className={`w-16 h-16 ${colors.bg} rounded-2xl flex items-center justify-center mx-auto mb-6`}>
                        <step.icon className={`h-8 w-8 ${colors.icon}`} />
                    </div>

                    <h3 className="text-2xl font-bold text-gray-900 mb-3">
                        {step.title}
                    </h3>

                    <p className="text-gray-600 mb-6">
                        {step.description}
                    </p>

                    <div className="flex flex-wrap justify-center gap-2 mb-6">
                        {step.benefits.map((benefit, idx) => (
                            <span
                                key={idx}
                                className={`px-3 py-1 ${colors.bg} ${colors.text} rounded-full text-sm font-medium`}
                            >
                                {benefit}
                            </span>
                        ))}
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between p-4 border-t bg-gray-50">
                    <button
                        onClick={handlePrev}
                        disabled={isFirst}
                        className={`flex items-center gap-1 px-4 py-2 rounded-lg font-medium transition-colors ${isFirst
                                ? 'text-gray-300 cursor-not-allowed'
                                : 'text-gray-600 hover:bg-gray-200'
                            }`}
                    >
                        <ArrowLeft className="h-4 w-4" /> Anterior
                    </button>

                    <span className="text-sm text-gray-500">
                        {currentStep + 1} de {demoSteps.length}
                    </span>

                    <button
                        onClick={handleNext}
                        className="flex items-center gap-1 px-6 py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors"
                    >
                        {isLast ? 'Começar Grátis' : 'Próximo'} <ArrowRight className="h-4 w-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}

// Hook para usar o modal de demo
export function useDemoModal() {
    const [isOpen, setIsOpen] = useState(false);

    const open = () => setIsOpen(true);
    const close = () => setIsOpen(false);

    return { isOpen, open, close };
}
