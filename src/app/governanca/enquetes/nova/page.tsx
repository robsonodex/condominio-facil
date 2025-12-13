'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select as SelectRoot, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Plus, Trash, GripVertical } from 'lucide-react';

export default function NovaEnquetePage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        start_at: '',
        end_at: '',
        one_vote_per_unit: true,
        questions: [
            { id: Date.now(), text: '', type: 'single_choice', options: ['Opção 1', 'Opção 2'] }
        ]
    });

    function addQuestion() {
        setFormData(prev => ({
            ...prev,
            questions: [
                ...prev.questions,
                { id: Date.now(), text: '', type: 'single_choice', options: [''] }
            ]
        }));
    }

    function removeQuestion(index: number) {
        setFormData(prev => ({
            ...prev,
            questions: prev.questions.filter((_, i) => i !== index)
        }));
    }

    function updateQuestion(index: number, field: string, value: any) {
        const newQs = [...formData.questions];
        (newQs[index] as any)[field] = value;
        setFormData({ ...formData, questions: newQs });
    }

    function addOption(qIndex: number) {
        const newQs = [...formData.questions];
        newQs[qIndex].options.push('');
        setFormData({ ...formData, questions: newQs });
    }

    function updateOption(qIndex: number, optIndex: number, val: string) {
        const newQs = [...formData.questions];
        newQs[qIndex].options[optIndex] = val;
        setFormData({ ...formData, questions: newQs });
    }

    function removeOption(qIndex: number, optIndex: number) {
        const newQs = [...formData.questions];
        newQs[qIndex].options = newQs[qIndex].options.filter((_, i) => i !== optIndex);
        setFormData({ ...formData, questions: newQs });
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);

        const payload = {
            ...formData,
            // Map internal IDs to clean objects for API
            questions: formData.questions.map((q, idx) => ({
                text: q.text,
                type: q.type,
                order_index: idx,
                options: q.type !== 'text' ? q.options.filter(o => o.trim() !== '') : []
            }))
        };

        try {
            const res = await fetch('/api/governanca/enquetes', {
                method: 'POST',
                body: JSON.stringify(payload)
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
        <div className="p-6 max-w-3xl mx-auto space-y-6">
            <h1 className="text-3xl font-bold">Nova Enquete</h1>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Configurações Gerais */}
                <Card>
                    <CardHeader>
                        <CardTitle>Configurações Gerais</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>Título da Enquete</Label>
                            <Input
                                required
                                value={formData.title}
                                onChange={e => setFormData({ ...formData, title: e.target.value })}
                                placeholder="Ex: Pesquisa de Satisfação - Dezembro"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Descrição</Label>
                            <Textarea
                                value={formData.description}
                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Data Início</Label>
                                <Input type="datetime-local" value={formData.start_at} onChange={e => setFormData({ ...formData, start_at: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                                <Label>Data Fim</Label>
                                <Input type="datetime-local" value={formData.end_at} onChange={e => setFormData({ ...formData, end_at: e.target.value })} />
                            </div>
                        </div>

                        <div className="flex items-center space-x-2 pt-2">
                            <Switch
                                id="onevote"
                                checked={formData.one_vote_per_unit}
                                onCheckedChange={c => setFormData({ ...formData, one_vote_per_unit: c })}
                            />
                            <Label htmlFor="onevote">Limitar a 1 voto por unidade?</Label>
                        </div>
                    </CardContent>
                </Card>

                {/* Perguntas */}
                <div className="space-y-4">
                    <h2 className="text-xl font-semibold">Perguntas</h2>

                    {formData.questions.map((q, qIndex) => (
                        <Card key={q.id} className="border-l-4 border-l-brand-400">
                            <CardContent className="pt-6 space-y-4">
                                <div className="flex justify-between items-start">
                                    <div className="flex-1 space-y-2 mr-4">
                                        <Label>Pergunta {qIndex + 1}</Label>
                                        <Input
                                            required
                                            value={q.text}
                                            onChange={e => updateQuestion(qIndex, 'text', e.target.value)}
                                            placeholder="Digite a pergunta..."
                                        />
                                    </div>
                                    <Button type="button" variant="ghost" size="icon" onClick={() => removeQuestion(qIndex)} className="text-gray-400 hover:text-red-500">
                                        <Trash className="w-4 h-4" />
                                    </Button>
                                </div>

                                <div className="space-y-2">
                                    <Label>Tipo de Resposta</Label>
                                    <SelectRoot
                                        value={q.type}
                                        onValueChange={v => updateQuestion(qIndex, 'type', v)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="single_choice">Múltipla Escolha (Única)</SelectItem>
                                            {/* <SelectItem value="multiple_choice">Múltipla Escolha (Várias)</SelectItem> */ /* Simplified for now */}
                                            <SelectItem value="text">Texto Discursivo</SelectItem>
                                        </SelectContent>
                                    </SelectRoot>
                                </div>

                                {q.type === 'single_choice' && (
                                    <div className="space-y-2 pl-4 border-l-2 border-gray-100">
                                        <Label className="text-sm text-gray-500">Opções de Resposta</Label>
                                        {q.options.map((opt, optIndex) => (
                                            <div key={optIndex} className="flex gap-2">
                                                <Input
                                                    value={opt}
                                                    onChange={e => updateOption(qIndex, optIndex, e.target.value)}
                                                    placeholder={`Opção ${optIndex + 1}`}
                                                />
                                                <Button type="button" variant="ghost" size="icon" onClick={() => removeOption(qIndex, optIndex)}>
                                                    <Trash className="w-3 h-3 text-gray-400" />
                                                </Button>
                                            </div>
                                        ))}
                                        <Button type="button" variant="link" size="sm" onClick={() => addOption(qIndex)} className="pl-0">
                                            <Plus className="w-3 h-3 mr-1" /> Adicionar Opção
                                        </Button>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    ))}

                    <Button type="button" variant="outline" onClick={addQuestion} className="w-full border-dashed border-2 py-8 text-gray-500 hover:text-brand-600 hover:border-brand-600 hover:bg-brand-50">
                        <Plus className="w-5 h-5 mr-2" /> Adicionar Nova Pergunta
                    </Button>
                </div>

                <div className="sticky bottom-4 bg-white/90 backdrop-blur p-4 rounded-lg border shadow-lg flex justify-end gap-2">
                    <Button type="button" variant="ghost" onClick={() => router.back()}>Cancelar</Button>
                    <Button type="submit" disabled={loading} className="bg-emerald-600 hover:bg-emerald-700 min-w-[200px]">
                        {loading ? 'Salvando...' : 'Publicar Enquete'}
                    </Button>
                </div>
            </form>
        </div>
    );
}
