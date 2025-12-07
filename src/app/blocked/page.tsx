'use client';

import Link from 'next/link';
import { AlertTriangle, CreditCard, Phone, Mail } from 'lucide-react';
import { Button } from '@/components/ui';

export default function BlockedPage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
                {/* Icon */}
                <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <AlertTriangle className="h-10 w-10 text-red-600" />
                </div>

                {/* Title */}
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                    Acesso Bloqueado
                </h1>
                <p className="text-gray-600 mb-6">
                    Sua assinatura está em atraso e o acesso ao sistema foi temporariamente suspenso.
                </p>

                {/* Info Box */}
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-left">
                    <h3 className="font-semibold text-red-800 mb-2">Por que isso aconteceu?</h3>
                    <p className="text-sm text-red-700">
                        Identificamos que há faturas em aberto há mais de 10 dias.
                        Para proteger os dados do seu condomínio, suspendemos temporariamente o acesso.
                    </p>
                </div>

                {/* Action Button */}
                <Link href="/assinatura">
                    <Button className="w-full mb-4" size="lg">
                        <CreditCard className="h-5 w-5 mr-2" />
                        Regularizar Pagamento
                    </Button>
                </Link>

                {/* Alternative Actions */}
                <p className="text-sm text-gray-500 mb-4">
                    Após o pagamento, seu acesso será liberado automaticamente em até 5 minutos.
                </p>

                {/* Contact Info */}
                <div className="border-t pt-4 mt-4">
                    <p className="text-sm text-gray-600 mb-3">Precisa de ajuda?</p>
                    <div className="flex justify-center gap-4">
                        <a
                            href="mailto:suporte@condominiofacil.com.br"
                            className="flex items-center gap-1 text-sm text-emerald-600 hover:underline"
                        >
                            <Mail className="h-4 w-4" />
                            suporte@condominiofacil.com.br
                        </a>
                    </div>
                </div>

                {/* Logout */}
                <div className="mt-6">
                    <Link href="/login" className="text-sm text-gray-500 hover:underline">
                        Sair e fazer login com outra conta
                    </Link>
                </div>
            </div>
        </div>
    );
}
