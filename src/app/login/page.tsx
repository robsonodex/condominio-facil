'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Building2, Mail, Lock, ArrowRight, Sparkles, CheckCircle, Loader2 } from 'lucide-react';
import { Button, Input } from '@/components/ui';
import { useAuth } from '@/hooks/useAuth';

function LoginContent() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [magicLinkSent, setMagicLinkSent] = useState(false);
    const [error, setError] = useState('');
    const [showMagicLink, setShowMagicLink] = useState(false);
    const [confirmed, setConfirmed] = useState(false);

    const { signIn, signInWithMagicLink } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();

    useEffect(() => {
        if (searchParams.get('confirmed') === 'true') {
            setConfirmed(true);
        }
    }, [searchParams]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const { error } = await signIn(email, password);


        if (error) {
            setError('Email ou senha inválidos');
            setLoading(false);
        } else {
            // Redirect direto sem usar router
            window.location.href = '/dashboard';
        }
    };

    const handleMagicLink = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const { error } = await signInWithMagicLink(email);

        if (error) {
            setError('Erro ao enviar link. Verifique o email.');
        } else {
            setMagicLinkSent(true);
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
                    Condomínio Fácil
                </h2>
                <p className="mt-2 text-center text-sm text-gray-600">
                    Gestão simples para o seu condomínio
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-4 shadow-xl shadow-gray-200/50 rounded-2xl sm:px-10 border border-gray-100">
                    {magicLinkSent ? (
                        <div className="text-center py-6">
                            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Mail className="h-8 w-8 text-emerald-600" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                Verifique seu email
                            </h3>
                            <p className="text-gray-600 mb-6">
                                Enviamos um link de acesso para <strong>{email}</strong>
                            </p>
                            <Button
                                variant="ghost"
                                onClick={() => setMagicLinkSent(false)}
                            >
                                Voltar ao login
                            </Button>
                        </div>
                    ) : showMagicLink ? (
                        <form onSubmit={handleMagicLink} className="space-y-6">
                            <div className="text-center mb-6">
                                <Sparkles className="h-8 w-8 text-emerald-600 mx-auto mb-2" />
                                <h3 className="text-lg font-semibold text-gray-900">
                                    Link Mágico
                                </h3>
                                <p className="text-sm text-gray-500">
                                    Enviaremos um link de acesso para o seu email
                                </p>
                            </div>

                            <Input
                                label="Email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="seu@email.com"
                                required
                                error={error}
                            />

                            <Button type="submit" className="w-full" loading={loading}>
                                Enviar link mágico
                            </Button>

                            <Button
                                type="button"
                                variant="ghost"
                                className="w-full"
                                onClick={() => setShowMagicLink(false)}
                            >
                                Voltar ao login com senha
                            </Button>
                        </form>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {confirmed && (
                                <div className="bg-emerald-50 text-emerald-700 text-sm p-3 rounded-lg flex items-center gap-2">
                                    <CheckCircle className="h-4 w-4" />
                                    Email confirmado com sucesso! Faça login para continuar.
                                </div>
                            )}

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

                            <div>
                                <Input
                                    label="Senha"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    required
                                />
                                <div className="mt-2 text-right">
                                    <Link
                                        href="/forgot-password"
                                        className="text-sm text-emerald-600 hover:text-emerald-700"
                                    >
                                        Esqueceu a senha?
                                    </Link>
                                </div>
                            </div>

                            <Button type="submit" className="w-full" loading={loading}>
                                Entrar
                                <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>

                            <div className="relative">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-gray-200" />
                                </div>
                                <div className="relative flex justify-center text-sm">
                                    <span className="px-2 bg-white text-gray-500">ou</span>
                                </div>
                            </div>

                            <Button
                                type="button"
                                variant="outline"
                                className="w-full"
                                onClick={() => setShowMagicLink(true)}
                            >
                                <Mail className="mr-2 h-4 w-4" />
                                Entrar com link mágico
                            </Button>
                        </form>
                    )}

                    {!magicLinkSent && (
                        <p className="mt-6 text-center text-sm text-gray-500">
                            Não tem uma conta?{' '}
                            <Link
                                href="/register"
                                className="font-medium text-emerald-600 hover:text-emerald-700"
                            >
                                Cadastre-se
                            </Link>
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}

function LoadingFallback() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-emerald-50 flex items-center justify-center">
            <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-200 mx-auto mb-4">
                    <Loader2 className="h-9 w-9 text-white animate-spin" />
                </div>
                <p className="text-gray-600">Carregando...</p>
            </div>
        </div>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={<LoadingFallback />}>
            <LoginContent />
        </Suspense>
    );
}
