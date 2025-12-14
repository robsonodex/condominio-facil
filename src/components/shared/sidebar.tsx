'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useUser } from '@/hooks/useUser';
import { useState, useEffect } from 'react';
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
    Calendar,
    Package,
    X,
    Lock,
    Vote,
    ChevronDown,
    ChevronRight
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
    requiresFeature?: string;
    subItems?: NavItem[];
}

interface PlanFeatures {
    hasAssemblies: boolean;
    hasPolls: boolean;
    hasDocuments: boolean;
    hasCommonAreas: boolean;
    hasOccurrences: boolean;
    hasMaintenance: boolean;
    hasSuppliers: boolean;
    hasMultipleCondos: boolean;
    maxUnits: number;
}

const navItems: NavItem[] = [
    { href: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard className="h-5 w-5" /> },
    { href: '/status', label: 'Status Geral', icon: <Settings className="h-5 w-5" />, roles: ['superadmin', 'sindico'] },
    { href: '/financeiro', label: 'Financeiro', icon: <DollarSign className="h-5 w-5" />, roles: ['superadmin', 'sindico'] },
    { href: '/cobrancas', label: 'Cobranças', icon: <CreditCard className="h-5 w-5" />, roles: ['superadmin', 'sindico'] },
    { href: '/minhas-cobrancas', label: 'Minhas Cobranças', icon: <CreditCard className="h-5 w-5" />, roles: ['morador', 'inquilino'] },
    { href: '/moradores', label: 'Moradores', icon: <Users className="h-5 w-5" />, roles: ['superadmin', 'sindico', 'porteiro'] },
    { href: '/unidades', label: 'Unidades', icon: <Home className="h-5 w-5" />, roles: ['superadmin', 'sindico', 'porteiro'] },
    { href: '/usuarios', label: 'Usuários', icon: <Users className="h-5 w-5" />, roles: ['superadmin', 'sindico'] },
    { href: '/avisos', label: 'Avisos', icon: <Bell className="h-5 w-5" /> },
    { href: '/notificacoes', label: 'Notificações', icon: <Bell className="h-5 w-5" />, roles: ['superadmin', 'sindico'] },
    { href: '/ocorrencias', label: 'Ocorrências', icon: <AlertTriangle className="h-5 w-5" />, requiresFeature: 'hasOccurrences' },
    { href: '/reservas', label: 'Reservas', icon: <Calendar className="h-5 w-5" />, requiresFeature: 'hasCommonAreas' },
    { href: '/portaria', label: 'Portaria', icon: <UserCheck className="h-5 w-5" />, roles: ['superadmin', 'sindico', 'porteiro'] },
    { href: '/portaria/cameras', label: 'Câmeras', icon: <Settings className="h-5 w-5" />, roles: ['superadmin', 'sindico', 'porteiro'] },
    { href: '/portaria/minhas-encomendas', label: 'Minhas Encomendas', icon: <Package className="h-5 w-5" />, roles: ['superadmin', 'sindico'] },
    { href: '/relatorios', label: 'Relatórios', icon: <FileText className="h-5 w-5" />, roles: ['superadmin', 'sindico'] },
    { href: '/automacoes', label: 'Automações', icon: <Settings className="h-5 w-5" />, roles: ['superadmin', 'sindico'] },
    {
        href: '/governanca',
        label: 'Governança',
        icon: <Vote className="h-5 w-5" />,
        roles: ['superadmin', 'sindico'],
        subItems: [
            { href: '/governanca/enquetes', label: 'Enquetes', icon: <FileText className="h-4 w-4" />, requiresFeature: 'hasPolls' },
            { href: '/governanca/assembleias', label: 'Assembleias', icon: <Users className="h-4 w-4" />, requiresFeature: 'hasAssemblies' },
            { href: '/governanca/documents', label: 'Documentos', icon: <FileText className="h-4 w-4" />, requiresFeature: 'hasDocuments' },
        ]
    },
    { href: '/manutencao', label: 'Manutenção', icon: <Settings className="h-5 w-5" />, roles: ['superadmin', 'sindico'], requiresFeature: 'hasMaintenance' },
    { href: '/assinatura', label: 'Assinatura', icon: <CreditCard className="h-5 w-5" />, roles: ['superadmin', 'sindico'] },
    { href: '/perfil', label: 'Meu Perfil', icon: <Settings className="h-5 w-5" /> },
    { href: '/portaria/deliveries/list', label: 'Encomendas (Porteiro)', icon: <Package className="h-5 w-5" />, roles: ['porteiro'] },
    { href: '/app/deliveries', label: 'Minhas Encomendas (Morador)', icon: <Package className="h-5 w-5" />, roles: ['morador', 'inquilino'] },
];

