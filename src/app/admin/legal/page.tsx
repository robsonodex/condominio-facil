'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { FileCheck, Search, Download, Calendar, User } from 'lucide-react';
import { Button, Card, Input } from '@/components/ui';

interface LegalAcceptance {
    id: string;
    email: string;
    tipo: string;
    versao: string;
    ip_address: string;
    user_agent: string;
    aceito_em: string;
}

const tipoLabels: Record<string, string> = {
    termos: 'Termos de Uso',
    privacidade: 'Política de Privacidade',
    contrato: 'Contrato de Serviço',
};

export default function AdminLegalPage() {
    const [acceptances, setAcceptances] = useState<LegalAcceptance[]>([]);
    const [loading, setLoading] = useState(true);
    const [filtroTipo, setFiltroTipo] = useState('');
    const [busca, setBusca] = useState('');
    const { profile } = useAuth();
    const supabase = createClient();

    useEffect(() => {
        if (profile?.role === 'superadmin') {
            fetchAcceptances();
        }
    }, [profile, filtroTipo]);

    async function fetchAcceptances() {
        setLoading(true);
        let query = supabase
            .from('legal_acceptances')
            .select('*')
            .order('aceito_em', { ascending: false })
            .limit(100);

        if (filtroTipo) query = query.eq('tipo', filtroTipo);
        if (busca) query = query.ilike('email', `%${busca}%`);

        const { data, error } = await query;

        if (!error && data) {
            setAcceptances(data);
        }
        setLoading(false);
    }

    async function exportCSV() {
        const headers = ['Data', 'Email', 'Tipo', 'Versão', 'IP'];
        const rows = acceptances.map(a => [
            new Date(a.aceito_em).toLocaleString('pt-BR'),
            a.email,
            tipoLabels[a.tipo] || a.tipo,
            a.versao,
            a.ip_address,
        ]);

        const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `aceites_legais_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
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
                    <h1 className="text-2xl font-bold text-gray-900">Aceites Legais</h1>
                    <p className="text-gray-600">Registro de aceites de termos e políticas (LGPD)</p>
                </div>
                <Button onClick={exportCSV} variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Exportar CSV
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
                    <Button variant="outline" onClick={fetchAcceptances}>
                        Filtrar
                    </Button>
                </div>
            </Card>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {Object.entries(tipoLabels).map(([key, label]) => (
                    <Card key={key} className="p-4">
                        <div className="flex items-center gap-3">
                            <FileCheck className="h-8 w-8 text-emerald-600" />
                            <div>
                                <p className="text-2xl font-bold text-gray-900">
                                    {acceptances.filter(a => a.tipo === key).length}
                                </p>
                                <p className="text-sm text-gray-600">{label}</p>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>

            {/* Table */}
            <Card className="overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b">
                            <tr>
                                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">
                                    <div className="flex items-center gap-1">
                                        <Calendar className="h-4 w-4" />
                                        Data/Hora
                                    </div>
                                </th>
                                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">
                                    <div className="flex items-center gap-1">
                                        <User className="h-4 w-4" />
                                        Email
                                    </div>
                                </th>
                                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Documento</th>
                                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Versão</th>
                                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">IP</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                                        Carregando...
                                    </td>
                                </tr>
                            ) : acceptances.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                                        Nenhum aceite encontrado
                                    </td>
                                </tr>
                            ) : (
                                acceptances.map((acceptance) => (
                                    <tr key={acceptance.id} className="hover:bg-gray-50">
                                        <td className="px-4 py-3 text-sm text-gray-600">
                                            {new Date(acceptance.aceito_em).toLocaleString('pt-BR')}
                                        </td>
                                        <td className="px-4 py-3 text-sm font-medium text-gray-900">
                                            {acceptance.email}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className="px-2 py-1 bg-emerald-100 text-emerald-800 rounded text-xs font-medium">
                                                {tipoLabels[acceptance.tipo] || acceptance.tipo}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-600">{acceptance.versao}</td>
                                        <td className="px-4 py-3 text-sm text-gray-500 font-mono">
                                            {acceptance.ip_address}
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
