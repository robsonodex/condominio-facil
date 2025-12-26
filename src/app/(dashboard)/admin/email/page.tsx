'use client';

import * as React from 'react';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, Button, Input } from '@/components/ui';
import { Mail, Server, Lock, CheckCircle2, AlertTriangle, Loader2, Eye, EyeOff, Save, TestTube, Trash2, Info, Shield } from 'lucide-react';

const SMTP_PRESETS = [
    { name: 'Gmail', host: 'smtp.gmail.com', port: 587, secure: true },
    { name: 'Outlook', host: 'smtp.office365.com', port: 587, secure: true },
    { name: 'Hostinger', host: 'smtp.hostinger.com', port: 465, secure: true },
    { name: 'Zoho', host: 'smtp.zoho.com', port: 587, secure: true },
];

export default function AdminEmailConfigPage() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [testing, setTesting] = useState(false);
    const [configured, setConfigured] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [testSuccess, setTestSuccess] = useState<boolean | null>(null);

    const [formData, setFormData] = useState({
        smtp_host: '',
        smtp_port: '587',
        smtp_user: '',
        smtp_password: '',
        smtp_from_email: '',
        smtp_from_name: 'Meu Condomínio Fácil',
        smtp_secure: true,
        is_active: true
    });

    useEffect(() => {
        loadConfig();
    }, []);

    const loadConfig = async () => {
        try {
            const res = await fetch('/api/admin/smtp-global');
            if (res.ok) {
                const data = await res.json();
                if (data.configured && data.config) {
                    setConfigured(true);
                    setFormData({
                        smtp_host: data.config.smtp_host || '',
                        smtp_port: String(data.config.smtp_port) || '587',
                        smtp_user: data.config.smtp_user || '',
                        smtp_password: '',
                        smtp_from_email: data.config.smtp_from_email || '',
                        smtp_from_name: data.config.smtp_from_name || 'Meu Condomínio Fácil',
                        smtp_secure: data.config.smtp_secure !== false,
                        is_active: data.config.is_active !== false
                    });
                }
            }
        } catch (err) {
            console.error('Erro ao carregar config:', err);
        } finally {
            setLoading(false);
        }
    };

    const handlePresetSelect = (preset: typeof SMTP_PRESETS[0]) => {
        setFormData(prev => ({
            ...prev,
            smtp_host: preset.host,
            smtp_port: String(preset.port),
            smtp_secure: preset.secure
        }));
    };

    const handleTestConnection = async () => {
        if (!formData.smtp_host || !formData.smtp_port || !formData.smtp_user || !formData.smtp_password) {
            alert('Preencha todos os campos para testar');
            return;
        }
        setTesting(true);
        setTestSuccess(null);
        try {
            const res = await fetch('/api/admin/smtp-global/test', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    smtp_host: formData.smtp_host,
                    smtp_port: formData.smtp_port,
                    smtp_user: formData.smtp_user,
                    smtp_password: formData.smtp_password,
                    smtp_secure: formData.smtp_secure
                })
            });
            const data = await res.json();
            if (data.success) {
                setTestSuccess(true);
                alert('Conexão SMTP testada com sucesso!');
            } else {
                setTestSuccess(false);
                const errorMsg = data.error || 'Erro desconhecido';
                const details = data.details ? `\nDetalhes: ${data.details}` : '';
                const code = data.code ? `\nCódigo: ${data.code}` : '';
                alert(`Falha: ${errorMsg}${details}${code}`);
            }
        } catch {
            setTestSuccess(false);
            alert('Erro ao testar conexão');
        } finally {
            setTesting(false);
        }
    };

    const handleSave = async () => {
        if (!formData.smtp_host || !formData.smtp_port || !formData.smtp_user || !formData.smtp_from_email) {
            alert('Preencha todos os campos obrigatórios');
            return;
        }
        if (!configured && !formData.smtp_password) {
            alert('A senha SMTP é obrigatória');
            return;
        }
        setSaving(true);
        try {
            const res = await fetch('/api/admin/smtp-global', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            const data = await res.json();
            if (data.success) {
                setConfigured(true);
                // NÃO limpar a senha do campo - manter para próximos testes
                alert('Configurações salvas com sucesso!');
            } else {
                alert('Erro: ' + (data.error || 'Erro ao salvar'));
            }
        } catch {
            alert('Erro ao salvar configurações');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm('Tem certeza que deseja remover a configuração SMTP global?')) return;
        try {
            const res = await fetch('/api/admin/smtp-global', { method: 'DELETE' });
            const data = await res.json();
            if (data.success) {
                setConfigured(false);
                setFormData({
                    smtp_host: '', smtp_port: '587', smtp_user: '', smtp_password: '',
                    smtp_from_email: '', smtp_from_name: 'Meu Condomínio Fácil', smtp_secure: true, is_active: true
                });
                alert('Configuração removida com sucesso!');
            } else {
                alert('Erro: ' + data.error);
            }
        } catch {
            alert('Erro ao remover configuração');
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
            </div>
        );
    }

    return (
        <div className="container mx-auto py-6 px-4 max-w-4xl">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-purple-100 rounded-xl">
                    <Shield className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Configuração de E-mail Global</h1>
                    <p className="text-gray-500">SMTP para e-mails do sistema (onboarding, alertas administrativos)</p>
                </div>
                {configured ? (
                    <span className="ml-auto px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" /> Configurado
                    </span>
                ) : (
                    <span className="ml-auto px-3 py-1 border border-amber-500 text-amber-600 rounded-full text-sm font-medium flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" /> Não Configurado
                    </span>
                )}
            </div>

            <Card className="mb-6 border-purple-200">
                <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-gray-600">Configuração Rápida</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-wrap gap-2">
                        {SMTP_PRESETS.map((preset) => (
                            <Button key={preset.name} variant="outline" onClick={() => handlePresetSelect(preset)}>
                                {preset.name}
                            </Button>
                        ))}
                    </div>
                </CardContent>
            </Card>

            <Card className="border-purple-200">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <Server className="h-5 w-5 text-gray-500" />
                        Servidor SMTP Global
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="md:col-span-2 space-y-2">
                            <label className="block text-sm font-medium text-gray-700">Host SMTP *</label>
                            <Input placeholder="smtp.seudominio.com" value={formData.smtp_host} onChange={(e) => setFormData(prev => ({ ...prev, smtp_host: e.target.value }))} />
                        </div>
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700">Porta *</label>
                            <Input type="number" placeholder="587" value={formData.smtp_port} onChange={(e) => setFormData(prev => ({ ...prev, smtp_port: e.target.value }))} />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700">Usuário/E-mail *</label>
                            <Input type="email" placeholder="seu@email.com" value={formData.smtp_user} onChange={(e) => setFormData(prev => ({ ...prev, smtp_user: e.target.value }))} />
                        </div>
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700">Senha {configured && '(vazio para manter)'}</label>
                            <div className="relative">
                                <Input type={showPassword ? 'text' : 'password'} placeholder={configured ? '••••••••' : 'Senha'} value={formData.smtp_password} onChange={(e) => setFormData(prev => ({ ...prev, smtp_password: e.target.value }))} />
                                <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" onClick={() => setShowPassword(!showPassword)}>
                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700">E-mail de Envio (From) *</label>
                            <Input type="email" placeholder="noreply@meucondominiofacil.com" value={formData.smtp_from_email} onChange={(e) => setFormData(prev => ({ ...prev, smtp_from_email: e.target.value }))} />
                        </div>
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700">Nome de Envio</label>
                            <Input placeholder="Meu Condomínio Fácil" value={formData.smtp_from_name} onChange={(e) => setFormData(prev => ({ ...prev, smtp_from_name: e.target.value }))} />
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-6 pt-4 border-t">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" checked={formData.smtp_secure} onChange={(e) => setFormData(prev => ({ ...prev, smtp_secure: e.target.checked }))} className="w-4 h-4 text-purple-600 rounded border-gray-300" />
                            <Lock className="h-4 w-4 text-gray-500" />
                            <span className="text-sm font-medium text-gray-700">TLS/SSL</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" checked={formData.is_active} onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))} className="w-4 h-4 text-purple-600 rounded border-gray-300" />
                            <span className="text-sm font-medium text-gray-700">Envio ativo</span>
                        </label>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 pt-4 border-t">
                        <Button variant="outline" onClick={handleTestConnection} disabled={testing || (!formData.smtp_password && !configured)}>
                            {testing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <TestTube className="h-4 w-4 mr-2" />}
                            Testar Conexão
                        </Button>
                        <Button onClick={handleSave} disabled={saving} className="bg-purple-600 hover:bg-purple-700 text-white">
                            {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                            Salvar
                        </Button>
                        {configured && (
                            <Button variant="ghost" onClick={handleDelete} className="ml-auto text-red-600 hover:text-red-700">
                                <Trash2 className="h-4 w-4 mr-2" />
                                Remover
                            </Button>
                        )}
                    </div>
                </CardContent>
            </Card>

            <Card className="mt-6 border-purple-200">
                <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <Info className="h-4 w-4 text-blue-500" />
                        Sobre o SMTP Global
                    </CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-gray-600 space-y-2">
                    <p>Este SMTP será usado para e-mails do <strong>sistema</strong>:</p>
                    <ul className="list-disc list-inside space-y-1 ml-2">
                        <li>E-mails de onboarding (novos cadastros)</li>
                        <li>Alertas administrativos</li>
                        <li>Recuperação de senha (quando condomínio não tem SMTP próprio)</li>
                        <li>Notificações de assinatura</li>
                    </ul>
                    <p className="text-amber-600 mt-3">⚠️ Cada condomínio pode configurar seu próprio SMTP em Configurações → E-mail.</p>
                </CardContent>
            </Card>
        </div>
    );
}
