'use client';

import { useFeature } from '@/hooks/useFeature';
import { Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

interface FeatureGuardProps {
    featureKey: string;
    children: React.ReactNode;
}

export function FeatureGuard({ featureKey, children }: FeatureGuardProps) {
    const { isEnabled, isLoading } = useFeature(featureKey);
    const router = useRouter();

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-[50vh]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (!isEnabled) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-center bg-white rounded-lg border border-gray-200 shadow-sm mx-auto max-w-2xl mt-12">
                <div className="bg-gray-100 p-4 rounded-full mb-6">
                    <Lock className="w-12 h-12 text-gray-400" />
                </div>
                <h2 className="text-2xl font-bold mb-3 text-gray-900">Funcionalidade Bloqueada</h2>
                <p className="text-gray-600 mb-8 max-w-md">
                    Esta funcionalidade não está habilitada no plano atual do seu condomínio.
                    Entre em contato com o síndico ou a administração para solicitar o upgrade.
                </p>
                <div className="flex gap-4">
                    <Button variant="outline" onClick={() => router.back()}>
                        Voltar
                    </Button>
                    <Button onClick={() => window.location.href = '/assinatura'}>
                        Ver Planos
                    </Button>
                </div>
            </div>
        );
    }

    return <>{children}</>;
}
