'use client';

import { useState } from 'react';
import { Card, CardContent, Button, Input, Textarea } from '@/components/ui';
import { useUser, useCondo } from '@/hooks/useUser';
import { useAuth } from '@/hooks/useAuth';
import {
    CreditCard, CheckCircle, AlertTriangle, FileText,
    Building2, Send, Shield, DollarSign, Zap, Clock,
    Upload, Info, ExternalLink, ChevronDown, ChevronUp
} from 'lucide-react';

const BANCOS_GATEWAYS = [
    { value: '', label: 'Selecione o banco ou gateway...' },
    { value: 'mercadopago', label: '💳 Mercado Pago (Recomendado)', tipo: 'gateway' },
    { value: 'asaas', label: '💳 Asaas', tipo: 'gateway' },
    { value: 'pagseguro', label: '💳 PagSeguro', tipo: 'gateway' },
    { value: 'iugu', label: '💳 Iugu', tipo: 'gateway' },
    { value: 'pagarme', label: '💳 Pagar.me', tipo: 'gateway' },
    { value: 'bb', label: '🏦 Banco do Brasil', tipo: 'banco' },
    { value: 'itau', label: '🏦 Itaú', tipo: 'banco' },
    { value: 'bradesco', label: '🏦 Bradesco', tipo: 'banco' },
    { value: 'santander', label: '🏦 Santander', tipo: 'banco' },
    { value: 'caixa', label: '🏦 Caixa Econômica Federal', tipo: 'banco' },
    { value: 'inter', label: '🏦 Banco Inter', tipo: 'banco' },
    { value: 'sicredi', label: '🏦 Sicredi', tipo: 'banco' },
    { value: 'sicoob', label: '🏦 Sicoob', tipo: 'banco' },
    { value: 'outro', label: '📋 Outro (especificar)', tipo: 'outro' },
];

