'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Mail, Search, Filter, CheckCircle, XCircle, Clock } from 'lucide-react';
import { Button, Card, Input } from '@/components/ui';

interface EmailLog {
    id: string;
    condo_id: string;
    tipo: string;
    destinatario: string;
    assunto: string;
    status: 'enviado' | 'falhou' | 'pendente';
    erro: string | null;
    created_at: string;
}

const tipoLabels: Record<string, string> = {
    welcome: 'Boas-vindas',
    trial_ending: 'Fim do teste',
    invoice: 'Fatura',
    overdue: 'Atraso',
    blocked: 'Bloqueio',
    payment_confirmed: 'Pagamento OK',
};

const statusIcons: Record<string, React.ReactNode> = {
    enviado: <CheckCircle className="h-4 w-4 text-green-600" />,
    falhou: <XCircle className="h-4 w-4 text-red-600" />,
    pendente: <Clock className="h-4 w-4 text-yellow-600" />,
};

export default function AdminEmailsPage() {
    const [logs, setLogs] = useState<EmailLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [filtroTipo, setFiltroTipo] = useState('');
    const [filtroStatus, setFiltroStatus] = useState('');
    const [busca, setBusca] = useState('');
    const { profile } = useAuth();
    const supabase = createClient();

    useEffect(() => {
        if (profile?.role === 'superadmin') {
            fetchLogs();
        }
    }, [profile, filtroTipo, filtroStatus]);

    async function fetchLogs() {
        setLoading(true);
        let query = supabase
            .from('email_logs')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(100);

        if (filtroTipo) query = query.eq('tipo', filtroTipo);
        if (filtroStatus) query = query.eq('status', filtroStatus);
        if (busca) query = query.ilike('destinatario', `%${busca}%`);

        const { data, error } = await query;

        if (!error && data) {
            setLogs(data);
        }
        setLoading(false);
    }

    if (profile?.role !== 'superadmin') {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <p className="text-gray-500">Acesso restrito a Super Administradores</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Logs de E-mails</h1>
                    <p className="text-gray-600">Histórico de emails enviados pelo sistema</p>
                </div>
                <Button onClick={fetchLogs} disabled={loading}>
                    <Mail className="h-4 w-4 mr-2" />
                    Atualizar
                </Button>
            </div>

            {/* Filters */}
            <Card className="p-4">
                <div className="flex flex-wrap gap-4">
                    <div className="flex-1 min-w-[200px]">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                                placeholder="Buscar por email..."
                                value={busca}
                                onChange={(e) => setBusca(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                    </div>
                    <select
                        value={filtroTipo}
                        onChange={(e) => setFiltroTipo(e.target.value)}
                        className="px-3 py-2 border rounded-lg"
                    >
                        <option value="">Todos os tipos</option>
                        {Object.entries(tipoLabels).map(([key, label]) => (
                            <option key={key} value={key}>{label}</option>
                        ))}
                    </select>
                    <select
                        value={filtroStatus}
                        onChange={(e) => setFiltroStatus(e.target.value)}
                        className="px-3 py-2 border rounded-lg"
                    >
                        <option value="">Todos os status</option>
                        <option value="enviado">Enviado</option>
                        <option value="falhou">Falhou</option>
                        <option value="pendente">Pendente</option>
                    </select>
                    <Button variant="outline" onClick={fetchLogs}>
                        <Filter className="h-4 w-4 mr-2" />
                        Filtrar
                    </Button>
                </div>
            </Card>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="p-4 bg-green-50 border-green-200">
                    <div className="flex items-center gap-3">
                        <CheckCircle className="h-8 w-8 text-green-600" />
                        <div>
                            <p className="text-2xl font-bold text-green-900">
                                {logs.filter(l => l.status === 'enviado').length}
                            </p>
                            <p className="text-sm text-green-700">Enviados</p>
                        </div>
                    </div>
                </Card>
                <Card className="p-4 bg-red-50 border-red-200">
                    <div className="flex items-center gap-3">
                        <XCircle className="h-8 w-8 text-red-600" />
                        <div>
                            <p className="text-2xl font-bold text-red-900">
                                {logs.filter(l => l.status === 'falhou').length}
                            </p>
                            <p className="text-sm text-red-700">Falharam</p>
                        </div>
                    </div>
                </Card>
                <Card className="p-4 bg-yellow-50 border-yellow-200">
                    <div className="flex items-center gap-3">
                        <Clock className="h-8 w-8 text-yellow-600" />
                        <div>
                            <p className="text-2xl font-bold text-yellow-900">
                                {logs.filter(l => l.status === 'pendente').length}
                            </p>
                            <p className="text-sm text-yellow-700">Pendentes</p>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Table */}
            <Card className="overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b">
                            <tr>
                                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Data</th>
                                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Tipo</th>
                                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Destinatário</th>
                                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Assunto</th>
                                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                                        Carregando...
                                    </td>
                                </tr>
                            ) : logs.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                                        Nenhum email encontrado
                                    </td>
                                </tr>
                            ) : (
                                logs.map((log) => (
                                    <tr key={log.id} className="hover:bg-gray-50">
                                        <td className="px-4 py-3 text-sm text-gray-600">
                                            {new Date(log.created_at).toLocaleString('pt-BR')}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className="px-2 py-1 bg-gray-100 rounded text-xs font-medium">
                                                {tipoLabels[log.tipo] || log.tipo}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-900">{log.destinatario}</td>
                                        <td className="px-4 py-3 text-sm text-gray-600">{log.assunto}</td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                {statusIcons[log.status]}
                                                <span className="text-sm capitalize">{log.status}</span>
                                            </div>
                                            {log.erro && (
                                                <p className="text-xs text-red-500 mt-1">{log.erro}</p>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
}
