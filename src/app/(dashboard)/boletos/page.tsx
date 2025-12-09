'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, Button, Badge } from '@/components/ui';
import { createClient } from '@/lib/supabase/client';
import { useUser } from '@/hooks/useUser';
import { formatCurrency, formatDate } from '@/lib/utils';
import { FileText, Copy, ExternalLink, RefreshCw, CheckCircle, Clock, AlertTriangle } from 'lucide-react';

interface Invoice {
    id: string;
    valor: number;
    status: string;
    data_vencimento: string;
    data_pagamento: string | null;
    boleto_url: string | null;
    boleto_barcode: string | null;
    boleto_codigo: string | null;
    metodo_pagamento: string | null;
}

export default function BoletosPage() {
    const { condoId, profile } = useUser();
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [loading, setLoading] = useState(true);
    const [generatingBoleto, setGeneratingBoleto] = useState<string | null>(null);
    const [copied, setCopied] = useState<string | null>(null);
    const supabase = createClient();

    useEffect(() => {
        if (condoId) {
            fetchInvoices();
        }
    }, [condoId]);

    const fetchInvoices = async () => {
        setLoading(true);
        const { data } = await supabase
            .from('invoices')
            .select('*')
            .eq('condo_id', condoId)
            .order('data_vencimento', { ascending: false })
            .limit(12);

        setInvoices(data || []);
        setLoading(false);
    };

    const copyBarcode = (barcode: string, invoiceId: string) => {
        navigator.clipboard.writeText(barcode);
        setCopied(invoiceId);
        setTimeout(() => setCopied(null), 3000);
    };

    const generateSecondCopy = async (invoice: Invoice) => {
        if (!invoice.boleto_url) {
            alert('Este boleto não possui URL. Entre em contato com o administrador.');
            return;
        }
        window.open(invoice.boleto_url, '_blank');
    };

    const getStatusInfo = (status: string) => {
        switch (status) {
            case 'pago':
                return { variant: 'success' as const, label: 'Pago', icon: CheckCircle, color: 'text-green-600' };
            case 'pendente':
                return { variant: 'warning' as const, label: 'Pendente', icon: Clock, color: 'text-yellow-600' };
            case 'vencido':
                return { variant: 'danger' as const, label: 'Vencido', icon: AlertTriangle, color: 'text-red-600' };
            case 'cancelado':
                return { variant: 'secondary' as const, label: 'Cancelado', icon: AlertTriangle, color: 'text-gray-500' };
            default:
                return { variant: 'secondary' as const, label: status, icon: Clock, color: 'text-gray-500' };
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
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Meus Boletos</h1>
                    <p className="text-gray-500">Visualize e pague suas faturas</p>
                </div>
                <Button onClick={fetchInvoices} variant="outline">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Atualizar
                </Button>
            </div>

            {invoices.length === 0 ? (
                <Card>
                    <CardContent className="py-12 text-center">
                        <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                        <p className="text-gray-500">Nenhuma fatura encontrada</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4">
                    {invoices.map((invoice) => {
                        const statusInfo = getStatusInfo(invoice.status);
                        const StatusIcon = statusInfo.icon;
                        const barcode = invoice.boleto_barcode || invoice.boleto_codigo;

                        return (
                            <Card key={invoice.id} className={invoice.status === 'vencido' ? 'border-red-200 bg-red-50' : ''}>
                                <CardContent className="p-6">
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                        {/* Info */}
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <p className="text-xl font-bold text-gray-900">
                                                    {formatCurrency(invoice.valor)}
                                                </p>
                                                <Badge variant={statusInfo.variant}>
                                                    <StatusIcon className="h-3 w-3 mr-1" />
                                                    {statusInfo.label}
                                                </Badge>
                                            </div>
                                            <div className="text-sm text-gray-500 space-y-1">
                                                <p>Vencimento: <span className="font-medium">{formatDate(invoice.data_vencimento)}</span></p>
                                                {invoice.data_pagamento && (
                                                    <p>Pago em: <span className="font-medium">{formatDate(invoice.data_pagamento)}</span></p>
                                                )}
                                            </div>
                                        </div>

                                        {/* Boleto Info */}
                                        {invoice.status !== 'pago' && invoice.status !== 'cancelado' && barcode && (
                                            <div className="flex-1 bg-gray-50 rounded-lg p-4">
                                                <p className="text-xs text-gray-500 mb-2">Linha Digitável:</p>
                                                <div className="flex items-center gap-2">
                                                    <code className="text-xs bg-white px-2 py-1 rounded border flex-1 overflow-x-auto">
                                                        {barcode}
                                                    </code>
                                                    <Button
                                                        size="sm"
                                                        variant={copied === invoice.id ? 'outline' : 'primary'}
                                                        onClick={() => copyBarcode(barcode, invoice.id)}
                                                    >
                                                        {copied === invoice.id ? (
                                                            <>
                                                                <CheckCircle className="h-4 w-4 mr-1" />
                                                                Copiado!
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Copy className="h-4 w-4 mr-1" />
                                                                Copiar
                                                            </>
                                                        )}
                                                    </Button>
                                                </div>
                                            </div>
                                        )}

                                        {/* Actions */}
                                        <div className="flex gap-2">
                                            {invoice.boleto_url && invoice.status !== 'pago' && invoice.status !== 'cancelado' && (
                                                <Button
                                                    onClick={() => generateSecondCopy(invoice)}
                                                    variant="outline"
                                                >
                                                    <ExternalLink className="h-4 w-4 mr-2" />
                                                    Abrir Boleto
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}

            {/* Informações */}
            <Card className="bg-blue-50 border-blue-200">
                <CardContent className="py-4">
                    <p className="text-sm text-blue-800">
                        <strong>💡 Dica:</strong> Copie a linha digitável e cole no app do seu banco para pagar.
                        Após o pagamento, o status será atualizado automaticamente em até 3 dias úteis.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
