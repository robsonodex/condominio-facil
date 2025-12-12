'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Trash } from 'lucide-react';

export default function NovaEnquetePage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        start_at: '',
        end_at: '',
        options: [{ label: '', id: 'opt_1' }, { label: '', id: 'opt_2' }]
    });

    function addOption() {
        setFormData(prev => ({
            ...prev,
            options: [...prev.options, { label: '', id: `opt_${Date.now()}` }]
        }));
    }

    function removeOption(index: number) {
        setFormData(prev => ({
            ...prev,
            options: prev.options.filter((_, i) => i !== index)
        }));
    }

    function updateOption(index: number, val: string) {
        const newOpts = [...formData.options];
        newOpts[index].label = val;
        setFormData({ ...formData, options: newOpts });
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await fetch('/api/governanca/enquetes', {
                method: 'POST',
                body: JSON.stringify(formData)
            });
            if (!res.ok) throw new Error('Erro ao criar enquete');
            router.push('/governanca/enquetes');
        } catch (error) {
            alert('Erro ao criar enquete');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="p-6 max-w-2xl mx-auto">
            <Card>
                <CardHeader>
                    <CardTitle>Criar Nova Enquete</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label>Título da Pergunta</Label>
                            <Input
                                required
                                value={formData.title}
                                onChange={e => setFormData({ ...formData, title: e.target.value })}
                                placeholder="Ex: Aprovação da pintura da fachada"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Descrição Adicional</Label>
                            <Textarea
                                value={formData.description}
                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Início</Label>
                                <Input type="datetime-local" value={formData.start_at} onChange={e => setFormData({ ...formData, start_at: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                                <Label>Fim</Label>
                                <Input type="datetime-local" value={formData.end_at} onChange={e => setFormData({ ...formData, end_at: e.target.value })} />
                            </div>
                        </div>

                        <div className="space-y-2 pt-2">
                            <Label>Opções de Resposta</Label>
                            {formData.options.map((opt, i) => (
                                <div key={opt.id} className="flex gap-2">
                                    <Input
                                        required
                                        placeholder={`Opção ${i + 1}`}
                                        value={opt.label}
                                        onChange={e => updateOption(i, e.target.value)}
                                    />
                                    {formData.options.length > 2 && (
                                        <Button type="button" variant="ghost" size="icon" onClick={() => removeOption(i)}>
                                            <Trash className="w-4 h-4 text-red-500" />
                                        </Button>
                                    )}
                                </div>
                            ))}
                            <Button type="button" variant="outline" size="sm" onClick={addOption} className="mt-2">
                                <Plus className="w-4 h-4 mr-2" /> Adicionar Opção
                            </Button>
                        </div>

                        <div className="flex justify-end gap-2 pt-4">
                            <Button type="button" variant="outline" onClick={() => router.back()}>Cancelar</Button>
                            <Button type="submit" disabled={loading}>Criar Enquete</Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
