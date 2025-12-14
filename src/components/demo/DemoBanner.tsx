'use client';

import { useDemoMode } from '@/hooks/useDemoMode';
import { Sparkles, ArrowRight, X } from 'lucide-react';
import { useState } from 'react';
import Link from 'next/link';

export function DemoBanner() {
    const { isDemo } = useDemoMode();
    const [dismissed, setDismissed] = useState(false);

    if (!isDemo || dismissed) return null;

    return (
        <div className="relative bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500 text-white">
            <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 bg-white/20 rounded-full">
                        <Sparkles className="h-4 w-4" />
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                        <span className="font-bold text-sm">
                            🎯 Modo Demonstração
                        </span>
                        <span className="text-xs sm:text-sm text-white/90 hidden sm:inline">
                            Explore todas as funcionalidades do sistema!
                        </span>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Link
                        href="/landing#pricing"
                        className="flex items-center gap-1.5 bg-white text-amber-600 px-3 py-1.5 rounded-full text-xs font-bold hover:bg-amber-50 transition-colors shadow-sm"
                    >
                        Adquirir Plano
                        <ArrowRight className="h-3 w-3" />
                    </Link>
                    <button
                        onClick={() => setDismissed(true)}
                        className="p-1 hover:bg-white/20 rounded-full transition-colors"
                        title="Fechar"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}
