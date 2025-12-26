'use client';

import { useState } from 'react';
import { X, Copy, CheckCircle, Info } from 'lucide-react';
import Image from 'next/image';

interface StaticQRCodeModalProps {
    isOpen: boolean;
    onClose: () => void;
    data: {
        payload: string;
        qrCodeUrl: string;
        amount: number;
        receiverName: string;
        description: string;
    } | null;
}

export function StaticQRCodeModal({ isOpen, onClose, data }: StaticQRCodeModalProps) {
    const [copied, setCopied] = useState(false);

    const copyToClipboard = () => {
        if (data?.payload) {
            navigator.clipboard.writeText(data.payload);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    if (!isOpen || !data) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 px-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-0 overflow-hidden animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="bg-emerald-600 p-4 text-white flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-white/20 rounded-lg">
                            <span className="text-xl font-bold">pix</span>
                        </div>
                        <h2 className="font-bold">Pagamento Rápido</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-white/20 rounded-full transition-colors"
                    >
                        <X className="h-6 w-6" />
                    </button>
                </div>

                <div className="p-6">
                    {/* Amount */}
                    <div className="text-center mb-6">
                        <p className="text-gray-500 text-sm mb-1 uppercase tracking-wider font-semibold">Valor total</p>
                        <p className="text-4xl font-extrabold text-gray-900 tracking-tight">
                            R$ {data.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                        <p className="text-sm text-emerald-600 font-medium mt-1">{data.description}</p>
                    </div>

                    {/* QR Code */}
                    <div className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 mb-6 group transition-colors hover:border-emerald-200">
                        <div className="relative aspect-square w-48 mb-3 bg-white p-2 rounded-xl shadow-sm">
                            <Image
                                src={data.qrCodeUrl}
                                alt="QR Code PIX"
                                width={200}
                                height={200}
                                className="rounded-lg"
                                unoptimized
                            />
                        </div>
                        <p className="text-xs text-gray-500 text-center px-4 italic">
                            Aponte a câmera do seu app do banco para pagar
                        </p>
                    </div>

                    {/* Receiver Info */}
                    <div className="bg-gray-50 rounded-xl p-3 mb-6 flex items-start gap-3 border border-gray-100">
                        <div className="p-2 bg-blue-100 rounded-lg shrink-0">
                            <Info className="h-4 w-4 text-blue-600" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-xs text-gray-500 uppercase font-bold tracking-tight">Recebedor</p>
                            <p className="text-sm font-semibold text-gray-800 truncate">{data.receiverName}</p>
                        </div>
                    </div>

                    {/* Instructions & Actions */}
                    <div className="space-y-3">
                        <button
                            onClick={copyToClipboard}
                            className={`w-full flex items-center justify-center gap-2 py-4 px-4 rounded-xl font-bold transition-all shadow-md active:scale-[0.98] ${copied
                                    ? 'bg-emerald-100 text-emerald-700 border-2 border-emerald-500'
                                    : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-200'
                                }`}
                        >
                            {copied ? (
                                <>
                                    <CheckCircle className="h-5 w-5" />
                                    Copiado com sucesso!
                                </>
                            ) : (
                                <>
                                    <Copy className="h-5 w-5" />
                                    PIX Copia e Cola
                                </>
                            )}
                        </button>

                        <button
                            onClick={onClose}
                            className="w-full py-3 px-4 text-gray-500 hover:text-gray-700 font-semibold text-sm transition-colors"
                        >
                            Voltar para faturas
                        </button>
                    </div>

                    {/* Footer Info */}
                    <p className="mt-6 text-[10px] text-gray-400 text-center leading-relaxed">
                        Este é um pagamento via PIX direto para a conta do condomínio. <br />
                        A baixa será efetuada manualmente pelo administrador.
                    </p>
                </div>
            </div>
        </div>
    );
}
