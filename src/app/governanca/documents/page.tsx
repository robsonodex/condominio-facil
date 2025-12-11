'use client';
import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function DocumentsPage() {
    const [docs, setDocs] = useState<any[]>([]);

    useEffect(() => {
        fetch('/api/governanca/documents').then(r => r.json()).then(d => setDocs(d.documents || []));
    }, []);

    return (
        <div className="p-6 space-y-6">
            <h1 className="text-3xl font-bold">Documentos do Condomínio</h1>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {docs.map(doc => (
                    <Card key={doc.id} className="hover:bg-gray-50 cursor-pointer">
                        <CardContent className="p-6 flex flex-col items-center gap-2">
                            <div className="text-4xl">📄</div>
                            <div className="font-semibold text-center">{doc.name}</div>
                            <div className="text-xs text-gray-500">{new Date(doc.uploaded_at).toLocaleDateString()}</div>
                        </CardContent>
                    </Card>
                ))}
                <Card className="border-dashed border-2 flex items-center justify-center p-6 text-gray-400">
                    Upload Novo Documento
                </Card>
            </div>
        </div>
    );
}
