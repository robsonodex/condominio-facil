'use client';

import Link from 'next/link';
import { Building2, ArrowLeft, FileSignature } from 'lucide-react';

export default function ContratoPage() {
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
                        <FileSignature className="h-8 w-8 text-emerald-600" />
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Contrato de Prestação de Serviço</h1>
                            <p className="text-sm text-gray-500">Versão 1.0 - Dezembro de 2025</p>
                        </div>
                    </div>

                    <div className="prose prose-emerald max-w-none">
                        <h2>CONTRATO DE LICENÇA E PRESTAÇÃO DE SERVIÇOS DE SOFTWARE</h2>

                        <p>
                            Pelo presente instrumento particular, as partes abaixo qualificadas têm entre si
                            justo e contratado o seguinte:
                        </p>

                        <h3>CLÁUSULA 1 - DAS PARTES</h3>
                        <p>
                            <strong>CONTRATADA:</strong> Condomínio Fácil Tecnologia Ltda, inscrita no CNPJ sob nº 00.000.000/0001-00,
                            com sede na cidade de Juazeiro do Norte/CE.
                        </p>
                        <p>
                            <strong>CONTRATANTE:</strong> A pessoa física ou jurídica identificada no cadastro do sistema.
                        </p>

                        <h3>CLÁUSULA 2 - DO OBJETO</h3>
                        <p>
                            2.1. O presente contrato tem por objeto a licença de uso do software "Condomínio Fácil"
                            para gestão condominial, na modalidade SaaS (Software as a Service).
                        </p>
                        <p>
                            2.2. A licença inclui acesso à plataforma online, atualizações, suporte técnico e
                            armazenamento de dados conforme o plano contratado.
                        </p>

                        <h3>CLÁUSULA 3 - DO PRAZO</h3>
                        <p>
                            3.1. O contrato terá vigência enquanto houver assinatura ativa, renovada automaticamente
                            a cada período de faturamento (mensal ou anual).
                        </p>
                        <p>
                            3.2. O período de teste gratuito é de 7 (sete) dias, sem compromisso.
                        </p>

                        <h3>CLÁUSULA 4 - DO PREÇO E PAGAMENTO</h3>
                        <p>
                            4.1. O CONTRATANTE pagará à CONTRATADA o valor correspondente ao plano escolhido,
                            conforme tabela de preços vigente.
                        </p>
                        <p>
                            4.2. O pagamento poderá ser realizado via PIX, cartão de crédito ou boleto bancário.
                        </p>
                        <p>
                            4.3. O não pagamento até a data de vencimento acarretará:
                        </p>
                        <ul>
                            <li>Após 5 dias: notificação por email</li>
                            <li>Após 10 dias: suspensão do acesso</li>
                            <li>Após 30 dias: cancelamento do contrato</li>
                        </ul>

                        <h3>CLÁUSULA 5 - DAS OBRIGAÇÕES DA CONTRATADA</h3>
                        <p>A CONTRATADA se obriga a:</p>
                        <ul>
                            <li>Manter o sistema disponível 24/7 (excepto manutenções programadas)</li>
                            <li>Realizar backups diários dos dados</li>
                            <li>Prestar suporte técnico em horário comercial</li>
                            <li>Manter sigilo sobre os dados do CONTRATANTE</li>
                        </ul>

                        <h3>CLÁUSULA 6 - DAS OBRIGAÇÕES DO CONTRATANTE</h3>
                        <p>O CONTRATANTE se obriga a:</p>
                        <ul>
                            <li>Efetuar os pagamentos pontualmente</li>
                            <li>Utilizar o sistema de forma lícita</li>
                            <li>Manter seus dados cadastrais atualizados</li>
                            <li>Não compartilhar credenciais de acesso</li>
                        </ul>

                        <h3>CLÁUSULA 7 - DA RESCISÃO</h3>
                        <p>
                            7.1. O CONTRATANTE pode cancelar a assinatura a qualquer momento, sem multa.
                        </p>
                        <p>
                            7.2. Após o cancelamento, os dados serão mantidos por 30 dias para possível reativação,
                            sendo eliminados após esse período.
                        </p>

                        <h3>CLÁUSULA 8 - DA PROPRIEDADE INTELECTUAL</h3>
                        <p>
                            O software Condomínio Fácil é de propriedade exclusiva da CONTRATADA.
                            A licença concedida não transfere qualquer direito de propriedade intelectual.
                        </p>

                        <h3>CLÁUSULA 9 - DO FORO</h3>
                        <p>
                            Fica eleito o foro da comarca de Juazeiro do Norte/CE para dirimir quaisquer
                            questões oriundas deste contrato.
                        </p>
                    </div>

                    {/* Footer */}
                    <div className="mt-8 pt-6 border-t flex items-center justify-between">
                        <Link href="/privacidade" className="text-sm text-emerald-600 hover:underline">
                            ← Política de Privacidade
                        </Link>
                        <Link href="/register" className="text-sm text-emerald-600 hover:underline">
                            Criar conta →
                        </Link>
                    </div>
                </div>
            </main>
        </div>
    );
}
