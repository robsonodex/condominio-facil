'use client';

import { QRCodeSVG } from 'qrcode.react';
import { Card, CardContent, Button } from '@/components/ui';
import { Share2, Copy, MessageCircle, Check, X, Building, Clock } from 'lucide-react';
import { useState } from 'react';

interface InviteShareProps {
    invite: {
        id: string;
        guest_name: string;
        valid_from?: string;
        valid_until?: string;
        visit_date?: string;
        visit_time_start?: string;
        visit_time_end?: string;
        status: string;
        unit?: { bloco: string; numero_unidade: string } | null;
    };
    qrData: string;
    onClose?: () => void;
}

export function InviteShare({ invite, qrData, onClose }: InviteShareProps) {
    const [copied, setCopied] = useState(false);

    // Construir datas a partir de valid_from/valid_until ou visit_date/visit_time
    const getValidFrom = (): string => {
        if (invite.valid_from && !invite.valid_from.includes('Invalid')) {
            return invite.valid_from;
        }
        if (invite.visit_date) {
            const time = invite.visit_time_start || '00:00';
            return `${invite.visit_date}T${time}:00`;
        }
        return '';
    };

    const getValidUntil = (): string => {
        if (invite.valid_until && !invite.valid_until.includes('Invalid')) {
            return invite.valid_until;
        }
        if (invite.visit_date) {
            const time = invite.visit_time_end || '23:59';
            return `${invite.visit_date}T${time}:00`;
        }
        return '';
    };

    const formatDate = (dateStr: string) => {
        if (!dateStr) return 'Data não informada';
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return 'Data não informada';
        return date.toLocaleString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const validFrom = getValidFrom();
    const validUntil = getValidUntil();

    const unitLabel = invite.unit
        ? invite.unit.bloco
            ? `Bloco ${invite.unit.bloco} - ${invite.unit.numero_unidade}`
            : invite.unit.numero_unidade
        : 'Unidade';

    const shareMessage = encodeURIComponent(
        `🏠 *Convite de Visitante*\n\n` +
        `Olá ${invite.guest_name}!\n\n` +
        `Você está convidado(a) a visitar ${unitLabel}.\n\n` +
        `📅 Válido de: ${formatDate(validFrom)}\n` +
        `📅 Válido até: ${formatDate(validUntil)}\n\n` +
        `Ao chegar, apresente o QR Code abaixo na portaria:\n\n` +
        `🔗 ${typeof window !== 'undefined' ? window.location.origin : ''}/convite/${invite.id}`
    );

    const whatsappUrl = `https://wa.me/?text=${shareMessage}`;

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(qrData);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            console.error('Failed to copy');
        }
    };

    const handleShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'Convite de Visitante',
                    text: `Convite para ${invite.guest_name} - ${unitLabel}`,
                    url: `${window.location.origin}/convite/${invite.id}`,
                });
            } catch {
                // User cancelled or error
            }
        } else {
            window.open(whatsappUrl, '_blank');
        }
    };

    return (
        <Card className="w-full max-w-md mx-auto">
            <CardContent className="p-6">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold text-green-600 flex items-center gap-2">
                        <Check className="h-5 w-5" />
                        Convite Criado!
                    </h2>
                    {onClose && (
                        <Button variant="ghost" size="sm" onClick={onClose}>
                            <X className="h-4 w-4" />
                        </Button>
                    )}
                </div>

                {/* QR Code */}
                <div className="flex justify-center my-6">
                    <div className="p-4 bg-white rounded-xl shadow-lg border-2 border-gray-100">
                        <QRCodeSVG
                            value={qrData}
                            size={200}
                            level="H"
                            includeMargin
                            bgColor="#ffffff"
                            fgColor="#000000"
                        />
                    </div>
                </div>

                {/* Informações do Convite */}
                <div className="bg-gray-50 rounded-lg p-4 space-y-3 mb-6">
                    <div className="flex items-center gap-2">
                        <span className="text-2xl">👤</span>
                        <div>
                            <p className="text-sm text-gray-500">Visitante</p>
                            <p className="font-semibold">{invite.guest_name}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Building className="h-5 w-5 text-gray-400" />
                        <div>
                            <p className="text-sm text-gray-500">Destino</p>
                            <p className="font-semibold">{unitLabel}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Clock className="h-5 w-5 text-gray-400" />
                        <div>
                            <p className="text-sm text-gray-500">Validade</p>
                            <p className="text-sm">
                                {formatDate(validFrom)} até {formatDate(validUntil)}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Botões de Ação */}
                <div className="space-y-3">
                    <Button
                        onClick={() => window.open(whatsappUrl, '_blank')}
                        className="w-full bg-green-500 hover:bg-green-600 text-white"
                    >
                        <MessageCircle className="h-4 w-4 mr-2" />
                        Compartilhar no WhatsApp
                    </Button>

                    <div className="flex gap-3">
                        <Button
                            variant="outline"
                            onClick={handleCopy}
                            className="flex-1"
                        >
                            {copied ? (
                                <>
                                    <Check className="h-4 w-4 mr-2 text-green-500" />
                                    Copiado!
                                </>
                            ) : (
                                <>
                                    <Copy className="h-4 w-4 mr-2" />
                                    Copiar Código
                                </>
                            )}
                        </Button>

                        <Button
                            variant="outline"
                            onClick={handleShare}
                            className="flex-1"
                        >
                            <Share2 className="h-4 w-4 mr-2" />
                            Compartilhar
                        </Button>
                    </div>
                </div>

                <p className="text-xs text-center text-gray-400 mt-4">
                    O visitante deve apresentar este QR Code na portaria para entrada.
                </p>
            </CardContent>
        </Card>
    );
}
