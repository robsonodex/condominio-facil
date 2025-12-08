'use client';

import { useState, Suspense } from 'react';
import { Sidebar, Header } from '@/components/shared';
import { useAuth } from '@/hooks/useAuth';

// Componente de loading inline otimizado (não bloqueia)
function QuickLoader() {
    return (
        <div className="fixed inset-0 bg-gray-50 flex items-center justify-center z-50">
            <div className="flex flex-col items-center gap-3">
                <div className="w-10 h-10 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-sm text-gray-500">Carregando...</p>
            </div>
        </div>
    );
}

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const { loading, user, profile } = useAuth();

    // Renderiza layout com skeleton enquanto carrega (não bloqueia completamente)
    return (
        <div className="min-h-screen bg-gray-50">
            {loading && <QuickLoader />}
            <div className={`flex ${loading ? 'opacity-0' : 'opacity-100 transition-opacity duration-200'}`}>
                <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
                <div className="flex-1 lg:ml-0">
                    <Header onMenuClick={() => setSidebarOpen(true)} />
                    <main className="p-4 lg:p-6">
                        <Suspense fallback={<div className="animate-pulse bg-gray-200 h-32 rounded-lg"></div>}>
                            {children}
                        </Suspense>
                    </main>
                </div>
            </div>
        </div>
    );
}
