'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, Building2, Mail, Lock, ArrowRight, Loader2 } from 'lucide-react';
import { trackEvent } from '@/components/shared/Analytics';

export const dynamic = 'force-dynamic';

function SuccessContent() {
    const searchParams = useSearchParams();
    const paymentId = searchParams?.get('payment_id');
    const [email, setEmail] = useState('');

    useEffect(() => {
        trackEvent('purchase', {
            transaction_id: paymentId,
            currency: 'BRL',
        });

        const storedEmail = localStorage.getItem('checkout_email');
        if (storedEmail) {
            setEmail(storedEmail);
        }
    }, [paymentId]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-blue-50 flex items-center justify-center py-12 px-4">
            <div className="max-w-2xl w-full">
                <div className="bg-white rounded-2xl shadow-2xl p-8 md:p-12 text-center">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-emerald-100 rounded-full mb-6">
                        <CheckCircle className="h-12 w-12 text-emerald-600" />
                    </div>

                    <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                        Pagamento Confirmado! 🎉
                    </h1>

                    <p className="text-lg text-gray-600 mb-8">
                        Sua conta foi criada com sucesso e você já pode começar a usar o sistema.
                    </p>

                    <div className="grid md:grid-cols-2 gap-4 mb-8 text-left">
                        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6">
                            <div className="flex items-center gap-3 mb-3">
                                <Mail className="h-6 w-6 text-emerald-600" />
                                <h3 className="font-semibold text-gray-900">Email de Boas-Vindas</h3>
                            </div>
                            <p className="text-sm text-gray-700">
                                Enviamos suas credenciais de acesso para{' '}
                                <span className="font-semibold">{email || 'seu email'}</span>.
                                Verifique sua caixa de entrada (e spam).
                            </p>
                        </div>

                        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                            <div className="flex items-center gap-3 mb-3">
                                <Lock className="h-6 w-6 text-blue-600" />
                                <h3 className="font-semibold text-gray-900">Primeiro Acesso</h3>
                            </div>
                            <p className="text-sm text-gray-700">
                                Use o email e a senha temporária que enviamos.
                                Recomendamos alterar a senha no primeiro acesso.
                            </p>
                        </div>
                    </div>

                    <div className="bg-gray-50 rounded-xl p-6 mb-8 text-left">
                        <h3 className="font-semibold text-gray-900 mb-4">Próximos Passos:</h3>
                        <ol className="space-y-3 text-sm text-gray-700">
                            <li className="flex items-start gap-3">
                                <span className="flex-shrink-0 w-6 h-6 bg-emerald-600 text-white rounded-full flex items-center justify-center text-xs font-bold">1</span>
                                <span>Verifique seu email e anote suas credenciais de acesso</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <span className="flex-shrink-0 w-6 h-6 bg-emerald-600 text-white rounded-full flex items-center justify-center text-xs font-bold">2</span>
                                <span>Faça login no sistema e complete o cadastro do seu condomínio</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <span className="flex-shrink-0 w-6 h-6 bg-emerald-600 text-white rounded-full flex items-center justify-center text-xs font-bold">3</span>
                                <span>Cadastre as unidades e moradores do condomínio</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <span className="flex-shrink-0 w-6 h-6 bg-emerald-600 text-white rounded-full flex items-center justify-center text-xs font-bold">4</span>
                                <span>Comece a usar todas as funcionalidades!</span>
                            </li>
                        </ol>
                    </div>

                    <Link
                        href="/login"
                        className="inline-flex items-center gap-2 bg-emerald-600 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-emerald-700 transition-all shadow-lg hover:shadow-xl hover:scale-105"
                    >
                        <Building2 className="h-5 w-5" />
                        Acessar o Sistema
                        <ArrowRight className="h-5 w-5" />
                    </Link>

                    <p className="mt-8 text-sm text-gray-500">
                        Precisa de ajuda?{' '}
                        <a href="mailto:contato@meucondominiofacil.com" className="text-emerald-600 hover:underline font-medium">
                            Entre em contato
                        </a>
                    </p>

                    {paymentId && (
                        <p className="mt-4 text-xs text-gray-400">
                            ID do Pagamento: {paymentId}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function SuccessPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-blue-50 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
            </div>
        }>
            <SuccessContent />
        </Suspense>
    );
}
