'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Building2, Lock, Loader2, CheckCircle } from 'lucide-react';
import { Button, Input } from '@/components/ui';
import { createClient } from '@/lib/supabase/client';

function ResetPasswordContent() {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [checking, setChecking] = useState(true);
    const [validSession, setValidSession] = useState(false);

    const router = useRouter();
    const searchParams = useSearchParams();
    const supabase = createClient();

    useEffect(() => {
        let mounted = true;

        const checkSession = async () => {
            try {
                const code = searchParams.get('code');

                if (code) {
                    const { error } = await supabase.auth.exchangeCodeForSession(code);

                    if (!error && mounted) {
                        setValidSession(true);
                        setChecking(false);
                        return;
                    }
                }

                const { data: { session } } = await supabase.auth.getSession();
                if (session && mounted) {
                    setValidSession(true);
                }
            } catch (err) {
                console.error('Session check error:', err);
            } finally {
                if (mounted) {
                    setChecking(false);
                }
            }
        };

        const timeout = setTimeout(() => {
            if (mounted) {
                setChecking(false);
            }
        }, 10000);

        checkSession();

        return () => {
            mounted = false;
            clearTimeout(timeout);
        };
    }, [supabase.auth, searchParams]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (password !== confirmPassword) {
            setError('As senhas não coincidem');
            return;
        }

        if (password.length < 6) {
            setError('A senha deve ter pelo menos 6 caracteres');
            return;
        }

        setLoading(true);

        const { error } = await supabase.auth.updateUser({
            password: password,
        });

        if (error) {
            setError(error.message);
            setLoading(false);
        } else {
            setSuccess(true);
            setTimeout(() => {
                router.push('/login');
            }, 3000);
        }
    };

    if (checking) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-emerald-50 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin text-emerald-600 mx-auto mb-4" />
                    <p className="text-gray-600">Verificando link...</p>
                </div>
            </div>
        );
    }

    if (!validSession) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-emerald-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
                <div className="sm:mx-auto sm:w-full sm:max-w-md">
                    <div className="flex justify-center">
                        <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-red-700 rounded-2xl flex items-center justify-center shadow-lg">
                            <Lock className="h-9 w-9 text-white" />
                        </div>
                    </div>
                    <h2 className="mt-6 text-center text-2xl font-bold text-gray-900">
                        Link expirado ou inválido
                    </h2>
                    <p className="mt-2 text-center text-sm text-gray-600">
                        O link de redefinição de senha expirou ou é inválido.
                    </p>
                    <div className="mt-6 text-center">
                        <Button onClick={() => router.push('/forgot-password')}>
                            Solicitar novo link
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    if (success) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-emerald-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
                <div className="sm:mx-auto sm:w-full sm:max-w-md">
                    <div className="flex justify-center">
                        <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-200">
                            <CheckCircle className="h-9 w-9 text-white" />
                        </div>
                    </div>
                    <h2 className="mt-6 text-center text-2xl font-bold text-gray-900">
                        Senha alterada com sucesso!
                    </h2>
                    <p className="mt-2 text-center text-sm text-gray-600">
                        Redirecionando para o login...
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-emerald-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <div className="flex justify-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-200">
                        <Building2 className="h-9 w-9 text-white" />
                    </div>
                </div>
                <h2 className="mt-6 text-center text-2xl font-bold tracking-tight text-gray-900">
                    Nova Senha
                </h2>
                <p className="mt-2 text-center text-sm text-gray-600">
                    Digite sua nova senha abaixo
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-4 shadow-xl shadow-gray-200/50 rounded-2xl sm:px-10 border border-gray-100">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {error && (
                            <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg">
                                {error}
                            </div>
                        )}

                        <Input
                            label="Nova Senha"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            required
                        />

                        <Input
                            label="Confirmar Senha"
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="••••••••"
                            required
                        />

                        <Button type="submit" className="w-full" loading={loading}>
                            Alterar Senha
                        </Button>
                    </form>
                </div>
            </div>
        </div>
    );
}

function LoadingFallback() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-emerald-50 flex items-center justify-center">
            <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin text-emerald-600 mx-auto mb-4" />
                <p className="text-gray-600">Carregando...</p>
            </div>
        </div>
    );
}

export default function ResetPasswordPage() {
    return (
        <Suspense fallback={<LoadingFallback />}>
            <ResetPasswordContent />
        </Suspense>
    );
}
