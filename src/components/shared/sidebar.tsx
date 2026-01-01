'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
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
    CreditCard,
    Calendar,
    Package,
    X,
    Lock,
    Settings,
    LogOut,
    Menu,
    Shield,
    QrCode,
    Zap,
    MessageCircle,
    Vote,
    ChevronDown,
    ChevronRight,
    Lightbulb,
    Bot,
    Mail,
    Hammer,
    Flame,
    Search,
    Store
} from 'lucide-react';
import { ImpersonateModal } from '@/components/admin/ImpersonateModal';
import { RoleViewSwitcher, useViewAsRole } from '@/components/admin/RoleViewSwitcher';
import { ALL_NAV_ITEMS, NavItem } from '@/lib/sidebar-items';

interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
}

// NavItem interface moved to @/lib/sidebar-items

interface PlanFeatures {
    hasOccurrences: boolean;
    hasCommonAreas: boolean;
    hasReports: boolean;
    hasDeliveries: boolean;
    hasAssemblies: boolean;
    hasPolls: boolean;
    hasDocuments: boolean;
    hasMaintenance: boolean;
    hasSuppliers: boolean;
    hasMultipleCondos: boolean;
    hasCameras: boolean;
    hasAutomations: boolean;
    maxUnits: number;
    hasAI: boolean;
    hasMensageria: boolean;
    hasChatSindico: boolean;
    hasSupportChat: boolean;
}

// navItems and adminItems moved or managed dynamically
const adminItems: NavItem[] = [
    { href: '/admin', label: 'Dashboard', icon: <LayoutDashboard className="h-5 w-5" /> },
    { href: '/admin/condominios', label: 'Condomínios', icon: <Building2 className="h-5 w-5" /> },
    { href: '/admin/planos', label: 'Planos', icon: <CreditCard className="h-5 w-5" /> },
    { href: '/admin/usuarios', label: 'Usuários', icon: <Users className="h-5 w-5" /> },
    { href: '/admin/assinaturas', label: 'Assinaturas', icon: <Settings className="h-5 w-5" /> },
    { href: '/admin/cobrancas', label: 'Cobranças', icon: <DollarSign className="h-5 w-5" /> },
    { href: '/admin/email', label: 'Config. E-mail', icon: <Mail className="h-5 w-5 text-purple-500" /> },
    { href: '/admin/suporte', label: 'Central de Suporte', icon: <MessageCircle className="h-5 w-5" /> },
    { href: '/admin/erros', label: 'Erros', icon: <AlertTriangle className="h-5 w-5" /> },
];

