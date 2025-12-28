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

                    <div className="prose prose-emerald max-w-none text-gray-700">
                        <h2 className="text-center text-gray-900">CONTRATO DE LICENÇA DE USO DE SOFTWARE (SaaS)</h2>

                        <p>
                            Pelo presente instrumento particular, as partes abaixo qualificadas têm entre si justo e contratado o seguinte:
                        </p>

                        <h3>CLÁUSULA 1 - DAS PARTES</h3>
                        <p>
                            <strong>CONTRATADA:</strong> Robsonodex, inscrita no CNPJ sob nº 57.444.727/0001-85, com sede administrativa no Brasil, doravante denominada simplesmente "CONTRATADA".
                        </p>
                        <p>
                            <strong>CONTRATANTE:</strong> A pessoa física ou jurídica identificada no ato do cadastro e aceite digital, doravante denominada simplesmente "CONTRATANTE".
                        </p>

                        <h3>CLÁUSULA 2 - DO OBJETO</h3>
                        <p>
                            2.1. O objeto deste contrato é a licença de uso, não exclusiva e intransferível, da plataforma "Condomínio Fácil", incluindo suporte técnico e armazenamento de dados em nuvem.
                        </p>
                        <p>
                            2.2. A CONTRATADA reserva-se o direito de atualizar o software para melhorias funcionais e de segurança sem aviso prévio, desde que mantida a finalidade principal do serviço.
                        </p>

                        <h3>CLÁUSULA 3 - VALORES E ASSINATURA</h3>
                        <p>
                            3.1. O CONTRATANTE pagará os valores referentes ao plano escolhido (Básico, Plus ou Pro).
                            Valores vigentes estão sempre atualizados na página `/upgrade` da plataforma.
                        </p>
                        <p>
                            3.2. A inadimplência superior a 10 dias autoriza a suspensão total do acesso ao sistema.
                            Após 30 dias de atraso, o presente contrato será rescindido de pleno direito com exclusão definitiva dos dados.
                        </p>

                        <h3>CLÁUSULA 4 - DISPONIBILIDADE (SLA)</h3>
                        <p>
                            4.1. A CONTRATADA garante uma disponibilidade (uptime) do sistema de 99%, salvo interrupções decorrentes de falhas na infraestrutura global de internet ou provedores de nuvem (Vercel/Supabase).
                        </p>

                        <h3>CLÁUSULA 5 - PROTEÇÃO DE DADOS E LGPD</h3>
                        <p>
                            5.1. Ambas as partes comprometem-se a cumprir a Lei Geral de Proteção de Dados (L13.709/18).
                            A CONTRATADA atua como operadora dos dados inseridos pelo CONTRATANTE, que permanece como controlador dos mesmos.
                        </p>

                        <h3>CLÁUSULA 6 - RESCISÃO</h3>
                        <p>
                            6.1. O presente contrato pode ser rescindido por qualquer das partes a qualquer momento, mediante cancelamento da assinatura digital no painel do sistema, sem incidência de multas rescisórias.
                        </p>

                        <h3>CLÁUSULA 7 - DO FORO</h3>
                        <p>
                            7.1. Fica eleito o foro da comarca de Juazeiro do Norte/CE como o único competente para dirimir quaisquer dúvidas ou controvérsias oriundas deste contrato.
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
