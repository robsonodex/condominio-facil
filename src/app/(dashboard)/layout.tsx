'use client';

import { useState } from 'react';
import { Sidebar, Header } from '@/components/shared';
import { useAuth } from '@/hooks/useAuth';
import { PageLoading } from '@/components/shared';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const { loading, user, profile } = useAuth();

    if (loading) {
        return <PageLoading />;
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
