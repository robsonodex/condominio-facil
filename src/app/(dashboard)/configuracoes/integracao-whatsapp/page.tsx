'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, Button, Input, Textarea, Badge } from '@/components/ui';
import { useUser, useCondo } from '@/hooks/useUser';
import { useAuth } from '@/hooks/useAuth';
import {
    MessageCircle, CheckCircle, AlertTriangle, FileText,
    Server, Send, Shield, DollarSign, Zap, Activity, Clock,
    Smartphone, Info, ExternalLink, ChevronDown, ChevronUp, Phone,
    RefreshCw, QrCode, Power, Settings, Lock
} from 'lucide-react';

const OPERADORAS = [
    { value: '', label: 'Selecione a operadora...' },
    { value: 'vivo', label: '📱 Vivo' },
    { value: 'claro', label: '📱 Claro' },
    { value: 'tim', label: '📱 TIM' },
    { value: 'oi', label: '📱 Oi' },
    { value: 'outra', label: '📋 Outra' },
];

const STATUS_CHIP = [
    { value: '', label: 'Selecione...' },
    { value: 'novo', label: '🆕 Chip novo, nunca usado no WhatsApp' },
    { value: 'desvinculado', label: '🔄 Já foi usado, mas desvinculei há +7 dias' },
    { value: 'em_uso', label: '⚠️ Está em uso no WhatsApp atualmente' },
    { value: 'nao_tenho', label: '❌ Ainda não tenho o chip' },
];

const HORARIOS_DISPONIVEIS = [
    { value: '', label: 'Selecione...' },
    { value: 'manha', label: '🌅 Manhã (9h - 12h)' },
    { value: 'tarde', label: '☀️ Tarde (14h - 18h)' },
    { value: 'noite', label: '🌙 Noite (19h - 21h)' },
    { value: 'qualquer', label: '📅 Qualquer horário' },
];

