
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Package, Search, Filter, CheckCircle, RotateCcw, RefreshCw, ChevronRight } from 'lucide-react';

export default function DeliveryListPage() {
    const router = useRouter();
    const supabase = createClient();
    const { session } = useAuth();
    const [deliveries, setDeliveries] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState('');
    const [search, setSearch] = useState('');

    const fetchDeliveries = async () => {
        setLoading(true);
        // We'll use the API route to ensure consistent permission handling
        // Construct query
        let url = `/api/portaria/deliveries?`;
        if (filterStatus) url += `status=${filterStatus}&`;

        try {
            const res = await fetch(url, {
                headers: { 'Authorization': `Bearer ${session?.access_token}` },
                credentials: 'include'
            });
            const json = await res.json();
            if (json.data) {
                setDeliveries(json.data);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDeliveries();
    }, [filterStatus]);

    const handleConfirm = async (id: string) => {
        if (!confirm('Confirmar retirada desta entrega?')) return;
        try {
            const res = await fetch(`/api/portaria/deliveries/${id}/confirm`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${session?.access_token}` },
                credentials: 'include'
            });
            if (res.ok) {
                fetchDeliveries();
            } else {
                alert('Erro ao confirmar');
            }
        } catch (e) {
            alert('Erro de conexão');
        }
    };

    const handleReturn = async (id: string) => {
        const reason = prompt('Motivo da devolução:');
        if (reason === null) return;

        try {
            const res = await fetch(`/api/portaria/deliveries/${id}/return`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session?.access_token}`,
                },
                credentials: 'include',
                body: JSON.stringify({ reason })
            });
            if (res.ok) {
                fetchDeliveries();
            } else {
                alert('Erro ao registrar devolução');
            }
        } catch (e) {
            alert('Erro de conexão');
        }
    };

    const getStatusBadge = (status: string) => {
        const styles: any = {
            notified: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
            confirmed: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
            collected: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
            returned: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
            cancelled: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
        };
        const labels: any = {
            notified: 'Aguardando',
            confirmed: 'Confirmado',
            collected: 'Entregue',
            returned: 'Devolvido',
            cancelled: 'Cancelado'
        };
        return (
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status] || styles.cancelled}`}>
                {labels[status] || status}
            </span>
        );
    };

    const filteredList = deliveries.filter(d =>
    (d.tracking_code?.toLowerCase().includes(search.toLowerCase()) ||
        d.resident?.user?.nome?.toLowerCase().includes(search.toLowerCase()) ||
        d.unit?.numero_unidade?.toString().includes(search))
    );

    return (
        <div className="p-6 max-w-6xl mx-auto space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Gerenciar Entregas</h1>
                    <p className="text-gray-500 dark:text-gray-400">Controle de encomendas e correspondências.</p>
                </div>
                <button
                    onClick={() => router.push('/portaria/deliveries/new')}
                    className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium shadow-lg shadow-blue-500/20 transition-all flex items-center gap-2"
                >
                    <Package className="w-5 h-5" />
                    Nova Entrega
                </button>
            </div>

            {/* Filters */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Buscar por morador, unidade ou código..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="w-full pl-10 h-11 rounded-lg border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    />
                </div>
                <div className="w-full md:w-64">
                    <select
                        value={filterStatus}
                        onChange={e => setFilterStatus(e.target.value)}
                        className="w-full h-11 rounded-lg border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 px-4 focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                        <option value="">Todos os Status</option>
                        <option value="notified">Aguardando Retirada</option>
                        <option value="collected">Entregue (Finalizado)</option>
                        <option value="returned">Devolvido</option>
                    </select>
                </div>
                <button
                    onClick={fetchDeliveries}
                    className="p-3 text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    title="Atualizar"
                >
                    <RefreshCw className="w-5 h-5" />
                </button>
            </div>

            {/* List */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-100 dark:border-gray-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 dark:bg-gray-700/50 text-gray-600 dark:text-gray-400 text-sm">
                            <tr>
                                <th className="p-4 font-medium">Data</th>
                                <th className="p-4 font-medium">Unidade / Morador</th>
                                <th className="p-4 font-medium">Detalhes</th>
                                <th className="p-4 font-medium">Status</th>
                                <th className="p-4 font-medium text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                            {loading ? (
                                <tr><td colSpan={5} className="p-8 text-center text-gray-500">Carregando...</td></tr>
                            ) : filteredList.length === 0 ? (
                                <tr><td colSpan={5} className="p-8 text-center text-gray-500">Nenhuma entrega encontrada.</td></tr>
                            ) : filteredList.map((d) => (
                                <tr key={d.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                                    <td className="p-4 text-sm text-gray-600 dark:text-gray-300">
                                        {new Date(d.created_at).toLocaleDateString()}<br />
                                        {new Date(d.created_at).toLocaleTimeString().slice(0, 5)}
                                    </td>
                                    <td className="p-4">
                                        <div className="font-medium text-gray-900 dark:text-white">
                                            {d.unit?.bloco ? `Bl ${d.unit.bloco} - ` : ''} Apt {d.unit?.numero_unidade}
                                        </div>
                                        <div className="text-sm text-gray-500 dark:text-gray-400">
                                            {d.resident?.user?.nome || 'Não identificado'}
                                        </div>
                                    </td>
                                    <td className="p-4 text-sm text-gray-600 dark:text-gray-300">
                                        <div className="flex flex-col gap-1">
                                            <span className="font-medium text-gray-800 dark:text-gray-200">{d.type}</span>
                                            {d.tracking_code && <span className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded w-fit">{d.tracking_code}</span>}
                                            {d.delivered_by && <span className="text-xs text-gray-500">Por: {d.delivered_by}</span>}
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        {getStatusBadge(d.status)}
                                    </td>
                                    <td className="p-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            {d.status === 'notified' && (
                                                <>
                                                    <button
                                                        onClick={() => handleConfirm(d.id)}
                                                        className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                                                        title="Confirmar Retirada"
                                                    >
                                                        <CheckCircle className="w-5 h-5" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleReturn(d.id)}
                                                        className="p-2 text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-lg transition-colors"
                                                        title="Registrar Devolução"
                                                    >
                                                        <RotateCcw className="w-5 h-5" />
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
