'use client';

import { useState } from 'react';
import { Card, CardContent, Button, Input, Textarea } from '@/components/ui';
import { useUser, useCondo } from '@/hooks/useUser';
import { useAuth } from '@/hooks/useAuth';
import {
    MessageCircle, CheckCircle, AlertTriangle, FileText,
    Server, Send, Shield, DollarSign, Zap, Activity, Clock,
    Smartphone, Info, ExternalLink, ChevronDown, ChevronUp, Phone
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
    const { condoId, isSindico, profile } = useUser();
    const { condo } = useCondo();
    const { session } = useAuth();
    const [loading, setLoading] = useState(false);
    const [enviado, setEnviado] = useState(false);
    const [aceitouTermos, setAceitouTermos] = useState(false);
    const [mostrarTermosCompletos, setMostrarTermosCompletos] = useState(false);
    const [mostrarFAQ, setMostrarFAQ] = useState(false);

    // Form básico
    const [nomeSindico, setNomeSindico] = useState(profile?.nome || '');
    const [emailContato, setEmailContato] = useState(profile?.email || '');
    const [telefoneContato, setTelefoneContato] = useState('');

    // Form expandido - Chip
    const [numeroChip, setNumeroChip] = useState('');
    const [operadora, setOperadora] = useState('');
    const [outraOperadora, setOutraOperadora] = useState('');
    const [statusChip, setStatusChip] = useState('');

    // Perfil do WhatsApp
    const [nomePerfilWhatsapp, setNomePerfilWhatsapp] = useState(condo?.nome || '');

    // Agendamento
    const [horarioDisponivel, setHorarioDisponivel] = useState('');
    const [diasPreferidos, setDiasPreferidos] = useState<string[]>([]);

    // Confirmações
    const [confirmouChipExclusivo, setConfirmouChipExclusivo] = useState(false);
    const [confirmouRiscoBan, setConfirmouRiscoBan] = useState(false);
    const [confirmouDisponibilidade, setConfirmouDisponibilidade] = useState(false);

    const [observacoes, setObservacoes] = useState('');

    const toggleDia = (dia: string) => {
        setDiasPreferidos(prev =>
            prev.includes(dia)
                ? prev.filter(d => d !== dia)
                : [...prev, dia]
        );
    };

    const chipPronto = statusChip === 'novo' || statusChip === 'desvinculado';

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!aceitouTermos || !confirmouChipExclusivo || !confirmouRiscoBan || !confirmouDisponibilidade) {
            alert('Você precisa aceitar todos os termos e confirmações');
            return;
        }

        if (!statusChip) {
            alert('Informe o status do chip');
            return;
        }

        setLoading(true);
        try {
            const operadoraNome = operadora === 'outra' ? outraOperadora : OPERADORAS.find(o => o.value === operadora)?.label;
            const statusChipTexto = STATUS_CHIP.find(s => s.value === statusChip)?.label;
            const horarioTexto = HORARIOS_DISPONIVEIS.find(h => h.value === horarioDisponivel)?.label;

            // Enviar solicitação via chat de suporte
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

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📌 **DADOS DO CONDOMÍNIO**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• **Condomínio:** ${condo?.nome || 'N/A'}
• **Síndico:** ${nomeSindico}
• **Email:** ${emailContato}
• **Telefone de Contato:** ${telefoneContato}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📱 **DADOS DO CHIP WHATSAPP**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• **Número do Chip:** ${numeroChip || 'Não informado'}
• **Operadora:** ${operadoraNome || 'Não informada'}
• **Status:** ${statusChipTexto}
• **Nome do Perfil:** ${nomePerfilWhatsapp}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📅 **DISPONIBILIDADE PARA QR CODE**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• **Horário:** ${horarioTexto || 'Não informado'}
• **Dias preferidos:** ${diasPreferidos.length > 0 ? diasPreferidos.join(', ') : 'Qualquer dia'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📝 **OBSERVAÇÕES**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${observacoes || 'Nenhuma'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ **CONFIRMAÇÕES DO CLIENTE**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Confirmou usar chip EXCLUSIVO para o condomínio
✅ Compreendeu os riscos de banimento pelo WhatsApp
✅ Confirmou disponibilidade para escanear QR Code
✅ Aceitou todos os termos de responsabilidade

${statusChip === 'nao_tenho' ? '⚠️ ATENÇÃO: Cliente ainda NÃO possui o chip. Aguardar aquisição.' : ''}
${statusChip === 'em_uso' ? '⚠️ ATENÇÃO: Chip em uso. Orientar cliente a desvincular e aguardar 7 dias.' : ''}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📅 Data da solicitação: ${new Date().toLocaleString('pt-BR')}
                    `.trim(),
                }),
            });

            if (response.ok) {
                setEnviado(true);
            } else {
                throw new Error('Erro ao enviar solicitação');
            }
        } catch (error) {
            alert('Erro ao enviar solicitação. Tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    if (!isSindico) {
        return (
            <div className="text-center py-12">
                <p className="text-gray-500">Acesso restrito a síndicos</p>
            </div>
        );
    }

    if (enviado) {
        return (
            <div className="max-w-2xl mx-auto space-y-6">
                <Card className="border-emerald-200 bg-emerald-50">
                    <CardContent className="p-8 text-center">
                        <CheckCircle className="h-16 w-16 text-emerald-500 mx-auto mb-4" />
                        <h2 className="text-2xl font-bold text-emerald-800 mb-2">
                            Solicitação Recebida!
                        </h2>
                        <p className="text-emerald-700 mb-4">
                            Nossa equipe de infraestrutura já foi notificada.
                            Entraremos em contato em breve para agendar a configuração.
                        </p>
                    </CardContent>
                </Card>

                {/* Próximos Passos */}
                <Card className="border-blue-200 bg-blue-50">
                    <CardContent className="p-6">
                        <h3 className="font-bold text-blue-900 mb-4 flex items-center gap-2">
                            <Info className="h-5 w-5" />
                            📋 Próximos Passos
                        </h3>
                        <div className="space-y-4 text-blue-800">
                            {statusChip === 'nao_tenho' && (
                                <div className="bg-amber-100 p-4 rounded-lg border border-amber-300">
                                    <p className="text-amber-800 font-semibold mb-2">
                                        <AlertTriangle className="h-4 w-4 inline mr-1" />
                                        1️⃣ Primeiro: Adquira o chip
                                    </p>
                                    <ul className="text-sm ml-4 space-y-1">
                                        <li>• Compre um chip pré-pago ou pós-pago (Vivo, Claro, Tim ou Oi)</li>
                                        <li>• Ative o chip fazendo uma ligação ou enviando SMS</li>
                                        <li>• Use o chip normalmente por 3-5 dias antes de integrar</li>
                                        <li>• Nos avise quando tiver o número</li>
                                    </ul>
                                </div>
                            )}

                            {statusChip === 'em_uso' && (
                                <div className="bg-amber-100 p-4 rounded-lg border border-amber-300">
                                    <p className="text-amber-800 font-semibold mb-2">
                                        <AlertTriangle className="h-4 w-4 inline mr-1" />
                                        1️⃣ Primeiro: Desvincule o WhatsApp atual
                                    </p>
                                    <ul className="text-sm ml-4 space-y-1">
                                        <li>• Abra o WhatsApp no celular</li>
                                        <li>• Vá em Configurações → Conta → Excluir minha conta</li>
                                        <li>• Aguarde no mínimo 7 dias</li>
                                        <li>• Nos avise quando completar o período</li>
                                    </ul>
                                </div>
                            )}

                            <div className="bg-white p-4 rounded-lg border border-blue-200">
                                <p className="font-semibold mb-2">
                                    {statusChip === 'nao_tenho' || statusChip === 'em_uso' ? '2️⃣' : '1️⃣'} Aguarde nosso contato
                                </p>
                                <p className="text-sm">
                                    Entraremos em contato pelo telefone/WhatsApp informado para agendar
                                    a videochamada de escaneamento do QR Code.
                                </p>
                            </div>

                            <div className="bg-white p-4 rounded-lg border border-blue-200">
                                <p className="font-semibold mb-2">
                                    {statusChip === 'nao_tenho' || statusChip === 'em_uso' ? '3️⃣' : '2️⃣'} Prepare o celular
                                </p>
                                <ul className="text-sm ml-4 space-y-1">
                                    <li>• Instale o WhatsApp com o chip dedicado</li>
                                    <li>• Tenha o celular em mãos no horário agendado</li>
                                    <li>• Conexão estável com internet</li>
                                </ul>
                            </div>

                            <div className="bg-white p-4 rounded-lg border border-blue-200">
                                <p className="font-semibold mb-2">
                                    {statusChip === 'nao_tenho' || statusChip === 'em_uso' ? '4️⃣' : '3️⃣'} Realize o pagamento
                                </p>
                                <p className="text-sm">
                                    O link de pagamento da taxa de implantação (R$ 697,00) será enviado após
                                    confirmação dos dados. A configuração inicia após confirmação do pagamento.
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Logo */}
                <Card className="border-gray-200">
                    <CardContent className="p-4">
                        <p className="text-sm text-gray-600 mb-2">
                            <strong>Opcional:</strong> Envie a logo do condomínio para usarmos como foto de perfil:
                        </p>
                        <a
                            href="https://wa.me/5521965532247?text=Olá! Segue a logo do condomínio ${encodeURIComponent(condo?.nome || 'Condomínio')} para o perfil do WhatsApp."
                            target="_blank"
                            className="flex items-center gap-2 text-blue-600 hover:text-blue-800 font-mono bg-blue-50 p-3 rounded text-sm"
                        >
                            <MessageCircle className="h-4 w-4" />
                            Enviar via WhatsApp
                            <ExternalLink className="h-4 w-4 ml-auto" />
                        </a>
                    </CardContent>
                </Card>

                <p className="text-center text-sm text-gray-500">
                    Acompanhe o status pelo chat de suporte.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <MessageCircle className="h-6 w-6 text-emerald-500" />
                    Servidor WhatsApp Dedicado
                </h1>
                <p className="text-gray-500">
                    Tenha sua própria instância de WhatsApp para automação total
                </p>
            </div>

            {/* Benefícios */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white border-0">
                    <CardContent className="p-4 text-center">
                        <Zap className="h-8 w-8 mx-auto mb-2 opacity-80" />
                        <h3 className="font-semibold">Envio Rápido</h3>
                        <p className="text-sm text-emerald-100">Boletos e avisos chegam na hora</p>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0">
                    <CardContent className="p-4 text-center">
                        <Server className="h-8 w-8 mx-auto mb-2 opacity-80" />
                        <h3 className="font-semibold">Infra Dedicada</h3>
                        <p className="text-sm text-blue-100">Servidor VPS exclusivo para você</p>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0">
                    <CardContent className="p-4 text-center">
                        <Activity className="h-8 w-8 mx-auto mb-2 opacity-80" />
                        <h3 className="font-semibold">Alta Estabilidade</h3>
                        <p className="text-sm text-purple-100">Menor risco de desconexão</p>
                    </CardContent>
                </Card>
            </div>

            {/* Prazo */}
            <Card className="bg-blue-50 border-blue-200">
                <CardContent className="p-4 flex items-center gap-4">
                    <div className="bg-blue-100 p-3 rounded-full">
                        <Clock className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                        <h4 className="font-semibold text-blue-900">Prazo de Implantação</h4>
                        <p className="text-sm text-blue-800">
                            Após confirmação do pagamento e disponibilidade do chip: <strong>3-5 dias úteis</strong>
                        </p>
                    </div>
                </CardContent>
            </Card>

            {/* Formulário Expandido */}
            <form onSubmit={handleSubmit} className="space-y-6">

                {/* Seção 1: Dados de Contato */}
                <Card>
                    <CardContent className="p-6">
                        <h3 className="font-semibold text-gray-900 flex items-center gap-2 mb-4">
                            <FileText className="h-5 w-5 text-emerald-500" />
                            1. Dados de Contato
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input
                                label="Nome do Responsável *"
                                value={nomeSindico}
                                onChange={(e) => setNomeSindico(e.target.value)}
                                required
                            />
                            <Input
                                label="Email para Contato *"
                                type="email"
                                value={emailContato}
                                onChange={(e) => setEmailContato(e.target.value)}
                                required
                            />
                            <Input
                                label="Telefone/WhatsApp para Contato *"
                                value={telefoneContato}
                                onChange={(e) => setTelefoneContato(e.target.value)}
                                placeholder="(11) 99999-9999"
                                required
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Seção 2: Dados do Chip */}
                <Card>
                    <CardContent className="p-6">
                        <h3 className="font-semibold text-gray-900 flex items-center gap-2 mb-4">
                            <Smartphone className="h-5 w-5 text-green-500" />
                            2. Dados do Chip WhatsApp
                        </h3>

                        <div className="space-y-4">
                            {/* Status do Chip */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Status do chip que será usado *
                                </label>
                                <select
                                    value={statusChip}
                                    onChange={(e) => setStatusChip(e.target.value)}
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                    required
                                >
                                    {STATUS_CHIP.map(status => (
                                        <option key={status.value} value={status.value}>
                                            {status.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Avisos conforme status */}
                            {statusChip === 'nao_tenho' && (
                                <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg">
                                    <p className="text-amber-800 text-sm">
                                        <AlertTriangle className="h-4 w-4 inline mr-1" />
                                        <strong>Sem problemas!</strong> Você pode solicitar agora e adquirir o chip depois.
                                        Recomendamos comprar um chip pré-pago de qualquer operadora e ativá-lo antes do agendamento.
                                    </p>
                                </div>
                            )}

                            {statusChip === 'em_uso' && (
                                <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
                                    <p className="text-red-800 text-sm">
                                        <AlertTriangle className="h-4 w-4 inline mr-1" />
                                        <strong>Atenção!</strong> Você precisa desvincular o WhatsApp atual deste chip e aguardar
                                        no mínimo 7 dias antes de conectar ao servidor. Isso reduz o risco de banimento.
                                    </p>
                                </div>
                            )}

                            {chipPronto && (
                                <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-lg">
                                    <p className="text-emerald-800 text-sm">
                                        <CheckCircle className="h-4 w-4 inline mr-1" />
                                        <strong>Ótimo!</strong> Seu chip está pronto para ser conectado ao servidor.
                                    </p>
                                </div>
                            )}

                            {/* Número e Operadora - só mostra se tem ou está pronto */}
                            {(chipPronto || statusChip === 'em_uso') && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <Input
                                        label="Número do Chip (com DDD) *"
                                        value={numeroChip}
                                        onChange={(e) => setNumeroChip(e.target.value)}
                                        placeholder="(11) 99999-9999"
                                        required={chipPronto}
                                    />
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Operadora *
                                        </label>
                                        <select
                                            value={operadora}
                                            onChange={(e) => setOperadora(e.target.value)}
                                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                            required={chipPronto}
                                        >
                                            {OPERADORAS.map(op => (
                                                <option key={op.value} value={op.value}>
                                                    {op.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            )}

                            {operadora === 'outra' && (
                                <Input
                                    label="Especifique a operadora *"
                                    value={outraOperadora}
                                    onChange={(e) => setOutraOperadora(e.target.value)}
                                    placeholder="Nome da operadora"
                                    required
                                />
                            )}

                            {/* Nome do Perfil */}
                            <Input
                                label="Nome que aparecerá no perfil do WhatsApp *"
                                value={nomePerfilWhatsapp}
                                onChange={(e) => setNomePerfilWhatsapp(e.target.value)}
                                placeholder="Ex: Condomínio Villa Flora"
                                required
                            />
                            <p className="text-xs text-gray-500 -mt-2">
                                Este nome será exibido para os moradores quando receberem mensagens.
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {/* Seção 3: Agendamento */}
                <Card>
                    <CardContent className="p-6">
                        <h3 className="font-semibold text-gray-900 flex items-center gap-2 mb-4">
                            <Clock className="h-5 w-5 text-blue-500" />
                            3. Disponibilidade para Escaneamento do QR Code
                        </h3>

                        <p className="text-sm text-gray-600 mb-4">
                            Para conectar o WhatsApp ao servidor, precisamos fazer uma videochamada rápida (5-10 min)
                            onde você irá escanear o QR Code com o celular do chip dedicado.
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Melhor horário
                                </label>
                                <select
                                    value={horarioDisponivel}
                                    onChange={(e) => setHorarioDisponivel(e.target.value)}
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                >
                                    {HORARIOS_DISPONIVEIS.map(h => (
                                        <option key={h.value} value={h.value}>
                                            {h.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Dias preferidos
                                </label>
                                <div className="flex flex-wrap gap-2">
                                    {['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(dia => (
                                        <button
                                            key={dia}
                                            type="button"
                                            onClick={() => toggleDia(dia)}
                                            className={`px-3 py-1 rounded-full text-sm border transition-all ${diasPreferidos.includes(dia)
                                                ? 'bg-emerald-500 text-white border-emerald-500'
                                                : 'bg-white text-gray-600 border-gray-300 hover:border-emerald-300'
                                                }`}
                                        >
                                            {dia}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Seção 4: Observações */}
                <Card>
                    <CardContent className="p-6">
                        <h3 className="font-semibold text-gray-900 flex items-center gap-2 mb-4">
                            <FileText className="h-5 w-5 text-gray-500" />
                            4. Observações Adicionais
                        </h3>
                        <Textarea
                            value={observacoes}
                            onChange={(e) => setObservacoes(e.target.value)}
                            rows={3}
                            placeholder="Dúvidas, informações adicionais, preferências..."
                        />
                    </CardContent>
                </Card>

                {/* FAQ */}
                <Card className="border-blue-200">
                    <CardContent className="p-4">
                        <button
                            type="button"
                            onClick={() => setMostrarFAQ(!mostrarFAQ)}
                            className="flex items-center justify-between w-full text-left"
                        >
                            <span className="font-semibold text-blue-900 flex items-center gap-2">
                                <Info className="h-5 w-5" />
                                ❓ Perguntas Frequentes
                            </span>
                            {mostrarFAQ ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                        </button>

                        {mostrarFAQ && (
                            <div className="mt-4 space-y-4 text-sm">
                                <div className="bg-blue-50 p-3 rounded">
                                    <p className="font-semibold">Qual chip devo comprar?</p>
                                    <p className="text-gray-600">Qualquer operadora (Vivo, Claro, Tim, Oi). Preferência por pós-pago para não expirar.</p>
                                </div>
                                <div className="bg-blue-50 p-3 rounded">
                                    <p className="font-semibold">Posso usar o número da portaria?</p>
                                    <p className="text-gray-600">Não recomendado. Use um número exclusivo para automação.</p>
                                </div>
                                <div className="bg-blue-50 p-3 rounded">
                                    <p className="font-semibold">O que é "maturação" do chip?</p>
                                    <p className="text-gray-600">Chips novos são mais propensos a ban. Usar por alguns dias antes de automatizar reduz esse risco.</p>
                                </div>
                                <div className="bg-blue-50 p-3 rounded">
                                    <p className="font-semibold">Preciso deixar o celular ligado 24h?</p>
                                    <p className="text-gray-600">Não. Após escanear o QR Code, a conexão fica no servidor. O celular pode ser desligado.</p>
                                </div>
                                <div className="bg-blue-50 p-3 rounded">
                                    <p className="font-semibold">E se o número for banido?</p>
                                    <p className="text-gray-600">Você precisará adquirir novo chip. Auxiliaremos na nova configuração (pode haver taxa).</p>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Seção 5: Termos de Responsabilidade */}
                <Card className="border-amber-200 bg-amber-50">
                    <CardContent className="p-6">
                        <h3 className="font-semibold text-amber-800 flex items-center gap-2 mb-4">
                            <Shield className="h-5 w-5" />
                            5. Termos de Responsabilidade
                        </h3>

                        <div className="text-sm text-amber-900 space-y-4">
                            <div className="bg-white p-4 rounded border border-amber-300 space-y-3">
                                <p><strong>1. Chip Exclusivo e Dedicado</strong><br />
                                    O número usado deve ser EXCLUSIVO para o sistema. Não use seu número pessoal.
                                    O condomínio é responsável por adquirir, ativar e manter o chip ativo (com créditos/plano).</p>

                                <p><strong>2. Risco de Banimento pelo WhatsApp</strong><br />
                                    O WhatsApp pode banir números por envio em massa, muitos bloqueios, ou uso de API não oficial.
                                    O Condomínio Fácil <u>NÃO garante</u> que o número não será banido. Se isso ocorrer,
                                    o cliente deve adquirir novo chip.</p>

                                <p><strong>3. Conteúdo das Mensagens</strong><br />
                                    O condomínio é totalmente responsável pelo conteúdo enviado. Mensagens de spam,
                                    conteúdo ilegal ou abusivo são de responsabilidade exclusiva do cliente.</p>

                                <button
                                    type="button"
                                    onClick={() => setMostrarTermosCompletos(!mostrarTermosCompletos)}
                                    className="flex items-center gap-1 text-amber-700 hover:text-amber-900 font-medium"
                                >
                                    {mostrarTermosCompletos ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                    {mostrarTermosCompletos ? 'Menos detalhes' : 'Ver todos os termos'}
                                </button>

                                {mostrarTermosCompletos && (
                                    <>
                                        <p><strong>4. Reconexão</strong><br />
                                            Se o WhatsApp desconectar do servidor (por inatividade, atualização, etc.),
                                            o cliente deve estar disponível para escanear novo QR Code em horário a combinar.</p>

                                        <p><strong>5. Conformidade com LGPD</strong><br />
                                            O condomínio deve ter consentimento dos moradores para envio de mensagens via WhatsApp.
                                            O sistema apenas envia; a responsabilidade do consentimento é do cliente.</p>

                                        <p><strong>6. Horário de Envio</strong><br />
                                            Recomendamos enviar mensagens apenas em horário comercial (8h-20h).
                                            Envios de madrugada aumentam chances de bloqueio e reclamações.</p>

                                        <p><strong>7. Suporte e Manutenção</strong><br />
                                            A mensalidade inclui monitoramento do servidor, atualizações e suporte técnico.
                                            Reconexões por problemas no chip do cliente podem ter taxa adicional.</p>
                                    </>
                                )}
                            </div>

                            {/* Checkboxes de confirmação */}
                            <div className="space-y-3 pt-4">
                                <label className="flex items-start gap-3 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={confirmouChipExclusivo}
                                        onChange={(e) => setConfirmouChipExclusivo(e.target.checked)}
                                        className="mt-1 h-5 w-5 rounded border-amber-400 text-emerald-600 focus:ring-emerald-500"
                                    />
                                    <span className="text-amber-900">
                                        <strong>Confirmo</strong> que usarei um chip EXCLUSIVO para o condomínio,
                                        não meu número pessoal ou de uso compartilhado.
                                    </span>
                                </label>

                                <label className="flex items-start gap-3 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={confirmouRiscoBan}
                                        onChange={(e) => setConfirmouRiscoBan(e.target.checked)}
                                        className="mt-1 h-5 w-5 rounded border-amber-400 text-emerald-600 focus:ring-emerald-500"
                                    />
                                    <span className="text-amber-900">
                                        <strong>Compreendo</strong> que existe risco de banimento pelo WhatsApp e que,
                                        se isso ocorrer, deverei adquirir novo chip por minha conta.
                                    </span>
                                </label>

                                <label className="flex items-start gap-3 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={confirmouDisponibilidade}
                                        onChange={(e) => setConfirmouDisponibilidade(e.target.checked)}
                                        className="mt-1 h-5 w-5 rounded border-amber-400 text-emerald-600 focus:ring-emerald-500"
                                    />
                                    <span className="text-amber-900">
                                        <strong>Confirmo</strong> que estarei disponível para escanear o QR Code inicial
                                        e para reconexões futuras quando necessário.
                                    </span>
                                </label>

                                <label className="flex items-start gap-3 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={aceitouTermos}
                                        onChange={(e) => setAceitouTermos(e.target.checked)}
                                        className="mt-1 h-5 w-5 rounded border-amber-400 text-emerald-600 focus:ring-emerald-500"
                                    />
                                    <span className="text-amber-900">
                                        <strong>Li e aceito</strong> todos os termos de responsabilidade acima.
                                    </span>
                                </label>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Planos de Preços */}
                <div className="space-y-4">
                    <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                        <DollarSign className="h-5 w-5 text-emerald-600" />
                        Investimento
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Implantação */}
                        <Card className="border-emerald-100 bg-gradient-to-b from-emerald-50 to-white">
                            <CardContent className="p-6 text-center space-y-4">
                                <div className="bg-emerald-100 p-3 rounded-full w-12 h-12 flex items-center justify-center mx-auto">
                                    <Server className="h-6 w-6 text-emerald-600" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-gray-900">Implantação VPS</h4>
                                    <p className="text-sm text-gray-500">Configuração de Servidor</p>
                                </div>
                                <div className="text-3xl font-bold text-emerald-700">
                                    R$ 697,00 <span className="text-sm font-normal text-gray-500">únicos</span>
                                </div>
                                <ul className="text-sm text-gray-600 space-y-2 text-left bg-white p-4 rounded-lg border border-emerald-100">
                                    <li className="flex items-center gap-2">✅ Configuração completa</li>
                                    <li className="flex items-center gap-2">✅ Ambiente dedicado</li>
                                    <li className="flex items-center gap-2">✅ Testes + validação</li>
                                    <li className="flex items-center gap-2">✅ Setup de VPS + Evolution API</li>
                                </ul>
                            </CardContent>
                        </Card>

                        {/* Mensalidade */}
                        <Card className="border-blue-100 bg-gradient-to-b from-blue-50 to-white">
                            <CardContent className="p-6 text-center space-y-4">
                                <div className="bg-blue-100 p-3 rounded-full w-12 h-12 flex items-center justify-center mx-auto">
                                    <Activity className="h-6 w-6 text-blue-600" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-gray-900">Gestão de Infraestrutura</h4>
                                    <p className="text-sm text-gray-500">Manutenção Mensal</p>
                                </div>
                                <div className="space-y-2">
                                    <div className="text-3xl font-bold text-blue-700">
                                        + R$ 149,00 <span className="text-sm font-normal text-gray-500">/mês</span>
                                    </div>
                                    <p className="text-xs text-gray-500">Adicional ao plano existente</p>
                                </div>
                                <ul className="text-sm text-gray-600 space-y-2 text-left bg-white p-4 rounded-lg border border-blue-100">
                                    <li className="flex items-center gap-2">✅ VPS Dedicada</li>
                                    <li className="flex items-center gap-2">✅ Monitoramento 24/7</li>
                                    <li className="flex items-center gap-2">✅ Atualizações de Segurança</li>
                                    <li className="flex items-center gap-2">✅ Suporte Técnico</li>
                                </ul>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* Botão de Envio */}
                <div className="pt-4">
                    <Button
                        type="submit"
                        loading={loading}
                        disabled={!aceitouTermos || !confirmouChipExclusivo || !confirmouRiscoBan || !confirmouDisponibilidade}
                        className="w-full bg-emerald-600 hover:bg-emerald-700"
                    >
                        <Send className="h-4 w-4 mr-2" />
                        Enviar Solicitação
                    </Button>

                    {(!aceitouTermos || !confirmouChipExclusivo || !confirmouRiscoBan || !confirmouDisponibilidade) && (
                        <p className="text-center text-sm text-amber-600 mt-2">
                            <AlertTriangle className="h-4 w-4 inline mr-1" />
                            Aceite todas as confirmações para continuar
                        </p>
                    )}
                </div>
            </form>
        </div>
    );
}
