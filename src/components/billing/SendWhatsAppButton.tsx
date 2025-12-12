'use client';

import { useState } from 'react';
import { Send, Loader2, CheckCircle, X } from 'lucide-react';

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
}

export function SendWhatsAppButton({
    phone,
    type,
    data,
    disabled = false,
    className = ''
}: SendWhatsAppButtonProps) {
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSend = async () => {
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

    return (
        <div className="relative inline-flex items-center">
            <button
                onClick={handleSend}
                disabled={disabled || loading || !phone}
                className={`
                    inline-flex items-center gap-2 px-3 py-2 rounded-lg
                    text-sm font-medium transition-all
                    ${success
                        ? 'bg-green-100 text-green-700 border border-green-300'
                        : error
                            ? 'bg-red-100 text-red-700 border border-red-300'
                            : 'bg-emerald-600 text-white hover:bg-emerald-700'
                    }
                    ${(disabled || !phone) ? 'opacity-50 cursor-not-allowed' : ''}
                    ${className}
                `}
                title={!phone ? 'Telefone não informado' : 'Enviar via WhatsApp'}
            >
                {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                ) : success ? (
                    <CheckCircle className="h-4 w-4" />
                ) : error ? (
                    <X className="h-4 w-4" />
                ) : (
                    <Send className="h-4 w-4" />
                )}
                {loading ? 'Enviando...' : success ? 'Enviado!' : error ? 'Erro' : 'WhatsApp'}
            </button>

            {error && (
                <span className="absolute -bottom-6 left-0 text-xs text-red-600 whitespace-nowrap">
                    {error}
                </span>
            )}
        </div>
    );
}
