'use client';

import React, { useEffect, useState, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui';
import { FileText, Download, Folder, Plus, X, Upload, Search, File, FileSpreadsheet, Calendar, Trash2 } from 'lucide-react';
import { useUser } from '@/hooks/useUser';
import { formatDate } from '@/lib/utils';

const categoryIcons: Record<string, React.ReactNode> = {
    'ata': <FileText className="h-6 w-6" />,
    'regulamento': <File className="h-6 w-6" />,
    'legal': <FileSpreadsheet className="h-6 w-6" />,
    'financeiro': <FileSpreadsheet className="h-6 w-6" />,
    'outros': <File className="h-6 w-6" />,
};

const categoryColors: Record<string, string> = {
    'ata': 'bg-blue-100 text-blue-600',
    'regulamento': 'bg-purple-100 text-purple-600',
    'legal': 'bg-amber-100 text-amber-600',
    'financeiro': 'bg-emerald-100 text-emerald-600',
    'outros': 'bg-gray-100 text-gray-600',
};

export default function DocumentsPage() {
    const { isSindico, isSuperAdmin } = useUser();
    const [documents, setDocuments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [selectedDoc, setSelectedDoc] = useState<any>(null);
    const [showUploadPanel, setShowUploadPanel] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        fetchDocuments();
    }, []);

    async function fetchDocuments() {
        try {
            const res = await fetch('/api/governanca/documents');
            const json = await res.json();
            if (json.documents) setDocuments(json.documents);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }

    const stats = {
        total: documents.length,
        atas: documents.filter(d => d.categoria === 'ata').length,
        regulamentos: documents.filter(d => d.categoria === 'regulamento').length,
        financeiros: documents.filter(d => d.categoria === 'financeiro').length,
    };

    const filteredDocuments = documents.filter(doc => {
        const matchesSearch = doc.titulo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            doc.descricao?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            doc.name?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = selectedCategory === 'all' || doc.categoria === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    const categories = ['all', ...new Set(documents.map(d => d.categoria || 'outros'))];

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-emerald-600 border-t-transparent"></div>
            </div>
        );
    }

    return (
        <div className="flex h-[calc(100vh-120px)]">
            {/* Main Content */}
            <div className={`flex-1 overflow-auto p-6 transition-all ${selectedDoc || showUploadPanel ? 'mr-[450px]' : ''}`}>
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                            <FileText className="h-6 w-6 text-amber-600" />
                            Documentos do Condomínio
                        </h1>
                        <p className="text-gray-500">Atas, regimentos, contratos e balancetes</p>
                    </div>
                    {(isSindico || isSuperAdmin) && (
                        <Button onClick={() => { setShowUploadPanel(true); setSelectedDoc(null); }}>
                            <Upload className="h-4 w-4 mr-2" />
                            Enviar Documento
                        </Button>
                    )}
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0">
                        <CardContent className="py-4 text-center">
                            <FileText className="h-8 w-8 mx-auto mb-2 opacity-80" />
                            <p className="text-2xl font-bold">{stats.total}</p>
                            <p className="text-sm text-blue-100">Total</p>
                        </CardContent>
                    </Card>
                    <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0">
                        <CardContent className="py-4 text-center">
                            <File className="h-8 w-8 mx-auto mb-2 opacity-80" />
                            <p className="text-2xl font-bold">{stats.atas}</p>
                            <p className="text-sm text-purple-100">Atas</p>
                        </CardContent>
                    </Card>
                    <Card className="bg-gradient-to-br from-amber-500 to-amber-600 text-white border-0">
                        <CardContent className="py-4 text-center">
                            <FileSpreadsheet className="h-8 w-8 mx-auto mb-2 opacity-80" />
                            <p className="text-2xl font-bold">{stats.regulamentos}</p>
                            <p className="text-sm text-amber-100">Regulamentos</p>
                        </CardContent>
                    </Card>
                    <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white border-0">
                        <CardContent className="py-4 text-center">
                            <FileSpreadsheet className="h-8 w-8 mx-auto mb-2 opacity-80" />
                            <p className="text-2xl font-bold">{stats.financeiros}</p>
                            <p className="text-sm text-emerald-100">Financeiros</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Search and Filter */}
                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                            placeholder="Buscar documentos..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                    <div className="flex gap-2 flex-wrap">
                        {categories.map(cat => (
                            <Button
                                key={cat}
                                variant={selectedCategory === cat ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setSelectedCategory(cat)}
                            >
                                {cat === 'all' ? 'Todos' : cat.charAt(0).toUpperCase() + cat.slice(1)}
                            </Button>
                        ))}
                    </div>
                </div>

                {/* Documents Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredDocuments.map(doc => (
                        <Card
                            key={doc.id}
                            className={`cursor-pointer hover:shadow-lg transition-all ${selectedDoc?.id === doc.id ? 'ring-2 ring-amber-500' : ''
                                }`}
                            onClick={() => { setSelectedDoc(doc); setShowUploadPanel(false); }}
                        >
                            <CardContent className="p-5">
                                <div className="flex items-start gap-4">
                                    <div className={`p-3 rounded-xl ${categoryColors[doc.categoria] || categoryColors['outros']}`}>
                                        {categoryIcons[doc.categoria] || categoryIcons['outros']}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-semibold text-gray-900 truncate">{doc.titulo || doc.name}</h3>
                                        {doc.descricao && (
                                            <p className="text-sm text-gray-500 mt-1 line-clamp-2">{doc.descricao}</p>
                                        )}
                                        <div className="flex items-center gap-3 mt-3 text-xs text-gray-400">
                                            <span className="flex items-center gap-1">
                                                <Folder className="h-3 w-3" />
                                                {doc.categoria || doc.folder || 'Geral'}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Calendar className="h-3 w-3" />
                                                {formatDate(doc.created_at || doc.uploaded_at)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Empty State */}
                {filteredDocuments.length === 0 && (
                    <div className="text-center py-16 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                        <FileText className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                        <h3 className="text-lg font-semibold text-gray-600 mb-2">
                            {searchTerm || selectedCategory !== 'all'
                                ? 'Nenhum documento encontrado'
                                : 'Nenhum documento publicado'}
                        </h3>
                        <p className="text-gray-400 mb-4">
                            {searchTerm || selectedCategory !== 'all'
                                ? 'Tente ajustar os filtros de busca'
                                : 'Envie o primeiro documento do condomínio'}
                        </p>
                        {(isSindico || isSuperAdmin) && !searchTerm && selectedCategory === 'all' && (
                            <Button onClick={() => setShowUploadPanel(true)}>
                                <Upload className="h-4 w-4 mr-2" />
                                Enviar Documento
                            </Button>
                        )}
                    </div>
                )}
            </div>

            {/* Document Detail Panel */}
            {selectedDoc && (
                <>
                    <div className="fixed inset-0 bg-black/20 z-40" onClick={() => setSelectedDoc(null)} />
                    <div className="fixed right-0 top-0 h-full w-[450px] bg-white shadow-2xl z-50 overflow-y-auto animate-in slide-in-from-right">
                        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
                            <h2 className="text-lg font-bold text-gray-900">Detalhes do Documento</h2>
                            <Button variant="ghost" size="sm" onClick={() => setSelectedDoc(null)}>
                                <X className="h-5 w-5" />
                            </Button>
                        </div>
                        <div className="p-6 space-y-6">
                            {/* Icon & Category */}
                            <div className="flex items-center gap-4">
                                <div className={`p-4 rounded-xl ${categoryColors[selectedDoc.categoria] || categoryColors['outros']}`}>
                                    {categoryIcons[selectedDoc.categoria] || categoryIcons['outros']}
                                </div>
                                <div>
                                    <span className="text-sm text-gray-500">Categoria</span>
                                    <p className="font-medium text-gray-900">
                                        {(selectedDoc.categoria || 'Outros').charAt(0).toUpperCase() + (selectedDoc.categoria || 'outros').slice(1)}
                                    </p>
                                </div>
                            </div>

                            {/* Title */}
                            <div>
                                <h3 className="text-xl font-bold text-gray-900 mb-2">
                                    {selectedDoc.titulo || selectedDoc.name}
                                </h3>
                                <p className="text-gray-600">
                                    {selectedDoc.descricao || 'Sem descrição disponível.'}
                                </p>
                            </div>

                            {/* Info */}
                            <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-gray-500">Data de Upload</span>
                                    <span className="font-medium text-gray-900">
                                        {formatDate(selectedDoc.created_at || selectedDoc.uploaded_at)}
                                    </span>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="space-y-2">
                                <a
                                    href={selectedDoc.arquivo_url || selectedDoc.storage_path}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="block"
                                >
                                    <Button className="w-full">
                                        <Download className="h-4 w-4 mr-2" />
                                        Baixar Documento
                                    </Button>
                                </a>
                                {(isSindico || isSuperAdmin) && (
                                    <Button variant="outline" className="w-full text-red-600 hover:bg-red-50">
                                        <Trash2 className="h-4 w-4 mr-2" />
                                        Excluir Documento
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* Upload Panel */}
            {showUploadPanel && (
                <>
                    <div className="fixed inset-0 bg-black/20 z-40" onClick={() => setShowUploadPanel(false)} />
                    <div className="fixed right-0 top-0 h-full w-[450px] bg-white shadow-2xl z-50 overflow-y-auto animate-in slide-in-from-right">
                        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
                            <h2 className="text-lg font-bold text-gray-900">Enviar Documento</h2>
                            <Button variant="ghost" size="sm" onClick={() => setShowUploadPanel(false)}>
                                <X className="h-5 w-5" />
                            </Button>
                        </div>
                        <div className="p-6 space-y-6">
                            {/* Upload Zone */}
                            <div
                                className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-emerald-500 hover:bg-emerald-50 transition-colors"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                                <p className="text-gray-600 font-medium">Clique para selecionar arquivo</p>
                                <p className="text-sm text-gray-400 mt-1">PDF, DOC ou XLSX até 10MB</p>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    className="hidden"
                                    accept=".pdf,.doc,.docx,.xls,.xlsx"
                                />
                            </div>

                            {/* Form Fields */}
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Título do Documento</label>
                                    <Input placeholder="Ex: Ata da Assembleia Ordinária" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                                    <textarea
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                        rows={3}
                                        placeholder="Breve descrição do documento..."
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
                                    <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500">
                                        <option value="ata">Ata de Reunião</option>
                                        <option value="regulamento">Regulamento</option>
                                        <option value="legal">Documento Legal</option>
                                        <option value="financeiro">Financeiro</option>
                                        <option value="outros">Outros</option>
                                    </select>
                                </div>
                            </div>

                            {/* Submit */}
                            <Button className="w-full">
                                <Upload className="h-4 w-4 mr-2" />
                                Enviar Documento
                            </Button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
