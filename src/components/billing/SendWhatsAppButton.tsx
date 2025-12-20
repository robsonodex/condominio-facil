'use client';

import { useState } from 'react';
import { Send, Loader2, CheckCircle, X, Lock, MessageCircle } from 'lucide-react';
import Link from 'next/link';

interface SendWhatsAppButtonProps {
    phone: string;
    type: 'cobranca_gerada' | 'boleto_disponivel' | 'pagamento_confirmado' | 'mensagem_livre';
    data: {
        valor?: string;
        link?: string;
        vencimento?: string;
        message?: string;
    };
    disabled?: boolean;
    className?: string;
    hasWhatsApp?: boolean; // Se o condomínio tem WhatsApp ativo
}

export function SendWhatsAppButton({
    phone,
    type,
    data,
    disabled = false,
    className = '',
    hasWhatsApp = true // Por padrão assume que tem (compatibilidade)
}: SendWhatsAppButtonProps) {
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showUpgradeModal, setShowUpgradeModal] = useState(false);

    const handleClick = async () => {
        // Se não tem WhatsApp contratado, mostra modal de upgrade
        if (!hasWhatsApp) {
            setShowUpgradeModal(true);
            return;
        }

        if (!phone || loading) return;

        setLoading(true);
        setError(null);
        setSuccess(false);

        try {
            const response = await fetch('/api/notifications/whatsapp/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone, type, data }),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Falha ao enviar');
            }

            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
        } catch (err: any) {
            setError(err.message);
            setTimeout(() => setError(null), 5000);
        } finally {
            setLoading(false);
        }
    };

    const isDisabled = disabled || loading || !phone;
    const needsUpgrade = !hasWhatsApp;

    return (
        <>
            <div className="relative inline-flex items-center">
                <button
                    onClick={handleClick}
                    disabled={isDisabled && !needsUpgrade}
                    className={`
                        inline-flex items-center gap-2 px-3 py-2 rounded-lg
                        text-sm font-medium transition-all
                        ${needsUpgrade
                            ? 'bg-gray-100 text-gray-500 border border-gray-300 hover:bg-gray-200'
                            : success
                                ? 'bg-green-100 text-green-700 border border-green-300'
                                : error
                                    ? 'bg-red-100 text-red-700 border border-red-300'
                                    : 'bg-emerald-600 text-white hover:bg-emerald-700'
                        }
                        ${(isDisabled && !needsUpgrade) ? 'opacity-50 cursor-not-allowed' : ''}
                        ${className}
                    `}
                    title={needsUpgrade ? 'Requer plano WhatsApp' : !phone ? 'Telefone não informado' : 'Enviar via WhatsApp'}
                >
                    {needsUpgrade ? (
                        <Lock className="h-4 w-4" />
                    ) : loading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : success ? (
                        <CheckCircle className="h-4 w-4" />
                    ) : error ? (
                        <X className="h-4 w-4" />
                    ) : (
                        <Send className="h-4 w-4" />
                    )}
                    {needsUpgrade ? 'WhatsApp' : loading ? 'Enviando...' : success ? 'Enviado!' : error ? 'Erro' : 'WhatsApp'}
                </button>

                {error && (
                    <span className="absolute -bottom-6 left-0 text-xs text-red-600 whitespace-nowrap">
                        {error}
                    </span>
                )}
            </div>

            {/* Modal de Upgrade */}
            {showUpgradeModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
                        <div className="text-center">
                            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <MessageCircle className="h-8 w-8 text-green-600" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">
                                WhatsApp Oficial
                            </h3>
                            <p className="text-gray-600 mb-6">
                                Para enviar mensagens via WhatsApp, você precisa ativar a integração oficial.
                                Envie cobranças, avisos e notificações diretamente pelo sistema!
                            </p>

                            <div className="flex gap-3 justify-center">
                                <button
                                    onClick={() => setShowUpgradeModal(false)}
                                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    Fechar
                                </button>
                                <Link
                                    href="/configuracoes/integracao-whatsapp"
                                    className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                                >
                                    Contratar Agora
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

