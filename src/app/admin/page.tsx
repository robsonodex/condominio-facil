'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, Button, Select, Badge } from '@/components/ui';
import { createClient } from '@/lib/supabase/client';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Building2, Users, DollarSign, TrendingUp, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

export default function AdminDashboardPage() {
    const [stats, setStats] = useState<any>(null);
    const [recentCondos, setRecentCondos] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        // Execute all queries in parallel
        const [
            { count: totalCondos },
            { count: activeCondos },
            { count: trialCondos },
            { count: suspendedCondos },
            { count: totalUsers },
            { data: subscriptions },
            { data: recentCondosData }
        ] = await Promise.all([
            supabase.from('condos').select('id', { count: 'exact' }),
            supabase.from('condos').select('id', { count: 'exact' }).eq('status', 'ativo'),
            supabase.from('condos').select('id', { count: 'exact' }).eq('status', 'teste'),
            supabase.from('condos').select('id', { count: 'exact' }).eq('status', 'suspenso'),
            supabase.from('users').select('id', { count: 'exact' }),
            supabase.from('subscriptions').select('valor_mensal_cobrado').eq('status', 'ativo'),
            supabase.from('condos').select('*, plan:plans(nome_plano)').order('created_at', { ascending: false }).limit(5)
        ]);

        const mrr = subscriptions?.reduce((sum, s) => sum + Number(s.valor_mensal_cobrado || 0), 0) || 0;

        setStats({
            totalCondos: totalCondos || 0,
            activeCondos: activeCondos || 0,
            trialCondos: trialCondos || 0,
            suspendedCondos: suspendedCondos || 0,
            totalUsers: totalUsers || 0,
            mrr,
        });
        setRecentCondos(recentCondosData || []);
        setLoading(false);
    };

    const updateCondoStatus = async (condoId: string, status: string) => {
        await supabase.from('condos').update({ status }).eq('id', condoId);
        fetchStats();
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
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Painel Administrativo</h1>
                <p className="text-gray-500">Visão geral da plataforma</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-emerald-100 text-sm">Total Condos</p>
                                <p className="text-3xl font-bold">{stats.totalCondos}</p>
                            </div>
                            <Building2 className="h-10 w-10 text-emerald-200" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-blue-100 text-sm">MRR</p>
                                <p className="text-3xl font-bold">{formatCurrency(stats.mrr)}</p>
                            </div>
                            <DollarSign className="h-10 w-10 text-blue-200" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-purple-100 text-sm">Usuários</p>
                                <p className="text-3xl font-bold">{stats.totalUsers}</p>
                            </div>
                            <Users className="h-10 w-10 text-purple-200" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-orange-100 text-sm">Em Teste</p>
                                <p className="text-3xl font-bold">{stats.trialCondos}</p>
                            </div>
                            <TrendingUp className="h-10 w-10 text-orange-200" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Status Overview */}
            <div className="grid grid-cols-3 gap-4">
                <Card>
                    <CardContent className="py-4 text-center">
                        <CheckCircle className="h-8 w-8 mx-auto text-emerald-500 mb-2" />
                        <p className="text-2xl font-bold text-emerald-600">{stats.activeCondos}</p>
                        <p className="text-sm text-gray-500">Ativos</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="py-4 text-center">
                        <AlertTriangle className="h-8 w-8 mx-auto text-yellow-500 mb-2" />
                        <p className="text-2xl font-bold text-yellow-600">{stats.trialCondos}</p>
                        <p className="text-sm text-gray-500">Em Teste</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="py-4 text-center">
                        <XCircle className="h-8 w-8 mx-auto text-red-500 mb-2" />
                        <p className="text-2xl font-bold text-red-600">{stats.suspendedCondos}</p>
                        <p className="text-sm text-gray-500">Suspensos</p>
                    </CardContent>
                </Card>
            </div>

            {/* Recent Condos */}
            <Card>
                <CardHeader>
                    <CardTitle>Condomínios Recentes</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <table className="min-w-full">
                            <thead>
                                <tr className="text-left text-xs text-gray-500 uppercase">
                                    <th className="pb-3">Condomínio</th>
                                    <th className="pb-3">Plano</th>
                                    <th className="pb-3">Status</th>
                                    <th className="pb-3">Criado em</th>
                                    <th className="pb-3">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {recentCondos.map((condo) => (
                                    <tr key={condo.id}>
                                        <td className="py-3">
                                            <p className="font-medium text-gray-900">{condo.nome}</p>
                                            <p className="text-xs text-gray-500">{condo.cidade}/{condo.estado}</p>
                                        </td>
                                        <td className="py-3 text-sm text-gray-500">
                                            {condo.plan?.nome_plano || 'Sem plano'}
                                        </td>
                                        <td className="py-3">
                                            <Badge variant={
                                                condo.status === 'ativo' ? 'success' :
                                                    condo.status === 'teste' ? 'warning' : 'danger'
                                            }>
                                                {condo.status === 'ativo' ? 'Ativo' :
                                                    condo.status === 'teste' ? 'Teste' : 'Suspenso'}
                                            </Badge>
                                        </td>
                                        <td className="py-3 text-sm text-gray-500">
                                            {formatDate(condo.created_at)}
                                        </td>
                                        <td className="py-3">
                                            <div className="flex gap-2">
                                                {condo.status !== 'ativo' && (
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => updateCondoStatus(condo.id, 'ativo')}
                                                    >
                                                        Ativar
                                                    </Button>
                                                )}
                                                {condo.status !== 'suspenso' && (
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() => updateCondoStatus(condo.id, 'suspenso')}
                                                    >
                                                        Suspender
                                                    </Button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
