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
    Bot
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
    // Plano Profissional+
    hasOccurrences: boolean;
    hasCommonAreas: boolean;
    hasReports: boolean;
    hasDeliveries: boolean;
    // Plano Premium
    hasAssemblies: boolean;
    hasPolls: boolean;
    hasDocuments: boolean;
    hasMaintenance: boolean;
    hasSuppliers: boolean;
    hasMultipleCondos: boolean;
    hasCameras: boolean;
    hasAutomations: boolean;
    maxUnits: number;
    // Add-ons/Toggles
    hasAI: boolean;
    hasMensageria: boolean;
}


const navItems: NavItem[] = [
    { href: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard className="h-5 w-5" />, roles: ['sindico', 'morador', 'inquilino'] },
    { href: '/status', label: 'Status Geral', icon: <Settings className="h-5 w-5" />, roles: ['sindico'] },
    { href: '/financeiro', label: 'Financeiro', icon: <DollarSign className="h-5 w-5" />, roles: ['sindico'] },
    { href: '/cobrancas', label: 'Cobranças', icon: <CreditCard className="h-5 w-5" />, roles: ['sindico'] },
    { href: '/minhas-cobrancas', label: 'Minhas Cobranças', icon: <CreditCard className="h-5 w-5" />, roles: ['morador', 'inquilino'] },
    { href: '/moradores', label: 'Moradores', icon: <Users className="h-5 w-5" />, roles: ['sindico'] },
    { href: '/unidades', label: 'Unidades', icon: <Home className="h-5 w-5" />, roles: ['sindico'] },
    { href: '/usuarios', label: 'Usuários', icon: <Users className="h-5 w-5" />, roles: ['sindico'] },
    { href: '/avisos', label: 'Avisos', icon: <Bell className="h-5 w-5" />, roles: ['sindico', 'morador', 'inquilino', 'porteiro'] },
    { href: '/notificacoes', label: 'Notificações', icon: <Bell className="h-5 w-5" />, roles: ['sindico'] },
    // Módulos restritos por plano - Profissional+
    { href: '/ocorrencias', label: 'Ocorrências', icon: <AlertTriangle className="h-5 w-5" />, roles: ['sindico', 'morador', 'inquilino', 'porteiro'], requiresFeature: 'hasOccurrences' },
    { href: '/reservas', label: 'Reservas', icon: <Calendar className="h-5 w-5" />, roles: ['sindico', 'morador', 'inquilino'], requiresFeature: 'hasCommonAreas' },
    { href: '/portaria', label: 'Portaria', icon: <UserCheck className="h-5 w-5" />, roles: ['porteiro'], requiresFeature: 'hasOccurrences' },
    { href: '/mensageria', label: 'Mensageria', icon: <Package className="h-5 w-5" />, roles: ['porteiro', 'sindico'], requiresFeature: 'hasMensageria' },
    { href: '/portaria/cameras', label: 'Câmeras', icon: <Settings className="h-5 w-5" />, roles: ['porteiro'], requiresFeature: 'hasCameras' },
    { href: '/portaria/minhas-encomendas', label: 'Minhas Entregas', icon: <Package className="h-5 w-5" />, roles: ['morador', 'inquilino'], requiresFeature: 'hasDeliveries' },
    { href: '/relatorios', label: 'Relatórios', icon: <FileText className="h-5 w-5" />, roles: ['sindico'], requiresFeature: 'hasOccurrences' },
    // Módulos restritos por plano - Premium
    { href: '/automacoes', label: 'Automações', icon: <Settings className="h-5 w-5" />, roles: ['sindico'], requiresFeature: 'hasMaintenance' },
    {
        href: '/governanca',
        label: 'Governança',
        icon: <Vote className="h-5 w-5" />,
        roles: ['sindico'],
        requiresFeature: 'hasAssemblies',
        subItems: [
            { href: '/governanca/enquetes', label: 'Enquetes', icon: <FileText className="h-4 w-4" /> },
            { href: '/governanca/assembleias', label: 'Assembleias', icon: <Users className="h-4 w-4" /> },
            { href: '/governanca/documents', label: 'Documentos', icon: <FileText className="h-4 w-4" /> },
        ]
    },
    { href: '/manutencao', label: 'Manutenção Preventiva', icon: <Settings className="h-5 w-5" />, roles: ['sindico'], requiresFeature: 'hasMaintenance' },
    // Configurações (sempre visíveis para síndico)
    { href: '/configuracoes/condominio', label: 'Meu Condomínio', icon: <Building2 className="h-5 w-5 text-emerald-500" />, roles: ['sindico'] },
    { href: '/configuracoes/integracao-whatsapp', label: 'WhatsApp Oficial', icon: <MessageCircle className="h-5 w-5 text-green-500" />, roles: ['sindico'] },
    { href: '/configuracoes/integracao-pagamentos', label: 'Integração Premium', icon: <Zap className="h-5 w-5 text-amber-400" />, roles: ['sindico'] },
    { href: '/configuracoes/pix', label: 'Configurar PIX', icon: <QrCode className="h-5 w-5" />, roles: ['sindico'] },
    // Módulo de IA - sempre visível para síndico (deploy 20/12 12:42)
    { href: '/configuracoes/assistente', label: '🤖 Assistente IA', icon: <Bot className="h-5 w-5 text-purple-500" />, roles: ['sindico'] },
    { href: '/assinatura', label: 'Assinatura', icon: <CreditCard className="h-5 w-5" />, roles: ['sindico'] },
    { href: '/sugestoes', label: 'Sugestões', icon: <Lightbulb className="h-5 w-5" />, roles: ['sindico', 'morador', 'inquilino', 'porteiro'] },
    { href: '/perfil', label: 'Meu Perfil', icon: <Settings className="h-5 w-5" /> },
    { href: '/portaria/deliveries/list', label: 'Encomendas (Porteiro)', icon: <Package className="h-5 w-5" />, roles: ['porteiro'], requiresFeature: 'hasOccurrences' },
    { href: '/app/deliveries', label: 'Minhas Encomendas (Morador)', icon: <Package className="h-5 w-5" />, roles: ['morador', 'inquilino'], requiresFeature: 'hasOccurrences' },
    // Chat da IA para moradores
    { href: '/assistente', label: 'Assistente', icon: <Bot className="h-5 w-5 text-purple-500" />, roles: ['morador', 'inquilino'], requiresFeature: 'hasAI' },
];


