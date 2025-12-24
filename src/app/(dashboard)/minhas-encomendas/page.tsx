'use client';

import { useEffect, useState, useMemo } from 'react';
import { Card, CardContent, Badge, Button } from '@/components/ui';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useUser } from '@/hooks/useUser';
import { Package, Clock, Check, AlertCircle, FileText, User } from 'lucide-react';
import { formatDate, formatDateTime } from '@/lib/utils';
import { Modal } from '@/components/ui/modal';

interface Entrega {
    id: string;
    remetente: string;
    descricao: string;
    tipo: string;
    codigo_rastreio: string;
    status: string;
    data_recebimento: string;
    data_retirada: string;
    retirado_por_nome: string;
    signature_url: string;
    recebedor: { nome: string } | null;
}

export default function MinhasEncomendasPage() {
    const { session } = useAuth();
    const { condoId, profile } = useUser();
    const supabase = useMemo(() => createClient(), []);

    const [entregas, setEntregas] = useState<Entrega[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedEntrega, setSelectedEntrega] = useState<Entrega | null>(null);

    const fetchEntregas = async () => {
        if (!profile?.id) return;
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('mensageria_entregas')
                .select(`
                    *,
                    recebedor:users!recebido_por(nome)
                `)
                .eq('morador_id', profile.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setEntregas(data || []);
        } catch (e) {
            console.error('[Minhas Encomendas] Error:', e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEntregas();
    }, [profile?.id]);

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'aguardando': return <Badge variant="warning"><Clock className="h-3 w-3 mr-1" /> Disponível</Badge>;
            case 'notificado': return <Badge variant="primary"><Clock className="h-3 w-3 mr-1" /> Notificado</Badge>;
            case 'retirado': return <Badge variant="success"><Check className="h-3 w-3 mr-1" /> Retirado</Badge>;
            case 'devolvido': return <Badge variant="danger"><AlertCircle className="h-3 w-3 mr-1" /> Devolvido</Badge>;
            default: return <Badge>{status}</Badge>;
        }
    };

    return (
        <div className="p-6 max-w-4xl mx-auto space-y-6">
            <header>
                <h1 className="text-2xl font-bold text-gray-900">Minhas Encomendas</h1>
                <p className="text-gray-500">Acompanhe a chegada e retirada dos seus pacotes.</p>
            </header>

            {loading ? (
                <div className="flex justify-center py-20">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
                </div>
            ) : entregas.length === 0 ? (
                <Card className="border-dashed py-20">
                    <CardContent className="flex flex-col items-center">
                        <Package className="h-12 w-12 text-gray-300 mb-4" />
                        <p className="text-gray-500">Nenhuma encomenda encontrada no seu nome.</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4">
                    {entregas.map((entrega) => (
                        <Card key={entrega.id} className="overflow-hidden hover:shadow-md transition-shadow">
                            <CardContent className="p-0">
                                <div className="p-4 flex items-start justify-between">
                                    <div className="flex gap-4">
                                        <div className={`p-3 rounded-lg ${entrega.status === 'retirado' ? 'bg-gray-100' : 'bg-emerald-50 text-emerald-600'}`}>
                                            <Package className="h-6 w-6" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <h3 className="font-semibold text-gray-900">
                                                    {entrega.remetente || 'Remetente não informado'}
                                                </h3>
                                                {getStatusBadge(entrega.status)}
                                            </div>
                                            <p className="text-sm text-gray-500">{entrega.descricao || 'Sem descrição'}</p>
                                            {entrega.codigo_rastreio && (
                                                <p className="text-xs font-mono text-gray-400 mt-1">RASTREIO: {entrega.codigo_rastreio}</p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs text-gray-400">Recebido em</p>
                                        <p className="text-sm font-medium text-gray-700">{formatDate(entrega.data_recebimento)}</p>
                                    </div>
                                </div>

                                {entrega.status === 'retirado' && (
                                    <div className="px-4 py-3 bg-gray-50 border-t flex items-center justify-between">
                                        <div className="flex items-center gap-4 text-xs text-gray-500">
                                            <span><strong>Retirado por:</strong> {entrega.retirado_por_nome}</span>
                                            <span><strong>Data:</strong> {formatDateTime(entrega.data_retirada)}</span>
                                        </div>
                                        {entrega.signature_url && (
                                            <Button variant="ghost" size="sm" className="text-emerald-600 h-8" onClick={() => setSelectedEntrega(entrega)}>
                                                <FileText className="h-4 w-4 mr-1" /> Ver Comprovante
                                            </Button>
                                        )}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Modal de Comprovante */}
            <Modal
                isOpen={!!selectedEntrega}
                onClose={() => setSelectedEntrega(null)}
                title="Comprovante de Recebimento"
                size="md"
            >
                {selectedEntrega && (
                    <div className="space-y-6">
                        <div className="p-4 bg-gray-50 rounded-lg space-y-2 text-sm border">
                            <div className="flex justify-between">
                                <span className="text-gray-500">Encomenda:</span>
                                <span className="font-medium">{selectedEntrega.remetente}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">Recebido na Portaria por:</span>
                                <span className="font-medium">{selectedEntrega.recebedor?.nome || 'Portaria'}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">Retirado por:</span>
                                <span className="font-medium">{selectedEntrega.retirado_por_nome}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">Data e Hora da Retirada:</span>
                                <span className="font-medium">{formatDateTime(selectedEntrega.data_retirada)}</span>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider text-center">Assinatura do Recebedor</p>
                            <div className="border-2 border-gray-200 rounded-xl overflow-hidden bg-white p-2">
                                <img
                                    src={selectedEntrega.signature_url}
                                    alt="Assinatura"
                                    className="w-full h-auto max-h-40 object-contain mx-auto"
                                />
                            </div>
                        </div>

                        <div className="text-center pb-2">
                            <p className="text-[10px] text-gray-400 italic">
                                Este documento serve como comprovante operacional de recebimento registrado em sistema.
                            </p>
                        </div>

                        <Button className="w-full" variant="ghost" onClick={() => setSelectedEntrega(null)}>
                            Fechar
                        </Button>
                    </div>
                )}
            </Modal>
        </div>
    );
}
