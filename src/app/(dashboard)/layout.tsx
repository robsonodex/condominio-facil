'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Sidebar, Header } from '@/components/shared';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';
import { ImpersonationBanner } from '@/components/admin/ImpersonationBanner';
import TrialBanner from '@/components/TrialBanner';
import { DemoBanner } from '@/components/demo/DemoBanner';
import { SupportButton } from '@/components/shared/SupportButton';

function LoadingScreen() {
    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="text-center">
                <Loader2 className="h-10 w-10 text-emerald-600 animate-spin mx-auto mb-4" />
                <p className="text-gray-500">Carregando...</p>
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
    const { loading, user } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const redirectedRef = useRef(false);

    // Redirect to login if not authenticated - only once
    useEffect(() => {
        if (!loading && !user && !redirectedRef.current) {
            redirectedRef.current = true;
            router.replace('/login');
        }
        // Reset ref when user logs in
        if (user) {
            redirectedRef.current = false;
        }
    }, [loading, user, router]);

    // Show loading while checking auth
    if (loading) {
        return <LoadingScreen />;
    }

    // Don't render if not authenticated (will redirect)
    if (!user) {
        return <LoadingScreen />;
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <DemoBanner />
            <ImpersonationBanner />
            <TrialBanner />
            <div className="flex">
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
            <SupportButton planType="profissional" />
        </div>
    );
}
