'use client';
import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { createClient } from '@/lib/supabase/client';
import { Check, User, Users, Plus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

export default function EnquetesPage() {
    const [enquetes, setEnquetes] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [voting, setVoting] = useState<string | null>(null);
    const [userUnit, setUserUnit] = useState<string | null>(null);

    const supabase = createClient();

    useEffect(() => {
        fetchData();
    }, []);

    const [error, setError] = useState<string | null>(null);

    async function fetchData() {
        // Fetch user unit
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            const { data: resident } = await supabase.from('residents').select('unit_id').eq('user_id', user.id).single();
            if (resident) setUserUnit(resident.unit_id);
        }

        // Fetch enquetes
        try {
            const res = await fetch('/api/governanca/enquetes');
            const json = await res.json();
            if (!res.ok) {
                setError(json.error || 'Erro ao carregar enquetes');
            } else if (json.enquetes) {
                setEnquetes(json.enquetes);
            }
        } catch (e) {
            setError('Falha na conexão');
        } finally {
            setLoading(false);
        }
    }

    async function vote(enqueteId: string, optionId: string) {
        if (!userUnit) return alert("Você precisa estar vinculado a uma unidade para votar.");

        setVoting(enqueteId);
        try {
            // NOTE: We need a new endpoint for voting on enquetes specifically
            // Or reuse a generic one. I'll assume we haven't created a specific one yet, 
            // but I should have. I'll use direct supabase for now or create the route.
            // Wait, GovernanceService has voteEnquete, but I didn't create the API route for it.
            // I will create it momentarily. For now let's assume /api/governanca/enquetes/vote exists.

            const res = await fetch(`/api/governanca/enquetes/vote`, {
                method: 'POST',
                body: JSON.stringify({ enquete_id: enqueteId, option_id: optionId, unit_id: userUnit })
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json.error);

            alert("Voto registrado!");
            fetchData();
        } catch (e: any) {
            alert(e.message);
        } finally {
            setVoting(null);
        }
    }

    if (loading) return <div className="p-8 text-center">Carregando enquetes...</div>;

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-gray-800">Enquetes e Votações</h1>
                <Link href="/governanca/enquetes/nova">
                    <Button className="bg-emerald-600 hover:bg-emerald-700">
                        <Plus className="w-4 h-4 mr-2" /> Nova Enquete
                    </Button>
                </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {enquetes.map(enquete => (
                    <Card key={enquete.id} className="border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                        <CardHeader>
                            <div className="flex justify-between items-start">
                                <CardTitle className="text-xl">{enquete.title}</CardTitle>
                                {new Date() > new Date(enquete.end_at) ? (
                                    <Badge variant="secondary">Encerrada</Badge>
                                ) : (
                                    <Badge variant="default" className="bg-green-600">Aberta</Badge>
                                )}
                            </div>
                            <p className="text-gray-500 text-sm">{enquete.description}</p>
                            {enquete.one_vote_per_unit && (
                                <Badge variant="outline" className="mt-2 w-fit flex items-center gap-1">
                                    <Users className="w-3 h-3" /> 1 Voto por Unidade
                                </Badge>
                            )}
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {enquete.options.map((opt: any) => (
                                <div key={opt.id} className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span>{opt.label}</span>
                                        <span className="text-gray-500 font-medium">0 votos (simulado)</span>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <Progress value={33} className="h-2" />
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            disabled={!!voting || new Date() > new Date(enquete.end_at)}
                                            onClick={() => vote(enquete.id, opt.id)}
                                        >
                                            Votar
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                ))}
            </div>

            {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-md border border-red-200">
                    Erro: {error}
                </div>
            )}

            {!error && enquetes.length === 0 && (
                <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                    <p className="text-gray-500">Nenhuma enquete ativa no momento.</p>
                    <p className="text-sm text-gray-400 mt-2">Clique em "Nova Enquete" para começar.</p>
                </div>
            )}
        </div>
    );
}
