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

                    <div className="prose prose-emerald max-w-none">
                        <h2>1. Aceitação dos Termos</h2>
                        <p>
                            Ao acessar e usar o sistema Condomínio Fácil, você concorda em cumprir estes Termos de Uso.
                            Se você não concordar com qualquer parte destes termos, não deve usar nosso serviço.
                        </p>

                        <h2>2. Descrição do Serviço</h2>
                        <p>
                            O Condomínio Fácil é uma plataforma SaaS (Software as a Service) para gestão de condomínios,
                            oferecendo funcionalidades como controle financeiro, gestão de moradores, comunicação e relatórios.
                        </p>

                        <h2>3. Cadastro e Conta</h2>
                        <p>
                            Para utilizar o sistema, você deve fornecer informações verdadeiras, completas e atualizadas.
                            Você é responsável por manter a confidencialidade de sua senha e por todas as atividades
                            realizadas em sua conta.
                        </p>

                        <h2>4. Assinatura e Pagamento</h2>
                        <p>
                            O acesso ao sistema requer uma assinatura paga após o período de teste gratuito.
                            Os planos e preços estão disponíveis em nosso site. O não pagamento pode resultar
                            na suspensão temporária ou cancelamento do serviço.
                        </p>

                        <h2>5. Uso Aceitável</h2>
                        <p>Você concorda em não:</p>
                        <ul>
                            <li>Usar o sistema para fins ilegais ou não autorizados</li>
                            <li>Compartilhar sua conta com terceiros não autorizados</li>
                            <li>Tentar acessar áreas restritas do sistema</li>
                            <li>Copiar, modificar ou distribuir o software</li>
                            <li>Sobrecarregar ou interferir no funcionamento do sistema</li>
                        </ul>

                        <h2>6. Propriedade Intelectual</h2>
                        <p>
                            Todo o conteúdo do sistema, incluindo código, design, textos e imagens,
                            é propriedade exclusiva do Condomínio Fácil e protegido por leis de direitos autorais.
                        </p>

                        <h2>7. Privacidade</h2>
                        <p>
                            A coleta e uso de dados pessoais estão descritos em nossa Política de Privacidade,
                            que faz parte integrante destes Termos de Uso.
                        </p>

                        <h2>8. Limitação de Responsabilidade</h2>
                        <p>
                            O Condomínio Fácil não se responsabiliza por danos indiretos, incidentais ou consequenciais
                            decorrentes do uso ou impossibilidade de uso do sistema.
                        </p>

                        <h2>9. Modificações</h2>
                        <p>
                            Reservamo-nos o direito de modificar estes termos a qualquer momento.
                            Alterações significativas serão comunicadas por email.
                        </p>

                        <h2>10. Contato</h2>
                        <p>
                            Para dúvidas sobre estes Termos de Uso, entre em contato pelo email:
                            <a href="mailto:contato@condominiofacil.com.br"> contato@condominiofacil.com.br</a>
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
