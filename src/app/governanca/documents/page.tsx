'use client';
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Download, Folder, Plus, File, FileSpreadsheet, FileImage, Clock, Users, Calendar, Search, Filter } from 'lucide-react';
import { Input } from '@/components/ui';
import Link from 'next/link';
import { useUser } from '@/hooks/useUser';

const categoryIcons: Record<string, React.ReactNode> = {
    'ata': <FileText className="h-6 w-6" />,
    'regulamento': <File className="h-6 w-6" />,
    'legal': <FileSpreadsheet className="h-6 w-6" />,
    'financeiro': <FileSpreadsheet className="h-6 w-6" />,
    'outros': <FileImage className="h-6 w-6" />,
};

const categoryColors: Record<string, string> = {
    'ata': 'from-blue-500 to-blue-600',
    'regulamento': 'from-purple-500 to-purple-600',
    'legal': 'from-amber-500 to-amber-600',
    'financeiro': 'from-emerald-500 to-emerald-600',
    'outros': 'from-gray-500 to-gray-600',
};

const categoryBgColors: Record<string, string> = {
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

    // Estatísticas
    const stats = {
        total: documents.length,
        atas: documents.filter(d => d.categoria === 'ata').length,
        regulamentos: documents.filter(d => d.categoria === 'regulamento').length,
        financeiros: documents.filter(d => d.categoria === 'financeiro').length,
    };

    // Filtrar documentos
    const filteredDocuments = documents.filter(doc => {
        const matchesSearch = doc.titulo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            doc.descricao?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = selectedCategory === 'all' || doc.categoria === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    // Agrupar por categoria
    const categories = [...new Set(documents.map(d => d.categoria || 'outros'))];

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
                        <FileText className="h-6 w-6 text-emerald-600" />
                        Documentos do Condomínio
                    </h1>
                    <p className="text-gray-500">Acesse atas, regimentos, contratos e balancetes</p>
                </div>
                {(isSindico || isSuperAdmin) && (
                    <Link href="/governanca/documents/novo">
                        <Button>
                            <Plus className="h-4 w-4 mr-2" />
                            Publicar Documento
                        </Button>
                    </Link>
                )}
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0">
                    <CardContent className="py-4 text-center">
                        <FileText className="h-8 w-8 mx-auto mb-2 opacity-80" />
                        <p className="text-2xl font-bold">{stats.total}</p>
                        <p className="text-sm text-blue-100">Total de Documentos</p>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0">
                    <CardContent className="py-4 text-center">
                        <File className="h-8 w-8 mx-auto mb-2 opacity-80" />
                        <p className="text-2xl font-bold">{stats.atas}</p>
                        <p className="text-sm text-purple-100">Atas de Reunião</p>
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
            <div className="flex flex-col sm:flex-row gap-4">
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
                    <Button
                        variant={selectedCategory === 'all' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setSelectedCategory('all')}
                    >
                        Todos
                    </Button>
                    {categories.map(cat => (
                        <Button
                            key={cat}
                            variant={selectedCategory === cat ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setSelectedCategory(cat)}
                        >
                            {cat.charAt(0).toUpperCase() + cat.slice(1)}
                        </Button>
                    ))}
                </div>
            </div>

            {/* Documents Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredDocuments.map(doc => (
                    <Card key={doc.id} className="hover:shadow-lg transition-all duration-200 group">
                        <CardContent className="p-5">
                            <div className="flex items-start gap-4">
                                <div className={`p-3 rounded-xl ${categoryBgColors[doc.categoria] || categoryBgColors['outros']}`}>
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
                                            {new Date(doc.created_at || doc.uploaded_at).toLocaleDateString('pt-BR')}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <div className="mt-4 pt-4 border-t border-gray-100 flex justify-end">
                                <a
                                    href={doc.arquivo_url || doc.storage_path}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 text-sm font-medium text-emerald-600 hover:text-emerald-700 transition-colors"
                                >
                                    <Download className="h-4 w-4" />
                                    Baixar PDF
                                </a>
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
                    <p className="text-gray-400 mb-6">
                        {searchTerm || selectedCategory !== 'all'
                            ? 'Tente ajustar os filtros de busca'
                            : 'Comece publicando atas, regimentos e outros documentos'}
                    </p>
                    {(isSindico || isSuperAdmin) && !searchTerm && selectedCategory === 'all' && (
                        <Link href="/governanca/documents/novo">
                            <Button>
                                <Plus className="h-4 w-4 mr-2" />
                                Publicar Primeiro Documento
                            </Button>
                        </Link>
                    )}
                </div>
            )}
        </div>
    );
}
