'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Building2, ArrowLeft, FileText, Download } from 'lucide-react';

export default function TermosPage() {
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
                        <FileText className="h-8 w-8 text-emerald-600" />
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Termos de Uso</h1>
                            <p className="text-sm text-gray-500">Última atualização: Dezembro de 2025</p>
                        </div>
                    </div>

                    <div className="prose prose-emerald max-w-none text-gray-700">
                        <p className="lead">
                            Bem-vindo ao Condomínio Fácil. Ao utilizar nossa plataforma, você concorda inteiramente com estes termos.
                            Por favor, leia-os atentamente.
                        </p>

                        <h2>1. Objeto e Aceitação</h2>
                        <p>
                            Estes Termos de Uso regem o acesso e a utilização da plataforma "Condomínio Fácil", um sistema SaaS de gestão condominial de propriedade da Robsonodex (CNPJ: 57.444.727/0001-85).
                            O uso do sistema implica na aceitação plena e sem reservas de todos os itens aqui descritos.
                        </p>

                        <h2>2. Cadastro e Responsabilidade</h2>
                        <p>
                            Para utilizar as funcionalidades do sistema, o usuário deve realizar um cadastro fornecendo dados verídicos.
                            A responsabilidade pela guarda das credenciais de acesso é exclusiva do usuário.
                            O Condomínio Fácil não se responsabiliza por acessos não autorizados decorrentes da má gestão de senhas pelo usuário.
                        </p>

                        <h2>3. Uso do Sistema e Mensageria</h2>
                        <p>
                            O sistema oferece integração com serviços de mensageria (WhatsApp, E-mail).
                            O usuário é o único responsável pelo conteúdo das mensagens enviadas. É terminantemente proibido o uso do sistema para:
                        </p>
                        <ul>
                            <li>Envio de SPAM ou mensagens abusivas/ilegais;</li>
                            <li>Assédio moral ou divulgação de dados sensíveis de terceiros;</li>
                            <li>Qualquer atividade que viole as leis brasileiras vigentes.</li>
                        </ul>

                        <h2>4. Disponibilidade e Suporte</h2>
                        <p>
                            Nós nos empenhamos para manter o sistema online 24 horas por dia, 7 dias por semana, com um uptime alvo de 99,9%.
                            No entanto, interrupções podem ocorrer por manutenções programadas ou fatores externos.
                            O suporte técnico é prestado em dias úteis, em horário comercial, conforme o plano contratado.
                        </p>

                        <h2>5. Propriedade Intelectual</h2>
                        <p>
                            Todo o software, design, algoritmos (incluindo IA baseada em Llama 3) e logotipos são de propriedade exclusiva da robsonodex.
                            A licença de uso é intransferível e não confere ao usuário qualquer direito de copiar, modificar ou realizar engenharia reversa no sistema.
                        </p>

                        <h2>6. Proteção de Dados (LGPD)</h2>
                        <p>
                            Tratamos seus dados com o mais alto rigor de segurança, seguindo a Lei Geral de Proteção de Dados (L13.709/2018).
                            Não comercializamos seus dados. Eles são usados exclusivamente para a execução do serviço contratado.
                        </p>

                        <h2>7. Assinatura e Cancelamento</h2>
                        <p>
                            A assinatura é renovada mensalmente. O cancelamento pode ser solicitado a qualquer momento sem multa,
                            interrompendo a próxima cobrança. Não há reembolso de períodos já pagos e utilizados.
                        </p>

                        <h2>8. Modificações dos Termos</h2>
                        <p>
                            Reservamo-nos o direito de atualizar estes termos periodicamente para refletir melhorias no sistema ou mudanças legais.
                            O uso continuado do sistema após alterações constitui aceitação dos novos termos.
                        </p>

                        <h2>9. Contato e Foro</h2>
                        <p>
                            Para suporte: <a href="mailto:contato@meucondominiofacil.com">contato@meucondominiofacil.com</a>.
                            Fica eleito o foro da comarca de Juazeiro do Norte/CE para dirimir controvérsias deste instrumento.
                        </p>
                    </div>

                    {/* Footer */}
                    <div className="mt-8 pt-6 border-t flex items-center justify-between">
                        <p className="text-sm text-gray-500">
                            Ao usar o sistema, você concorda com estes termos.
                        </p>
                        <Link href="/privacidade" className="text-sm text-emerald-600 hover:underline">
                            Ver Política de Privacidade →
                        </Link>
                    </div>
                </div>
            </main>
        </div>
    );
}
