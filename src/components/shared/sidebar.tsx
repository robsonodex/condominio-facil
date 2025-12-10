'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useUser } from '@/hooks/useUser';
import {
    LayoutDashboard,
    Building2,
    Users,
    Home,
    DollarSign,
    Bell,
    AlertTriangle,
    UserCheck,
    FileText,
    Settings,
    CreditCard,
    X
} from 'lucide-react';

interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
}

interface NavItem {
    href: string;
    label: string;
    icon: React.ReactNode;
    roles?: string[];
}

const navItems: NavItem[] = [
    { href: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard className="h-5 w-5" /> },
    { href: '/financeiro', label: 'Financeiro', icon: <DollarSign className="h-5 w-5" />, roles: ['superadmin', 'sindico'] },
    { href: '/cobrancas', label: 'Cobranças', icon: <CreditCard className="h-5 w-5" />, roles: ['superadmin', 'sindico'] },
    { href: '/minhas-cobrancas', label: 'Minhas Cobranças', icon: <CreditCard className="h-5 w-5" />, roles: ['morador'] },
    { href: '/moradores', label: 'Moradores', icon: <Users className="h-5 w-5" />, roles: ['superadmin', 'sindico', 'porteiro'] },
    { href: '/unidades', label: 'Unidades', icon: <Home className="h-5 w-5" />, roles: ['superadmin', 'sindico', 'porteiro'] },
    { href: '/usuarios', label: 'Usuários', icon: <Users className="h-5 w-5" />, roles: ['superadmin', 'sindico'] },
    { href: '/avisos', label: 'Avisos', icon: <Bell className="h-5 w-5" /> },
    { href: '/ocorrencias', label: 'Ocorrências', icon: <AlertTriangle className="h-5 w-5" /> },
    { href: '/portaria', label: 'Portaria', icon: <UserCheck className="h-5 w-5" />, roles: ['superadmin', 'sindico', 'porteiro'] },
    { href: '/relatorios', label: 'Relatórios', icon: <FileText className="h-5 w-5" />, roles: ['superadmin', 'sindico'] },
    { href: '/assinatura', label: 'Assinatura', icon: <CreditCard className="h-5 w-5" />, roles: ['superadmin', 'sindico'] },
    { href: '/perfil', label: 'Meu Perfil', icon: <Settings className="h-5 w-5" /> },
];

const adminItems: NavItem[] = [
    { href: '/admin', label: 'Dashboard', icon: <LayoutDashboard className="h-5 w-5" /> },
    { href: '/admin/condominios', label: 'Condomínios', icon: <Building2 className="h-5 w-5" /> },
    { href: '/admin/planos', label: 'Planos', icon: <CreditCard className="h-5 w-5" /> },
    { href: '/admin/usuarios', label: 'Usuários', icon: <Users className="h-5 w-5" /> },
    { href: '/admin/assinaturas', label: 'Assinaturas', icon: <Settings className="h-5 w-5" /> },
];

import { ImpersonateModal } from '@/components/admin/ImpersonateModal';

export function Sidebar({ isOpen, onClose }: SidebarProps) {
    const pathname = usePathname();
    const { profile, isSuperAdmin, isSuperAdminReal, isImpersonating } = useUser();

    // SUPERADMIN vê TODOS os menus, sem exceção (se não estiver impersonando, ou se quiser ver)
    // Se estiver impersonando, deve ver o que o target vê?
    // O Dashboard já filtra os dados. O menu deve ser filtrado também?
    // Se isSuperAdmin for true (que agora é false se impersonando syndic), o sidebar se comporta como syndic.
    // Isso é BOM.

    // Mas precisamos da opção de trocar de conta SEMPRE visível para o Superadmin REAL.

    const filteredNavItems = navItems.filter(item => {
        if (isSuperAdmin) return true;
        if (!item.roles) return true;
        return item.roles.includes(profile?.role || '');
    });

    return (
        <>
            {/* Overlay for mobile */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={onClose}
                />
            )}

            {/* Sidebar */}
            <aside
                className={cn(
                    'fixed top-0 left-0 z-50 h-full w-64 bg-white border-r border-gray-200 transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:z-auto',
                    isOpen ? 'translate-x-0' : '-translate-x-full'
                )}
            >
                {/* Logo */}
                <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
                    <Link href="/dashboard" className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-lg flex items-center justify-center">
                            <Building2 className="h-5 w-5 text-white" />
                        </div>
                        <span className="font-bold text-gray-900">Condomínio Fácil</span>
                    </Link>
                    <button
                        onClick={onClose}
                        className="p-1 rounded-lg hover:bg-gray-100 lg:hidden"
                    >
                        <X className="h-5 w-5 text-gray-500" />
                    </button>
                </div>

                {/* SUPERADMIN ACTIONS */}
                {(isSuperAdminReal || isImpersonating) && ( // Show if real admin, even if impersonating
                    <div className="px-6 pt-4">
                        <ImpersonateModal />
                    </div>
                )}

                {/* Navigation */}
                <nav className="p-4 space-y-1 overflow-y-auto h-[calc(100vh-4rem)]">
                    {isSuperAdmin && (
                        <>
                            <p className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                Administração
                            </p>
                            {adminItems.map((item) => (
                                <NavLink
                                    key={item.href}
                                    item={item}
                                    isActive={pathname.startsWith(item.href)}
                                    onClick={onClose}
                                />
                            ))}
                            <div className="my-4 border-t border-gray-200" />
                        </>
                    )}

                    <p className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        {isSuperAdmin ? 'Condomínio' : 'Menu'}
                    </p>
                    {filteredNavItems.map((item) => (
                        <NavLink
                            key={item.href}
                            item={item}
                            isActive={pathname.startsWith(item.href)}
                            onClick={onClose}
                        />
                    ))}
                </nav>
            </aside>
        </>
    );
}

function NavLink({ item, isActive, onClick }: { item: NavItem; isActive: boolean; onClick: () => void }) {
    return (
        <Link
            href={item.href}
            onClick={onClick}
            className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                isActive
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
            )}
        >
            {item.icon}
            {item.label}
        </Link>
    );
}
