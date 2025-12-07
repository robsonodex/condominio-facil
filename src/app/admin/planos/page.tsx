'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, Button, Input, Table, Badge } from '@/components/ui';
import { Modal } from '@/components/ui/modal';
import { Textarea } from '@/components/ui/textarea';
import { createClient } from '@/lib/supabase/client';
import { formatCurrency } from '@/lib/utils';
import { Plus, CreditCard, Edit, Trash2 } from 'lucide-react';
import { Plan } from '@/types/database';

export default function AdminPlanosPage() {
    const [plans, setPlans] = useState<Plan[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
    const supabase = createClient();

    useEffect(() => {
        fetchPlans();
    }, []);

    const fetchPlans = async () => {
        setLoading(true);
        const { data } = await supabase.from('plans').select('*').order('valor_mensal');
        setPlans(data || []);
        setLoading(false);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Deseja realmente excluir este plano?')) return;
        await supabase.from('plans').delete().eq('id', id);
        fetchPlans();
    };

    const columns = [
        {
            key: 'nome_plano',
            header: 'Plano',
            render: (p: Plan) => (
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-100 rounded-lg">
                        <CreditCard className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div>
                        <p className="font-medium text-gray-900">{p.nome_plano}</p>
                        <p className="text-sm text-gray-500">{p.descricao}</p>
                    </div>
                </div>
            )
        },
        { key: 'limite_unidades', header: 'Limite', render: (p: Plan) => `Até ${p.limite_unidades} unidades` },
        { key: 'valor_mensal', header: 'Valor', render: (p: Plan) => formatCurrency(p.valor_mensal) },
        {
            key: 'ativo',
            header: 'Status',
            render: (p: Plan) => (
                <Badge variant={p.ativo ? 'success' : 'default'}>
                    {p.ativo ? 'Ativo' : 'Inativo'}
                </Badge>
            )
        },
        {
            key: 'actions',
            header: '',
            className: 'text-right',
            render: (p: Plan) => (
                <div className="flex gap-2 justify-end">
                    <button
                        onClick={(e) => { e.stopPropagation(); setEditingPlan(p); setShowModal(true); }}
                        className="p-1 hover:bg-gray-100 rounded"
                    >
                        <Edit className="h-4 w-4 text-gray-500" />
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); handleDelete(p.id); }}
                        className="p-1 hover:bg-gray-100 rounded"
                    >
                        <Trash2 className="h-4 w-4 text-red-500" />
                    </button>
                </div>
            )
        },
    ];

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Planos</h1>
                    <p className="text-gray-500">Gerencie os planos de assinatura</p>
                </div>
                <Button onClick={() => { setEditingPlan(null); setShowModal(true); }}>
                    <Plus className="h-4 w-4 mr-2" />
                    Novo Plano
                </Button>
            </div>

            {/* Table */}
            <Card>
                <CardContent className="p-0">
                    <Table
                        data={plans}
                        columns={columns}
                        loading={loading}
                        emptyMessage="Nenhum plano cadastrado"
                    />
                </CardContent>
            </Card>

            {/* Modal */}
            <PlanModal
                isOpen={showModal}
                onClose={() => { setShowModal(false); setEditingPlan(null); }}
                onSuccess={fetchPlans}
                plan={editingPlan}
            />
        </div>
    );
}

function PlanModal({ isOpen, onClose, onSuccess, plan }: {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    plan: Plan | null;
}) {
    const [loading, setLoading] = useState(false);
    const [nomePlano, setNomePlano] = useState('');
    const [limiteUnidades, setLimiteUnidades] = useState('');
    const [valorMensal, setValorMensal] = useState('');
    const [descricao, setDescricao] = useState('');
    const [ativo, setAtivo] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        if (plan) {
            setNomePlano(plan.nome_plano);
            setLimiteUnidades(plan.limite_unidades.toString());
            setValorMensal(plan.valor_mensal.toString());
            setDescricao(plan.descricao || '');
            setAtivo(plan.ativo);
        } else {
            setNomePlano('');
            setLimiteUnidades('');
            setValorMensal('');
            setDescricao('');
            setAtivo(true);
        }
    }, [plan]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const data = {
            nome_plano: nomePlano,
            limite_unidades: parseInt(limiteUnidades),
            valor_mensal: parseFloat(valorMensal),
            descricao: descricao || null,
            ativo,
        };

        if (plan) {
            await supabase.from('plans').update(data).eq('id', plan.id);
        } else {
            await supabase.from('plans').insert(data);
        }

        onSuccess();
        onClose();
        setLoading(false);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={plan ? 'Editar Plano' : 'Novo Plano'} size="md">
            <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                    label="Nome do Plano"
                    value={nomePlano}
                    onChange={(e) => setNomePlano(e.target.value)}
                    placeholder="Ex: Básico, Intermediário, Avançado"
                    required
                />

                <div className="grid grid-cols-2 gap-4">
                    <Input
                        label="Limite de Unidades"
                        type="number"
                        value={limiteUnidades}
                        onChange={(e) => setLimiteUnidades(e.target.value)}
                        placeholder="20"
                        required
                    />
                    <Input
                        label="Valor Mensal (R$)"
                        type="number"
                        step="0.01"
                        value={valorMensal}
                        onChange={(e) => setValorMensal(e.target.value)}
                        placeholder="99.90"
                        required
                    />
                </div>

                <Textarea
                    label="Descrição"
                    value={descricao}
                    onChange={(e) => setDescricao(e.target.value)}
                    placeholder="Descreva os recursos do plano..."
                />

                <div className="flex items-center gap-2">
                    <input
                        type="checkbox"
                        id="ativo"
                        checked={ativo}
                        onChange={(e) => setAtivo(e.target.checked)}
                        className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <label htmlFor="ativo" className="text-sm text-gray-700">Plano ativo</label>
                </div>

                <div className="flex gap-3 justify-end pt-4">
                    <Button type="button" variant="ghost" onClick={onClose}>
                        Cancelar
                    </Button>
                    <Button type="submit" loading={loading}>
                        {plan ? 'Salvar' : 'Criar'}
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
