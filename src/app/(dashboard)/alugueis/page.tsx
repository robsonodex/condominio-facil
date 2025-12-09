'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, Button, Badge, Modal, Input, Select } from '@/components/ui';
import { useUser } from '@/hooks/useUser';
import { formatCurrency, formatDate } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import { Plus, FileText, Send, Eye, Home, Users, Calendar, DollarSign } from 'lucide-react';

interface Contract {
    id: string;
    unit_id: string;
    tenant_id: string;
    monthly_rent: number;
    include_condo_fee: boolean;
    billing_day: number;
    start_date: string;
    end_date: string | null;
    status: string;
    unit?: { numero: string; bloco?: string };
    tenant?: { nome: string; email: string };
}

interface RentInvoice {
    id: string;
    invoice_number: string;
    due_date: string;
    total: number;
    status: string;
    boleto_url?: string;
}

export default function AlugueisPage() {
    const { condoId } = useUser();
    const [contracts, setContracts] = useState<Contract[]>([]);
    const [invoices, setInvoices] = useState<RentInvoice[]>([]);
    const [units, setUnits] = useState<any[]>([]);
    const [tenants, setTenants] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
    const [generatingInvoice, setGeneratingInvoice] = useState<string | null>(null);

    // Form state
    const [formData, setFormData] = useState({
        unit_id: '',
        tenant_id: '',
        monthly_rent: '',
        billing_day: '5',
        include_condo_fee: false,
        start_date: new Date().toISOString().split('T')[0],
        end_date: '',
        notes: ''
    });

    const supabase = createClient();

    useEffect(() => {
        if (condoId) {
            fetchData();
        }
    }, [condoId]);

    const fetchData = async () => {
        setLoading(true);

        // Buscar contratos
        const contractsRes = await fetch('/api/contracts/rent');
        const contractsData = await contractsRes.json();
        setContracts(contractsData.contracts || []);

        // Buscar unidades
        const { data: unitsData } = await supabase
            .from('units')
            .select('id, numero, bloco')
            .eq('condo_id', condoId);
        setUnits(unitsData || []);

        // Buscar moradores (inquilinos potenciais)
        const { data: tenantsData } = await supabase
            .from('users')
            .select('id, nome, email')
            .eq('condo_id', condoId)
            .in('role', ['morador', 'inquilino']);
        setTenants(tenantsData || []);

        setLoading(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const response = await fetch('/api/contracts/rent', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                ...formData,
                monthly_rent: parseFloat(formData.monthly_rent),
                billing_day: parseInt(formData.billing_day),
                end_date: formData.end_date || null
            })
        });

        const data = await response.json();

        if (response.ok) {
            alert('✅ Contrato criado com sucesso!');
            setShowModal(false);
            fetchData();
            setFormData({
                unit_id: '',
                tenant_id: '',
                monthly_rent: '',
                billing_day: '5',
                include_condo_fee: false,
                start_date: new Date().toISOString().split('T')[0],
                end_date: '',
                notes: ''
            });
        } else {
            alert(`❌ Erro: ${data.error}`);
        }
    };

    const generateInvoice = async (contractId: string) => {
        setGeneratingInvoice(contractId);

        const response = await fetch('/api/checkout/rent', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contract_id: contractId,
                payment_method: 'boleto'
            })
        });

        const data = await response.json();

        if (response.ok) {
            alert('✅ Fatura gerada! Boleto criado.');
            if (data.boleto_url) {
                window.open(data.boleto_url, '_blank');
            }
        } else {
            alert(`❌ Erro: ${data.error}`);
        }

        setGeneratingInvoice(null);
    };

    const getStatusBadge = (status: string) => {
        const variants: Record<string, 'success' | 'warning' | 'danger' | 'secondary'> = {
            active: 'success',
            paused: 'warning',
            cancelled: 'danger',
            ended: 'secondary'
        };
        const labels: Record<string, string> = {
            active: 'Ativo',
            paused: 'Pausado',
            cancelled: 'Cancelado',
            ended: 'Encerrado'
        };
        return <Badge variant={variants[status] || 'secondary'}>{labels[status] || status}</Badge>;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-emerald-600 border-t-transparent"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Aluguéis</h1>
                    <p className="text-gray-500">Gerencie contratos e cobranças de aluguel</p>
                </div>
                <Button onClick={() => setShowModal(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Novo Contrato
                </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white border-0">
                    <CardContent className="py-4">
                        <div className="flex items-center gap-3">
                            <Home className="h-8 w-8 opacity-80" />
                            <div>
                                <p className="text-2xl font-bold">{contracts.length}</p>
                                <p className="text-emerald-100 text-sm">Contratos</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0">
                    <CardContent className="py-4">
                        <div className="flex items-center gap-3">
                            <Users className="h-8 w-8 opacity-80" />
                            <div>
                                <p className="text-2xl font-bold">{contracts.filter(c => c.status === 'active').length}</p>
                                <p className="text-blue-100 text-sm">Ativos</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0">
                    <CardContent className="py-4">
                        <div className="flex items-center gap-3">
                            <DollarSign className="h-8 w-8 opacity-80" />
                            <div>
                                <p className="text-2xl font-bold">
                                    {formatCurrency(contracts.reduce((sum, c) => sum + (c.status === 'active' ? c.monthly_rent : 0), 0))}
                                </p>
                                <p className="text-purple-100 text-sm">Receita Mensal</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Contracts List */}
            <Card>
                <CardHeader>
                    <CardTitle>Contratos de Aluguel</CardTitle>
                </CardHeader>
                <CardContent>
                    {contracts.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            <Home className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p>Nenhum contrato cadastrado</p>
                            <Button className="mt-4" onClick={() => setShowModal(true)}>
                                Criar Primeiro Contrato
                            </Button>
                        </div>
                    ) : (
                        <div className="divide-y">
                            {contracts.map((contract) => (
                                <div key={contract.id} className="py-4 flex items-center justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-1">
                                            <p className="font-semibold text-gray-900">
                                                Unidade {contract.unit?.numero}
                                                {contract.unit?.bloco && ` - ${contract.unit.bloco}`}
                                            </p>
                                            {getStatusBadge(contract.status)}
                                        </div>
                                        <p className="text-sm text-gray-500">
                                            Inquilino: {contract.tenant?.nome || 'N/A'}
                                        </p>
                                        <p className="text-sm text-gray-500">
                                            Valor: {formatCurrency(contract.monthly_rent)} | Vencimento: dia {contract.billing_day}
                                        </p>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => generateInvoice(contract.id)}
                                            disabled={generatingInvoice === contract.id || contract.status !== 'active'}
                                        >
                                            <FileText className="h-4 w-4 mr-1" />
                                            {generatingInvoice === contract.id ? 'Gerando...' : 'Gerar Fatura'}
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Modal Novo Contrato */}
            <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Novo Contrato de Aluguel" size="lg">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <Select
                            label="Unidade"
                            value={formData.unit_id}
                            onChange={(e) => setFormData({ ...formData, unit_id: e.target.value })}
                            options={[
                                { value: '', label: 'Selecione...' },
                                ...units.map(u => ({
                                    value: u.id,
                                    label: `${u.numero}${u.bloco ? ` - ${u.bloco}` : ''}`
                                }))
                            ]}
                            required
                        />
                        <Select
                            label="Inquilino"
                            value={formData.tenant_id}
                            onChange={(e) => setFormData({ ...formData, tenant_id: e.target.value })}
                            options={[
                                { value: '', label: 'Selecione...' },
                                ...tenants.map(t => ({ value: t.id, label: t.nome }))
                            ]}
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <Input
                            label="Valor do Aluguel (R$)"
                            type="number"
                            step="0.01"
                            value={formData.monthly_rent}
                            onChange={(e) => setFormData({ ...formData, monthly_rent: e.target.value })}
                            required
                        />
                        <Select
                            label="Dia de Vencimento"
                            value={formData.billing_day}
                            onChange={(e) => setFormData({ ...formData, billing_day: e.target.value })}
                            options={Array.from({ length: 28 }, (_, i) => ({
                                value: String(i + 1),
                                label: `Dia ${i + 1}`
                            }))}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <Input
                            label="Data de Início"
                            type="date"
                            value={formData.start_date}
                            onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                            required
                        />
                        <Input
                            label="Data de Término (opcional)"
                            type="date"
                            value={formData.end_date}
                            onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                        />
                    </div>

                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="include_condo_fee"
                            checked={formData.include_condo_fee}
                            onChange={(e) => setFormData({ ...formData, include_condo_fee: e.target.checked })}
                            className="rounded border-gray-300"
                        />
                        <label htmlFor="include_condo_fee" className="text-sm text-gray-700">
                            Incluir taxa de condomínio na cobrança
                        </label>
                    </div>

                    <div className="flex gap-3 justify-end pt-4">
                        <Button type="button" variant="ghost" onClick={() => setShowModal(false)}>
                            Cancelar
                        </Button>
                        <Button type="submit">
                            Criar Contrato
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
