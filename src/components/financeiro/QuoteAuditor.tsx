'use client';

import { useState } from 'react';
import { Upload, CheckCircle2, AlertTriangle, Loader2, FileText, TrendingDown, Info, X } from 'lucide-react';

interface AuditItem {
    descricao: string;
    valor_orcamento: number;
    status: 'aprovado' | 'atencao' | 'alerta' | 'sem_referencia';
    mensagem: string;
    variacao: string | null;
    economia: number;
    benchmark: {
        descricao: string;
        preco_medio: number;
        unidade: string;
        similaridade: string;
    } | null;
}

interface AuditResult {
    status: 'approved' | 'alert' | 'error';
    message: string;
    fornecedor: string;
    items: AuditItem[];
    resumo: {
        total_orcamento: number;
        total_referencia: number | null;
        economia_potencial: number;
        variacao_geral: string | null;
        itens_em_alerta: number;
        itens_aprovados: number;
        itens_sem_referencia: number;
    };
}

interface QuoteAuditorProps {
    condoId?: string;
    userId?: string;
    onComplete?: (result: AuditResult) => void;
}

export function QuoteAuditor({ condoId, userId, onComplete }: QuoteAuditorProps) {
    const [status, setStatus] = useState<'idle' | 'analyzing' | 'done'>('idle');
    const [result, setResult] = useState<AuditResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [showDetails, setShowDetails] = useState(false);

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setStatus('analyzing');
        setError(null);

        try {
            const formData = new FormData();
            formData.append('file', file);
            if (condoId) formData.append('condo_id', condoId);
            if (userId) formData.append('user_id', userId);

            const res = await fetch('/api/financeiro/audit', {
                method: 'POST',
                body: formData,
            });

            const data = await res.json();

            if (!res.ok || data.status === 'error') {
                throw new Error(data.message || 'Erro ao processar');
            }

            setResult(data);
            setStatus('done');
            onComplete?.(data);
        } catch (err: any) {
            setError(err.message);
            setStatus('idle');
        }
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value);
    };

    const getStatusColor = (itemStatus: string) => {
        switch (itemStatus) {
            case 'aprovado': return 'bg-emerald-50 border-emerald-200 text-emerald-700';
            case 'atencao': return 'bg-amber-50 border-amber-200 text-amber-700';
            case 'alerta': return 'bg-red-50 border-red-200 text-red-700';
            default: return 'bg-gray-50 border-gray-200 text-gray-600';
        }
    };

    const reset = () => {
        setStatus('idle');
        setResult(null);
        setError(null);
        setShowDetails(false);
    };

    return (
        <div className="w-full">
            {/* Estado Inicial - Upload */}
            {status === 'idle' && (
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-blue-400 hover:bg-blue-50/50 transition-all cursor-pointer">
                    <input
                        type="file"
                        id="audit-file"
                        className="hidden"
                        onChange={handleUpload}
                        accept=".pdf,.jpg,.jpeg,.png,.webp"
                    />
                    <label htmlFor="audit-file" className="cursor-pointer flex flex-col items-center">
                        <div className="p-4 bg-blue-100 rounded-full mb-4">
                            <Upload className="w-8 h-8 text-blue-600" />
                        </div>
                        <span className="text-lg font-semibold text-gray-800">Auditar Orçamento</span>
                        <span className="text-sm text-gray-500 mt-1">
                            Arraste uma foto ou PDF do orçamento
                        </span>
                        <span className="text-xs text-gray-400 mt-2">
                            Nossa IA irá comparar os preços com a média do RJ
                        </span>
                    </label>
                    {error && (
                        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                            {error}
                        </div>
                    )}
                </div>
            )}

            {/* Estado de Análise */}
            {status === 'analyzing' && (
                <div className="border rounded-xl p-12 text-center bg-gradient-to-br from-blue-50 to-purple-50">
                    <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
                    <p className="text-lg font-semibold text-gray-800">Analisando orçamento...</p>
                    <p className="text-sm text-gray-500 mt-2">
                        Consultando base de preços do Rio de Janeiro
                    </p>
                    <div className="mt-4 flex justify-center gap-2">
                        <span className="text-xs bg-white/80 px-3 py-1 rounded-full text-gray-500">
                            🔍 Extraindo dados
                        </span>
                        <span className="text-xs bg-white/80 px-3 py-1 rounded-full text-gray-500">
                            📊 Comparando preços
                        </span>
                    </div>
                </div>
            )}

            {/* Resultado */}
            {status === 'done' && result && (
                <div className="space-y-4">
                    {/* Card Principal */}
                    <div className={`rounded-xl border-l-4 p-6 ${result.status === 'alert'
                            ? 'border-l-red-500 bg-red-50'
                            : 'border-l-emerald-500 bg-emerald-50'
                        }`}>
                        <div className="flex items-start gap-4">
                            {result.status === 'alert' ? (
                                <AlertTriangle className="w-8 h-8 text-red-500 shrink-0" />
                            ) : (
                                <CheckCircle2 className="w-8 h-8 text-emerald-500 shrink-0" />
                            )}
                            <div className="flex-1">
                                <h3 className="text-xl font-bold text-gray-900">
                                    {result.status === 'alert' ? 'Atenção: Possível Sobrepreço' : 'Orçamento Aprovado ✓'}
                                </h3>
                                <p className="text-gray-600 mt-1">{result.message}</p>

                                {result.fornecedor && (
                                    <p className="text-sm text-gray-500 mt-2">
                                        <FileText className="w-4 h-4 inline mr-1" />
                                        Fornecedor: <strong>{result.fornecedor}</strong>
                                    </p>
                                )}

                                {/* Economia Potencial */}
                                {result.resumo.economia_potencial > 0 && (
                                    <div className="mt-4 p-4 bg-red-100 rounded-lg border border-red-200">
                                        <div className="flex items-center gap-2 text-red-800">
                                            <TrendingDown className="w-5 h-5" />
                                            <span className="font-bold text-lg">
                                                Economia potencial: {formatCurrency(result.resumo.economia_potencial)}
                                            </span>
                                        </div>
                                        <p className="text-sm text-red-600 mt-1">
                                            Valores acima da média em {result.resumo.itens_em_alerta} item(ns)
                                        </p>
                                    </div>
                                )}

                                {/* Resumo */}
                                <div className="mt-4 grid grid-cols-3 gap-3 text-center">
                                    <div className="bg-white p-3 rounded-lg border">
                                        <p className="text-2xl font-bold text-gray-900">
                                            {formatCurrency(result.resumo.total_orcamento)}
                                        </p>
                                        <p className="text-xs text-gray-500">Total do Orçamento</p>
                                    </div>
                                    {result.resumo.total_referencia && (
                                        <div className="bg-white p-3 rounded-lg border">
                                            <p className="text-2xl font-bold text-blue-600">
                                                {formatCurrency(result.resumo.total_referencia)}
                                            </p>
                                            <p className="text-xs text-gray-500">Referência RJ</p>
                                        </div>
                                    )}
                                    {result.resumo.variacao_geral && (
                                        <div className="bg-white p-3 rounded-lg border">
                                            <p className={`text-2xl font-bold ${parseFloat(result.resumo.variacao_geral) > 0 ? 'text-red-600' : 'text-emerald-600'
                                                }`}>
                                                {parseFloat(result.resumo.variacao_geral) > 0 ? '+' : ''}{result.resumo.variacao_geral}
                                            </p>
                                            <p className="text-xs text-gray-500">Variação</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Botão para ver detalhes */}
                    <button
                        onClick={() => setShowDetails(!showDetails)}
                        className="w-full flex items-center justify-center gap-2 py-2 text-sm text-gray-600 hover:text-gray-900"
                    >
                        <Info className="w-4 h-4" />
                        {showDetails ? 'Ocultar detalhes' : 'Ver análise item a item'}
                    </button>

                    {/* Detalhes por item */}
                    {showDetails && (
                        <div className="space-y-3">
                            {result.items.map((item, i) => (
                                <div
                                    key={i}
                                    className={`p-4 rounded-lg border ${getStatusColor(item.status)}`}
                                >
                                    <div className="flex justify-between items-start gap-4">
                                        <div className="flex-1">
                                            <p className="font-medium">{item.descricao}</p>
                                            <p className="text-sm mt-1">{item.mensagem}</p>
                                            {item.benchmark && (
                                                <p className="text-xs mt-2 opacity-75">
                                                    Referência: {item.benchmark.descricao} ({item.benchmark.similaridade} similar)
                                                </p>
                                            )}
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-lg">
                                                {formatCurrency(item.valor_orcamento)}
                                            </p>
                                            {item.variacao && (
                                                <p className={`text-sm ${parseFloat(item.variacao) > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                                                    {parseFloat(item.variacao) > 0 ? '+' : ''}{item.variacao}%
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Botão para nova auditoria */}
                    <button
                        onClick={reset}
                        className="w-full flex items-center justify-center gap-2 py-3 text-sm text-gray-500 hover:text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50"
                    >
                        <Upload className="w-4 h-4" />
                        Auditar outro orçamento
                    </button>
                </div>
            )}
        </div>
    );
}
