'use client';

import { useState } from 'react';
import { Card, CardContent, Button, Input, Textarea } from '@/components/ui';
import { useUser, useCondo } from '@/hooks/useUser';
import { useAuth } from '@/hooks/useAuth';
import {
    CreditCard, CheckCircle, AlertTriangle, FileText,
    Building2, Send, Shield, DollarSign, Zap, Clock
} from 'lucide-react';

export default function IntegracaoPagamentosPage() {
    const { condoId, isSindico, profile } = useUser();
    const { condo } = useCondo();
    const { session } = useAuth();
    const [loading, setLoading] = useState(false);
    const [enviado, setEnviado] = useState(false);
    const [aceitouTermos, setAceitouTermos] = useState(false);

    // Form
    const [cnpj, setCnpj] = useState('');
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
                    assunto: '🏦 Solicitação de Integração de Pagamentos Premium',
                    mensagem: `
📋 **SOLICITAÇÃO DE INTEGRAÇÃO DE PAGAMENTOS**

**Condomínio:** ${condo?.nome || 'N/A'}
**CNPJ:** ${cnpj}
**Síndico:** ${nomeSindico}
**Email:** ${emailContato}
**Telefone:** ${telefone}

**Observações:**
${observacoes || 'Nenhuma'}

---
✅ O síndico ACEITOU os termos de responsabilidade e compromete-se a:
1. Fornecer credenciais válidas do Mercado Pago Business
2. Assumir total responsabilidade sobre os pagamentos recebidos
3. Manter os dados de integração seguros
4. Informar imediatamente sobre qualquer problema

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
                            Solicitação Enviada!
                        </h2>
                        <p className="text-emerald-700 mb-4">
                            Recebemos sua solicitação de integração de pagamentos.
                            Nossa equipe entrará em contato em até 48 horas úteis.
                        </p>
                        <p className="text-sm text-emerald-600">
                            Você pode acompanhar o status pelo chat de suporte.
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
                    <CreditCard className="h-6 w-6 text-emerald-500" />
                    Integração de Pagamentos Premium
                </h1>
                <p className="text-gray-500">
                    Gere boletos e PIX automáticos diretamente do sistema
                </p>
            </div>

            {/* Benefícios */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white border-0">
                    <CardContent className="p-4 text-center">
                        <Zap className="h-8 w-8 mx-auto mb-2 opacity-80" />
                        <h3 className="font-semibold">Cobrança Automática</h3>
                        <p className="text-sm text-emerald-100">Boletos e PIX gerados na hora</p>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0">
                    <CardContent className="p-4 text-center">
                        <DollarSign className="h-8 w-8 mx-auto mb-2 opacity-80" />
                        <h3 className="font-semibold">Receba Direto</h3>
                        <p className="text-sm text-blue-100">Dinheiro vai para sua conta</p>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0">
                    <CardContent className="p-4 text-center">
                        <Clock className="h-8 w-8 mx-auto mb-2 opacity-80" />
                        <h3 className="font-semibold">Conciliação Fácil</h3>
                        <p className="text-sm text-purple-100">Pagamentos atualizados em tempo real</p>
                    </CardContent>
                </Card>
            </div>

            {/* Requisitos */}
            <Card>
                <CardContent className="p-6">
                    <h3 className="font-semibold text-gray-900 flex items-center gap-2 mb-4">
                        <FileText className="h-5 w-5 text-blue-500" />
                        O que você precisa ter:
                    </h3>
                    <ul className="space-y-2 text-gray-700">
                        <li className="flex items-start gap-2">
                            <CheckCircle className="h-5 w-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                            <span><strong>CNPJ do Condomínio</strong> - Ativo e regular na Receita Federal</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <CheckCircle className="h-5 w-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                            <span><strong>Conta Mercado Pago Business</strong> - Criada com o CNPJ do condomínio</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <CheckCircle className="h-5 w-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                            <span><strong>Credenciais de API</strong> - Access Token e Public Key do Mercado Pago</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <CheckCircle className="h-5 w-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                            <span><strong>Ata ou Documento</strong> - Comprovando que você é o síndico autorizado</span>
                        </li>
                    </ul>
                </CardContent>
            </Card>

            {/* Termos de Responsabilidade */}
            <Card className="border-amber-200 bg-amber-50">
                <CardContent className="p-6">
                    <h3 className="font-semibold text-amber-800 flex items-center gap-2 mb-4">
                        <Shield className="h-5 w-5" />
                        Termos de Responsabilidade do Cliente
                    </h3>
                    <div className="text-sm text-amber-900 space-y-3">
                        <p>Ao solicitar a integração de pagamentos, o síndico e o condomínio declaram e concordam que:</p>

                        <div className="bg-white p-4 rounded border border-amber-300 space-y-2">
                            <p><strong>1. Responsabilidade Financeira</strong><br />
                                Todos os pagamentos recebidos através da integração são de <u>exclusiva responsabilidade do condomínio</u>. O sistema Condomínio Fácil atua apenas como interface tecnológica, não tendo qualquer responsabilidade sobre valores recebidos, estornos, contestações ou inadimplência.</p>

                            <p><strong>2. Credenciais e Segurança</strong><br />
                                O síndico é responsável por criar e manter segura a conta do Mercado Pago do condomínio. As credenciais fornecidas (Access Token, Public Key) são de uso exclusivo e confidencial. A plataforma armazena essas credenciais de forma segura, mas não se responsabiliza por uso indevido decorrente de vazamento por parte do cliente.</p>

                            <p><strong>3. Conformidade Legal</strong><br />
                                O condomínio declara estar em conformidade com todas as obrigações fiscais e legais, incluindo emissão de recibos, prestação de contas em assembleia e cumprimento da convenção condominial.</p>

                            <p><strong>4. Taxas e Custos</strong><br />
                                As taxas cobradas pelo Mercado Pago (por PIX, boleto, cartão) são de responsabilidade do condomínio e serão descontadas diretamente dos recebimentos. A taxa de implantação cobrada pelo Condomínio Fácil é referente ao serviço de configuração e suporte técnico.</p>

                            <p><strong>5. Suporte e Manutenção</strong><br />
                                A integração inclui suporte técnico para configuração inicial. Alterações de credenciais, migração de conta ou reconfigurações podem estar sujeitas a cobrança adicional.</p>

                            <p><strong>6. Encerramento</strong><br />
                                O condomínio pode solicitar a remoção da integração a qualquer momento. Isso não afeta pagamentos já processados ou em processamento.</p>
                        </div>

                        <label className="flex items-start gap-3 cursor-pointer mt-4">
                            <input
                                type="checkbox"
                                checked={aceitouTermos}
                                onChange={(e) => setAceitouTermos(e.target.checked)}
                                className="mt-1 h-5 w-5 rounded border-amber-400 text-emerald-600 focus:ring-emerald-500"
                            />
                            <span className="text-amber-900">
                                <strong>Li e aceito</strong> os termos de responsabilidade acima. Confirmo que tenho autorização para representar o condomínio nesta solicitação.
                            </span>
                        </label>
                    </div>
                </CardContent>
            </Card>

            {/* Formulário */}
            <Card>
                <CardContent className="p-6">
                    <h3 className="font-semibold text-gray-900 flex items-center gap-2 mb-4">
                        <Building2 className="h-5 w-5 text-emerald-500" />
                        Dados para Solicitação
                    </h3>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input
                                label="CNPJ do Condomínio *"
                                value={cnpj}
                                onChange={(e) => setCnpj(e.target.value)}
                                placeholder="00.000.000/0001-00"
                                required
                            />
                            <Input
                                label="Nome do Síndico *"
                                value={nomeSindico}
                                onChange={(e) => setNomeSindico(e.target.value)}
                                required
                            />
                            <Input
                                label="Email de Contato *"
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
                            placeholder="Dúvidas, preferências de horário para contato, etc."
                        />

                        <div className="pt-4">
                            <Button
                                type="submit"
                                loading={loading}
                                disabled={!aceitouTermos}
                                className="w-full"
                            >
                                <Send className="h-4 w-4 mr-2" />
                                Enviar Solicitação
                            </Button>
                        </div>

                        {!aceitouTermos && (
                            <p className="text-center text-sm text-amber-600">
                                <AlertTriangle className="h-4 w-4 inline mr-1" />
                                Aceite os termos de responsabilidade para continuar
                            </p>
                        )}
                    </form>
                </CardContent>
            </Card>

            {/* Planos de Preços */}
            <div className="space-y-4">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-emerald-600" />
                    Investimento Estimado
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Implantação */}
                    <Card className="border-emerald-100 bg-gradient-to-b from-emerald-50 to-white">
                        <CardContent className="p-6 text-center space-y-4">
                            <div className="bg-emerald-100 p-3 rounded-full w-12 h-12 flex items-center justify-center mx-auto">
                                <Zap className="h-6 w-6 text-emerald-600" />
                            </div>
                            <div>
                                <h4 className="font-bold text-gray-900">Taxa de Implantação</h4>
                                <p className="text-sm text-gray-500">Pagamento único</p>
                            </div>
                            <div className="text-3xl font-bold text-emerald-700">
                                <span className="text-lg font-normal text-gray-500">A partir de</span> R$ 900
                            </div>
                            <ul className="text-sm text-gray-600 space-y-2 text-left bg-white p-4 rounded-lg border border-emerald-100">
                                <li className="flex items-center gap-2">✅ Configuração Mercado Pago</li>
                                <li className="flex items-center gap-2">✅ Importação de Moradores</li>
                                <li className="flex items-center gap-2">✅ Treinamento do Síndico</li>
                                <li className="flex items-center gap-2">✅ Suporte Prioritário 30 dias</li>
                            </ul>
                        </CardContent>
                    </Card>

                    {/* Mensalidade */}
                    <Card className="border-blue-100 bg-gradient-to-b from-blue-50 to-white">
                        <CardContent className="p-6 text-center space-y-4">
                            <div className="bg-blue-100 p-3 rounded-full w-12 h-12 flex items-center justify-center mx-auto">
                                <Clock className="h-6 w-6 text-blue-600" />
                            </div>
                            <div>
                                <h4 className="font-bold text-gray-900">Mensalidade do Módulo</h4>
                                <p className="text-sm text-gray-500">Valor recorrente</p>
                            </div>
                            <div className="space-y-2">
                                <div className="text-2xl font-bold text-blue-700">
                                    R$ 6,00 <span className="text-sm font-normal text-gray-500">/unidade</span>
                                </div>
                                <p className="text-xs text-gray-500">Para condomínios acima de 20 uni.</p>
                            </div>
                            <div className="bg-white p-4 rounded-lg border border-blue-100 text-sm">
                                <div className="flex justify-between items-center py-1 border-b">
                                    <span className="text-gray-600">Até 20 unidades</span>
                                    <span className="font-semibold text-blue-700">R$ 150/mês (fixo)</span>
                                </div>
                                <div className="flex justify-between items-center py-1 border-b">
                                    <span className="text-gray-600">21 a 100 unidades</span>
                                    <span className="font-semibold text-blue-700">R$ 6,00/uni</span>
                                </div>
                                <div className="flex justify-between items-center py-1">
                                    <span className="text-gray-600">Acima de 100</span>
                                    <span className="font-semibold text-blue-700">Sob consulta</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <p className="text-center text-xs text-gray-500 mt-4">
                    * Valores podem variar conforme complexidade e localização. Solicite uma proposta formal.
                </p>
            </div>
        </div>
    );
}
