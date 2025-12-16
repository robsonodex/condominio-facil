'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, Button, Input, Select, Textarea } from '@/components/ui';
import { useUser } from '@/hooks/useUser';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Send, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

export default function NovoTicketPage() {
    const { profile, condoId } = useUser();
    const { session } = useAuth();
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        subject: '',
        description: '',
        category: 'geral',
        priority: 'normal'
    });

    // Verificar se pode usar prioridade "priority"
    const [canUsePriority, setCanUsePriority] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await fetch('/api/support/tickets', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session?.access_token}`,
                },
                credentials: 'include',
                body: JSON.stringify(formData)
            });

            const data = await res.json();

            if (res.ok) {
                alert('✅ Ticket criado com sucesso!');
                router.push(`/suporte/${data.ticket.id}`);
            } else {
                alert(`❌ ${data.error}`);
            }
        } catch (error) {
            alert('Erro ao criar ticket');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link href="/suporte">
                    <Button variant="ghost" size="sm">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Voltar
                    </Button>
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Novo Ticket de Suporte</h1>
                    <p className="text-gray-500">Descreva sua solicitação ou problema</p>
                </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit}>
                <Card>
                    <CardHeader>
                        <CardTitle>Informações do Ticket</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Input
                            label="Assunto *"
                            placeholder="Resumo do problema ou solicitação"
                            value={formData.subject}
                            onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                            required
                        />

                        <Textarea
                            label="Descrição *"
                            placeholder="Descreva em detalhes o problema ou sua solicitação..."
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            rows={6}
                            required
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <Select
                                label="Categoria *"
                                value={formData.category}
                                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                options={[
                                    { value: 'geral', label: 'Geral' },
                                    { value: 'tecnico', label: 'Técnico' },
                                    { value: 'financeiro', label: 'Financeiro' },
                                    { value: 'outro', label: 'Outro' }
                                ]}
                            />

                            <Select
                                label="Prioridade *"
                                value={formData.priority}
                                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                                options={[
                                    { value: 'low', label: '🔵 Baixa' },
                                    { value: 'normal', label: '🟢 Normal' },
                                    { value: 'high', label: '🟡 Alta' },
                                    { value: 'priority', label: '🔴 Prioritário (Plano Avançado)' }
                                ]}
                            />
                        </div>

                        {formData.priority === 'priority' && (
                            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                                <div className="flex items-start gap-3">
                                    <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                                    <div>
                                        <p className="font-semibold text-red-900">Suporte Prioritário</p>
                                        <p className="text-sm text-red-700 mt-1">
                                            Este recurso está disponível apenas para o Plano Avançado.
                                            Seu ticket será atendido com SLA de 4 horas.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="flex justify-end gap-3 pt-4">
                            <Link href="/suporte">
                                <Button type="button" variant="ghost">
                                    Cancelar
                                </Button>
                            </Link>
                            <Button type="submit" loading={loading}>
                                <Send className="h-4 w-4 mr-2" />
                                Criar Ticket
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </form>
        </div>
    );
}
