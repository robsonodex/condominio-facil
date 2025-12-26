'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/Toast';
import {
    Mail,
    Server,
    Lock,
    CheckCircle2,
    XCircle,
    AlertTriangle,
    Loader2,
    Eye,
    EyeOff,
    Info,
    Save,
    TestTube,
    Trash2
} from 'lucide-react';

interface SmtpConfig {
    id?: string;
    smtp_host: string;
    smtp_port: number;
    smtp_user: string;
    smtp_from_email: string;
    smtp_from_name: string;
    smtp_secure: boolean;
    is_active: boolean;
}

const SMTP_PRESETS = [
    { name: 'Gmail', host: 'smtp.gmail.com', port: 587, secure: true },
    { name: 'Outlook/Hotmail', host: 'smtp.office365.com', port: 587, secure: true },
    { name: 'Yahoo', host: 'smtp.mail.yahoo.com', port: 587, secure: true },
    { name: 'Hostinger', host: 'smtp.hostinger.com', port: 465, secure: true },
    { name: 'Zoho', host: 'smtp.zoho.com', port: 587, secure: true },
    { name: 'SendGrid', host: 'smtp.sendgrid.net', port: 587, secure: true },
];

export default function EmailConfigPage() {
    const { success, error: showError, info } = useToast();
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
        smtp_from_name: '',
        smtp_secure: true,
        is_active: true
    });

    useEffect(() => {
        loadConfig();
    }, []);

    const loadConfig = async () => {
        try {
            const res = await fetch('/api/configuracoes-smtp');

            if (!res.ok) {
                console.error('Erro HTTP ao carregar config:', res.status);
                // Não mostrar erro, apenas assumir não configurado
                setConfigured(false);
                setLoading(false);
                return;
            }

            const data = await res.json();

            if (data.tableNotFound) {
                console.warn('Tabela SMTP não existe ainda. Execute o script SQL.');
            }

            if (data.configured && data.config) {
                setConfigured(true);
                setFormData({
                    smtp_host: data.config.smtp_host || '',
                    smtp_port: String(data.config.smtp_port) || '587',
                    smtp_user: data.config.smtp_user || '',
                    smtp_password: '',
                    smtp_from_email: data.config.smtp_from_email || '',
                    smtp_from_name: data.config.smtp_from_name || '',
                    smtp_secure: data.config.smtp_secure !== false,
                    is_active: data.config.is_active !== false
                });
            }
        } catch (err) {
            console.error('Erro ao carregar config:', err);
            // Não mostrar toast de erro para não atrapalhar
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
        info('Preset aplicado', `Configurações do ${preset.name} aplicadas`);
    };

    const handleTestConnection = async () => {
        if (!formData.smtp_host || !formData.smtp_port || !formData.smtp_user || !formData.smtp_password) {
            showError('Erro', 'Preencha todos os campos para testar');
            return;
        }

        setTesting(true);
        setTestSuccess(null);

        try {
            const res = await fetch('/api/configuracoes-smtp/test', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
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
                success('Sucesso', 'Conexão SMTP testada com sucesso!');
            } else {
                setTestSuccess(false);
                showError('Falha', data.error || 'Falha no teste de conexão');
            }
        } catch (err) {
            setTestSuccess(false);
            showError('Erro', 'Erro ao testar conexão');
        } finally {
            setTesting(false);
        }
    };

    const handleSave = async () => {
        if (!formData.smtp_host || !formData.smtp_port || !formData.smtp_user || !formData.smtp_from_email) {
            showError('Erro', 'Preencha todos os campos obrigatórios');
            return;
        }

        if (!configured && !formData.smtp_password) {
            showError('Erro', 'A senha SMTP é obrigatória');
            return;
        }

        setSaving(true);

        try {
            const res = await fetch('/api/configuracoes-smtp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            const data = await res.json();

            if (data.success) {
                setConfigured(true);
                setFormData(prev => ({ ...prev, smtp_password: '' }));
                success('Sucesso', data.message);
            } else {
                showError('Erro', data.error || 'Erro ao salvar');
            }
        } catch (err) {
            showError('Erro', 'Erro ao salvar configurações');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm('Tem certeza que deseja remover a configuração SMTP?')) return;

        try {
            const res = await fetch('/api/configuracoes-smtp', { method: 'DELETE' });
            const data = await res.json();

            if (data.success) {
                setConfigured(false);
                setFormData({
                    smtp_host: '',
                    smtp_port: '587',
                    smtp_user: '',
                    smtp_password: '',
                    smtp_from_email: '',
                    smtp_from_name: '',
                    smtp_secure: true,
                    is_active: true
                });
                success('Sucesso', 'Configuração removida');
            } else {
                showError('Erro', data.error);
            }
        } catch (err) {
            showError('Erro', 'Erro ao remover configuração');
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
            </div>
        );
    }

    return (
        <div className="container mx-auto py-6 px-4 max-w-4xl">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-emerald-100 rounded-xl">
                    <Mail className="h-6 w-6 text-emerald-600" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Configuração de E-mail</h1>
                    <p className="text-gray-500">Configure seu servidor SMTP para envio de e-mails</p>
                </div>
                {configured ? (
                    <Badge className="ml-auto bg-emerald-100 text-emerald-700">
                        <CheckCircle2 className="h-3 w-3 mr-1" /> Configurado
                    </Badge>
                ) : (
                    <Badge variant="outline" className="ml-auto border-amber-500 text-amber-600">
                        <AlertTriangle className="h-3 w-3 mr-1" /> Não Configurado
                    </Badge>
                )}
            </div>

            {!configured && (
                <div className="mb-6 p-4 rounded-lg border border-amber-200 bg-amber-50 flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                        <p className="font-medium text-amber-800">Atenção</p>
                        <p className="text-amber-700 text-sm">
                            O servidor SMTP ainda não foi configurado. Os e-mails do sistema (cobranças, avisos, etc.)
                            <strong> não serão enviados</strong> até que você configure um servidor SMTP.
                        </p>
                    </div>
                </div>
            )}

            {/* Presets */}
            <Card className="mb-6">
                <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-gray-600">Configuração Rápida</CardTitle>
                    <CardDescription>Selecione seu provedor de e-mail para preencher automaticamente</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-wrap gap-2">
                        {SMTP_PRESETS.map((preset) => (
                            <Button
                                key={preset.name}
                                variant="outline"
                                size="sm"
                                onClick={() => handlePresetSelect(preset)}
                            >
                                {preset.name}
                            </Button>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Form */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Server className="h-5 w-5 text-gray-500" />
                        Servidor SMTP
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Host e Porta */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="md:col-span-2 space-y-2">
                            <Label htmlFor="smtp_host">Host SMTP *</Label>
                            <Input
                                id="smtp_host"
                                placeholder="smtp.seudominio.com"
                                value={formData.smtp_host}
                                onChange={(e) => setFormData(prev => ({ ...prev, smtp_host: e.target.value }))}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="smtp_port">Porta *</Label>
                            <Input
                                id="smtp_port"
                                type="number"
                                placeholder="587"
                                value={formData.smtp_port}
                                onChange={(e) => setFormData(prev => ({ ...prev, smtp_port: e.target.value }))}
                            />
                        </div>
                    </div>

                    {/* Usuário e Senha */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="smtp_user">Usuário/E-mail *</Label>
                            <Input
                                id="smtp_user"
                                type="email"
                                placeholder="seu@email.com"
                                value={formData.smtp_user}
                                onChange={(e) => setFormData(prev => ({ ...prev, smtp_user: e.target.value }))}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="smtp_password">
                                Senha {configured && '(deixe vazio para manter)'}
                            </Label>
                            <div className="relative">
                                <Input
                                    id="smtp_password"
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder={configured ? '••••••••' : 'Senha do SMTP'}
                                    value={formData.smtp_password}
                                    onChange={(e) => setFormData(prev => ({ ...prev, smtp_password: e.target.value }))}
                                />
                                <button
                                    type="button"
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* From Email e Name */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="smtp_from_email">E-mail de Envio (From) *</Label>
                            <Input
                                id="smtp_from_email"
                                type="email"
                                placeholder="noreply@seudominio.com"
                                value={formData.smtp_from_email}
                                onChange={(e) => setFormData(prev => ({ ...prev, smtp_from_email: e.target.value }))}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="smtp_from_name">Nome de Envio (From Name)</Label>
                            <Input
                                id="smtp_from_name"
                                placeholder="Meu Condomínio"
                                value={formData.smtp_from_name}
                                onChange={(e) => setFormData(prev => ({ ...prev, smtp_from_name: e.target.value }))}
                            />
                        </div>
                    </div>

                    {/* Switches */}
                    <div className="flex flex-wrap gap-6 pt-4 border-t">
                        <div className="flex items-center gap-3">
                            <Switch
                                id="smtp_secure"
                                checked={formData.smtp_secure}
                                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, smtp_secure: checked }))}
                            />
                            <Label htmlFor="smtp_secure" className="flex items-center gap-2">
                                <Lock className="h-4 w-4 text-gray-500" />
                                TLS/SSL
                            </Label>
                        </div>
                        <div className="flex items-center gap-3">
                            <Switch
                                id="is_active"
                                checked={formData.is_active}
                                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                            />
                            <Label htmlFor="is_active">Envio de e-mails ativo</Label>
                        </div>
                    </div>

                    {/* Test Result */}
                    {testSuccess !== null && (
                        <div className={`p-4 rounded-lg border flex items-start gap-3 ${testSuccess
                            ? 'border-emerald-200 bg-emerald-50'
                            : 'border-red-200 bg-red-50'
                            }`}>
                            {testSuccess ? (
                                <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                            ) : (
                                <XCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                            )}
                            <div>
                                <p className={`font-medium ${testSuccess ? 'text-emerald-800' : 'text-red-800'}`}>
                                    {testSuccess ? 'Teste Bem-sucedido!' : 'Falha no Teste'}
                                </p>
                                <p className={`text-sm ${testSuccess ? 'text-emerald-700' : 'text-red-700'}`}>
                                    {testSuccess
                                        ? 'A conexão SMTP foi testada com sucesso. Você pode salvar as configurações.'
                                        : 'Verifique as credenciais e tente novamente.'}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex flex-wrap items-center gap-3 pt-4 border-t">
                        <Button
                            variant="outline"
                            onClick={handleTestConnection}
                            disabled={testing || !formData.smtp_password}
                        >
                            {testing ? (
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                                <TestTube className="h-4 w-4 mr-2" />
                            )}
                            Testar Conexão
                        </Button>

                        <Button
                            onClick={handleSave}
                            disabled={saving}
                            className="bg-emerald-600 hover:bg-emerald-700"
                        >
                            {saving ? (
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                                <Save className="h-4 w-4 mr-2" />
                            )}
                            Salvar Configurações
                        </Button>

                        {configured && (
                            <Button
                                variant="outline"
                                onClick={handleDelete}
                                className="ml-auto text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Remover
                            </Button>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Help */}
            <Card className="mt-6">
                <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <Info className="h-4 w-4 text-blue-500" />
                        Dicas de Configuração
                    </CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-gray-600 space-y-2">
                    <p><strong>Gmail:</strong> Use uma "Senha de App" em vez da senha normal. Ative em Segurança → Verificação em duas etapas → Senhas de app.</p>
                    <p><strong>Outlook:</strong> Use a porta 587 com TLS habilitado.</p>
                    <p><strong>Hostinger:</strong> Use a porta 465 com SSL habilitado.</p>
                    <p><strong>Importante:</strong> Alguns provedores requerem que você habilite o acesso de apps menos seguros ou crie uma senha específica para apps.</p>
                </CardContent>
            </Card>
        </div>
    );
}
