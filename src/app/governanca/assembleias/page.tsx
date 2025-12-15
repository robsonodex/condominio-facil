'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Video, FileText, Calendar, Plus, X, Users, Clock, MapPin, CheckCircle, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { useUser } from '@/hooks/useUser';
import { formatDate } from '@/lib/utils';

export default function AssembleiasPage() {
    const { isSindico, isSuperAdmin } = useUser();
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedItem, setSelectedItem] = useState<any>(null);

    useEffect(() => {
        fetchItems();
    }, []);

    async function fetchItems() {
        try {
            const res = await fetch('/api/governanca/assembleias');
            const json = await res.json();
            if (json.assembleias) setItems(json.assembleias);
        } catch (e) {
            console.error('Failed to fetch assemblies', e);
        } finally {
            setLoading(false);
        }
    }

    const stats = {
        total: items.length,
        agendadas: items.filter(a => a.status === 'scheduled' || a.status === 'agendada').length,
        realizadas: items.filter(a => a.status === 'finalized' || a.status === 'realizada').length,
        aoVivo: items.filter(a => a.status === 'open').length,
    };

    const getStatusConfig = (status: string) => {
        switch (status) {
            case 'open':
                return { label: '🔴 AO VIVO', color: 'bg-red-500 text-white animate-pulse' };
            case 'scheduled':
            case 'agendada':
                return { label: 'Agendada', color: 'bg-blue-100 text-blue-700' };
            case 'finalized':
            case 'realizada':
                return { label: 'Concluída', color: 'bg-green-100 text-green-700' };
            default:
                return { label: 'Rascunho', color: 'bg-gray-100 text-gray-600' };
        }
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
            <div className={`flex-1 overflow-auto p-6 transition-all ${selectedItem ? 'mr-[450px]' : ''}`}>
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                            <Users className="h-6 w-6 text-purple-600" />
                            Assembleias Digitais
                        </h1>
                        <p className="text-gray-500">Reuniões e votações do condomínio</p>
                    </div>
                    {(isSindico || isSuperAdmin) && (
                        <Link href="/governanca/assembleias/nova">
                            <Button>
                                <Plus className="h-4 w-4 mr-2" />
                                Agendar Assembleia
                            </Button>
                        </Link>
                    )}
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0">
                        <CardContent className="py-4 text-center">
                            <Users className="h-8 w-8 mx-auto mb-2 opacity-80" />
                            <p className="text-2xl font-bold">{stats.total}</p>
                            <p className="text-sm text-purple-100">Total</p>
                        </CardContent>
                    </Card>
                    <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0">
                        <CardContent className="py-4 text-center">
                            <Calendar className="h-8 w-8 mx-auto mb-2 opacity-80" />
                            <p className="text-2xl font-bold">{stats.agendadas}</p>
                            <p className="text-sm text-blue-100">Agendadas</p>
                        </CardContent>
                    </Card>
                    <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-0">
                        <CardContent className="py-4 text-center">
                            <CheckCircle className="h-8 w-8 mx-auto mb-2 opacity-80" />
                            <p className="text-2xl font-bold">{stats.realizadas}</p>
                            <p className="text-sm text-green-100">Realizadas</p>
                        </CardContent>
                    </Card>
                    {stats.aoVivo > 0 && (
                        <Card className="bg-gradient-to-br from-red-500 to-red-600 text-white border-0 animate-pulse">
                            <CardContent className="py-4 text-center">
                                <Video className="h-8 w-8 mx-auto mb-2 opacity-80" />
                                <p className="text-2xl font-bold">{stats.aoVivo}</p>
                                <p className="text-sm text-red-100">Ao Vivo</p>
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Assemblies List */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {items.map(item => {
                        const statusConfig = getStatusConfig(item.status);
                        return (
                            <Card
                                key={item.id}
                                className={`cursor-pointer hover:shadow-lg transition-all ${selectedItem?.id === item.id ? 'ring-2 ring-purple-500' : ''
                                    }`}
                                onClick={() => setSelectedItem(item)}
                            >
                                <CardContent className="p-5">
                                    <div className="flex items-start justify-between mb-3">
                                        <Badge className={statusConfig.color}>{statusConfig.label}</Badge>
                                        {item.is_virtual && (
                                            <Badge variant="outline" className="bg-purple-50">
                                                <Video className="h-3 w-3 mr-1" />
                                                Virtual
                                            </Badge>
                                        )}
                                    </div>
                                    <h3 className="font-semibold text-gray-900 mb-2">{item.titulo || item.title}</h3>
                                    <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                                        {item.descricao || item.description || 'Sem descrição.'}
                                    </p>
                                    <div className="flex items-center gap-2 text-xs text-gray-500">
                                        <Calendar className="h-3 w-3" />
                                        {formatDate(item.data_realizacao || item.date || item.start_at)}
                                    </div>
                                    {item.local && (
                                        <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                                            <MapPin className="h-3 w-3" />
                                            {item.local}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>

                {items.length === 0 && (
                    <div className="text-center py-16 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                        <Users className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                        <h3 className="text-lg font-semibold text-gray-600 mb-2">Nenhuma assembleia</h3>
                        <p className="text-gray-400 mb-4">Agende a primeira assembleia do condomínio</p>
                        {(isSindico || isSuperAdmin) && (
                            <Link href="/governanca/assembleias/nova">
                                <Button>
                                    <Plus className="h-4 w-4 mr-2" />
                                    Agendar Assembleia
                                </Button>
                            </Link>
                        )}
                    </div>
                )}
            </div>

            {/* Slide-out Detail Panel */}
            {selectedItem && (
                <>
                    <div className="fixed inset-0 bg-black/20 z-40" onClick={() => setSelectedItem(null)} />
                    <div className="fixed right-0 top-0 h-full w-[450px] bg-white shadow-2xl z-50 overflow-y-auto animate-in slide-in-from-right">
                        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
                            <h2 className="text-lg font-bold text-gray-900">Detalhes da Assembleia</h2>
                            <Button variant="ghost" size="sm" onClick={() => setSelectedItem(null)}>
                                <X className="h-5 w-5" />
                            </Button>
                        </div>
                        <div className="p-6 space-y-6">
                            {/* Status */}
                            <div className="flex items-center gap-2 flex-wrap">
                                <Badge className={getStatusConfig(selectedItem.status).color}>
                                    {getStatusConfig(selectedItem.status).label}
                                </Badge>
                                {selectedItem.is_virtual && (
                                    <Badge variant="outline" className="bg-purple-50">
                                        <Video className="h-3 w-3 mr-1" />
                                        Virtual
                                    </Badge>
                                )}
                                {selectedItem.tipo && (
                                    <Badge variant="outline">
                                        {selectedItem.tipo === 'ordinaria' ? 'Ordinária' : 'Extraordinária'}
                                    </Badge>
                                )}
                            </div>

                            {/* Title & Description */}
                            <div>
                                <h3 className="text-xl font-bold text-gray-900 mb-2">
                                    {selectedItem.titulo || selectedItem.title}
                                </h3>
                                <p className="text-gray-600">
                                    {selectedItem.descricao || selectedItem.description || 'Sem descrição.'}
                                </p>
                            </div>

                            {/* Date & Location */}
                            <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                                <div className="flex items-center gap-3">
                                    <Calendar className="h-5 w-5 text-gray-400" />
                                    <div>
                                        <p className="text-sm text-gray-500">Data e Hora</p>
                                        <p className="font-medium text-gray-900">
                                            {formatDate(selectedItem.data_realizacao || selectedItem.date || selectedItem.start_at)}
                                        </p>
                                    </div>
                                </div>
                                {selectedItem.local && (
                                    <div className="flex items-center gap-3">
                                        <MapPin className="h-5 w-5 text-gray-400" />
                                        <div>
                                            <p className="text-sm text-gray-500">Local</p>
                                            <p className="font-medium text-gray-900">{selectedItem.local}</p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Pauta */}
                            {selectedItem.pauta && (
                                <div>
                                    <h4 className="font-semibold text-gray-900 mb-2">Pauta</h4>
                                    <div className="bg-gray-50 p-4 rounded-lg text-sm text-gray-700 whitespace-pre-line">
                                        {selectedItem.pauta}
                                    </div>
                                </div>
                            )}

                            {/* Actions */}
                            <div className="space-y-2">
                                {selectedItem.status === 'open' && selectedItem.meet_link && (
                                    <a href={selectedItem.meet_link} target="_blank" rel="noopener noreferrer">
                                        <Button className="w-full bg-red-600 hover:bg-red-700">
                                            <Video className="h-4 w-4 mr-2" />
                                            Entrar na Reunião
                                        </Button>
                                    </a>
                                )}
                                {selectedItem.ata_url && (
                                    <a href={selectedItem.ata_url} target="_blank" rel="noopener noreferrer">
                                        <Button variant="outline" className="w-full">
                                            <FileText className="h-4 w-4 mr-2" />
                                            Ver Ata da Assembleia
                                        </Button>
                                    </a>
                                )}
                                <Link href={`/governanca/assembleias/${selectedItem.id}`} className="block">
                                    <Button variant="outline" className="w-full">
                                        Ver Detalhes Completos
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
