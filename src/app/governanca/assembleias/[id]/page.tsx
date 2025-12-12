'use client';
import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
    Video, Download, CheckCircle, XCircle, MinusCircle,
    Users, Clock, AlertTriangle, Lock, QrCode, FileText,
    PlayCircle, StopCircle, Plus
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface Assembly {
    id: string;
    title: string;
    description: string;
    status: string;
    date: string;
    type: string;
    require_presence: boolean;
    block_defaulters: boolean;
    quorum_install: number;
    virtual_link?: string;
    opened_at?: string;
    closed_at?: string;
}

interface Pauta {
    id: string;
    title: string;
    description: string;
    quorum_type: string;
    status: string;
    result?: string;
    votes_yes: number;
    votes_no: number;
    votes_abstain: number;
    order_index: number;
}

interface PresenceStats {
    present_units: number;
    total_units: number;
    quorum_percentage: number;
    quorum_required: number;
    quorum_achieved: boolean;
}

export default function AssembleiaDetailPage() {
    const params = useParams();
    const router = useRouter();
    const id = params.id as string;

    const [assembly, setAssembly] = useState<Assembly | null>(null);
    const [pautas, setPautas] = useState<Pauta[]>([]);
    const [presenceStats, setPresenceStats] = useState<PresenceStats | null>(null);
    const [isPresent, setIsPresent] = useState(false);
    const [loading, setLoading] = useState(true);
    const [voting, setVoting] = useState<string | null>(null);
    const [userRole, setUserRole] = useState<string>('morador');
    const [myVotes, setMyVotes] = useState<Record<string, string>>({});
    const [ata, setAta] = useState<any>(null);

    const supabase = createClient();

    const fetchData = useCallback(async () => {
        try {
            // Fetch assembly details
            const resAssembly = await fetch(`/api/governanca/assembleias`);
            const jsonAssembly = await resAssembly.json();
            const found = jsonAssembly.assembleias?.find((a: any) => a.id === id);
            if (found) setAssembly(found);

            // Fetch pautas
            const resPautas = await fetch(`/api/governanca/assembleias/${id}/pautas`);
            const jsonPautas = await resPautas.json();
            if (jsonPautas.pautas) setPautas(jsonPautas.pautas);

            // Fetch presence stats
            const resPresence = await fetch(`/api/governanca/assembleias/${id}/presence`);
            const jsonPresence = await resPresence.json();
            if (jsonPresence.stats) setPresenceStats(jsonPresence.stats);

            // Check if user is present
            if (jsonPresence.presences) {
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    const myPresence = jsonPresence.presences.find((p: any) => p.user_id === user.id);
                    setIsPresent(!!myPresence);
                }
            }

            // Fetch ATA if finalized
            if (found?.status === 'finalized') {
                const resAta = await fetch(`/api/governanca/assembleias/${id}/ata`);
                const jsonAta = await resAta.json();
                if (jsonAta.ata) setAta(jsonAta.ata);
            }

            // Get user role
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single();
                if (profile) setUserRole(profile.role);
            }
        } catch (e) {
            console.error('Error fetching data:', e);
        } finally {
            setLoading(false);
        }
    }, [id, supabase]);

    useEffect(() => {
        fetchData();
        // Auto-refresh every 10 seconds when assembly is open
        const interval = setInterval(() => {
            if (assembly?.status === 'open') fetchData();
        }, 10000);
        return () => clearInterval(interval);
    }, [fetchData, assembly?.status]);

    async function handleCheckIn() {
        try {
            const res = await fetch(`/api/governanca/assembleias/${id}/presence`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({})
            });
            const json = await res.json();

            if (!res.ok) {
                alert(json.error || 'Erro ao confirmar presença');
                return;
            }

            setIsPresent(true);
            fetchData();
            alert('Presença confirmada! ✅');
        } catch (e: any) {
            alert(e.message);
        }
    }

    async function handleVote(pautaId: string, choice: 'yes' | 'no' | 'abstain') {
        if (!isPresent && assembly?.require_presence) {
            alert('Confirme sua presença antes de votar!');
            return;
        }

        setVoting(pautaId);
        try {
            const res = await fetch(`/api/governanca/assembleias/${id}/pautas/${pautaId}/vote`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ choice })
            });
            const json = await res.json();

            if (!res.ok) {
                alert(json.error || 'Erro ao votar');
                return;
            }

            setMyVotes(prev => ({ ...prev, [pautaId]: choice }));
            alert('Voto registrado! ✅');
            fetchData();
        } catch (e: any) {
            alert(e.message);
        } finally {
            setVoting(null);
        }
    }

    async function handleOpenAssembly() {
        if (!confirm('Deseja abrir a assembleia para votação?')) return;

        try {
            const res = await fetch(`/api/governanca/assembleias/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    status: 'open',
                    opened_at: new Date().toISOString()
                })
            });

            if (res.ok) {
                fetchData();
                alert('Assembleia aberta!');
            }
        } catch (e: any) {
            alert(e.message);
        }
    }

    async function handleCloseAssembly() {
        if (!confirm('Deseja ENCERRAR a assembleia? Esta ação é IRREVERSÍVEL e gerará a ATA final.')) return;

        try {
            const res = await fetch(`/api/governanca/assembleias/${id}/close`, {
                method: 'POST'
            });
            const json = await res.json();

            if (!res.ok) {
                alert(json.error || 'Erro ao encerrar');
                return;
            }

            alert('Assembleia encerrada! ATA gerada com sucesso.');
            fetchData();
        } catch (e: any) {
            alert(e.message);
        }
    }

    function getStatusBadge(status: string) {
        const styles: Record<string, string> = {
            draft: 'bg-gray-100 text-gray-700',
            scheduled: 'bg-blue-100 text-blue-700',
            open: 'bg-green-100 text-green-700 animate-pulse',
            voting_closed: 'bg-yellow-100 text-yellow-700',
            finalized: 'bg-purple-100 text-purple-700',
            cancelled: 'bg-red-100 text-red-700'
        };
        const labels: Record<string, string> = {
            draft: 'Rascunho',
            scheduled: 'Agendada',
            open: '🔴 AO VIVO',
            voting_closed: 'Votação Encerrada',
            finalized: 'Concluída',
            cancelled: 'Cancelada'
        };
        return <Badge className={styles[status] || 'bg-gray-100'}>{labels[status] || status}</Badge>;
    }

    function getResultBadge(result: string) {
        const styles: Record<string, string> = {
            approved: 'bg-green-500 text-white',
            rejected: 'bg-red-500 text-white',
            tie: 'bg-yellow-500 text-white',
            no_quorum: 'bg-gray-500 text-white'
        };
        const labels: Record<string, string> = {
            approved: '✅ APROVADA',
            rejected: '❌ REJEITADA',
            tie: '⚖️ EMPATE',
            no_quorum: '⚠️ SEM QUÓRUM'
        };
        return <Badge className={styles[result] || 'bg-gray-100'}>{labels[result] || result}</Badge>;
    }

    if (loading) return <div className="p-8 text-center">Carregando...</div>;
    if (!assembly) return <div className="p-8 text-center">Assembleia não encontrada.</div>;

    const isSindico = ['sindico', 'superadmin'].includes(userRole);
    const canVote = assembly.status === 'open' && (isPresent || !assembly.require_presence);

    return (
        <div className="p-6 max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div className="bg-white p-6 rounded-xl shadow-sm border">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            {getStatusBadge(assembly.status)}
                            {assembly.type === 'formal' && (
                                <Badge variant="outline">Formal</Badge>
                            )}
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900">{assembly.title}</h1>
                        <p className="text-gray-500 mt-1">
                            <Clock className="inline w-4 h-4 mr-1" />
                            {new Date(assembly.date).toLocaleString('pt-BR')}
                        </p>
                    </div>

                    {/* Síndico Controls */}
                    {isSindico && (
                        <div className="flex gap-2">
                            {assembly.status === 'scheduled' && (
                                <Button onClick={handleOpenAssembly} className="bg-green-600 hover:bg-green-700">
                                    <PlayCircle className="w-4 h-4 mr-2" /> Abrir Assembleia
                                </Button>
                            )}
                            {assembly.status === 'open' && (
                                <Button onClick={handleCloseAssembly} variant="danger">
                                    <StopCircle className="w-4 h-4 mr-2" /> Encerrar
                                </Button>
                            )}
                        </div>
                    )}
                </div>

                {assembly.description && (
                    <p className="text-gray-600 bg-gray-50 p-4 rounded-lg">{assembly.description}</p>
                )}

                {assembly.virtual_link && (
                    <a href={assembly.virtual_link} target="_blank" rel="noopener noreferrer" className="mt-4 inline-block">
                        <Button className="bg-blue-600 hover:bg-blue-700">
                            <Video className="w-4 h-4 mr-2" /> Entrar na Sala Virtual
                        </Button>
                    </a>
                )}
            </div>

            {/* Presence & Quorum */}
            {assembly.status === 'open' && presenceStats && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Users className="w-5 h-5" /> Presença e Quórum
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Unidades presentes</span>
                                <span className="font-bold">
                                    {presenceStats.present_units} de {presenceStats.total_units}
                                </span>
                            </div>
                            <Progress
                                value={presenceStats.quorum_percentage}
                                className="h-3"
                            />
                            <div className="flex justify-between items-center">
                                <span className={presenceStats.quorum_achieved ? 'text-green-600 font-semibold' : 'text-orange-500'}>
                                    {presenceStats.quorum_percentage.toFixed(1)}%
                                    {presenceStats.quorum_achieved ? ' ✅ Quórum atingido' : ` (mínimo: ${presenceStats.quorum_required}%)`}
                                </span>
                            </div>

                            {!isPresent ? (
                                <Button
                                    onClick={handleCheckIn}
                                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-lg py-6"
                                >
                                    <CheckCircle className="w-5 h-5 mr-2" /> CONFIRMAR PRESENÇA
                                </Button>
                            ) : (
                                <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center text-green-700 font-semibold">
                                    ✅ Você está presente
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Pautas - WhatsApp Style Voting */}
            <div>
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <FileText className="w-5 h-5" /> Pautas
                    {isSindico && assembly.status !== 'finalized' && (
                        <Button size="sm" variant="outline" onClick={() => router.push(`/governanca/assembleias/${id}/pautas/nova`)}>
                            <Plus className="w-4 h-4" />
                        </Button>
                    )}
                </h2>

                {pautas.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">Nenhuma pauta cadastrada.</p>
                ) : (
                    <div className="space-y-4">
                        {pautas.map((pauta, index) => (
                            <Card key={pauta.id} className="overflow-hidden">
                                <div className="bg-gray-50 px-4 py-2 border-b flex justify-between items-center">
                                    <span className="text-sm text-gray-500">Pauta {index + 1} de {pautas.length}</span>
                                    {pauta.result && getResultBadge(pauta.result)}
                                </div>
                                <CardContent className="pt-4">
                                    <h3 className="text-lg font-semibold mb-2">{pauta.title}</h3>
                                    {pauta.description && (
                                        <p className="text-gray-600 mb-4">{pauta.description}</p>
                                    )}
                                    <p className="text-xs text-gray-400 mb-4">
                                        Quórum: {pauta.quorum_type === 'simple' ? 'Maioria Simples' :
                                            pauta.quorum_type === 'absolute' ? 'Maioria Absoluta' :
                                                pauta.quorum_type === 'two_thirds' ? '2/3' :
                                                    pauta.quorum_type === 'unanimous' ? 'Unanimidade' : pauta.quorum_type}
                                    </p>

                                    {/* Voting Buttons - WhatsApp Style */}
                                    {canVote && pauta.status === 'voting' && !myVotes[pauta.id] && (
                                        <div className="space-y-3">
                                            <Button
                                                onClick={() => handleVote(pauta.id, 'yes')}
                                                disabled={voting === pauta.id}
                                                className="w-full h-14 text-lg bg-green-500 hover:bg-green-600"
                                            >
                                                <CheckCircle className="w-6 h-6 mr-3" />
                                                A FAVOR
                                            </Button>
                                            <Button
                                                onClick={() => handleVote(pauta.id, 'no')}
                                                disabled={voting === pauta.id}
                                                className="w-full h-14 text-lg bg-red-500 hover:bg-red-600"
                                            >
                                                <XCircle className="w-6 h-6 mr-3" />
                                                CONTRA
                                            </Button>
                                            <Button
                                                onClick={() => handleVote(pauta.id, 'abstain')}
                                                disabled={voting === pauta.id}
                                                variant="outline"
                                                className="w-full h-14 text-lg"
                                            >
                                                <MinusCircle className="w-6 h-6 mr-3" />
                                                ABSTENÇÃO
                                            </Button>
                                        </div>
                                    )}

                                    {/* User's vote confirmation */}
                                    {myVotes[pauta.id] && (
                                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                                            <p className="text-blue-700">
                                                Seu voto: <strong>
                                                    {myVotes[pauta.id] === 'yes' ? '✅ A FAVOR' :
                                                        myVotes[pauta.id] === 'no' ? '❌ CONTRA' : '➖ ABSTENÇÃO'}
                                                </strong>
                                            </p>
                                        </div>
                                    )}

                                    {/* Results (after closed) */}
                                    {pauta.status === 'closed' && (
                                        <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                                            <div className="flex justify-between">
                                                <span className="text-green-600">A Favor</span>
                                                <span className="font-bold">{pauta.votes_yes}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-red-600">Contra</span>
                                                <span className="font-bold">{pauta.votes_no}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Abstenções</span>
                                                <span className="font-bold">{pauta.votes_abstain}</span>
                                            </div>
                                        </div>
                                    )}

                                    {/* Locked state */}
                                    {!canVote && pauta.status === 'voting' && (
                                        <div className="bg-gray-100 rounded-lg p-4 text-center text-gray-500">
                                            <Lock className="w-5 h-5 inline mr-2" />
                                            {!isPresent && assembly.require_presence
                                                ? 'Confirme presença para votar'
                                                : 'Votação não disponível'}
                                        </div>
                                    )}

                                    {pauta.status === 'pending' && (
                                        <div className="bg-gray-100 rounded-lg p-4 text-center text-gray-500">
                                            <Clock className="w-5 h-5 inline mr-2" />
                                            Aguardando abertura da votação
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>

            {/* ATA Section (when finalized) */}
            {assembly.status === 'finalized' && ata && (
                <Card className="border-purple-200 bg-purple-50">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-purple-700">
                            <QrCode className="w-5 h-5" /> Ata da Assembleia
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-sm text-gray-600">
                            Gerada em: {new Date(ata.generated_at).toLocaleString('pt-BR')}
                        </p>
                        <div className="bg-white p-4 rounded-lg border">
                            <p className="text-xs font-mono text-gray-500 break-all">
                                Hash SHA256: {ata.hash_sha256}
                            </p>
                        </div>
                        <div className="flex gap-3">
                            <Button
                                onClick={() => window.open(`/governanca/ata/verify/${ata.hash_sha256}`, '_blank')}
                                className="bg-purple-600 hover:bg-purple-700"
                            >
                                <QrCode className="w-4 h-4 mr-2" /> Verificar Autenticidade
                            </Button>
                            {ata.pdf_url && (
                                <Button variant="outline">
                                    <Download className="w-4 h-4 mr-2" /> Baixar PDF
                                </Button>
                            )}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
