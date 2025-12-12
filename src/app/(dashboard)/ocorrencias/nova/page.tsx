'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, Button, Input, Select } from '@/components/ui';
import { Textarea } from '@/components/ui/textarea';
import { createClient } from '@/lib/supabase/client';
import { useUser } from '@/hooks/useUser';
import { ArrowLeft, Send, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { Unit } from '@/types/database';

export default function NovaOcorrenciaPage() {
    const router = useRouter();
    const { condoId, profile } = useUser();
    const [loading, setLoading] = useState(false);
    const [titulo, setTitulo] = useState('');
    const [descricao, setDescricao] = useState('');
    const [tipo, setTipo] = useState('reclamacao');
    const [prioridade, setPrioridade] = useState('media');
    const [unidadeId, setUnidadeId] = useState('');
    const [units, setUnits] = useState<Unit[]>([]);
    const supabase = createClient();

    useEffect(() => {
        if (condoId) {
            supabase.from('units').select('*').eq('condo_id', condoId).then(({ data }) => setUnits(data || []));
        }
        if (profile?.unidade_id) {
            setUnidadeId(profile.unidade_id);
        }
    }, [condoId, profile]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!condoId || !profile?.id) return;

        setLoading(true);

        const { error } = await supabase.from('occurrences').insert({
            condo_id: condoId,
            titulo,
            descricao,
            tipo,
            prioridade,
            status: 'aberta',
            unidade_id: unidadeId || null,
            criado_por_user_id: profile.id,
        });

        if (!error) {
            router.push('/ocorrencias');
        }
        setLoading(false);
    };

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link href="/ocorrencias">
                    <Button variant="ghost" size="sm">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Voltar
                    </Button>
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Nova Ocorrência</h1>
                    <p className="text-gray-500">Registre uma nova ocorrência no condomínio</p>
                </div>
            </div>

            {/* Form */}
            <Card>
                <CardContent className="pt-6">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Título */}
                        <Input
                            label="Título *"
                            value={titulo}
                            onChange={(e) => setTitulo(e.target.value)}
                            placeholder="Resumo da ocorrência"
                            required
                        />

                        {/* Descrição */}
                        <Textarea
                            label="Descrição"
                            value={descricao}
                            onChange={(e) => setDescricao(e.target.value)}
                            placeholder="Descreva a ocorrência em detalhes..."
                            className="min-h-[120px]"
                        />

                        {/* Tipo e Prioridade */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <Select
                                label="Tipo *"
                                value={tipo}
                                onChange={(e) => setTipo(e.target.value)}
                                options={[
                                    { value: 'reclamacao', label: '📢 Reclamação' },
                                    { value: 'incidente', label: '⚠️ Incidente' },
                                    { value: 'manutencao', label: '🔧 Manutenção' },
                                    { value: 'outro', label: '📋 Outro' },
                                ]}
                                required
                            />
                            <Select
                                label="Prioridade *"
                                value={prioridade}
                                onChange={(e) => setPrioridade(e.target.value)}
                                options={[
                                    { value: 'baixa', label: '🟢 Baixa' },
                                    { value: 'media', label: '🟡 Média' },
                                    { value: 'alta', label: '🔴 Alta' },
                                ]}
                                required
                            />
                        </div>

                        {/* Unidade */}
                        <Select
                            label="Unidade Relacionada"
                            value={unidadeId}
                            onChange={(e) => setUnidadeId(e.target.value)}
                            options={[
                                { value: '', label: 'Área comum / Não especificada' },
                                ...units.map(u => ({
                                    value: u.id,
                                    label: `${u.bloco || ''} ${u.numero_unidade}`.trim()
                                }))
                            ]}
                        />

                        {/* Aviso de prioridade alta */}
                        {prioridade === 'alta' && (
                            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
                                <AlertTriangle className="h-4 w-4" />
                                <span>Ocorrências de alta prioridade serão notificadas imediatamente ao síndico.</span>
                            </div>
                        )}

                        {/* Botões */}
                        <div className="flex gap-3 justify-end pt-4 border-t">
                            <Link href="/ocorrencias">
                                <Button type="button" variant="ghost">
                                    Cancelar
                                </Button>
                            </Link>
                            <Button type="submit" loading={loading}>
                                <Send className="h-4 w-4 mr-2" />
                                Registrar Ocorrência
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
