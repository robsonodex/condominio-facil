'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, Button } from '@/components/ui';
import { useUser } from '@/hooks/useUser';
import { createClient } from '@/lib/supabase/client';
import { Vote, FileText, Users, Calendar, Plus, ChevronRight, CheckCircle, Clock, AlertCircle, X } from 'lucide-react';
import { formatDate } from '@/lib/utils';

type TabType = 'enquetes' | 'assembleias' | 'documentos';

export default function GovernancaPage() {
    const { condoId, isSindico, isSuperAdmin } = useUser();
    const [activeTab, setActiveTab] = useState<TabType>('enquetes');
    const [enquetes, setEnquetes] = useState<any[]>([]);
    const [assembleias, setAssembleias] = useState<any[]>([]);
    const [documentos, setDocumentos] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedItem, setSelectedItem] = useState<any>(null);
    const supabase = createClient();

    useEffect(() => {
        if (condoId || isSuperAdmin) {
            fetchData();
        }
    }, [condoId]);

    const fetchData = async () => {
        setLoading(true);
        try {
            // Fetch enquetes
            const { data: pollsData } = await supabase
                .from('polls')
                .select('*')
                .eq('condo_id', condoId)
                .order('created_at', { ascending: false });
            setEnquetes(pollsData || []);

            // Fetch assembleias
            const { data: assembliesData } = await supabase
                .from('assemblies')
                .select('*')
                .eq('condo_id', condoId)
                .order('data_realizacao', { ascending: false });
            setAssembleias(assembliesData || []);

            // Fetch documentos
            const { data: docsData } = await supabase
                .from('documents')
                .select('*')
                .eq('condo_id', condoId)
                .order('created_at', { ascending: false });
            setDocumentos(docsData || []);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const stats = {
        enquetesAtivas: enquetes.filter(e => e.status === 'ativa').length,
        assembleiasAgendadas: assembleias.filter(a => a.status === 'agendada').length,
        totalDocumentos: documentos.length,
    };

    const tabs = [
        { id: 'enquetes' as TabType, label: 'Enquetes', icon: Vote, count: enquetes.length, color: 'blue' },
        { id: 'assembleias' as TabType, label: 'Assembleias', icon: Users, count: assembleias.length, color: 'purple' },
        { id: 'documentos' as TabType, label: 'Documentos', icon: FileText, count: documentos.length, color: 'amber' },
    ];

    const getCurrentItems = () => {
        switch (activeTab) {
            case 'enquetes': return enquetes;
            case 'assembleias': return assembleias;
            case 'documentos': return documentos;
            default: return [];
        }
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
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <Vote className="h-6 w-6 text-emerald-600" />
                        Governança
                    </h1>
                    <p className="text-gray-500">Gerencie enquetes, assembleias e documentos do condomínio</p>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-3 gap-4">
                <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0">
                    <CardContent className="py-4 text-center">
                        <Vote className="h-8 w-8 mx-auto mb-2 opacity-80" />
                        <p className="text-2xl font-bold">{stats.enquetesAtivas}</p>
                        <p className="text-sm text-blue-100">Enquetes Ativas</p>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0">
                    <CardContent className="py-4 text-center">
                        <Users className="h-8 w-8 mx-auto mb-2 opacity-80" />
                        <p className="text-2xl font-bold">{stats.assembleiasAgendadas}</p>
                        <p className="text-sm text-purple-100">Assembleias Agendadas</p>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-amber-500 to-amber-600 text-white border-0">
                    <CardContent className="py-4 text-center">
                        <FileText className="h-8 w-8 mx-auto mb-2 opacity-80" />
                        <p className="text-2xl font-bold">{stats.totalDocumentos}</p>
                        <p className="text-sm text-amber-100">Documentos</p>
                    </CardContent>
                </Card>
            </div>

            {/* Main Content - Two Column Layout */}
            <div className="grid lg:grid-cols-3 gap-6">
                {/* Left Panel - Tabs & List */}
                <div className="lg:col-span-1 space-y-4">
                    {/* Tab Buttons */}
                    <div className="flex flex-col gap-2">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => { setActiveTab(tab.id); setSelectedItem(null); }}
                                className={`flex items-center justify-between p-3 rounded-xl transition-all ${activeTab === tab.id
                                        ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg'
                                        : 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-200'
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <tab.icon className="h-5 w-5" />
                                    <span className="font-medium">{tab.label}</span>
                                </div>
                                <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${activeTab === tab.id ? 'bg-white/20' : 'bg-gray-100'
                                    }`}>
                                    {tab.count}
                                </span>
                            </button>
                        ))}
                    </div>

                    {/* Items List */}
                    <Card className="overflow-hidden">
                        <CardHeader className="py-3 px-4 bg-gray-50 border-b">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-sm font-medium text-gray-600">
                                    {tabs.find(t => t.id === activeTab)?.label}
                                </CardTitle>
                                {(isSindico || isSuperAdmin) && (
                                    <Button size="sm" variant="ghost" className="h-7 px-2">
                                        <Plus className="h-4 w-4" />
                                    </Button>
                                )}
                            </div>
                        </CardHeader>
                        <CardContent className="p-0 max-h-[400px] overflow-y-auto">
                            {getCurrentItems().map(item => (
                                <div
                                    key={item.id}
                                    onClick={() => setSelectedItem(item)}
                                    className={`flex items-center gap-3 p-3 border-b border-gray-100 cursor-pointer transition-colors ${selectedItem?.id === item.id ? 'bg-emerald-50' : 'hover:bg-gray-50'
                                        }`}
                                >
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-gray-900 truncate">{item.titulo || item.name}</p>
                                        <p className="text-xs text-gray-500">
                                            {formatDate(item.data_realizacao || item.created_at || item.uploaded_at)}
                                        </p>
                                    </div>
                                    <ChevronRight className="h-4 w-4 text-gray-400" />
                                </div>
                            ))}
                            {getCurrentItems().length === 0 && (
                                <div className="p-6 text-center text-gray-400">
                                    Nenhum item encontrado
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Right Panel - Detail View */}
                <div className="lg:col-span-2">
                    {selectedItem ? (
                        <Card className="h-full">
                            <CardHeader className="border-b">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <CardTitle className="text-lg">{selectedItem.titulo || selectedItem.name}</CardTitle>
                                        <p className="text-sm text-gray-500 mt-1">
                                            {formatDate(selectedItem.data_realizacao || selectedItem.created_at || selectedItem.uploaded_at)}
                                        </p>
                                    </div>
                                    <Button variant="ghost" size="sm" onClick={() => setSelectedItem(null)}>
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent className="p-6">
                                {/* Status Badge */}
                                {selectedItem.status && (
                                    <div className="mb-4">
                                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${selectedItem.status === 'ativa' || selectedItem.status === 'agendada'
                                                ? 'bg-green-100 text-green-700'
                                                : selectedItem.status === 'finalizada' || selectedItem.status === 'realizada'
                                                    ? 'bg-gray-100 text-gray-700'
                                                    : 'bg-amber-100 text-amber-700'
                                            }`}>
                                            {selectedItem.status === 'ativa' || selectedItem.status === 'agendada' ? (
                                                <Clock className="h-3 w-3" />
                                            ) : (
                                                <CheckCircle className="h-3 w-3" />
                                            )}
                                            {selectedItem.status.charAt(0).toUpperCase() + selectedItem.status.slice(1)}
                                        </span>
                                    </div>
                                )}

                                {/* Description */}
                                <div className="prose prose-sm max-w-none">
                                    <p className="text-gray-700">{selectedItem.descricao || 'Sem descrição disponível.'}</p>
                                </div>

                                {/* Additional Info based on type */}
                                {activeTab === 'assembleias' && selectedItem.local && (
                                    <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                                        <p className="text-sm text-gray-600">
                                            <span className="font-medium">Local:</span> {selectedItem.local}
                                        </p>
                                        {selectedItem.tipo && (
                                            <p className="text-sm text-gray-600 mt-1">
                                                <span className="font-medium">Tipo:</span> {selectedItem.tipo}
                                            </p>
                                        )}
                                    </div>
                                )}

                                {activeTab === 'enquetes' && (
                                    <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                                        <p className="text-sm text-gray-600">
                                            <span className="font-medium">Período:</span> {formatDate(selectedItem.data_inicio)} até {formatDate(selectedItem.data_fim)}
                                        </p>
                                    </div>
                                )}

                                {activeTab === 'documentos' && selectedItem.arquivo_url && (
                                    <div className="mt-4">
                                        <a
                                            href={selectedItem.arquivo_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                                        >
                                            <FileText className="h-4 w-4" />
                                            Baixar Documento
                                        </a>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    ) : (
                        <Card className="h-full flex items-center justify-center bg-gray-50">
                            <div className="text-center p-8">
                                <div className="w-16 h-16 mx-auto mb-4 bg-gray-200 rounded-full flex items-center justify-center">
                                    {activeTab === 'enquetes' && <Vote className="h-8 w-8 text-gray-400" />}
                                    {activeTab === 'assembleias' && <Users className="h-8 w-8 text-gray-400" />}
                                    {activeTab === 'documentos' && <FileText className="h-8 w-8 text-gray-400" />}
                                </div>
                                <h3 className="text-lg font-medium text-gray-600 mb-2">
                                    Selecione um item
                                </h3>
                                <p className="text-sm text-gray-400">
                                    Clique em um item da lista para ver os detalhes
                                </p>
                            </div>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
}
