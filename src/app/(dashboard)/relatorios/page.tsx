'use client';

import { useEffect, useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, Button, Input } from '@/components/ui';
import { createClient } from '@/lib/supabase/client';
import { useUser } from '@/hooks/useUser';
import { formatCurrency, formatDate } from '@/lib/utils';
import { FileText, Download, Calendar, DollarSign, TrendingUp, TrendingDown, Users } from 'lucide-react';

export default function RelatoriosPage() {
    const { condoId, loading: userLoading } = useUser();
    const [loading, setLoading] = useState(false);
    const [periodoInicio, setPeriodoInicio] = useState('');
    const [periodoFim, setPeriodoFim] = useState('');
    const [reportData, setReportData] = useState<any>(null);
    const supabase = useMemo(() => createClient(), []);

    // Set default period to current month
    useEffect(() => {
        const now = new Date();
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        setPeriodoInicio(firstDay.toISOString().split('T')[0]);
        setPeriodoFim(lastDay.toISOString().split('T')[0]);
    }, []);

    const generateReport = async () => {
        if (!condoId || !periodoInicio || !periodoFim) return;

        setLoading(true);

        // Fetch condo info
        const { data: condo } = await supabase
            .from('condos')
            .select('*')
            .eq('id', condoId)
            .single();

        // Fetch receitas
        const { data: receitas } = await supabase
            .from('financial_entries')
            .select('*, unit:units(bloco, numero_unidade)')
            .eq('condo_id', condoId)
            .eq('tipo', 'receita')
            .gte('data_vencimento', periodoInicio)
            .lte('data_vencimento', periodoFim)
            .order('data_vencimento');

        // Fetch despesas
        const { data: despesas } = await supabase
            .from('financial_entries')
            .select('*')
            .eq('condo_id', condoId)
            .eq('tipo', 'despesa')
            .gte('data_vencimento', periodoInicio)
            .lte('data_vencimento', periodoFim)
            .order('data_vencimento');

        // Fetch inadimplentes
        const { data: inadimplentes } = await supabase
            .from('financial_entries')
            .select('*, unit:units(bloco, numero_unidade)')
            .eq('condo_id', condoId)
            .eq('tipo', 'receita')
            .in('status', ['em_aberto', 'atrasado'])
            .not('unidade_id', 'is', null);

        const totalReceitas = receitas?.reduce((sum, r) => sum + Number(r.valor), 0) || 0;
        const receitasPagas = receitas?.filter(r => r.status === 'pago').reduce((sum, r) => sum + Number(r.valor), 0) || 0;
        const totalDespesas = despesas?.reduce((sum, d) => sum + Number(d.valor), 0) || 0;
        const despesasPagas = despesas?.filter(d => d.status === 'pago').reduce((sum, d) => sum + Number(d.valor), 0) || 0;
        const inadTotal = inadimplentes?.reduce((sum, i) => sum + Number(i.valor), 0) || 0;

        setReportData({
            condo,
            periodoInicio,
            periodoFim,
            receitas: receitas || [],
            despesas: despesas || [],
            inadimplentes: inadimplentes || [],
            totais: {
                totalReceitas,
                receitasPagas,
                totalDespesas,
                despesasPagas,
                saldo: receitasPagas - despesasPagas,
                inadimplencia: inadTotal,
            }
        });

        setLoading(false);
    };

    const downloadPDF = async () => {
        if (!reportData) return;

        // Dynamic import jsPDF
        const jsPDF = (await import('jspdf')).default;

        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();

        // Header
        doc.setFontSize(20);
        doc.text('Prestação de Contas', pageWidth / 2, 20, { align: 'center' });
        doc.setFontSize(14);
        doc.text(reportData.condo?.nome || 'Condomínio', pageWidth / 2, 30, { align: 'center' });
        doc.setFontSize(10);
        doc.text(`Período: ${formatDate(reportData.periodoInicio)} a ${formatDate(reportData.periodoFim)}`, pageWidth / 2, 38, { align: 'center' });

        let y = 50;

        // Summary
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('Resumo Financeiro', 14, y);
        y += 8;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.text(`Total Receitas: ${formatCurrency(reportData.totais.totalReceitas)}`, 14, y);
        y += 6;
        doc.text(`Receitas Pagas: ${formatCurrency(reportData.totais.receitasPagas)}`, 14, y);
        y += 6;
        doc.text(`Total Despesas: ${formatCurrency(reportData.totais.totalDespesas)}`, 14, y);
        y += 6;
        doc.text(`Despesas Pagas: ${formatCurrency(reportData.totais.despesasPagas)}`, 14, y);
        y += 6;
        doc.setFont('helvetica', 'bold');
        doc.text(`Saldo: ${formatCurrency(reportData.totais.saldo)}`, 14, y);
        y += 10;

        // Receitas
        if (reportData.receitas.length > 0) {
            doc.setFontSize(12);
            doc.text('Receitas', 14, y);
            y += 6;
            doc.setFontSize(9);
            doc.setFont('helvetica', 'normal');

            reportData.receitas.slice(0, 15).forEach((r: any) => {
                const unit = r.unit ? `${r.unit.bloco || ''} ${r.unit.numero_unidade}` : 'Geral';
                doc.text(`${formatDate(r.data_vencimento)} - ${r.categoria} - ${unit} - ${formatCurrency(r.valor)} (${r.status})`, 14, y);
                y += 5;
                if (y > 270) {
                    doc.addPage();
                    y = 20;
                }
            });
            y += 5;
        }

        // Despesas
        if (reportData.despesas.length > 0) {
            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.text('Despesas', 14, y);
            y += 6;
            doc.setFontSize(9);
            doc.setFont('helvetica', 'normal');

            reportData.despesas.slice(0, 15).forEach((d: any) => {
                doc.text(`${formatDate(d.data_vencimento)} - ${d.categoria} - ${d.descricao || ''} - ${formatCurrency(d.valor)}`, 14, y);
                y += 5;
                if (y > 270) {
                    doc.addPage();
                    y = 20;
                }
            });
            y += 5;
        }

        // Inadimplentes
        if (reportData.inadimplentes.length > 0) {
            if (y > 240) {
                doc.addPage();
                y = 20;
            }
            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.text('Inadimplentes', 14, y);
            y += 6;
            doc.setFontSize(9);
            doc.setFont('helvetica', 'normal');

            reportData.inadimplentes.forEach((i: any) => {
                const unit = i.unit ? `${i.unit.bloco || ''} ${i.unit.numero_unidade}` : 'Sem unidade';
                doc.text(`${unit} - ${formatCurrency(i.valor)} (Venc: ${formatDate(i.data_vencimento)})`, 14, y);
                y += 5;
                if (y > 270) {
                    doc.addPage();
                    y = 20;
                }
            });
        }

        // Footer
        doc.setFontSize(8);
        doc.text(`Gerado em ${new Date().toLocaleString('pt-BR')}`, 14, 285);

        doc.save(`prestacao-contas-${reportData.periodoInicio}-${reportData.periodoFim}.pdf`);
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Relatórios</h1>
                <p className="text-gray-500">Gere relatórios e prestação de contas</p>
            </div>

            {/* Period Selection */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Calendar className="h-5 w-5" />
                        Período do Relatório
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-wrap gap-4 items-end">
                        <Input
                            label="Data Início"
                            type="date"
                            value={periodoInicio}
                            onChange={(e) => setPeriodoInicio(e.target.value)}
                            className="w-44"
                        />
                        <Input
                            label="Data Fim"
                            type="date"
                            value={periodoFim}
                            onChange={(e) => setPeriodoFim(e.target.value)}
                            className="w-44"
                        />
                        <Button onClick={generateReport} loading={loading}>
                            <FileText className="h-4 w-4 mr-2" />
                            Gerar Relatório
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Report Results */}
            {reportData && (
                <>
                    {/* Summary Cards */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <Card>
                            <CardContent className="pt-6">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-emerald-100 rounded-lg">
                                        <TrendingUp className="h-6 w-6 text-emerald-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Total Receitas</p>
                                        <p className="text-xl font-bold text-emerald-600">{formatCurrency(reportData.totais.totalReceitas)}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="pt-6">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-orange-100 rounded-lg">
                                        <TrendingDown className="h-6 w-6 text-orange-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Total Despesas</p>
                                        <p className="text-xl font-bold text-orange-600">{formatCurrency(reportData.totais.totalDespesas)}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="pt-6">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-blue-100 rounded-lg">
                                        <DollarSign className="h-6 w-6 text-blue-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Saldo</p>
                                        <p className={`text-xl font-bold ${reportData.totais.saldo >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                            {formatCurrency(reportData.totais.saldo)}
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="pt-6">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-red-100 rounded-lg">
                                        <Users className="h-6 w-6 text-red-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Inadimplência</p>
                                        <p className="text-xl font-bold text-red-600">{formatCurrency(reportData.totais.inadimplencia)}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Download Button */}
                    <div className="flex justify-end">
                        <Button onClick={downloadPDF} variant="primary" size="lg">
                            <Download className="h-5 w-5 mr-2" />
                            Baixar Prestação de Contas (PDF)
                        </Button>
                    </div>

                    {/* Receitas Table */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Receitas do Período</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {reportData.receitas.length === 0 ? (
                                <p className="text-gray-500">Nenhuma receita no período</p>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead>
                                            <tr className="text-left text-xs text-gray-500 uppercase">
                                                <th className="pb-3">Data</th>
                                                <th className="pb-3">Categoria</th>
                                                <th className="pb-3">Unidade</th>
                                                <th className="pb-3 text-right">Valor</th>
                                                <th className="pb-3">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {reportData.receitas.map((r: any) => (
                                                <tr key={r.id}>
                                                    <td className="py-2 text-sm">{formatDate(r.data_vencimento)}</td>
                                                    <td className="py-2 text-sm capitalize">{r.categoria.replace('_', ' ')}</td>
                                                    <td className="py-2 text-sm">{r.unit ? `${r.unit.bloco || ''} ${r.unit.numero_unidade}` : 'Geral'}</td>
                                                    <td className="py-2 text-sm text-right text-emerald-600 font-medium">{formatCurrency(r.valor)}</td>
                                                    <td className="py-2 text-sm capitalize">{r.status.replace('_', ' ')}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Despesas Table */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Despesas do Período</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {reportData.despesas.length === 0 ? (
                                <p className="text-gray-500">Nenhuma despesa no período</p>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead>
                                            <tr className="text-left text-xs text-gray-500 uppercase">
                                                <th className="pb-3">Data</th>
                                                <th className="pb-3">Categoria</th>
                                                <th className="pb-3">Descrição</th>
                                                <th className="pb-3 text-right">Valor</th>
                                                <th className="pb-3">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {reportData.despesas.map((d: any) => (
                                                <tr key={d.id}>
                                                    <td className="py-2 text-sm">{formatDate(d.data_vencimento)}</td>
                                                    <td className="py-2 text-sm capitalize">{d.categoria.replace('_', ' ')}</td>
                                                    <td className="py-2 text-sm">{d.descricao || '-'}</td>
                                                    <td className="py-2 text-sm text-right text-orange-600 font-medium">{formatCurrency(d.valor)}</td>
                                                    <td className="py-2 text-sm capitalize">{d.status.replace('_', ' ')}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Inadimplentes */}
                    {reportData.inadimplentes.length > 0 && (
                        <Card className="border-red-200">
                            <CardHeader>
                                <CardTitle className="text-red-600">Unidades Inadimplentes</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead>
                                            <tr className="text-left text-xs text-gray-500 uppercase">
                                                <th className="pb-3">Unidade</th>
                                                <th className="pb-3">Vencimento</th>
                                                <th className="pb-3 text-right">Valor em Aberto</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {reportData.inadimplentes.map((i: any) => (
                                                <tr key={i.id}>
                                                    <td className="py-2 text-sm font-medium">{i.unit ? `${i.unit.bloco || ''} ${i.unit.numero_unidade}` : '-'}</td>
                                                    <td className="py-2 text-sm">{formatDate(i.data_vencimento)}</td>
                                                    <td className="py-2 text-sm text-right text-red-600 font-medium">{formatCurrency(i.valor)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </>
            )}
        </div>
    );
}