const adminItems: NavItem[] = [
    { href: '/admin', label: 'Dashboard', icon: <LayoutDashboard className="h-5 w-5" /> },
    { href: '/admin/condominios', label: 'Condomínios', icon: <Building2 className="h-5 w-5" /> },
    { href: '/admin/planos', label: 'Planos', icon: <CreditCard className="h-5 w-5" /> },
    { href: '/admin/usuarios', label: 'Usuários', icon: <Users className="h-5 w-5" /> },
    { href: '/admin/assinaturas', label: 'Assinaturas', icon: <Settings className="h-5 w-5" /> },
    { href: '/admin/cobrancas', label: 'Cobranças', icon: <DollarSign className="h-5 w-5" /> },
    { href: '/admin/erros', label: 'Erros', icon: <AlertTriangle className="h-5 w-5" /> },
];

import { ImpersonateModal } from '@/components/admin/ImpersonateModal';

export function Sidebar({ isOpen, onClose }: SidebarProps) {
    const pathname = usePathname();
    const { profile, isSuperAdmin, isSuperAdminReal, isImpersonating } = useUser();
    const [planFeatures, setPlanFeatures] = useState<PlanFeatures | null>(null);
    const [expandedItems, setExpandedItems] = useState<string[]>(['/governanca']);

    useEffect(() => {
        // Fetch plan features for non-superadmins
        if (!isSuperAdmin) {
            fetch('/api/plan-features')
                .then(res => res.json())
                .then(data => setPlanFeatures(data))
                .catch(err => console.error('[Sidebar] Error fetching plan features:', err));
        }
    }, [isSuperAdmin]);

    // Auto-expand Governança if on a sub-route
    useEffect(() => {
        if (pathname.startsWith('/governanca')) {
            setExpandedItems(prev => [...new Set([...prev, '/governanca'])]);
        }
    }, [pathname]);

    const toggleExpand = (href: string) => {
        setExpandedItems(prev =>
            prev.includes(href)
                ? prev.filter(item => item !== href)
                : [...prev, href]
        );
    };

    const filteredNavItems = navItems.filter(item => {
        // Superadmin sees everything
        if (isSuperAdmin) return true;

        // Check role permissions
        if (item.roles && !item.roles.includes(profile?.role || '')) return false;

        // Check plan features
        if (item.requiresFeature && planFeatures) {
            return planFeatures[item.requiresFeature as keyof PlanFeatures] === true;
        }

        return true;
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
                        <div className="flex flex-col leading-tight">
                            <span
                                className="text-xs text-emerald-500 italic font-medium -mb-1"
                                style={{ transform: 'rotate(-8deg)', marginLeft: '-2px' }}
                            >
                                Meu
                            </span>
                            <span className="font-bold text-gray-900">Condomínio Fácil</span>
                        </div>
                    </Link>
                    <button
                        onClick={onClose}
                        className="p-1 rounded-lg hover:bg-gray-100 lg:hidden"
                    >
                        <X className="h-5 w-5 text-gray-500" />
                    </button>
                </div>

                {/* SUPERADMIN ACTIONS */}
                {(isSuperAdminReal || isImpersonating) && (
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
                        <div key={item.href}>
                            {item.subItems ? (
                                <>
                                    <button
                                        onClick={() => toggleExpand(item.href)}
                                        className={cn(
                                            'w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                                            pathname.startsWith(item.href)
                                                ? 'bg-emerald-50 text-emerald-700'
                                                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                                        )}
                                    >
                                        <div className="flex items-center gap-3">
                                            {item.icon}
                                            {item.label}
                                        </div>
                                        {expandedItems.includes(item.href) ? (
                                            <ChevronDown className="h-4 w-4" />
                                        ) : (
                                            <ChevronRight className="h-4 w-4" />
                                        )}
                                    </button>
                                    {expandedItems.includes(item.href) && (
                                        <div className="ml-4 mt-1 space-y-1">
                                            {item.subItems.map(subItem => (
                                                <NavLink
                                                    key={subItem.href}
                                                    item={subItem}
                                                    isActive={pathname === subItem.href}
                                                    onClick={onClose}
                                                    isSubItem
                                                />
                                            ))}
                                        </div>
                                    )}
                                </>
                            ) : (
                                <NavLink
                                    item={item}
                                    isActive={pathname.startsWith(item.href)}
                                    onClick={onClose}
                                />
                            )}
                        </div>
                    ))}
                </nav>
            </aside>
        </>
    );
}

function NavLink({ item, isActive, onClick, isSubItem }: { item: NavItem; isActive: boolean; onClick: () => void; isSubItem?: boolean }) {
    return (
        <Link
            href={item.href}
            onClick={onClick}
            className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                isSubItem && 'text-xs pl-4',
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