export default function IntegracaoPagamentosPage() {
    const { condoId, isSindico, profile } = useUser();
    const { condo } = useCondo();
    const { session } = useAuth();
    const [loading, setLoading] = useState(false);
    const [enviado, setEnviado] = useState(false);
    const [aceitouTermos, setAceitouTermos] = useState(false);
    const [mostrarTermosCompletos, setMostrarTermosCompletos] = useState(false);

    // Form básico
    const [cnpj, setCnpj] = useState('');
    const [nomeSindico, setNomeSindico] = useState(profile?.nome || '');
    const [emailContato, setEmailContato] = useState(profile?.email || '');
    const [telefone, setTelefone] = useState('');

    // Form expandido - Banco
    const [bancoSelecionado, setBancoSelecionado] = useState('');
    const [outroBanco, setOutroBanco] = useState('');
    const [possuiContrato, setPossuiContrato] = useState<'sim' | 'nao' | 'em_andamento' | ''>('');
    const [tipoCredencial, setTipoCredencial] = useState<string[]>([]);
    const [convenioNumero, setConvenioNumero] = useState('');

    // Confirmações
    const [confirmouDocumentos, setConfirmouDocumentos] = useState(false);
    const [confirmouResponsabilidade, setConfirmouResponsabilidade] = useState(false);

    const [observacoes, setObservacoes] = useState('');

    const bancoInfo = BANCOS_GATEWAYS.find(b => b.value === bancoSelecionado);
    const isBancoTradicional = bancoInfo?.tipo === 'banco';
    const isGateway = bancoInfo?.tipo === 'gateway';

    const toggleCredencial = (cred: string) => {
        setTipoCredencial(prev =>
            prev.includes(cred)
                ? prev.filter(c => c !== cred)
                : [...prev, cred]
        );
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!aceitouTermos || !confirmouDocumentos || !confirmouResponsabilidade) {
            alert('Você precisa aceitar todos os termos e confirmações');
            return;
        }

        if (!bancoSelecionado) {
            alert('Selecione o banco ou gateway desejado');
            return;
        }

        if (!possuiContrato) {
            alert('Informe se já possui contrato com o banco');
            return;
        }

        setLoading(true);
        try {
            const bancoNome = bancoSelecionado === 'outro' ? outroBanco : bancoInfo?.label;

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

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📌 **DADOS DO CONDOMÍNIO**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• **Condomínio:** ${condo?.nome || 'N/A'}
• **CNPJ:** ${cnpj}
• **Síndico:** ${nomeSindico}
• **Email:** ${emailContato}
• **Telefone:** ${telefone}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🏦 **DADOS DA INTEGRAÇÃO**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• **Banco/Gateway:** ${bancoNome}
• **Tipo:** ${isBancoTradicional ? 'Banco Tradicional' : isGateway ? 'Gateway de Pagamentos' : 'Outro'}
• **Já possui contrato:** ${possuiContrato === 'sim' ? 'SIM ✅' : possuiContrato === 'nao' ? 'NÃO ❌' : 'EM ANDAMENTO 🔄'}
${convenioNumero ? `• **Nº Convênio/Conta:** ${convenioNumero}` : ''}
• **Credenciais disponíveis:** ${tipoCredencial.length > 0 ? tipoCredencial.join(', ') : 'Não informado'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📝 **OBSERVAÇÕES**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${observacoes || 'Nenhuma'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ **CONFIRMAÇÕES DO CLIENTE**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Aceitou os termos de responsabilidade
✅ Confirmou ter documentação necessária
✅ Confirmou assumir responsabilidade financeira

⚠️ **AÇÃO NECESSÁRIA:**
O cliente deve enviar as credenciais e documentos para:
📧 implantacao@meucondominiofacil.com

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
                            Solicitação Enviada!
                        </h2>
                        <p className="text-emerald-700 mb-4">
                            Recebemos sua solicitação de integração de pagamentos.
                            Nossa equipe entrará em contato em até 48 horas úteis.
                        </p>
                    </CardContent>
                </Card>

                {/* Próximos Passos */}
                <Card className="border-blue-200 bg-blue-50">
                    <CardContent className="p-6">
                        <h3 className="font-bold text-blue-900 mb-4 flex items-center gap-2">
                            <Info className="h-5 w-5" />
                            📋 Próximos Passos - IMPORTANTE
                        </h3>
                        <div className="space-y-4 text-blue-800">
                            <div className="bg-white p-4 rounded-lg border border-blue-200">
                                <p className="font-semibold mb-2">1️⃣ Envie os documentos e credenciais para:</p>
                                <a
                                    href="mailto:implantacao@meucondominiofacil.com?subject=Documentos%20Integração%20-%20CNPJ%20{cnpj}"
                                    className="flex items-center gap-2 text-blue-600 hover:text-blue-800 font-mono bg-blue-100 p-3 rounded"
                                >
                                    <Send className="h-4 w-4" />
                                    implantacao@meucondominiofacil.com
                                    <ExternalLink className="h-4 w-4 ml-auto" />
                                </a>
                            </div>

                            <div className="bg-white p-4 rounded-lg border border-blue-200">
                                <p className="font-semibold mb-2">2️⃣ Documentos necessários:</p>
                                <ul className="text-sm space-y-1 ml-4">
                                    <li>• Comprovante de CNPJ ativo</li>
                                    <li>• Ata de eleição/documento do síndico</li>
                                    <li>• Credenciais de API do banco (Access Token, etc.)</li>
                                    {isBancoTradicional && (
                                        <>
                                            <li>• Certificado Digital A1 (.pfx) + senha</li>
                                            <li>• Contrato de cobrança com o banco</li>
                                        </>
                                    )}
                                </ul>
                            </div>

                            <div className="bg-amber-100 p-4 rounded-lg border border-amber-300">
                                <p className="text-amber-800 text-sm">
                                    <AlertTriangle className="h-4 w-4 inline mr-1" />
                                    <strong>Importante:</strong> A implantação só será iniciada após o recebimento de TODOS os documentos e confirmação do pagamento da taxa de implantação.
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <p className="text-center text-sm text-gray-500">
                    Você pode acompanhar o status pelo chat de suporte.
                </p>
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

            {/* Prazo de Implantação */}
            <Card className="bg-blue-50 border-blue-200">
                <CardContent className="p-4 flex items-center gap-4">
                    <div className="bg-blue-100 p-3 rounded-full">
                        <Clock className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                        <h4 className="font-semibold text-blue-900">Prazo de Implantação</h4>
                        <p className="text-sm text-blue-800">
                            <strong>Gateways (Mercado Pago, Asaas):</strong> 1-3 dias úteis |
                            <strong> Bancos tradicionais:</strong> 7-15 dias úteis
                        </p>
                    </div>
                </CardContent>
            </Card>

            {/* Formulário Expandido */}
            <form onSubmit={handleSubmit} className="space-y-6">

                {/* Seção 1: Dados do Condomínio */}
                <Card>
                    <CardContent className="p-6">
                        <h3 className="font-semibold text-gray-900 flex items-center gap-2 mb-4">
                            <Building2 className="h-5 w-5 text-emerald-500" />
                            1. Dados do Condomínio
                        </h3>

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
                    </CardContent>
                </Card>

                {/* Seção 2: Banco/Gateway */}
                <Card>
                    <CardContent className="p-6">
                        <h3 className="font-semibold text-gray-900 flex items-center gap-2 mb-4">
                            <CreditCard className="h-5 w-5 text-blue-500" />
                            2. Banco ou Gateway de Pagamentos
                        </h3>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Selecione o banco ou gateway *
                                </label>
                                <select
                                    value={bancoSelecionado}
                                    onChange={(e) => setBancoSelecionado(e.target.value)}
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                    required
                                >
                                    {BANCOS_GATEWAYS.map(banco => (
                                        <option key={banco.value} value={banco.value}>
                                            {banco.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {bancoSelecionado === 'outro' && (
                                <Input
                                    label="Especifique o banco/gateway *"
                                    value={outroBanco}
                                    onChange={(e) => setOutroBanco(e.target.value)}
                                    placeholder="Nome do banco ou gateway"
                                    required
                                />
                            )}

                            {bancoSelecionado && (
                                <>
                                    {/* Info sobre tipo selecionado */}
                                    {isBancoTradicional && (
                                        <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg">
                                            <p className="text-amber-800 text-sm">
                                                <AlertTriangle className="h-4 w-4 inline mr-1" />
                                                <strong>Bancos tradicionais</strong> exigem contrato de cobrança e certificado digital.
                                                O prazo de implantação é maior (7-15 dias úteis).
                                            </p>
                                        </div>
                                    )}

                                    {isGateway && (
                                        <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-lg">
                                            <p className="text-emerald-800 text-sm">
                                                <CheckCircle className="h-4 w-4 inline mr-1" />
                                                <strong>Gateways de pagamento</strong> têm integração mais rápida (1-3 dias úteis).
                                                Basta criar conta e obter as credenciais de API.
                                            </p>
                                        </div>
                                    )}

                                    {/* Contrato */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Você já possui conta/contrato ativo com este banco? *
                                        </label>
                                        <div className="flex flex-wrap gap-3">
                                            {[
                                                { value: 'sim', label: '✅ Sim, já tenho', color: 'emerald' },
                                                { value: 'nao', label: '❌ Não tenho', color: 'red' },
                                                { value: 'em_andamento', label: '🔄 Estou solicitando', color: 'amber' },
                                            ].map(opt => (
                                                <button
                                                    key={opt.value}
                                                    type="button"
                                                    onClick={() => setPossuiContrato(opt.value as typeof possuiContrato)}
                                                    className={`px-4 py-2 rounded-lg border-2 transition-all ${possuiContrato === opt.value
                                                            ? `border-${opt.color}-500 bg-${opt.color}-50 text-${opt.color}-700`
                                                            : 'border-gray-200 hover:border-gray-300'
                                                        }`}
                                                >
                                                    {opt.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {possuiContrato === 'nao' && (
                                        <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
                                            <p className="text-red-800 text-sm">
                                                <AlertTriangle className="h-4 w-4 inline mr-1" />
                                                <strong>Atenção:</strong> Você precisa primeiro abrir conta/contrato com o banco antes de solicitar a integração.
                                                Entre em contato com o gerente do banco para habilitar o serviço de cobrança via API.
                                            </p>
                                        </div>
                                    )}

                                    {/* Convênio */}
                                    {(possuiContrato === 'sim' || possuiContrato === 'em_andamento') && (
                                        <Input
                                            label="Número do Convênio/Conta (se já possui)"
                                            value={convenioNumero}
                                            onChange={(e) => setConvenioNumero(e.target.value)}
                                            placeholder="Ex: 1234567"
                                        />
                                    )}

                                    {/* Credenciais disponíveis */}
                                    {possuiContrato === 'sim' && (
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Quais credenciais você já possui? (marque as aplicáveis)
                                            </label>
                                            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                                {[
                                                    'Access Token',
                                                    'Public Key',
                                                    'Client ID',
                                                    'Client Secret',
                                                    'API Key',
                                                    'Certificado A1 (.pfx)',
                                                    'OAuth Credentials',
                                                    'Usuário API',
                                                    'Senha API',
                                                ].map(cred => (
                                                    <label
                                                        key={cred}
                                                        className={`flex items-center gap-2 p-2 rounded border cursor-pointer transition-all ${tipoCredencial.includes(cred)
                                                                ? 'border-emerald-500 bg-emerald-50'
                                                                : 'border-gray-200 hover:border-gray-300'
                                                            }`}
                                                    >
                                                        <input
                                                            type="checkbox"
                                                            checked={tipoCredencial.includes(cred)}
                                                            onChange={() => toggleCredencial(cred)}
                                                            className="rounded text-emerald-500"
                                                        />
                                                        <span className="text-sm">{cred}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Seção 3: Observações */}
                <Card>
                    <CardContent className="p-6">
                        <h3 className="font-semibold text-gray-900 flex items-center gap-2 mb-4">
                            <FileText className="h-5 w-5 text-gray-500" />
                            3. Observações Adicionais
                        </h3>
                        <Textarea
                            value={observacoes}
                            onChange={(e) => setObservacoes(e.target.value)}
                            rows={3}
                            placeholder="Dúvidas, preferências de horário para contato, informações adicionais..."
                        />
                    </CardContent>
                </Card>

                {/* Seção 4: Termos de Responsabilidade */}
                <Card className="border-amber-200 bg-amber-50">
                    <CardContent className="p-6">
                        <h3 className="font-semibold text-amber-800 flex items-center gap-2 mb-4">
                            <Shield className="h-5 w-5" />
                            4. Termos de Responsabilidade do Cliente
                        </h3>

                        <div className="text-sm text-amber-900 space-y-4">
                            <p>Ao solicitar a integração de pagamentos, o síndico e o condomínio declaram e concordam que:</p>

                            <div className="bg-white p-4 rounded border border-amber-300 space-y-3">
                                <p><strong>1. Responsabilidade Financeira Total</strong><br />
                                    Todos os pagamentos recebidos através da integração são de <u>exclusiva responsabilidade do condomínio</u>.
                                    O sistema Condomínio Fácil atua apenas como interface tecnológica, não tendo qualquer responsabilidade sobre
                                    valores recebidos, estornos, contestações, chargebacks ou inadimplência.</p>

                                <p><strong>2. Credenciais e Segurança</strong><br />
                                    O síndico é responsável por criar e manter segura a conta bancária/gateway do condomínio.
                                    As credenciais fornecidas (Access Token, Certificados, etc.) são de uso exclusivo e confidencial.
                                    A plataforma armazena essas credenciais de forma segura e criptografada, mas não se responsabiliza
                                    por uso indevido decorrente de vazamento por parte do cliente.</p>

                                <p><strong>3. Taxas e Custos Bancários</strong><br />
                                    As taxas cobradas pelo banco/gateway (por PIX, boleto, cartão) são de responsabilidade do condomínio
                                    e serão descontadas diretamente dos recebimentos. A taxa de implantação cobrada pelo Condomínio Fácil
                                    refere-se exclusivamente ao serviço de configuração e suporte técnico.</p>

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
                                        <p><strong>4. Conformidade Legal</strong><br />
                                            O condomínio declara estar em conformidade com todas as obrigações fiscais e legais,
                                            incluindo emissão de recibos, prestação de contas em assembleia, cumprimento da convenção
                                            condominial e conformidade com a LGPD.</p>

                                        <p><strong>5. Documentação Obrigatória</strong><br />
                                            O cliente compromete-se a fornecer toda documentação solicitada (CNPJ, ata de eleição,
                                            credenciais de API, certificados digitais) no prazo de 7 dias úteis. A implantação só
                                            será iniciada após recebimento completo.</p>

                                        <p><strong>6. Manutenção da Conta</strong><br />
                                            O condomínio deve manter a conta bancária ativa, renovar certificados antes do vencimento,
                                            e comunicar imediatamente qualquer alteração (mudança de síndico, encerramento de conta, etc.).</p>

                                        <p><strong>7. Suporte e Manutenção</strong><br />
                                            A integração inclui suporte técnico para configuração inicial e 30 dias de suporte prioritário.
                                            Alterações de credenciais, migração de banco ou reconfigurações podem estar sujeitas a cobrança adicional.</p>

                                        <p><strong>8. Encerramento</strong><br />
                                            O condomínio pode solicitar a remoção da integração a qualquer momento.
                                            Isso não afeta pagamentos já processados ou em processamento.</p>
                                    </>
                                )}
                            </div>

                            {/* Checkboxes de confirmação */}
                            <div className="space-y-3 pt-4">
                                <label className="flex items-start gap-3 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={confirmouDocumentos}
                                        onChange={(e) => setConfirmouDocumentos(e.target.checked)}
                                        className="mt-1 h-5 w-5 rounded border-amber-400 text-emerald-600 focus:ring-emerald-500"
                                    />
                                    <span className="text-amber-900">
                                        <strong>Confirmo</strong> que possuo ou irei providenciar toda a documentação necessária
                                        (CNPJ, ata de eleição, credenciais de API do banco).
                                    </span>
                                </label>

                                <label className="flex items-start gap-3 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={confirmouResponsabilidade}
                                        onChange={(e) => setConfirmouResponsabilidade(e.target.checked)}
                                        className="mt-1 h-5 w-5 rounded border-amber-400 text-emerald-600 focus:ring-emerald-500"
                                    />
                                    <span className="text-amber-900">
                                        <strong>Confirmo</strong> que o condomínio assume total responsabilidade financeira
                                        pelos valores recebidos, taxas bancárias e qualquer disputa com pagadores.
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
                                        Confirmo que tenho autorização para representar o condomínio nesta solicitação.
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
                                    <Zap className="h-6 w-6 text-emerald-600" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-gray-900">Taxa de Implantação</h4>
                                    <p className="text-sm text-gray-500">Pagamento único</p>
                                </div>
                                <div className="text-3xl font-bold text-emerald-700">
                                    R$ 999,00
                                </div>
                                <ul className="text-sm text-gray-600 space-y-2 text-left bg-white p-4 rounded-lg border border-emerald-100">
                                    <li className="flex items-center gap-2">✅ Configuração completa</li>
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
                                    <p className="text-sm text-gray-500">Valor recorrente fixo</p>
                                </div>
                                <div className="space-y-2">
                                    <div className="text-3xl font-bold text-blue-700">
                                        R$ 199,00 <span className="text-sm font-normal text-gray-500">/mês</span>
                                    </div>
                                    <p className="text-xs text-gray-500">Preço único para qualquer tamanho de condomínio</p>
                                </div>
                                <ul className="text-sm text-gray-600 space-y-2 text-left bg-white p-4 rounded-lg border border-blue-100">
                                    <li className="flex items-center gap-2">✅ Geração Ilimitada de Boletos/PIX</li>
                                    <li className="flex items-center gap-2">✅ Conciliação Automática</li>
                                    <li className="flex items-center gap-2">✅ Relatórios Financeiros</li>
                                    <li className="flex items-center gap-2">✅ Suporte Técnico Contínuo</li>
                                </ul>
                            </CardContent>
                        </Card>
                    </div>

                    <p className="text-center text-xs text-gray-500">
                        * Valores podem variar conforme complexidade. Bancos tradicionais podem ter custo adicional de implantação.
                    </p>
                </div>

                {/* Botão de Envio */}
                <div className="pt-4">
                    <Button
                        type="submit"
                        loading={loading}
                        disabled={!aceitouTermos || !confirmouDocumentos || !confirmouResponsabilidade || !bancoSelecionado || possuiContrato === 'nao'}
                        className="w-full"
                    >
                        <Send className="h-4 w-4 mr-2" />
                        Enviar Solicitação
                    </Button>

                    {(!aceitouTermos || !confirmouDocumentos || !confirmouResponsabilidade) && (
                        <p className="text-center text-sm text-amber-600 mt-2">
                            <AlertTriangle className="h-4 w-4 inline mr-1" />
                            Aceite todos os termos e confirmações para continuar
                        </p>
                    )}

                    {possuiContrato === 'nao' && (
                        <p className="text-center text-sm text-red-600 mt-2">
                            <AlertTriangle className="h-4 w-4 inline mr-1" />
                            Você precisa ter contrato ativo com o banco para solicitar a integração
                        </p>
                    )}
                </div>
            </form>
        </div>
    );
}
