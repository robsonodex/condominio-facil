'use client';
import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Video, FileText, Calendar, Plus } from 'lucide-react';
import Link from 'next/link';

export default function AssembleiasPage() {
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

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

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-gray-800">Assembleias Digitais</h1>
                <Link href="/governanca/assembleias/nova">
                    <Button className="bg-brand-600 hover:bg-brand-700">
                        <Plus className="w-4 h-4 mr-2" /> Agendar Nova
                    </Button>
                </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {items.map(item => (
                    <Card key={item.id} className="hover:shadow-lg transition-shadow border-brand-100/50">
                        <CardHeader className="pb-3">
                            <div className="flex justify-between items-start">
                                <CardTitle className="text-xl font-semibold text-brand-900">{item.title}</CardTitle>
                                {item.status === 'em_andamento' && (
                                    <Badge variant="destructive" className="animate-pulse">AO VIVO</Badge>
                                )}
                                {item.status === 'agendada' && (
                                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Agendada</Badge>
                                )}
                            </div>
                            <div className="flex items-center text-sm text-gray-500 mt-2">
                                <Calendar className="w-4 h-4 mr-2" />
                                {new Date(item.start_at).toLocaleString()}
                            </div>
                        </CardHeader>
                        <CardContent>
                            <p className="text-gray-600 line-clamp-3 text-sm">
                                {item.description || 'Sem descrição.'}
                            </p>
                            <div className="flex gap-2 mt-4">
                                {item.is_virtual && (
                                    <Badge variant="secondary" className="flex bg-purple-50 text-purple-700">
                                        <Video className="w-3 h-3 mr-1" /> Virtual
                                    </Badge>
                                )}
                                {item.ata_url && (
                                    <Badge variant="secondary" className="flex bg-green-50 text-green-700">
                                        <FileText className="w-3 h-3 mr-1" /> Ata Disponível
                                    </Badge>
                                )}
                            </div>
                        </CardContent>
                        <CardFooter className="pt-0">
                            <Link href={`/governanca/assembleias/${item.id}`} className="w-full">
                                <Button variant="outline" className="w-full border-brand-200 text-brand-700 hover:bg-brand-50">
                                    Ver Detalhes e Votar
                                </Button>
                            </Link>
                        </CardFooter>
                    </Card>
                ))}

                {items.length === 0 && !loading && (
                    <div className="col-span-full text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                        <p className="text-gray-500">Nenhuma assembleia encontrada.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
