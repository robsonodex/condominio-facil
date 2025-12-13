'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SelectRoot, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function NovoDocumentoPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        folder: 'geral',
        storage_path: '' // In real app, this comes from upload
    });

    // Mock upload function
    async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
        // In a real implementation:
        // 1. Upload to Supabase Storage
        // 2. Get public URL
        // 3. Set storage_path to URL
        alert("Simulação: Upload de arquivo não implementado neste demo.");
        setFormData(prev => ({ ...prev, storage_path: 'https://example.com/demo.pdf' }));
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await fetch('/api/governanca/documents', {
                method: 'POST',
                body: JSON.stringify(formData)
            });
            if (!res.ok) throw new Error('Erro ao salvar documento');
            router.push('/governanca/documents');
        } catch (error) {
            alert('Erro ao salvar');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="p-6 max-w-xl mx-auto">
            <Card>
                <CardHeader>
                    <CardTitle>Publicar Documento</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label>Nome do Documento</Label>
                            <Input
                                required
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                placeholder="Ex: Ata da Assembleia Jan/2025"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Categoria / Pasta</Label>
                            <SelectRoot
                                value={formData.folder}
                                onValueChange={v => setFormData({ ...formData, folder: v })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecione" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="atas">Atas</SelectItem>
                                    <SelectItem value="financeiro">Financeiro</SelectItem>
                                    <SelectItem value="contratos">Contratos</SelectItem>
                                    <SelectItem value="regimento">Regimento/Convenção</SelectItem>
                                    <SelectItem value="geral">Geral</SelectItem>
                                </SelectContent>
                            </SelectRoot>
                        </div>

                        <div className="space-y-2">
                            <Label>Arquivo (PDF/Doc)</Label>
                            <Input type="file" onChange={handleUpload} />
                            {formData.storage_path && <p className="text-xs text-green-600">Arquivo pronto para salvar.</p>}
                        </div>

                        <div className="flex justify-end gap-2 pt-4">
                            <Button type="button" variant="outline" onClick={() => router.back()}>Cancelar</Button>
                            <Button type="submit" disabled={loading}>Publicar</Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
