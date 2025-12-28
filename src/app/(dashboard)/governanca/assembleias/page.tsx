'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, Button, Badge } from '@/components/ui';
import { useAuth } from '@/hooks/useAuth';
import { createClient } from '@/lib/supabase/client';
import { Users, Plus, Calendar, FileText, Clock, CheckCircle2, Video } from 'lucide-react';

interface Assembleia {
    id: string;
    titulo: string;
    descricao: string;
    data_assembleia: string;
    horario: string;
    local: string;
    tipo: string;
    status: string;
    ata_url?: string;
    created_at: string;
}

export default function AssembleiasPage() {
    const { profile } = useAuth();
    const [assembleias, setAssembleias] = useState<Assembleia[]>([]);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        fetchAssembleias();
    }, []);

    const fetchAssembleias = async () => {
        try {
            // Placeholder - será implementado quando a tabela existir
            setAssembleias([]);
        } catch (error) {
            console.error('Erro ao buscar assembleias:', error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'agendada':
                return <Badge className="bg-blue-100 text-blue-800">Agendada</Badge>;
            case 'em_andamento':
                return <Badge className="bg-green-100 text-green-800">Em Andamento</Badge>;
            case 'realizada':
                return <Badge className="bg-gray-100 text-gray-800">Realizada</Badge>;
            case 'cancelada':
                return <Badge className="bg-red-100 text-red-800">Cancelada</Badge>;
            default:
                return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>;
        }
    };

    const getTipoBadge = (tipo: string) => {
        switch (tipo) {
            case 'ordinaria':
                return <Badge className="bg-purple-100 text-purple-800">Ordinária</Badge>;
            case 'extraordinaria':
                return <Badge className="bg-orange-100 text-orange-800">Extraordinária</Badge>;
            default:
                return <Badge className="bg-gray-100 text-gray-800">{tipo}</Badge>;
        }
    };

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <Users className="h-7 w-7 text-purple-600" />
                        Assembleias
                    </h1>
                    <p className="text-gray-500">Gerencie assembleias do condomínio</p>
                </div>
                <Button className="bg-purple-600 hover:bg-purple-700 text-white">
                    <Plus className="h-4 w-4 mr-2" />
                    Nova Assembleia
                </Button>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-12">
                    <div className="animate-spin h-8 w-8 border-4 border-purple-500 border-t-transparent rounded-full" />
                </div>
            ) : assembleias.length === 0 ? (
                <Card>
                    <CardContent className="py-12 text-center">
                        <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-600 mb-2">Nenhuma assembleia cadastrada</h3>
                        <p className="text-gray-400 mb-4">
                            Agende assembleias e compartilhe com os moradores
                        </p>
                        <Button className="bg-purple-600 hover:bg-purple-700 text-white">
                            <Plus className="h-4 w-4 mr-2" />
                            Agendar Assembleia
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4">
                    {assembleias.map((assembleia) => (
                        <Card key={assembleia.id} className="hover:shadow-md transition-shadow">
                            <CardContent className="p-4">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h3 className="font-semibold text-gray-900">{assembleia.titulo}</h3>
                                            {getTipoBadge(assembleia.tipo)}
                                            {getStatusBadge(assembleia.status)}
                                        </div>
                                        <p className="text-sm text-gray-500 mb-2">{assembleia.descricao}</p>
                                        <div className="flex items-center gap-4 text-xs text-gray-400">
                                            <span className="flex items-center gap-1">
                                                <Calendar className="h-3 w-3" />
                                                {new Date(assembleia.data_assembleia).toLocaleDateString('pt-BR')}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Clock className="h-3 w-3" />
                                                {assembleia.horario}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Video className="h-3 w-3" />
                                                {assembleia.local}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        {assembleia.ata_url && (
                                            <Button variant="outline" size="sm">
                                                <FileText className="h-4 w-4 mr-1" />
                                                Ata
                                            </Button>
                                        )}
                                        <Button variant="outline" size="sm">
                                            Ver Detalhes
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
