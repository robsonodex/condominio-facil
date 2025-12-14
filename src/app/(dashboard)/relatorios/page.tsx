'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, Button, Select } from '@/components/ui';
import { useUser, useCondo } from '@/hooks/useUser';
import { createClient } from '@/lib/supabase/client';
import { generatePDF, generateExcel, ReportTemplates } from '@/lib/reports';
import { FileText, Download, FileSpreadsheet, Calendar, Filter } from 'lucide-react';

type ReportType = 'financeiro' | 'cobrancas' | 'ocorrencias' | 'moradores' | 'unidades';

export default function RelatoriosPage() {
    const { condoId, profile } = useUser();
    const { condo } = useCondo();
    const condoName = condo?.nome || 'Condomínio';
    const [reportType, setReportType] = useState<ReportType>('financeiro');
    const [loading, setLoading] = useState(false);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const supabase = createClient();

    useEffect(() => {
        // Default: last 30 days
        const end = new Date();
        const start = new Date();
        start.setDate(start.getDate() - 30);
        setStartDate(start.toISOString().split('T')[0]);
        setEndDate(end.toISOString().split('T')[0]);
    }, []);

    const fetchReportData = async () => {
        if (!condoId) return [];

        switch (reportType) {
            case 'financeiro': {
                const { data } = await supabase
                    .from('financial_entries')
                    .select('*')
                    .eq('condo_id', condoId)
                    .gte('data', startDate)
                    .lte('data', endDate)
                    .order('data', { ascending: false });
                return data || [];
            }
            case 'cobrancas': {
                const { data } = await supabase
                    .from('resident_invoices')
                    .select('*, morador:users!morador_id(nome), unidade:units(bloco, numero_unidade)')
                    .eq('condo_id', condoId)
                    .gte('created_at', startDate)
                    .lte('created_at', endDate)
                    .order('created_at', { ascending: false });
                return (data || []).map(d => ({
                    ...d,
                    morador_nome: d.morador?.nome,
                    unidade: d.unidade ? `${d.unidade.bloco || ''} ${d.unidade.numero_unidade}` : '',
                }));
            }
            case 'ocorrencias': {
                const { data } = await supabase
                    .from('occurrences')
                    .select('*, usuario:users!user_id(nome)')
                    .eq('condo_id', condoId)
                    .gte('created_at', startDate)
                    .lte('created_at', endDate)
                    .order('created_at', { ascending: false });
                return (data || []).map(d => ({
                    ...d,
                    usuario_nome: d.usuario?.nome,
                }));
            }
            case 'moradores': {
                const { data } = await supabase
                    .from('users')
                    .select('*, unidade:units(bloco, numero_unidade)')
                    .eq('condo_id', condoId)
                    .in('role', ['morador', 'inquilino', 'sindico', 'porteiro'])
                    .order('nome');
                return (data || []).map(d => ({
                    ...d,
                    unidade: d.unidade ? `${d.unidade.bloco || ''} ${d.unidade.numero_unidade}` : '',
                    status: d.ativo ? 'Ativo' : 'Inativo',
                }));
            }
            case 'unidades': {
                const { data } = await supabase
                    .from('units')
                    .select('*, proprietario:users!proprietario_id(nome)')
                    .eq('condo_id', condoId)
                    .order('bloco')
                    .order('numero_unidade');
                return (data || []).map(d => ({
                    ...d,
                    proprietario_nome: d.proprietario?.nome || 'N/A',
                }));
            }
            default:
                return [];
        }
    };

    const handleExport = async (format: 'pdf' | 'excel') => {
        setLoading(true);
        try {
            const data = await fetchReportData();

            if (data.length === 0) {
                alert('Nenhum dado encontrado para o período selecionado');
                return;
            }

            const templateFn = ReportTemplates[reportType];
            const config = templateFn(data, condoName || 'Condomínio');

            if (format === 'pdf') {
                generatePDF(config);
            } else {
                generateExcel(config);
            }
        } catch (error: any) {
            alert('Erro ao gerar relatório: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const reportOptions = [
        { value: 'financeiro', label: 'Financeiro', desc: 'Receitas e despesas do condomínio' },
        { value: 'cobrancas', label: 'Cobranças', desc: 'Cobranças de moradores' },
        { value: 'ocorrencias', label: 'Ocorrências', desc: 'Registro de ocorrências' },
        { value: 'moradores', label: 'Moradores', desc: 'Lista de moradores e usuários' },
        { value: 'unidades', label: 'Unidades', desc: 'Cadastro de unidades' },
    ];

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <FileText className="h-6 w-6 text-emerald-500" />
                    Relatórios
                </h1>
                <p className="text-gray-500">Exporte relatórios em PDF ou Excel</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                <Card
                    className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white border-0 cursor-pointer hover:scale-105 transition-transform"
                    onClick={() => setReportType('financeiro')}
                >
                    <CardContent className="py-4 text-center">
                        <FileText className="h-6 w-6 mx-auto mb-1 opacity-80" />
                        <p className="text-xs text-emerald-100">Financeiro</p>
                    </CardContent>
                </Card>
                <Card
                    className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0 cursor-pointer hover:scale-105 transition-transform"
                    onClick={() => setReportType('cobrancas')}
                >
                    <CardContent className="py-4 text-center">
                        <FileText className="h-6 w-6 mx-auto mb-1 opacity-80" />
                        <p className="text-xs text-blue-100">Cobranças</p>
                    </CardContent>
                </Card>
                <Card
                    className="bg-gradient-to-br from-orange-500 to-orange-600 text-white border-0 cursor-pointer hover:scale-105 transition-transform"
                    onClick={() => setReportType('ocorrencias')}
                >
                    <CardContent className="py-4 text-center">
                        <FileText className="h-6 w-6 mx-auto mb-1 opacity-80" />
                        <p className="text-xs text-orange-100">Ocorrências</p>
                    </CardContent>
                </Card>
                <Card
                    className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0 cursor-pointer hover:scale-105 transition-transform"
                    onClick={() => setReportType('moradores')}
                >
                    <CardContent className="py-4 text-center">
                        <FileText className="h-6 w-6 mx-auto mb-1 opacity-80" />
                        <p className="text-xs text-purple-100">Moradores</p>
                    </CardContent>
                </Card>
                <Card
                    className="bg-gradient-to-br from-indigo-500 to-indigo-600 text-white border-0 cursor-pointer hover:scale-105 transition-transform"
                    onClick={() => setReportType('unidades')}
                >
                    <CardContent className="py-4 text-center">
                        <FileText className="h-6 w-6 mx-auto mb-1 opacity-80" />
                        <p className="text-xs text-indigo-100">Unidades</p>
                    </CardContent>
                </Card>
            </div>

            {/* Filtros */}
            <Card>
                <CardContent className="p-6">
                    <div className="grid md:grid-cols-4 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Tipo de Relatório
                            </label>
                            <Select
                                value={reportType}
                                onChange={(e) => setReportType(e.target.value as ReportType)}
                                options={reportOptions.map(o => ({ value: o.value, label: o.label }))}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Data Início
                            </label>
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Data Fim
                            </label>
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                            />
                        </div>
                        <div className="flex items-end gap-2">
                            <Button onClick={() => handleExport('pdf')} loading={loading} className="flex-1">
                                <Download className="h-4 w-4 mr-2" />
                                PDF
                            </Button>
                            <Button onClick={() => handleExport('excel')} loading={loading} variant="outline" className="flex-1">
                                <FileSpreadsheet className="h-4 w-4 mr-2" />
                                Excel
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Report Types Grid */}
            <div className="grid md:grid-cols-3 gap-4">
                {reportOptions.map((opt) => (
                    <Card
                        key={opt.value}
                        className={`cursor-pointer transition hover:shadow-md ${reportType === opt.value ? 'ring-2 ring-emerald-500' : ''}`}
                        onClick={() => setReportType(opt.value as ReportType)}
                    >
                        <CardContent className="p-4">
                            <div className="flex items-start gap-3">
                                <div className={`p-2 rounded-lg ${reportType === opt.value ? 'bg-emerald-100' : 'bg-gray-100'}`}>
                                    <FileText className={`h-5 w-5 ${reportType === opt.value ? 'text-emerald-600' : 'text-gray-500'}`} />
                                </div>
                                <div>
                                    <h3 className="font-medium text-gray-900">{opt.label}</h3>
                                    <p className="text-sm text-gray-500">{opt.desc}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Preview Info */}
            <Card className="bg-blue-50 border-blue-200">
                <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                        <Calendar className="h-5 w-5 text-blue-600 mt-0.5" />
                        <div>
                            <h3 className="font-medium text-blue-900">Sobre os Relatórios</h3>
                            <ul className="text-sm text-blue-700 mt-1 space-y-1">
                                <li>• Relatórios PDF incluem cabeçalho profissional com logo do sistema</li>
                                <li>• Exportação Excel permite edição e análise avançada dos dados</li>
                                <li>• Filtro de datas aplicado em relatórios com histórico (financeiro, cobranças, ocorrências)</li>
                                <li>• Relatórios de moradores e unidades mostram o cadastro atual completo</li>
                            </ul>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
