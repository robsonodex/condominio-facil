'use client';

import { ArrowLeft, Menu, LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

interface MobileHeaderProps {
    title: string;
    showBack?: boolean;
    showMenu?: boolean;
    showLogout?: boolean;
}

/**
 * Header mobile compacto e fixo
 */
export function MobileHeader({
    title,
    showBack = false,
    showMenu = false,
    showLogout = false
}: MobileHeaderProps) {
    const router = useRouter();
    const supabase = createClient();

    const handleBack = () => {
        router.back();
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push('/app/login');
    };

    return (
        <header className="app-header">
            {/* Botão esquerdo */}
            <div style={{ position: 'absolute', left: 16, display: 'flex', alignItems: 'center' }}>
                {showBack && (
                    <button
                        onClick={handleBack}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: 'white',
                            padding: 8,
                            cursor: 'pointer'
                        }}
                    >
                        <ArrowLeft size={24} />
                    </button>
                )}
            </div>

            {/* Título */}
            <h1>{title}</h1>

            {/* Botão direito */}
            <div style={{ position: 'absolute', right: 16, display: 'flex', alignItems: 'center' }}>
                {showLogout && (
                    <button
                        onClick={handleLogout}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: 'white',
                            padding: 8,
                            cursor: 'pointer'
                        }}
                    >
                        <LogOut size={20} />
                    </button>
                )}
            </div>
        </header>
    );
}

export default MobileHeader;
