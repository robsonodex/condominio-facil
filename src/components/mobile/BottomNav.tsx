'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Bell, User, DollarSign, DoorOpen, FileText, AlertTriangle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

interface NavItem {
    href: string;
    label: string;
    icon: React.ReactNode;
    showBadge?: boolean;
}

interface BottomNavProps {
    role: 'sindico' | 'morador' | 'porteiro' | 'superadmin';
}

// Configuração de navegação por perfil
const navByRole: Record<string, NavItem[]> = {
    sindico: [
        { href: '/app/dashboard', label: 'Home', icon: <Home /> },
        { href: '/app/financeiro', label: 'Financeiro', icon: <DollarSign /> },
        { href: '/app/avisos', label: 'Avisos', icon: <Bell />, showBadge: true },
        { href: '/app/perfil', label: 'Perfil', icon: <User /> },
    ],
    morador: [
        { href: '/app/dashboard', label: 'Home', icon: <Home /> },
        { href: '/app/avisos', label: 'Avisos', icon: <Bell />, showBadge: true },
        { href: '/app/ocorrencias', label: 'Ocorrências', icon: <AlertTriangle /> },
        { href: '/app/perfil', label: 'Perfil', icon: <User /> },
    ],
    porteiro: [
        { href: '/app/dashboard', label: 'Home', icon: <Home /> },
        { href: '/app/cameras', label: 'Câmeras', icon: <DoorOpen /> },
        { href: '/app/ocorrencias', label: 'Ocorrências', icon: <AlertTriangle /> },
        { href: '/app/perfil', label: 'Perfil', icon: <User /> },
    ],
    superadmin: [
        { href: '/app/dashboard', label: 'Home', icon: <Home /> },
        { href: '/app/condos', label: 'Condos', icon: <Home /> },
        { href: '/app/perfil', label: 'Perfil', icon: <User /> },
    ],
};

/**
 * Navegação inferior mobile-first
 * Touch-friendly com feedback visual
 */
export function BottomNav({ role }: BottomNavProps) {
    const pathname = usePathname();
    const items = navByRole[role] || navByRole.morador;
    const [unreadCount, setUnreadCount] = useState(0);
    const supabase = createClient();

    // Buscar quantidade de avisos não lidos
    useEffect(() => {
        const fetchUnread = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                if (!session?.user) return;

                // Buscar perfil do usuário
                const { data: profile } = await supabase
                    .from('users')
                    .select('id, condo_id')
                    .eq('email', session.user.email)
                    .single();

                if (!profile?.condo_id) return;

                // Buscar avisos dos últimos 30 dias
                const thirtyDaysAgo = new Date();
                thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

                const { data: notices } = await supabase
                    .from('notices')
                    .select('id')
                    .eq('condo_id', profile.condo_id)
                    .gte('data_publicacao', thirtyDaysAgo.toISOString());

                // Buscar avisos já lidos
                const { data: readNotices } = await supabase
                    .from('notice_reads')
                    .select('notice_id')
                    .eq('user_id', profile.id);

                const readIds = new Set(readNotices?.map(r => r.notice_id) || []);
                const unread = notices?.filter(n => !readIds.has(n.id)) || [];
                setUnreadCount(unread.length);
            } catch (error) {
                console.error('Error fetching unread:', error);
            }
        };

        fetchUnread();
    }, []);

    return (
        <nav className="app-bottom-nav">
            {items.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                return (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={`app-nav-item ${isActive ? 'active' : ''}`}
                        style={{ position: 'relative' }}
                    >
                        {item.icon}
                        {item.showBadge && unreadCount > 0 && (
                            <span style={{
                                position: 'absolute',
                                top: 4,
                                right: '50%',
                                transform: 'translateX(12px)',
                                minWidth: 16,
                                height: 16,
                                background: '#ef4444',
                                color: 'white',
                                fontSize: 9,
                                fontWeight: 'bold',
                                borderRadius: 8,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                padding: '0 4px',
                            }}>
                                {unreadCount > 9 ? '9+' : unreadCount}
                            </span>
                        )}
                        <span>{item.label}</span>
                    </Link>
                );
            })}
        </nav>
    );
}

export default BottomNav;
