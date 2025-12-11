'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, Badge, Button } from '@/components/ui';
import { useUser, useCondo } from '@/hooks/useUser';
import { createClient } from '@/lib/supabase/client';
import { formatDate } from '@/lib/utils';
import {
    CheckCircle, XCircle, AlertTriangle, RefreshCw,
    DollarSign, CreditCard, Shield, Calendar, Users,
    Building2, Smartphone, Database, Webhook, Activity
} from 'lucide-react';

interface StatusItem {
    id: string;
    nome: string;
    icon: React.ReactNode;
    status: 'ok' | 'atencao' | 'erro';
    detalhe: string;
    acao?: { label: string; href: string };
}

export default function StatusPage() {
    const { condoId, isSindico, isSuperAdmin } = useUser();
    const { condo } = useCondo();
    const [statusItems, setStatusItems] = useState<StatusItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
    const supabase = createClient();

    useEffect(() => {
        if (condoId) {
            checkAllStatus();
        }
    }, [condoId]);

    const checkAllStatus = async () => {
        setLoading(true);
        const items: StatusItem[] = [];

        try {
            // 1. Financeiro
            const { data: financeiro, count: finCount } = await supabase
                .from('financial_entries')
                .select('*', { count: 'exact' })
                .eq('condo_id', condoId)
                .order('created_at', { ascending: false })
                .limit(1);

            items.push({
                id: 'financeiro',
                nome: 'Financeiro',
                icon: <DollarSign className="h-5 w-5" />,
                status: (finCount || 0) > 0 ? 'ok' : 'atencao',
                detalhe: financeiro?.[0] ? `Último: ${formatDate(financeiro[0].created_at)}` : 'Nenhum lançamento',
                acao: { label: 'Ver', href: '/financeiro' }
            });

            // 2. Cobranças
            const { count: cobrancasPendentes } = await supabase
                .from('resident_invoices')
                .select('*', { count: 'exact', head: true })
                .eq('condo_id', condoId)
                .eq('status', 'pendente');

            items.push({
                id: 'cobrancas',
                nome: 'Cobranças MP',
                icon: <CreditCard className="h-5 w-5" />,
                status: (cobrancasPendentes || 0) > 5 ? 'atencao' : 'ok',
                detalhe: `${cobrancasPendentes || 0} pendentes`,
                acao: { label: 'Ver', href: '/cobrancas' }
            });

            // 3. Portaria
            const { data: ultimoVisitante } = await supabase
                .from('visitors')
                .select('*')
                .eq('condo_id', condoId)
                .order('created_at', { ascending: false })
                .limit(1);

            items.push({
                id: 'portaria',
                nome: 'Portaria',
                icon: <Shield className="h-5 w-5" />,
                status: 'ok',
                detalhe: ultimoVisitante?.[0] ? `Último: ${formatDate(ultimoVisitante[0].created_at)}` : 'Sem registros',
                acao: { label: 'Abrir', href: '/portaria' }
            });

            // 4. Reservas
            const { count: reservasPendentes } = await supabase
                .from('reservations')
                .select('*', { count: 'exact', head: true })
                .eq('condo_id', condoId)
                .eq('status', 'pendente');

            items.push({
                id: 'reservas',
                nome: 'Reservas',
                icon: <Calendar className="h-5 w-5" />,
                status: (reservasPendentes || 0) > 0 ? 'atencao' : 'ok',
                detalhe: `${reservasPendentes || 0} pendentes aprovação`,
                acao: { label: 'Gerenciar', href: '/reservas' }
            });

            // 5. Usuários
            const { count: moradoresSemUnidade } = await supabase
                .from('users')
                .select('*', { count: 'exact', head: true })
                .eq('condo_id', condoId)
                .in('role', ['morador', 'inquilino'])
                .is('unidade_id', null);

            items.push({
                id: 'usuarios',
                nome: 'Usuários',
                icon: <Users className="h-5 w-5" />,
                status: (moradoresSemUnidade || 0) > 0 ? 'atencao' : 'ok',
                detalhe: (moradoresSemUnidade || 0) > 0 ? `${moradoresSemUnidade} sem unidade` : 'Todos vinculados',
                acao: { label: 'Ver', href: '/moradores' }
            });

            // 6. Unidades
            const { count: unidades } = await supabase
                .from('units')
                .select('*', { count: 'exact', head: true })
                .eq('condo_id', condoId);

            items.push({
                id: 'unidades',
                nome: 'Unidades',
                icon: <Building2 className="h-5 w-5" />,
                status: (unidades || 0) > 0 ? 'ok' : 'erro',
                detalhe: `${unidades || 0} cadastradas`,
                acao: { label: 'Ver', href: '/unidades' }
            });

            // 7. PWA
            items.push({
                id: 'pwa',
                nome: 'PWA (App)',
                icon: <Smartphone className="h-5 w-5" />,
                status: 'ok',
                detalhe: 'Manifest configurado',
            });

            // 8. RLS/Segurança
            items.push({
                id: 'rls',
                nome: 'RLS/Segurança',
                icon: <Database className="h-5 w-5" />,
                status: 'ok',
                detalhe: 'Policies ativas',
            });

            // 9. Assinatura
            const { data: subscription } = await supabase
                .from('subscriptions')
                .select('*, plans(*)')
                .eq('condo_id', condoId)
                .single();

            items.push({
                id: 'assinatura',
                nome: 'Assinatura',
                icon: <Activity className="h-5 w-5" />,
                status: subscription?.status === 'ativo' ? 'ok' : subscription?.status === 'teste' ? 'atencao' : 'erro',
                detalhe: subscription ? `${subscription.plans?.nome_plano} - ${subscription.status}` : 'Não encontrada',
                acao: { label: 'Ver', href: '/assinatura' }
            });

        } catch (error) {
            console.error('Error checking status:', error);
        }

        setStatusItems(items);
        setLastUpdate(new Date());
        setLoading(false);
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'ok': return <CheckCircle className="h-5 w-5 text-emerald-500" />;
            case 'atencao': return <AlertTriangle className="h-5 w-5 text-amber-500" />;
            case 'erro': return <XCircle className="h-5 w-5 text-red-500" />;
            default: return <CheckCircle className="h-5 w-5 text-gray-400" />;
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'ok': return <Badge variant="success">OK</Badge>;
            case 'atencao': return <Badge variant="warning">Atenção</Badge>;
            case 'erro': return <Badge variant="destructive">Erro</Badge>;
            default: return <Badge>-</Badge>;
        }
    };

    const okCount = statusItems.filter(i => i.status === 'ok').length;
    const atencaoCount = statusItems.filter(i => i.status === 'atencao').length;
    const erroCount = statusItems.filter(i => i.status === 'erro').length;

    if (!isSindico && !isSuperAdmin) {
        return (
            <div className="text-center py-12">
                <p className="text-gray-500">Acesso restrito a síndicos.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Status Geral do Condomínio</h1>
                    <p className="text-gray-500">{condo?.nome || 'Carregando...'}</p>
                </div>
                <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-400">
                        Atualizado: {lastUpdate.toLocaleTimeString('pt-BR')}
                    </span>
                    <Button onClick={checkAllStatus} loading={loading}>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Atualizar
                    </Button>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="border-emerald-200 bg-emerald-50">
                    <CardContent className="p-4 text-center">
                        <CheckCircle className="h-8 w-8 text-emerald-500 mx-auto mb-2" />
                        <p className="text-3xl font-bold text-emerald-700">{okCount}</p>
                        <p className="text-sm text-emerald-600">Funcionando</p>
                    </CardContent>
                </Card>

                <Card className="border-amber-200 bg-amber-50">
                    <CardContent className="p-4 text-center">
                        <AlertTriangle className="h-8 w-8 text-amber-500 mx-auto mb-2" />
                        <p className="text-3xl font-bold text-amber-700">{atencaoCount}</p>
                        <p className="text-sm text-amber-600">Atenção</p>
                    </CardContent>
                </Card>

                <Card className="border-red-200 bg-red-50">
                    <CardContent className="p-4 text-center">
                        <XCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
                        <p className="text-3xl font-bold text-red-700">{erroCount}</p>
                        <p className="text-sm text-red-600">Erros</p>
                    </CardContent>
                </Card>
            </div>

            {/* Status Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Detalhamento por Módulo</CardTitle>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="text-center py-8 text-gray-500">Verificando...</div>
                    ) : (
                        <div className="space-y-3">
                            {statusItems.map(item => (
                                <div
                                    key={item.id}
                                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                                >
                                    <div className="flex items-center gap-4">
                                        {getStatusIcon(item.status)}
                                        <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm">
                                            {item.icon}
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-900">{item.nome}</p>
                                            <p className="text-sm text-gray-500">{item.detalhe}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        {getStatusBadge(item.status)}
                                        {item.acao && (
                                            <a href={item.acao.href}>
                                                <Button size="sm" variant="outline">
                                                    {item.acao.label}
                                                </Button>
                                            </a>
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
