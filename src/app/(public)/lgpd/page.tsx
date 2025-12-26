import { Building2, Shield, Mail, Phone, FileText, Lock, Users, Database, Eye, Trash2, Download } from 'lucide-react';
import Link from 'next/link';

export const metadata = {
    title: 'LGPD - Proteção de Dados | Meu Condomínio Fácil',
    description: 'Política de Proteção de Dados Pessoais conforme a Lei Geral de Proteção de Dados (LGPD). Saiba como tratamos seus dados.',
};

export default function LGPDPage() {
    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white border-b border-gray-200">
                <div className="max-w-4xl mx-auto px-4 py-6">
                    <Link href="/landing" className="flex items-center gap-2 mb-4 text-emerald-600 hover:text-emerald-700">
                        <Building2 className="h-6 w-6" />
                        <span className="font-bold text-lg">Meu Condomínio Fácil</span>
                    </Link>
                    <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                        <Shield className="h-8 w-8 text-blue-600" />
                        Política de Proteção de Dados (LGPD)
                    </h1>
                    <p className="text-gray-600 mt-2">
                        CNPJ: 57.444.727/0001-85 | Versão 1.0 | Vigência: 17/12/2025
                    </p>
                </div>
            </header>

            {/* Content */}
            <main className="max-w-4xl mx-auto px-4 py-12">
                <div className="bg-white rounded-2xl shadow-lg p-8 space-y-12">

                    {/* Introdução */}
                    <section>
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Introdução</h2>
                        <p className="text-gray-700 leading-relaxed">
                            A <strong>Meu Condomínio Fácil</strong>, pessoa jurídica inscrita no CNPJ
                            <strong> 57.444.727/0001-85</strong>, na qualidade de <strong>Controladora de Dados</strong>,
                            compromete-se a proteger a privacidade e os dados pessoais de seus usuários em conformidade
                            com a Lei Geral de Proteção de Dados Pessoais (Lei nº 13.709/2018 - LGPD).
                        </p>
                    </section>

                    {/* Dados que Coletamos */}
                    <section>
                        <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <Database className="h-6 w-6 text-blue-600" />
                            2. Dados que Coletamos
                        </h2>

                        <div className="space-y-6">
                            <div className="bg-gray-50 rounded-lg p-6">
                                <h3 className="font-bold text-gray-900 mb-3">Dados do Síndico/Administrador</h3>
                                <ul className="space-y-2 text-gray-700">
                                    <li>• Nome completo - para identificação</li>
                                    <li>• E-mail - para comunicação e autenticação</li>
                                    <li>• Telefone - para suporte</li>
                                    <li>• CPF/CNPJ - para emissão de nota fiscal</li>
                                </ul>
                            </div>

                            <div className="bg-gray-50 rounded-lg p-6">
                                <h3 className="font-bold text-gray-900 mb-3">Dados dos Moradores (inseridos pelo síndico)</h3>
                                <ul className="space-y-2 text-gray-700">
                                    <li>• Nome, e-mail, telefone, CPF</li>
                                    <li>• Unidade/apartamento</li>
                                    <li>• Dados de cobranças</li>
                                </ul>
                            </div>

                            <div className="bg-gray-50 rounded-lg p-6">
                                <h3 className="font-bold text-gray-900 mb-3">Dados de Visitantes (Portaria)</h3>
                                <ul className="space-y-2 text-gray-700">
                                    <li>• Nome, documento (RG/CPF)</li>
                                    <li>• Foto (opcional)</li>
                                    <li>• Placa de veículo, data/hora de entrada/saída</li>
                                </ul>
                            </div>
                        </div>
                    </section>

                    {/* Seus Direitos */}
                    <section>
                        <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <Users className="h-6 w-6 text-emerald-600" />
                            3. Seus Direitos (LGPD Art. 18)
                        </h2>

                        <div className="grid md:grid-cols-2 gap-4">
                            {[
                                { icon: Eye, title: 'Acesso', desc: 'Obter cópia dos seus dados' },
                                { icon: FileText, title: 'Correção', desc: 'Corrigir dados incompletos' },
                                { icon: Trash2, title: 'Eliminação', desc: 'Solicitar exclusão de dados' },
                                { icon: Download, title: 'Portabilidade', desc: 'Receber dados em formato estruturado' },
                                { icon: Lock, title: 'Revogação', desc: 'Revogar consentimento' },
                                { icon: Shield, title: 'Oposição', desc: 'Opor-se a certos tratamentos' },
                            ].map((item, index) => (
                                <div key={index} className="flex items-start gap-3 p-4 bg-emerald-50 rounded-lg">
                                    <item.icon className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                                    <div>
                                        <p className="font-semibold text-gray-900">{item.title}</p>
                                        <p className="text-sm text-gray-600">{item.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <p className="text-blue-800">
                                <strong>Como exercer seus direitos:</strong> Entre em contato com a administração do seu condomínio ou através do nosso WhatsApp oficial (21) 96553-2247. Prazo de resposta: até 15 dias úteis.
                            </p>
                        </div>
                    </section>

                    {/* Segurança */}
                    <section>
                        <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <Lock className="h-6 w-6 text-amber-600" />
                            4. Segurança dos Dados
                        </h2>

                        <div className="grid md:grid-cols-2 gap-6">
                            <div>
                                <h3 className="font-bold text-gray-900 mb-3">Medidas Técnicas</h3>
                                <ul className="space-y-2 text-gray-700">
                                    <li className="flex items-center gap-2">
                                        <span className="text-emerald-600">✓</span>
                                        Criptografia em trânsito (HTTPS/TLS)
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <span className="text-emerald-600">✓</span>
                                        Criptografia em repouso (AES-256)
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <span className="text-emerald-600">✓</span>
                                        Row Level Security (RLS)
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <span className="text-emerald-600">✓</span>
                                        Backups automáticos diários
                                    </li>
                                </ul>
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-900 mb-3">Medidas Administrativas</h3>
                                <ul className="space-y-2 text-gray-700">
                                    <li className="flex items-center gap-2">
                                        <span className="text-emerald-600">✓</span>
                                        Acesso restrito (need-to-know)
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <span className="text-emerald-600">✓</span>
                                        Política de senhas fortes
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <span className="text-emerald-600">✓</span>
                                        Contratos com operadores
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <span className="text-emerald-600">✓</span>
                                        Monitoramento de acessos
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </section>

                    {/* Retenção */}
                    <section>
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Retenção de Dados</h2>

                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Tipo de Dado</th>
                                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Período</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    <tr>
                                        <td className="px-4 py-3 text-gray-700">Dados de conta ativa</td>
                                        <td className="px-4 py-3 text-gray-700">Durante vigência do contrato</td>
                                    </tr>
                                    <tr>
                                        <td className="px-4 py-3 text-gray-700">Dados após cancelamento</td>
                                        <td className="px-4 py-3 text-gray-700">5 anos (obrigações fiscais)</td>
                                    </tr>
                                    <tr>
                                        <td className="px-4 py-3 text-gray-700">Logs de acesso</td>
                                        <td className="px-4 py-3 text-gray-700">6 meses</td>
                                    </tr>
                                    <tr>
                                        <td className="px-4 py-3 text-gray-700">Dados de visitantes</td>
                                        <td className="px-4 py-3 text-gray-700">2 anos (segurança)</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </section>

                    {/* Contato */}
                    <section className="bg-gray-50 rounded-xl p-6">
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Contato e DPO</h2>

                        <div className="grid md:grid-cols-2 gap-6">
                            <div>
                                <h3 className="font-bold text-gray-900 mb-3">Encarregado de Dados (DPO)</h3>
                                <div className="flex items-center gap-2 text-gray-700">
                                    <Phone className="h-4 w-4" />
                                    <span>(21) 96553-2247</span>
                                </div>
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-900 mb-3">Contato Geral</h3>
                                <div className="space-y-2 text-gray-700">
                                    <div className="flex items-center gap-2">
                                        <Phone className="h-4 w-4" />
                                        <span>(21) 96553-2247</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="mt-6 pt-6 border-t border-gray-200 text-sm text-gray-500">
                            <p><strong>CNPJ:</strong> 57.444.727/0001-85</p>
                            <p><strong>Foro:</strong> Comarca do Rio de Janeiro/RJ</p>
                        </div>
                    </section>

                </div>

                {/* Links */}
                <div className="mt-8 flex flex-wrap justify-center gap-4 text-sm">
                    <Link href="/termos" className="text-gray-600 hover:text-emerald-600">
                        Termos de Uso
                    </Link>
                    <span className="text-gray-300">|</span>
                    <Link href="/privacidade" className="text-gray-600 hover:text-emerald-600">
                        Política de Privacidade
                    </Link>
                    <span className="text-gray-300">|</span>
                    <Link href="/contrato" className="text-gray-600 hover:text-emerald-600">
                        Contrato de Prestação
                    </Link>
                    <span className="text-gray-300">|</span>
                    <Link href="/landing" className="text-gray-600 hover:text-emerald-600">
                        Voltar ao Site
                    </Link>
                </div>
            </main>

            {/* Footer */}
            <footer className="bg-gray-900 text-gray-400 py-8 mt-12">
                <div className="max-w-4xl mx-auto px-4 text-center text-sm">
                    <p>© {new Date().getFullYear()} Meu Condomínio Fácil. Todos os direitos reservados.</p>
                    <p className="mt-1">CNPJ: 57.444.727/0001-85</p>
                </div>
            </footer>
        </div>
    );
}