export function Sidebar({ isOpen, onClose }: SidebarProps) {
    const pathname = usePathname();
    const { profile, isSuperAdmin, isSuperAdminReal, isImpersonating } = useUser();
    const viewAsRole = useViewAsRole();
    const [planFeatures, setPlanFeatures] = useState<PlanFeatures | null>(null);
    const [mensageriaAtivo, setMensageriaAtivo] = useState<boolean>(true);
    const [chatSindicoAtivo, setChatSindicoAtivo] = useState<boolean>(false);
    const [expandedItems, setExpandedItems] = useState<string[]>(['/governanca']);
    const [pendingChats, setPendingChats] = useState(0);
    const [menuConfig, setMenuConfig] = useState<any[]>([]);
    const [themeConfig, setThemeConfig] = useState<any>(null);
    const supabase = createClient();

    useEffect(() => {
        if (!isSuperAdmin) {
            fetch('/api/plan-features')
                .then(res => res.json())
                .then(data => {
                    setPlanFeatures(data);
                    if (data?.hasMensageria !== undefined) {
                        setMensageriaAtivo(data.hasMensageria);
                    }
                })
                .catch(err => console.error('[Sidebar] Error fetching plan features:', err));
        }

        if (isSuperAdmin) {
            fetchPendingChats();
            const interval = setInterval(fetchPendingChats, 30000);
            return () => clearInterval(interval);
        }
    }, [isSuperAdmin]);

    useEffect(() => {
        if (profile?.condo_id) {
            supabase
                .from('condos')
                .select('mensageria_ativo, chat_sindico_ativo')
                .eq('id', profile.condo_id)
                .single()
                .then(({ data }) => {
                    if (data?.mensageria_ativo !== undefined) {
                        setMensageriaAtivo(data.mensageria_ativo);
                    }
                    if (data?.chat_sindico_ativo !== undefined) {
                        setChatSindicoAtivo(data.chat_sindico_ativo);
                    }
                });
        }
    }, [profile?.condo_id]);

    useEffect(() => {
        fetch('/api/sidebar/config')
            .then(res => res.json())
            .then(data => {
                if (data?.menu_items) setMenuConfig(data.menu_items);
                if (data?.theme) setThemeConfig(data.theme);
            })
            .catch(err => console.error('[Sidebar] Error fetching config:', err));
    }, []);

    const fetchPendingChats = async () => {
        try {
            const res = await fetch('/api/admin/pending-chats');
            if (res.ok) {
                const data = await res.json();
                setPendingChats(data.count || 0);
            }
        } catch (err) {
            console.error('[Sidebar] Error fetching pending chats:', err);
        }
    };

    const toggleExpand = (href: string) => {
        setExpandedItems(prev =>
            prev.includes(href) ? prev.filter(item => item !== href) : [...prev, href]
        );
    };

    const effectiveFilterRole = isSuperAdminReal && !isImpersonating && viewAsRole !== 'superadmin'
        ? viewAsRole
        : (profile?.role || '');

    const filteredNavItems = ALL_NAV_ITEMS.filter(item => {
        // 1. Filtragem por role e feature (como antes)
        if (item.roles && !item.roles.includes(effectiveFilterRole)) return false;

        if (item.requiresFeature) {
            if (item.requiresFeature === 'hasMensageria') return mensageriaAtivo;
            if (item.requiresFeature === 'hasChatSindico') return chatSindicoAtivo;
            if (planFeatures) {
                if (effectiveFilterRole === 'sindico' || effectiveFilterRole === 'porteiro') return true;
                return planFeatures[item.requiresFeature as keyof PlanFeatures] === true;
            }
            if (effectiveFilterRole === 'morador' || effectiveFilterRole === 'inquilino') return false;
        }

        // 2. Filtragem por visibilidade salva no banco
        if (menuConfig.length > 0) {
            const saved = menuConfig.find(m => m.href === item.href);
            if (saved && saved.visible === false) return false;
        }

        return true;
    });

    // 3. Ordenação baseada no banco (se existir)
    const sortedNavItems = menuConfig.length > 0
        ? [...filteredNavItems].sort((a, b) => {
            const indexA = menuConfig.findIndex(m => m.href === a.href);
            const indexB = menuConfig.findIndex(m => m.href === b.href);
            // Se um item não está na config, joga pro final
            if (indexA === -1) return 1;
            if (indexB === -1) return -1;
            return indexA - indexB;
        })
        : filteredNavItems;

    return (
        <>
            {isOpen && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={onClose} />}
            <aside className={cn(
                'fixed top-0 left-0 z-50 h-full w-64 bg-white border-r border-gray-200 transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:z-auto',
                isOpen ? 'translate-x-0' : '-translate-x-full'
            )}>
                <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
                    <Link href="/dashboard" className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-lg flex items-center justify-center">
                            <Building2 className="h-5 w-5 text-white" />
                        </div>
                        <div className="flex flex-col leading-tight">
                            <span className="text-xs text-emerald-500 italic font-medium -mb-1" style={{ transform: 'rotate(-8deg)', marginLeft: '-2px' }}>Meu</span>
                            <span className="font-bold text-gray-900">Condomínio Fácil</span>
                        </div>
                    </Link>
                    <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 lg:hidden"><X className="h-5 w-5 text-gray-500" /></button>
                </div>

                <div className="px-6 pt-4 space-y-3">
                    <ImpersonateModal />
                    {isSuperAdminReal && !isImpersonating && <RoleViewSwitcher />}
                </div>

                <nav className="p-4 space-y-1 overflow-y-auto h-[calc(100vh-10rem)]">
                    {profile?.role === 'superadmin' && !isImpersonating && viewAsRole === 'superadmin' && (
                        <>
                            <p className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">Administração</p>
                            {adminItems.map((item) => (
                                <NavLink key={item.href} item={item} isActive={pathname.startsWith(item.href)} onClick={onClose} badge={item.href === '/admin/suporte' ? pendingChats : undefined} />
                            ))}
                            <div className="my-4 border-t border-gray-200" />
                        </>
                    )}

                    {sortedNavItems.length > 0 && <p className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">Menu</p>}
                    {sortedNavItems.map((item) => (
                        <div key={item.href}>
                            {item.subItems ? (
                                <>
                                    <button onClick={() => toggleExpand(item.href)} className={cn('w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors', pathname.startsWith(item.href) ? 'bg-emerald-50 text-emerald-700' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900')}>
                                        <div className="flex items-center gap-3">{item.icon}{item.label}</div>
                                        {expandedItems.includes(item.href) ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                                    </button>
                                    {expandedItems.includes(item.href) && (
                                        <div className="ml-4 mt-1 space-y-1">
                                            {item.subItems.map((subItem) => (
                                                <NavLink key={subItem.href} item={subItem} isActive={pathname === subItem.href} onClick={onClose} isSubItem />
                                            ))}
                                        </div>
                                    )}
                                </>
                            ) : (
                                <NavLink item={item} isActive={pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))} onClick={onClose} />
                            )}
                        </div>
                    ))}
                </nav>
            </aside>
        </>
    );
}

function NavLink({ item, isActive, onClick, isSubItem, badge }: { item: NavItem; isActive: boolean; onClick: () => void; isSubItem?: boolean; badge?: number }) {
    return (
        <Link href={item.href} onClick={onClick} className={cn('flex items-center justify-between gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors', isSubItem && 'text-xs pl-4', isActive ? 'bg-emerald-50 text-emerald-700' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900')}>
            <div className="flex items-center gap-3">{item.icon}{item.label}</div>
            {badge != null && badge > 0 && <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white px-1.5">{badge > 99 ? '99+' : badge}</span>}
        </Link>
    );
}
