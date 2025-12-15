'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { createClient } from '@/lib/supabase/client';
import { Vote, Plus, X, Clock, CheckCircle, Users, BarChart3, Calendar } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { useUser } from '@/hooks/useUser';
import { formatDate } from '@/lib/utils';

export default function EnquetesPage() {
    const { condoId, isSindico, isSuperAdmin } = useUser();
    const [enquetes, setEnquetes] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [voting, setVoting] = useState<string | null>(null);
    const [selectedEnquete, setSelectedEnquete] = useState<any>(null);
    const [userUnit, setUserUnit] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const supabase = createClient();

    useEffect(() => {
        fetchData();
    }, []);

    async function fetchData() {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            const { data: resident } = await supabase.from('residents').select('unit_id').eq('user_id', user.id).single();
            if (resident) setUserUnit(resident.unit_id);
        }

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

    const stats = {
        total: enquetes.length,
        ativas: enquetes.filter(e => e.status === 'ativa' || new Date() < new Date(e.end_at)).length,
        encerradas: enquetes.filter(e => e.status !== 'ativa' && new Date() > new Date(e.end_at)).length,
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-emerald-600 border-t-transparent"></div>
            </div>
        );
    }

    return (
        <div className="flex h-[calc(100vh-120px)]">
            {/* Main Content */}
            <div className={`flex-1 overflow-auto p-6 transition-all ${selectedEnquete ? 'mr-[450px]' : ''}`}>
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                            <Vote className="h-6 w-6 text-emerald-600" />
                            Enquetes e Votações
                        </h1>
                        <p className="text-gray-500">Participe das decisões do condomínio</p>
                    </div>
                    {(isSindico || isSuperAdmin) && (
                        <Link href="/governanca/enquetes/nova">
                            <Button>
                                <Plus className="h-4 w-4 mr-2" />
                                Nova Enquete
                            </Button>
                        </Link>
                    )}
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                    <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0">
                        <CardContent className="py-4 text-center">
                            <BarChart3 className="h-8 w-8 mx-auto mb-2 opacity-80" />
                            <p className="text-2xl font-bold">{stats.total}</p>
                            <p className="text-sm text-blue-100">Total</p>
                        </CardContent>
                    </Card>
                    <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-0">
                        <CardContent className="py-4 text-center">
                            <Clock className="h-8 w-8 mx-auto mb-2 opacity-80" />
                            <p className="text-2xl font-bold">{stats.ativas}</p>
                            <p className="text-sm text-green-100">Em Votação</p>
                        </CardContent>
                    </Card>
                    <Card className="bg-gradient-to-br from-gray-500 to-gray-600 text-white border-0">
                        <CardContent className="py-4 text-center">
                            <CheckCircle className="h-8 w-8 mx-auto mb-2 opacity-80" />
                            <p className="text-2xl font-bold">{stats.encerradas}</p>
                            <p className="text-sm text-gray-100">Encerradas</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Enquetes List */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {enquetes.map(enquete => {
                        const isActive = enquete.status === 'ativa' || new Date() < new Date(enquete.end_at);
                        return (
                            <Card
                                key={enquete.id}
                                className={`cursor-pointer hover:shadow-lg transition-all ${selectedEnquete?.id === enquete.id ? 'ring-2 ring-emerald-500' : ''
                                    }`}
                                onClick={() => setSelectedEnquete(enquete)}
                            >
                                <CardContent className="p-5">
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-lg ${isActive ? 'bg-green-100' : 'bg-gray-100'}`}>
                                                <Vote className={`h-5 w-5 ${isActive ? 'text-green-600' : 'text-gray-500'}`} />
                                            </div>
                                            <div>
                                                <h3 className="font-semibold text-gray-900">{enquete.titulo || enquete.title}</h3>
                                                <p className="text-xs text-gray-500">
                                                    {formatDate(enquete.data_inicio || enquete.start_at)} - {formatDate(enquete.data_fim || enquete.end_at)}
                                                </p>
                                            </div>
                                        </div>
                                        <Badge variant={isActive ? 'default' : 'secondary'} className={isActive ? 'bg-green-600' : ''}>
                                            {isActive ? 'Aberta' : 'Encerrada'}
                                        </Badge>
                                    </div>
                                    <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                                        {enquete.descricao || enquete.description}
                                    </p>
                                    {enquete.one_vote_per_unit && (
                                        <div className="flex items-center gap-1 text-xs text-amber-600">
                                            <Users className="h-3 w-3" />
                                            1 voto por unidade
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>

                {error && (
                    <div className="bg-red-50 text-red-600 p-4 rounded-lg border border-red-200 mt-4">
                        {error}
                    </div>
                )}

                {!error && enquetes.length === 0 && (
                    <div className="text-center py-16 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                        <Vote className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                        <h3 className="text-lg font-semibold text-gray-600 mb-2">Nenhuma enquete</h3>
                        <p className="text-gray-400 mb-4">Crie a primeira enquete para coletar opiniões dos moradores</p>
                        {(isSindico || isSuperAdmin) && (
                            <Link href="/governanca/enquetes/nova">
                                <Button>
                                    <Plus className="h-4 w-4 mr-2" />
                                    Nova Enquete
                                </Button>
                            </Link>
                        )}
                    </div>
                )}
            </div>

            {/* Slide-out Detail Panel */}
            {selectedEnquete && (
                <>
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 bg-black/20 z-40"
                        onClick={() => setSelectedEnquete(null)}
                    />
                    {/* Panel */}
                    <div className="fixed right-0 top-0 h-full w-[450px] bg-white shadow-2xl z-50 overflow-y-auto animate-in slide-in-from-right">
                        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
                            <h2 className="text-lg font-bold text-gray-900">Detalhes da Enquete</h2>
                            <Button variant="ghost" size="sm" onClick={() => setSelectedEnquete(null)}>
                                <X className="h-5 w-5" />
                            </Button>
                        </div>
                        <div className="p-6 space-y-6">
                            {/* Status */}
                            <div className="flex items-center gap-2">
                                {new Date() < new Date(selectedEnquete.end_at || selectedEnquete.data_fim) ? (
                                    <Badge className="bg-green-600">Em Votação</Badge>
                                ) : (
                                    <Badge variant="secondary">Encerrada</Badge>
                                )}
                                {selectedEnquete.one_vote_per_unit && (
                                    <Badge variant="outline">1 voto/unidade</Badge>
                                )}
                            </div>

                            {/* Title & Description */}
                            <div>
                                <h3 className="text-xl font-bold text-gray-900 mb-2">
                                    {selectedEnquete.titulo || selectedEnquete.title}
                                </h3>
                                <p className="text-gray-600">
                                    {selectedEnquete.descricao || selectedEnquete.description}
                                </p>
                            </div>

                            {/* Period */}
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <Calendar className="h-4 w-4" />
                                    <span>Período de votação:</span>
                                </div>
                                <p className="font-medium text-gray-900 mt-1">
                                    {formatDate(selectedEnquete.data_inicio || selectedEnquete.start_at)} até {formatDate(selectedEnquete.data_fim || selectedEnquete.end_at)}
                                </p>
                            </div>

                            {/* Options */}
                            <div className="space-y-4">
                                <h4 className="font-semibold text-gray-900">Opções de Voto</h4>
                                {(selectedEnquete.options || []).map((opt: any, idx: number) => (
                                    <div key={opt.id || idx} className="bg-gray-50 p-4 rounded-lg">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="font-medium">{opt.label || opt.texto}</span>
                                            <span className="text-sm text-gray-500">{opt.votes || 0} votos</span>
                                        </div>
                                        <Progress value={(opt.votes || 0) * 10} className="h-2 mb-3" />
                                        <Button
                                            size="sm"
                                            className="w-full"
                                            disabled={!!voting || new Date() > new Date(selectedEnquete.end_at || selectedEnquete.data_fim)}
                                            onClick={() => vote(selectedEnquete.id, opt.id)}
                                        >
                                            {voting === selectedEnquete.id ? 'Votando...' : 'Votar nesta opção'}
                                        </Button>
                                    </div>
                                ))}
                                {(!selectedEnquete.options || selectedEnquete.options.length === 0) && (
                                    <p className="text-gray-400 text-center py-4">Nenhuma opção cadastrada</p>
                                )}
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
