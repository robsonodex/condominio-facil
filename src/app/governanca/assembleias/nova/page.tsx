'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

export default function NovaAssembleiaPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        start_at: '',
        is_virtual: false,
        virtual_link: ''
    });

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await fetch('/api/governanca/assembleias', {
                method: 'POST',
                body: JSON.stringify(formData)
            });
            if (!res.ok) throw new Error('Erro ao criar assembleia');
            router.push('/governanca/assembleias');
        } catch (error) {
            alert('Erro ao criar assembleia');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="p-6 max-w-2xl mx-auto">
            <Card>
                <CardHeader>
                    <CardTitle>Agendar Nova Assembleia</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label>Título</Label>
                            <Input
                                required
                                value={formData.title}
                                onChange={e => setFormData({ ...formData, title: e.target.value })}
                                placeholder="Ex: Assembleia Geral Ordinária"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Descrição / Pauta Geral</Label>
                            <Textarea
                                value={formData.description}
                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                                placeholder="Descreva os tópicos principais..."
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Data e Hora</Label>
                            <Input
                                type="datetime-local"
                                required
                                value={formData.start_at}
                                onChange={e => setFormData({ ...formData, start_at: e.target.value })}
                            />
                        </div>

                        <div className="flex items-center space-x-2 py-2">
                            <Switch
                                id="virtual"
                                checked={formData.is_virtual}
                                onCheckedChange={c => setFormData({ ...formData, is_virtual: c })}
                            />
                            <Label htmlFor="virtual">Assembleia Virtual?</Label>
                        </div>

                        {formData.is_virtual && (
                            <div className="space-y-2">
                                <Label>Link da Sala (Zoom/Meet)</Label>
                                <Input
                                    value={formData.virtual_link}
                                    onChange={e => setFormData({ ...formData, virtual_link: e.target.value })}
                                    placeholder="https://meet.google.com/..."
                                />
                            </div>
                        )}

                        <div className="flex justify-end gap-2 pt-4">
                            <Button type="button" variant="outline" onClick={() => router.back()}>Cancelar</Button>
                            <Button type="submit" disabled={loading}>
                                {loading ? 'Agendando...' : 'Agendar Assembleia'}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