export default function IntegracaoWhatsappPage() {
    const { condoId, isSindico, profile, loading: userLoading } = useUser();
    const { condo, loading: condoLoading } = useCondo();
    const { session } = useAuth();

    // UI State
    const [view, setView] = useState<'status' | 'setup_zapi' | 'request_server'>('status');
    const [loading, setLoading] = useState(false);
    const [checkingStatus, setCheckingStatus] = useState(false);

    // Z-API State
    const [zapiStatus, setZapiStatus] = useState<{ connected: boolean; state?: string } | null>(null);
    const [qrcode, setQrcode] = useState<string | null>(null);
    const [instanceId, setInstanceId] = useState('');
    const [token, setToken] = useState('');
    const [clientToken, setClientToken] = useState('');

    // Request Server State
    const [enviado, setEnviado] = useState(false);
    const [aceitouTermos, setAceitouTermos] = useState(false);
    const [mostrarTermosCompletos, setMostrarTermosCompletos] = useState(false);
    const [mostrarFAQ, setMostrarFAQ] = useState(false);
    const [nomeSindico, setNomeSindico] = useState('');
    const [emailContato, setEmailContato] = useState('');
    const [telefoneContato, setTelefoneContato] = useState('');
    const [numeroChip, setNumeroChip] = useState('');
    const [operadora, setOperadora] = useState('');
    const [outraOperadora, setOutraOperadora] = useState('');
    const [statusChip, setStatusChip] = useState('');
    const [nomePerfilWhatsapp, setNomePerfilWhatsapp] = useState('');
    const [horarioDisponivel, setHorarioDisponivel] = useState('');
    const [diasPreferidos, setDiasPreferidos] = useState<string[]>([]);
    const [confirmouChipExclusivo, setConfirmouChipExclusivo] = useState(false);
    const [confirmouRiscoBan, setConfirmouRiscoBan] = useState(false);
    const [confirmouDisponibilidade, setConfirmouDisponibilidade] = useState(false);
    const [observacoes, setObservacoes] = useState('');

    // Sincronizar dados do perfil quando carregarem
    useEffect(() => {
        if (profile) {
            setNomeSindico(profile.nome || '');
            setEmailContato(profile.email || '');
        }
    }, [profile]);

    useEffect(() => {
        if (condo) {
            setNomePerfilWhatsapp(condo.nome || '');
        }
    }, [condo]);

    // 🔒 Plan Qualification Check
    const planName = condo?.plan?.nome_plano?.toLowerCase() || '';
    const isPlanQualified = planName.includes('avançado') || planName.includes('avancado') || planName.includes('premium') || planName.includes('demo');

    // 🔄 Buscar status da conexão
    const checkZapiStatus = async () => {
        if (!condoId) return;
        setCheckingStatus(true);
        try {
            const res = await fetch(`/api/whatsapp/zapi?action=status&condoId=${condoId}`);
            if (res.ok) {
                const data = await res.json();
                setZapiStatus(data);
                if (data.connected) setView('status');
            }
        } catch (e) {
            console.error('Erro ao buscar status:', e);
        } finally {
            setCheckingStatus(false);
        }
    };

    // 📷 Gerar QR Code
    const generateQR = async () => {
        if (!condoId) return;
        setLoading(true);
        try {
            const res = await fetch(`/api/whatsapp/zapi?action=qrcode&condoId=${condoId}`);
            const data = await res.json();
            if (data.qrcode) {
                setQrcode(data.qrcode);
            } else {
                alert(data.error || 'Erro ao gerar QR Code');
            }
        } catch (e) {
            alert('Falha na comunicação com o servidor');
        } finally {
            setLoading(false);
        }
    };

    // 💾 Salvar credenciais Z-API
    const saveZapi = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await fetch('/api/whatsapp/zapi', {
                method: 'POST',
                body: JSON.stringify({ condoId, instance_id: instanceId, token, client_token: clientToken })
            });
            if (res.ok) {
                alert('Configurações salvas! Clique em "Gerar QR Code" para conectar.');
                checkZapiStatus();
            } else {
                alert('Erro ao salvar configurações');
            }
        } catch (e) {
            alert('Erro de conexão');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (condoId) checkZapiStatus();
    }, [condoId]);

    const toggleDia = (dia: string) => {
        setDiasPreferidos(prev => prev.includes(dia) ? prev.filter(d => d !== dia) : [...prev, dia]);
    };

    const handleSubmitServer = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!aceitouTermos || !confirmouChipExclusivo || !confirmouRiscoBan || !confirmouDisponibilidade) {
            alert('Você precisa aceitar todos os termos e confirmações');
            return;
        }
        setLoading(true);
        try {
            const operadoraNome = operadora === 'outra' ? outraOperadora : OPERADORAS.find(o => o.value === operadora)?.label;
            const statusChipTexto = STATUS_CHIP.find(s => s.value === statusChip)?.label;
            const horarioTexto = HORARIOS_DISPONIVEIS.find(h => h.value === horarioDisponivel)?.label;

            const response = await fetch('/api/support-chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session?.access_token}`,
                },
                body: JSON.stringify({
                    action: 'create_chat',
                    assunto: '📱 Solicitação de Integração WhatsApp Premium',
                    mensagem: `
📋 **SOLICITAÇÃO DE SERVIDOR WHATSAPP DEDICADO**
--------------------------------------------------
**PROPRIETÁRIO/SÍNDICO:** ${profile?.nome || 'Não informado'}
**CONDOMÍNIO:** ${condo?.nome || 'Não informado'}
**ID CONDO:** ${condoId}

**DADOS DE CONTATO:**
- Email: ${emailContato}
- Telefone: ${telefoneContato}

**INFORMAÇÕES DO CHIP:**
- Número Sugerido: ${numeroChip}
- Operadora: ${operadoraNome}
- Status do Chip: ${statusChipTexto}
- Nome no Perfil: ${nomePerfilWhatsapp}

**AGENDA PARA INSTALAÇÃO:**
- Horário: ${horarioTexto}
- Dias: ${diasPreferidos.join(', ')}

**OBSERVAÇÕES:**
${observacoes || 'Nenhuma'}

**DECLARAÇÕES E ACEITES:**
- [x] Aceita termos de uso e responsabilidade
- [x] Confirma chip exclusivo para este fim
- [x] Ciente do risco de banimento por spam
- [x] Confirma disponibilidade para pareamento
- [x] Ciente da taxa de implantação de R$ 199,90
- [x] Ciente da mensalidade de R$ 149,90
--------------------------------------------------
`.trim(),
                }),
            });

            if (response.ok) setEnviado(true);
            else throw new Error('Erro ao enviar solicitação');
        } catch (error) {
            alert('Erro ao enviar solicitação. Tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    if (userLoading || condoLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
                <RefreshCw className="h-10 w-10 text-indigo-600 animate-spin" />
                <p className="text-gray-500 animate-pulse">Carregando configurações...</p>
            </div>
        );
    }

    if (!isSindico) {
        return <div className="text-center py-12"><p className="text-gray-500">Acesso restrito a síndicos</p></div>;
    }

    const PlanBlock = () => (
        <Card className="bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-200">
            <CardContent className="p-8 text-center">
                <div className="bg-white p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4 shadow-sm">
                    <Lock className="h-8 w-8 text-indigo-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Recurso Exclusivo</h3>
                <p className="text-gray-600 mb-6 max-w-md mx-auto">
                    A integração autônoma via Z-API e conexão direta por QR Code estão disponíveis apenas nos planos <b>Avançado</b> e <b>Premium</b>.
                </p>
                <div className="flex flex-col sm:flex-row justify-center gap-3">
                    <Button
                        variant="default"
                        className="bg-indigo-600 hover:bg-indigo-700 shadow-md"
                        onClick={() => window.location.href = '/assinatura'}
                    >
                        <Zap className="h-4 w-4 mr-2" />
                        Fazer Upgrade Agora
                    </Button>
                    <Button
                        variant="outline"
                        className="bg-white border-indigo-200 hover:bg-indigo-50 text-indigo-700"
                        onClick={() => setView('request_server')}
                    >
                        <Server className="h-4 w-4 mr-2" />
                        Solicitar Servidor Dedicado
                    </Button>
                </div>
            </CardContent>
        </Card>
    );

    return (
        <div className="space-y-6 max-w-4xl mx-auto pb-12">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <MessageCircle className="h-6 w-6 text-emerald-500" />
                        Comunicação WhatsApp
                    </h1>
                    <p className="text-gray-500">Gerencie a conexão e automações do seu condomínio</p>
                </div>

                <div className="flex gap-2">
                    <Button
                        variant={view === 'status' ? 'default' : 'outline'}
                        onClick={() => setView('status')}
                        size="sm"
                    >
                        Painel de Conexão
                    </Button>
                    <Button
                        variant={view === 'setup_zapi' ? 'default' : 'outline'}
                        onClick={() => setView('setup_zapi')}
                        disabled={condoLoading}
                        size="sm"
                        className={`${condoLoading ? 'bg-gray-200' : (isPlanQualified ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-gray-400 opacity-70')} text-white border-0 transition-colors`}
                    >
                        {condoLoading ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <Settings className="h-4 w-4 mr-2" />}
                        Configurar Z-API
                        {!condoLoading && !isPlanQualified && <Lock className="h-3 w-3 ml-2" />}
                    </Button>
                </div>
            </div>

            {/* --- VIEW: PAINEL DE STATUS --- */}
            {view === 'status' && (
                <div className="space-y-6">
                    <Card className={`border-2 ${zapiStatus?.connected ? 'border-emerald-100' : 'border-amber-100'}`}>
                        <CardContent className="p-8 text-center flex flex-col items-center">
                            {checkingStatus ? (
                                <RefreshCw className="h-12 w-12 text-blue-500 animate-spin mb-4" />
                            ) : zapiStatus?.connected ? (
                                <>
                                    <div className="bg-emerald-100 p-4 rounded-full mb-4">
                                        <CheckCircle className="h-12 w-12 text-emerald-600" />
                                    </div>
                                    <h2 className="text-2xl font-bold text-emerald-800 mb-1">WhatsApp Conectado</h2>
                                    <p className="text-emerald-600 mb-6">Seu condomínio está enviando notificações automaticamente.</p>
                                    <div className="flex gap-3">
                                        <Button variant="outline" onClick={checkZapiStatus} disabled={checkingStatus}>
                                            <RefreshCw className={`h-4 w-4 mr-2 ${checkingStatus ? 'animate-spin' : ''}`} />
                                            Atualizar Status
                                        </Button>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="bg-amber-100 p-4 rounded-full mb-4">
                                        <Power className="h-12 w-12 text-amber-600" />
                                    </div>
                                    <h2 className="text-2xl font-bold text-amber-800 mb-1">WhatsApp Desconectado</h2>
                                    <p className="text-amber-600 mb-6">Escaneie o QR Code para ativar as automações.</p>

                                    {qrcode ? (
                                        <div className="bg-white p-6 rounded-xl border shadow-sm mb-6">
                                            <img src={qrcode} alt="QR Code WhatsApp" className="mx-auto w-64 h-64" />
                                            <p className="text-xs text-gray-400 mt-4">Aponte a câmera do WhatsApp para o código acima</p>
                                        </div>
                                    ) : condoLoading ? (
                                        <div className="h-12 w-32 bg-gray-100 animate-pulse rounded-md" />
                                    ) : !isPlanQualified ? (
                                        <PlanBlock />
                                    ) : (
                                        <Button onClick={generateQR} loading={loading} className="bg-emerald-600 hover:bg-emerald-700 h-12 px-8">
                                            <QrCode className="h-4 w-4 mr-2" />
                                            Conectar via QR Code
                                        </Button>
                                    )}

                                    <div className="mt-6 flex flex-wrap justify-center gap-4">
                                        <Badge variant="outline" className="px-3 py-1 flex gap-2 items-center">
                                            <Clock className="h-3 w-3" /> QR Code expira em 30 seg
                                        </Badge>
                                        <Badge variant="outline" className="px-3 py-1 flex gap-2 items-center">
                                            <Smartphone className="h-3 w-3" /> Use WhatsApp → Dispositivos Conectados
                                        </Badge>
                                    </div>
                                </>
                            )}
                        </CardContent>
                    </Card>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Card className="hover:border-blue-200 transition-colors cursor-pointer" onClick={() => setView('request_server')}>
                            <CardContent className="p-6 flex items-start gap-4">
                                <div className="bg-blue-100 p-3 rounded-lg text-blue-600">
                                    <Server className="h-6 w-6" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900">Servidor Premium (VPS)</h3>
                                    <p className="text-sm text-gray-500">Número dedicado com alta estabilidade e sem risco de expiração.</p>
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="hover:border-purple-200 transition-colors cursor-pointer">
                            <CardContent className="p-6 flex items-start gap-4">
                                <div className="bg-purple-100 p-3 rounded-lg text-purple-600">
                                    <Activity className="h-6 w-6" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900">Histórico de Envios</h3>
                                    <p className="text-sm text-gray-500">Veja todos os avisos e boletos enviados pelo sistema.</p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            )}

            {/* --- VIEW: CONFIGURAÇÃO Z-API --- */}
            {view === 'setup_zapi' && (
                <div className="space-y-6">
                    {condoLoading ? (
                        <div className="space-y-4">
                            <div className="h-40 bg-gray-100 animate-pulse rounded-lg" />
                        </div>
                    ) : !isPlanQualified ? (
                        <PlanBlock />
                    ) : (
                        <Card>
                            <CardContent className="p-6">
                                <div className="flex items-center gap-2 mb-6 text-indigo-700">
                                    <Settings className="h-6 w-6" />
                                    <h3 className="text-xl font-bold">Configuração da Instância (Z-API)</h3>
                                </div>

                                <form onSubmit={saveZapi} className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <Input
                                            label="ID da Instância *"
                                            value={instanceId}
                                            onChange={e => setInstanceId(e.target.value)}
                                            placeholder="Ex: 3B..."
                                            required
                                        />
                                        <Input
                                            label="Token da Instância *"
                                            value={token}
                                            onChange={e => setToken(e.target.value)}
                                            placeholder="Ex: 87AB..."
                                            required
                                        />
                                        <div className="md:col-span-2">
                                            <Input
                                                label="Client Token (Opcional)"
                                                value={clientToken}
                                                onChange={e => setClientToken(e.target.value)}
                                                placeholder="Geralmente começa com F..."
                                            />
                                        </div>
                                    </div>
                                    <div className="flex justify-end gap-3 mt-6">
                                        <Button variant="outline" onClick={() => setView('status')}>Cancelar</Button>
                                        <Button type="submit" loading={loading} className="bg-indigo-600 hover:bg-indigo-700">Salvar Credenciais</Button>
                                    </div>
                                </form>

                                <div className="mt-8 p-4 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                                    <h4 className="font-bold text-gray-700 mb-2 flex items-center gap-2 text-sm">
                                        <Info className="h-4 w-4" /> Onde encontro esses dados?
                                    </h4>
                                    <ol className="text-sm text-gray-600 space-y-2 ml-4 list-decimal">
                                        <li>Acesse sua conta no painel da <a href="https://z-api.io" target="_blank" className="text-indigo-600 underline">Z-API</a></li>
                                        <li>Crie uma instância (instance) para o condomínio</li>
                                        <li>Copie o "Instance ID" e o "Token" e cole nos campos acima</li>
                                    </ol>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            )}

            {/* --- VIEW: SOLICITAÇÃO SERVIDOR DEDICADO --- */}
            {view === 'request_server' && (
                <div className="space-y-6">
                    <div className="flex items-center gap-2 mb-2">
                        <Button variant="ghost" size="sm" onClick={() => setView('status')}>← Voltar ao painel</Button>
                    </div>

                    {!enviado ? (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <div className="lg:col-span-2 space-y-6">
                                <Card>
                                    <CardContent className="p-6">
                                        <div className="flex items-center gap-2 mb-6 text-blue-700">
                                            <Server className="h-6 w-6" />
                                            <h3 className="text-xl font-bold">Solicitar Servidor Dedicado</h3>
                                        </div>

                                        <form onSubmit={handleSubmitServer} className="space-y-4">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <Input label="Seu Nome (Síndico)" value={nomeSindico} onChange={e => setNomeSindico(e.target.value)} required />
                                                <Input label="E-mail de Contato" type="email" value={emailContato} onChange={e => setEmailContato(e.target.value)} required />
                                                <Input label="Telefone/WhatsApp" value={telefoneContato} onChange={e => setTelefoneContato(e.target.value)} placeholder="(00) 00000-0000" required />
                                                <Input label="Número para o Chip" value={numeroChip} onChange={e => setNumeroChip(e.target.value)} placeholder="(00) 00000-0000" required />

                                                <div className="space-y-2">
                                                    <label className="text-sm font-medium">Operadora do Chip</label>
                                                    <select
                                                        className="w-full h-10 px-3 rounded-md border border-gray-200 bg-white text-sm"
                                                        value={operadora}
                                                        onChange={e => setOperadora(e.target.value)}
                                                        required
                                                    >
                                                        {OPERADORAS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                                                    </select>
                                                </div>

                                                {operadora === 'outra' && (
                                                    <Input label="Qual operadora?" value={outraOperadora} onChange={e => setOutraOperadora(e.target.value)} required />
                                                )}

                                                <div className="space-y-2">
                                                    <label className="text-sm font-medium">Status do Chip</label>
                                                    <select
                                                        className="w-full h-10 px-3 rounded-md border border-gray-200 bg-white text-sm"
                                                        value={statusChip}
                                                        onChange={e => setStatusChip(e.target.value)}
                                                        required
                                                    >
                                                        {STATUS_CHIP.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                                                    </select>
                                                </div>

                                                <Input label="Nome no Perfil WhatsApp" value={nomePerfilWhatsapp} onChange={e => setNomePerfilWhatsapp(e.target.value)} placeholder="Ex: Condomínio Villa Flora" required />

                                                <div className="space-y-2">
                                                    <label className="text-sm font-medium">Horário para Instalação</label>
                                                    <select
                                                        className="w-full h-10 px-3 rounded-md border border-gray-200 bg-white text-sm"
                                                        value={horarioDisponivel}
                                                        onChange={e => setHorarioDisponivel(e.target.value)}
                                                        required
                                                    >
                                                        {HORARIOS_DISPONIVEIS.map(h => <option key={h.value} value={h.value}>{h.label}</option>)}
                                                    </select>
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-sm font-medium">Melhores dias para contato (pareamento)</label>
                                                <div className="flex flex-wrap gap-2">
                                                    {['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(dia => (
                                                        <Button
                                                            key={dia}
                                                            type="button"
                                                            variant={diasPreferidos.includes(dia) ? 'default' : 'outline'}
                                                            size="sm"
                                                            onClick={() => toggleDia(dia)}
                                                        >
                                                            {dia}
                                                        </Button>
                                                    ))}
                                                </div>
                                            </div>

                                            <Textarea
                                                label="Observações Adicionais"
                                                value={observacoes}
                                                onChange={e => setObservacoes(e.target.value)}
                                                placeholder="Alguma informação importante sobre a instalação?"
                                            />

                                            <div className="p-4 bg-amber-50 rounded-lg border border-amber-200 space-y-3">
                                                <h4 className="font-bold text-amber-800 flex items-center gap-2">
                                                    <Shield className="h-4 w-4" /> Termos e Responsabilidades
                                                </h4>
                                                <div className="space-y-2">
                                                    <label className="flex items-start gap-3 cursor-pointer group">
                                                        <input type="checkbox" className="mt-1" checked={confirmouChipExclusivo} onChange={e => setConfirmouChipExclusivo(e.target.checked)} />
                                                        <span className="text-xs text-amber-900">Declaro que o chip fornecido será de uso <b>exclusivo</b> do sistema e não será utilizado em outros aparelhos.</span>
                                                    </label>
                                                    <label className="flex items-start gap-3 cursor-pointer group">
                                                        <input type="checkbox" className="mt-1" checked={confirmouRiscoBan} onChange={e => setConfirmouRiscoBan(e.target.checked)} />
                                                        <span className="text-xs text-amber-900">Estou ciente que o envio massivo de mensagens pode resultar em banimento pelo WhatsApp e que a responsabilidade pelo conteúdo enviado é do condomínio.</span>
                                                    </label>
                                                    <label className="flex items-start gap-3 cursor-pointer group">
                                                        <input type="checkbox" className="mt-1" checked={confirmouDisponibilidade} onChange={e => setConfirmouDisponibilidade(e.target.checked)} />
                                                        <span className="text-xs text-amber-900">Confirmo que estarei com o aparelho em mãos no horário agendado para realizar a leitura do QR Code.</span>
                                                    </label>
                                                    <label className="flex items-start gap-3 cursor-pointer group">
                                                        <input type="checkbox" className="mt-1" checked={aceitouTermos} onChange={e => setAceitouTermos(e.target.checked)} />
                                                        <span className="text-xs text-amber-900 font-bold">Aceito as taxas de implantação (R$ 199,90) e mensalidade (R$ 149,90) do servidor dedicado.</span>
                                                    </label>
                                                </div>
                                            </div>

                                            <Button type="submit" loading={loading} className="w-full bg-blue-600 hover:bg-blue-700 h-12 text-lg">
                                                Solicitar Implementação
                                            </Button>
                                        </form>
                                    </CardContent>
                                </Card>
                            </div>

                            <div className="space-y-6">
                                <Card className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white border-0 shadow-lg">
                                    <CardContent className="p-6">
                                        <div className="flex items-center gap-2 mb-4">
                                            <Zap className="h-6 w-6 text-amber-400" />
                                            <h3 className="text-xl font-bold">Investimento Premium</h3>
                                        </div>
                                        <div className="space-y-4">
                                            <div>
                                                <p className="text-blue-100 text-sm">Taxa de Implantação (Única)</p>
                                                <p className="text-3xl font-bold tracking-tight">R$ 199,90</p>
                                            </div>
                                            <div className="pt-2 border-t border-blue-400/30">
                                                <p className="text-blue-100 text-sm">Mensalidade do Servidor</p>
                                                <p className="text-3xl font-bold tracking-tight">R$ 149,90</p>
                                            </div>
                                            <ul className="space-y-2 mt-6">
                                                <li className="flex items-center gap-2 text-sm"><CheckCircle className="h-4 w-4 text-emerald-400" /> VPS Dedicada 24/7</li>
                                                <li className="flex items-center gap-2 text-sm"><CheckCircle className="h-4 w-4 text-emerald-400" /> Sem risco de desconexão</li>
                                                <li className="flex items-center gap-2 text-sm"><CheckCircle className="h-4 w-4 text-emerald-400" /> Suporte VIP Prioritário</li>
                                                <li className="flex items-center gap-2 text-sm"><CheckCircle className="h-4 w-4 text-emerald-400" /> Backup de Instância</li>
                                            </ul>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardContent className="p-6 space-y-4">
                                        <div className="flex items-center gap-2 text-gray-900">
                                            <Info className="h-5 w-5 text-blue-500" />
                                            <h4 className="font-bold">Como funciona?</h4>
                                        </div>
                                        <div className="space-y-3">
                                            <div className="flex gap-3">
                                                <div className="bg-blue-100 text-blue-700 w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold">1</div>
                                                <p className="text-xs text-gray-600">Você preenche a solicitação ao lado.</p>
                                            </div>
                                            <div className="flex gap-3">
                                                <div className="bg-blue-100 text-blue-700 w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold">2</div>
                                                <p className="text-xs text-gray-600">Nossa equipe entra em contato em até 24h para agendar.</p>
                                            </div>
                                            <div className="flex gap-3">
                                                <div className="bg-blue-100 text-blue-700 w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold">3</div>
                                                <p className="text-xs text-gray-600">Preparamos o servidor e realizamos o pareamento via QR Code.</p>
                                            </div>
                                            <div className="flex gap-3">
                                                <div className="bg-blue-100 text-blue-700 w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold">4</div>
                                                <p className="text-xs text-gray-600">Pronto! O condomínio já pode usar todas as automações.</p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    ) : (
                        <Card className="border-emerald-200 bg-emerald-50">
                            <CardContent className="p-12 text-center">
                                <div className="bg-emerald-100 p-4 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
                                    <CheckCircle className="h-12 w-12 text-emerald-600" />
                                </div>
                                <h3 className="text-2xl font-bold text-emerald-900 mb-2">Solicitação Enviada!</h3>
                                <p className="text-emerald-800 mb-8 max-w-md mx-auto">
                                    Recebemos sua solicitação de servidor dedicado. Nossa equipe entrará em contato em breve via WhatsApp para concluir a configuração.
                                </p>
                                <Button variant="outline" onClick={() => setView('status')}>
                                    Voltar ao Painel
                                </Button>
                            </CardContent>
                        </Card>
                    )}
                </div>
            )}
        </div>
    );
}
