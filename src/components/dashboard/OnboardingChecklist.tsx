'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, Badge, Button } from '@/components/ui';
import { useUser, useCondo } from '@/hooks/useUser';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import {
    CheckCircle, Circle, Building2, Users, DollarSign,
    CreditCard, Shield, Calendar, Smartphone, Bell,
    FileText, Sparkles, ChevronDown, ChevronUp
} from 'lucide-react';

interface ChecklistItem {
    key: string;
    label: string;
    icon: React.ReactNode;
    href: string;
}

const CHECKLIST_ITEMS: ChecklistItem[] = [
    { key: 'cadastrar_unidades', label: 'Cadastrar unidades', icon: <Building2 className="h-4 w-4" />, href: '/unidades' },
    { key: 'cadastrar_moradores', label: 'Cadastrar moradores', icon: <Users className="h-4 w-4" />, href: '/moradores' },
    { key: 'configurar_financeiro', label: 'Configurar financeiro', icon: <DollarSign className="h-4 w-4" />, href: '/financeiro' },
    { key: 'ativar_cobrancas', label: 'Ativar cobranças', icon: <CreditCard className="h-4 w-4" />, href: '/cobrancas' },
    { key: 'ativar_portaria', label: 'Ativar portaria', icon: <Shield className="h-4 w-4" />, href: '/portaria' },
    { key: 'ativar_reservas', label: 'Ativar reservas', icon: <Calendar className="h-4 w-4" />, href: '/reservas' },
    { key: 'configurar_pwa', label: 'Configurar app/PWA', icon: <Smartphone className="h-4 w-4" />, href: '/perfil' },
    { key: 'criar_primeiro_aviso', label: 'Criar primeiro aviso', icon: <Bell className="h-4 w-4" />, href: '/avisos' },
    { key: 'criar_primeira_cobranca', label: 'Criar primeira cobrança', icon: <CreditCard className="h-4 w-4" />, href: '/cobrancas' },
    { key: 'ver_relatorio_financeiro', label: 'Ver relatório financeiro', icon: <FileText className="h-4 w-4" />, href: '/relatorios' },
];

interface OnboardingProgress {
    [key: string]: boolean;
}

