'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, Button, Input, Badge } from '@/components/ui';
import { useUser, useCondo } from '@/hooks/useUser';
import { createClient } from '@/lib/supabase/client';
import {
    Zap, Clock, Percent, DollarSign, Mail, MessageSquare,
    Bell, Save, AlertTriangle, CheckCircle
} from 'lucide-react';

interface AutomationSettings {
    id?: string;
    condo_id: string;
    dias_lembrete: number;
    dias_multa: number;
    dias_cobranca_automatica: number;
    dias_relatorio_inadimplentes: number;
    multa_percentual: number;
    juros_diario: number;
    lembrete_ativo: boolean;
    multa_automatica: boolean;
    cobranca_automatica: boolean;
    relatorio_automatico: boolean;
    enviar_whatsapp: boolean;
    enviar_email: boolean;
}

const DEFAULT_SETTINGS: Omit<AutomationSettings, 'condo_id'> = {
    dias_lembrete: 3,
    dias_multa: 5,
    dias_cobranca_automatica: 15,
    dias_relatorio_inadimplentes: 30,
    multa_percentual: 2.00,
    juros_diario: 0.0333,
    lembrete_ativo: true,
    multa_automatica: false,
    cobranca_automatica: false,
    relatorio_automatico: true,
    enviar_whatsapp: true,
    enviar_email: true,
};

