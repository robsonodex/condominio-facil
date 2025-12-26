'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { QuoteAuditor } from '@/components/financeiro/QuoteAuditor';
import { Search, FileText, TrendingDown, CheckCircle, AlertTriangle, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface AuditHistory {
    id: string;
    original_file_name: string;
    supplier_name: string;
    status: string;
    total_original: number;
    savings_potential: number;
    created_at: string;
}

export default function AuditorOrcamentosPage() {
    const [history, setHistory] = useState<AuditHistory[]>([]);
    const [loading, setLoading] = useState(true);
    const [condoId, setCondoId] = useState<string | null>(null);
    const [userId, setUserId] = useState<string | null>(null);

    const [isSuperadmin, setIsSuperadmin] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [genStatus, setGenStatus] = useState<string | null>(null);

    const supabase = createClient();

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            setUserId(user.id);

            const { data: profile } = await supabase
                .from('users')
                .select('condo_id, role')
                .eq('id', user.id)
                .single();

            if (profile) {
                setIsSuperadmin(profile.role === 'superadmin');
                if (profile.condo_id) {
                    setCondoId(profile.condo_id);

                    const { data: audits } = await supabase
                        .from('quote_audits')
                        .select('*')
                        .eq('condo_id', profile.condo_id)
                        .order('created_at', { ascending: false })
                        .limit(10);

                    setHistory(audits || []);
                }
            }
        } catch (error) {
            console.error('Erro:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleGenerateEmbeddings = async () => {
        if (!confirm('Deseja gerar os vetores (embeddings) para a base de preços? Isso ativará a inteligência do auditor.')) return;

        setIsGenerating(true);
        setGenStatus('Gerando vetores...');

        try {
            const response = await fetch('/api/admin/embeddings/generate', { method: 'POST' });
            const data = await response.json();

            if (response.ok) {
                alert(data.message || 'Busca semântica ativada com sucesso!');
                setGenStatus('Ativada!');
            } else {
                alert('Erro ao gerar embeddings: ' + (data.error || 'Erro desconhecido'));
                setGenStatus('Erro');
            }
        } catch (error) {
            console.error('Erro:', error);
            alert('Erro de conexão ao gerar embeddings');
            setGenStatus('Erro');
        } finally {
            setIsGenerating(false);
        }
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value || 0);
    };

    const totalSavings = history.reduce((acc, a) => acc + (a.savings_potential || 0), 0);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                        <Search className="h-6 w-6 text-purple-600" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Auditor de Orçamentos</h1>
                        <p className="text-sm text-gray-500">Análise inteligente de preços baseada no mercado do RJ</p>
                    </div>
                </div>

                {isSuperadmin && (
                    <button
                        onClick={handleGenerateEmbeddings}
                        disabled={isGenerating}
                        className={cn(
                            "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
                            isGenerating
                                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                : "bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200"
                        )}
                    >
                        <Search className={cn("h-4 w-4", isGenerating && "animate-pulse")} />
                        {isGenerating ? genStatus : 'Ativar Busca Semântica IA'}
                    </button>
                )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-4 text-white">
                    <FileText className="h-8 w-8 mb-2 opacity-80" />
                    <p className="text-2xl font-bold">{history.length}</p>
                    <p className="text-sm text-purple-100">Orçamentos auditados</p>
                </div>
                <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl p-4 text-white">
                    <CheckCircle className="h-8 w-8 mb-2 opacity-80" />
                    <p className="text-2xl font-bold">{history.filter(h => h.status === 'approved').length}</p>
                    <p className="text-sm text-emerald-100">Aprovados</p>
                </div>
                <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl p-4 text-white">
                    <AlertTriangle className="h-8 w-8 mb-2 opacity-80" />
                    <p className="text-2xl font-bold">{history.filter(h => h.status === 'alert').length}</p>
                    <p className="text-sm text-red-100">Com alertas</p>
                </div>
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-4 text-white">
                    <TrendingDown className="h-8 w-8 mb-2 opacity-80" />
                    <p className="text-2xl font-bold">{formatCurrency(totalSavings)}</p>
                    <p className="text-sm text-blue-100">Economia identificada</p>
                </div>
            </div>

            {/* Auditor Component */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                    📄 Envie um orçamento para análise
                </h2>
                <QuoteAuditor
                    condoId={condoId || undefined}
                    userId={userId || undefined}
                    onComplete={() => loadData()}
                />
            </div>

            {/* Histórico */}
            {history.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                    <div className="p-4 border-b bg-gray-50">
                        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                            <Clock className="h-5 w-5 text-gray-500" />
                            Histórico de Auditorias
                        </h3>
                    </div>
                    <div className="divide-y">
                        {history.map((audit) => (
                            <div key={audit.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                                <div>
                                    <p className="font-medium text-gray-900">
                                        {audit.supplier_name || audit.original_file_name || 'Orçamento'}
                                    </p>
                                    <p className="text-sm text-gray-500">
                                        {format(new Date(audit.created_at), 'dd/MM/yyyy HH:mm')}
                                    </p>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className="text-gray-600">
                                        {formatCurrency(audit.total_original)}
                                    </span>
                                    {audit.status === 'approved' ? (
                                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium">
                                            <CheckCircle className="h-3 w-3" /> Aprovado
                                        </span>
                                    ) : audit.status === 'alert' ? (
                                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">
                                            <AlertTriangle className="h-3 w-3" /> Alerta
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
                                            Pendente
                                        </span>
                                    )}
                                    {audit.savings_potential > 0 && (
                                        <span className="text-sm text-red-600 font-medium">
                                            -{formatCurrency(audit.savings_potential)}
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Info Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <h4 className="font-medium text-blue-800 mb-2">💡 Como funciona?</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                    <li>• Envie uma foto ou PDF do orçamento</li>
                    <li>• Nossa IA extrai os itens e valores automaticamente</li>
                    <li>• Comparamos com a base de preços de referência do Rio de Janeiro</li>
                    <li>• Você recebe um relatório instantâneo com alertas de sobrepreço</li>
                </ul>
            </div>
        </div>
    );
}
