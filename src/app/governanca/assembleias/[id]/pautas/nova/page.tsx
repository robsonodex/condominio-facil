'use client';
import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Plus, Trash2, Save } from 'lucide-react';

interface PautaForm {
    title: string;
    description: string;
    quorum_type: 'simple' | 'absolute' | 'two_thirds' | 'unanimous' | 'custom';
    quorum_custom?: number;
}

export default function NovaPautaPage() {
    const params = useParams();
    const router = useRouter();
    const assemblyId = params.id as string;

    const [pautas, setPautas] = useState<PautaForm[]>([
        { title: '', description: '', quorum_type: 'simple' }
    ]);
    const [saving, setSaving] = useState(false);

    function addPauta() {
        setPautas([...pautas, { title: '', description: '', quorum_type: 'simple' }]);
    }

    function removePauta(index: number) {
        if (pautas.length === 1) return;
        setPautas(pautas.filter((_, i) => i !== index));
    }

    function updatePauta(index: number, field: keyof PautaForm, value: any) {
        const updated = [...pautas];
        updated[index] = { ...updated[index], [field]: value };
        setPautas(updated);
    }

    async function handleSave() {
        // Validate
        for (const pauta of pautas) {
            if (!pauta.title.trim()) {
                alert('Todas as pautas precisam de um título');
                return;
            }
        }

        setSaving(true);
        try {
            for (const pauta of pautas) {
                const res = await fetch(`/api/governanca/assembleias/${assemblyId}/pautas`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(pauta)
                });

                if (!res.ok) {
                    const json = await res.json();
                    throw new Error(json.error || 'Erro ao salvar pauta');
                }
            }

            alert('Pautas salvas com sucesso!');
            router.push(`/governanca/assembleias/${assemblyId}`);
        } catch (e: any) {
            alert(e.message);
        } finally {
            setSaving(false);
        }
    }

    return (
        <div className="p-6 max-w-3xl mx-auto space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" onClick={() => router.back()}>
                    <ArrowLeft className="w-4 h-4" />
                </Button>
                <h1 className="text-2xl font-bold">Adicionar Pautas</h1>
            </div>

            <div className="space-y-4">
                {pautas.map((pauta, index) => (
                    <Card key={index}>
                        <CardHeader className="pb-2">
                            <div className="flex justify-between items-center">
                                <CardTitle className="text-lg">Pauta {index + 1}</CardTitle>
                                {pautas.length > 1 && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => removePauta(index)}
                                    >
                                        <Trash2 className="w-4 h-4 text-red-500" />
                                    </Button>
                                )}
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Título *</label>
                                <Input
                                    value={pauta.title}
                                    onChange={(e) => updatePauta(index, 'title', e.target.value)}
                                    placeholder="Ex: Aprovação do orçamento 2025"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Descrição</label>
                                <textarea
                                    className="w-full border rounded-lg p-3 min-h-[80px]"
                                    value={pauta.description}
                                    onChange={(e) => updatePauta(index, 'description', e.target.value)}
                                    placeholder="Detalhes da pauta..."
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Tipo de Quórum</label>
                                <select
                                    className="w-full border rounded-lg p-3"
                                    value={pauta.quorum_type}
                                    onChange={(e) => updatePauta(index, 'quorum_type', e.target.value)}
                                >
                                    <option value="simple">Maioria Simples (&gt;50% dos presentes)</option>
                                    <option value="absolute">Maioria Absoluta (&gt;50% de todos)</option>
                                    <option value="two_thirds">Dois Terços (≥66,67%)</option>
                                    <option value="unanimous">Unanimidade (100%)</option>
                                    <option value="custom">Personalizado</option>
                                </select>
                            </div>
                            {pauta.quorum_type === 'custom' && (
                                <div>
                                    <label className="block text-sm font-medium mb-1">Percentual (%)</label>
                                    <Input
                                        type="number"
                                        min="1"
                                        max="100"
                                        value={pauta.quorum_custom || ''}
                                        onChange={(e) => updatePauta(index, 'quorum_custom', parseInt(e.target.value))}
                                        placeholder="Ex: 75"
                                    />
                                </div>
                            )}
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="flex gap-3">
                <Button variant="outline" onClick={addPauta} className="flex-1">
                    <Plus className="w-4 h-4 mr-2" /> Adicionar Pauta
                </Button>
                <Button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                >
                    <Save className="w-4 h-4 mr-2" />
                    {saving ? 'Salvando...' : 'Salvar Todas'}
                </Button>
            </div>
        </div>
    );
}
