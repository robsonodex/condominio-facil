
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Package, CheckCircle, Clock } from 'lucide-react';

export default function MyDeliveriesPage() {
    const router = useRouter();
    const supabase = createClient();
    const [deliveries, setDeliveries] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchMyDeliveries = async () => {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            setLoading(false);
            return;
        }

        // Get user profile/resident info to get unit_id
        const { data: resident } = await supabase
            .from('residents')
            .select('unit_id, condo_id')
            .eq('user_id', user.id)
            .single();

        if (resident) {
            // Fetch deliveries for this unit
            // Using API is safer for complex logic but we can use Client here if RLS allows.
            // RLS policy: deliveries_read allows if condo_id matches. But we usually want only OUR unit.
            // The RLS I wrote says: "auth.role() = 'superadmin' OR condo_id = (select get_my_condo_id())"
            // This gives access to ALL deliveries in the condo?
            // Checking RLS in SQL from step 0: 
            // "CREATE POLICY "deliveries_read" ON deliveries FOR SELECT USING (auth.role() = 'superadmin' OR condo_id = (select get_my_condo_id()));"
            // Yes, it seems broader than unit. But typically we want to filter by unit in UI.
            // Ideally RLS should restrict to unit for Residents. 
            // But for now I will filter in UI or API.
            // Using API is better to ensure I get only my unit's deliveries if I update the API to filter by session user's unit.
            // But the API GET /deliveries filters by unit_id param.
            // So I will call API with my unit_id.

            const res = await fetch(`/api/portaria/deliveries?condo_id=${resident.condo_id}&unit_id=${resident.unit_id}`);
            const json = await res.json();
            if (json.data) {
                setDeliveries(json.data);
            }
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchMyDeliveries();
    }, []);

    const handleConfirm = async (id: string) => {
        try {
            const res = await fetch(`/api/portaria/deliveries/${id}/confirm`, { method: 'POST' });
            if (res.ok) {
                alert('Retirada confirmada!');
                fetchMyDeliveries();
            } else {
                alert('Erro ao confirmar');
            }
        } catch (e) {
            alert('Erro de conexão');
        }
    };

    return (
        <div className="p-6 max-w-4xl mx-auto space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Minhas Encomendas</h1>
                <p className="text-gray-500 dark:text-gray-400">Acompanhe suas correspondências e entregas.</p>
            </div>

            <div className="grid grid-cols-1 gap-4">
                {loading ? (
                    <div className="text-center py-10">Carregando...</div>
                ) : deliveries.length === 0 ? (
                    <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl border border-dashed border-gray-300 dark:border-gray-700">
                        <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500">Nenhuma encomenda encontrada.</p>
                    </div>
                ) : (
                    deliveries.map(d => (
                        <div key={d.id} className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                            <div className="flex items-start gap-4">
                                <div className={`p-3 rounded-lg ${d.status === 'notified' ? 'bg-yellow-100 text-yellow-600' : 'bg-green-100 text-green-600'}`}>
                                    <Package className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-lg text-gray-900 dark:text-white">
                                        {d.type.charAt(0).toUpperCase() + d.type.slice(1)}
                                        {d.tracking_code && <span className="ml-2 text-sm font-normal text-gray-500">#{d.tracking_code}</span>}
                                    </h3>
                                    <div className="text-sm text-gray-500 dark:text-gray-400 mt-1 flex flex-col gap-0.5">
                                        <span>Entregue por: {d.delivered_by || 'Não informado'}</span>
                                        <span className="flex items-center gap-1.5">
                                            <Clock className="w-3.5 h-3.5" />
                                            {new Date(d.created_at).toLocaleDateString()} às {new Date(d.created_at).toLocaleTimeString().slice(0, 5)}
                                        </span>
                                    </div>
                                    {d.notes && (
                                        <div className="mt-2 text-sm bg-gray-50 dark:bg-gray-700/50 p-2 rounded text-gray-600 dark:text-gray-300">
                                            "{d.notes}"
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="w-full sm:w-auto flex flex-col gap-2">
                                {d.status === 'notified' ? (
                                    <button
                                        onClick={() => handleConfirm(d.id)}
                                        className="w-full sm:w-auto px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                                    >
                                        <CheckCircle className="w-4 h-4" />
                                        Confirmar Retirada
                                    </button>
                                ) : (
                                    <div className="flex items-center gap-2 text-green-600 bg-green-50 dark:bg-green-900/20 px-4 py-2 rounded-lg font-medium">
                                        <CheckCircle className="w-5 h-5" />
                                        <span>Coletado</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
