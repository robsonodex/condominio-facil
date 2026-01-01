'use client';

import { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Card, CardContent, CardHeader, CardTitle, Button, Badge } from '@/components/ui';
import { ALL_NAV_ITEMS, NavItem } from '@/lib/sidebar-items';
import { GripVertical, Eye, EyeOff, Save, RefreshCcw } from 'lucide-react';
import { toast } from 'sonner';

interface SidebarItemConfig {
    href: string;
    label: string;
    visible: boolean;
}

export default function SidebarConfigPage() {
    const [config, setConfig] = useState<SidebarItemConfig[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchConfig();
    }, []);

    const fetchConfig = async () => {
        try {
            const res = await fetch(`/api/sidebar/config?t=${Date.now()}`, { cache: 'no-store' });
            const data = await res.json();

            // Merge defaults with saved config
            const savedItems = data.menu_items || [];
            const merged = ALL_NAV_ITEMS.map(item => {
                const saved = savedItems.find((s: any) => s.href === item.href);
                return {
                    href: item.href,
                    label: item.label,
                    visible: saved ? saved.visible : true
                };
            });

            // Reorder based on saved config order if exists
            if (savedItems.length > 0) {
                const ordered = [...savedItems];
                // Add new items that were not in saved config
                merged.forEach(item => {
                    if (!ordered.find(o => o.href === item.href)) {
                        ordered.push(item);
                    }
                });
                // Filter out items that no longer exist in ALL_NAV_ITEMS
                const final = ordered.filter(o => merged.find(m => m.href === o.href));
                setConfig(final);
            } else {
                setConfig(merged);
            }
        } catch (error) {
            console.error('Error fetching sidebar config:', error);
            toast.error('Erro ao carregar configurações');
        } finally {
            setLoading(false);
        }
    };

    const onDragEnd = (result: any) => {
        if (!result.destination) return;

        const items = Array.from(config);
        const [reorderedItem] = items.splice(result.source.index, 1);
        items.splice(result.destination.index, 0, reorderedItem);

        setConfig(items);
    };

    const toggleVisibility = (href: string) => {
        setConfig(prev => prev.map(item =>
            item.href === href ? { ...item, visible: !item.visible } : item
        ));
    };

    const saveConfig = async () => {
        setSaving(true);
        try {
            const res = await fetch('/api/sidebar/config', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ menu_items: config })
            });

            if (res.ok) {
                toast.success('Configuração salva com sucesso!');
                // Forçar reload da sidebar no layout (opcional, layout pode ouvir ou dar reload)
                window.location.reload();
            } else {
                throw new Error('Failed to save');
            }
        } catch (error) {
            toast.error('Erro ao salvar configuração');
        } finally {
            setSaving(false);
        }
    };

    const resetToDefault = () => {
        if (confirm('Deseja resetar o menu para a ordem padrão?')) {
            setConfig(ALL_NAV_ITEMS.map(item => ({
                href: item.href,
                label: item.label,
                visible: true
            })));
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-emerald-600 border-t-transparent"></div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Personalizar Menu</h1>
                    <p className="text-gray-500">Arraste para reordenar e clique no olho para ocultar itens</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={resetToDefault}>
                        <RefreshCcw className="h-4 w-4 mr-2" />
                        Padrão
                    </Button>
                    <Button onClick={saveConfig} disabled={saving} variant="primary">
                        <Save className="h-4 w-4 mr-2" />
                        {saving ? 'Salvando...' : 'Salvar Alterações'}
                    </Button>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Ordem dos Itens do Menu</CardTitle>
                </CardHeader>
                <CardContent>
                    <DragDropContext onDragEnd={onDragEnd}>
                        <Droppable droppableId="sidebar-items">
                            {(provided) => (
                                <div
                                    {...provided.droppableProps}
                                    ref={provided.innerRef}
                                    className="space-y-2"
                                >
                                    {config.map((item, index) => (
                                        <Draggable key={item.href} draggableId={item.href} index={index}>
                                            {(provided, snapshot) => (
                                                <div
                                                    ref={provided.innerRef}
                                                    {...provided.draggableProps}
                                                    className={cn(
                                                        "flex items-center justify-between p-3 bg-white border rounded-lg transition-shadow",
                                                        snapshot.isDragging ? "shadow-lg border-emerald-300 ring-2 ring-emerald-100" : "hover:border-gray-300",
                                                        !item.visible && "opacity-60 bg-gray-50"
                                                    )}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div {...provided.dragHandleProps} className="text-gray-400 hover:text-gray-600">
                                                            <GripVertical className="h-5 w-5" />
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className={cn("font-medium", !item.visible && "line-through text-gray-400")}>
                                                                {item.label}
                                                            </span>
                                                            <span className="text-xs text-gray-400">{item.href}</span>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-2">
                                                        {!item.visible && (
                                                            <Badge variant="secondary" className="text-[10px]">Oculto</Badge>
                                                        )}
                                                        <button
                                                            onClick={() => toggleVisibility(item.href)}
                                                            className={cn(
                                                                "p-2 rounded-md transition-colors",
                                                                item.visible ? "text-emerald-600 hover:bg-emerald-50" : "text-gray-400 hover:bg-gray-100"
                                                            )}
                                                            title={item.visible ? "Ocultar do menu" : "Mostrar no menu"}
                                                        >
                                                            {item.visible ? <Eye className="h-5 w-5" /> : <EyeOff className="h-5 w-5" />}
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </Draggable>
                                    ))}
                                    {provided.placeholder}
                                </div>
                            )}
                        </Droppable>
                    </DragDropContext>
                </CardContent>
            </Card>
        </div>
    );
}

// Helper function to concatenate classes (copied if not available, but should be in lib/utils)
function cn(...inputs: any[]) {
    return inputs.filter(Boolean).join(' ');
}
