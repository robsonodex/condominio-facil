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

                    <div className="prose prose-emerald max-w-none">
                        <h2>1. Introdução</h2>
                        <p>
                            Esta Política de Privacidade descreve como o Condomínio Fácil coleta, usa, armazena e protege
                            seus dados pessoais, em conformidade com a Lei Geral de Proteção de Dados (LGPD).
                        </p>

                        <h2>2. Dados Coletados</h2>
                        <p>Coletamos os seguintes tipos de dados:</p>
                        <ul>
                            <li><strong>Dados de cadastro:</strong> nome, email, telefone, CPF/CNPJ</li>
                            <li><strong>Dados do condomínio:</strong> nome, endereço, unidades, moradores</li>
                            <li><strong>Dados de uso:</strong> logs de acesso, ações realizadas no sistema</li>
                            <li><strong>Dados de pagamento:</strong> informações necessárias para cobrança</li>
                        </ul>

                        <h2>3. Finalidade do Tratamento</h2>
                        <p>Seus dados são utilizados para:</p>
                        <ul>
                            <li>Prestação do serviço de gestão condominial</li>
                            <li>Comunicação sobre o serviço (avisos, cobranças)</li>
                            <li>Melhoria contínua da plataforma</li>
                            <li>Cumprimento de obrigações legais</li>
                        </ul>

                        <h2>4. Base Legal</h2>
                        <p>
                            O tratamento de dados é realizado com base no consentimento do titular,
                            execução de contrato e cumprimento de obrigação legal (Art. 7º da LGPD).
                        </p>

                        <h2>5. Compartilhamento de Dados</h2>
                        <p>
                            Seus dados podem ser compartilhados com:
                        </p>
                        <ul>
                            <li>Processadores de pagamento (Mercado Pago, bancos)</li>
                            <li>Provedores de infraestrutura (Vercel, Supabase)</li>
                            <li>Autoridades públicas, quando exigido por lei</li>
                        </ul>

                        <h2>6. Segurança</h2>
                        <p>
                            Adotamos medidas técnicas e organizacionais para proteger seus dados, incluindo:
                            criptografia, controle de acesso, backups e monitoramento.
                        </p>

                        <h2>7. Retenção de Dados</h2>
                        <p>
                            Os dados são mantidos pelo período necessário para prestação do serviço e
                            cumprimento de obrigações legais, sendo eliminados após esse período.
                        </p>

                        <h2>8. Direitos do Titular</h2>
                        <p>Você tem direito a:</p>
                        <ul>
                            <li>Confirmar a existência de tratamento</li>
                            <li>Acessar seus dados</li>
                            <li>Corrigir dados incompletos ou incorretos</li>
                            <li>Solicitar anonimização ou eliminação</li>
                            <li>Revogar o consentimento</li>
                            <li>Portabilidade dos dados</li>
                        </ul>

                        <h2>9. Cookies</h2>
                        <p>
                            Utilizamos cookies essenciais para funcionamento do sistema e cookies analíticos
                            para melhorar a experiência do usuário. Você pode gerenciar cookies no seu navegador.
                        </p>

                        <h2>10. Encarregado de Dados (DPO)</h2>
                        <p>
                            Para exercer seus direitos ou esclarecer dúvidas, entre em contato com nosso
                            Encarregado de Dados pelo email: <a href="mailto:privacidade@condominiofacil.com.br">privacidade@condominiofacil.com.br</a>
                        </p>

                        <h2>11. Alterações</h2>
                        <p>
                            Esta política pode ser atualizada periodicamente. Alterações significativas
                            serão comunicadas por email ou através do sistema.
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
