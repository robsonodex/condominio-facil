'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, Button, Badge, Table } from '@/components/ui';
import {
    AlertTriangle, AlertCircle, CheckCircle, Settings,
    RefreshCw, Trash2, Edit, Eye, XCircle, Clock
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { formatDate } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';

interface SystemError {
    id: string;
    tipo: string;
    prioridade: string;
    mensagem: string;
    condo_id: string;
    condo_nome?: string;
    resolvido: boolean;
    created_at: string;
    payload?: any;
}

interface IntegrityIssue {
    tipo: string;
    descricao: string;
    quantidade: number;
    prioridade: string;
}

export default function AdminErrosPage() {
    const [errors, setErrors] = useState<SystemError[]>([]);
    const [integrityIssues, setIntegrityIssues] = useState<IntegrityIssue[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const { session } = useAuth();
    const supabase = createClient();

    useEffect(() => {
        fetchErrors();
        checkIntegrity();
    }, []);

    const fetchErrors = async () => {
        try {
            const { data } = await supabase
                .from('system_errors')
                .select('*, condos(nome)')
                .order('created_at', { ascending: false })
                .limit(100);

            setErrors(data?.map(e => ({
                ...e,
                condo_nome: e.condos?.nome
            })) || []);
        } catch (error) {
            console.error('Error fetching system errors:', error);
        } finally {
            setLoading(false);
        }
    };

    const checkIntegrity = async () => {
        const issues: IntegrityIssue[] = [];

        try {
            // Unidades sem moradores
            const { count: unidadesSemMorador } = await supabase
                .from('units')
                .select('id', { count: 'exact', head: true })
                .is('proprietario_id', null);

            if (unidadesSemMorador && unidadesSemMorador > 0) {
                issues.push({
                    tipo: 'unidades_sem_morador',
                    descricao: 'Unidades sem proprietário vinculado',
                    quantidade: unidadesSemMorador,
                    prioridade: 'baixa'
                });
            }

            // Moradores sem unidade
            const { count: moradoresSemUnidade } = await supabase
                .from('users')
                .select('id', { count: 'exact', head: true })
                .in('role', ['morador', 'inquilino'])
                .is('unidade_id', null);

            if (moradoresSemUnidade && moradoresSemUnidade > 0) {
                issues.push({
                    tipo: 'moradores_sem_unidade',
                    descricao: 'Moradores sem unidade vinculada',
                    quantidade: moradoresSemUnidade,
                    prioridade: 'media'
                });
            }

            // Lançamentos sem categoria
            const { count: semCategoria } = await supabase
                .from('financial_entries')
                .select('id', { count: 'exact', head: true })
                .or('categoria.is.null,categoria.eq.');

            if (semCategoria && semCategoria > 0) {
                issues.push({
                    tipo: 'lancamentos_sem_categoria',
                    descricao: 'Lançamentos financeiros sem categoria',
                    quantidade: semCategoria,
                    prioridade: 'baixa'
                });
            }

            // Cobranças pendentes há mais de 30 dias
            const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
            const { count: cobrancasAtrasadas } = await supabase
                .from('resident_invoices')
                .select('id', { count: 'exact', head: true })
                .eq('status', 'pendente')
                .lt('data_vencimento', thirtyDaysAgo);

            if (cobrancasAtrasadas && cobrancasAtrasadas > 0) {
                issues.push({
                    tipo: 'cobrancas_atrasadas',
                    descricao: 'Cobranças pendentes há mais de 30 dias',
                    quantidade: cobrancasAtrasadas,
                    prioridade: 'alta'
                });
            }

        } catch (error) {
            console.error('Error checking integrity:', error);
        }

        setIntegrityIssues(issues);
    };

    const handleRefresh = async () => {
        setRefreshing(true);
        await Promise.all([fetchErrors(), checkIntegrity()]);
        setRefreshing(false);
    };

    const handleResolve = async (id: string) => {
        await supabase
            .from('system_errors')
            .update({ resolvido: true, resolvido_em: new Date().toISOString() })
            .eq('id', id);

        fetchErrors();
    };

    const getPrioridadeBadge = (prioridade: string) => {
        switch (prioridade) {
            case 'alta': return <Badge variant="destructive">Alta</Badge>;
            case 'media': return <Badge variant="warning">Média</Badge>;
            default: return <Badge variant="secondary">Baixa</Badge>;
        }
    };

    const getTipoIcon = (tipo: string) => {
        if (tipo.includes('webhook')) return <AlertCircle className="h-4 w-4 text-orange-500" />;
        if (tipo.includes('cobranca')) return <AlertTriangle className="h-4 w-4 text-red-500" />;
        if (tipo.includes('email')) return <AlertCircle className="h-4 w-4 text-yellow-500" />;
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    };

    const unresolvedCount = errors.filter(e => !e.resolvido).length;
    const highPriorityCount = errors.filter(e => e.prioridade === 'alta' && !e.resolvido).length;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Painel de Erros do Sistema</h1>
                    <p className="text-gray-500">Monitoramento de falhas e problemas de integridade</p>
                </div>
                <Button onClick={handleRefresh} loading={refreshing}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Atualizar
                </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                                <AlertTriangle className="h-5 w-5 text-red-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Não Resolvidos</p>
                                <p className="text-2xl font-bold text-red-600">{unresolvedCount}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                                <AlertCircle className="h-5 w-5 text-orange-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Alta Prioridade</p>
                                <p className="text-2xl font-bold text-orange-600">{highPriorityCount}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                                <Settings className="h-5 w-5 text-yellow-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Integridade</p>
                                <p className="text-2xl font-bold text-yellow-600">{integrityIssues.length}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                                <CheckCircle className="h-5 w-5 text-emerald-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Resolvidos</p>
                                <p className="text-2xl font-bold text-emerald-600">
                                    {errors.filter(e => e.resolvido).length}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Integrity Issues */}
            {integrityIssues.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Settings className="h-5 w-5" />
                            Problemas de Integridade
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {integrityIssues.map((issue, i) => (
                                <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                    <div className="flex items-center gap-3">
                                        {getPrioridadeBadge(issue.prioridade)}
                                        <span>{issue.descricao}</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="font-bold">{issue.quantidade}</span>
                                        <Button size="sm" variant="outline">
                                            <Eye className="h-4 w-4 mr-1" />
                                            Ver
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Error Log */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5" />
                        Log de Erros
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="text-center py-8 text-gray-500">Carregando...</div>
                    ) : errors.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            <CheckCircle className="h-12 w-12 mx-auto mb-2 text-emerald-500" />
                            Nenhum erro registrado
                        </div>
                    ) : (
                        <Table
                            data={errors}
                            columns={[
                                {
                                    key: 'tipo', header: 'Tipo', render: (e) => (
                                        <div className="flex items-center gap-2">
                                            {getTipoIcon(e.tipo)}
                                            <span className="text-xs">{e.tipo}</span>
                                        </div>
                                    )
                                },
                                {
                                    key: 'mensagem', header: 'Mensagem', render: (e) => (
                                        <span className="max-w-xs truncate">{e.mensagem}</span>
                                    )
                                },
                                { key: 'condo_nome', header: 'Condomínio', render: (e) => e.condo_nome || '-' },
                                { key: 'prioridade', header: 'Prioridade', render: (e) => getPrioridadeBadge(e.prioridade) },
                                {
                                    key: 'resolvido', header: 'Status', render: (e) => e.resolvido ? (
                                        <Badge variant="outline" className="text-emerald-600">Resolvido</Badge>
                                    ) : (
                                        <Badge variant="destructive">Pendente</Badge>
                                    )
                                },
                                { key: 'created_at', header: 'Data', render: (e) => formatDate(e.created_at) },
                                {
                                    key: 'acoes', header: 'Ações', render: (e) => !e.resolvido && (
                                        <Button size="sm" variant="outline" onClick={() => handleResolve(e.id)}>
                                            <CheckCircle className="h-4 w-4" />
                                        </Button>
                                    )
                                },
                            ]}
                        />
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
