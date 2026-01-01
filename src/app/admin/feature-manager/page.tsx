'use client';

import { useState, useEffect } from 'react';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Settings, DollarSign } from 'lucide-react';

interface Feature {
    feature_key: string;
    feature_name: string;
    feature_description?: string;
    feature_category: string;
    is_available: boolean;
    setup_fee: number;
    monthly_fee: number;
    included_in_plans: string[];
    requires_setup: boolean;
}

interface Condo {
    id: string;
    nome: string;
    plano: string;
    features: {
        feature_key: string;
        is_enabled: boolean;
    }[];
}

export default function FeatureManagerPage() {
    const [features, setFeatures] = useState<Feature[]>([]);
    const [condos, setCondos] = useState<Condo[]>([]);
    const [selectedCondo, setSelectedCondo] = useState<string | null>(null);
    const [search, setSearch] = useState('');

    useEffect(() => {
        loadFeatures();
        loadCondos();
    }, []);

    const loadFeatures = async () => {
        const res = await fetch('/api/admin/features');
        const data = await res.json();
        setFeatures(data.features || []);
    };

    const loadCondos = async () => {
        const res = await fetch('/api/admin/condos?include_features=true');
        const data = await res.json();
        setCondos(data.condos || []);
    };

    const toggleFeature = async (condoId: string, featureKey: string, enabled: boolean) => {
        await fetch('/api/admin/features/toggle', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ condoId, featureKey, enabled })
        });

        // Atualiza estado local
        setCondos(prev => prev.map(c =>
            c.id === condoId
                ? {
                    ...c,
                    features: c.features.map(f =>
                        f.feature_key === featureKey ? { ...f, is_enabled: enabled } : f
                    )
                }
                : c
        ));
    };

    const openFeatureConfig = (condoId: string, featureKey: string) => {
        console.log('Open config for', condoId, featureKey);
        // TODO: Implement modal or navigation to config
    };

    const filteredCondos = condos.filter(c =>
        c.nome.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold">🎛️ Gerenciador de Features</h1>
                <Button onClick={() => window.location.href = '/admin/features/catalog'}>
                    ➕ Criar Nova Feature
                </Button>
            </div>

            {/* Busca de Condomínio */}
            <div className="mb-6 relative">
                <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <Input
                    placeholder="Buscar condomínio..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10"
                />
            </div>

            {/* Grid de Condomínios */}
            <div className="grid gap-6">
                {filteredCondos.map(condo => (
                    <div key={condo.id} className="border rounded-lg p-6 bg-white shadow-sm">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className="text-xl font-semibold">{condo.nome}</h3>
                                <Badge variant="outline" className="mt-1">
                                    Plano: {condo.plano}
                                </Badge>
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setSelectedCondo(selectedCondo === condo.id ? null : condo.id)}
                            >
                                {selectedCondo === condo.id ? '▲ Ocultar' : '▼ Expandir'}
                            </Button>
                        </div>

                        {selectedCondo === condo.id && (
                            <div className="space-y-4 mt-4 border-t pt-4">
                                {features.map(feature => {
                                    const condoFeature = condo.features.find(f => f.feature_key === feature.feature_key);
                                    const isEnabled = condoFeature?.is_enabled || false;
                                    // Handle case where plan string case might not match
                                    const isIncludedInPlan = feature.included_in_plans?.includes(condo.plano?.toLowerCase());

                                    return (
                                        <div key={feature.feature_key} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3">
                                                    <h4 className="font-medium">{feature.feature_name}</h4>
                                                    {isIncludedInPlan && (
                                                        <Badge variant="secondary" className="bg-green-100 text-green-800">Incluído no Plano</Badge>
                                                    )}
                                                    {feature.requires_setup && (
                                                        <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Requer Implantação</Badge>
                                                    )}
                                                </div>
                                                <p className="text-sm text-gray-600 mt-1">
                                                    {feature.feature_category === 'module' && '📦 Módulo'}
                                                    {feature.feature_category === 'integration' && '🔌 Integração'}
                                                    {feature.feature_category === 'addon' && '⭐ Add-on'}
                                                </p>
                                                {(feature.setup_fee > 0 || feature.monthly_fee > 0) && (
                                                    <p className="text-sm text-gray-500 mt-1">
                                                        {feature.setup_fee > 0 && `Implantação: R$ ${feature.setup_fee.toFixed(2)}`}
                                                        {feature.setup_fee > 0 && feature.monthly_fee > 0 && ' | '}
                                                        {feature.monthly_fee > 0 && `Mensal: R$ ${feature.monthly_fee.toFixed(2)}`}
                                                    </p>
                                                )}
                                            </div>

                                            <div className="flex items-center gap-4">
                                                <Switch
                                                    checked={isEnabled}
                                                    onCheckedChange={(checked) => toggleFeature(condo.id, feature.feature_key, checked)}
                                                    disabled={!feature.is_available}
                                                />
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => openFeatureConfig(condo.id, feature.feature_key)}
                                                >
                                                    <Settings className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
