'use client';
import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Download, Folder, Plus } from 'lucide-react';
import Link from 'next/link';

export default function DocumentsPage() {
    const [documents, setDocuments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

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

    if (loading) return <div className="p-8 text-center">Carregando documentos...</div>;

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">Documentos do Condomínio</h1>
                    <p className="text-gray-600">Acesse atas, regimentos, contratos e balancetes.</p>
                </div>
                <Link href="/governanca/documents/novo">
                    <Button className="bg-brand-600 hover:bg-brand-700">
                        <Plus className="w-4 h-4 mr-2" /> Publicar Documento
                    </Button>
                </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {documents.map(doc => (
                    <Card key={doc.id} className="hover:bg-gray-50 transition-colors cursor-pointer border-brand-100">
                        <CardContent className="p-6 flex items-start gap-4">
                            <div className="bg-brand-100 p-3 rounded-lg text-brand-600">
                                <FileText className="w-6 h-6" />
                            </div>
                            <div className="flex-1">
                                <h3 className="font-semibold text-gray-900">{doc.name}</h3>
                                <div className="flex items-center text-sm text-gray-500 mt-1">
                                    <Folder className="w-3 h-3 mr-1" />
                                    {doc.folder || 'Geral'}
                                </div>
                                <div className="text-xs text-gray-400 mt-2">
                                    {new Date(doc.uploaded_at).toLocaleDateString()}
                                </div>
                            </div>
                            <a href={doc.storage_path} target="_blank" rel="noopener noreferrer" download>
                                <Button variant="ghost" size="icon" className="text-gray-400 hover:text-brand-600">
                                    <Download className="w-5 h-5" />
                                </Button>
                            </a>
                        </CardContent>
                    </Card>
                ))}

                {documents.length === 0 && (
                    <div className="col-span-full py-12 text-center bg-gray-50 rounded-lg border border-dashed">
                        <p className="text-gray-500">Nenhum documento disponível.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
