'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, Button, Badge } from '@/components/ui';
import { useAuth } from '@/hooks/useAuth';
import { createClient } from '@/lib/supabase/client';
import { FileText, Plus, Download, Folder, File, Calendar, Eye, Upload } from 'lucide-react';

interface Documento {
    id: string;
    titulo: string;
    descricao: string;
    categoria: string;
    arquivo_url: string;
    tamanho_bytes: number;
    created_at: string;
    updated_at: string;
}

const categorias = [
    { value: 'regulamento', label: 'Regulamento Interno', icon: '📋' },
    { value: 'convencao', label: 'Convenção', icon: '📜' },
    { value: 'ata', label: 'Atas de Reunião', icon: '📝' },
    { value: 'financeiro', label: 'Documentos Financeiros', icon: '💰' },
    { value: 'contrato', label: 'Contratos', icon: '📄' },
    { value: 'laudo', label: 'Laudos Técnicos', icon: '🔧' },
    { value: 'outros', label: 'Outros', icon: '📁' },
];

export default function DocumentosPage() {
    const { profile } = useAuth();
    const [documentos, setDocumentos] = useState<Documento[]>([]);
    const [loading, setLoading] = useState(true);
    const [categoriaFiltro, setCategoriaFiltro] = useState('');
    const supabase = createClient();

    useEffect(() => {
        fetchDocumentos();
    }, []);

    const fetchDocumentos = async () => {
        try {
            // Placeholder - será implementado quando a tabela existir
            setDocumentos([]);
        } catch (error) {
            console.error('Erro ao buscar documentos:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const getCategoriaInfo = (categoria: string) => {
        return categorias.find(c => c.value === categoria) || { label: categoria, icon: '📁' };
    };

    const documentosFiltrados = categoriaFiltro
        ? documentos.filter(d => d.categoria === categoriaFiltro)
        : documentos;

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <FileText className="h-7 w-7 text-amber-600" />
                        Documentos do Condomínio
                    </h1>
                    <p className="text-gray-500">Gerencie documentos importantes do condomínio</p>
                </div>
                <Button className="bg-amber-600 hover:bg-amber-700 text-white">
                    <Upload className="h-4 w-4 mr-2" />
                    Enviar Documento
                </Button>
            </div>

            {/* Filtros por categoria */}
            <div className="flex flex-wrap gap-2">
                <Button
                    variant={categoriaFiltro === '' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setCategoriaFiltro('')}
                    className={categoriaFiltro === '' ? 'bg-amber-600 text-white' : ''}
                >
                    Todos
                </Button>
                {categorias.map((cat) => (
                    <Button
                        key={cat.value}
                        variant={categoriaFiltro === cat.value ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setCategoriaFiltro(cat.value)}
                        className={categoriaFiltro === cat.value ? 'bg-amber-600 text-white' : ''}
                    >
                        {cat.icon} {cat.label}
                    </Button>
                ))}
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-12">
                    <div className="animate-spin h-8 w-8 border-4 border-amber-500 border-t-transparent rounded-full" />
                </div>
            ) : documentosFiltrados.length === 0 ? (
                <Card>
                    <CardContent className="py-12 text-center">
                        <Folder className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-600 mb-2">
                            {categoriaFiltro ? 'Nenhum documento nesta categoria' : 'Nenhum documento cadastrado'}
                        </h3>
                        <p className="text-gray-400 mb-4">
                            Faça upload de documentos importantes do condomínio
                        </p>
                        <Button className="bg-amber-600 hover:bg-amber-700 text-white">
                            <Upload className="h-4 w-4 mr-2" />
                            Enviar Primeiro Documento
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {documentosFiltrados.map((doc) => {
                        const catInfo = getCategoriaInfo(doc.categoria);
                        return (
                            <Card key={doc.id} className="hover:shadow-md transition-shadow">
                                <CardContent className="p-4">
                                    <div className="flex items-start gap-3">
                                        <div className="text-3xl">{catInfo.icon}</div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-semibold text-gray-900 truncate">{doc.titulo}</h3>
                                            <p className="text-sm text-gray-500 line-clamp-2">{doc.descricao}</p>
                                            <div className="flex items-center gap-2 mt-2 text-xs text-gray-400">
                                                <span className="flex items-center gap-1">
                                                    <Calendar className="h-3 w-3" />
                                                    {new Date(doc.created_at).toLocaleDateString('pt-BR')}
                                                </span>
                                                <span>{formatFileSize(doc.tamanho_bytes)}</span>
                                            </div>
                                            <div className="flex gap-2 mt-3">
                                                <Button variant="outline" size="sm" className="flex-1">
                                                    <Eye className="h-4 w-4 mr-1" />
                                                    Ver
                                                </Button>
                                                <Button variant="outline" size="sm" className="flex-1">
                                                    <Download className="h-4 w-4 mr-1" />
                                                    Baixar
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
