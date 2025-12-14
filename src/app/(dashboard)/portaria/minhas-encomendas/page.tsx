'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, Button, Badge } from '@/components/ui';
import { createClient } from '@/lib/supabase/client';
import { useUser } from '@/hooks/useUser';
import { formatDateTime } from '@/lib/utils';
import { Package, Search, CheckCircle, Clock, Undo2 } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface Delivery {
    id: string;
    tracking_code: string;
    sender: string;
    recipient_name: string;
    unit_number: string;
    status: 'pending' | 'notified' | 'delivered' | 'returned';
    photo_url?: string;
    notes?: string;
    created_at: string;
    delivered_at?: string;
}

export default function MinhasEncomendasPage() {
    const { condoId, isSindico, isSuperAdmin, loading: userLoading } = useUser();
    const [deliveries, setDeliveries] = useState<Delivery[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const supabase = createClient();

    useEffect(() => {
        if (!userLoading && condoId) {
            fetchDeliveries();
        } else if (!userLoading) {
            setLoading(false);
        }
    }, [condoId, userLoading]);

    const fetchDeliveries = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('deliveries')
                .select('*')
                .eq('condo_id', condoId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setDeliveries(data || []);
        } catch (err) {
            console.error('Error fetching deliveries:', err);
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'pending':
                return <Badge variant="warning"><Clock className="h-3 w-3 mr-1" />Pendente</Badge>;
            case 'notified':
                return <Badge variant="info"><Package className="h-3 w-3 mr-1" />Notificado</Badge>;
            case 'delivered':
                return <Badge variant="success"><CheckCircle className="h-3 w-3 mr-1" />Entregue</Badge>;
            case 'returned':
                return <Badge variant="danger"><Undo2 className="h-3 w-3 mr-1" />Devolvido</Badge>;
            default:
                return <Badge>{status}</Badge>;
        }
    };

    const filteredDeliveries = deliveries.filter(d => {
        const matchesSearch =
            d.tracking_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            d.sender?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            d.recipient_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            d.unit_number?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = filterStatus === 'all' || d.status === filterStatus;
        return matchesSearch && matchesStatus;
    });

    const stats = {
        total: deliveries.length,
        pending: deliveries.filter(d => d.status === 'pending' || d.status === 'notified').length,
        delivered: deliveries.filter(d => d.status === 'delivered').length,
        returned: deliveries.filter(d => d.status === 'returned').length,
    };

    if (!isSindico && !isSuperAdmin) {
        return (
            <div className="p-6 text-center">
                <p className="text-gray-500">Acesso restrito a síndicos e administradores.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 p-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Minhas Encomendas</h1>
                <p className="text-gray-500">Visão geral de todas as encomendas do condomínio</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0">
                    <CardContent className="py-4 text-center">
                        <Package className="h-8 w-8 mx-auto opacity-80 mb-2" />
                        <p className="text-2xl font-bold">{stats.total}</p>
                        <p className="text-sm text-blue-100">Total</p>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-amber-500 to-amber-600 text-white border-0">
                    <CardContent className="py-4 text-center">
                        <Clock className="h-8 w-8 mx-auto opacity-80 mb-2" />
                        <p className="text-2xl font-bold">{stats.pending}</p>
                        <p className="text-sm text-amber-100">Aguardando</p>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white border-0">
                    <CardContent className="py-4 text-center">
                        <CheckCircle className="h-8 w-8 mx-auto opacity-80 mb-2" />
                        <p className="text-2xl font-bold">{stats.delivered}</p>
                        <p className="text-sm text-emerald-100">Entregues</p>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-red-500 to-red-600 text-white border-0">
                    <CardContent className="py-4 text-center">
                        <Undo2 className="h-8 w-8 mx-auto opacity-80 mb-2" />
                        <p className="text-2xl font-bold">{stats.returned}</p>
                        <p className="text-sm text-red-100">Devolvidos</p>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-4">
                <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Buscar por código, remetente, destinatário..."
                        className="pl-10"
                    />
                </div>
                <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="border rounded-lg px-3 py-2 bg-white"
                >
                    <option value="all">Todos os status</option>
                    <option value="pending">Pendente</option>
                    <option value="notified">Notificado</option>
                    <option value="delivered">Entregue</option>
                    <option value="returned">Devolvido</option>
                </select>
            </div>

            {/* Deliveries List */}
            <Card>
                <CardHeader>
                    <CardTitle>Histórico de Encomendas</CardTitle>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex justify-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-2 border-emerald-600 border-t-transparent"></div>
                        </div>
                    ) : filteredDeliveries.length === 0 ? (
                        <div className="text-center py-8">
                            <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                            <p className="text-gray-500">Nenhuma encomenda encontrada</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {filteredDeliveries.map((delivery) => (
                                <div key={delivery.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                                    <div className="flex items-center gap-4">
                                        {delivery.photo_url ? (
                                            <img src={delivery.photo_url} alt="Encomenda" className="w-12 h-12 rounded object-cover" />
                                        ) : (
                                            <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center">
                                                <Package className="h-6 w-6 text-gray-400" />
                                            </div>
                                        )}
                                        <div>
                                            <p className="font-medium text-gray-900">
                                                {delivery.recipient_name} - Unidade {delivery.unit_number}
                                            </p>
                                            <p className="text-sm text-gray-500">
                                                {delivery.sender} {delivery.tracking_code && `• ${delivery.tracking_code}`}
                                            </p>
                                            <p className="text-xs text-gray-400">
                                                Recebido em {formatDateTime(delivery.created_at)}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        {getStatusBadge(delivery.status)}
                                        {delivery.delivered_at && (
                                            <p className="text-xs text-gray-400 mt-1">
                                                Retirado em {formatDateTime(delivery.delivered_at)}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
