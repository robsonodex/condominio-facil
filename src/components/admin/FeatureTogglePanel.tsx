'use client';

import { useState, useEffect } from 'react';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { DollarSign, Zap, Lock } from 'lucide-react';
import { toast } from 'sonner';

interface Feature {
    feature_key: string;
    display_name: string;
    description: string;
    category: string;
    icon: string;
    requires_implementation: boolean;
    implementation_cost: number;
    monthly_cost: number;
    enabledByDefault: boolean;
    canBeToggled: boolean;
    isActive: boolean;
    implementationPaid: boolean;
}

export function FeatureTogglePanel({ condoId }: { condoId: string }) {
    const [features, setFeatures] = useState<Feature[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchFeatures();
    }, [condoId]);

    const fetchFeatures = async () => {
        try {
            const res = await fetch(`/api/admin/features/available?condoId=${condoId}`);
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            setFeatures(data.features || []);
        } catch (error: any) {
            toast.error(`Erro ao carregar features: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleToggle = async (featureKey: string, newValue: boolean) => {
        const feature = features.find(f => f.feature_key === featureKey);
        if (!feature) return;

        // Se requer implantação e não foi paga, bloqueia
        if (newValue && feature.requires_implementation && !feature.implementationPaid) {
            toast.error(`Esta feature requer implantação paga (R$ ${feature.implementation_cost})`);
            return;
        }

        // Lógica especial para integração bancária (opcional, conforme prompt)
        if (featureKey === 'integracao_bancaria' && newValue) {
            const confirmed = window.confirm(
                `Ativar Integração Bancária para este condomínio?\n\n` +
                `Taxa de Implantação: R$ ${feature.implementation_cost}\n` +
                `Mensalidade Adicional: R$ ${feature.monthly_cost}/mês\n\n` +
                `O síndico precisará configurar as credenciais do gateway.`
            );
            if (!confirmed) return;
        }

        try {
            const res = await fetch('/api/admin/features/toggle', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ condoId, featureKey, isActive: newValue })
            });

            const data = await res.json();
            if (res.ok) {
                toast.success(data.message || `Feature ${newValue ? 'ativada' : 'desativada'} com sucesso`);
                fetchFeatures(); // Recarrega
            } else {
                toast.error(data.error || 'Erro ao alterar feature');
            }
        } catch (error: any) {
            toast.error(`Erro: ${error.message}`);
        }
    };

    const categories: Record<string, string> = {
        communication: 'Comunicação',
        finance: 'Financeiro',
        ai: 'Inteligência Artificial',
        integration: 'Integrações',
        security: 'Segurança',
        governance: 'Governança',
        portaria: 'Portaria',
        community: 'Comunidade'
    };

    if (loading) return <div>Carregando features...</div>;

    return (
        <div className="space-y-6">
            {Object.entries(categories).map(([key, label]) => {
                const categoryFeatures = features.filter(f => f.category === key);
                if (categoryFeatures.length === 0) return null;

                return (
                    <div key={key} className="border rounded-lg p-4">
                        <h3 className="text-lg font-semibold mb-4">{label}</h3>
                        <div className="space-y-3">
                            {categoryFeatures.map(feature => (
                                <div key={feature.feature_key} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium">{feature.display_name}</span>
                                            {feature.requires_implementation && (
                                                <Badge variant="secondary">
                                                    <DollarSign className="w-3 h-3 mr-1" />
                                                    Impl: R$ {feature.implementation_cost}
                                                </Badge>
                                            )}
                                            {feature.monthly_cost > 0 && (
                                                <Badge variant="outline">
                                                    +R$ {feature.monthly_cost}/mês
                                                </Badge>
                                            )}
                                            {!feature.canBeToggled && (
                                                <Badge variant="default">
                                                    <Lock className="w-3 h-3 mr-1" />
                                                    Sempre Ativo
                                                </Badge>
                                            )}
                                        </div>
                                        <p className="text-sm text-gray-600">{feature.description}</p>
                                    </div>

                                    <Switch
                                        checked={feature.isActive}
                                        onCheckedChange={(checked) => handleToggle(feature.feature_key, checked)}
                                        disabled={!feature.canBeToggled}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
