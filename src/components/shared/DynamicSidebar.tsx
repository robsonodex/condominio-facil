'use client';

import { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import * as Icons from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface MenuItem {
    key: string;
    label: string;
    icon: string;
    href: string;
    order: number;
    visible: boolean;
    requiresFeature?: string; // Ex: 'module_whatsapp'
}

export function DynamicSidebar() {
    const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
    const [isEditMode, setIsEditMode] = useState(false);
    const pathname = usePathname();

    useEffect(() => {
        loadSidebarConfig();
    }, []);

    const loadSidebarConfig = async () => {
        const res = await fetch('/api/sidebar/config');
        const data = await res.json();
        setMenuItems(data.menuItems || getDefaultMenu());
    };

    const saveSidebarConfig = async () => {
        await fetch('/api/sidebar/config', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ menuItems })
        });
        setIsEditMode(false);
    };

    const handleDragEnd = (result: any) => {
        if (!result.destination) return;

        const items = Array.from(menuItems);
        const [reorderedItem] = items.splice(result.source.index, 1);
        items.splice(result.destination.index, 0, reorderedItem);

        // Atualizar ordem
        const updatedItems = items.map((item, index) => ({
            ...item,
            order: index + 1
        }));

        setMenuItems(updatedItems);
    };

    const toggleVisibility = (key: string) => {
        setMenuItems(prev => prev.map(item =>
            item.key === key ? { ...item, visible: !item.visible } : item
        ));
    };

    const visibleItems = menuItems
        .filter(item => item.visible)
        .sort((a, b) => a.order - b.order);

    return (
        <aside className="w-64 bg-slate-900 text-white h-screen flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-slate-700 flex justify-between items-center">
                <h2 className="font-bold text-lg">Menu</h2>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsEditMode(!isEditMode)}
                >
                    {isEditMode ? '✅ Salvar' : '✏️ Editar'}
                </Button>
            </div>

            {/* Menu Items */}
            {isEditMode ? (
                <DragDropContext onDragEnd={handleDragEnd}>
                    <Droppable droppableId="sidebar">
                        {(provided) => (
                            <div
                                {...provided.droppableProps}
                                ref={provided.innerRef}
                                className="flex-1 p-2 space-y-1"
                            >
                                {menuItems.sort((a, b) => a.order - b.order).map((item, index) => {
                                    const IconComponent = (Icons as any)[item.icon] || Icons.Circle;

                                    return (
                                        <Draggable key={item.key} draggableId={item.key} index={index}>
                                            {(provided, snapshot) => (
                                                <div
                                                    ref={provided.innerRef}
                                                    {...provided.draggableProps}
                                                    {...provided.dragHandleProps}
                                                    className={`flex items-center justify-between p-3 rounded-lg ${snapshot.isDragging ? 'bg-slate-600' : 'bg-slate-800'
                                                        }`}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <Icons.GripVertical className="h-4 w-4 text-slate-500" />
                                                        <IconComponent className="h-5 w-5" />
                                                        <span className="text-sm">{item.label}</span>
                                                    </div>
                                                    <Switch
                                                        checked={item.visible}
                                                        onCheckedChange={() => toggleVisibility(item.key)}
                                                    />
                                                </div>
                                            )}
                                        </Draggable>
                                    );
                                })}
                                {provided.placeholder}
                            </div>
                        )}
                    </Droppable>
                </DragDropContext>
            ) : (
                <nav className="flex-1 p-2 space-y-1">
                    {visibleItems.map((item) => {
                        const IconComponent = (Icons as any)[item.icon] || Icons.Circle;
                        const isActive = pathname === item.href;

                        return (
                            <Link
                                key={item.key}
                                href={item.href}
                                className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${isActive
                                        ? 'bg-blue-600 text-white'
                                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                                    }`}
                            >
                                <IconComponent className="h-5 w-5" />
                                <span>{item.label}</span>
                            </Link>
                        );
                    })}
                </nav>
            )}

            {/* Footer com botão salvar no modo edição */}
            {isEditMode && (
                <div className="p-4 border-t border-slate-700">
                    <Button onClick={saveSidebarConfig} className="w-full">
                        💾 Salvar Configuração
                    </Button>
                </div>
            )}
        </aside>
    );
}

function getDefaultMenu(): MenuItem[] {
    return [
        { key: 'dashboard', label: 'Dashboard', icon: 'LayoutDashboard', href: '/dashboard', order: 1, visible: true },
        { key: 'financeiro', label: 'Financeiro', icon: 'DollarSign', href: '/financeiro', order: 2, visible: true },
        { key: 'moradores', label: 'Moradores', icon: 'Users', href: '/moradores', order: 3, visible: true },
        { key: 'unidades', label: 'Unidades', icon: 'Building2', href: '/unidades', order: 4, visible: true },
        { key: 'ocorrencias', label: 'Ocorrências', icon: 'AlertTriangle', href: '/ocorrencias', order: 5, visible: true },
        { key: 'reservas', label: 'Reservas', icon: 'Calendar', href: '/reservas', order: 6, visible: true },
        { key: 'documentos', label: 'Documentos', icon: 'FileText', href: '/documentos', order: 7, visible: true },
        { key: 'comunicados', label: 'Comunicados', icon: 'Megaphone', href: '/comunicados', order: 8, visible: true },
        { key: 'portaria', label: 'Portaria', icon: 'Shield', href: '/portaria', order: 9, visible: true, requiresFeature: 'module_portaria' },
        { key: 'assembleias', label: 'Assembleias', icon: 'Vote', href: '/assembleias', order: 10, visible: true },
        { key: 'enquetes', label: 'Enquetes', icon: 'BarChart3', href: '/enquetes', order: 11, visible: true },
        { key: 'marketplace', label: 'Marketplace', icon: 'ShoppingBag', href: '/marketplace', order: 12, visible: true },
        { key: 'chat', label: 'Chat', icon: 'MessageCircle', href: '/chat', order: 13, visible: true, requiresFeature: 'module_chat' },
        { key: 'whatsapp', label: 'WhatsApp', icon: 'MessageSquare', href: '/whatsapp', order: 14, visible: true, requiresFeature: 'module_whatsapp' },
        { key: 'ia', label: 'Assistente IA', icon: 'Bot', href: '/assistente-ia', order: 15, visible: true, requiresFeature: 'module_ai_assistant' },
        { key: 'cobranca', label: 'Cobrança Bancária', icon: 'Landmark', href: '/cobranca', order: 16, visible: true, requiresFeature: 'module_banking' },
        { key: 'relatorios', label: 'Relatórios', icon: 'PieChart', href: '/relatorios', order: 17, visible: true },
        { key: 'configuracoes', label: 'Configurações', icon: 'Settings', href: '/configuracoes', order: 18, visible: true },
    ];
}
