'use client';
import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';



export default function MaintenancePage() {
    const [equipments, setEquipments] = useState<any[]>([]);
    const [newName, setNewName] = useState('');
    const [newType, setNewType] = useState('Elevador');

    useEffect(() => { load(); }, []);

    async function load() {
        const res = await fetch('/api/manutencao/equipments');
        const json = await res.json();
        if (json.equipments) setEquipments(json.equipments);
    }

    async function addEquipment() {
        const res = await fetch('/api/manutencao/equipments', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ name: newName, type: newType, location: 'Condomínio' })
        });
        if (res.ok) {
            alert("Equipamento adicionado");
            setNewName('');
            load();
        }
    }

    async function scheduleMaintenance(id: string) {
        const date = prompt("Data YYYY-MM-DD?");
        if (!date) return;
        const res = await fetch('/api/manutencao/schedule', {
            method: 'POST',
            body: JSON.stringify({ equipment_id: id, next_date: date, frequency: 'monthly' })
        });
        if (res.ok) alert("Agendado");
    }

    return (
        <div className="p-6 space-y-6">
            <h1 className="text-3xl font-bold">Gestão de Manutenção</h1>

            <Card>
                <CardHeader><CardTitle>Novo Equipamento</CardTitle></CardHeader>
                <CardContent className="flex gap-4">
                    <Input placeholder="Nome (Ex: Bombas)" value={newName} onChange={e => setNewName(e.target.value)} />
                    <select
                        className="w-[180px] border rounded-md p-2 bg-background"
                        value={newType}
                        onChange={e => setNewType(e.target.value)}
                    >
                        <option value="Elevador">Elevador</option>
                        <option value="Bomba">Bomba</option>
                        <option value="Extintor">Extintor</option>
                        <option value="Portão">Portão</option>
                    </select>
                    <Button onClick={addEquipment}>Cadastrar</Button>
                </CardContent>
            </Card>

            <div className="grid gap-4">
                {equipments.map(eq => (
                    <Card key={eq.id}>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle>{eq.name}</CardTitle>
                                <p className="text-sm text-gray-500">{eq.type} - {eq.location}</p>
                            </div>
                            <Button variant="outline" onClick={() => scheduleMaintenance(eq.id)}>Agendar Manutenção</Button>
                        </CardHeader>
                        <CardContent>
                            {(eq.manutencao_schedule || []).map((sch: any) => (
                                <div key={sch.id} className="text-sm pl-4 border-l-2 border-yellow-500 mb-2">
                                    Próxima: {sch.next_date} ({sch.frequency})
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
