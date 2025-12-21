'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { createClient } from '@/lib/supabase/client';
import { XCircle, CreditCard } from 'lucide-react';
import Link from 'next/link';

export function SuspendedBanner() {
    const { profile } = useAuth();
    const [condoStatus, setCondoStatus] = useState<string | null>(null);
    const supabase = createClient();

    useEffect(() => {
        if (profile?.condo_id && profile.role !== 'superadmin') {
            supabase
                .from('condos')
                .select('status')
                .eq('id', profile.condo_id)
                .single()
                .then(({ data }) => {
                    setCondoStatus(data?.status || null);
                });
        }
    }, [profile?.condo_id, profile?.role]);

    // Superadmin não vê banner de suspensão
    if (profile?.role === 'superadmin') return null;

    // Só mostra se status for suspenso
    if (condoStatus !== 'suspenso') return null;

    return (
        <div className="bg-red-600 text-white">
            <div className="max-w-7xl mx-auto py-3 px-4 sm:px-6 lg:px-8">
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                        <XCircle className="h-5 w-5 flex-shrink-0" />
                        <p className="text-sm font-medium">
                            <span className="font-bold">Conta Suspensa!</span>
                            {' '}Seu acesso está limitado por falta de pagamento. Regularize sua assinatura para continuar usando todos os recursos.
                        </p>
                    </div>
                    <Link
                        href="/assinatura"
                        className="flex items-center gap-1 bg-white text-red-600 px-4 py-1.5 rounded-full text-sm font-semibold hover:bg-red-50 transition-colors"
                    >
                        <CreditCard className="h-4 w-4" />
                        Regularizar
                    </Link>
                </div>
            </div>
        </div>
    );
}
