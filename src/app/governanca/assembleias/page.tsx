'use client';
import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function AssembleiasPage() {
    const [items, setItems] = useState<any[]>([]);
    const [title, setTitle] = useState('');

    useEffect(() => {
        fetchItems();
    }, []);

    async function fetchItems() {
        const res = await fetch('/api/governanca/assembleias');
        const json = await res.json();
        if (json.assembleias) setItems(json.assembleias);
    }

    async function create() {
        await fetch('/api/governanca/assembleias', {
            method: 'POST',
            body: JSON.stringify({ title, start_at: new Date() })
        });
        fetchItems();
        setTitle('');
    }

    return (
        <div className="p-6 space-y-6">
            <h1 className="text-3xl font-bold">Assembleias Digitais</h1>
            <div className="flex gap-4">
                <Input placeholder="Título da assembleia..." value={title} onChange={e => setTitle(e.target.value)} />
                <Button onClick={create}>Agendar</Button>
            </div>
            <div className="space-y-4">
                {items.map(item => (
                    <Card key={item.id}>
                        <CardHeader>
                            <CardTitle>{item.title}</CardTitle>
                            <p className="text-sm text-gray-500">{new Date(item.start_at).toLocaleString()}</p>
                        </CardHeader>
                        <CardContent>
                            <Button variant="secondary">Entrar na Sala</Button>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