const adminItems: NavItem[] = [
    { href: '/admin', label: 'Dashboard', icon: <LayoutDashboard className="h-5 w-5" /> },
    { href: '/admin/condominios', label: 'Condomínios', icon: <Building2 className="h-5 w-5" /> },
    { href: '/admin/planos', label: 'Planos', icon: <CreditCard className="h-5 w-5" /> },
    { href: '/admin/usuarios', label: 'Usuários', icon: <Users className="h-5 w-5" /> },
    { href: '/admin/assinaturas', label: 'Assinaturas', icon: <Settings className="h-5 w-5" /> },
    { href: '/admin/cobrancas', label: 'Cobranças', icon: <DollarSign className="h-5 w-5" /> },
    { href: '/admin/suporte', label: 'Central de Suporte', icon: <MessageCircle className="h-5 w-5" /> },
    { href: '/admin/erros', label: 'Erros', icon: <AlertTriangle className="h-5 w-5" /> },
];

import { ImpersonateModal } from '@/components/admin/ImpersonateModal';
import { RoleViewSwitcher, useViewAsRole } from '@/components/admin/RoleViewSwitcher';

export function Sidebar({ isOpen, onClose }: SidebarProps) {
    const pathname = usePathname();
    const { profile, isSuperAdmin, isSuperAdminReal, isImpersonating } = useUser();
    const viewAsRole = useViewAsRole();
    const [planFeatures, setPlanFeatures] = useState<PlanFeatures | null>(null);
    const [mensageriaAtivo, setMensageriaAtivo] = useState<boolean>(false);
    const [expandedItems, setExpandedItems] = useState<string[]>(['/governanca']);
    const [pendingChats, setPendingChats] = useState(0);
    const supabase = createClient();

    useEffect(() => {
        // Fetch plan features for non-superadmins
        if (!isSuperAdmin) {
            fetch('/api/plan-features')
                .then(res => res.json())
                .then(data => {
                    setPlanFeatures(data);
                    // Também pegar hasMensageria da resposta
                    if (data?.hasMensageria !== undefined) {
                        setMensageriaAtivo(data.hasMensageria);
                    }
                })
                .catch(err => console.error('[Sidebar] Error fetching plan features:', err));
        }

        // Fetch pending chats for superadmin
        if (isSuperAdmin) {
            fetchPendingChats();
            // Atualizar a cada 30 segundos
            const interval = setInterval(fetchPendingChats, 30000);
            return () => clearInterval(interval);
        }
    }, [isSuperAdmin]);

    // Busca direta do mensageria_ativo do condomínio como fallback
    useEffect(() => {
        if (profile?.condo_id && !isSuperAdmin) {
            supabase
                .from('condos')
                .select('mensageria_ativo')
                .eq('id', profile.condo_id)
                .single()
                .then(({ data }) => {
                    if (data?.mensageria_ativo !== undefined) {
                        setMensageriaAtivo(data.mensageria_ativo);
                    }
                });
        }
    }, [profile?.condo_id, isSuperAdmin]);

    const fetchPendingChats = async () => {
        try {
            const res = await fetch('/api/admin/pending-chats');
            if (res.ok) {
                const data = await res.json();
                const newCount = data.count || 0;

                // Tocar som se houver novas mensagens
                if (newCount > pendingChats && pendingChats >= 0) {
                    playNotificationSound();
                }

                setPendingChats(newCount);
            }
        } catch (err) {
            console.error('[Sidebar] Error fetching pending chats:', err);
        }
    };

    const playNotificationSound = () => {
        try {
            const audio = new Audio('/sounds/52pj7t0b7w3-notification-sfx-10.mp3');
            audio.volume = 0.5;
            audio.play().catch(e => console.log('[Sidebar] Could not play sound:', e));
        } catch (e) {
            console.log('[Sidebar] Audio not supported');
        }
    };

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


    // Determine effective role for filtering (superadmin can use viewAsRole)
    const effectiveFilterRole = isSuperAdminReal && !isImpersonating && viewAsRole !== 'superadmin'
        ? viewAsRole
        : profile?.role || '';

    // Debug log
    console.log('[SIDEBAR] effectiveFilterRole:', effectiveFilterRole, 'mensageriaAtivo:', mensageriaAtivo, 'planFeatures:', planFeatures);

    const filteredNavItems = navItems.filter(item => {
        // Check role permissions using effective role
        if (item.roles && !item.roles.includes(effectiveFilterRole)) return false;

        // Check plan features
        if (item.requiresFeature) {
            // hasMensageria sempre verifica o estado local (busca direta do condo)
            if (item.requiresFeature === 'hasMensageria') {
                return mensageriaAtivo === true;
            }

            // Se planFeatures está carregado, verificar
            if (planFeatures) {
                // Sindico e Porteiro should always see their other modules to avoid confusion
                if (effectiveFilterRole === 'sindico' || effectiveFilterRole === 'porteiro') return true;

                return planFeatures[item.requiresFeature as keyof PlanFeatures] === true;
            }
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
                    <div className="px-6 pt-4 space-y-3">
                        <ImpersonateModal />
                        {isSuperAdminReal && !isImpersonating && <RoleViewSwitcher />}
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
                                    badge={item.href === '/admin/suporte' ? pendingChats : undefined}
                                />
                            ))}
                            <div className="my-4 border-t border-gray-200" />
                        </>
                    )}

                    {filteredNavItems.length > 0 && (
                        <p className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                            Menu
                        </p>
                    )}
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
                                            {item.subItems.map((subItem) => (
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

function NavLink({ item, isActive, onClick, isSubItem, badge }: { item: NavItem; isActive: boolean; onClick: () => void; isSubItem?: boolean; badge?: number }) {
    return (
        <Link
            href={item.href}
            onClick={onClick}
            className={cn(
                'flex items-center justify-between gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                isSubItem && 'text-xs pl-4',
                isActive
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
            )}
        >
            <div className="flex items-center gap-3">
                {item.icon}
                {item.label}
            </div>
            {badge != null && badge > 0 && (
                <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white px-1.5">
                    {badge > 99 ? '99+' : badge}
                </span>
            )}
        </Link>
    );
}
