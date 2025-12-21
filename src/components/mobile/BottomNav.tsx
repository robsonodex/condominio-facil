'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Bell, User, DollarSign, DoorOpen, FileText, AlertTriangle } from 'lucide-react';

interface NavItem {
    href: string;
    label: string;
    icon: React.ReactNode;
}

interface BottomNavProps {
    role: 'sindico' | 'morador' | 'porteiro' | 'superadmin';
}

// Configuração de navegação por perfil
const navByRole: Record<string, NavItem[]> = {
    sindico: [
        { href: '/app/dashboard', label: 'Home', icon: <Home /> },
        { href: '/app/financeiro', label: 'Financeiro', icon: <DollarSign /> },
        { href: '/app/avisos', label: 'Avisos', icon: <Bell /> },
        { href: '/app/perfil', label: 'Perfil', icon: <User /> },
    ],
    morador: [
        { href: '/app/dashboard', label: 'Home', icon: <Home /> },
        { href: '/app/avisos', label: 'Avisos', icon: <Bell /> },
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

    return (
        <nav className="app-bottom-nav">
            {items.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                return (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={`app-nav-item ${isActive ? 'active' : ''}`}
                    >
                        {item.icon}
                        <span>{item.label}</span>
                    </Link>
                );
            })}
        </nav>
    );
}

export default BottomNav;
