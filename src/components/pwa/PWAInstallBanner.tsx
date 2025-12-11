'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui';
import { Download, X } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
    prompt(): Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function PWAInstallBanner() {
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const [showBanner, setShowBanner] = useState(false);
    const [isIOS, setIsIOS] = useState(false);

    useEffect(() => {
        // Check if already installed
        if (window.matchMedia('(display-mode: standalone)').matches) {
            return;
        }

        // Check if iOS
        const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent);
        setIsIOS(isIOSDevice);

        // Hide if dismissed recently
        const dismissed = localStorage.getItem('pwa-install-dismissed');
        if (dismissed && Date.now() - parseInt(dismissed) < 7 * 24 * 60 * 60 * 1000) {
            return;
        }

        // Listen for install prompt
        const handleBeforeInstall = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e as BeforeInstallPromptEvent);
            setShowBanner(true);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstall);

        // Show iOS instructions after delay
        if (isIOSDevice) {
            setTimeout(() => setShowBanner(true), 3000);
        }

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
        };
    }, []);

    const handleInstall = async () => {
        if (!deferredPrompt) return;

        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;

        if (outcome === 'accepted') {
            setShowBanner(false);
        }

        setDeferredPrompt(null);
    };

    const handleDismiss = () => {
        setShowBanner(false);
        localStorage.setItem('pwa-install-dismissed', Date.now().toString());
    };

    if (!showBanner) return null;

    return (
        <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white p-4 rounded-xl shadow-lg z-50 animate-slide-up">
            <button
                onClick={handleDismiss}
                className="absolute top-2 right-2 p-1 hover:bg-white/20 rounded"
            >
                <X className="h-4 w-4" />
            </button>

            <div className="flex items-start gap-3">
                <div className="p-2 bg-white/20 rounded-lg">
                    <Download className="h-6 w-6" />
                </div>
                <div className="flex-1">
                    <h3 className="font-semibold">Instale o App</h3>
                    {isIOS ? (
                        <p className="text-sm text-emerald-100 mt-1">
                            Toque em <span className="font-medium">Compartilhar</span> e depois em{' '}
                            <span className="font-medium">"Adicionar à Tela de Início"</span>
                        </p>
                    ) : (
                        <>
                            <p className="text-sm text-emerald-100 mt-1">
                                Acesse mais rápido direto da sua tela inicial
                            </p>
                            <Button
                                size="sm"
                                variant="secondary"
                                className="mt-2 bg-white text-emerald-600 hover:bg-emerald-50"
                                onClick={handleInstall}
                            >
                                Instalar Agora
                            </Button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
