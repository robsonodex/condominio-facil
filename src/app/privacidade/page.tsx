'use client';

import Link from 'next/link';
import { Building2, ArrowLeft, Shield } from 'lucide-react';

export default function PrivacidadePage() {
    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white border-b">
                <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-lg flex items-center justify-center">
                            <Building2 className="h-5 w-5 text-white" />
                        </div>
                        <span className="font-bold text-gray-900">Condomínio Fácil</span>
                    </Link>
                    <Link href="/login" className="text-sm text-emerald-600 hover:underline flex items-center gap-1">
                        <ArrowLeft className="h-4 w-4" />
                        Voltar ao login
                    </Link>
                </div>
            </header>

            {/* Content */}
            <main className="max-w-4xl mx-auto px-4 py-8">
                <div className="bg-white rounded-xl shadow-sm p-8">
                    <div className="flex items-center gap-3 mb-6">
                        <Shield className="h-8 w-8 text-emerald-600" />
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Política de Privacidade</h1>
                            <p className="text-sm text-gray-500">Em conformidade com a LGPD - Lei nº 13.709/2018</p>
                        </div>
                    </div>

                    <div className="prose prose-emerald max-w-none text-gray-700">
                        <p className="lead">
                            O Condomínio Fácil, operado pela Robsonodex (CNPJ: 57.444.727/0001-85), está comprometido com a transparência e a segurança dos seus dados.
                            Esta política detalha como tratamos suas informações em conformidade com a LGPD.
                        </p>

                        <h2>1. Coleta de Dados</h2>
                        <p>Coletamos dados necessários para a operação do sistema:</p>
                        <ul>
                            <li><strong>Dados Pessoais:</strong> Nome, CPF, e-mail e telefone para identificação e login;</li>
                            <li><strong>Dados Condominiais:</strong> Endereço, número da unidade e histórico de pagamentos/reservas;</li>
                            <li><strong>Dados de Portaria:</strong> Nomes e documentos de visitantes, placas de veículos e fotos de encomendas;</li>
                            <li><strong>Logs de Auditoria:</strong> Registramos IP, data e hora de ações críticas para segurança do condomínio.</li>
                        </ul>

                        <h2>2. Finalidade do Tratamento</h2>
                        <p>Os dados são processados exclusivamente para:</p>
                        <ul>
                            <li>Gestão administrativa e financeira do condomínio;</li>
                            <li>Segurança e controle de acesso (Portaria);</li>
                            <li>Envio de notificações de serviço (Avisos, Boletos e Encomendas);</li>
                            <li>Melhoria contínua da experiência do usuário via IA.</li>
                        </ul>

                        <h2>3. Compartilhamento Seguro</h2>
                        <p>
                            Não vendemos dados de usuários para terceiros. O compartilhamento ocorre apenas com parceiros essenciais:
                        </p>
                        <ul>
                            <li><strong>Supabase:</strong> Armazenamento de banco de dados criptografado;</li>
                            <li><strong>Vercel:</strong> Hospedagem da plataforma;</li>
                            <li><strong>Mercado Pago / Bancos:</strong> Processamento de pagamentos;</li>
                            <li><strong>Evolution API:</strong> Intermediação técnica para mensagens via WhatsApp.</li>
                        </ul>

                        <h2>4. Direitos do Titular</h2>
                        <p>
                            Em conformidade com o Art. 18 da LGPD, você pode solicitar a qualquer momento: confirmação da existência de tratamento, acesso, correção, anonimização ou exclusão de dados desnecessários.
                            Solicitações devem ser enviadas para <a href="mailto:privacidade@meucondominiofacil.com">privacidade@meucondominiofacil.com</a>.
                        </p>

                        <h2>5. Segurança e Retenção</h2>
                        <p>
                            Utilizamos criptografia de ponta (SSL/TLS) e backups redundantes.
                            Os dados são mantidos enquanto a assinatura estiver ativa. Em caso de cancelamento,
                            os dados são eliminados definitivamente após 30 dias (período de carência para recuperação), exceto quando a retenção for exigida por lei.
                        </p>

                        <h2>6. Foro e Legislação</h2>
                        <p>
                            Esta política é regida pelas leis da República Federativa do Brasil.
                            Qualquer disputa será resolvida no foro da comarca de Juazeiro do Norte/CE.
                        </p>
                    </div>

                    {/* Footer */}
                    <div className="mt-8 pt-6 border-t flex items-center justify-between">
                        <Link href="/termos" className="text-sm text-emerald-600 hover:underline">
                            ← Termos de Uso
                        </Link>
                        <Link href="/contrato" className="text-sm text-emerald-600 hover:underline">
                            Contrato de Serviço →
                        </Link>
                    </div>
                </div>
            </main>
        </div>
    );
}
