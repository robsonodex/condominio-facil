'use client';

import { useState, useEffect } from 'react';
import { X, Copy, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import Image from 'next/image';

interface QRCodeModalProps {
    isOpen: boolean;
    onClose: () => void;
    paymentData: {
        payment_id: string;
        qr_code: string;
        qr_code_base64?: string;
        amount: number;
        expires_at: string;
        status: string;
    } | null;
}

export function QRCodeModal({ isOpen, onClose, paymentData }: QRCodeModalProps) {
    const [copied, setCopied] = useState(false);
    const [timeLeft, setTimeLeft] = useState<number | null>(null);
    const [status, setStatus] = useState<string>('pending');

    // Calculate time remaining
    useEffect(() => {
        if (!paymentData?.expires_at) return;

        const updateTimer = () => {
            const now = new Date().getTime();
            const expiry = new Date(paymentData.expires_at).getTime();
            const diff = Math.max(0, expiry - now);
            setTimeLeft(Math.floor(diff / 1000));
        };

        updateTimer();
        const interval = setInterval(updateTimer, 1000);

        return () => clearInterval(interval);
    }, [paymentData]);

    // Poll payment status
    useEffect(() => {
        if (!paymentData?.payment_id || status === 'paid') return;

        const pollStatus = async () => {
            try {
                const response = await fetch(`/api/checkout/pix?payment_id=${paymentData.payment_id}`);
                if (response.ok) {
                    const data = await response.json();
                    setStatus(data.status);
                    if (data.status === 'paid') {
                        setTimeout(() => onClose(), 3000); // Close after 3s
                    }
                }
            } catch (error) {
                console.error('Status poll error:', error);
            }
        };

        const interval = setInterval(pollStatus, 3000); // Poll every 3s
        return () => clearInterval(interval);
    }, [paymentData, status, onClose]);

    const copyToClipboard = () => {
        if (paymentData?.qr_code) {
            navigator.clipboard.writeText(paymentData.qr_code);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    if (!isOpen || !paymentData) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-gray-900">
                        Pagar com PIX
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600"
                    >
                        <X className="h-6 w-6" />
                    </button>
                </div>

                {/* Status Badge */}
                {status === 'paid' ? (
                    <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
                        <CheckCircle className="h-6 w-6 text-green-600" />
                        <div>
                            <p className="font-semibold text-green-900">Pagamento confirmado!</p>
                            <p className="text-sm text-green-700">Modal fechará em breve...</p>
                        </div>
                    </div>
                ) : timeLeft !== null && timeLeft === 0 ? (
                    <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
                        <AlertCircle className="h-6 w-6 text-red-600" />
                        <div>
                            <p className="font-semibold text-red-900">QR Code expirado</p>
                            <p className="text-sm text-red-700">Gere um novo código</p>
                        </div>
                    </div>
                ) : (
                    <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-3">
                        <Clock className="h-6 w-6 text-blue-600" />
                        <div>
                            <p className="font-semibold text-blue-900">Pagamento pendente</p>
                            {timeLeft !== null && (
                                <p className="text-sm text-blue-700">
                                    Expira em: {formatTime(timeLeft)}
                                </p>
                            )}
                        </div>
                    </div>
                )}

                {/* QR Code */}
                {paymentData.qr_code_base64 && (
                    <div className="flex justify-center mb-4 bg-white p-4 rounded-lg border-2 border-gray-200">
                        <Image
                            src={`data:image/png;base64,${paymentData.qr_code_base64}`}
                            alt="QR Code PIX"
                            width={250}
                            height={250}
                            className="rounded"
                        />
                    </div>
                )}

                {/* Amount */}
                <div className="text-center mb-4">
                    <p className="text-sm text-gray-600">Valor a pagar</p>
                    <p className="text-3xl font-bold text-gray-900">
                        R$ {paymentData.amount.toFixed(2).replace('.', ',')}
                    </p>
                </div>

                {/* Instructions */}
                <div className="mb-4">
                    <p className="text-sm text-gray-700 mb-2 font-semibold">Como pagar:</p>
                    <ol className="text-sm text-gray-600 space-y-1 list-decimal list-inside">
                        <li>Abra o app do seu banco</li>
                        <li>Escolha pagar com PIX QR Code</li>
                        <li>Escaneie o código acima</li>
                        <li>Confirme o pagamento</li>
                    </ol>
                </div>

                {/* Copy Button */}
                <button
                    onClick={copyToClipboard}
                    className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors mb-2"
                >
                    {copied ? (
                        <>
                            <CheckCircle className="h-5 w-5" />
                            Código copiado!
                        </>
                    ) : (
                        <>
                            <Copy className="h-5 w-5" />
                            Copiar código PIX
                        </>
                    )}
                </button>

                {/* Cancel */}
                <button
                    onClick={onClose}
                    className="w-full py-2 px-4 text-gray-600 hover:text-gray-800 text-sm"
                >
                    Cancelar
                </button>
            </div>
        </div>
    );
}
