'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Building2, Mail, Lock, ArrowRight, Sparkles, CheckCircle, Loader2 } from 'lucide-react';
import { Button, Input } from '@/components/ui';
import { useAuth } from '@/hooks/useAuth';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const { signIn, user, loading: authLoading } = useAuth();
    const router = useRouter();

    // Redirect if already logged in
    useEffect(() => {
        if (!authLoading && user) {
            router.replace('/dashboard');
        }
    }, [authLoading, user, router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            // Use client-side signIn which properly updates auth state
            const { error: signInError } = await signIn(email, password);

            if (signInError) {
                setError(signInError.message || 'Email ou senha inválidos');
                setLoading(false);
                return;
            }

            // Auth state change will trigger redirect via useEffect above
            // But also force redirect after successful login
            router.push('/dashboard');
        } catch (err: any) {
            console.error('Login error:', err);
            setError('Erro ao fazer login. Tente novamente.');
            setLoading(false);
        }
    };

    // Show loading while checking auth
    if (authLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-emerald-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-200 mx-auto mb-4">
                        <Loader2 className="h-9 w-9 text-white animate-spin" />
                    </div>
                    <p className="text-gray-600">Verificando sessão...</p>
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
                <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
                    <span
                        className="text-lg text-emerald-500 italic font-medium block"
                        style={{ transform: 'rotate(-8deg)', marginBottom: '-8px', marginLeft: '20px' }}
                    >
                        Meu
                    </span>
                    Condomínio Fácil
                </h2>
                <p className="mt-2 text-center text-sm text-gray-600">
                    Gestão simples para o seu condomínio
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
                    </form>

                    <p className="mt-6 text-center text-sm text-gray-500">
                        Não tem uma conta?{' '}
                        <Link
                            href="/register"
                            className="font-medium text-emerald-600 hover:text-emerald-700"
                        >
                            Cadastre-se
                        </Link>
                    </p>

                    {/* Demo Mode Button */}
                    <div className="mt-6 pt-6 border-t border-gray-200">
                        <p className="text-center text-xs text-gray-400 mb-3">
                            Quer conhecer o sistema?
                        </p>
                        <Button
                            type="button"
                            variant="outline"
                            className="w-full border-amber-300 text-amber-600 hover:bg-amber-50"
                            loading={loading}
                            onClick={async () => {
                                setLoading(true);
                                setError('');
                                try {
                                    // Primeiro, garantir que o ambiente demo existe
                                    const setupRes = await fetch('/api/demo/setup', { method: 'POST' });
                                    const setupData = await setupRes.json();

                                    if (!setupRes.ok) {
                                        setError(setupData.error || 'Erro ao configurar demo');
                                        setLoading(false);
                                        return;
                                    }

                                    // Agora fazer login
                                    const { error: signInError } = await signIn(
                                        'sindico.demo@condofacil.com',
                                        'demo123456'
                                    );

                                    if (signInError) {
                                        setError('Erro ao entrar no demo: ' + signInError.message);
                                        setLoading(false);
                                        return;
                                    }

                                    router.push('/dashboard');
                                } catch (err: any) {
                                    setError('Erro: ' + err.message);
                                    setLoading(false);
                                }
                            }}
                        >
                            🎯 Entrar como Síndico DEMO
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
