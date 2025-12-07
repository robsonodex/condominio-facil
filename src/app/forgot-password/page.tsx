'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Building2, Mail, ArrowLeft } from 'lucide-react';
import { Button, Input } from '@/components/ui';
import { useAuth } from '@/hooks/useAuth';

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);
    const [error, setError] = useState('');

    const { resetPassword } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const { error } = await resetPassword(email);

        if (error) {
            setError('Erro ao enviar email. Verifique o endereço.');
        } else {
            setSent(true);
        }
        setLoading(false);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-emerald-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                {/* Logo */}
                <div className="flex justify-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-200">
                        <Building2 className="h-9 w-9 text-white" />
                    </div>
                </div>
                <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
                    Recuperar senha
                </h2>
                <p className="mt-2 text-center text-sm text-gray-600">
                    Enviaremos um link para redefinir sua senha
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-4 shadow-xl shadow-gray-200/50 rounded-2xl sm:px-10 border border-gray-100">
                    {sent ? (
                        <div className="text-center py-6">
                            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Mail className="h-8 w-8 text-emerald-600" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                Email enviado!
                            </h3>
                            <p className="text-gray-600 mb-6">
                                Se existe uma conta com o email <strong>{email}</strong>, você receberá um link para redefinir sua senha.
                            </p>
                            <Link href="/login">
                                <Button variant="outline" className="w-full">
                                    <ArrowLeft className="mr-2 h-4 w-4" />
                                    Voltar ao login
                                </Button>
                            </Link>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {error && (
                                <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg">
                                    {error}
                                </div>
                            )}

                            <Input
                                label="Email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="seu@email.com"
                                required
                            />

                            <Button type="submit" className="w-full" loading={loading}>
                                Enviar link de recuperação
                            </Button>

                            <Link href="/login">
                                <Button variant="ghost" className="w-full">
                                    <ArrowLeft className="mr-2 h-4 w-4" />
                                    Voltar ao login
                                </Button>
                            </Link>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
