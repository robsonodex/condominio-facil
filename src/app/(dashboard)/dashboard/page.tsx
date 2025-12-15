'use client';

import { useEffect, useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui';
import { useUser } from '@/hooks/useUser';
import { createClient } from '@/lib/supabase/client';
import { formatCurrency, formatDate, getStatusColor, getStatusLabel } from '@/lib/utils';
import { Home, AlertTriangle, DollarSign, TrendingUp, TrendingDown, Bell, Calendar } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import Link from 'next/link';
import { FinancialEntry, Notice, DashboardStats, ChartData } from '@/types/database';
import { OnboardingChecklist } from '@/components/dashboard/OnboardingChecklist';

// Skeleton components for instant feedback
function StatsSkeleton() {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
                <Card key={i} className="bg-gradient-to-br from-gray-200 to-gray-300 animate-pulse">
                    <CardContent className="pt-6 h-24"></CardContent>
                </Card>
            ))}
        </div>
    );
}

export default function DashboardPage() {
    const { profile, isSuperAdmin, shouldShowMoradorUI, shouldShowPorteiroUI, condoId, loading: userLoading } = useUser();
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [chartData, setChartData] = useState<ChartData[]>([]);
    const [notices, setNotices] = useState<Notice[]>([]);
    const [loading, setLoading] = useState(true);

    const supabase = useMemo(() => createClient(), []);

    useEffect(() => {
        // Wait for user data before fetching
        if (userLoading) return;

        if (condoId || isSuperAdmin) {
            fetchDashboardData();
        } else {
            setLoading(false);
        }
    }, [condoId, isSuperAdmin, userLoading]);

    const fetchDashboardData = async () => {
        try {
            const now = new Date();
            const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
            const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
            const today = now.toISOString().split('T')[0];

            // Date range for last 6 months chart (single query)
            const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1).toISOString().split('T')[0];

            // Build all queries
            let unitsQuery = supabase.from('units').select('id', { count: 'exact' });
            let occQuery = supabase.from('occurrences').select('id', { count: 'exact' }).in('status', ['aberta', 'em_andamento']);
            let inadQuery = supabase.from('financial_entries').select('valor').eq('tipo', 'receita').in('status', ['em_aberto', 'atrasado']);
            let vencQuery = supabase.from('financial_entries').select('*').eq('tipo', 'despesa').gte('data_vencimento', today).order('data_vencimento').limit(5);
            let noticesQuery = supabase.from('notices').select('*').order('data_publicacao', { ascending: false }).limit(5);

            // Single query for ALL chart data (last 6 months)
            let chartQuery = supabase.from('financial_entries')
                .select('tipo, valor, data_vencimento')
                .gte('data_vencimento', sixMonthsAgo)
                .lte('data_vencimento', lastDay);

            // Apply condo filter if needed (SUPERADMIN without condo sees all)
            if (condoId && !isSuperAdmin) {
                unitsQuery = unitsQuery.eq('condo_id', condoId);
                occQuery = occQuery.eq('condo_id', condoId);
                inadQuery = inadQuery.eq('condo_id', condoId);
                vencQuery = vencQuery.eq('condo_id', condoId);
                noticesQuery = noticesQuery.eq('condo_id', condoId);
                chartQuery = chartQuery.eq('condo_id', condoId);
            } else if (condoId) {
                // If SUPERADMIN has a condo, filter by it
                unitsQuery = unitsQuery.eq('condo_id', condoId);
                occQuery = occQuery.eq('condo_id', condoId);
                inadQuery = inadQuery.eq('condo_id', condoId);
                vencQuery = vencQuery.eq('condo_id', condoId);
                noticesQuery = noticesQuery.eq('condo_id', condoId);
                chartQuery = chartQuery.eq('condo_id', condoId);
            }

            // Execute ALL queries in parallel - ONLY 6 queries instead of 18+
            const [
                { count: totalUnidades },
                { count: ocorrenciasAbertas },
                { data: inadData },
                { data: vencimentos },
                { data: noticesData },
                { data: chartRawData }
            ] = await Promise.all([
                unitsQuery,
                occQuery,
                inadQuery,
                vencQuery,
                noticesQuery,
                chartQuery
            ]);

            // Process chart data locally (fast)
            const monthlyData: { [key: string]: { receitas: number; despesas: number } } = {};
            const chartMonths: ChartData[] = [];

            // Initialize last 6 months
            for (let i = 5; i >= 0; i--) {
                const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
                const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
                monthlyData[key] = { receitas: 0, despesas: 0 };
            }

            // Aggregate data
            chartRawData?.forEach(entry => {
                const date = new Date(entry.data_vencimento);
                const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                if (monthlyData[key]) {
                    if (entry.tipo === 'receita') {
                        monthlyData[key].receitas += Number(entry.valor);
                    } else {
                        monthlyData[key].despesas += Number(entry.valor);
                    }
                }
            });

            // Build chart array
            for (let i = 5; i >= 0; i--) {
                const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
                const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
                chartMonths.push({
                    mes: d.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', ''),
                    receitas: monthlyData[key]?.receitas || 0,
                    despesas: monthlyData[key]?.despesas || 0,
                });
            }

            const inadimplenciaValor = inadData?.reduce((sum, i) => sum + Number(i.valor), 0) || 0;
            const receitasMes = chartMonths[5]?.receitas || 0;
            const despesasMes = chartMonths[5]?.despesas || 0;

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

    // Show skeleton while loading (not blank page)
    if (loading || userLoading) {
        return (
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
                    <p className="text-gray-500">Carregando dados...</p>
                </div>
                <StatsSkeleton />
            </div>
        );
    }

    // Morador Dashboard (only for actual moradores, NOT superadmin)
    if (shouldShowMoradorUI) {
        return <MoradorDashboard notices={notices} />;
    }

    // Porteiro Dashboard (only for actual porteiros, NOT superadmin)
    if (shouldShowPorteiroUI) {
        return <PorteiroDashboard stats={stats} notices={notices} />;
    }

    // Síndico / SuperAdmin Dashboard
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
                <p className="text-gray-500">Visão geral do seu condomínio</p>
            </div>

            {/* Onboarding Checklist for new syndics */}
            <OnboardingChecklist />

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {!isSuperAdmin && (
                    <Link href="/unidades" className="block transition-transform hover:scale-105">
                        <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white border-0 h-full cursor-pointer">
                            <CardContent className="pt-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-emerald-100">Unidades</p>
                                        <p className="text-3xl font-bold">{stats?.totalUnidades}</p>
                                    </div>
                                    <div className="p-3 bg-white/20 rounded-lg">
                                        <Home className="h-6 w-6" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </Link>
                )}

                <Link href="/financeiro" className="block transition-transform hover:scale-105">
                    <Card className="bg-gradient-to-br from-red-500 to-red-600 text-white border-0 h-full cursor-pointer">
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-red-100">Inadimplência</p>
                                    <p className="text-2xl font-bold">{formatCurrency(stats?.inadimplenciaValor || 0)}</p>
                                    <p className="text-xs text-red-200">{stats?.inadimplenciaPercentual?.toFixed(1)}% do previsto</p>
                                </div>
                                <div className="p-3 bg-white/20 rounded-lg">
                                    <DollarSign className="h-6 w-6" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </Link>

                <Link href="/ocorrencias" className="block transition-transform hover:scale-105">
                    <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white border-0 h-full cursor-pointer">
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-orange-100">Ocorrências Abertas</p>
                                    <p className="text-3xl font-bold">{stats?.ocorrenciasAbertas}</p>
                                </div>
                                <div className="p-3 bg-white/20 rounded-lg">
                                    <AlertTriangle className="h-6 w-6" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </Link>

                <Link href="/financeiro" className="block transition-transform hover:scale-105">
                    <Card className={`bg-gradient-to-br ${(stats?.receitasMes || 0) >= (stats?.despesasMes || 0) ? 'from-blue-500 to-blue-600' : 'from-purple-500 to-purple-600'} text-white border-0 h-full cursor-pointer`}>
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm opacity-80">Saldo do Mês</p>
                                    <p className="text-2xl font-bold">
                                        {formatCurrency((stats?.receitasMes || 0) - (stats?.despesasMes || 0))}
                                    </p>
                                </div>
                                <div className="p-3 bg-white/20 rounded-lg">
                                    {(stats?.receitasMes || 0) >= (stats?.despesasMes || 0) ? (
                                        <TrendingUp className="h-6 w-6" />
                                    ) : (
                                        <TrendingDown className="h-6 w-6" />
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </Link>
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
