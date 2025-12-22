'use client';

import { useState, useEffect } from 'react';
import { Bot, Save, Loader2, CheckCircle, AlertCircle, Settings, MessageSquare, FileText } from 'lucide-react';
import Link from 'next/link';

interface AgentData {
    nome_agente: string;
    tom_resposta: 'formal' | 'direto' | 'amigavel';
    instrucoes_personalizadas: string;
    ativo: boolean;
}

interface SettingsData {
    limite_mensagens_mes: number;
    mensagens_usadas_mes: number;
    mes_referencia: string;
}

export default function ConfiguracaoAssistentePage() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [hasAgent, setHasAgent] = useState(false);
    const [showUpgradeModal, setShowUpgradeModal] = useState(false);

    const [formData, setFormData] = useState<AgentData>({
        nome_agente: 'Assistente do Condomínio',
        tom_resposta: 'formal',
        instrucoes_personalizadas: '',
        ativo: false // Inicia sempre desativado
    });

    const [settings, setSettings] = useState<SettingsData | null>(null);

    useEffect(() => {
        fetchAgent();
    }, []);

    const fetchAgent = async () => {
        try {
            const res = await fetch('/api/ai/agent');
            const data = await res.json();

            if (data.agent) {
                setFormData({
                    nome_agente: data.agent.nome_agente || 'Assistente do Condomínio',
                    tom_resposta: data.agent.tom_resposta || 'formal',
                    instrucoes_personalizadas: data.agent.instrucoes_personalizadas || '',
                    ativo: data.agent.ativo !== false
                });
                setHasAgent(true);
            }

            if (data.settings) {
                setSettings(data.settings);
            }
        } catch {
            console.error('Erro ao carregar agente');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        setError(null);
        setSuccess(false);

        try {
            const res = await fetch('/api/ai/agent', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error || 'Erro ao salvar');
                return;
            }

            setSuccess(true);
            setHasAgent(true);
            setTimeout(() => setSuccess(false), 3000);
        } catch {
            setError('Erro de conexão');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Configuração do Assistente IA</h1>
                    <p className="text-gray-500 mt-1">
                        Configure o assistente virtual exclusivo do seu condomínio
                    </p>
                </div>
                <Link
                    href="/assistente"
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                >
                    <MessageSquare className="h-4 w-4" />
                    Testar Chat
                </Link>
            </div>

            {/* Quick Stats */}
            {settings && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white rounded-xl border p-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                                <MessageSquare className="h-5 w-5 text-emerald-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Mensagens este mês</p>
                                <p className="text-xl font-bold text-gray-900">
                                    {settings.mensagens_usadas_mes || 0}
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-xl border p-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                <Settings className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Limite mensal</p>
                                <p className="text-xl font-bold text-gray-900">
                                    {settings.limite_mensagens_mes || 500}
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-xl border p-4">
                        <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${formData.ativo ? 'bg-green-100' : 'bg-gray-100'}`}>
                                <Bot className={`h-5 w-5 ${formData.ativo ? 'text-green-600' : 'text-gray-400'}`} />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Status</p>
                                <p className={`text-xl font-bold ${formData.ativo ? 'text-green-600' : 'text-gray-500'}`}>
                                    {formData.ativo ? 'Ativo' : 'Inativo'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Form */}
            <div className="bg-white rounded-xl shadow-sm border p-6 space-y-6">
                <div className="flex items-center gap-3 pb-4 border-b">
                    <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-xl flex items-center justify-center">
                        <Bot className="h-7 w-7 text-white" />
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900">Personalização</h2>
                        <p className="text-sm text-gray-500">Defina como o assistente se apresenta e responde</p>
                    </div>
                </div>

                {/* Nome do Agente */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nome do Assistente
                    </label>
                    <input
                        type="text"
                        value={formData.nome_agente}
                        onChange={(e) => setFormData(prev => ({ ...prev, nome_agente: e.target.value }))}
                        placeholder="Ex: Assistente do Condomínio Solar"
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    <p className="text-xs text-gray-400 mt-1">Como o assistente se apresenta aos usuários</p>
                </div>

                {/* Tom de Resposta */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tom de Resposta
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {[
                            { value: 'formal', label: 'Formal', desc: 'Linguagem profissional e cortês' },
                            { value: 'direto', label: 'Direto', desc: 'Respostas objetivas e curtas' },
                            { value: 'amigavel', label: 'Amigável', desc: 'Tom descontraído e acessível' }
                        ].map((tom) => (
                            <button
                                key={tom.value}
                                type="button"
                                onClick={() => setFormData(prev => ({ ...prev, tom_resposta: tom.value as AgentData['tom_resposta'] }))}
                                className={`p-4 border rounded-lg text-left transition-all ${formData.tom_resposta === tom.value
                                    ? 'border-emerald-500 bg-emerald-50 ring-2 ring-emerald-500'
                                    : 'border-gray-200 hover:border-gray-300'
                                    }`}
                            >
                                <p className="font-medium text-gray-900">{tom.label}</p>
                                <p className="text-xs text-gray-500 mt-1">{tom.desc}</p>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Instruções Personalizadas */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Instruções Personalizadas (Opcional)
                    </label>
                    <textarea
                        value={formData.instrucoes_personalizadas}
                        onChange={(e) => setFormData(prev => ({ ...prev, instrucoes_personalizadas: e.target.value }))}
                        placeholder="Ex: Sempre mencione que animais devem ser conduzidos em coleira. Lembre os moradores sobre a regra do silêncio após 22h."
                        rows={4}
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                    />
                    <p className="text-xs text-gray-400 mt-1">Instruções extras que o assistente deve seguir</p>
                </div>

                {/* Status */}
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                        <p className="font-medium text-gray-900">Status do Assistente</p>
                        <p className="text-sm text-gray-500">
                            {hasAgent ? 'Quando desativado, ninguém consegue usar o chat' : 'Contrate o plano com IA para ativar'}
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={() => {
                            if (!hasAgent) {
                                setShowUpgradeModal(true);
                            } else {
                                setFormData(prev => ({ ...prev, ativo: !prev.ativo }));
                            }
                        }}
                        className={`relative w-14 h-7 rounded-full transition-colors ${hasAgent && formData.ativo ? 'bg-emerald-600' : 'bg-gray-300'
                            } ${!hasAgent ? 'cursor-not-allowed opacity-60' : ''}`}
                    >
                        <span
                            className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-transform ${hasAgent && formData.ativo ? 'right-1' : 'left-1'
                                }`}
                        />
                        {!hasAgent && (
                            <span className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 rounded-full flex items-center justify-center text-[10px] text-white font-bold">🔒</span>
                        )}
                    </button>
                </div>

                {/* Messages */}
                {error && (
                    <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-lg">
                        <AlertCircle className="h-5 w-5" />
                        <p className="text-sm">{error}</p>
                    </div>
                )}

                {success && (
                    <div className="flex items-center gap-2 p-3 bg-green-50 text-green-700 rounded-lg">
                        <CheckCircle className="h-5 w-5" />
                        <p className="text-sm">Configurações salvas com sucesso!</p>
                    </div>
                )}

                {/* Actions */}
                <div className="flex items-center justify-between pt-4 border-t">
                    <Link
                        href="/configuracoes/assistente/documentos"
                        className="flex items-center gap-2 text-emerald-600 hover:text-emerald-700"
                    >
                        <FileText className="h-4 w-4" />
                        Gerenciar Base de Conhecimento
                    </Link>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                    >
                        {saving ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Save className="h-4 w-4" />
                        )}
                        {hasAgent ? 'Salvar Alterações' : 'Criar Assistente'}
                    </button>
                </div>
            </div>

            {/* Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <h3 className="font-medium text-blue-800 mb-2">💡 Dica</h3>
                <p className="text-sm text-blue-700">
                    O assistente responde <strong>apenas</strong> com base nos documentos que você adicionar na base de conhecimento.
                    Quanto mais documentos você adicionar (regimento, convenção, atas), mais útil ele será.
                </p>
            </div>

            {/* Modal de Upgrade */}
            {showUpgradeModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4">
                        <div className="text-center">
                            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-700 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                <Bot className="h-8 w-8 text-white" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900">Assistente IA Premium</h3>
                            <p className="text-gray-500 mt-2">
                                O Assistente com IA é um recurso exclusivo do plano Premium
                            </p>
                        </div>

                        <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                            <p className="text-sm font-medium text-gray-700">Com o Assistente IA você tem:</p>
                            <ul className="text-sm text-gray-600 space-y-1">
                                <li>✅ Atendimento 24h aos moradores</li>
                                <li>✅ Respostas baseadas no regimento</li>
                                <li>✅ Redução de ligações na portaria</li>
                                <li>✅ Personalização completa</li>
                            </ul>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowUpgradeModal(false)}
                                className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50"
                            >
                                Agora não
                            </button>
                            <Link
                                href="/upgrade"
                                className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg text-center hover:bg-emerald-700"
                            >
                                Ver Planos
                            </Link>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