export default function AutomacoesPage() {
    const { condoId, isSindico, isSuperAdmin } = useUser();
    const { condo } = useCondo();
    const [settings, setSettings] = useState<AutomationSettings | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const supabase = createClient();

    useEffect(() => {
        if (condoId) {
            fetchSettings();
        }
    }, [condoId]);

    const fetchSettings = async () => {
        try {
            const { data } = await supabase
                .from('automation_settings')
                .select('*')
                .eq('condo_id', condoId)
                .maybeSingle();

            if (data) {
                setSettings(data);
            } else {
                // Criar com valores padrão
                const newSettings = { ...DEFAULT_SETTINGS, condo_id: condoId };
                const { data: created } = await supabase
                    .from('automation_settings')
                    .insert(newSettings)
                    .select()
                    .single();
                setSettings(created || newSettings as AutomationSettings);
            }
        } catch (error) {
            console.error('Error fetching settings:', error);
            setSettings({ ...DEFAULT_SETTINGS, condo_id: condoId! } as AutomationSettings);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!settings) return;
        setSaving(true);

        try {
            const { error } = await supabase
                .from('automation_settings')
                .upsert(settings, { onConflict: 'condo_id' });

            if (error) throw error;

            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } catch (error: any) {
            console.error('Error saving settings:', error);
            alert('Erro ao salvar: ' + error.message);
        } finally {
            setSaving(false);
        }
    };

    const updateSetting = (key: keyof AutomationSettings, value: any) => {
        if (!settings) return;
        setSettings({ ...settings, [key]: value });
    };

    const ToggleSwitch = ({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) => (
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span className="font-medium">{label}</span>
            <button
                type="button"
                onClick={() => onChange(!checked)}
                className={`w-12 h-6 rounded-full transition-colors ${checked ? 'bg-emerald-500' : 'bg-gray-300'}`}
            >
                <div className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
        </div>
    );

    if (!isSindico && !isSuperAdmin) {
        return (
            <div className="text-center py-12">
                <p className="text-gray-500">Acesso restrito a síndicos.</p>
            </div>
        );
    }

    if (loading || !settings) {
        return (
            <div className="text-center py-12">
                <p className="text-gray-500">Carregando configurações...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Automações de Inadimplência</h1>
                    <p className="text-gray-500">Configure regras automáticas para cobranças atrasadas</p>
                </div>
                <Button onClick={handleSave} loading={saving} disabled={saved}>
                    {saved ? (
                        <>
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Salvo!
                        </>
                    ) : (
                        <>
                            <Save className="h-4 w-4 mr-2" />
                            Salvar
                        </>
                    )}
                </Button>
            </div>

            {/* Warning */}
            <Card className="border-amber-200 bg-amber-50">
                <CardContent className="p-4 flex items-center gap-3">
                    <AlertTriangle className="h-5 w-5 text-amber-600" />
                    <p className="text-amber-800 text-sm">
                        As automações são executadas diariamente às 08:00. Certifique-se de configurar corretamente antes de ativar.
                    </p>
                </CardContent>
            </Card>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <Card
                    className={`bg-gradient-to-br ${settings.lembrete_ativo ? 'from-blue-500 to-blue-600' : 'from-gray-400 to-gray-500'} text-white border-0 cursor-pointer hover:scale-105 transition-transform`}
                    onClick={() => document.getElementById('regra-lembrete')?.scrollIntoView({ behavior: 'smooth', block: 'center' })}
                >
                    <CardContent className="py-4 text-center">
                        <Bell className="h-8 w-8 mx-auto mb-2 opacity-80" />
                        <p className="text-sm text-white/80 mb-1">Lembrete</p>
                        <p className="text-xs text-white/60">{settings.lembrete_ativo ? `${settings.dias_lembrete} dias` : 'Inativo'}</p>
                    </CardContent>
                </Card>
                <Card
                    className={`bg-gradient-to-br ${settings.multa_automatica ? 'from-orange-500 to-orange-600' : 'from-gray-400 to-gray-500'} text-white border-0 cursor-pointer hover:scale-105 transition-transform`}
                    onClick={() => document.getElementById('regra-multa')?.scrollIntoView({ behavior: 'smooth', block: 'center' })}
                >
                    <CardContent className="py-4 text-center">
                        <Percent className="h-8 w-8 mx-auto mb-2 opacity-80" />
                        <p className="text-sm text-white/80 mb-1">Multa</p>
                        <p className="text-xs text-white/60">{settings.multa_automatica ? `${settings.multa_percentual}%` : 'Inativa'}</p>
                    </CardContent>
                </Card>
                <Card
                    className={`bg-gradient-to-br ${settings.cobranca_automatica ? 'from-red-500 to-red-600' : 'from-gray-400 to-gray-500'} text-white border-0 cursor-pointer hover:scale-105 transition-transform`}
                    onClick={() => document.getElementById('regra-cobranca')?.scrollIntoView({ behavior: 'smooth', block: 'center' })}
                >
                    <CardContent className="py-4 text-center">
                        <DollarSign className="h-8 w-8 mx-auto mb-2 opacity-80" />
                        <p className="text-sm text-white/80 mb-1">Cobrança</p>
                        <p className="text-xs text-white/60">{settings.cobranca_automatica ? `${settings.dias_cobranca_automatica} dias` : 'Inativa'}</p>
                    </CardContent>
                </Card>
                <Card
                    className={`bg-gradient-to-br ${settings.relatorio_automatico ? 'from-purple-500 to-purple-600' : 'from-gray-400 to-gray-500'} text-white border-0 cursor-pointer hover:scale-105 transition-transform`}
                    onClick={() => document.getElementById('regra-relatorio')?.scrollIntoView({ behavior: 'smooth', block: 'center' })}
                >
                    <CardContent className="py-4 text-center">
                        <Clock className="h-8 w-8 mx-auto mb-2 opacity-80" />
                        <p className="text-sm text-white/80 mb-1">Relatório</p>
                        <p className="text-xs text-white/60">{settings.relatorio_automatico ? `${settings.dias_relatorio_inadimplentes} dias` : 'Inativo'}</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Regra 1 - Lembrete */}
                <Card id="regra-lembrete">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Bell className="h-5 w-5 text-blue-500" />
                            Regra 1: Lembrete de Atraso
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-sm text-gray-500">
                            Enviar lembrete após X dias de atraso.
                        </p>
                        <Input
                            label="Dias após vencimento"
                            type="number"
                            min={1}
                            max={30}
                            value={settings.dias_lembrete}
                            onChange={(e) => updateSetting('dias_lembrete', parseInt(e.target.value))}
                        />
                        <ToggleSwitch
                            checked={settings.lembrete_ativo}
                            onChange={(v) => updateSetting('lembrete_ativo', v)}
                            label="Ativar lembrete automático"
                        />
                    </CardContent>
                </Card>

                {/* Regra 2 - Multa */}
                <Card id="regra-multa">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Percent className="h-5 w-5 text-orange-500" />
                            Regra 2: Multa Automática
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-sm text-gray-500">
                            Aplicar multa + juros após Y dias de atraso.
                        </p>
                        <Input
                            label="Dias para aplicar multa"
                            type="number"
                            min={1}
                            max={60}
                            value={settings.dias_multa}
                            onChange={(e) => updateSetting('dias_multa', parseInt(e.target.value))}
                        />
                        <div className="grid grid-cols-2 gap-4">
                            <Input
                                label="Multa (%)"
                                type="number"
                                step="0.01"
                                min={0}
                                max={10}
                                value={settings.multa_percentual}
                                onChange={(e) => updateSetting('multa_percentual', parseFloat(e.target.value))}
                            />
                            <Input
                                label="Juros diário (%)"
                                type="number"
                                step="0.0001"
                                min={0}
                                max={1}
                                value={settings.juros_diario}
                                onChange={(e) => updateSetting('juros_diario', parseFloat(e.target.value))}
                            />
                        </div>
                        <ToggleSwitch
                            checked={settings.multa_automatica}
                            onChange={(v) => updateSetting('multa_automatica', v)}
                            label="Ativar multa automática"
                        />
                    </CardContent>
                </Card>

                {/* Regra 3 - Cobrança Automática */}
                <Card id="regra-cobranca">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <DollarSign className="h-5 w-5 text-red-500" />
                            Regra 3: Cobrança Automática
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-sm text-gray-500">
                            Gerar cobrança via Mercado Pago após Z dias.
                        </p>
                        <Input
                            label="Dias para gerar cobrança"
                            type="number"
                            min={1}
                            max={90}
                            value={settings.dias_cobranca_automatica}
                            onChange={(e) => updateSetting('dias_cobranca_automatica', parseInt(e.target.value))}
                        />
                        <ToggleSwitch
                            checked={settings.cobranca_automatica}
                            onChange={(v) => updateSetting('cobranca_automatica', v)}
                            label="Ativar cobrança automática"
                        />
                    </CardContent>
                </Card>

                {/* Regra 4 - Relatório */}
                <Card id="regra-relatorio">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Clock className="h-5 w-5 text-purple-500" />
                            Regra 4: Relatório Mensal
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-sm text-gray-500">
                            Enviar relatório de inadimplentes para o síndico.
                        </p>
                        <Input
                            label="Frequência (dias)"
                            type="number"
                            min={7}
                            max={60}
                            value={settings.dias_relatorio_inadimplentes}
                            onChange={(e) => updateSetting('dias_relatorio_inadimplentes', parseInt(e.target.value))}
                        />
                        <ToggleSwitch
                            checked={settings.relatorio_automatico}
                            onChange={(v) => updateSetting('relatorio_automatico', v)}
                            label="Ativar relatório automático"
                        />
                    </CardContent>
                </Card>
            </div>

            {/* Channels */}
            <Card>
                <CardHeader>
                    <CardTitle>Canais de Comunicação</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <ToggleSwitch
                            checked={settings.enviar_whatsapp}
                            onChange={(v) => updateSetting('enviar_whatsapp', v)}
                            label="💬 Enviar via WhatsApp"
                        />
                        <ToggleSwitch
                            checked={settings.enviar_email}
                            onChange={(v) => updateSetting('enviar_email', v)}
                            label="📧 Enviar via Email"
                        />
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
