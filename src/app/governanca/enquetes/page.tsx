'use client';
import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';


export default function EnquetesPage() {
    const [enquetes, setEnquetes] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [newTitle, setNewTitle] = useState('');

    useEffect(() => {
        fetchEnquetes();
    }, []);

    async function fetchEnquetes() {
        try {
            const res = await fetch('/api/governanca/enquetes');
            const json = await res.json();
            if (json.enquetes) setEnquetes(json.enquetes);
        } finally { setLoading(false); }
    }

    async function createEnquete() {
        if (!newTitle) return;
        try {
            const res = await fetch('/api/governanca/enquetes', {
                method: 'POST',
                body: JSON.stringify({
                    title: newTitle,
                    options: [{ id: 'yes', label: 'Sim' }, { id: 'no', label: 'Não' }], // simplified
                    start_at: new Date(),
                    end_at: new Date(Date.now() + 86400000)
                })
            });
            if (res.ok) {
                alert("Enquete criada!");
                setNewTitle('');
                fetchEnquetes();
            }
        } catch (e) { alert("Erro ao criar"); }
    }

    async function vote(enqueteId: string, optionId: string) {
        try {
            const res = await fetch(`/api/governanca/enquetes/${enqueteId}/vote`, {
                method: 'POST',
                body: JSON.stringify({ option_id: optionId })
            });
            if (res.ok) {
                alert("Voto registrado!");
                fetchEnquetes();
            } else {
                const err = await res.json();
                alert(err.error || "Erro ao votar");
            }
        } catch (e) { alert("Erro"); }
    }

    return (
        <div className="p-6 space-y-6">
            <h1 className="text-3xl font-bold">Enquetes e Votações</h1>

            <Card>
                <CardHeader><CardTitle>Nova Enquete Rápida</CardTitle></CardHeader>
                <CardContent className="flex gap-4">
                    <Input placeholder="Título da votação..." value={newTitle} onChange={e => setNewTitle(e.target.value)} />
                    <Button onClick={createEnquete}>Criar</Button>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {loading && <p>Carregando...</p>}
                {enquetes.map(enq => (
                    <Card key={enq.id}>
                        <CardHeader>
                            <CardTitle>{enq.title}</CardTitle>
                            <div className="text-sm text-gray-500">
                                Votos: {enq.votes?.length || 0}
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            {enq.options.map((opt: any) => {
                                const count = enq.votes?.filter((v: any) => v.option_id === opt.id).length || 0;
                                const total = enq.votes?.length || 1;
                                const pct = Math.round((count / total) * 100);
                                return (
                                    <div key={opt.id} className="flex items-center gap-2">
                                        <Button variant="outline" size="sm" onClick={() => vote(enq.id, opt.id)}>{opt.label}</Button>
                                        <div className="flex-1 h-2 bg-gray-100 rounded overflow-hidden">
                                            <div className="h-full bg-blue-500" style={{ width: `${pct}%` }} />
                                        </div>
                                        <span className="text-xs">{pct}%</span>
                                    </div>
                                );
                            })}
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
