'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui';
import { useUser } from '@/hooks/useUser';
import { createClient } from '@/lib/supabase/client';
import { formatCurrency, formatDate, getStatusColor, getStatusLabel } from '@/lib/utils';
import { Home, AlertTriangle, DollarSign, TrendingUp, TrendingDown, Bell, Calendar } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import Link from 'next/link';
import { FinancialEntry, Notice, DashboardStats, ChartData } from '@/types/database';

export default function DashboardPage() {
    const { profile, isSuperAdmin, isSindico, isMorador, isPorteiro, condoId } = useUser();
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [chartData, setChartData] = useState<ChartData[]>([]);
    const [notices, setNotices] = useState<Notice[]>([]);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        if (condoId || isSuperAdmin) {
            fetchDashboardData();
        } else {
            // No condo assigned, stop loading
            setLoading(false);
        }
    }, [condoId, isSuperAdmin]);

    const fetchDashboardData = async () => {
        try {
            const now = new Date();
            const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
            const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
            const today = now.toISOString().split('T')[0];

            // Build all queries
            let unitsQuery = supabase.from('units').select('id', { count: 'exact' });
            let occQuery = supabase.from('occurrences').select('id', { count: 'exact' }).in('status', ['aberta', 'em_andamento']);
            let receitasQuery = supabase.from('financial_entries').select('valor').eq('tipo', 'receita').gte('data_vencimento', firstDay).lte('data_vencimento', lastDay);
            let despesasQuery = supabase.from('financial_entries').select('valor').eq('tipo', 'despesa').gte('data_vencimento', firstDay).lte('data_vencimento', lastDay);
            let inadQuery = supabase.from('financial_entries').select('valor').eq('tipo', 'receita').in('status', ['em_aberto', 'atrasado']);
            let vencQuery = supabase.from('financial_entries').select('*').eq('tipo', 'despesa').gte('data_vencimento', today).order('data_vencimento').limit(5);
            let noticesQuery = supabase.from('notices').select('*').order('data_publicacao', { ascending: false }).limit(5);

            // Apply condo filter if needed
            if (condoId) {
                unitsQuery = unitsQuery.eq('condo_id', condoId);
                occQuery = occQuery.eq('condo_id', condoId);
                receitasQuery = receitasQuery.eq('condo_id', condoId);
                despesasQuery = despesasQuery.eq('condo_id', condoId);
                inadQuery = inadQuery.eq('condo_id', condoId);
                vencQuery = vencQuery.eq('condo_id', condoId);
                noticesQuery = noticesQuery.eq('condo_id', condoId);
            }

            // Execute ALL queries in parallel for maximum performance
            const [
                { count: totalUnidades },
                { count: ocorrenciasAbertas },
                { data: receitasData },
                { data: despesasData },
                { data: inadData },
                { data: vencimentos },
                { data: noticesData }
            ] = await Promise.all([
                unitsQuery,
                occQuery,
                receitasQuery,
                despesasQuery,
                inadQuery,
                vencQuery,
                noticesQuery
            ]);

            const receitasMes = receitasData?.reduce((sum, r) => sum + Number(r.valor), 0) || 0;
            const despesasMes = despesasData?.reduce((sum, d) => sum + Number(d.valor), 0) || 0;
            const inadimplenciaValor = inadData?.reduce((sum, i) => sum + Number(i.valor), 0) || 0;

            // Chart data - last 6 months
            const chartMonths: ChartData[] = [];
            for (let i = 5; i >= 0; i--) {
                const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
                const monthStart = d.toISOString().split('T')[0];
                const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().split('T')[0];

                let recQ = supabase.from('financial_entries').select('valor').eq('tipo', 'receita').gte('data_vencimento', monthStart).lte('data_vencimento', monthEnd);
                let despQ = supabase.from('financial_entries').select('valor').eq('tipo', 'despesa').gte('data_vencimento', monthStart).lte('data_vencimento', monthEnd);
                if (condoId) {
                    recQ = recQ.eq('condo_id', condoId);
                    despQ = despQ.eq('condo_id', condoId);
                }

                const [{ data: r }, { data: de }] = await Promise.all([recQ, despQ]);

                chartMonths.push({
                    mes: d.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', ''),
                    receitas: r?.reduce((s, x) => s + Number(x.valor), 0) || 0,
                    despesas: de?.reduce((s, x) => s + Number(x.valor), 0) || 0,
                });
            }

            setStats({
                totalUnidades: totalUnidades || 0,
                inadimplenciaPercentual: receitasMes > 0 ? (inadimplenciaValor / receitasMes) * 100 : 0,
                inadimplenciaValor,
                proximosVencimentos: vencimentos || [],
                ocorrenciasAbertas: ocorrenciasAbertas || 0,
                receitasMes,
                despesasMes,
            });
            setChartData(chartMonths);
            setNotices(noticesData || []);
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-emerald-600 border-t-transparent"></div>
            </div>
        );
    }

    // Resident Dashboard
    if (isMorador) {
        return <MoradorDashboard notices={notices} />;
    }

    // Doorman Dashboard  
    if (isPorteiro) {
        return <PorteiroDashboard stats={stats} notices={notices} />;
    }

    // Síndico / SuperAdmin Dashboard
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
                <p className="text-gray-500">Visão geral do seu condomínio</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">Unidades</p>
                                <p className="text-2xl font-bold text-gray-900">{stats?.totalUnidades}</p>
                            </div>
                            <div className="p-3 bg-emerald-100 rounded-lg">
                                <Home className="h-6 w-6 text-emerald-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">Inadimplência</p>
                                <p className="text-2xl font-bold text-red-600">{formatCurrency(stats?.inadimplenciaValor || 0)}</p>
                                <p className="text-xs text-gray-400">{stats?.inadimplenciaPercentual?.toFixed(1)}% do previsto</p>
                            </div>
                            <div className="p-3 bg-red-100 rounded-lg">
                                <DollarSign className="h-6 w-6 text-red-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">Ocorrências Abertas</p>
                                <p className="text-2xl font-bold text-orange-600">{stats?.ocorrenciasAbertas}</p>
                            </div>
                            <div className="p-3 bg-orange-100 rounded-lg">
                                <AlertTriangle className="h-6 w-6 text-orange-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">Saldo do Mês</p>
                                <p className={`text-2xl font-bold ${(stats?.receitasMes || 0) - (stats?.despesasMes || 0) >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                    {formatCurrency((stats?.receitasMes || 0) - (stats?.despesasMes || 0))}
                                </p>
                            </div>
                            <div className="p-3 bg-blue-100 rounded-lg">
                                {(stats?.receitasMes || 0) >= (stats?.despesasMes || 0) ? (
                                    <TrendingUp className="h-6 w-6 text-blue-600" />
                                ) : (
                                    <TrendingDown className="h-6 w-6 text-blue-600" />
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Chart and Notices */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Financial Chart */}
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle>Receitas vs Despesas</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartData}>
                                    <XAxis dataKey="mes" />
                                    <YAxis tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
                                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                                    <Legend />
                                    <Bar dataKey="receitas" name="Receitas" fill="#10b981" radius={[4, 4, 0, 0]} />
                                    <Bar dataKey="despesas" name="Despesas" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* Recent Notices */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Bell className="h-5 w-5" />
                            Avisos Recentes
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {notices.length === 0 ? (
                            <p className="text-gray-500 text-sm">Nenhum aviso publicado</p>
                        ) : (
                            <div className="space-y-3">
                                {notices.map((notice) => (
                                    <Link
                                        key={notice.id}
                                        href={`/avisos/${notice.id}`}
                                        className="block p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                                    >
                                        <p className="font-medium text-gray-900 text-sm truncate">{notice.titulo}</p>
                                        <p className="text-xs text-gray-500 mt-1">
                                            {formatDate(notice.data_publicacao)}
                                        </p>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Upcoming Payments */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Calendar className="h-5 w-5" />
                        Próximos Vencimentos
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {stats?.proximosVencimentos?.length === 0 ? (
                        <p className="text-gray-500 text-sm">Nenhum vencimento próximo</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full">
                                <thead>
                                    <tr className="text-left text-xs text-gray-500 uppercase">
                                        <th className="pb-3">Descrição</th>
                                        <th className="pb-3">Categoria</th>
                                        <th className="pb-3">Vencimento</th>
                                        <th className="pb-3 text-right">Valor</th>
                                        <th className="pb-3">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {stats?.proximosVencimentos?.map((entry) => (
                                        <tr key={entry.id}>
                                            <td className="py-3 text-sm text-gray-900">{entry.descricao || entry.categoria}</td>
                                            <td className="py-3 text-sm text-gray-500">{entry.categoria}</td>
                                            <td className="py-3 text-sm text-gray-500">{formatDate(entry.data_vencimento)}</td>
                                            <td className="py-3 text-sm text-gray-900 text-right">{formatCurrency(entry.valor)}</td>
                                            <td className="py-3">
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(entry.status)}`}>
                                                    {getStatusLabel(entry.status)}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

