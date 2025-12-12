'use client';
import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Video, Download, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function AssembleiaDetailPage() {
    const params = useParams();
    const id = params.id as string;
    const [assembly, setAssembly] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [voting, setVoting] = useState<string | null>(null);
    const [userUnit, setUserUnit] = useState<string | null>(null);

    const supabase = createClient();

    useEffect(() => {
        fetchAssembly();
        fetchUserUnit();
    }, [id]);

    async function fetchUserUnit() {
        // Fetch user's unit for voting validation
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            const { data: resident } = await supabase.from('residents').select('unit_id').eq('user_id', user.id).single();
            if (resident) setUserUnit(resident.unit_id);
        }
    }

    async function fetchAssembly() {
        // Fetch assembly and pautas
        const res = await fetch(`/api/governanca/assembleias`);
        // Note: Real implementation should have specific ID fetch, but for now we filter locally or add endpoint
        // Assuming the list endpoint returns pautas as implemented in GovernanceService
        const json = await res.json();
        const found = json.assembleias?.find((a: any) => a.id === id);
        setAssembly(found);
        setLoading(false);
    }

    async function handleVote(pautaId: string, vote: 'yes' | 'no' | 'abstain') {
        if (!userUnit) return alert("Você precisa estar vinculado a uma unidade para votar.");

        setVoting(pautaId);
        try {
            const res = await fetch(`/api/governanca/pautas/${pautaId}/vote`, {
                method: 'POST',
                body: JSON.stringify({ vote, unit_id: userUnit })
            });
            const json = await res.json();

            if (!res.ok) throw new Error(json.error);

            alert("Voto registrado com sucesso!");
            fetchAssembly(); // Refresh to show results or status
        } catch (e: any) {
            alert(e.message);
        } finally {
            setVoting(null);
        }
    }

    if (loading) return <div className="p-8 text-center">Carregando...</div>;
    if (!assembly) return <div className="p-8 text-center">Assembleia não encontrada.</div>;

    return (
        <div className="p-6 max-w-5xl mx-auto space-y-8">
            {/* Header Section */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="flex flex-col md:flex-row justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">{assembly.title}</h1>
                        <p className="text-gray-500 flex items-center">
                            {new Date(assembly.start_at).toLocaleString()}
                        </p>
                    </div>
                    <div className="flex flex-col gap-2">
                        {assembly.is_virtual && assembly.virtual_link && (
                            <a href={assembly.virtual_link} target="_blank" rel="noopener noreferrer">
                                <Button className="w-full bg-blue-600 hover:bg-blue-700">
                                    <Video className="w-4 h-4 mr-2" /> Entrar na Sala Virtual
                                </Button>
                            </a>
                        )}
                        {assembly.ata_url && (
                            <a href={assembly.ata_url} download>
                                <Button variant="outline" className="w-full">
                                    <Download className="w-4 h-4 mr-2" /> Baixar Ata
                                </Button>
                            </a>
                        )}
                    </div>
                </div>
                {assembly.description && (
                    <div className="mt-6 p-4 bg-gray-50 rounded-lg text-gray-700">
                        {assembly.description}
                    </div>
                )}
            </div>

            {/* Voting Section (Pautas) */}
            <div>
                <h2 className="text-2xl font-bold mb-4">Pautas em Votação</h2>
                <div className="space-y-4">
                    {assembly.pautas?.length === 0 && <p className="text-gray-500">Nenhuma pauta cadastrada.</p>}

                    {assembly.pautas?.map((pauta: any) => (
                        <Card key={pauta.id} className="border-l-4 border-l-brand-500">
                            <CardContent className="pt-6">
                                <div className="flex justify-between items-start mb-4">
                                    <h3 className="text-xl font-semibold">{pauta.title}</h3>
                                    <Badge variant={pauta.status === 'approved' ? 'default' : 'secondary'}>
                                        {pauta.status === 'pending' ? 'Pendente' :
                                            pauta.status === 'voting' ? 'Em Votação' :
                                                pauta.status === 'approved' ? 'Aprovado' : pauta.status}
                                    </Badge>
                                </div>
                                <p className="text-gray-600 mb-6">{pauta.description}</p>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                    <Button
                                        variant="outline"
                                        className="border-green-200 hover:bg-green-50 text-green-700"
                                        onClick={() => handleVote(pauta.id, 'yes')}
                                        disabled={!!voting}
                                    >
                                        <CheckCircle className="w-4 h-4 mr-2" /> Aprovar
                                    </Button>
                                    <Button
                                        variant="outline"
                                        className="border-red-200 hover:bg-red-50 text-red-700"
                                        onClick={() => handleVote(pauta.id, 'no')}
                                        disabled={!!voting}
                                    >
                                        <XCircle className="w-4 h-4 mr-2" /> Rejeitar
                                    </Button>
                                    <Button
                                        variant="outline"
                                        className="border-gray-200 hover:bg-gray-50 text-gray-700"
                                        onClick={() => handleVote(pauta.id, 'abstain')}
                                        disabled={!!voting}
                                    >
                                        <AlertCircle className="w-4 h-4 mr-2" /> Abster
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </div>
    );
}
