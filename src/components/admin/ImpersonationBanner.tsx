'use client';

import { useUser } from '@/hooks/useUser';
import { Button } from '@/components/ui/button';
import { AlertCircle, LogOut } from 'lucide-react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function ImpersonationBanner() {
    const { isImpersonating, profile, refetchUser } = useUser();
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    if (!isImpersonating) return null;

    const handleStopImpersonation = async () => {
        setLoading(true);
        try {
            await fetch('/api/impersonate', { method: 'DELETE', credentials: 'include' });
            // Força atualização completa da página
            window.location.href = '/admin';
        } catch (error) {
            console.error('Failed to stop impersonation', error);
            setLoading(false);
        }
    };

    return (
        <div className="bg-orange-600 text-white px-4 py-3 shadow-md relative z-50">
            <div className="container mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <AlertCircle className="h-5 w-5 animate-pulse text-orange-200" />
                    <div>
                        <p className="font-bold text-sm sm:text-base">
                            🔐 MODO IMPERSONAÇÃO ATIVO
                        </p>
                        <p className="text-xs sm:text-sm text-orange-100">
                            Você está agindo como: <span className="font-bold underline">{profile?.nome || 'Usuário'}</span> ({profile?.role}) • Ações sendo registradas
                        </p>
                    </div>
                </div>

                <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleStopImpersonation}
                    disabled={loading}
                    className="bg-white text-orange-700 hover:bg-orange-50 font-semibold shadow-sm border-0 whitespace-nowrap"
                >
                    <LogOut className="h-4 w-4 mr-2" />
                    {loading ? 'Encerrando...' : 'Voltar para Superadmin'}
                </Button>
            </div>
        </div>
    );
}
