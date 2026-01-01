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
    Settings,
    Shield,
    QrCode,
    Zap,
    MessageCircle,
    Vote,
    Lightbulb,
    Bot,
    Mail,
    Hammer,
    Flame,
    Search,
    Store
} from 'lucide-react';
import React from 'react';

export interface NavItem {
    href: string;
    label: string;
    icon: React.ReactNode;
    roles?: string[];
    requiresFeature?: string;
    subItems?: NavItem[];
}

export const ALL_NAV_ITEMS: NavItem[] = [
    { href: '/portaria', label: 'Portaria', icon: <UserCheck className="h-5 w-5" />, roles: ['porteiro'] },
    { href: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard className="h-5 w-5" />, roles: ['sindico', 'morador', 'inquilino'] },
    { href: '/configuracoes/sidebar', label: 'Personalizar Menu', icon: <Settings className="h-5 w-5 text-indigo-500" />, roles: ['sindico'] },
    { href: '/status', label: 'Status Geral', icon: <Settings className="h-5 w-5" />, roles: ['sindico'] },
    { href: '/financeiro', label: 'Financeiro', icon: <DollarSign className="h-5 w-5" />, roles: ['sindico'] },
    { href: '/auditor-orcamentos', label: 'Auditor IA', icon: <Search className="h-5 w-5 text-purple-500" />, roles: ['sindico'] },
    { href: '/taxa-incendio', label: 'Taxa de Incêndio', icon: <Flame className="h-5 w-5 text-red-500" />, roles: ['sindico'] },
    { href: '/cobrancas', label: 'Cobranças', icon: <CreditCard className="h-5 w-5" />, roles: ['sindico'] },
    { href: '/minhas-cobrancas', label: 'Minhas Cobranças', icon: <CreditCard className="h-5 w-5" />, roles: ['morador', 'inquilino'] },
    { href: '/moradores', label: 'Moradores', icon: <Users className="h-5 w-5" />, roles: ['sindico'] },
    { href: '/unidades', label: 'Unidades', icon: <Home className="h-5 w-5" />, roles: ['sindico'] },
    { href: '/usuarios', label: 'Usuários', icon: <Users className="h-5 w-5" />, roles: ['sindico'] },
    { href: '/avisos', label: 'Mural de Avisos', icon: <Bell className="h-5 w-5" />, roles: ['sindico', 'morador', 'inquilino', 'porteiro'] },
    { href: '/notificacoes', label: 'Notificações', icon: <Bell className="h-5 w-5" />, roles: ['sindico'] },
    { href: '/ocorrencias', label: 'Ocorrências', icon: <AlertTriangle className="h-5 w-5" />, roles: ['sindico', 'morador', 'inquilino', 'porteiro'] },
    { href: '/reservas', label: 'Reservas', icon: <Calendar className="h-5 w-5" />, roles: ['sindico', 'morador', 'inquilino', 'porteiro'] },
    { href: '/mensageria', label: 'Mensageria', icon: <Package className="h-5 w-5" />, roles: ['porteiro', 'sindico'] },
    { href: '/portaria/cameras', label: 'Câmeras', icon: <Settings className="h-5 w-5" />, roles: ['porteiro', 'sindico'] },
    { href: '/relatorios', label: 'Relatórios', icon: <FileText className="h-5 w-5" />, roles: ['sindico'], requiresFeature: 'hasOccurrences' },
    { href: '/chat-moradores', label: 'Chat Moradores', icon: <MessageCircle className="h-5 w-5" />, roles: ['sindico'], requiresFeature: 'hasChatSindico' },
    { href: '/automacoes', label: 'Automações', icon: <Settings className="h-5 w-5" />, roles: ['sindico'], requiresFeature: 'hasMaintenance' },
    {
        href: '/governanca',
        label: 'Governança',
        icon: <Vote className="h-5 w-5" />,
        roles: ['sindico'],
        requiresFeature: 'hasAssemblies',
        subItems: [
            { href: '/governanca/autovistoria', label: 'Autovistoria', icon: <Building2 className="h-4 w-4" /> },
            { href: '/governanca/enquetes', label: 'Enquetes', icon: <FileText className="h-4 w-4" /> },
            { href: '/governanca/assembleias', label: 'Assembleias', icon: <Users className="h-4 w-4" /> },
            { href: '/governanca/documents', label: 'Documentos', icon: <FileText className="h-4 w-4" /> },
        ]
    },
    { href: '/obras', label: 'Obras e Reformas', icon: <Hammer className="h-5 w-5" />, roles: ['sindico', 'morador', 'inquilino'] },
    { href: '/manutencao', label: 'Manutenção Preventiva', icon: <Settings className="h-5 w-5" />, roles: ['sindico'], requiresFeature: 'hasMaintenance' },
    { href: '/configuracoes/condominio', label: 'Meu Condomínio', icon: <Building2 className="h-5 w-5 text-emerald-500" />, roles: ['sindico'] },
    { href: '/configuracoes/integracao-whatsapp', label: 'WhatsApp Oficial', icon: <MessageCircle className="h-5 w-5 text-green-500" />, roles: ['sindico'] },
    { href: '/configuracoes/integracao-pagamentos', label: 'Integração Premium', icon: <Zap className="h-5 w-5 text-amber-400" />, roles: ['sindico'] },
    { href: '/configuracoes/pix', label: 'Configurar PIX', icon: <QrCode className="h-5 w-5" />, roles: ['sindico'] },
    { href: '/configuracoes/email', label: 'Configuração de E-mail', icon: <Mail className="h-5 w-5 text-blue-500" />, roles: ['sindico'] },
    { href: '/configuracoes/assistente', label: 'Assistente IA', icon: <Bot className="h-5 w-5 text-purple-500" />, roles: ['sindico'], requiresFeature: 'hasAI' },
    { href: '/assinatura', label: 'Assinatura', icon: <CreditCard className="h-5 w-5" />, roles: ['sindico'] },
    { href: '/sugestoes', label: 'Sugestões', icon: <Lightbulb className="h-5 w-5" />, roles: ['sindico', 'morador', 'inquilino'] },
    { href: '/marketplace', label: 'Marketplace', icon: <Store className="h-5 w-5 text-emerald-500" />, roles: ['sindico', 'morador', 'inquilino'] },
    { href: '/perfil', label: 'Meu Perfil', icon: <Settings className="h-5 w-5" /> },
    { href: '/minhas-encomendas', label: 'Minhas Encomendas', icon: <Package className="h-5 w-5" />, roles: ['morador', 'inquilino', 'porteiro', 'sindico'], requiresFeature: 'hasMensageria' },
    { href: '/meus-convites', label: 'Meus Convites', icon: <QrCode className="h-5 w-5" />, roles: ['morador', 'inquilino'] },
    { href: '/assistente', label: 'Assistente', icon: <Bot className="h-5 w-5 text-purple-500" />, roles: ['morador', 'inquilino'], requiresFeature: 'hasAI' },
];
