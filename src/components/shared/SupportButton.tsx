'use client';

import { useState, useEffect } from 'react';
import { MessageCircle, X, Mail, Phone, ExternalLink, Lightbulb } from 'lucide-react';
import { Button } from '@/components/ui';
import Link from 'next/link';

interface SupportButtonProps {
    planType?: 'basico' | 'profissional' | 'enterprise';
    userName?: string;
}

export function SupportButton({ planType = 'basico', userName }: SupportButtonProps) {
    const [isOpen, setIsOpen] = useState(false);

    const supportOptions = {
        basico: [
            { icon: <Mail className="h-5 w-5" />, label: 'Email', desc: 'Resposta em até 48h', action: 'mailto:suporte@meucondominiofacil.com' },
            { icon: <ExternalLink className="h-5 w-5" />, label: 'FAQ / Ajuda', desc: 'Base de conhecimento', action: '/ajuda' },
            { icon: <Lightbulb className="h-5 w-5" />, label: 'Sugerir Melhoria', desc: 'Envie sua ideia', action: '/sugestoes' },
        ],
        profissional: [
            { icon: <MessageCircle className="h-5 w-5" />, label: 'Chat ao Vivo', desc: 'Horário comercial', action: 'chat' },
            { icon: <Mail className="h-5 w-5" />, label: 'Email Prioritário', desc: 'Resposta em até 24h', action: 'mailto:prioridade@meucondominiofacil.com' },
            { icon: <ExternalLink className="h-5 w-5" />, label: 'FAQ / Ajuda', desc: 'Base de conhecimento', action: '/ajuda' },
            { icon: <Lightbulb className="h-5 w-5" />, label: 'Sugerir Melhoria', desc: 'Envie sua ideia', action: '/sugestoes' },
        ],
        enterprise: [
            { icon: <Phone className="h-5 w-5" />, label: 'Telefone VIP', desc: '(21) 99999-9999', action: 'tel:+5521999999999' },
            { icon: <MessageCircle className="h-5 w-5" />, label: 'WhatsApp Direto', desc: 'Atendimento imediato', action: 'https://wa.me/5521999999999' },
            { icon: <MessageCircle className="h-5 w-5" />, label: 'Chat ao Vivo', desc: '24/7 disponível', action: 'chat' },
            { icon: <Mail className="h-5 w-5" />, label: 'Email VIP', desc: 'Resposta em até 4h', action: 'mailto:enterprise@meucondominiofacil.com' },
            { icon: <Lightbulb className="h-5 w-5" />, label: 'Sugerir Melhoria', desc: 'Prioridade na análise', action: '/sugestoes' },
        ],
    };

    const options = supportOptions[planType] || supportOptions.basico;

    const handleAction = (action: string) => {
        if (action === 'chat') {
            // Aqui poderia abrir um widget de chat (Intercom, Crisp, etc)
            alert('Chat será aberto em breve! Por enquanto, use o email.');
        } else if (action.startsWith('/')) {
            window.location.href = action;
        } else {
            window.open(action, '_blank');
        }
        setIsOpen(false);
    };

    const planLabels = {
        basico: 'Plano Básico',
        profissional: 'Plano Profissional',
        enterprise: 'Plano Enterprise',
    };

    return (
        <>
            {/* Botão flutuante */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-110 ${isOpen
                        ? 'bg-gray-600 hover:bg-gray-700'
                        : 'bg-emerald-500 hover:bg-emerald-600'
                    }`}
            >
                {isOpen ? (
                    <X className="h-6 w-6 text-white" />
                ) : (
                    <MessageCircle className="h-6 w-6 text-white" />
                )}
            </button>

            {/* Modal de opções */}
            {isOpen && (
                <>
                    {/* Overlay */}
                    <div
                        className="fixed inset-0 bg-black/20 z-40"
                        onClick={() => setIsOpen(false)}
                    />

                    {/* Card de suporte */}
                    <div className="fixed bottom-24 right-6 z-50 w-80 bg-white rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4">
                        {/* Header */}
                        <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 p-4 text-white">
                            <h3 className="font-bold text-lg">Precisa de ajuda?</h3>
                            <p className="text-sm text-emerald-100">{planLabels[planType]}</p>
                        </div>

                        {/* Opções */}
                        <div className="p-2">
                            {options.map((opt, i) => (
                                <button
                                    key={i}
                                    onClick={() => handleAction(opt.action)}
                                    className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors text-left"
                                >
                                    <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600">
                                        {opt.icon}
                                    </div>
                                    <div>
                                        <p className="font-medium text-gray-900">{opt.label}</p>
                                        <p className="text-xs text-gray-500">{opt.desc}</p>
                                    </div>
                                </button>
                            ))}
                        </div>

                        {/* Footer */}
                        <div className="border-t px-4 py-3 bg-gray-50">
                            <p className="text-xs text-gray-500 text-center">
                                Estamos aqui para ajudar! 💚
                            </p>
                        </div>
                    </div>
                </>
            )}
        </>
    );
}
