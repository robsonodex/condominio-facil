'use client';

import { useState } from 'react';
import { Modal } from '@/components/ui/modal';
import { Button, Input, Select, Textarea } from '@/components/ui';
import { createClient } from '@/lib/supabase/client';
import { useUser } from '@/hooks/useUser';

interface OrderModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    order?: any;
    suppliers: any[];
}

export function OrderModal({ isOpen, onClose, onSuccess, order, suppliers }: OrderModalProps) {
    const { condoId } = useUser();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        titulo: order?.titulo || '',
        descricao: order?.descricao || '',
        tipo: order?.tipo || 'corretiva',
        prioridade: order?.prioridade || 'media',
        local: order?.local || '',
        fornecedor_id: order?.fornecedor_id || '',
        data_agendada: order?.data_agendada?.split('T')[0] || '',
        valor_estimado: order?.valor_estimado || '',
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const data = {
                ...formData,
                condo_id: condoId,
                valor_estimado: formData.valor_estimado ? parseFloat(formData.valor_estimado) : null,
            };

            if (order) {
                await fetch(`/api/maintenance/orders?id=${order.id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data),
                });
            } else {
                await fetch('/api/maintenance/orders', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data),
                });
            }

            onSuccess();
            onClose();
        } catch (error) {
            alert('Erro ao salvar ordem');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={order ? 'Editar Ordem de Serviço' : 'Nova Ordem de Serviço'}
            size="lg"
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                    label="Título"
                    value={formData.titulo}
                    onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                    placeholder="Ex: Vazamento no chuveiro"
                    required
                />

                <Textarea
                    label="Descrição"
                    value={formData.descricao}
                    onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                    placeholder="Descreva o problema ou serviço..."
                    rows={3}
                />

                <div className="grid grid-cols-2 gap-4">
                    <Select
                        label="Tipo"
                        value={formData.tipo}
                        onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                        options={[
                            { value: 'preventiva', label: 'Preventiva' },
                            { value: 'corretiva', label: 'Corretiva' },
                            { value: 'urgente', label: 'Urgente' },
                        ]}
                        required
                    />

                    <Select
                        label="Prioridade"
                        value={formData.prioridade}
                        onChange={(e) => setFormData({ ...formData, prioridade: e.target.value })}
                        options={[
                            { value: 'baixa', label: 'Baixa' },
                            { value: 'media', label: 'Média' },
                            { value: 'alta', label: 'Alta' },
                        ]}
                        required
                    />
                </div>

                <Input
                    label="Local"
                    value={formData.local}
                    onChange={(e) => setFormData({ ...formData, local: e.target.value })}
                    placeholder="Ex: Bloco A - Apto 101"
                />

                <div className="grid grid-cols-2 gap-4">
                    <Select
                        label="Fornecedor"
                        value={formData.fornecedor_id}
                        onChange={(e) => setFormData({ ...formData, fornecedor_id: e.target.value })}
                        options={[
                            { value: '', label: 'Selecione...' },
                            ...suppliers.map(s => ({ value: s.id, label: s.nome }))
                        ]}
                    />

                    <Input
                        label="Data Agendada"
                        type="date"
                        value={formData.data_agendada}
                        onChange={(e) => setFormData({ ...formData, data_agendada: e.target.value })}
                    />
                </div>

                <Input
                    label="Valor Estimado (R$)"
                    type="number"
                    step="0.01"
                    value={formData.valor_estimado}
                    onChange={(e) => setFormData({ ...formData, valor_estimado: e.target.value })}
                    placeholder="0.00"
                />

                <div className="flex gap-3 justify-end pt-4">
                    <Button type="button" variant="ghost" onClick={onClose}>
                        Cancelar
                    </Button>
                    <Button type="submit" loading={loading}>
                        {order ? 'Salvar' : 'Criar'}
                    </Button>
                </div>
            </form>
        </Modal>
    );
}

interface SupplierModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    supplier?: any;
}

export function SupplierModal({ isOpen, onClose, onSuccess, supplier }: SupplierModalProps) {
    const { condoId } = useUser();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        nome: supplier?.nome || '',
        especialidade: supplier?.especialidade || '',
        telefone: supplier?.telefone || '',
        email: supplier?.email || '',
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const data = {
                ...formData,
                condo_id: condoId,
            };

            if (supplier) {
                await fetch(`/api/maintenance/suppliers?id=${supplier.id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data),
                });
            } else {
                await fetch('/api/maintenance/suppliers', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data),
                });
            }

            onSuccess();
            onClose();
        } catch (error) {
            alert('Erro ao salvar fornecedor');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={supplier ? 'Editar Fornecedor' : 'Novo Fornecedor'}
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                    label="Nome"
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    placeholder="Ex: Hidráulica Silva"
                    required
                />

                <Input
                    label="Especialidade"
                    value={formData.especialidade}
                    onChange={(e) => setFormData({ ...formData, especialidade: e.target.value })}
                    placeholder="Ex: Encanador, Eletricista, Pintor"
                    required
                />

                <div className="grid grid-cols-2 gap-4">
                    <Input
                        label="Telefone"
                        value={formData.telefone}
                        onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                        placeholder="(11) 99999-9999"
                    />

                    <Input
                        label="Email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="contato@fornecedor.com"
                    />
                </div>

                <div className="flex gap-3 justify-end pt-4">
                    <Button type="button" variant="ghost" onClick={onClose}>
                        Cancelar
                    </Button>
                    <Button type="submit" loading={loading}>
                        {supplier ? 'Salvar' : 'Criar'}
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