function MoradorDashboard({ notices }: { notices: Notice[] }) {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Olá, bem-vindo!</h1>
                <p className="text-gray-500">Veja as novidades do seu condomínio</p>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <Link href="/avisos" className="p-4 bg-white rounded-xl border border-gray-200 hover:border-emerald-300 hover:shadow-md transition-all text-center">
                    <Bell className="h-8 w-8 mx-auto text-emerald-600 mb-2" />
                    <p className="text-sm font-medium text-gray-900">Avisos</p>
                </Link>
                <Link href="/ocorrencias/nova" className="p-4 bg-white rounded-xl border border-gray-200 hover:border-emerald-300 hover:shadow-md transition-all text-center">
                    <AlertTriangle className="h-8 w-8 mx-auto text-orange-600 mb-2" />
                    <p className="text-sm font-medium text-gray-900">Abrir Ocorrência</p>
                </Link>
                <Link href="/financeiro" className="p-4 bg-white rounded-xl border border-gray-200 hover:border-emerald-300 hover:shadow-md transition-all text-center">
                    <DollarSign className="h-8 w-8 mx-auto text-blue-600 mb-2" />
                    <p className="text-sm font-medium text-gray-900">Meus Boletos</p>
                </Link>
                <Link href="/ocorrencias" className="p-4 bg-white rounded-xl border border-gray-200 hover:border-emerald-300 hover:shadow-md transition-all text-center">
                    <Calendar className="h-8 w-8 mx-auto text-purple-600 mb-2" />
                    <p className="text-sm font-medium text-gray-900">Minhas Ocorrências</p>
                </Link>
            </div>

            {/* Notices */}
            <Card>
                <CardHeader>
                    <CardTitle>Avisos Recentes</CardTitle>
                </CardHeader>
                <CardContent>
                    {notices.length === 0 ? (
                        <p className="text-gray-500">Nenhum aviso publicado</p>
                    ) : (
                        <div className="space-y-3">
                            {notices.map((notice) => (
                                <Link
                                    key={notice.id}
                                    href={`/avisos/${notice.id}`}
                                    className="block p-4 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                                >
                                    <p className="font-medium text-gray-900">{notice.titulo}</p>
                                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">{notice.mensagem}</p>
                                    <p className="text-xs text-gray-400 mt-2">{formatDate(notice.data_publicacao)}</p>
                                </Link>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

function PorteiroDashboard({ stats, notices }: { stats: DashboardStats | null; notices: Notice[] }) {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Portaria</h1>
                <p className="text-gray-500">Painel rápido de operações</p>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-4">
                <Link href="/portaria" className="p-6 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl text-white hover:from-emerald-600 hover:to-emerald-700 transition-all">
                    <Home className="h-10 w-10 mb-3" />
                    <p className="text-lg font-semibold">Registrar Visitante</p>
                    <p className="text-emerald-100 text-sm">Entrada e saída</p>
                </Link>
                <Link href="/ocorrencias/nova" className="p-6 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl text-white hover:from-orange-600 hover:to-orange-700 transition-all">
                    <AlertTriangle className="h-10 w-10 mb-3" />
                    <p className="text-lg font-semibold">Nova Ocorrência</p>
                    <p className="text-orange-100 text-sm">{stats?.ocorrenciasAbertas} abertas</p>
                </Link>
            </div>

            {/* Recent Notices */}
            <Card>
                <CardHeader>
                    <CardTitle>Avisos</CardTitle>
                </CardHeader>
                <CardContent>
                    {notices.length === 0 ? (
                        <p className="text-gray-500">Nenhum aviso</p>
                    ) : (
                        <div className="space-y-2">
                            {notices.slice(0, 3).map((notice) => (
                                <div key={notice.id} className="p-3 rounded-lg bg-gray-50">
                                    <p className="font-medium text-gray-900 text-sm">{notice.titulo}</p>
                                    <p className="text-xs text-gray-500 mt-1">{formatDate(notice.data_publicacao)}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
