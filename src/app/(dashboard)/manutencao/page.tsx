'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, Button } from '@/components/ui';
import { createClient } from '@/lib/supabase/client';
import { useUser } from '@/hooks/useUser';
import { Plus, Wrench, Calendar, CheckCircle, Clock, DollarSign, User, Star } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import { OrderModal, SupplierModal } from '@/components/maintenance/MaintenanceModals';

export default function ManutencaoPage() {
    const { condoId, isSindico, isSuperAdmin } = useUser();
    const [orders, setOrders] = useState<any[]>([]);
    const [suppliers, setSuppliers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showOrderModal, setShowOrderModal] = useState(false);
    const [showSupplierModal, setShowSupplierModal] = useState(false);
    const [editingOrder, setEditingOrder] = useState<any>(null);
    const [editingSupplier, setEditingSupplier] = useState<any>(null);
    const supabase = createClient();

    useEffect(() => {
        if (condoId || isSuperAdmin) {
            fetchOrders();
            fetchSuppliers();
        }
    }, [condoId]);

    const fetchOrders = async () => {
        setLoading(true);
        const query = supabase
            .from('maintenance_orders')
            .select('*, supplier:maintenance_suppliers(*)')
            .order('data_agendada', { ascending: true });

        if (!isSuperAdmin && condoId) {
            query.eq('condo_id', condoId);
        }

        const { data } = await query;
        setOrders(data || []);
        setLoading(false);
    };

    const fetchSuppliers = async () => {
        const query = supabase
            .from('maintenance_suppliers')
            .select('*')
            .eq('ativo', true)
            .order('rating', { ascending: false });

        if (!isSuperAdmin && condoId) {
            query.eq('condo_id', condoId);
        }

        const { data } = await query;
        setSuppliers(data || []);
    };

    const handleOrderSuccess = () => {
        fetchOrders();
        setEditingOrder(null);
    };

    const handleSupplierSuccess = () => {
        fetchSuppliers();
        setEditingSupplier(null);
    };

    // Agrupar ordens por status
    const ordersByStatus = {
        agendado: orders.filter(o => o.status === 'agendado'),
        em_execucao: orders.filter(o => o.status === 'em_execucao'),
        concluido: orders.filter(o => o.status === 'concluido'),
    };

    const stats = {
        total: orders.length,
        agendado: ordersByStatus.agendado.length,
        em_execucao: ordersByStatus.em_execucao.length,
        concluido: orders.filter(o =>
            o.status === 'concluido' &&
            new Date(o.data_conclusao) >= new Date(new Date().setDate(1))
        ).length,
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-emerald-600 border-t-transparent"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <Wrench className="h-6 w-6 text-emerald-600" />
                        Gestão de Manutenção
                    </h1>
                    <p className="text-gray-500">Gerencie manutenções preventivas e corretivas</p>
                </div>
                {(isSindico || isSuperAdmin) && (
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            onClick={() => {
                                setEditingSupplier(null);
                                setShowSupplierModal(true);
                            }}
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            Novo Fornecedor
                        </Button>
                        <Button
                            onClick={() => {
                                setEditingOrder(null);
                                setShowOrderModal(true);
                            }}
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            Nova Ordem
                        </Button>
                    </div>
                )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0">
                    <CardContent className="py-4 text-center">
                        <Clock className="h-8 w-8 mx-auto mb-2 opacity-80" />
                        <p className="text-2xl font-bold">{stats.total}</p>
                        <p className="text-sm text-blue-100">Total de Ordens</p>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-indigo-500 to-indigo-600 text-white border-0">
                    <CardContent className="py-4 text-center">
                        <Calendar className="h-8 w-8 mx-auto mb-2 opacity-80" />
                        <p className="text-2xl font-bold">{stats.agendado}</p>
                        <p className="text-sm text-indigo-100">Agendadas</p>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white border-0">
                    <CardContent className="py-4 text-center">
                        <Wrench className="h-8 w-8 mx-auto mb-2 opacity-80" />
                        <p className="text-2xl font-bold">{stats.em_execucao}</p>
                        <p className="text-sm text-orange-100">Em Execução</p>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white border-0">
                    <CardContent className="py-4 text-center">
                        <CheckCircle className="h-8 w-8 mx-auto mb-2 opacity-80" />
                        <p className="text-2xl font-bold">{stats.concluido}</p>
                        <p className="text-sm text-emerald-100">Concluídas (Mês)</p>
                    </CardContent>
                </Card>
            </div>

            {/* Kanban Board */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Coluna 1: Agendado */}
                <KanbanColumn
                    title="Agendado"
                    color="blue"
                    orders={ordersByStatus.agendado}
                    icon={Calendar}
                    onCardClick={(order) => {
                        setEditingOrder(order);
                        setShowOrderModal(true);
                    }}
                />

                {/* Coluna 2: Em Execução */}
                <KanbanColumn
                    title="Em Execução"
                    color="orange"
                    orders={ordersByStatus.em_execucao}
                    icon={Wrench}
                    onCardClick={(order) => {
                        setEditingOrder(order);
                        setShowOrderModal(true);
                    }}
                />

                {/* Coluna 3: Concluído */}
                <KanbanColumn
                    title="Concluído"
                    color="green"
                    orders={ordersByStatus.concluido}
                    icon={CheckCircle}
                    onCardClick={(order) => {
                        setEditingOrder(order);
                        setShowOrderModal(true);
                    }}
                />

                {/* Coluna 4: Fornecedores */}
                <SuppliersPanel
                    suppliers={suppliers}
                    onCardClick={(supplier) => {
                        setEditingSupplier(supplier);
                        setShowSupplierModal(true);
                    }}
                />
            </div>

            {/* Modals */}
            <OrderModal
                isOpen={showOrderModal}
                onClose={() => {
                    setShowOrderModal(false);
                    setEditingOrder(null);
                }}
                onSuccess={handleOrderSuccess}
                order={editingOrder}
                suppliers={suppliers}
            />

            <SupplierModal
                isOpen={showSupplierModal}
                onClose={() => {
                    setShowSupplierModal(false);
                    setEditingSupplier(null);
                }}
                onSuccess={handleSupplierSuccess}
                supplier={editingSupplier}
            />
        </div>
    );
}

// Componente de Coluna Kanban
function KanbanColumn({ title, color, orders, icon: Icon, onCardClick }: { title: string; color: string; orders: any[]; icon: any; onCardClick: (order: any) => void }) {
    const colorClasses: Record<string, string> = {
        blue: 'from-blue-500 to-blue-600',
        orange: 'from-orange-500 to-orange-600',
        green: 'from-emerald-500 to-emerald-600',
    };

    return (
        <div className="space-y-3">
            <div className={`bg-gradient-to-r ${colorClasses[color]} text-white p-3 rounded-lg flex items-center justify-between`}>
                <div className="flex items-center gap-2">
                    <Icon className="h-5 w-5" />
                    <h3 className="font-semibold">{title}</h3>
                </div>
                <span className="bg-white/20 px-2 py-0.5 rounded-full text-sm font-medium">
                    {orders.length}
                </span>
            </div>
            <div className="space-y-3 min-h-[300px]">
                {orders.map((order: any) => (
                    <MaintenanceCard key={order.id} order={order} onClick={() => onCardClick(order)} />
                ))}
                {orders.length === 0 && (
                    <p className="text-center text-gray-400 text-sm py-8">Nenhuma ordem</p>
                )}
            </div>
        </div>
    );
}

// Card de Manutenção
function MaintenanceCard({ order, onClick }: { order: any; onClick?: () => void }) {
    const getPriorityBadge = (prioridade: string): string => {
        const classes: Record<string, string> = {
            alta: 'bg-red-100 text-red-700',
            media: 'bg-amber-100 text-amber-700',
            baixa: 'bg-gray-100 text-gray-700',
        };
        return classes[prioridade] || classes.baixa;
    };

    return (
        <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={onClick}>
            <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between">
                    <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">{order.titulo}</h4>
                        {order.local && (
                            <p className="text-sm text-gray-500">{order.local}</p>
                        )}
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityBadge(order.prioridade)}`}>
                        {order.prioridade?.toUpperCase()}
                    </span>
                </div>

                {order.supplier && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                        <User className="h-4 w-4" />
                        <span>{order.supplier.nome}</span>
                    </div>
                )}

                {order.data_agendada && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar className="h-4 w-4" />
                        <span>{formatDate(order.data_agendada)}</span>
                    </div>
                )}

                {(order.valor_estimado || order.valor_realizado) && (
                    <div className="flex items-center gap-2 text-sm font-medium text-emerald-600">
                        <DollarSign className="h-4 w-4" />
                        <span>{formatCurrency(order.valor_realizado || order.valor_estimado)}</span>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

// Painel de Fornecedores
function SuppliersPanel({ suppliers, onCardClick }: { suppliers: any[]; onCardClick: (supplier: any) => void }) {
    return (
        <div className="space-y-3">
            <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-3 rounded-lg">
                <h3 className="font-semibold">Fornecedores</h3>
            </div>
            <div className="space-y-2">
                {suppliers.map((supplier) => (
                    <Card key={supplier.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => onCardClick(supplier)}>
                        <CardContent className="p-3">
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <h4 className="font-medium text-gray-900 text-sm">{supplier.nome}</h4>
                                    <p className="text-xs text-gray-500">{supplier.especialidade}</p>
                                </div>
                                <div className="flex items-center gap-1">
                                    <Star className="h-3 w-3 text-yellow-500 fill-current" />
                                    <span className="text-xs font-medium">{supplier.rating.toFixed(1)}</span>
                                </div>
                            </div>
                            <div className="mt-2 text-xs text-gray-500">
                                {supplier.total_servicos} serviços
                            </div>
                        </CardContent>
                    </Card>
                ))}
                {suppliers.length === 0 && (
                    <p className="text-center text-gray-400 text-sm py-4">Nenhum fornecedor cadastrado</p>
                )}
            </div>
        </div>
    );
}
