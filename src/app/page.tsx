import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { Building2, CheckCircle, ArrowRight, Shield, CreditCard, MessageSquare, Package, Smartphone, Users } from 'lucide-react';

export const metadata = {
  title: 'Meu Condomínio Fácil - Gestão simples para seu condomínio',
  description: 'Sistema simples para síndico que resolve cobrança, portaria e comunicação sem complicação. PIX, boletos, avisos, reservas, portaria e app no celular.',
};

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Se usuário logado, vai para dashboard
  if (user) {
    redirect('/dashboard');
  }

  // Homepage comercial para visitantes
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 bg-white/95 backdrop-blur z-50 border-b">
        <div className="max-w-6xl mx-auto px-4 flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-lg flex items-center justify-center">
              <Building2 className="h-5 w-5 text-white" />
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-[10px] text-emerald-500 italic font-medium -mb-0.5">Meu</span>
              <span className="font-bold text-gray-900">Condomínio Fácil</span>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-6 text-sm">
            <Link href="/sobre" className="text-gray-600 hover:text-emerald-600">Quem Somos</Link>
            <Link href="/casos" className="text-gray-600 hover:text-emerald-600">Casos de Sucesso</Link>
            <Link href="/landing#funcionalidades" className="text-gray-600 hover:text-emerald-600">Funcionalidades</Link>
            <Link href="/landing#planos" className="text-gray-600 hover:text-emerald-600">Planos</Link>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-gray-600 hover:text-emerald-600 font-medium text-sm">
              Entrar
            </Link>
            <Link href="/register" className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 font-medium text-sm">
              Teste Grátis
            </Link>
          </div>
        </div>
      </header>

      {/* Hero - Foco em BENEFÍCIO */}
      <section className="pt-28 pb-20 bg-gradient-to-b from-emerald-50 to-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-3xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight">
            Sistema simples para síndico que resolve <span className="text-emerald-600">cobrança, portaria e comunicação</span> sem complicação
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            PIX, boletos, avisos, reservas, portaria e app no celular.
            <br className="hidden sm:block" />
            <strong>Ideal para condomínios de 20 a 200 unidades.</strong>
          </p>

          {/* Promessas claras */}
          <div className="flex flex-wrap justify-center gap-4 mb-8">
            <span className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-sm text-sm font-medium text-gray-700">
              <CheckCircle className="h-4 w-4 text-emerald-500" /> Menos inadimplência
            </span>
            <span className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-sm text-sm font-medium text-gray-700">
              <CheckCircle className="h-4 w-4 text-emerald-500" /> Menos reclamação
            </span>
            <span className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-sm text-sm font-medium text-gray-700">
              <CheckCircle className="h-4 w-4 text-emerald-500" /> Menos papel
            </span>
            <span className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-sm text-sm font-medium text-gray-700">
              <CheckCircle className="h-4 w-4 text-emerald-500" /> Mais controle
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/register"
              className="bg-emerald-600 text-white px-8 py-4 rounded-xl hover:bg-emerald-700 font-semibold text-lg flex items-center gap-2 shadow-lg shadow-emerald-200"
            >
              Começar teste grátis <ArrowRight className="h-5 w-5" />
            </Link>
            <span className="text-sm text-gray-500">7 dias grátis · Sem cartão · Cancele quando quiser</span>
          </div>
        </div>
      </section>

      {/* Diferenciais - O que nos torna diferentes */}
      <section className="py-16 bg-white border-y">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">Por que síndicos escolhem o Meu Condomínio Fácil?</h2>
          <div className="grid md:grid-cols-4 gap-6">
            <div className="text-center p-4">
              <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                <Shield className="h-6 w-6 text-emerald-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">Sem contrato longo</h3>
              <p className="text-sm text-gray-600">Cancele quando quiser. Seus dados são exportados.</p>
            </div>
            <div className="text-center p-4">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                <Building2 className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">Não depende de administradora</h3>
              <p className="text-sm text-gray-600">O sistema é do condomínio, não da empresa.</p>
            </div>
            <div className="text-center p-4">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                <MessageSquare className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">WhatsApp e e-mail próprios</h3>
              <p className="text-sm text-gray-600">Comunicação sai do seu condomínio, não da plataforma.</p>
            </div>
            <div className="text-center p-4">
              <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                <Users className="h-6 w-6 text-amber-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">Adapta ao seu jeito</h3>
              <p className="text-sm text-gray-600">Flexível para a realidade de cada condomínio.</p>
            </div>
          </div>
        </div>
      </section>

      {/* O que está incluso */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-gray-900 mb-2 text-center">O que você ganha</h2>
          <p className="text-gray-600 text-center mb-10">Tudo que um síndico precisa, sem complicação</p>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <CreditCard className="h-8 w-8 text-emerald-600 mb-3" />
              <h3 className="font-semibold text-gray-900 mb-2">Gestão Financeira</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>✓ Cobrança mensal por PIX ou boleto</li>
                <li>✓ Envio automático por e-mail</li>
                <li>✓ Controle de quem pagou</li>
              </ul>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm">
              <MessageSquare className="h-8 w-8 text-blue-600 mb-3" />
              <h3 className="font-semibold text-gray-900 mb-2">Comunicação</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>✓ Avisos no app</li>
                <li>✓ Notificações automáticas</li>
                <li>✓ Chat direto com moradores</li>
              </ul>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm">
              <Package className="h-8 w-8 text-purple-600 mb-3" />
              <h3 className="font-semibold text-gray-900 mb-2">Portaria e Encomendas</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>✓ Registro de visitantes</li>
                <li>✓ Controle de encomendas</li>
                <li>✓ Notificação ao morador</li>
              </ul>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm">
              <Smartphone className="h-8 w-8 text-amber-600 mb-3" />
              <h3 className="font-semibold text-gray-900 mb-2">App no Celular</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>✓ Síndico, morador e porteiro</li>
                <li>✓ Android e iOS</li>
                <li>✓ Cada um vê só o que precisa</li>
              </ul>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm">
              <Shield className="h-8 w-8 text-red-600 mb-3" />
              <h3 className="font-semibold text-gray-900 mb-2">Segurança e LGPD</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>✓ Acesso por perfil</li>
                <li>✓ Histórico de ações</li>
                <li>✓ Dados protegidos</li>
              </ul>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border-2 border-emerald-200">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-2xl">🎁</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Bônus: Suporte Humano</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>✓ Atendimento real, não robô</li>
                <li>✓ Resposta rápida</li>
                <li>✓ Ajuda na implantação</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Preços simples */}
      <section className="py-16 bg-white">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Preço transparente</h2>
          <p className="text-gray-600 mb-8">Sem taxas escondidas, sem surpresas</p>

          <div className="bg-emerald-50 rounded-2xl p-8 border border-emerald-200">
            <div className="flex flex-col md:flex-row justify-center items-center gap-8">
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-1">Implantação (uma vez)</p>
                <p className="text-3xl font-bold text-gray-900">R$ 997</p>
              </div>
              <div className="hidden md:block w-px h-16 bg-emerald-300"></div>
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-1">Mensalidade</p>
                <p className="text-3xl font-bold text-emerald-600">A partir de R$ 149</p>
                <p className="text-xs text-gray-500">Até 20 unidades</p>
              </div>
            </div>

            {/* Implantação inclui */}
            <div className="mt-6 pt-6 border-t border-emerald-200">
              <p className="text-sm font-semibold text-emerald-800 mb-3">A implantação inclui:</p>
              <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-gray-700">
                <span className="flex items-center gap-1"><CheckCircle className="h-4 w-4 text-emerald-500" /> Configuração completa</span>
                <span className="flex items-center gap-1"><CheckCircle className="h-4 w-4 text-emerald-500" /> Cadastro inicial</span>
                <span className="flex items-center gap-1"><CheckCircle className="h-4 w-4 text-emerald-500" /> Integração PIX e e-mail</span>
                <span className="flex items-center gap-1"><CheckCircle className="h-4 w-4 text-emerald-500" /> Treinamento do síndico</span>
                <span className="flex items-center gap-1"><CheckCircle className="h-4 w-4 text-emerald-500" /> Sistema rodando em 48h</span>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-emerald-200">
              <Link
                href="/landing#planos"
                className="text-emerald-600 hover:text-emerald-700 font-medium"
              >
                Ver todos os planos →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Depoimentos */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-gray-900 mb-2 text-center">O que síndicos estão dizendo</h2>
          <p className="text-gray-600 text-center mb-10">Histórias reais de quem já simplificou a gestão</p>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <div className="flex items-center gap-1 text-amber-400 mb-3">
                <span>★★★★★</span>
              </div>
              <p className="text-gray-700 mb-4 italic">
                "Antes eu passava 2 horas por semana cobrando moradores. Agora o PIX cai automático e eu só acompanho."</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                  <span className="text-emerald-600 font-bold">JS</span>
                </div>
                <div>
                  <p className="font-medium text-gray-900">João Silva</p>
                  <p className="text-xs text-gray-500">Síndico há 3 anos • SP</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm">
              <div className="flex items-center gap-1 text-amber-400 mb-3">
                <span>★★★★★</span>
              </div>
              <p className="text-gray-700 mb-4 italic">
                "O porteiro consegue usar sozinho. Registro de visitante virou rápido e organizado. Moradores elogiam."</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 font-bold">MC</span>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Maria Costa</p>
                  <p className="text-xs text-gray-500">Síndica há 2 anos • RJ</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm">
              <div className="flex items-center gap-1 text-amber-400 mb-3">
                <span>★★★★★</span>
              </div>
              <p className="text-gray-700 mb-4 italic">
                "Finalmente um sistema que não depende de administradora. Mudo de plano quando quiser e os dados são meus."</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                  <span className="text-purple-600 font-bold">RF</span>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Roberto Ferreira</p>
                  <p className="text-xs text-gray-500">Síndico há 5 anos • MG</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-16 bg-emerald-600">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Pronto para ter menos dor de cabeça?
          </h2>
          <p className="text-emerald-100 mb-8">
            Teste grátis por 7 dias. Sem cartão. Cancele quando quiser.
          </p>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 bg-white text-emerald-600 px-8 py-4 rounded-xl font-semibold text-lg hover:bg-gray-100 shadow-lg"
          >
            Começar teste grátis <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 bg-gray-900">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-4">
              <Link href="/sobre" className="text-gray-400 hover:text-white text-sm">Quem Somos</Link>
              <Link href="/termos" className="text-gray-400 hover:text-white text-sm">Termos</Link>
              <Link href="/privacidade" className="text-gray-400 hover:text-white text-sm">Privacidade</Link>
            </div>
            <p className="text-gray-500 text-sm">
              © 2025 Meu Condomínio Fácil · CNPJ 57.444.727/0001-85
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
