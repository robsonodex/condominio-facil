'use client';

import { useEffect, useState } from 'react';
import { AlertCircle, Clock, Sparkles } from 'lucide-react';
import Link from 'next/link';

interface TrialStatus {
    isTrial: boolean;
    isExpired: boolean;
    daysLeft: number;
    trialEnd: string | null;
    status: 'active' | 'warning' | 'expired' | 'paid';
}

export default function TrialBanner() {
    const [trialStatus, setTrialStatus] = useState<TrialStatus | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchTrialStatus();
    }, []);

    const fetchTrialStatus = async () => {
        try {
            const res = await fetch('/api/check-trial');
            if (res.ok) {
                const data = await res.json();
                setTrialStatus(data);
            }
        } catch (error) {
            console.error('[TrialBanner] Error:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading || !trialStatus?.isTrial) return null;

    const { status, daysLeft, isExpired } = trialStatus;

    // Color schemes based on status
    const colors = {
        active: 'bg-green-50 border-green-200 text-green-800',
        warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
        expired: 'bg-red-50 border-red-200 text-red-800'
    };

    const iconColors = {
        active: 'text-green-600',
        warning: 'text-yellow-600',
        expired: 'text-red-600'
    };

    return (
        <div className={`border-b-2 ${colors[status as keyof typeof colors]}`}>
            <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    {status === 'expired' ? (
                        <AlertCircle className={`h-5 w-5 ${iconColors[status]}`} />
                    ) : (
                        <Sparkles className={`h-5 w-5 ${iconColors[status]}`} />
                    )}

                    <div className="flex items-center gap-2">
                        <span className="font-semibold">🧪 CONTA TESTE</span>
                        <span className="text-sm">•</span>
                        <div className="flex items-center gap-1.5">
                            <Clock className="h-4 w-4" />
                            {isExpired ? (
                                <span className="font-bold">Período expirado</span>
                            ) : (
                                <span className="font-medium">
                                    {daysLeft} {daysLeft === 1 ? 'dia restante' : 'dias restantes'}
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                <Link
                    href="/upgrade"
                    className={`px-4 py-1.5 rounded-md font-medium text-sm transition-colors ${status === 'expired'
                            ? 'bg-red-600 text-white hover:bg-red-700'
                            : 'bg-green-600 text-white hover:bg-green-700'
                        }`}
                >
                    {status === 'expired' ? 'Renovar Agora' : 'Fazer Upgrade'}
                </Link>
            </div>
        </div>
    );
}
