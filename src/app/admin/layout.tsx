'use client';

import { useState } from 'react';
import { Sidebar, Header } from '@/components/shared';
import { useAuth } from '@/hooks/useAuth';
import { useUser } from '@/hooks/useUser';
import { PageLoading } from '@/components/shared';
import { redirect } from 'next/navigation';

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const { loading } = useAuth();
    const { isSuperAdmin, profile } = useUser();

    if (loading) {
        return <PageLoading />;
    }

    // Only superadmin can access admin routes
    if (!isSuperAdmin) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Acesso Negado</h1>
                    <p className="text-gray-500 mb-4">Você não tem permissão para acessar esta área.</p>
                    <a href="/dashboard" className="text-emerald-600 hover:text-emerald-700 font-medium">
                        Voltar ao Dashboard
                    </a>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="flex">
                <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
                <div className="flex-1 lg:ml-0">
                    <Header onMenuClick={() => setSidebarOpen(true)} />
                    <main className="p-4 lg:p-6">
                        {children}
                    </main>
                </div>
            </div>
        </div>
    );
}
