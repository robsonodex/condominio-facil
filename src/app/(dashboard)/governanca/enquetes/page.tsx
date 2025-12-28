'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, Button, Badge } from '@/components/ui';
import { useAuth } from '@/hooks/useAuth';
import { createClient } from '@/lib/supabase/client';
import { FileText, Plus, Vote, Users, Calendar, CheckCircle2, Clock, XCircle } from 'lucide-react';

interface Enquete {
    id: string;
    titulo: string;
    descricao: string;
    data_inicio: string;
    data_fim: string;
    status: string;
    opcoes: string[];
    created_at: string;
}

export default function EnquetesPage() {
    const { profile } = useAuth();
    const [enquetes, setEnquetes] = useState<Enquete[]>([]);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        fetchEnquetes();
    }, []);

    const fetchEnquetes = async () => {
        try {
            // Placeholder - será implementado quando a tabela existir
            setEnquetes([]);
        } catch (error) {
            console.error('Erro ao buscar enquetes:', error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'ativa':
                return <Badge className="bg-green-100 text-green-800">Ativa</Badge>;
            case 'encerrada':
                return <Badge className="bg-gray-100 text-gray-800">Encerrada</Badge>;
            case 'rascunho':
                return <Badge className="bg-yellow-100 text-yellow-800">Rascunho</Badge>;
            default:
                return <Badge className="bg-blue-100 text-blue-800">{status}</Badge>;
        }
    };

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <Vote className="h-7 w-7 text-blue-600" />
                        Enquetes
                    </h1>
                    <p className="text-gray-500">Crie e gerencie enquetes para os moradores</p>
                </div>
                <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                    <Plus className="h-4 w-4 mr-2" />
                    Nova Enquete
                </Button>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-12">
                    <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full" />
                </div>
            ) : enquetes.length === 0 ? (
                <Card>
                    <CardContent className="py-12 text-center">
                        <Vote className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-600 mb-2">Nenhuma enquete ainda</h3>
                        <p className="text-gray-400 mb-4">
                            Crie enquetes para consultar a opinião dos moradores
                        </p>
                        <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                            <Plus className="h-4 w-4 mr-2" />
                            Criar Primeira Enquete
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4">
                    {enquetes.map((enquete) => (
                        <Card key={enquete.id} className="hover:shadow-md transition-shadow">
                            <CardContent className="p-4">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h3 className="font-semibold text-gray-900">{enquete.titulo}</h3>
                                            {getStatusBadge(enquete.status)}
                                        </div>
                                        <p className="text-sm text-gray-500 mb-2">{enquete.descricao}</p>
                                        <div className="flex items-center gap-4 text-xs text-gray-400">
                                            <span className="flex items-center gap-1">
                                                <Calendar className="h-3 w-3" />
                                                {new Date(enquete.data_inicio).toLocaleDateString('pt-BR')} - {new Date(enquete.data_fim).toLocaleDateString('pt-BR')}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Users className="h-3 w-3" />
                                                {enquete.opcoes?.length || 0} opções
                                            </span>
                                        </div>
                                    </div>
                                    <Button variant="outline" size="sm">
                                        Ver Resultados
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
