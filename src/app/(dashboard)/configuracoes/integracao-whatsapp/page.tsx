'use client';

import { useState } from 'react';
import { Card, CardContent, Button, Input, Textarea } from '@/components/ui';
import { useUser, useCondo } from '@/hooks/useUser';
import { useAuth } from '@/hooks/useAuth';
import {
    MessageCircle, CheckCircle, AlertTriangle, FileText,
    Server, Send, Shield, DollarSign, Zap, Activity, Clock
} from 'lucide-react';

export default function IntegracaoWhatsappPage() {
    const { condoId, isSindico, profile } = useUser();
    const { condo } = useCondo();
    const { session } = useAuth();
    const [loading, setLoading] = useState(false);
    const [enviado, setEnviado] = useState(false);
    const [aceitouTermos, setAceitouTermos] = useState(false);

    // Form
    const [nomeSindico, setNomeSindico] = useState(profile?.nome || '');
    const [emailContato, setEmailContato] = useState(profile?.email || '');
    const [telefone, setTelefone] = useState('');
    const [observacoes, setObservacoes] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!aceitouTermos) {
            alert('Você precisa aceitar os termos de responsabilidade');
            return;
        }

        setLoading(true);
        try {
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
📋 **SOLICITAÇÃO DE SERVIDOR WHATSAPP**

**Condomínio:** ${condo?.nome || 'N/A'}
**Síndico:** ${nomeSindico}
**Email:** ${emailContato}
**Telefone:** ${telefone}

**Observações:**
${observacoes || 'Nenhuma'}

---
✅ O síndico ACEITOU os termos de responsabilidade e compreende que:
1. O serviço requer um chip/número EXCLUSIVO para o condomínio
2. O condomínio é responsável pelo conteúdo das mensagens enviadas
3. O uso abusivo (spam) pode causar o banimento do número pelo WhatsApp
4. A taxa de implantação e mensalidade infra serão cobradas conforme tabela

Data: ${new Date().toLocaleString('pt-BR')}
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
            <div className="max-w-2xl mx-auto">
                <Card className="border-emerald-200 bg-emerald-50">
                    <CardContent className="p-8 text-center">
                        <CheckCircle className="h-16 w-16 text-emerald-500 mx-auto mb-4" />
                        <h2 className="text-2xl font-bold text-emerald-800 mb-2">
                            Solicitação Recebida!
                        </h2>
                        <p className="text-emerald-700 mb-4">
                            Nossa equipe de infraestrutura já foi notificada.
                            Entraremos em contato em breve para iniciar a configuração do seu servidor.
                        </p>
                        <p className="text-sm text-emerald-600">
                            Acompanhe o status pelo chat de suporte.
                        </p>
                    </CardContent>
                </Card>
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

            <p className="text-sm text-blue-800">
                Após o envio de todos os dados solicitados, o prazo para conclusão da integração é de <strong>até 7 dias úteis</strong>.
            </p>
        </div>
        </CardContent >
    </Card >

        {/* Planos de Preços */ }
        < div className = "space-y-4" >
        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-emerald-600" />
            Valores de Investimento
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
                        R$ 697,00 <span className="text-sm font-normal text-gray-500">unicos</span>
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
                        <li className="flex items-center gap-2">✅ Suporte Técnico Especializado</li>
                    </ul>
                </CardContent>
            </Card>
        </div>
    </div >

        {/* Termos de Responsabilidade */ }
        < Card className = "border-amber-200 bg-amber-50" >
            <CardContent className="p-6">
                <h3 className="font-semibold text-amber-800 flex items-center gap-2 mb-4">
                    <Shield className="h-5 w-5" />
                    Requisitos e Responsabilidades
                </h3>
                <div className="text-sm text-amber-900 space-y-3">
                    <div className="bg-white p-4 rounded border border-amber-300 space-y-2">
                        <p><strong>1. Chip Dedicado</strong><br />
                            O condomínio deve fornecer um número de celular (chip físico ou virtual) EXCLUSIVO para o sistema. Não use seu número pessoal.</p>

                        <p><strong>2. Risco de Banimento</strong><br />
                            O WhatsApp possui regras rígidas contra SPAM. O condomínio é responsável por usar o sistema de forma ética. O banimento do número pelo WhatsApp não é responsabilidade da plataforma.</p>

                        <p><strong>3. Aparelho Conectado</strong><br />
                            Para a conexão inicial (QR Code), é necessário um celular. A Evolution API mantém a conexão, mas o chip precisa estar ativo para receber o SMS de verificação se necessário.</p>
                    </div>

                    <label className="flex items-start gap-3 cursor-pointer mt-4">
                        <input
                            type="checkbox"
                            checked={aceitouTermos}
                            onChange={(e) => setAceitouTermos(e.target.checked)}
                            className="mt-1 h-5 w-5 rounded border-amber-400 text-emerald-600 focus:ring-emerald-500"
                        />
                        <span className="text-amber-900">
                            <strong>Li e compreendo</strong> os requisitos acima. Desejo prosseguir com a contratação da infraestrutura dedicada.
                        </span>
                    </label>
                </div>
            </CardContent>
    </Card >

        {/* Formulário */ }
        < Card >
        <CardContent className="p-6">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2 mb-4">
                <Server className="h-5 w-5 text-emerald-500" />
                Solicitar Infraestrutura
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
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
                        label="Telefone/WhatsApp *"
                        value={telefone}
                        onChange={(e) => setTelefone(e.target.value)}
                        placeholder="(11) 99999-9999"
                        required
                    />
                </div>

                <Textarea
                    label="Observações (opcional)"
                    value={observacoes}
                    onChange={(e) => setObservacoes(e.target.value)}
                    rows={3}
                    placeholder="Já possui chip? Dúvidas sobre a VPS?"
                />

                <div className="pt-4">
                    <Button
                        type="submit"
                        loading={loading}
                        disabled={!aceitouTermos}
                        className="w-full bg-emerald-600 hover:bg-emerald-700"
                    >
                        <Send className="h-4 w-4 mr-2" />
                        Solicitar Instalação (R$ 697,00)
                    </Button>
                </div>

                {!aceitouTermos && (
                    <p className="text-center text-sm text-amber-600">
                        <AlertTriangle className="h-4 w-4 inline mr-1" />
                        Aceite os termos para continuar
                    </p>
                )}
            </form>
        </CardContent>
    </Card >
        </div >
    );
}
