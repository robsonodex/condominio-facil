'use client';

import { useState } from 'react';
import { Card, CardContent, Button, Input, Label } from '@/components/ui';
import { Calendar, Clock, User, Send } from 'lucide-react';

interface CreateInviteFormProps {
    onSuccess: (invite: InviteData) => void;
    onCancel?: () => void;
}

interface InviteData {
    id: string;
    guest_name: string;
    valid_from: string;
    valid_until: string;
    status: string;
    unit: { bloco: string; numero_unidade: string } | null;
    qrData: string;
}

export function CreateInviteForm({ onSuccess, onCancel }: CreateInviteFormProps) {
    const [guestName, setGuestName] = useState('');
    const [validFrom, setValidFrom] = useState(() => {
        const now = new Date();
        return now.toISOString().slice(0, 16);
    });
    const [validUntil, setValidUntil] = useState(() => {
        const later = new Date(Date.now() + 4 * 60 * 60 * 1000); // +4 horas
        return later.toISOString().slice(0, 16);
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await fetch('/api/invites/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    guest_name: guestName,
                    valid_from: validFrom,
                    valid_until: validUntil,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Erro ao criar convite');
            }

            onSuccess({
                ...data.invite,
                qrData: data.qrData,
            });
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card className="w-full max-w-md mx-auto">
            <CardContent className="p-6">
                <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                    <User className="h-5 w-5 text-blue-500" />
                    Criar Convite para Visitante
                </h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <Label htmlFor="guestName" className="flex items-center gap-2 mb-2">
                            <User className="h-4 w-4" />
                            Nome do Visitante *
                        </Label>
                        <Input
                            id="guestName"
                            type="text"
                            value={guestName}
                            onChange={(e) => setGuestName(e.target.value)}
                            placeholder="Ex: João da Silva"
                            required
                            className="w-full"
                        />
                    </div>

                    <div>
                        <Label htmlFor="validFrom" className="flex items-center gap-2 mb-2">
                            <Calendar className="h-4 w-4" />
                            Válido a partir de
                        </Label>
                        <Input
                            id="validFrom"
                            type="datetime-local"
                            value={validFrom}
                            onChange={(e) => setValidFrom(e.target.value)}
                            className="w-full"
                        />
                    </div>

                    <div>
                        <Label htmlFor="validUntil" className="flex items-center gap-2 mb-2">
                            <Clock className="h-4 w-4" />
                            Válido até
                        </Label>
                        <Input
                            id="validUntil"
                            type="datetime-local"
                            value={validUntil}
                            onChange={(e) => setValidUntil(e.target.value)}
                            min={validFrom}
                            className="w-full"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            Máximo: 7 dias a partir de agora
                        </p>
                    </div>

                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                            {error}
                        </div>
                    )}

                    <div className="flex gap-3 pt-4">
                        {onCancel && (
                            <Button
                                type="button"
                                variant="outline"
                                onClick={onCancel}
                                className="flex-1"
                            >
                                Cancelar
                            </Button>
                        )}
                        <Button
                            type="submit"
                            disabled={loading || !guestName.trim()}
                            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                        >
                            {loading ? (
                                <span className="flex items-center gap-2">
                                    <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                                    Gerando...
                                </span>
                            ) : (
                                <span className="flex items-center gap-2">
                                    <Send className="h-4 w-4" />
                                    Gerar Convite
                                </span>
                            )}
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}