export function OnboardingChecklist() {
    const { isSindico, condoId } = useUser();
    const { session } = useAuth();
    const [progress, setProgress] = useState<OnboardingProgress>({});
    const [loading, setLoading] = useState(true);
    const [collapsed, setCollapsed] = useState(false);
    const [isComplete, setIsComplete] = useState(false);
    const supabase = createClient();

    useEffect(() => {
        if (condoId && isSindico) {
            fetchProgress();
            checkAutoComplete();
        } else {
            setLoading(false);
        }
    }, [condoId, isSindico]);

    const fetchProgress = async () => {
        try {
            const { data } = await supabase
                .from('onboarding_progress')
                .select('*')
                .eq('condo_id', condoId)
                .single();

            if (data) {
                setProgress(data);
                checkIfComplete(data);
            } else {
                // Criar registro se não existe
                await supabase
                    .from('onboarding_progress')
                    .insert({ condo_id: condoId });
            }
        } catch (error) {
            console.error('Error fetching onboarding progress:', error);
        } finally {
            setLoading(false);
        }
    };

    const checkAutoComplete = async () => {
        // Verificar automaticamente se itens estão completos
        const checks: { [key: string]: () => Promise<boolean> } = {
            cadastrar_unidades: async () => {
                const { count } = await supabase.from('units').select('*', { count: 'exact', head: true }).eq('condo_id', condoId);
                return (count || 0) > 0;
            },
            cadastrar_moradores: async () => {
                const { count } = await supabase.from('users').select('*', { count: 'exact', head: true }).eq('condo_id', condoId).in('role', ['morador', 'inquilino']);
                return (count || 0) > 0;
            },
            configurar_financeiro: async () => {
                const { count } = await supabase.from('financial_entries').select('*', { count: 'exact', head: true }).eq('condo_id', condoId);
                return (count || 0) > 0;
            },
            criar_primeiro_aviso: async () => {
                const { count } = await supabase.from('notices').select('*', { count: 'exact', head: true }).eq('condo_id', condoId);
                return (count || 0) > 0;
            },
        };

        const updates: { [key: string]: boolean } = {};

        for (const [key, check] of Object.entries(checks)) {
            try {
                const result = await check();
                if (result) updates[key] = true;
            } catch { }
        }

        if (Object.keys(updates).length > 0) {
            await supabase
                .from('onboarding_progress')
                .upsert({ condo_id: condoId, ...updates }, { onConflict: 'condo_id' });

            setProgress(prev => ({ ...prev, ...updates }));
        }
    };

    const checkIfComplete = (data: OnboardingProgress) => {
        const allComplete = CHECKLIST_ITEMS.every(item => data[item.key]);
        setIsComplete(allComplete);
        if (allComplete) setCollapsed(true);
    };

    const handleComplete = async () => {
        const allComplete: OnboardingProgress = {};
        CHECKLIST_ITEMS.forEach(item => {
            allComplete[item.key] = true;
        });
        allComplete.completed_at = new Date().toISOString() as any;

        await supabase
            .from('onboarding_progress')
            .upsert({ condo_id: condoId, ...allComplete }, { onConflict: 'condo_id' });

        setProgress(allComplete);
        setIsComplete(true);
    };

    const completedCount = CHECKLIST_ITEMS.filter(item => progress[item.key]).length;
    const percentage = Math.round((completedCount / CHECKLIST_ITEMS.length) * 100);

    // Não mostrar se não for síndico ou se já concluiu há mais de 30 dias
    if (!isSindico || loading) return null;
    if (progress.completed_at && new Date(progress.completed_at as any) < new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)) return null;

    return (
        <Card className="mb-6 border-emerald-200 bg-gradient-to-r from-emerald-50 to-white">
            <CardContent className="p-4">
                <div
                    className="flex items-center justify-between cursor-pointer"
                    onClick={() => setCollapsed(!collapsed)}
                >
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                            <Sparkles className="h-5 w-5 text-emerald-600" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900">Checklist de Implantação</h3>
                            <p className="text-sm text-gray-500">{completedCount}/{CHECKLIST_ITEMS.length} concluídos</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                            <div
                                className="bg-emerald-500 h-2 rounded-full transition-all"
                                style={{ width: `${percentage}%` }}
                            />
                        </div>
                        <Badge variant={percentage === 100 ? 'success' : 'default'}>
                            {percentage}%
                        </Badge>
                        {collapsed ? <ChevronDown className="h-5 w-5 text-gray-400" /> : <ChevronUp className="h-5 w-5 text-gray-400" />}
                    </div>
                </div>

                {!collapsed && (
                    <div className="mt-4 space-y-2">
                        {CHECKLIST_ITEMS.map(item => (
                            <a
                                key={item.key}
                                href={item.href}
                                className={`flex items-center gap-3 p-2 rounded-lg transition-colors ${progress[item.key]
                                        ? 'bg-emerald-50 text-emerald-700'
                                        : 'hover:bg-gray-50 text-gray-600'
                                    }`}
                            >
                                {progress[item.key] ? (
                                    <CheckCircle className="h-5 w-5 text-emerald-500" />
                                ) : (
                                    <Circle className="h-5 w-5 text-gray-300" />
                                )}
                                {item.icon}
                                <span className={progress[item.key] ? 'line-through' : ''}>
                                    {item.label}
                                </span>
                            </a>
                        ))}

                        {percentage === 100 && !isComplete && (
                            <Button
                                onClick={handleComplete}
                                className="w-full mt-4"
                            >
                                ✅ Concluir Implantação
                            </Button>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
