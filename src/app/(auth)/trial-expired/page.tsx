import { Button } from '@/components/ui/button';
import { Clock, ShieldAlert } from 'lucide-react';
import Link from 'next/link';

export default function TrialExpiredPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center border border-gray-200">
                <div className="bg-red-100 p-4 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
                    <Clock className="w-10 h-10 text-red-600" />
                </div>

                <h1 className="text-3xl font-bold text-gray-900 mb-2">Seu período de teste expirou</h1>
                <p className="text-gray-600 mb-8">
                    Esperamos que você tenha aproveitado a experiência no <strong>Condomínio Fácil</strong>.
                    Para continuar acessando suas unidades, moradores e finanças, escolha um de nossos planos.
                </p>

                <div className="space-y-4">
                    <Button asChild className="w-full text-lg py-6 bg-blue-600 hover:bg-blue-700">
                        <Link href="/assinatura">Ver Planos e Assinar</Link>
                    </Button>
                    <Button asChild variant="ghost" className="w-full text-gray-500">
                        <Link href="/suporte">Falar com um consultor</Link>
                    </Button>
                </div>

                <div className="mt-8 flex items-center justify-center gap-2 text-sm text-gray-400">
                    <ShieldAlert className="w-4 h-4" />
                    <span>Seus dados estarão seguros por 30 dias</span>
                </div>
            </div>
        </div>
    );
}
